import React from 'react';
import { BookOpen, Layers, CheckSquare, Library, Plus } from 'lucide-react';
import { StudyModule } from '../types/study';

interface MobileBottomNavProps {
  activeTab: 'summary' | 'flashcards' | 'quiz' | 'library';
  setActiveTab: (tab: 'summary' | 'flashcards' | 'quiz' | 'library') => void;
  onOpenUpload: () => void;
  currentModule: StudyModule | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  currentModule,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around gap-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'summary' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative ${
            activeTab === 'flashcards' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Cards</span>
          {currentModule && (
            <span className="absolute top-0 right-1 text-[9px] font-mono font-medium text-slate-400">
              {currentModule.flashcards.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenUpload}
          className="flex flex-col items-center justify-center p-2 rounded-full bg-indigo-600 text-white shadow-md active:scale-95 transition-transform -mt-3"
          aria-label="Upload material"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative ${
            activeTab === 'quiz' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Quiz</span>
          {currentModule && (
            <span className="absolute top-0 right-1 text-[9px] font-mono font-medium text-slate-400">
              {currentModule.quiz.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors ${
            activeTab === 'library' ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Library</span>
        </button>
      </div>
    </div>
  );
};
