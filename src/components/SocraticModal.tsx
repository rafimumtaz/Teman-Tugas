import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Video,
  Lightbulb,
  Sigma,
  BookOpen,
  Brain,
  Smile
} from 'lucide-react';
import { Question } from '../types';

interface SocraticModalProps {
  question: Question | null;
  onClose: () => void;
  onOpenWhiteboardWithHint: (question: Question, initialHintFormula?: string) => void;
}

export const SocraticModal: React.FC<SocraticModalProps> = ({
  question,
  onClose,
  onOpenWhiteboardWithHint,
}) => {
  const [loading, setLoading] = useState(true);
  const [hintData, setHintData] = useState<any>(null);
  const [currentStepText, setCurrentStepText] = useState('');

  useEffect(() => {
    if (!question) return;
    let isMounted = true;
    setLoading(true);

    async function fetchSocraticHint() {
      try {
        const res = await fetch('/api/ai/socratic-hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionTitle: question?.title,
            questionBody: question?.description,
            subject: question?.subject,
            currentStep: currentStepText || 'Memulai penurunan konsep awal',
          }),
        });
        const json = await res.json();
        if (isMounted) {
          setHintData(json.data || json.fallback);
        }
      } catch (err) {
        console.warn('Failed to fetch Socratic hint', err);
        if (isMounted) {
          setHintData({
            hintSummary: 'Uraikan variabel yang diketahui dan turunkan rumus dasar terlebih dahulu.',
            guidingQuestions: [
              'Apa variabel atau konstanta fisis/matematis yang telah diberikan di soal?',
              'Persamaan diferensial atau hukum kesetimbangan apa yang menghubungkan besaran-besaran tersebut?',
            ],
            keyConcept: 'Dekomposisi Analitis & Intuisi Konseptual',
            nextActionableStep: 'Tuliskan persamaan pokok di pojok kiri atas whiteboard.',
            encouragement: 'Langkah pertama yang terstruktur adalah kunci pemecahan soal rumit!',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSocraticHint();
    return () => {
      isMounted = false;
    };
  }, [question]);

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto text-xs text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Socratic AI Homework Guide</h3>
              <p className="text-[11px] text-indigo-600 font-semibold">Bimbingan Bertahap Tanpa Spoiler Jawaban Langsung</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Question Snapshot */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-700">{question.subject} • {question.subTopic}</span>
          <h4 className="text-xs font-bold text-slate-900">{question.title}</h4>
          {question.rawEquation && (
            <div className="font-mono text-indigo-800 text-[11px] pt-1">
              Rumus: {question.rawEquation}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-600">Menyusun petunjuk Socratic analitis untuk Anda...</p>
          </div>
        ) : (
          hintData && (
            <div className="space-y-4">
              {/* Hint Summary */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Petunjuk Arah Berpikir:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{hintData.hintSummary}</p>
              </div>

              {/* Guiding Questions */}
              {hintData.guidingQuestions && hintData.guidingQuestions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-600" />
                    Pertanyaan Pemantik Untuk Anda Pikirkan:
                  </h5>
                  <ul className="space-y-1.5">
                    {hintData.guidingQuestions.map((qText: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700">
                        <span className="text-indigo-600 font-bold font-mono">Q{i + 1}:</span>
                        <span>{qText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Next Step */}
              {hintData.nextActionableStep && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">Langkah Konkret di Whiteboard:</span>
                  <p className="text-slate-700 font-medium">{hintData.nextActionableStep}</p>
                </div>
              )}

              {/* Encouragement */}
              {hintData.encouragement && (
                <p className="text-[11px] text-slate-500 italic flex items-center gap-1 justify-center">
                  <Smile className="w-3.5 h-3.5 text-amber-500" /> "{hintData.encouragement}"
                </p>
              )}
            </div>
          )
        )}

        {/* Modal Bottom Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              onOpenWhiteboardWithHint(question, question.rawEquation || hintData?.nextActionableStep);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Terapkan di Whiteboard Live</span>
          </button>
        </div>
      </div>
    </div>
  );
};
