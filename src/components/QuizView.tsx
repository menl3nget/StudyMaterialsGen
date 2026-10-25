import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Flag,
  Award,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ArrowRight,
  Target,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';
import { QuizQuestion, StudyModule, QuizAttempt } from '../types/study';
import { ConceptExplainerModal } from './ConceptExplainerModal';

interface QuizViewProps {
  module: StudyModule;
  onUpdateModule: (updated: StudyModule) => void;
  onNavigateToSummary: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  module,
  onUpdateModule,
  onNavigateToSummary,
}) => {
  const [quizMode, setQuizMode] = useState<'practice' | 'exam'>('practice');
  const [questions, setQuestions] = useState<QuizQuestion[]>(module.quiz);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User answers map: questionId -> selectedOption
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  // In practice mode, which questions have been checked/submitted
  const [checkedPractice, setCheckedPractice] = useState<Record<string, boolean>>({});
  // Flagged for review (exam mode)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // Quiz completion state
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(module.quiz.length * 60); // 1 min per Q
  const [timerActive, setTimerActive] = useState(false);

  // Concept explainer modal
  const [explainingConcept, setExplainingConcept] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Sync questions on module change
  useEffect(() => {
    setQuestions(module.quiz);
    resetQuiz(module.quiz);
  }, [module.id, module.quiz]);

  const resetQuiz = (qList: QuizQuestion[] = questions) => {
    setQuestions(qList);
    setCurrentIndex(0);
    setUserAnswers({});
    setCheckedPractice({});
    setFlaggedQuestions({});
    setIsCompleted(false);
    setTimeSpent(0);
    setTimerRemaining(qList.length * 60);
    setTimerActive(quizMode === 'exam');
  };

  // Timer loop for exam mode
  useEffect(() => {
    if (timerActive && !isCompleted) {
      timerRef.current = setInterval(() => {
        setTimeSpent((t) => t + 1);
        setTimerRemaining((rem) => {
          if (rem <= 1) {
            clearInterval(timerRef.current);
            finishQuiz();
            return 0;
          }
          return rem - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, isCompleted]);

  const currentQuestion: QuizQuestion | undefined = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    if (quizMode === 'practice' && checkedPractice[currentQuestion.id]) {
      // already locked in practice
      return;
    }
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion) return;
    setCheckedPractice((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  const toggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const finishQuiz = () => {
    setIsCompleted(true);
    setTimerActive(false);
    clearInterval(timerRef.current);

    // Calculate score
    let correct = 0;
    const incorrectIds: string[] = [];

    questions.forEach((q) => {
      const selected = userAnswers[q.id];
      if (selected === q.correctAnswer) {
        correct++;
      } else {
        incorrectIds.push(q.id);
      }
    });

    const percentage = Math.round((correct / Math.max(questions.length, 1)) * 100);

    // Trigger celebration confetti for high score!
    if (percentage >= 75) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const newAttempt: QuizAttempt = {
      date: new Date().toISOString(),
      score: correct,
      totalQuestions: questions.length,
      percentage,
      timeSpentSeconds: timeSpent,
      incorrectQuestionIds: incorrectIds,
    };

    const previousBest = module.userProgress.quizHighScore || 0;
    const updatedModule: StudyModule = {
      ...module,
      userProgress: {
        ...module.userProgress,
        quizHighScore: Math.max(previousBest, percentage),
        quizAttempts: [newAttempt, ...(module.userProgress.quizAttempts || [])],
        lastStudiedAt: new Date().toISOString(),
      },
    };

    onUpdateModule(updatedModule);
  };

  // Retry weak / missed questions
  const handleRetryMissed = () => {
    const missed = questions.filter((q) => userAnswers[q.id] !== q.correctAnswer);
    if (missed.length > 0) {
      resetQuiz(missed);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Score calculation for completed screen
  const correctCount = questions.filter((q) => userAnswers[q.id] === q.correctAnswer).length;
  const scorePercent = Math.round((correctCount / Math.max(questions.length, 1)) * 100);

  // Topic mastery map
  const topicMap: Record<string, { total: number; correct: number }> = {};
  questions.forEach((q) => {
    const top = q.topic || 'General';
    if (!topicMap[top]) topicMap[top] = { total: 0, correct: 0 };
    topicMap[top].total++;
    if (userAnswers[q.id] === q.correctAnswer) {
      topicMap[top].correct++;
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Concept Explainer Modal */}
      {explainingConcept && (
        <ConceptExplainerModal
          concept={explainingConcept}
          context={`${module.title} (${module.subject})`}
          isOpen={!!explainingConcept}
          onClose={() => setExplainingConcept(null)}
        />
      )}

      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-indigo-600">{module.subject}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Tailored Practice Quiz</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="font-mono tabular-nums">{questions.length} Questions</span>
              {module.userProgress.quizHighScore !== undefined && (
                <>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    Best: {module.userProgress.quizHighScore}%
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {module.title}
            </h1>
          </div>

          {!isCompleted && (
            <div className="flex items-center gap-2">
              {/* Mode switch */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  onClick={() => {
                    setQuizMode('practice');
                    setTimerActive(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                    quizMode === 'practice'
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Practice Mode
                </button>
                <button
                  onClick={() => {
                    setQuizMode('exam');
                    setTimerActive(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                    quizMode === 'exam'
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Timed Exam
                </button>
              </div>

              {quizMode === 'exam' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-xl font-mono text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatSeconds(timerRemaining)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUIZ IN PROGRESS VIEW */}
      {!isCompleted && currentQuestion && (
        <div className="space-y-6">
          {/* Question Navigator strip (especially useful for Exam mode) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Question <span className="font-mono tabular-nums text-indigo-600">{currentIndex + 1}</span> of{' '}
                <span className="font-mono tabular-nums">{questions.length}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                    flaggedQuestions[currentQuestion.id]
                      ? 'bg-amber-100 text-amber-800'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQuestion.id] ? 'Flagged' : 'Flag'}</span>
                </button>
              </div>
            </div>

            {/* Progress pills / buttons */}
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!userAnswers[q.id];
                const isFlagged = !!flaggedQuestions[q.id];
                const isChecked = !!checkedPractice[q.id];
                const isCorrect = userAnswers[q.id] === q.correctAnswer;

                let btnBg = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                if (quizMode === 'practice' && isChecked) {
                  btnBg = isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800';
                } else if (isAnswered) {
                  btnBg = 'bg-indigo-100 text-indigo-800 font-semibold';
                }
                if (isCurrent) {
                  btnBg += ' ring-2 ring-indigo-600 ring-offset-1';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-medium relative flex items-center justify-center transition-all ${btnBg}`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-3">
              <span className="font-semibold text-indigo-600 uppercase tracking-wider text-[11px]">
                {currentQuestion.topic || module.subject}
              </span>
              <span className="capitalize">{currentQuestion.type.replace('-', ' ')}</span>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Options list */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = userAnswers[currentQuestion.id] === option;
                const isChecked = quizMode === 'practice' && checkedPractice[currentQuestion.id];
                const isCorrect = option === currentQuestion.correctAnswer;

                let optionStyle =
                  'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800';

                if (isSelected && !isChecked) {
                  optionStyle = 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold';
                }

                if (isChecked) {
                  if (isCorrect) {
                    optionStyle =
                      'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                  } else if (isSelected && !isCorrect) {
                    optionStyle =
                      'border-rose-400 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-400';
                  } else {
                    optionStyle = 'border-slate-200 opacity-60 text-slate-500';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(option)}
                    disabled={isChecked}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3.5 ${optionStyle}`}
                  >
                    <span className="font-mono text-xs font-bold w-6 h-6 rounded-lg bg-white/80 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{option}</span>
                    {isChecked && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isChecked && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Practice Mode: Instant Explanation Banner */}
            {quizMode === 'practice' && checkedPractice[currentQuestion.id] && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm space-y-2.5 animate-fadeIn ${
                  userAnswers[currentQuestion.id] === currentQuestion.correctAnswer
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/90 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {userAnswers[currentQuestion.id] === currentQuestion.correctAnswer ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct!
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600" /> Incorrect
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => setExplainingConcept(currentQuestion.question)}
                    className="text-xs text-indigo-700 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Ask AI Tutor
                  </button>
                </div>

                <p className="leading-relaxed text-slate-800">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {quizMode === 'practice' && !checkedPractice[currentQuestion.id] ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!userAnswers[currentQuestion.id]}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  >
                    Check Answer
                  </button>
                ) : null}

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={finishQuiz}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs"
                  >
                    Complete Quiz &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED RESULTS & ANALYTICS VIEW */}
      {isCompleted && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Scorecard */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-md text-center">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
              <Award className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
              {scorePercent >= 80
                ? 'Outstanding Mastery!'
                : scorePercent >= 60
                ? 'Solid Performance!'
                : 'Keep Practicing & Reinforcing!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              You answered <span className="font-semibold text-slate-800">{correctCount}</span> of{' '}
              <span className="font-semibold text-slate-800">{questions.length}</span> questions correctly in{' '}
              <span className="font-mono text-slate-700">{formatSeconds(timeSpent)}</span>.
            </p>

            {/* Score Radial / Large Badge */}
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg mb-8">
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums leading-none">
                  {scorePercent}%
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-wider mt-1 text-indigo-100">
                  Score
                </span>
              </div>
            </div>

            {/* Topic Mastery Breakdown */}
            <div className="max-w-md mx-auto text-left mb-8 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Mastery by Topic:
              </h4>
              {Object.entries(topicMap).map(([topName, stat]) => {
                const pct = Math.round((stat.correct / stat.total) * 100);
                return (
                  <div key={topName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate">{topName}</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {correctCount < questions.length && (
                <button
                  onClick={handleRetryMissed}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Drill Missed Questions ({questions.length - correctCount})</span>
                </button>
              )}

              <button
                onClick={() => resetQuiz(module.quiz)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Full Quiz</span>
              </button>

              <button
                onClick={onNavigateToSummary}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Back to Summary</span>
              </button>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Detailed Answer Key & Rationales
            </h3>

            <div className="space-y-6">
              {questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border text-xs sm:text-sm space-y-3 ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-rose-200 bg-rose-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800">{q.question}</span>
                      </div>
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold text-xs shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-700 font-semibold text-xs shrink-0">
                          <XCircle className="w-4 h-4 text-rose-500" /> Missed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Your Answer:
                        </span>
                        <span className={isCorrect ? 'text-emerald-800 font-medium' : 'text-rose-700 font-medium'}>
                          {userAns || '(Unanswered)'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Correct Answer:
                        </span>
                        <span className="text-emerald-800 font-medium">{q.correctAnswer}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 text-slate-700 leading-relaxed text-xs">
                      <span className="font-semibold text-slate-900 block mb-0.5">Explanation:</span>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
