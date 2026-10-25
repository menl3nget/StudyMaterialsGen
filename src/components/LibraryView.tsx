import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  CheckSquare,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
} from 'lucide-react';
import { StudyModule } from '../types/study';

interface LibraryViewProps {
  modules: StudyModule[];
  currentModuleId: string;
  onSelectModule: (module: StudyModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onOpenUpload: () => void;
  onImportModule: (module: StudyModule) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  modules,
  currentModuleId,
  onSelectModule,
  onDeleteModule,
  onOpenUpload,
  onImportModule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Subjects list
  const subjects = ['all', ...Array.from(new Set(modules.map((m) => m.subject)))];

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.keyTopics.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || m.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Aggregate stats
  const totalCards = modules.reduce((sum, m) => sum + m.flashcards.length, 0);
  const totalMastered = modules.reduce((sum, m) => sum + (m.userProgress.flashcardsMastered || 0), 0);
  const quizScores = modules
    .map((m) => m.userProgress.quizHighScore)
    .filter((s): s is number => s !== undefined);
  const avgQuizScore =
    quizScores.length > 0 ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : 0;

  const handleExportJSON = (module: StudyModule, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(module, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${module.title.toLowerCase().replace(/\s+/g, '_')}_synapse_deck.json`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.title && parsed.summary && parsed.flashcards && parsed.quiz) {
          onImportModule(parsed);
        } else {
          alert('Invalid Synapse study deck file.');
        }
      } catch (err) {
        alert('Could not parse imported JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
        <div className="absolute inset-0 opacity-30 mix-blend-luminosity pointer-events-none">
          <img
            src="/src/assets/images/hero_study_knowledge_1792931139778.jpg"
            alt="Study desk"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
              Your Personal Knowledge Engine
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Transform Any Material Into Instant Mastery
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Upload modules, PDF slides, or lecture notes. Synapse automatically synthesizes
              structured summaries, active recall flashcards, and adaptive practice quizzes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="cursor-pointer px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5 border border-white/10">
              <Upload className="w-4 h-4" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={onOpenUpload}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-98 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Material</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Total Modules</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
              {modules.length}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Flashcards Mastered</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-600">
              {totalMastered}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {totalCards}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Average Quiz Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono tabular-nums text-indigo-600">
              {avgQuizScore}%
            </span>
            <span className="text-xs text-slate-400">mastery</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">Device Sync</span>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-800">PC & Mobile</span>
            <span className="text-xs text-emerald-600 font-medium">Ready</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search modules or topics..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSubject === sub
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sub === 'all' ? 'All Subjects' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((mod) => {
          const isSelected = mod.id === currentModuleId;
          const masteredCount = mod.userProgress.flashcardsMastered || 0;
          const cardTotal = mod.flashcards.length;
          const pct = Math.round((masteredCount / Math.max(cardTotal, 1)) * 100);

          return (
            <div
              key={mod.id}
              onClick={() => onSelectModule(mod)}
              className={`bg-white rounded-2xl border transition-all cursor-pointer flex flex-col justify-between p-6 hover:shadow-md ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Zero-Pill Unboxed Header */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-indigo-600 uppercase tracking-wider text-[11px]">
                      {mod.subject}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{mod.difficulty}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                  {mod.title}
                </h3>

                {/* Key topics preview */}
                <div className="flex flex-wrap gap-1 mb-4 text-[11px] text-slate-500">
                  {mod.keyTopics.slice(0, 3).map((topic, i) => (
                    <span key={topic}>
                      {topic}
                      {i < Math.min(mod.keyTopics.length, 3) - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>

                {/* Study Material counts */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Summary</span>
                    <span className="text-xs font-bold text-slate-800">
                      ~{mod.estimatedReadTimeMinutes}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cards</span>
                    <span className="text-xs font-bold font-mono text-slate-800">
                      {mod.flashcards.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Quiz Best</span>
                    <span className="text-xs font-bold font-mono text-indigo-600">
                      {mod.userProgress.quizHighScore !== undefined
                        ? `${mod.userProgress.quizHighScore}%`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Card mastery progress bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Card Mastery</span>
                    <span className="font-mono text-slate-700 font-medium">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div
                className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleExportJSON(mod, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Export study deck to JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {modules.length > 1 && (
                    <button
                      onClick={() => onDeleteModule(mod.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onSelectModule(mod)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Study Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
