import React from 'react';
import { Sparkles, Plus, BookOpen, Layers, CheckSquare, Library, ChevronDown } from 'lucide-react';
import { StudyModule } from '../types/study';

interface NavbarProps {
  activeTab: 'summary' | 'flashcards' | 'quiz' | 'library';
  setActiveTab: (tab: 'summary' | 'flashcards' | 'quiz' | 'library') => void;
  onOpenUpload: () => void;
  modules: StudyModule[];
  currentModule: StudyModule | null;
  onSelectModule: (module: StudyModule) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  modules,
  currentModule,
  onSelectModule,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark with subtle brand icon */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('summary')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                Synapse
              </span>
            </button>

            {/* Quick Module Switcher Pill (Desktop) */}
            {currentModule && (
              <div className="hidden lg:block relative ml-2">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/60 max-w-[240px]"
                >
                  <span className="truncate">{currentModule.title}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Study Material
                    </div>
                    {modules.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSelectModule(m);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                          m.id === currentModule.id
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{m.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">{m.subject}</span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setActiveTab('library');
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium rounded flex items-center gap-1.5"
                      >
                        <Library className="w-3.5 h-3.5" />
                        View All in Library
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone 2: 4-5 single-line clean nav links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Summary
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'flashcards'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Flashcards
              {currentModule && (
                <span className="text-[11px] font-mono text-slate-400">
                  {currentModule.flashcards.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'quiz'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Practice Quiz
              {currentModule && (
                <span className="text-[11px] font-mono text-slate-400">
                  {currentModule.quiz.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'library'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Library className="w-4 h-4" />
              Library
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-98 transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Material</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
