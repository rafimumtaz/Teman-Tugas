import React from 'react';
import {
  BookOpen,
  Presentation,
  Users,
  Trophy,
  GraduationCap,
  Settings,
  User,
  LogOut,
  Home
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

  const navItems = [
    { id: 'questions' as const, icon: Home, label: 'Beranda' },
    { id: 'whiteboard' as const, icon: Presentation, label: 'Live' },
    { id: 'mentors' as const, icon: BookOpen, label: 'Mentor' },
    { id: 'gamification' as const, icon: Trophy, label: 'Gamifikasi' },
  ];

  return (
    <aside className="w-24 bg-[#f8f7f4] h-full flex flex-col items-center py-6 border-r border-slate-200 rounded-l-[2.5rem] z-40 hidden md:flex">
      {/* Brand & Logo */}
      <div
        onClick={() => onSelectTab('questions')}
        className="mb-10 cursor-pointer select-none group"
      >
        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform overflow-hidden relative">
           <GraduationCap className="w-6 h-6 absolute z-10 text-white" />
           <div className="w-full h-full bg-gradient-to-tr from-[#02b6e3] to-[#4321d6] opacity-50 z-0 absolute" />
        </div>
      </div>

      {/* Center Nav Links (Vertical) */}
      <nav className="flex flex-col gap-6 flex-1 w-full items-center">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              currentTab === item.id
                ? 'bg-slate-900 text-white shadow-lg scale-110'
                : 'bg-white text-slate-500 hover:text-slate-900 shadow-sm hover:shadow-md'
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            {item.id === 'whiteboard' && activeRoomActive && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute -top-1 -right-1 animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={onOpenProfile}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-slate-500 hover:text-slate-900 shadow-sm hover:shadow-md transition cursor-pointer group relative"
          title="Pengaturan"
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
        </button>
        
        <div 
          onClick={onOpenProfile}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer relative"
          title="Profil Anda"
        >
          <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#02b6e3] to-[#4321d6] opacity-0 group-hover:opacity-20 transition z-20" />
        </div>
      </div>
    </aside>
  );
};

