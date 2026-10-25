import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SummaryView } from './components/SummaryView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizView } from './components/QuizView';
import { LibraryView } from './components/LibraryView';
import { MaterialUploader } from './components/MaterialUploader';
import { StudyModule } from './types/study';
import {
  getSavedModules,
  saveModule,
  deleteModule,
  getActiveModuleId,
  setActiveModuleId,
} from './utils/storage';

export default function App() {
  const [modules, setModules] = useState<StudyModule[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz' | 'library'>('summary');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    const loaded = getSavedModules();
    setModules(loaded);
    const initialId = getActiveModuleId();
    const found = loaded.find((m) => m.id === initialId);
    if (found) {
      setCurrentModuleId(found.id);
    } else if (loaded.length > 0) {
      setCurrentModuleId(loaded[0].id);
      setActiveModuleId(loaded[0].id);
    }
  }, []);

  const currentModule = modules.find((m) => m.id === currentModuleId) || modules[0] || null;

  const handleSelectModule = (mod: StudyModule) => {
    setCurrentModuleId(mod.id);
    setActiveModuleId(mod.id);
    setActiveTab('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateModule = (updated: StudyModule) => {
    const newModules = saveModule(updated);
    setModules(newModules);
  };

  const handleDeleteModule = (id: string) => {
    if (modules.length <= 1) {
      alert('You must have at least one study module in your library.');
      return;
    }
    if (confirm('Are you sure you want to delete this study module?')) {
      const remaining = deleteModule(id);
      setModules(remaining);
      if (currentModuleId === id) {
        setCurrentModuleId(remaining[0].id);
        setActiveModuleId(remaining[0].id);
      }
      showToast('Module deleted');
    }
  };

  const handleModuleCreated = (newMod: StudyModule) => {
    const updated = saveModule(newMod);
    setModules(updated);
    setCurrentModuleId(newMod.id);
    setActiveModuleId(newMod.id);
    setIsUploadOpen(false);
    setActiveTab('summary');
    showToast(`"${newMod.title}" generated successfully!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImportModule = (imported: StudyModule) => {
    const fresh: StudyModule = {
      ...imported,
      id: `module-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = saveModule(fresh);
    setModules(updated);
    setCurrentModuleId(fresh.id);
    setActiveModuleId(fresh.id);
    setActiveTab('summary');
    showToast(`Imported "${fresh.title}" into library!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        modules={modules}
        currentModule={currentModule}
        onSelectModule={handleSelectModule}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {activeTab === 'summary' && currentModule && (
          <SummaryView
            module={currentModule}
            onNavigateToCards={() => {
              setActiveTab('flashcards');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToQuiz={() => {
              setActiveTab('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'flashcards' && currentModule && (
          <FlashcardsView
            module={currentModule}
            onUpdateModule={handleUpdateModule}
            onNavigateToQuiz={() => {
              setActiveTab('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'quiz' && currentModule && (
          <QuizView
            module={currentModule}
            onUpdateModule={handleUpdateModule}
            onNavigateToSummary={() => {
              setActiveTab('summary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            modules={modules}
            currentModuleId={currentModuleId}
            onSelectModule={handleSelectModule}
            onDeleteModule={handleDeleteModule}
            onOpenUpload={() => setIsUploadOpen(true)}
            onImportModule={handleImportModule}
          />
        )}

        {!currentModule && (
          <div className="max-w-md mx-auto py-24 text-center px-4">
            <h2 className="text-xl font-bold mb-2">No Study Modules Found</h2>
            <p className="text-sm text-slate-500 mb-6">
              Upload your lecture notes, textbook excerpt, or document to start.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
            >
              Upload Material Now
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        currentModule={currentModule}
      />

      {/* Upload Material Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl">
            <MaterialUploader
              onModuleCreated={handleModuleCreated}
              onClose={() => setIsUploadOpen(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
