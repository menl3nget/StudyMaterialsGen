import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Download,
  LayoutGrid,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { StudyFlashcard, StudyModule, MasteryLevel } from '../types/study';
import { ConceptExplainerModal } from './ConceptExplainerModal';

interface FlashcardsViewProps {
  module: StudyModule;
  onUpdateModule: (updated: StudyModule) => void;
  onNavigateToQuiz: () => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  module,
  onUpdateModule,
  onNavigateToQuiz,
}) => {
  const [cards, setCards] = useState<StudyFlashcard[]>(module.flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unseen' | 'learning' | 'mastered'>('all');
  const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');
  const [reverseMode, setReverseMode] = useState(false); // Answer on front, guess question
  const [explainingConcept, setExplainingConcept] = useState<string | null>(null);

  // Sync cards when module changes
  useEffect(() => {
    setCards(module.flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [module.id, module.flashcards]);

  // Filtered card list
  const filteredCards = cards.filter((c) => {
    if (filterMode === 'all') return true;
    return (c.mastery || 'unseen') === filterMode;
  });

  const currentCard: StudyFlashcard | undefined = filteredCards[currentIndex];

  const handleNext = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  }, [filteredCards.length]);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'deck') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'h' || e.key === 'H') {
        setShowHint((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, viewMode]);

  // Update card mastery
  const handleRateMastery = (cardId: string, mastery: MasteryLevel) => {
    const updatedCards = cards.map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          mastery,
          reviewCount: (c.reviewCount || 0) + 1,
          lastReviewed: new Date().toISOString(),
        };
      }
      return c;
    });

    setCards(updatedCards);

    // Calculate overall stats
    const masteredCount = updatedCards.filter((c) => c.mastery === 'mastered').length;
    const reviewedCount = updatedCards.filter((c) => c.mastery && c.mastery !== 'unseen').length;

    const updatedModule: StudyModule = {
      ...module,
      flashcards: updatedCards,
      userProgress: {
        ...module.userProgress,
        flashcardsReviewed: reviewedCount,
        flashcardsMastered: masteredCount,
        lastStudiedAt: new Date().toISOString(),
      },
    };

    onUpdateModule(updatedModule);

    // Auto advance after rating in deck mode
    if (viewMode === 'deck' && filteredCards.length > 1) {
      setTimeout(() => {
        handleNext();
      }, 200);
    }
  };

  // Text to speech for card
  const speakText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Export to Anki / CSV
  const handleExportCSV = () => {
    const rows = [
      ['Front', 'Back', 'Category', 'Mastery'],
      ...cards.map((c) => [
        `"${c.front.replace(/"/g, '""')}"`,
        `"${c.back.replace(/"/g, '""')}"`,
        `"${c.category || ''}"`,
        `"${c.mastery || 'unseen'}"`,
      ]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.title.toLowerCase().replace(/\s+/g, '_')}_flashcards.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Mastery tally
  const masteredCount = cards.filter((c) => c.mastery === 'mastered').length;
  const learningCount = cards.filter((c) => c.mastery === 'learning').length;
  const unseenCount = cards.filter((c) => !c.mastery || c.mastery === 'unseen').length;
  const masteryPercentage = Math.round((masteredCount / Math.max(cards.length, 1)) * 100);

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

      {/* Header & Mastery Dashboard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-indigo-600">{module.subject}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Spaced Repetition Deck</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="font-mono tabular-nums">{cards.length} Total Cards</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {module.title} Flashcards
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReverseMode(!reverseMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                reverseMode
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Reverse cards: See answer, recall question"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{reverseMode ? 'Reverse: ON' : 'Reverse Mode'}</span>
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'deck' ? 'grid' : 'deck')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              {viewMode === 'deck' ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid View</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Deck View</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Export flashcards to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Spaced Repetition Mastery Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Deck Mastery Progress: <span className="font-mono tabular-nums text-indigo-600">{masteryPercentage}%</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {masteredCount} Mastered
              </span>
              <span className="text-amber-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {learningCount} Learning
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                {unseenCount} Unseen
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(masteredCount / Math.max(cards.length, 1)) * 100}%` }}
              title={`${masteredCount} Mastered`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${(learningCount / Math.max(cards.length, 1)) * 100}%` }}
              title={`${learningCount} Learning`}
            />
            <div
              className="bg-slate-200 h-full transition-all duration-300"
              style={{ width: `${(unseenCount / Math.max(cards.length, 1)) * 100}%` }}
              title={`${unseenCount} Unseen`}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Shuffle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
          {[
            { key: 'all', label: `All (${cards.length})` },
            { key: 'learning', label: `Need Review (${learningCount})` },
            { key: 'mastered', label: `Mastered (${masteredCount})` },
            { key: 'unseen', label: `Unseen (${unseenCount})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilterMode(f.key as any);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                filterMode === f.key
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleShuffle}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* View Mode 1: 3D Deck Card View */}
      {viewMode === 'deck' && (
        <div className="space-y-6">
          {filteredCards.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-3">No cards match the selected filter.</p>
              <button
                onClick={() => setFilterMode('all')}
                className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
              >
                Reset Filter to All
              </button>
            </div>
          ) : currentCard ? (
            <>
              {/* Card Navigation Index Indicator */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-mono tabular-nums">
                  Card {currentIndex + 1} of {filteredCards.length}
                </span>
                <span className="hidden sm:inline text-slate-400">
                  Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-[10px]">Space</kbd> to flip, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-[10px]">&larr;</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono text-[10px]">&rarr;</kbd> to navigate
                </span>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={handleFlip}
                className="perspective-1000 w-full min-h-[340px] sm:min-h-[380px] cursor-pointer select-none group"
              >
                <div
                  className={`relative w-full h-full min-h-[340px] sm:min-h-[380px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-md hover:shadow-lg border border-slate-200/90 ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl p-6 sm:p-10 flex flex-col justify-between overflow-hidden">
                    {/* Top sub-header */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-600 uppercase tracking-wider text-[11px]">
                          {currentCard.category || module.subject}
                        </span>
                        {currentCard.mastery && currentCard.mastery !== 'unseen' && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              currentCard.mastery === 'mastered'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {currentCard.mastery === 'mastered' ? 'Mastered' : 'Review Needed'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) =>
                            speakText(reverseMode ? currentCard.back : currentCard.front, e)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          title="Read prompt aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <RotateCw className="w-3 h-3" /> Flip
                        </span>
                      </div>
                    </div>

                    {/* Central Prompt */}
                    <div className="my-auto py-6 text-center">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 block mb-3">
                        {reverseMode ? 'Definition / Concept (Recall Term)' : 'Question / Concept'}
                      </span>
                      <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-snug max-w-xl mx-auto">
                        {reverseMode ? currentCard.back : currentCard.front}
                      </p>

                      {/* Hint Drawer */}
                      {currentCard.hint && (
                        <div className="mt-4">
                          {showHint ? (
                            <p className="text-xs text-amber-700 bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-xl max-w-md mx-auto inline-block">
                              Hint: {currentCard.hint}
                            </p>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHint(true);
                              }}
                              className="text-xs text-slate-400 hover:text-indigo-600 font-medium inline-flex items-center gap-1"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              Need a hint?
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom footer notice */}
                    <div className="text-center text-xs text-slate-400">
                      Click or tap card to reveal answer
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-10 flex flex-col justify-between rotate-y-180 overflow-hidden">
                    {/* Top sub-header */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px]">
                        Answer & Key Rationale
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) =>
                            speakText(reverseMode ? currentCard.front : currentCard.back, e)
                          }
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          title="Read answer aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExplainingConcept(currentCard.front);
                          }}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                          title="Explain deeper with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Explain with AI</span>
                        </button>
                      </div>
                    </div>

                    {/* Central Answer */}
                    <div className="my-auto py-6">
                      <p className="text-base sm:text-xl font-medium text-slate-100 leading-relaxed max-w-xl mx-auto text-center">
                        {reverseMode ? currentCard.front : currentCard.back}
                      </p>
                    </div>

                    {/* Self-Rating Bar */}
                    <div
                      className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-slate-400">How well did you know this?</span>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleRateMastery(currentCard.id, 'learning')}
                          className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Need Review</span>
                        </button>
                        <button
                          onClick={() => handleRateMastery(currentCard.id, 'mastered')}
                          className="flex-1 sm:flex-initial px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mastered!</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={handlePrev}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleFlip}
                  className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{isFlipped ? 'Show Question' : 'Reveal Answer'}</span>
                </button>

                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* View Mode 2: Grid View (Bird's Eye Overview) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCards.map((c, idx) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-indigo-600 text-[11px]">
                    Card #{idx + 1} · {c.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      c.mastery === 'mastered'
                        ? 'bg-emerald-50 text-emerald-700'
                        : c.mastery === 'learning'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.mastery === 'mastered'
                      ? 'Mastered'
                      : c.mastery === 'learning'
                      ? 'Learning'
                      : 'Unseen'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">{c.front}</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {c.back}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => setExplainingConcept(c.front)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3 h-3" />
                  Explain
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRateMastery(c.id, 'learning')}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-medium"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => handleRateMastery(c.id, 'mastered')}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-medium"
                  >
                    Mastered
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA To Practice Quiz */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
            Test Your Mastery
          </span>
          <h3 className="text-lg sm:text-xl font-bold">
            Ready to test with practice questions?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
            Challenge yourself with the tailored practice quiz featuring full explanations and error analysis.
          </p>
        </div>
        <button
          onClick={onNavigateToQuiz}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm whitespace-nowrap active:scale-98"
        >
          Start Practice Quiz ({module.quiz.length} Questions) &rarr;
        </button>
      </div>
    </div>
  );
};
