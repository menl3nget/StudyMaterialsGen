import { StudyFlashcard, QuizQuestion } from '../types/study';

export function calculateMasteryStats(cards: StudyFlashcard[]) {
  const total = cards.length;
  const mastered = cards.filter((c) => c.mastery === 'mastered').length;
  const learning = cards.filter((c) => c.mastery === 'learning').length;
  const unseen = cards.filter((c) => !c.mastery || c.mastery === 'unseen').length;
  const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return {
    total,
    mastered,
    learning,
    unseen,
    percentage,
  };
}

export function calculateQuizResults(
  questions: QuizQuestion[],
  userAnswers: Record<string, string>
) {
  let correct = 0;
  const incorrectIds: string[] = [];
  const topicMap: Record<string, { total: number; correct: number }> = {};

  questions.forEach((q) => {
    const topic = q.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = { total: 0, correct: 0 };
    topicMap[topic].total++;

    if (userAnswers[q.id] === q.correctAnswer) {
      correct++;
      topicMap[topic].correct++;
    } else {
      incorrectIds.push(q.id);
    }
  });

  const percentage = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

  return {
    correct,
    total: questions.length,
    percentage,
    incorrectIds,
    topicMap,
  };
}
