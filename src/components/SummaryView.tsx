import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  Lightbulb,
  Search,
  ArrowRight,
  Printer,
  Compass,
} from 'lucide-react';
import { StudyModule } from '../types/study';
import { ConceptExplainerModal } from './ConceptExplainerModal';

interface SummaryViewProps {
  module: StudyModule;
  onNavigateToCards: () => void;
  onNavigateToQuiz: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  module,
  onNavigateToCards,
  onNavigateToQuiz,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });
  const [glossarySearch, setGlossarySearch] = useState('');
  const [explainingConcept, setExplainingConcept] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Audio Speech state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  useEffect(() => {
    // Reset audio if module changes
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, [module.id]);

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    module.summary.structuredOutline.forEach((_, i) => (all[i] = true));
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const handleToggleAudio = () => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${module.title}. Subject: ${module.subject}. Executive Summary: ${
        module.summary.executiveSummary
      }. Key Takeaways: ${module.summary.keyTakeaways.join('. ')}`;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = speechRate;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `# ${module.title}\n**Subject:** ${module.subject} | **Difficulty:** ${module.difficulty}\n\n## Executive Summary\n${module.summary.executiveSummary}\n\n## Key Takeaways\n${module.summary.keyTakeaways.map((k) => `- ${k}`).join('\n')}\n\n## Structured Outline\n${module.summary.structuredOutline.map((s) => `### ${s.sectionTitle}\n${s.keyPoints.map((p) => `- ${p}`).join('\n')}`).join('\n\n')}\n\n## Glossary\n${module.summary.glossary.map((g) => `**${g.term}**: ${g.definition}`).join('\n')}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = `# ${module.title}\n**Subject:** ${module.subject}\n\n## Executive Summary\n${module.summary.executiveSummary}\n\n## Key Takeaways\n${module.summary.keyTakeaways.map((k) => `- ${k}`).join('\n')}\n\n## Structured Outline\n${module.summary.structuredOutline.map((s) => `### ${s.sectionTitle}\n${s.keyPoints.map((p) => `- ${p}`).join('\n')}`).join('\n\n')}\n\n## Glossary\n${module.summary.glossary.map((g) => `**${g.term}**: ${g.definition}`).join('\n')}`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.title.toLowerCase().replace(/\s+/g, '_')}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredGlossary = module.summary.glossary.filter(
    (g) =>
      g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Concept Explainer Modal */}
      {explainingConcept && (
        <ConceptExplainerModal
          concept={explainingConcept}
          context={`${module.title} (${module.subject})`}
          isOpen={!!explainingConcept}
          onClose={() => setExplainingConcept(null)}
        />
      )}

      {/* Hero Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {/* Zero-Pill Unboxed Metadata */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mb-3">
          <span className="font-semibold text-indigo-600">{module.subject}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{module.difficulty} Level</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>~{module.estimatedReadTimeMinutes} min read</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{module.flashcards.length} Flashcards</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{module.quiz.length} Quiz Questions</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4 text-balance">
          {module.title}
        </h1>

        {/* Key Topics Tag Strip */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-slate-600">
          <span className="font-semibold text-slate-400">Core Topics:</span>
          {module.keyTopics.map((topic, i) => (
            <span key={topic} className="flex items-center gap-1.5">
              <span className="font-medium text-slate-700">{topic}</span>
              {i < module.keyTopics.length - 1 && <span className="text-slate-300">/</span>}
            </span>
          ))}
        </div>

        {/* Audio Reader & Quick Tools Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          {/* TTS Audio Controls */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/70">
            <button
              onClick={handleToggleAudio}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                isPlayingAudio
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 hover:text-indigo-600 shadow-2xs'
              }`}
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingAudio ? 'Pause Narration' : 'Listen to Summary'}</span>
            </button>

            {isPlayingAudio && (
              <div className="flex items-center gap-1 px-2 text-[11px] text-slate-600 font-mono">
                <span>Speed:</span>
                {[1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      if (isPlayingAudio) {
                        handleToggleAudio(); // restart with new rate
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      speechRate === rate ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export / Share actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column or Structured Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Executive Summary & Structured Outline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Executive Summary */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Executive Summary</h2>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-[15px]">
              <p className="whitespace-pre-line">{module.summary.executiveSummary}</p>
            </div>
          </section>

          {/* Key Takeaways */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Key Takeaways & Core Principles</h2>
            </div>
            <ul className="space-y-3">
              {module.summary.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                  <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Structured Outline / Mindmap */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Structured Concept Outline</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={expandAll}
                  className="text-slate-500 hover:text-indigo-600 font-medium"
                >
                  Expand All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={collapseAll}
                  className="text-slate-500 hover:text-indigo-600 font-medium"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {module.summary.structuredOutline.map((sec, idx) => {
                const isOpen = !!expandedSections[idx];
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/90 rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleSection(idx)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left"
                    >
                      <span className="text-sm font-bold text-slate-800">
                        {sec.sectionTitle}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                        <ul className="space-y-2">
                          {sec.keyPoints.map((pt, pIdx) => (
                            <li
                              key={pIdx}
                              className="text-xs sm:text-sm text-slate-600 flex items-start gap-2.5 leading-relaxed"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>

                        {sec.subtopics && sec.subtopics.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-400">Subtopics:</span>
                            {sec.subtopics.map((sub, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => setExplainingConcept(sub)}
                                className="text-indigo-600 hover:underline font-medium"
                              >
                                {sub}
                                {sIdx < sec.subtopics!.length - 1 ? ',' : ''}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Real-World Applications */}
          {module.summary.realWorldApplications && module.summary.realWorldApplications.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Real-World Case Studies & Applications</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {module.summary.realWorldApplications.map((app, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed"
                  >
                    {app}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column: Interactive Glossary & Quick Next Steps */}
        <div className="space-y-8">
          {/* Study Next Step Callout Cards */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 rounded-2xl border border-indigo-100 p-6 shadow-xs">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
              Active Recall Next Step
            </span>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Reinforce with Flashcards
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Master the {module.flashcards.length} essential concepts through active recall and spaced repetition.
            </p>
            <button
              onClick={onNavigateToCards}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
            >
              <span>Practice Flashcards ({module.flashcards.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToQuiz}
              className="w-full mt-2 py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>Take Practice Quiz ({module.quiz.length} Qs)</span>
            </button>
          </div>

          {/* Interactive Glossary Card */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Glossary of Terms</h3>
              <span className="text-xs font-mono text-slate-400">
                {module.summary.glossary.length} terms
              </span>
            </div>

            {/* Search filter */}
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Search terms or definitions..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredGlossary.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No matching terms found.</p>
              ) : (
                filteredGlossary.map((termItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/70 hover:bg-indigo-50/30 border border-slate-100 rounded-xl transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900">{termItem.term}</h4>
                      <button
                        onClick={() => setExplainingConcept(termItem.term)}
                        title="Ask AI Tutor to explain simply"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Explain
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-1">
                      {termItem.definition}
                    </p>
                    {termItem.context && (
                      <p className="text-[11px] text-slate-400 italic">
                        Context: {termItem.context}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
