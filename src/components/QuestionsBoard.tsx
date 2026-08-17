import React, { useState } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Award,
  Video,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Layers,
  Flame,
  ArrowRight,
  Send,
  ShieldCheck,
  Zap,
  Code,
  Sigma,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, QuestionAnswer, UserProfile } from '../types';

interface QuestionsBoardProps {
  questions: Question[];
  currentUser: UserProfile;
  onAskQuestion: (newQuestion: Partial<Question>) => void;
  onStartLiveSession: (question: Question) => void;
  onUpvoteQuestion: (questionId: string) => void;
  onAddAnswer: (questionId: string, answer: Partial<QuestionAnswer>) => void;
  onAcceptAnswer: (questionId: string, answerId: string, bounty: number) => void;
  onOpenSocraticHint: (question: Question) => void;
}

const SUBJECT_CATEGORIES = [
  'Semua Mata Pelajaran',
  'Matematika',
  'Fisika',
  'Informatika / Coding',
  'Kimia',
  'Biologi',
  'Ekonomi',
  'Bahasa',
];

export const QuestionsBoard: React.FC<QuestionsBoardProps> = ({
  questions,
  currentUser,
  onAskQuestion,
  onStartLiveSession,
  onUpvoteQuestion,
  onAddAnswer,
  onAcceptAnswer,
  onOpenSocraticHint,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua Mata Pelajaran');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'bounty' | 'upvotes'>('newest');

  // Detail Modal / View
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Ask Question Modal
  const [showAskModal, setShowAskModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSubject, setNewSubject] = useState('Matematika');
  const [newSubTopic, setNewSubTopic] = useState('Kalkulus & Aljabar');
  const [newDifficulty, setNewDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit' | 'Olimpiade'>('Sedang');
  const [newRawEquation, setNewRawEquation] = useState('');
  const [newBountyCoins, setNewBountyCoins] = useState<number>(30);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // New Answer State
  const [answerContent, setAnswerContent] = useState('');
  const [answerSteps, setAnswerSteps] = useState<string[]>(['', '']);
  const [isVerifyingAi, setIsVerifyingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);

  // Filtered Questions
  const filteredQuestions = questions
    .filter((q) => {
      const matchSubject =
        selectedSubject === 'Semua Mata Pelajaran' || q.subject.toLowerCase() === selectedSubject.toLowerCase();
      const matchDifficulty = selectedDifficulty === 'Semua' || q.difficulty === selectedDifficulty;
      const matchSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.rawEquation && q.rawEquation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSubject && matchDifficulty && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'bounty') return b.bountyCoins - a.bountyCoins;
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // AI Auto Analysis for Ask Question
  const handleAiAutoAnalyze = async () => {
    if (!newTitle.trim()) return;
    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, body: newBody }),
      });
      const json = await res.json();
      if (json.data) {
        if (json.data.subject) setNewSubject(json.data.subject);
        if (json.data.subTopic) setNewSubTopic(json.data.subTopic);
        if (json.data.difficulty) setNewDifficulty(json.data.difficulty);
        if (json.data.detectedFormulas?.length > 0 && !newRawEquation) {
          setNewRawEquation(json.data.detectedFormulas[0]);
        }
        if (json.data.recommendedBounty) {
          setNewBountyCoins(Math.min(json.data.recommendedBounty, currentUser.temanCoins));
        }
      }
    } catch (e) {
      console.warn('AI analysis error', e);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    onAskQuestion({
      title: newTitle.trim(),
      description: newBody.trim(),
      rawEquation: newRawEquation.trim() || undefined,
      subject: newSubject,
      subTopic: newSubTopic,
      difficulty: newDifficulty,
      bountyCoins: newBountyCoins,
      bountyXp: newBountyCoins * 2.5,
      tags: [newSubject, newDifficulty, 'HomeworkHelp'],
    });

    setShowAskModal(false);
    setNewTitle('');
    setNewBody('');
    setNewRawEquation('');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleStepChange = (index: number, val: string) => {
    const next = [...answerSteps];
    next[index] = val;
    setAnswerSteps(next);
  };

  const addStepField = () => {
    setAnswerSteps((prev) => [...prev, '']);
  };

  const handleVerifyAnswerWithAi = async () => {
    if (!answerContent.trim() && answerSteps.every((s) => !s.trim())) return;
    setIsVerifyingAi(true);
    try {
      const fullSolution = `${answerContent}\nLangkah:\n${answerSteps.filter(Boolean).join('\n')}`;
      const res = await fetch('/api/ai/verify-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: selectedQuestion?.title + ' ' + selectedQuestion?.description,
          solution: fullSolution,
        }),
      });
      const json = await res.json();
      setAiFeedback(json.data || json.fallback);
    } catch (e) {
      console.warn('AI verify error', e);
    } finally {
      setIsVerifyingAi(false);
    }
  };

  const handlePostAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || (!answerContent.trim() && answerSteps.every((s) => !s.trim()))) return;

    const filteredSteps = answerSteps.filter((s) => s.trim().length > 0);
    onAddAnswer(selectedQuestion.id, {
      content: answerContent.trim() || 'Berikut adalah penjelasan langkah demi langkah:',
      stepByStep: filteredSteps.length > 0 ? filteredSteps : ['Selesaikan variabel utama dan substitusikan ke persamaan.'],
      aiValidation: aiFeedback || undefined,
    });

    setAnswerContent('');
    setAnswerSteps(['', '']);
    setAiFeedback(null);
    confetti({ particleCount: 60, spread: 70 });
  };

  return (
    <div id="questions-board" className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner: Mission & Ask CTA */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 border border-indigo-500/20 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs text-white border border-white/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300" /> Komunitas Tanya-Jawab Tugas
            </span>
            <span className="text-xs text-indigo-100">Gabungan StackOverflow + Brainly + Preply</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Tanya Tugas, Bantu Teman, Dapatkan Reward.
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Pecahkan soal rumit bersama teman sebaya melalui papan tulis interaktif, petunjuk Socratic tanpa spoiler, dan bimbingan langsung audio-visual.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3 z-10 w-full md:w-auto">
          <button
            id="btn-ask-question"
            onClick={() => setShowAskModal(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-700 text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl shadow-md transition"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Ajukan Soal Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
        {/* Search Input & Sort */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari soal kalkulus, redoks, dijkstra, rumus fisika, atau tag..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
            >
              <option value="newest">Terbaru</option>
              <option value="bounty">Bounty Koin Terbesar</option>
              <option value="upvotes">Upvotes Terbanyak</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
            >
              <option value="Semua">Semua Tingkat</option>
              <option value="Mudah">Mudah</option>
              <option value="Sedang">Sedang</option>
              <option value="Sulit">Sulit</option>
              <option value="Olimpiade">Olimpiade</option>
            </select>
          </div>
        </div>

        {/* Subject Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {SUBJECT_CATEGORIES.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${selectedSubject === subj ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200/60'}`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Feed List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 space-y-3 shadow-xs">
            <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada pertanyaan yang sesuai</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba gunakan kata kunci pencarian lain atau ajukan pertanyaan baru ke komunitas.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white hover:bg-slate-50/40 border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-3.5"
            >
              {/* Question Top Meta */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                    {q.subject}
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-slate-500 text-xs font-medium">{q.subTopic}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.difficulty === 'Mudah' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : q.difficulty === 'Sedang' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
                  >
                    {q.difficulty}
                  </span>
                </div>

                {/* Bounty Chip */}
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-bold text-amber-700">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>+{q.bountyCoins} Koin</span>
                  <span className="text-[10px] text-amber-600 font-normal">({q.bountyXp} XP)</span>
                </div>
              </div>

              {/* Title & Body Preview */}
              <div className="space-y-1.5 cursor-pointer" onClick={() => setSelectedQuestion(q)}>
                <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition leading-snug">
                  {q.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{q.description}</p>
              </div>

              {/* Raw Equation Box if exists */}
              {q.rawEquation && (
                <div className="bg-slate-50 border border-indigo-100 rounded-xl px-3.5 py-2 font-mono text-xs text-indigo-900 flex items-center gap-2 overflow-x-auto">
                  <Sigma className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{q.rawEquation}</span>
                </div>
              )}

              {/* Tags & Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3 flex-wrap text-xs">
                {/* Asker Info */}
                <div className="flex items-center gap-2.5">
                  <img
                    src={q.askerAvatar}
                    alt={q.askerName}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800">{q.askerName}</span>
                    <span className="text-[10px] text-slate-500">
                      {q.askerSchool} • {q.createdAt}
                    </span>
                  </div>
                </div>

                {/* Right Interactive Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpvoteQuestion(q.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${q.userUpvoted ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{q.upvotes}</span>
                  </button>

                  <button
                    onClick={() => onOpenSocraticHint(q)}
                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 px-3 py-1.5 rounded-lg font-semibold transition"
                    title="Petunjuk Socratic AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">AI Hint</span>
                  </button>

                  <button
                    onClick={() => onStartLiveSession(q)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-xs transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Buka Whiteboard</span>
                  </button>

                  <button
                    onClick={() => setSelectedQuestion(q)}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{q.answers.length} Jawaban</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Question Detail Modal (StackOverflow/Brainly Step by Step view) */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 text-slate-800">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-md">
                  {selectedQuestion.subject}
                </span>
                <span className="text-xs text-slate-500 font-medium">{selectedQuestion.subTopic}</span>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Question Info */}
              <div className="space-y-3">
                <h2 className="text-lg font-extrabold text-slate-900">{selectedQuestion.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedQuestion.description}</p>
                {selectedQuestion.rawEquation && (
                  <div className="bg-slate-50 border border-indigo-100 rounded-xl p-3 font-mono text-xs text-indigo-900">
                    {selectedQuestion.rawEquation}
                  </div>
                )}
              </div>

              {/* Action Buttons for this question */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-700 text-xs">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Bounty: <strong className="text-amber-600 font-bold">+{selectedQuestion.bountyCoins} TemanCoins</strong></span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onOpenSocraticHint(selectedQuestion);
                    }}
                    className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Petunjuk Socratic AI</span>
                  </button>
                  <button
                    onClick={() => {
                      onStartLiveSession(selectedQuestion);
                      setSelectedQuestion(null);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 shadow-xs transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Buka Sesi Live</span>
                  </button>
                </div>
              </div>

              {/* Answers Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Jawaban & Penjelasan Langkah demi Langkah ({selectedQuestion.answers.length})
                </h3>

                {selectedQuestion.answers.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-500">
                    Belum ada jawaban. Jadilah orang pertama yang membantu!
                  </div>
                ) : (
                  selectedQuestion.answers.map((ans) => (
                    <div
                      key={ans.id}
                      className={`p-4 rounded-xl border space-y-3 ${ans.isAccepted ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300' : 'bg-slate-50/80 border-slate-200'}`}
                    >
                      {/* Author Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={ans.authorAvatar}
                            alt={ans.authorName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{ans.authorName}</span>
                              {ans.isVerifiedByMentor && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Mentor Terverifikasi
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">{ans.authorSchool}</span>
                          </div>
                        </div>

                        {ans.isAccepted ? (
                          <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3" /> Solusi Diterima Asker
                          </span>
                        ) : (
                          <button
                            onClick={() => onAcceptAnswer(selectedQuestion.id, ans.id, selectedQuestion.bountyCoins)}
                            className="text-xs bg-white border border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-slate-700 font-semibold px-2.5 py-1 rounded-lg transition shadow-xs"
                          >
                            Terima Jawaban & Beri Bounty
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-xs text-slate-700 leading-relaxed">{ans.content}</p>

                      {/* Step by Step Breakdown */}
                      {ans.stepByStep && ans.stepByStep.length > 0 && (
                        <div className="space-y-1.5 bg-white border border-slate-200 p-3 rounded-xl">
                          <p className="text-[11px] font-bold text-indigo-700">Langkah Penurunan:</p>
                          <ol className="list-decimal list-inside space-y-1 text-slate-700 text-xs">
                            {ans.stepByStep.map((s, idx) => (
                              <li key={idx} className="leading-relaxed">
                                <span>{s}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* AI Verification Badge if present */}
                      {ans.aiValidation && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-[11px] text-indigo-900 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-indigo-800">
                              Evaluasi AI: Skor Kejelasan {ans.aiValidation.clarityScore}/10
                            </span>
                            <p className="text-slate-600">{ans.aiValidation.praise}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Submit Answer Form */}
              <form onSubmit={handlePostAnswer} className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-600" /> Tulis Penjelasan Kamu (Dapatkan Bounty & Honor XP)
                </h4>

                <textarea
                  rows={2}
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="Ringkasan konsep awal atau penjelasan singkat..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-3 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />

                {/* Dynamic Step Fields */}
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-slate-600">Langkah Demi Langkah (Step-by-step):</label>
                  {answerSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-right font-mono text-slate-400 text-xs">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        placeholder={`Langkah ${idx + 1}...`}
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-1.5 rounded-lg focus:bg-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addStepField}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold ml-7"
                  >
                    + Tambah Langkah Lain
                  </button>
                </div>

                {/* AI Pre-validation Feedback */}
                {aiFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Evaluasi AI Selesai (Skor: {aiFeedback.clarityScore}/10)
                    </p>
                    <p className="text-slate-600">{aiFeedback.praise}</p>
                    {aiFeedback.improvementTip && (
                      <p className="text-amber-700 text-[11px]">Saran: {aiFeedback.improvementTip}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleVerifyAnswerWithAi}
                    disabled={isVerifyingAi}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isVerifyingAi ? 'Memeriksa...' : 'Cek Kejelasan Jawaban dengan AI'}</span>
                  </button>

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-sm"
                  >
                    Kirim Jawaban
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ajukan Soal Tugas Baru</h3>
                <p className="text-xs text-slate-500">
                  Dapatkan bantuan kolaboratif dari teman sebaya dan mentor terverifikasi.
                </p>
              </div>
              <button
                onClick={() => setShowAskModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAskSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-slate-700 font-medium">Judul / Pertanyaan Pokok:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Bagaimana cara menghitung momen inersia silinder pejal?"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* AI Auto Tagging Assist Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAiAutoAnalyze}
                  disabled={isAiAnalyzing || !newTitle}
                  className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-bold bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isAiAnalyzing ? 'Menganalisis soal...' : 'Auto-Deteksi Tag & Rumus dengan AI'}</span>
                </button>
              </div>

              {/* Subject & Subtopic */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Mata Pelajaran:</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-2 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Fisika">Fisika</option>
                    <option value="Informatika / Coding">Informatika / Coding</option>
                    <option value="Kimia">Kimia</option>
                    <option value="Biologi">Biologi</option>
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Bahasa">Bahasa</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-medium">Tingkat Kesulitan:</label>
                  <select
                    value={newDifficulty}
                    onChange={(e: any) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-2 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sulit">Sulit</option>
                    <option value="Olimpiade">Olimpiade</option>
                  </select>
                </div>
              </div>

              {/* Equation input */}
              <div className="space-y-1">
                <label className="text-slate-700 font-medium">Persamaan Matematika / Rumus (Opsional):</label>
                <input
                  type="text"
                  value={newRawEquation}
                  onChange={(e) => setNewRawEquation(e.target.value)}
                  placeholder="Contoh: I = 1/2 * m * r^2 atau \lim_{x \to 0}..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs px-3.5 py-2 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label className="text-slate-700 font-medium">Detail Kendala / Yang Sudah Dicoba:</label>
                <textarea
                  rows={3}
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Jelaskan di langkah mana kamu mengalami kebingungan..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-3 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Bounty slider */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Pasang Bounty TemanCoins:
                  </span>
                  <span className="font-bold text-amber-600">+{newBountyCoins} Koin</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max={Math.max(50, currentUser.temanCoins)}
                  step="5"
                  value={newBountyCoins}
                  onChange={(e) => setNewBountyCoins(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Bounty lebih tinggi menarik bantuan mentor rekan lebih cepat. Saldo Anda: {currentUser.temanCoins} Koin.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-md transition"
                >
                  Posting Soal Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
