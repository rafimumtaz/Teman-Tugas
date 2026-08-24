import React from 'react';
import {
  BookOpen,
  Presentation,
  Users,
  Trophy,
  Award,
  Flame,
  Sparkles,
  PlusCircle,
  GraduationCap,
  Zap,
  User,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '../app/actions/auth';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: 'questions' | 'whiteboard' | 'mentors' | 'gamification';
  onSelectTab: (tab: 'questions' | 'whiteboard' | 'mentors' | 'gamification') => void;
  currentUser: UserProfile;
  onToggleRole: () => void;
  onOpenProfile?: () => void;
  activeRoomActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onToggleRole,
  onOpenProfile,
  activeRoomActive,
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div
          onClick={() => onSelectTab('questions')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                TemanTugas
              </span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                P2P
              </span>
            </div>
            <p className="text-[10px] text-slate-500 -mt-0.5 hidden sm:block">
              How tech helps people help each other
            </p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 border border-slate-200/70 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => onSelectTab('questions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${currentTab === 'questions' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tanya Tugas</span>
          </button>

          <button
            onClick={() => onSelectTab('whiteboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition relative cursor-pointer ${currentTab === 'whiteboard' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80'}`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Papan Tulis & Live</span>
            {activeRoomActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-2 right-2" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('mentors')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${currentTab === 'mentors' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80'}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Cari Mentor</span>
          </button>

          <button
            onClick={() => onSelectTab('gamification')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer ${currentTab === 'gamification' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80'}`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Peringkat & Hadiah</span>
          </button>
        </nav>

        {/* Right Gamification & Profile Status */}
        <div className="flex items-center gap-2.5">
          {/* Active Mode Switcher Pill */}
          <button
            onClick={onToggleRole}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition cursor-pointer ${currentUser.activeRole === 'mentor' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'}`}
            title="Klik untuk beralih mode Siswa / Mentor"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{currentUser.activeRole === 'mentor' ? 'Mode: Mentor Aktif' : 'Mode: Belajar'}</span>
          </button>

          {/* Reputation Points Pill */}
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-1 bg-amber-50 border border-amber-200 hover:border-amber-400 px-2.5 py-1.5 rounded-xl cursor-pointer transition text-xs font-bold text-amber-700 shadow-xs group"
            title="Poin Reputasi Anda (Klik untuk melihat profil)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
            <span>{(currentUser.reputationPoints || 0).toLocaleString('id-ID')}</span>
          </div>

          {/* Streak Flame */}
          <div
            onClick={() => onSelectTab('gamification')}
            className="flex items-center gap-1 bg-white border border-orange-200/80 hover:border-orange-300 px-2.5 py-1.5 rounded-xl cursor-pointer transition text-xs font-bold text-orange-600 shadow-xs"
            title={`${currentUser.streakDays} hari beruntun!`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>{currentUser.streakDays}</span>
          </div>

          {/* TemanCoins Pill */}
          <div
            onClick={() => onSelectTab('gamification')}
            className="flex items-center gap-1 bg-white border border-amber-200/80 hover:border-amber-300 px-2.5 py-1.5 rounded-xl cursor-pointer transition text-xs font-bold text-amber-600 shadow-xs"
            title="Saldo TemanCoins Anda"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>{currentUser.temanCoins}</span>
          </div>

          {/* User Avatar + Level (Opens Profile) */}
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
            title="Buka Profil Saya & Riwayat Bantuan"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500 group-hover:ring-2 group-hover:ring-indigo-400 transition shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-900 text-[9px] font-black px-1 rounded-full ring-1 ring-white">
                {currentUser.level}
              </span>
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold leading-none">
                @{currentUser.username || 'profil'}
              </span>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors border border-slate-200 shadow-xs cursor-pointer"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 py-2 px-2 text-[10px] font-semibold text-slate-500">
        <button
          onClick={() => onSelectTab('questions')}
          className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${currentTab === 'questions' ? 'text-indigo-600 font-bold' : ''}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Tugas</span>
        </button>

        <button
          onClick={() => onSelectTab('whiteboard')}
          className={`flex flex-col items-center gap-1 p-1 relative cursor-pointer ${currentTab === 'whiteboard' ? 'text-indigo-600 font-bold' : ''}`}
        >
          <Presentation className="w-4 h-4" />
          <span>Whiteboard</span>
          {activeRoomActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-3" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('mentors')}
          className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${currentTab === 'mentors' ? 'text-indigo-600 font-bold' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>Mentor</span>
        </button>

        <button
          onClick={() => onSelectTab('gamification')}
          className={`flex flex-col items-center gap-1 p-1 cursor-pointer ${currentTab === 'gamification' ? 'text-indigo-600 font-bold' : ''}`}
        >
          <Trophy className="w-4 h-4" />
          <span>Reward</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center gap-1 p-1 cursor-pointer text-indigo-600 font-bold"
        >
          <User className="w-4 h-4" />
          <span>Profil</span>
        </button>
      </div>
    </header>
  );
};

