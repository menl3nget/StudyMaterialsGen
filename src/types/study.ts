export interface StudyModule {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  sourceType: 'text' | 'file' | 'image' | 'preset';
  sourceSnippet: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedReadTimeMinutes: number;
  keyTopics: string[];
  
  summary: StudySummary;
  flashcards: StudyFlashcard[];
  quiz: QuizQuestion[];
  userProgress: ModuleProgress;
}

export interface StudySummary {
  executiveSummary: string;
  keyTakeaways: string[];
  structuredOutline: OutlineSection[];
  glossary: GlossaryTerm[];
  realWorldApplications: string[];
}

export interface OutlineSection {
  sectionTitle: string;
  keyPoints: string[];
  subtopics?: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  context?: string;
}

export type MasteryLevel = 'unseen' | 'learning' | 'mastered';

export interface StudyFlashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mastery?: MasteryLevel;
  lastReviewed?: string;
  reviewCount?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
}

export interface ModuleProgress {
  flashcardsReviewed: number;
  flashcardsMastered: number;
  quizHighScore?: number;
  quizAttempts: QuizAttempt[];
  lastStudiedAt: string;
}

export interface QuizAttempt {
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  incorrectQuestionIds: string[];
}

export interface GenerationOptions {
  depth: 'concise' | 'comprehensive' | 'exam-prep';
  cardCount: number;
  quizCount: number;
  targetAudience?: string;
}
