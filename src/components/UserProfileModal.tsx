import React, { useState } from 'react';
import {
  X,
  Star,
  Award,
  BookOpen,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  GraduationCap,
  School,
  Calendar,
  Zap,
  Flame,
  Coins,
  Video,
  ThumbsUp,
  Share2,
  Edit3,
  Plus,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Clock,
  Heart,
  ChevronRight,
  Filter,
  Check,
  Send,
  AlertCircle,
  HelpCircle,
  Link,
  Github,
  Twitter,
  Linkedin,
  Crown,
  Sprout,
  Lightbulb,
  BrainCircuit
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, PastAssistance, MentorReview, ReputationTier } from '../types';

interface UserProfileModalProps {
  user: UserProfile;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onStartSession?: (user: UserProfile) => void;
  onAddReview?: (mentorId: string, review: Omit<MentorReview, 'id' | 'createdAt' | 'helpfulCount' | 'userVotedHelpful'>) => void;
  onEndorseSubject?: (userId: string, subject: string) => void;
  onVoteReviewHelpful?: (userId: string, reviewId: string) => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

const PRAISE_TAGS = [
  'Penjelasan Visual Jelas',
  'Sabar & Ramah',
  'Paham Konsep Kuat',
  'Fast Response',
  'Papan Tulis Interaktif',
  'Metode Socratic Hebat',
  'Mudah Dipahami',
  'Rekomendasi Banget'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  currentUser,
  isOpen,
  onClose,
  onStartSession,
  onAddReview,
  onEndorseSubject,
  onVoteReviewHelpful,
  onUpdateProfile,
}) => {
  const isOwnProfile = currentUser.id === user.id;
  const [activeTab, setActiveTab] = useState<'overview' | 'reputation' | 'assistance' | 'points-info'>('overview');
  
  // Assistance filter
  const [assistanceFilter, setAssistanceFilter] = useState<'all' | 'live_session' | 'qna_solution' | 'socratic_hint'>('all');

  // Review submission state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Penjelasan Visual Jelas', 'Sabar & Ramah']);
  const [reviewComment, setReviewComment] = useState('');
  const [sessionType, setSessionType] = useState('Live Whiteboard 1-on-1');
  const [reviewSubmittedToast, setReviewSubmittedToast] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editUsername, setEditUsername] = useState(user.username || '');
  const [editAcademicLevel, setEditAcademicLevel] = useState(user.academicLevel || '');
  const [editSchool, setEditSchool] = useState(user.universityOrSchool || '');
  const [editBio, setEditBio] = useState(user.bio || '');
  const [editSubjects, setEditSubjects] = useState<string[]>(user.expertSubjects || []);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [editHourlyCoins, setEditHourlyCoins] = useState(user.hourlyCoins || 40);

  if (!isOpen) return null;

  // Toggle tag in review form
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Submit Review Handler
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const pointsToAward = reviewRating === 5 ? 75 : reviewRating === 4 ? 50 : 30;

    if (onAddReview) {
      onAddReview(user.id, {
        mentorId: user.id,
        reviewerId: currentUser.id,
        reviewerName: currentUser.name,
        reviewerAvatar: currentUser.avatar,
        reviewerAcademicLevel: currentUser.academicLevel || currentUser.universityOrSchool || 'Pelajar TemanTugas',
        rating: reviewRating,
        tags: selectedTags,
        comment: reviewComment.trim(),
        pointsAwarded: pointsToAward,
        sessionType: sessionType,
      });
    }

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setShowReviewForm(false);
    setReviewComment('');
    setReviewSubmittedToast(true);
    setTimeout(() => setReviewSubmittedToast(false), 4000);
  };

  // Save Edit Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName.trim() || user.name,
        username: editUsername.trim().replace(/^@/, '') || user.username,
        academicLevel: editAcademicLevel.trim() || user.academicLevel,
        universityOrSchool: editSchool.trim() || user.universityOrSchool,
        bio: editBio.trim() || user.bio,
        expertSubjects: editSubjects,
        hourlyCoins: editHourlyCoins,
      });
    }
    setIsEditingProfile(false);
  };

  const handleAddSubjectTag = () => {
    if (newSubjectInput.trim() && !editSubjects.includes(newSubjectInput.trim())) {
      setEditSubjects([...editSubjects, newSubjectInput.trim()]);
      setNewSubjectInput('');
    }
  };

  const handleRemoveSubjectTag = (subj: string) => {
    setEditSubjects(editSubjects.filter(s => s !== subj));
  };

  // Filtered past assistance
  const pastAssistanceList = user.pastAssistance || [];
  const filteredAssistance = pastAssistanceList.filter(item => {
    if (assistanceFilter === 'all') return true;
    return item.type === assistanceFilter;
  });

  // Calculate tier details
  const getTierColor = (tier: ReputationTier = 'Novice Mentor') => {
    switch (tier) {
      case 'Master Mentor':
        return {
          bg: 'bg-amber-500/10 text-amber-700 border-amber-300',
          badge: 'from-amber-500 to-yellow-600 text-white',
          name: 'Master Mentor',
          icon: <Crown className="w-6 h-6 text-amber-500 drop-shadow-sm" />,
          color: 'from-amber-400 to-orange-500'
        };
      case 'Elite Scholar':
        return {
          bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
          badge: 'from-indigo-600 to-violet-600 text-white',
          name: 'Elite Scholar',
          icon: <Award className="w-6 h-6 text-indigo-500 drop-shadow-sm" />,
          color: 'from-indigo-400 to-violet-500'
        };
      case 'Trusted Peer':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
          badge: 'from-emerald-600 to-teal-600 text-white',
          name: 'Trusted Peer',
          icon: <ShieldCheck className="w-6 h-6 text-emerald-500 drop-shadow-sm" />,
          color: 'from-emerald-400 to-teal-500'
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-700 border-slate-300',
          badge: 'from-slate-600 to-slate-700 text-white',
          name: 'Novice Mentor',
          icon: <Sprout className="w-6 h-6 text-slate-500 drop-shadow-sm" />,
          color: 'from-slate-400 to-slate-500'
        };
    }
  };

  const tierInfo = getTierColor(user.reputationTier);
  const totalReviews = user.reviewsCount || (user.reviews ? user.reviews.length : 0);
  const dist = user.ratingDistribution || { 5: totalReviews, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalDistCount = Math.max(1, (dist[5] || 0) + (dist[4] || 0) + (dist[3] || 0) + (dist[2] || 0) + (dist[1] || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto relative">
        
        <button
          onClick={onClose}
          aria-label="Tutup Profil"
          className="absolute right-4 top-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating Avatar & User Bio Header */}
        <div className="px-6 sm:px-8 pb-4 relative z-10 pt-12 sm:pt-14 shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1">
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-xl bg-slate-100"
                />
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-md border-2 border-white flex items-center gap-0.5 z-10">
                  Lv.{user.level || 1}
                </div>
              </div>

              <div className="space-y-1 pb-1 pt-2 sm:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{user.name}</h2>
                  <span className="text-sm font-semibold text-slate-400">@{user.username || user.id}</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs flex items-center gap-1 ${tierInfo.bg}`}>
                    <span>{tierInfo.name}</span>
                  </span>
                  {user.isOnline && (
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ml-0 sm:ml-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
                    </span>
                  )}
                  
                  {/* Action CTA */}
                  <div className="flex items-center gap-2 ml-0 sm:ml-2 mt-2 sm:mt-0">
                    {isOwnProfile ? (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Profil Saya</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowReviewForm(true);
                            setActiveTab('reputation');
                          }}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Beri Ulasan</span>
                        </button>
                        {onStartSession && (
                          <button
                            onClick={() => {
                              onClose();
                              onStartSession(user);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Sesi Belajar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Level & School */}
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 font-medium flex-wrap">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>{user.academicLevel || 'Jenjang Akademik Belum Diatur'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <School className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.universityOrSchool}</span>
                  </div>
                  {user.joinedDate && (
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Bergabung {user.joinedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 flex items-center gap-4 sm:gap-6 shadow-sm self-stretch md:self-auto justify-around mt-4 md:mt-0 relative z-10">
              <div className="text-center px-1">
                <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-base sm:text-lg">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{(user.reputationPoints || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reputasi</div>
              </div>

              <div className="w-px h-8 bg-slate-200" />

              <div className="text-center px-1">
                <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-base sm:text-lg">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{(user.rating || 5.0).toFixed(1)}</span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{totalReviews} Ulasan</div>
              </div>

              <div className="w-px h-8 bg-slate-200" />

              <div className="text-center px-1">
                <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-base sm:text-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{user.totalHelpSessions || (user.pastAssistance ? user.pastAssistance.length : 0)}</span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bantuan</div>
              </div>

              <div className="w-px h-8 bg-slate-200" />

              <div className="text-center px-1">
                <div className="flex items-center justify-center gap-1 text-slate-900 font-black text-base sm:text-lg">
                  <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>{user.streakDays || 1}h</span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast for review */}
        {reviewSubmittedToast && (
          <div className="mx-6 sm:mx-8 mb-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold p-3 rounded-xl flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Ulasan berhasil dikirim! Mentor menerima <strong>+{reviewRating === 5 ? 75 : 50} Reputasi Koin</strong> atas bimbingan berkualitas.</span>
            </div>
            <button onClick={() => setReviewSubmittedToast(false)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
              Tutup
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="shrink-0 w-full overflow-x-auto overflow-y-hidden bg-slate-50/50 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full pb-4 sm:pb-5">
          <div className="px-6 sm:px-8 border-b border-slate-200 flex items-center gap-2 sm:gap-4 w-max min-w-full">
            <button
            onClick={() => setActiveTab('overview')}
            className={`relative py-3 px-3 text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ringkasan & Keahlian</span>
            {activeTab === 'overview' && (
              <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-600 rounded-t-sm" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reputation')}
            className={`relative py-3 px-3 text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'reputation' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Reputasi & Ulasan ({totalReviews})</span>
            {activeTab === 'reputation' && (
              <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-600 rounded-t-sm" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('assistance')}
            className={`relative py-3 px-3 text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'assistance' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Riwayat Bantuan Diberikan ({pastAssistanceList.length})</span>
            {activeTab === 'assistance' && (
              <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-600 rounded-t-sm" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('points-info')}
            className={`relative py-3 px-3 text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'points-info' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Award className="w-4 h-4 text-indigo-500" />
            <span>Sistem Poin Mentor</span>
            {activeTab === 'points-info' && (
              <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-indigo-600 rounded-t-sm" />
            )}
          </button>
        </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: OVERVIEW & EXPERTISE */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Bio Card */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Bio & Filosofi Belajar
                  </h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic">
                  "{user.bio || 'Belum ada bio singkat. Tambahkan bio untuk memperkenalkan gaya bimbinganmu kepada teman-teman!'}"
                </p>
              </div>

              {/* Subjects of Expertise with Endorsements */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Bidang Keahlian & Mata Pelajaran
                    </h3>
                    <p className="text-xs text-slate-500">Mata pelajaran dan topik yang dikuasai secara mendalam oleh pengguna.</p>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Kelola Bidang
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(user.expertSubjects && user.expertSubjects.length > 0 ? user.expertSubjects : ['Kalkulus', 'Fisika Dasar', 'Algoritma']).map((subject, idx) => {
                    const endorsement = user.endorsements?.find(e => e.subject.toLowerCase() === subject.toLowerCase());
                    const count = endorsement ? endorsement.count : (12 + idx * 7);
                    const isEndorsedByMe = endorsement?.endorsedBy?.includes(currentUser.name);

                    return (
                      <div
                        key={subject}
                        className="bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 transition group"
                      >
                        <div className="space-y-1">
                          <div className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-indigo-700 transition">
                            {subject}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                            <span>Di-endorse oleh <strong>{count}</strong> rekan belajar</span>
                          </div>
                        </div>

                        {!isOwnProfile && onEndorseSubject && (
                          <button
                            onClick={() => {
                              onEndorseSubject(user.id, subject);
                              confetti({ particleCount: 30, spread: 50 });
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 shrink-0 ${isEndorsedByMe ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white hover:bg-indigo-600 hover:text-white border-slate-200 text-slate-700 shadow-2xs'}`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{isEndorsedByMe ? 'Telah Di-endorse' : '+ Endorse'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Badges & Achievements Grid */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" /> Lencana & Prestasi Komunitas
                    </h3>
                    <p className="text-xs text-slate-500">Pencapaian yang diraih dari konsistensi membantu dan menyelesaikan soal.</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    {(user.badges || []).filter(b => b.unlocked).length} Terbuka
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(user.badges && user.badges.length > 0 ? user.badges : []).map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${badge.unlocked ? 'bg-amber-50/30 border-amber-200' : 'bg-slate-50/50 border-slate-200 opacity-60'}`}
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${badge.unlocked ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="truncate">{badge.name}</span>
                          {badge.unlocked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPUTATION & REVIEWS */}
          {activeTab === 'reputation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Reputation & Star Summary Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Big Rating Score */}
                  <div className="md:col-span-4 text-center md:text-left space-y-2 md:border-r md:border-white/10 md:pr-6">
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" /> Indeks Reputasi Mentor
                    </div>
                    <div className="flex items-baseline justify-center md:justify-start gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white">{(user.rating || 5.0).toFixed(1)}</span>
                      <span className="text-slate-400 font-bold text-base sm:text-lg">/ 5.0</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${s <= Math.round(user.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300">
                      Berdasarkan <strong>{totalReviews} ulasan</strong> dari sesi bimbingan live & jawaban tugas.
                    </p>
                  </div>

                  {/* Rating Breakdown Bars */}
                  <div className="md:col-span-5 space-y-1.5 text-xs">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = (dist as any)[star] || 0;
                      const pct = Math.round((count / totalDistCount) * 100);
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-6 text-slate-300 font-bold flex items-center gap-0.5">
                            {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          </span>
                          <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-slate-400 font-mono text-[11px]">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reputation Points Card */}
                  <div className="md:col-span-3 bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 text-center space-y-2">
                    <div className="text-[11px] font-bold text-indigo-200 uppercase">Poin Kolaborasi</div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-300 flex items-center justify-center gap-1">
                      <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <span>{(user.reputationPoints || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[11px] text-slate-200">
                      Tingkat: <strong className="text-white">{user.reputationTier || 'Novice Mentor'}</strong>
                    </div>
                    <div className="text-[10px] text-emerald-300 font-semibold flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {user.successRate || 98}% Kolaborasi Sukses
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Submission Section / Trigger */}
              {!isOwnProfile && (
                <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Pernah Belajar Bersama {user.name}?
                      </h4>
                      <p className="text-xs text-indigo-700">
                        Beri rating & ulasan untuk membantu komunitas dan memberikan <strong>+Poin Reputasi</strong> kepada mentor!
                      </p>
                    </div>
                    {!showReviewForm && (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Tulis Ulasan & Rating</span>
                      </button>
                    )}
                  </div>

                  {/* Interactive Review Form */}
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="space-y-4 bg-white p-5 rounded-xl border border-indigo-200 shadow-xs animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Pilih Skor Bintang:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setReviewRating(star)}
                              className="p-1 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                            >
                              <Star
                                className={`w-6 h-6 ${(hoverRating || reviewRating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 font-black text-sm text-slate-900">{reviewRating}.0</span>
                        </div>
                      </div>

                      {/* Session Type */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Jenis Bantuan / Sesi:</label>
                        <select
                          value={sessionType}
                          onChange={(e) => setSessionType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg outline-none focus:border-indigo-500"
                        >
                          <option value="Live Whiteboard 1-on-1">Live Whiteboard 1-on-1 Audio-Visual</option>
                          <option value="Solusi Forum Q&A">Solusi Terverifikasi di Forum Tanya-Jawab</option>
                          <option value="Petunjuk Socratic">Petunjuk Socratic Tanpa Spoiler</option>
                        </select>
                      </div>

                      {/* Praise Tags Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Pilih Label Keunggulan Mentor:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {PRAISE_TAGS.map((tag) => (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer ${selectedTags.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'}`}
                            >
                              {selectedTags.includes(tag) ? `✓ ${tag}` : `+ ${tag}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Comment Text */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Catatan Ulasan Lengkap:</label>
                        <textarea
                          rows={3}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Ceritakan bagaimana mentor membantu kamu memahami rumus/konsep dan menyelesaikan tugas..."
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-3 rounded-xl outline-none focus:border-indigo-500 focus:bg-white resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim Ulasan & Beri {reviewRating === 5 ? '+75' : '+50'} Poin</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Reviews Feed List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" /> Semua Ulasan Teman Belajar ({user.reviews?.length || 0})
                  </h4>
                  <span className="text-xs text-slate-400 font-medium">Ulasan terverifikasi</span>
                </div>

                {(!user.reviews || user.reviews.length === 0) ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-2">
                    <Star className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">Belum ada ulasan untuk mentor ini.</p>
                    <p className="text-xs text-slate-400">Jadilah yang pertama melakukan sesi belajar dan memberikan ulasan!</p>
                  </div>
                ) : (
                  user.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-slate-200/90 hover:border-indigo-200 rounded-2xl p-5 shadow-2xs space-y-3 transition"
                    >
                      {/* Reviewer Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={rev.reviewerAvatar}
                            alt={rev.reviewerName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">{rev.reviewerName}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-indigo-500" />
                              <span>{rev.reviewerAcademicLevel}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right space-y-0.5">
                          <div className="flex items-center justify-end gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-400">{rev.createdAt}</div>
                        </div>
                      </div>

                      {/* Praise Tags */}
                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rev.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Review Text */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        "{rev.comment}"
                      </p>

                      {/* Review Footer with session type & helpful button */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 font-medium text-slate-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Sesi: {rev.sessionType}</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">+{rev.pointsAwarded || 60} Poin Mentor</span>
                        </div>

                        {onVoteReviewHelpful && (
                          <button
                            onClick={() => onVoteReviewHelpful(user.id, rev.id)}
                            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition cursor-pointer ${rev.userVotedHelpful ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200'}`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>Membantu ({rev.helpfulCount || 0})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAST ASSISTANCE PROVIDED */}
          {activeTab === 'assistance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Assistance Filter Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    onClick={() => setAssistanceFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${assistanceFilter === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    Semua ({pastAssistanceList.length})
                  </button>
                  <button
                    onClick={() => setAssistanceFilter('live_session')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${assistanceFilter === 'live_session' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    Whiteboard 1-on-1 ({pastAssistanceList.filter(p => p.type === 'live_session').length})
                  </button>
                  <button
                    onClick={() => setAssistanceFilter('qna_solution')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${assistanceFilter === 'qna_solution' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    Solusi Q&A Forum ({pastAssistanceList.filter(p => p.type === 'qna_solution').length})
                  </button>
                  <button
                    onClick={() => setAssistanceFilter('socratic_hint')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${assistanceFilter === 'socratic_hint' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    Petunjuk Socratic ({pastAssistanceList.filter(p => p.type === 'socratic_hint').length})
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-semibold">
                  Total Reward Diperoleh: <strong className="text-amber-600">+{pastAssistanceList.reduce((acc, curr) => acc + (curr.pointsEarned || 0), 0)} Poin</strong>
                </div>
              </div>

              {/* Past Assistance Cards */}
              <div className="space-y-3.5">
                {filteredAssistance.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 space-y-2">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">Tidak ada riwayat bantuan dalam kategori ini.</p>
                    <p className="text-xs text-slate-400">Mentor terus aktif menjawab soal baru di forum dan bimbingan live.</p>
                  </div>
                ) : (
                  filteredAssistance.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md">
                              {item.subject}
                            </span>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              {item.type === 'live_session' ? (
                                <><Video className="w-4 h-4 text-rose-500" /> Sesi Live Whiteboard</>
                              ) : item.type === 'qna_solution' ? (
                                <><Lightbulb className="w-4 h-4 text-amber-500" /> Solusi Terverifikasi</>
                              ) : (
                                <><BrainCircuit className="w-4 h-4 text-indigo-500" /> Petunjuk Socratic</>
                              )}
                            </div>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-400">{item.date}</span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        {/* Earned Rewards Badges */}
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            +{item.pointsEarned} Reputasi
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            +{item.coinsEarned} Koin
                          </span>
                        </div>
                      </div>

                      {/* Student Assisted Info & Feedback */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.studentAvatar}
                            alt={item.studentName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <span>Membantu <strong>{item.studentName}</strong></span>
                              {item.studentSchool && <span className="text-[10px] text-slate-400">({item.studentSchool})</span>}
                            </div>
                            {item.reviewSnippet && (
                              <p className="text-[11px] text-slate-600 italic">
                                "{item.reviewSnippet}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.rating}.0</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                            Solusi Diterima
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MENTOR POINTS SYSTEM EXPLAINED */}
          {activeTab === 'points-info' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-300" />
                  <h3 className="text-lg font-black">Bagaimana Sistem Reputasi & Reward Mentor Bekerja?</h3>
                </div>
                <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                  TemanTugas memberdayakan budaya tolong-menolong akademis. Mentor mendapatkan poin reputasi dan TemanCoins dari setiap kolaborasi sukses dan penilaian positif siswa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
                  <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-amber-400" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Rating Bintang 5</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Setiap ulasan bintang 5 dari sesi whiteboard atau solusi tugas memberikan <strong>+75 Poin Reputasi</strong> & bonus TemanCoins.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
                    ✓
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Solusi Diterima Penanya</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ketika jawaban tugasmu ditandai sebagai solusi paling jelas oleh penanya, kamu menerima <strong>+60 Poin</strong> dan seluruh koin bounty soal.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg">
                    🌱
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Petunjuk Socratic</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Membimbing teman menemukan jawaban sendiri tanpa spoiler langsung diapresiasi <strong>+40 Poin Socratic Guide</strong>.
                  </p>
                </div>
              </div>

              {/* Tiers Ladder */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenjang Tingkat Mentor TemanTugas:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-black text-slate-800 flex items-center gap-1"><Sprout className="w-3 h-3 text-slate-500" /> Novice Mentor</div>
                    <div className="text-slate-500 text-[11px]">0 - 500 Poin</div>
                    <div className="text-slate-400 text-[10px]">Tingkat awal memulai bimbingan.</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                    <div className="font-black text-emerald-700 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Trusted Peer</div>
                    <div className="text-slate-500 text-[11px]">500 - 2.000 Poin</div>
                    <div className="text-slate-400 text-[10px]">Mentor terpercaya komunitas.</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-1">
                    <div className="font-black text-indigo-700 flex items-center gap-1">⭐ Elite Scholar</div>
                    <div className="text-slate-500 text-[11px]">2.000 - 4.500 Poin</div>
                    <div className="text-slate-400 text-[10px]">Pakar bimbingan top 5%.</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1">
                    <div className="font-black text-amber-700 flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> Master Mentor</div>
                    <div className="text-slate-500 text-[11px]">4.500+ Poin</div>
                    <div className="text-slate-400 text-[10px]">Tingkat tertinggi & tutor senior.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* In-place Profile Editing Modal Overlay */}
        {isEditingProfile && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs z-30 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Profil TemanTugas
                </h3>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nama Lengkap:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Username (Handle):</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.replace(/^@/, ''))}
                      className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-2.5 rounded-xl text-slate-900 outline-none focus:border-indigo-500 font-semibold"
                      placeholder="username_kamu"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jenjang Akademik & Jurusan:</label>
                  <input
                    type="text"
                    value={editAcademicLevel}
                    onChange={(e) => setEditAcademicLevel(e.target.value)}
                    placeholder="Contoh: Mahasiswa S1 Teknik Elektro (Semester 5) / SMA Kelas 12 IPA"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Asal Universitas / Sekolah:</label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    placeholder="Contoh: Institut Teknologi Bandung (ITB) / SMAN 8 Jakarta"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Bio Singkat & Gaya Mengajar:</label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Ceritakan latar belakangmu dan metode bimbingan yang kamu sukai..."
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-indigo-500 resize-none font-medium"
                  />
                </div>

                {/* Subject Tags Editor */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Mata Pelajaran & Bidang Keahlian:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubjectInput}
                      onChange={(e) => setNewSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubjectTag();
                        }
                      }}
                      placeholder="Ketik topik (contoh: Kalkulus, Fisika Modern)..."
                      className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubjectTag}
                      className="bg-indigo-50 text-indigo-700 font-bold px-3 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-100"
                    >
                      + Tambah
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {editSubjects.map((subj) => (
                      <span
                        key={subj}
                        className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                      >
                        <span>{subj}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectTag(subj)}
                          className="hover:text-rose-600 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
