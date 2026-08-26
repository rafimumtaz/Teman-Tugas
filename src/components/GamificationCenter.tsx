import React, { useState } from 'react';
import {
  Award,
  Trophy,
  Flame,
  Star,
  CheckCircle2,
  Sparkles,
  Heart,
  Gift,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe,
  Wifi,
  FileCheck2,
  Palette,
  Users,
  Sigma,
  Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, GamificationReward, LeaderboardUser } from '../types';

interface GamificationCenterProps {
  currentUser: UserProfile;
  rewards: GamificationReward[];
  leaderboard: LeaderboardUser[];
  onClaimReward: (rewardId: string, cost: number) => void;
}

export const GamificationCenter: React.FC<GamificationCenterProps> = ({
  currentUser,
  rewards,
  leaderboard,
  onClaimReward,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard' | 'rewards' | 'impact'>('badges');
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  const xpPercent = Math.min(100, Math.round((currentUser.xp / currentUser.xpToNextLevel) * 100));

  const handleClaim = (r: GamificationReward) => {
    if (currentUser.temanCoins < r.costCoins) {
      alert(`Saldo TemanCoins tidak mencukupi (${currentUser.temanCoins}/${r.costCoins}). Terus bantu teman untuk mengumpulkan koin!`);
      return;
    }
    onClaimReward(r.id, r.costCoins);
    setClaimedNotice(`Selamat! ${r.title} berhasil ditukarkan.`);
    confetti({ particleCount: 70, spread: 80 });
    setTimeout(() => setClaimedNotice(null), 4000);
  };

  return (
    <div id="gamification-center" className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Notice Banner */}
      {claimedNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{claimedNotice}</span>
          </div>
          <button onClick={() => setClaimedNotice(null)} className="text-white/80 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Gamified Profile Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-800 border border-indigo-600/30 rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* User Avatar & Level */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/80 shadow-md"
              />
              <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 text-xs font-black px-2 py-0.5 rounded-full shadow ring-2 ring-indigo-800">
                Lv. {currentUser.level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">{currentUser.name}</h2>
                <span className="bg-white/20 text-white border border-white/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Senior Peer Tutor
                </span>
              </div>
              <p className="text-xs text-indigo-100">{currentUser.universityOrSchool}</p>

              {/* Level XP Bar */}
              <div className="pt-2 w-56 sm:w-72">
                <div className="flex justify-between text-[10px] text-indigo-100 mb-1 font-medium">
                  <span>Progres Level {currentUser.level}</span>
                  <span className="text-amber-300 font-bold">
                    {currentUser.xp} / {currentUser.xpToNextLevel} XP ({xpPercent}%)
                  </span>
                </div>
                <div className="w-full bg-black/25 h-2 rounded-full overflow-hidden border border-white/20">
                  <div
                    style={{ width: `${xpPercent}%` }}
                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics (Coins, Streak, Honor) */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            {/* Coins */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-center space-y-1">
              <Award className="w-5 h-5 mx-auto text-amber-300" />
              <div className="text-base font-extrabold text-amber-300">{currentUser.temanCoins}</div>
              <div className="text-[10px] text-indigo-100 uppercase font-semibold">TemanCoins</div>
            </div>

            {/* Streak */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-center space-y-1">
              <Flame className="w-5 h-5 mx-auto text-amber-400 animate-pulse" />
              <div className="text-base font-extrabold text-white">{currentUser.streakDays} Hari</div>
              <div className="text-[10px] text-indigo-100 uppercase font-semibold">Streak Belajar</div>
            </div>

            {/* Honor Score */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-center space-y-1">
              <Sparkles className="w-5 h-5 mx-auto text-emerald-300" />
              <div className="text-base font-extrabold text-emerald-300">{currentUser.honorScore}</div>
              <div className="text-[10px] text-indigo-100 uppercase font-semibold">Skor Honor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border border-slate-200/80 bg-slate-100/80 rounded-2xl p-1.5 gap-1.5 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === 'badges' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Award className="w-4 h-4" />
          <span>Lencana Mentor ({currentUser.badges.filter((b) => b.unlocked).length}/{currentUser.badges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Trophy className="w-4 h-4" />
          <span>Papan Peringkat Mingguan</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === 'rewards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Gift className="w-4 h-4" />
          <span>Tukar Koin & Reward</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === 'impact' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Globe className="w-4 h-4" />
          <span>Dampak Sosial Komunitas</span>
        </button>
      </div>

      {/* Tab 1: Badges Showcase */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentUser.badges.map((b) => {
            const isUnlocked = b.unlocked;
            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between space-y-3 ${isUnlocked ? 'bg-white border-amber-200/90 shadow-xs hover:shadow-md' : 'bg-slate-50/70 border-slate-200 opacity-60'}`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner ${isUnlocked ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-300' : 'bg-slate-200 text-slate-400'}`}
                  >
                    {b.icon === 'SquareSigma' ? <Sigma className="w-6 h-6" /> : b.icon === 'Sparkles' ? <Sparkles className="w-6 h-6 text-amber-500" /> : b.icon === 'Flame' ? <Flame className="w-6 h-6 text-orange-500" /> : b.icon === 'Moon' ? <Moon className="w-6 h-6 text-indigo-500" /> : <Award className="w-6 h-6 text-emerald-500" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{b.name}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${b.tier === 'diamond' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : b.tier === 'gold' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
                      >
                        {b.tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Progres</span>
                    <span className={isUnlocked ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                      {b.progress} / {b.maxProgress} {isUnlocked && '✓ Terbuka'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      style={{ width: `${Math.min(100, (b.progress / b.maxProgress) * 100)}%` }}
                      className={`h-full rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Pahlawan Bantuan Teman Sebaya (Minggu Ini)
            </h3>
            <span className="text-xs text-slate-500">Direset tiap Minggu Pukul 23:59 WIB</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {leaderboard.map((u) => (
              <div
                key={u.id}
                className={`p-4 flex items-center justify-between gap-4 transition ${u.name.includes('(Anda)') ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'}`}
              >
                {/* Rank & User Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.rank === 1 ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300' : u.rank === 2 ? 'bg-slate-200 text-slate-700' : u.rank === 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {u.rank}
                  </div>

                  <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />

                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-xs sm:text-sm">{u.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{u.school}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <span className="text-slate-800 font-bold">{u.solvedCount}</span>
                    <p className="text-[10px] text-slate-500">Soal Terbantu</p>
                  </div>

                  <div>
                    <span className="text-emerald-600 font-bold">{u.honorScore}</span>
                    <p className="text-[10px] text-slate-500">Skor Honor</p>
                  </div>

                  <div className="hidden md:block">
                    <span className="text-amber-600 font-bold">+{u.coinsEarned}</span>
                    <p className="text-[10px] text-slate-500">Koin Diperoleh</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Rewards Store */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rewards.map((r) => {
            const canAfford = currentUser.temanCoins >= r.costCoins;
            return (
              <div
                key={r.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    {r.icon === 'Wifi' ? (
                      <Wifi className="w-6 h-6 text-emerald-600" />
                    ) : r.icon === 'FileCheck2' ? (
                      <FileCheck2 className="w-6 h-6 text-indigo-600" />
                    ) : r.icon === 'Palette' ? (
                      <Palette className="w-6 h-6 text-amber-600" />
                    ) : (
                      <Award className="w-6 h-6 text-cyan-600" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm font-extrabold text-amber-600 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {r.costCoins} TemanCoins
                  </span>

                  <button
                    onClick={() => handleClaim(r)}
                    disabled={r.claimed}
                    className={`text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs ${r.claimed ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : canAfford ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {r.claimed ? 'Sudah Diklaim' : canAfford ? 'Tukarkan Sekarang' : 'Koin Belum Cukup'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Social Impact */}
      {activeTab === 'impact' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs text-xs">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Manifesto: "How Can Technology Help People Help Each Other?"
            </h3>
            <p className="text-slate-600 leading-relaxed">
              TemanTugas dirancang dengan prinsip bahwa bantuan belajar yang efektif bukan dengan memberikan contekan instan, melainkan membangun ekosistem kolaboratif peer-to-peer di mana mahasiswa saling membimbing lewat intuisi konsep.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
              <span className="text-2xl font-black text-emerald-600">14,280+</span>
              <p className="font-bold text-slate-800">Soal Berhasil Dipecahkan</p>
              <p className="text-[11px] text-slate-500">Melalui whiteboard & bimbingan Socratic.</p>
            </div>

            <div className="bg-slate-50 border border-indigo-200 rounded-2xl p-4 space-y-1">
              <span className="text-2xl font-black text-indigo-600">850 GB</span>
              <p className="font-bold text-slate-800">Paket Kuota Belajar Terdonasi</p>
              <p className="text-[11px] text-slate-500">Hasil konversi TemanCoins para mentor rekan.</p>
            </div>

            <div className="bg-slate-50 border border-amber-200 rounded-2xl p-4 space-y-1">
              <span className="text-2xl font-black text-amber-600">98.4%</span>
              <p className="font-bold text-slate-800">Tingkat Kepuasan Pemahaman</p>
              <p className="text-[11px] text-slate-500">Siswa paham konsep inti setelah sesi live.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
