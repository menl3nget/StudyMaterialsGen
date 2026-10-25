import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  File,
  Image as ImageIcon,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { GenerationOptions, StudyModule } from '../types/study';
import { SAMPLE_MODULES } from '../data/sampleModules';

interface MaterialUploaderProps {
  onModuleCreated: (module: StudyModule) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const MaterialUploader: React.FC<MaterialUploaderProps> = ({
  onModuleCreated,
  onClose,
  isModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'presets'>('text');
  const [textInput, setTextInput] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    file: globalThis.File;
    base64?: string;
    mimeType: string;
    textPreview?: string;
  } | null>(null);

  const [options, setOptions] = useState<GenerationOptions>({
    depth: 'comprehensive',
    cardCount: 12,
    quizCount: 8,
  });
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'Parsing document & extracting core principles...',
    'Synthesizing executive summary & structured mindmap...',
    'Generating active-recall flashcards & memory cues...',
    'Formulating practice quiz & pedagogical rationales...',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: globalThis.File) => {
    setErrorMessage(null);
    if (!moduleTitle) {
      // Auto-populate title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setModuleTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setSelectedFile({
          file,
          mimeType: 'text/plain',
          textPreview: text.slice(0, 300),
        });
        setTextInput(text);
      };
      reader.readAsText(file);
    } else {
      // For PDF, DOCX, or images
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1] || result;
        setSelectedFile({
          file,
          base64: base64Data,
          mimeType: file.type || 'application/pdf',
          textPreview: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !selectedFile) {
      setErrorMessage('Please provide source text or upload a material file.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2800);

    try {
      const payload: any = {
        title: moduleTitle.trim(),
        text: textInput.trim(),
        options: {
          ...options,
          difficulty,
        },
      };

      if (selectedFile && selectedFile.base64) {
        payload.file = {
          data: selectedFile.base64,
          mimeType: selectedFile.mimeType,
          fileName: selectedFile.file.name,
        };
      }

      const res = await fetch('/api/generate-study-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate study materials');
      }

      onModuleCreated(data);
      if (onClose) onClose();
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Generation failed:', err);
      setErrorMessage(
        err.message || 'An error occurred during generation. Check your server or API configuration.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPreset = (preset: StudyModule) => {
    // Clone preset with fresh timestamp
    const cloned: StudyModule = {
      ...preset,
      id: `module-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    onModuleCreated(cloned);
    if (onClose) onClose();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              Generate Study Materials
            </h2>
            <p className="text-xs text-slate-500">
              Upload modules, notes, or slides to extract summaries, flashcards & quizzes
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isGenerating ? (
        /* Progress Overlay */
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            Analyzing Your Study Material
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm">
            Gemini is reading and structuring concepts tailored for optimal spaced repetition and recall.
          </p>

          <div className="w-full max-w-md bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2.5 w-full max-w-md text-left">
            {steps.map((st, idx) => (
              <div
                key={st}
                className={`flex items-center gap-2.5 text-xs transition-opacity ${
                  idx === currentStep
                    ? 'text-indigo-700 font-semibold opacity-100'
                    : idx < currentStep
                    ? 'text-emerald-600 opacity-90'
                    : 'text-slate-400 opacity-40'
                }`}
              >
                {idx < currentStep ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : idx === currentStep ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{st}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Module Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Module or Subject Title (Optional)
            </label>
            <input
              type="text"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="e.g., Organic Chemistry: Reaction Mechanisms"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Mode Tabs: Paste Text vs Upload File vs Try Preset */}
          <div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'text'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Text / Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'file'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload PDF / File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'presets'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Sample Presets
              </button>
            </div>

            {/* Tab 1: Paste Text */}
            {activeTab === 'text' && (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste lecture notes, book chapters, article text, syllabus concepts, or study notes here..."
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tip: The richer and more detailed the text, the deeper the generated materials.</span>
                  <span>{textInput.trim() ? textInput.trim().split(/\s+/).length : 0} words</span>
                </div>
              </div>
            )}

            {/* Tab 2: Upload File (PDF, Docs, Image) */}
            {activeTab === 'file' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md,.doc,.docx,image/*"
                  className="hidden"
                />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-indigo-400 bg-indigo-50/40'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Click or drag & drop documents or lecture slides
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports PDF, TXT, Markdown, DOCX, and slide images (PNG, JPG)
                      </p>
                    </div>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-medium text-indigo-950 truncate">
                        {selectedFile.file.name}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-mono">
                        ({(selectedFile.file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Presets */}
            {activeTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-2">
                  Select a ready-to-study module to test the summary, flashcards, and quiz engine immediately:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SAMPLE_MODULES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectPreset(sample)}
                      className="p-3 text-left border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/40 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
                          {sample.subject}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-900">
                          {sample.title}
                        </h4>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{sample.flashcards.length} cards</span>
                        <span className="text-indigo-600 font-medium">Load &rarr;</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Customization Toggle */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                Custom Generation Settings
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-3.5">
                {/* Depth */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Study Depth & Focus
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'concise', label: 'Concise (High-Yield)' },
                      { key: 'comprehensive', label: 'Comprehensive' },
                      { key: 'exam-prep', label: 'Exam Drill Focus' },
                    ].map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setOptions({ ...options, depth: d.key as any })}
                        className={`py-1.5 px-2 text-[11px] rounded-lg border text-center transition-all ${
                          options.depth === d.key
                            ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty & Counts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced / Honors</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Flashcard Count ({options.cardCount})
                    </label>
                    <input
                      type="range"
                      min={6}
                      max={20}
                      step={2}
                      value={options.cardCount}
                      onChange={(e) =>
                        setOptions({ ...options, cardCount: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Quiz Questions ({options.quizCount})
                    </label>
                    <input
                      type="range"
                      min={4}
                      max={15}
                      step={1}
                      value={options.quizCount}
                      onChange={(e) =>
                        setOptions({ ...options, quizCount: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isGenerating || (!textInput.trim() && !selectedFile)}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Study Materials</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
