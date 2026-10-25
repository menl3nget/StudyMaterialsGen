import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: Generate Complete Study Materials (Summary, Flashcards, Quiz)
app.post('/api/generate-study-materials', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, title, options, file } = req.body;

    if (!text && !file) {
      res.status(400).json({ error: 'Please provide either text content or an uploaded document.' });
      return;
    }

    const depth = options?.depth || 'comprehensive';
    const cardTarget = Number(options?.cardCount) || 12;
    const quizTarget = Number(options?.quizCount) || 8;
    const difficultyLevel = options?.difficulty || 'Intermediate';

    const systemInstruction = `You are a world-class cognitive educator and instructional designer.
Your task is to analyze study materials (lecture notes, textbook chapters, slides, or documents) and generate rigorous, highly engaging, and structured study materials tailored specifically to the uploaded content.
The output MUST be authentic, accurate, and avoid generic filler.
1. Executive Summary & Structured Breakdown: Distill core concepts, key takeaways, an outline with logical sections, and a precise glossary of domain terms.
2. Flashcards: Generate approximately ${cardTarget} flashcards covering foundational, conceptual, and application aspects. Make the question/front crisp and the back clear, complete, and memorable. Include a subtle hint.
3. Practice Quiz: Generate approximately ${quizTarget} questions (a mix of high-yield multiple-choice and true-false). Provide 4 plausible options for multiple-choice questions, the exact matching correctAnswer, a thorough explanation justifying why the answer is correct and why other choices are misconceptions, and the associated topic.`;

    const promptText = `Analyze the provided material and generate the complete study package.
Target Difficulty: ${difficultyLevel}
Depth Level: ${depth}
Flashcard Count: ${cardTarget}
Quiz Question Count: ${quizTarget}
${title ? `User-specified Topic/Title: "${title}"` : ''}

${text ? `Source Material Text:\n${text}` : 'Please extract and analyze the content from the attached document.'}`;

    const parts: any[] = [];
    if (file && file.data && file.mimeType) {
      parts.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType,
        },
      });
    }
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts.length === 1 ? parts[0].text : { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Clear academic or module title' },
            subject: { type: Type.STRING, description: 'Academic discipline e.g. Biology, Law, History, Computer Science' },
            difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
            estimatedReadTimeMinutes: { type: Type.INTEGER, description: 'Estimated minutes to study the source module' },
            keyTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-6 core topics or sub-units covered in this material',
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING, description: '2-3 paragraph comprehensive conceptual synthesis' },
                keyTakeaways: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '5-8 high-yield key takeaways',
                },
                structuredOutline: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      sectionTitle: { type: Type.STRING },
                      keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                      subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['sectionTitle', 'keyPoints'],
                  },
                },
                glossary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                      context: { type: Type.STRING },
                    },
                    required: ['term', 'definition'],
                  },
                },
                realWorldApplications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3-5 practical, real-world applications or case examples',
                },
              },
              required: ['executiveSummary', 'keyTakeaways', 'structuredOutline', 'glossary', 'realWorldApplications'],
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: 'Question or concept prompt' },
                  back: { type: Type.STRING, description: 'Clear comprehensive answer or explanation' },
                  category: { type: Type.STRING, description: 'Subtopic or concept category' },
                  hint: { type: Type.STRING, description: 'Brief memory hook or directional clue' },
                  difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                },
                required: ['front', 'back', 'category'],
              },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['multiple-choice', 'true-false'] },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Array of choices (4 options for multiple-choice, ["True", "False"] for true-false)',
                  },
                  correctAnswer: { type: Type.STRING, description: 'Must match one of the items in options exactly' },
                  explanation: { type: Type.STRING, description: 'Detailed reasoning behind the correct answer and common pitfalls' },
                  topic: { type: Type.STRING },
                },
                required: ['question', 'type', 'options', 'correctAnswer', 'explanation', 'topic'],
              },
            },
          },
          required: ['title', 'subject', 'difficulty', 'estimatedReadTimeMinutes', 'keyTopics', 'summary', 'flashcards', 'quiz'],
        },
      },
    });

    const rawOutput = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawOutput);

    // Assign unique IDs to flashcards and quiz questions
    const flashcardsWithIds = (parsed.flashcards || []).map((fc: any, index: number) => ({
      ...fc,
      id: `fc-${Date.now()}-${index + 1}`,
      mastery: 'unseen',
      reviewCount: 0,
    }));

    const quizWithIds = (parsed.quiz || []).map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index + 1}`,
    }));

    const result = {
      id: `module-${Date.now()}`,
      title: parsed.title || title || 'Study Module',
      subject: parsed.subject || 'General Studies',
      createdAt: new Date().toISOString(),
      sourceType: file ? (file.mimeType.includes('image') ? 'image' : 'file') : 'text',
      sourceSnippet: text ? text.slice(0, 300) : (file?.name ? `Uploaded: ${file.name}` : ''),
      difficulty: parsed.difficulty || difficultyLevel,
      estimatedReadTimeMinutes: parsed.estimatedReadTimeMinutes || 10,
      keyTopics: parsed.keyTopics || ['Core Principles', 'Key Definitions', 'Applications'],
      summary: parsed.summary,
      flashcards: flashcardsWithIds,
      quiz: quizWithIds,
      userProgress: {
        flashcardsReviewed: 0,
        flashcardsMastered: 0,
        quizAttempts: [],
        lastStudiedAt: new Date().toISOString(),
      },
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error generating study materials:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate study materials. Please check your content and try again.',
    });
  }
});

// API Route: Explain Concept (Interactive tutor for deep dives or ELI5)
app.post('/api/explain-concept', async (req: Request, res: Response): Promise<void> => {
  try {
    const { concept, context, style = 'simple' } = req.body;

    if (!concept) {
      res.status(400).json({ error: 'Concept is required' });
      return;
    }

    const prompt = style === 'eli5'
      ? `Explain the concept "${concept}" as if explaining to a curious high school student using a vivid analogy and everyday examples. Context: ${context || 'General study'}. Keep it under 150 words.`
      : `Provide a clear, high-yield academic explanation of "${concept}", highlighting key mechanisms, importance, and common exam pitfalls. Context: ${context || 'General study'}. Keep it under 200 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error('Error explaining concept:', error);
    res.status(500).json({ error: error.message || 'Failed to explain concept.' });
  }
});

// API Route: Evaluate Short Answer
app.post('/api/evaluate-short-answer', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, idealAnswer, studentAnswer } = req.body;

    if (!question || !studentAnswer) {
      res.status(400).json({ error: 'Question and student answer are required' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an encouraging academic examiner evaluating a student's answer.
Question: "${question}"
Ideal Concept Reference: "${idealAnswer || 'Answer addressing the core question principles'}"
Student Answer: "${studentAnswer}"

Provide evaluation in JSON format with:
- score: percentage 0-100
- isCorrect: boolean (true if score >= 70)
- positiveFeedback: 1-2 sentences on what they got right
- constructiveImprovement: 1-2 sentences on what key terminology or points were omitted or could be sharper`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            isCorrect: { type: Type.BOOLEAN },
            positiveFeedback: { type: Type.STRING },
            constructiveImprovement: { type: Type.STRING },
          },
          required: ['score', 'isCorrect', 'positiveFeedback', 'constructiveImprovement'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error evaluating answer:', error);
    res.status(500).json({ error: error.message || 'Evaluation failed.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Synapse server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
