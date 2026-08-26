import React from 'react';
import { UserProfile } from '../types';
import { Bell, Settings, Award, Flame, Zap, Trophy, Users, BookOpen, Clock } from 'lucide-react';

interface RightSidebarProps {
  currentUser: UserProfile;
  onOpenProfile: () => void;
  onSelectTab: (tab: 'gamification' | 'questions') => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ currentUser, onOpenProfile, onSelectTab }) => {
  // Mock data for activity chart mimicking the design
  const activityData = [
    { label: 'Sen', value: 30, color: '#fca5a5' }, // Red-ish pastel
    { label: 'Sel', value: 45, color: '#fde047' }, // Yellow pastel
    { label: 'Rab', value: 25, color: '#a7f3d0' }, // Green pastel
    { label: 'Kam', value: 60, color: '#c4b5fd' }, // Purple pastel
    { label: 'Jum', value: 75, color: '#93c5fd' }, // Blue pastel
    { label: 'Sab', value: 40, color: '#fed7aa' }, // Orange pastel
    { label: 'Min', value: 90, color: '#1e1b4b', active: true }, // Dark/Active
  ];

  const recentActivities = [
    { id: 1, title: 'Kalkulus Lanjut', desc: 'Turunan Parsial', icon: BookOpen, color: '#fecaca', score: 4.8 },
    { id: 2, title: 'Fisika Dasar', desc: 'Hukum Newton', icon: Zap, color: '#bbf7d0', score: 4.9 },
    { id: 3, title: 'Algoritma', desc: 'Dynamic Programming', icon: BookOpen, color: '#bfdbfe', score: 5.0 },
  ];

  return (
    <aside className="w-80 bg-[#f8f7f4] flex flex-col h-full border-l border-slate-200 overflow-y-auto hidden lg:flex rounded-r-[2.5rem]">
      <div className="p-6 flex flex-col gap-8">
        
        {/* Top Icons */}
        <div className="flex justify-between items-center">
          <button className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition">
            <Bell className="w-5 h-5 text-slate-700" />
          </button>
          <button className="p-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition">
            <Settings className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenProfile}>
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-gradient-to-r from-[#02b6e3] to-[#4321d6] rounded-full blur-md opacity-50 group-hover:opacity-75 transition" />
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg relative z-10"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">{currentUser.name}</h2>
          <p className="text-sm text-slate-500 font-medium mb-4">{currentUser.reputationTier}</p>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl shadow-sm w-full justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-full">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-bold text-slate-800 text-sm">{currentUser.reputationPoints} Poin</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-full">
                <Flame className="w-4 h-4 text-orange-600" />
              </div>
              <span className="font-bold text-slate-800 text-sm">{currentUser.streakDays} Hari</span>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Aktivitas</h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Minggu ini ▼</span>
          </div>
          
          <div className="flex items-end gap-2 h-32 mt-2">
            {activityData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative flex-1 flex items-end justify-center group cursor-pointer">
                  <div 
                    className={`w-full rounded-full transition-all duration-300 ${day.active ? 'bg-slate-900 shadow-md' : 'opacity-80 group-hover:opacity-100'}`}
                    style={{ 
                      height: \`\${day.value}%\`, 
                      backgroundColor: day.active ? '#1e293b' : day.color 
                    }}
                  />
                  {day.active && (
                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      Hebat!
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${day.active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities List */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-slate-800 px-2">Aktivitas Terakhir</h3>
          {recentActivities.map((act) => (
            <div key={act.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => onSelectTab('questions')}>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-800"
                style={{ backgroundColor: act.color }}
              >
                <act.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">{act.title}</h4>
                <p className="text-xs text-slate-500 truncate">{act.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ⭐ {act.score}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </aside>
  );
};
