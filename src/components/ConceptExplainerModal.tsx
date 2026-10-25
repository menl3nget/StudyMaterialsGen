import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, Lightbulb, Loader2, Copy, Check } from 'lucide-react';

interface ConceptExplainerModalProps {
  concept: string;
  context?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ConceptExplainerModal: React.FC<ConceptExplainerModalProps> = ({
  concept,
  context,
  isOpen,
  onClose,
}) => {
  const [style, setStyle] = useState<'simple' | 'eli5'>('eli5');
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !concept) return;

    let isMounted = true;
    async function fetchExplanation() {
      setLoading(true);
      setError(null);
      setExplanation('');
      try {
        const res = await fetch('/api/explain-concept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concept, context, style }),
        });
        const data = await res.json();
        if (isMounted) {
          if (data.explanation) {
            setExplanation(data.explanation);
          } else {
            setError(data.error || 'Failed to generate explanation.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Network error fetching explanation.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchExplanation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, concept, context, style]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">AI Concept Tutor</span>
              <h3 className="text-base font-bold text-slate-900 leading-tight truncate max-w-[280px]">
                {concept}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Style Selector Tabs */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setStyle('eli5')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                style === 'eli5'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Intuitive Analogy (ELI5)
            </button>
            <button
              onClick={() => setStyle('simple')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                style === 'simple'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Academic Precision
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
              <p className="text-sm">Synthesizing intuitive explanation with Gemini...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-[15px]">
              {explanation}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-400">
            Powered by Gemini 3.8 Flash
          </span>
          <div className="flex items-center gap-2">
            {explanation && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
