import React, { useState } from 'react';
import {
  Search,
  Star,
  ShieldCheck,
  Video,
  Clock,
  Award,
  Zap,
  BookOpen,
  CheckCircle,
  Calendar,
  Sparkles,
  Users,
  Heart,
  Filter,
  User,
  GraduationCap
} from 'lucide-react';
import { MentorProfile, UserProfile } from '../types';

interface MentorMarketplaceProps {
  mentors: MentorProfile[];
  currentUser: UserProfile;
  onRequestInstantSession: (mentor: MentorProfile) => void;
  onBecomeMentorClick: () => void;
  onViewMentorProfile?: (mentor: MentorProfile) => void;
}

export const MentorMarketplace: React.FC<MentorMarketplaceProps> = ({
  mentors,
  currentUser,
  onRequestInstantSession,
  onBecomeMentorClick,
  onViewMentorProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Semua');
  const [onlyOnline, setOnlyOnline] = useState(false);

  const specialtiesList = [
    'Semua',
    'Kalkulus',
    'Fisika Dasar',
    'Algoritma & Struktur Data',
    'Kimia Organik',
    'Aljabar Linear',
    'Termodinamika',
  ];

  const filteredMentors = mentors.filter((m) => {
    if (m.id === currentUser.id) return false; // Prevent mentors from arranging a session with themselves

    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.username && m.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.academicLevel && m.academicLevel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchSpecialty =
      selectedSpecialty === 'Semua' || m.specialties.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
    const matchOnline = !onlyOnline || m.isOnline;
    return matchSearch && matchSpecialty && matchOnline;
  });

  return (
    <div id="mentor-marketplace" className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Banner (Preply-Style Peer Tutoring) */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 border border-emerald-500/20 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs text-white border border-white/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-200" /> Peer Mentorship Matching
            </span>
            <span className="text-xs text-emerald-100">1-on-1 Low Latency Video & Whiteboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Temukan Mentor Rekan Sebaya Terbaik Anda
          </h1>
          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
            Belajar 1-on-1 secara langsung dengan mahasiswa berprestasi dan peraih medali olimpiade. Selesaikan soal buntu dalam hitungan menit.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={onBecomeMentorClick}
            className="bg-white hover:bg-slate-50 text-emerald-800 text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Gabung Jadi Mentor Rekan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama mentor, handle @username, kampus (UI/ITB/UGM), atau topik..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyOnline}
              onChange={(e) => setOnlyOnline(e.target.checked)}
              className="rounded accent-emerald-600"
            />
            <span className="font-medium">Online & Siap Sesi Instan</span>
          </label>
        </div>

        {/* Specialty Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {specialtiesList.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${selectedSpecialty === spec ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200/60'}`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMentors.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md space-y-4 transition flex flex-col justify-between"
          >
            {/* Top Info */}
            <div className="flex items-start gap-4">
              <div
                className="relative cursor-pointer group"
                onClick={() => onViewMentorProfile && onViewMentorProfile(m)}
              >
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs group-hover:scale-105 transition"
                />
                {m.isOnline && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white"
                    title="Online sekarang"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => onViewMentorProfile && onViewMentorProfile(m)}
                    className="cursor-pointer group flex items-center gap-1.5 min-w-0"
                  >
                    <h3 className="text-base font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition">
                      {m.name}
                    </h3>
                    {m.username && (
                      <span className="text-xs text-slate-400 font-semibold truncate">@{m.username}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-xs font-bold text-amber-700 shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{m.rating}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({m.reviewsCount})</span>
                  </div>
                </div>

                {/* Academic Level */}
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium truncate mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{m.academicLevel || m.school}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {(m.reputationPoints || 1200).toLocaleString('id-ID')} Poin Reputasi
                  </span>
                  <span>•</span>
                  <span>{m.totalSessions} sesi bimbingan</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold">{m.successRate || 98}% Berhasil</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{m.bio}</p>

            {/* Specialties Badges */}
            <div className="flex flex-wrap gap-1.5">
              {m.specialties.map((s, idx) => (
                <span
                  key={idx}
                  className="bg-slate-50 border border-slate-200/80 text-slate-700 font-medium text-[11px] px-2.5 py-0.5 rounded-md"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Bottom Actions & Price */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3 flex-wrap">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-medium uppercase">Tarif Sesi Whiteboard</span>
                <span className="text-sm font-extrabold text-amber-600 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {m.hourlyCoins} TemanCoins <span className="text-xs font-normal text-slate-400">/ jam</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onViewMentorProfile && (
                  <button
                    onClick={() => onViewMentorProfile(m)}
                    className="text-xs font-bold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    Lihat Profil & Riwayat
                  </button>
                )}
                <button
                  onClick={() => onRequestInstantSession(m)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Mulai Sesi Langsung</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

