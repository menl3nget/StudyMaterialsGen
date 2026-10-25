import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMasteryStats, calculateQuizResults } from './studyLogic';
import { StudyFlashcard, QuizQuestion } from '../types/study';

test('calculateMasteryStats computes correct proportions and percentage', () => {
  const mockCards: StudyFlashcard[] = [
    { id: '1', front: 'Q1', back: 'A1', category: 'Cat1', mastery: 'mastered' },
    { id: '2', front: 'Q2', back: 'A2', category: 'Cat1', mastery: 'mastered' },
    { id: '3', front: 'Q3', back: 'A3', category: 'Cat2', mastery: 'learning' },
    { id: '4', front: 'Q4', back: 'A4', category: 'Cat2', mastery: 'unseen' },
  ];

  const stats = calculateMasteryStats(mockCards);
  assert.equal(stats.total, 4);
  assert.equal(stats.mastered, 2);
  assert.equal(stats.learning, 1);
  assert.equal(stats.unseen, 1);
  assert.equal(stats.percentage, 50);
});

test('calculateQuizResults scores answers and groups topics correctly', () => {
  const mockQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      question: 'Is DNA double-stranded?',
      type: 'true-false',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'DNA has a double helix.',
      topic: 'Genetics',
    },
    {
      id: 'q2',
      question: 'Which base pairs with Adenine in DNA?',
      type: 'multiple-choice',
      options: ['Thymine', 'Cytosine', 'Guanine', 'Uracil'],
      correctAnswer: 'Thymine',
      explanation: 'A pairs with T in DNA.',
      topic: 'Genetics',
    },
    {
      id: 'q3',
      question: 'What is the powerhouse of the cell?',
      type: 'multiple-choice',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi'],
      correctAnswer: 'Mitochondria',
      explanation: 'Mitochondria produce ATP.',
      topic: 'Cell Biology',
    },
  ];

  const answers = {
    q1: 'True', // Correct
    q2: 'Uracil', // Incorrect
    q3: 'Mitochondria', // Correct
  };

  const results = calculateQuizResults(mockQuestions, answers);
  assert.equal(results.correct, 2);
  assert.equal(results.total, 3);
  assert.equal(results.percentage, 67);
  assert.deepEqual(results.incorrectIds, ['q2']);
  assert.equal(results.topicMap['Genetics'].correct, 1);
  assert.equal(results.topicMap['Genetics'].total, 2);
  assert.equal(results.topicMap['Cell Biology'].correct, 1);
  assert.equal(results.topicMap['Cell Biology'].total, 1);
});
