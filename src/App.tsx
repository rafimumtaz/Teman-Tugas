'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  Question,
  QuestionAnswer,
  MentorProfile,
  StudyRoomSession,
  GamificationReward,
  LeaderboardUser,
  MentorReview,
  PastAssistance,
  ReputationTier,
} from './types';
import { createQuestion, createAnswer, acceptAnswer, upvoteQuestion } from './app/actions/questions';
import { submitMentorReview } from './app/actions/mentors';
import { updateProfile, onboardMentor, claimReward } from './app/actions/users';
// Removed mock data imports as the app is now fully database-backed
import { Navbar } from './components/Navbar';
import { QuestionsBoard } from './components/QuestionsBoard';
import { LiveStudyRoom } from './components/LiveStudyRoom';
import { MentorMarketplace } from './components/MentorMarketplace';
import { GamificationCenter } from './components/GamificationCenter';
import { SocraticModal } from './components/SocraticModal';
import { Whiteboard } from './components/Whiteboard';
import { UserProfileModal } from './components/UserProfileModal';
import { Sparkles, Video, Award, CheckCircle2, BookOpen, Users, PlusCircle, ShieldCheck } from 'lucide-react';

interface AppProps {
  dbUsers?: UserProfile[];
  dbQuestions?: Question[];
  initialUserId?: string;
}

export default function App({ dbUsers, dbQuestions, initialUserId }: AppProps) {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'questions' | 'whiteboard' | 'mentors' | 'gamification'>('questions');

  // Application Data States
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    dbUsers?.find(u => u.id === initialUserId) as UserProfile
  );
  const [questions, setQuestions] = useState<Question[]>(dbQuestions || []);
  const [mentors, setMentors] = useState<MentorProfile[]>(dbUsers?.filter(u => u.role === 'mentor') as any || []);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [rewards, setRewards] = useState<GamificationReward[]>([]);

  // Active Live Study Room Session
  const [activeSession, setActiveSession] = useState<StudyRoomSession | null>(null);

  // Socratic Modal
  const [socraticQuestion, setSocraticQuestion] = useState<Question | null>(null);

  // Profile Modal State
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);

  // Mentor Onboarding Modal
  const [showMentorOnboardModal, setShowMentorOnboardModal] = useState<boolean>(false);
  const [mentorCampus, setMentorCampus] = useState('Institut Teknologi Bandung');
  const [mentorAcademicLevel, setMentorAcademicLevel] = useState('Mahasiswa S1 Teknik Informatika (Semester 5)');
  const [mentorSpecialty, setMentorSpecialty] = useState('Kalkulus, Fisika Dasar, Algoritma');
  const [mentorBio, setMentorBio] = useState('Siap membantu mahasiswa dan siswa SMA membedah konsep sulit dengan visual!');

  // Toast / Banner
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Helper to compute tier from points
  const computeTier = (points: number): ReputationTier => {
    if (points >= 4500) return 'Master Mentor';
    if (points >= 2000) return 'Elite Scholar';
    if (points >= 500) return 'Trusted Peer';
    return 'Novice Mentor';
  };

  // Toggle role (Student / Mentor)
  const handleToggleRole = () => {
    const nextRole = currentUser.activeRole === 'student' ? 'mentor' : 'student';
    setCurrentUser((prev) => ({ ...prev, activeRole: nextRole }));
    showNotice(`Beralih ke Mode ${nextRole === 'mentor' ? 'Mentor (Siap Membimbing)' : 'Siswa (Mencari Bantuan)'}`);
  };

  // Open Own Profile
  const handleOpenOwnProfile = () => {
    setSelectedUserProfile(currentUser);
  };

  // Open Mentor Profile
  const handleViewMentorProfile = (mentor: MentorProfile) => {
    const existingFull = mentors.find((m) => m.id === mentor.id);
    const profileToShow: UserProfile = {
      id: mentor.id,
      name: mentor.name,
      username: mentor.username || mentor.id.replace('mentor-', 'mentor_'),
      avatar: mentor.avatar,
      level: 7,
      xp: (mentor.reputationPoints || 1400) * 2,
      xpToNextLevel: 4000,
      honorScore: mentor.reputationPoints || 1400,
      temanCoins: 520,
      streakDays: 8,
      rating: mentor.rating || 4.9,
      reviewsCount: mentor.reviewsCount || 12,
      ratingDistribution: mentor.ratingDistribution || { 5: mentor.reviewsCount || 12, 4: 1, 3: 0, 2: 0, 1: 0 },
      reputationPoints: mentor.reputationPoints || 1450,
      reputationTier: mentor.reputationTier || computeTier(mentor.reputationPoints || 1450),
      successRate: mentor.successRate || 98,
      totalHelpSessions: mentor.totalSessions || 24,
      totalQuestionsSolved: mentor.sampleSolutions || 38,
      universityOrSchool: mentor.school || 'Institut Teknologi Bandung',
      academicLevel: mentor.academicLevel || 'Mahasiswa S1 Tingkat 3',
      bio: mentor.bio || 'Mentor berdedikasi tinggi siap membantu menyelesaikan tugas-tugas sulit.',
      expertSubjects: mentor.specialties || ['Kalkulus', 'Fisika'],
      endorsements: mentor.endorsements || [
        { subject: mentor.specialties[0] || 'Kalkulus', count: 18, endorsedBy: ['Ahmad Fauzi', 'Budi Santoso'] },
      ],
      reviews: mentor.reviews || [],
      pastAssistance: mentor.pastAssistance || [],
      activeRole: 'mentor',
      role: 'mentor',
      isOnline: mentor.isOnline,
      hourlyCoins: mentor.hourlyCoins || 40,
      joinedDate: mentor.joinedDate || 'Agustus 2024',
      badges: (existingFull?.badges || ['Verified Peer Tutor', 'Top Contributor']).map((bName, idx) => ({
        id: `mb-${idx}`,
        name: typeof bName === 'string' ? bName : 'Master Helper',
        description: 'Lencana resmi dedikasi komunitas TemanTugas',
        icon: 'Award',
        unlocked: true,
        category: 'mentorship' as const,
        tier: 'gold' as const,
        progress: 10,
        maxProgress: 10,
      })),
    };
    setSelectedUserProfile(profileToShow);
  };

  // Add Review & Rating to Mentor
  const handleAddReview = (
    mentorId: string,
    reviewData: Omit<MentorReview, 'id' | 'createdAt' | 'helpfulCount' | 'userVotedHelpful'>
  ) => {
    const newRev: MentorReview = {
      ...reviewData,
      id: `rev_${Date.now()}`,
      createdAt: 'Hari ini',
      helpfulCount: 1,
      userVotedHelpful: false,
    };

    // Update mentors array
    setMentors((prevMentors) =>
      prevMentors.map((m) => {
        if (m.id === mentorId) {
          const currentReviews = m.reviews || [];
          const updatedReviews = [newRev, ...currentReviews];
          const newCount = updatedReviews.length;
          const sumRatings = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
          const newAvg = Number((sumRatings / newCount).toFixed(2));
          const currentDist = m.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          const starKey = Math.min(5, Math.max(1, Math.round(reviewData.rating))) as 1 | 2 | 3 | 4 | 5;
          const updatedDist = { ...currentDist, [starKey]: (currentDist[starKey] || 0) + 1 };
          const ptsEarned = reviewData.pointsAwarded || 75;
          const newPts = (m.reputationPoints || 1200) + ptsEarned;
          const newTier = computeTier(newPts);

          const newAssistance: PastAssistance = {
            id: `asst_${Date.now()}`,
            title: `Bimbingan "${reviewData.sessionType}"`,
            subject: m.specialties[0] || 'Akademik',
            type: reviewData.sessionType.includes('Live') ? 'live_session' : 'qna_solution',
            studentId: reviewData.reviewerId,
            studentName: reviewData.reviewerName,
            studentAvatar: reviewData.reviewerAvatar,
            studentSchool: reviewData.reviewerAcademicLevel,
            rating: reviewData.rating,
            date: 'Hari ini',
            pointsEarned: ptsEarned,
            coinsEarned: m.hourlyCoins || 40,
            reviewSnippet: reviewData.comment,
            isAccepted: true,
          };

          return {
            ...m,
            rating: newAvg,
            reviewsCount: newCount,
            ratingDistribution: updatedDist,
            reputationPoints: newPts,
            reputationTier: newTier,
            reviews: updatedReviews,
            pastAssistance: [newAssistance, ...(m.pastAssistance || [])],
            totalSessions: (m.totalSessions || 0) + 1,
          };
        }
        return m;
      })
    );

    // If selectedUserProfile is currently open, keep it in sync
    setSelectedUserProfile((prev) => {
      if (!prev || prev.id !== mentorId) return prev;
      const currentReviews = prev.reviews || [];
      const updatedReviews = [newRev, ...currentReviews];
      const newCount = updatedReviews.length;
      const sumRatings = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const newAvg = Number((sumRatings / newCount).toFixed(2));
      const currentDist = prev.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      const starKey = Math.min(5, Math.max(1, Math.round(reviewData.rating))) as 1 | 2 | 3 | 4 | 5;
      const updatedDist = { ...currentDist, [starKey]: (currentDist[starKey] || 0) + 1 };
      const ptsEarned = reviewData.pointsAwarded || 75;
      const newPts = (prev.reputationPoints || 1200) + ptsEarned;
      const newTier = computeTier(newPts);

      const newAssistance: PastAssistance = {
        id: `asst_${Date.now()}`,
        title: `Bimbingan "${reviewData.sessionType}"`,
        subject: prev.expertSubjects?.[0] || 'Akademik',
        type: reviewData.sessionType.includes('Live') ? 'live_session' : 'qna_solution',
        studentId: reviewData.reviewerId,
        studentName: reviewData.reviewerName,
        studentAvatar: reviewData.reviewerAvatar,
        studentSchool: reviewData.reviewerAcademicLevel,
        rating: reviewData.rating,
        date: 'Hari ini',
        pointsEarned: ptsEarned,
        coinsEarned: prev.hourlyCoins || 40,
        reviewSnippet: reviewData.comment,
        isAccepted: true,
      };

      return {
        ...prev,
        rating: newAvg,
        reviewsCount: newCount,
        ratingDistribution: updatedDist,
        reputationPoints: newPts,
        reputationTier: newTier,
        reviews: updatedReviews,
        pastAssistance: [newAssistance, ...(prev.pastAssistance || [])],
        totalHelpSessions: (prev.totalHelpSessions || 0) + 1,
      };
    });

    showNotice(`Ulasan berhasil ditambahkan! Mentor menerima +${reviewData.pointsAwarded || 75} Poin Reputasi.`);
  };

  // Endorse subject
  const handleEndorseSubject = (userId: string, subject: string) => {
    setSelectedUserProfile((prev) => {
      if (!prev || prev.id !== userId) return prev;
      const endorsements = prev.endorsements || [];
      const foundIdx = endorsements.findIndex((e) => e.subject.toLowerCase() === subject.toLowerCase());
      let updatedEndorsements = [...endorsements];

      if (foundIdx >= 0) {
        const item = endorsements[foundIdx];
        const alreadyEndorsed = item.endorsedBy?.includes(currentUser.name);
        if (alreadyEndorsed) {
          updatedEndorsements[foundIdx] = {
            ...item,
            count: Math.max(1, item.count - 1),
            endorsedBy: item.endorsedBy.filter((n) => n !== currentUser.name),
          };
        } else {
          updatedEndorsements[foundIdx] = {
            ...item,
            count: item.count + 1,
            endorsedBy: [...(item.endorsedBy || []), currentUser.name],
          };
        }
      } else {
        updatedEndorsements.push({
          subject,
          count: 1,
          endorsedBy: [currentUser.name],
        });
      }

      return { ...prev, endorsements: updatedEndorsements };
    });

    showNotice(`Anda meng-endorse keahlian ${subject}!`);
  };

  // Upvote / helpful on review
  const handleVoteReviewHelpful = (userId: string, reviewId: string) => {
    setSelectedUserProfile((prev) => {
      if (!prev || prev.id !== userId) return prev;
      const updatedReviews = (prev.reviews || []).map((r) => {
        if (r.id === reviewId) {
          const isVoted = r.userVotedHelpful;
          return {
            ...r,
            helpfulCount: isVoted ? Math.max(0, r.helpfulCount - 1) : r.helpfulCount + 1,
            userVotedHelpful: !isVoted,
          };
        }
        return r;
      });
      return { ...prev, reviews: updatedReviews };
    });
  };

  // Update Profile Data
  const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    const result = await updateProfile({
      name: updatedData.name,
      username: updatedData.username,
      universityOrSchool: updatedData.universityOrSchool,
      academicLevel: updatedData.academicLevel,
      bio: updatedData.bio,
      expertSubjects: updatedData.expertSubjects,
      hourlyCoins: updatedData.hourlyCoins,
    });

    if (result.error) {
      alert(result.error);
      return;
    }

    setCurrentUser((prev) => {
      const updated = { ...prev, ...updatedData };
      if (selectedUserProfile && selectedUserProfile.id === prev.id) {
        setSelectedUserProfile(updated);
      }
      return updated;
    });

    // Also update in mentors list if currentUser is registered as mentor
    setMentors((prev) =>
      prev.map((m) => {
        if (m.id === currentUser.id || m.name === currentUser.name) {
          return {
            ...m,
            name: updatedData.name || m.name,
            username: updatedData.username || m.username,
            school: updatedData.universityOrSchool || m.school,
            academicLevel: updatedData.academicLevel || m.academicLevel,
            bio: updatedData.bio || m.bio,
            specialties: updatedData.expertSubjects || m.specialties,
            hourlyCoins: updatedData.hourlyCoins || m.hourlyCoins,
          };
        }
        return m;
      })
    );

    showNotice('Profil Anda berhasil diperbarui di database!');
  };

  // Ask Question
  const handleAskQuestion = async (newQ: Partial<Question>) => {
    const cost = newQ.bountyCoins || 25;
    if (currentUser.temanCoins < cost) {
      alert('Saldo TemanCoins tidak cukup untuk memasang bounty ini.');
      return;
    }

    const result = await createQuestion({
      title: newQ.title || 'Pertanyaan Tugas Baru',
      description: newQ.description || '',
      rawEquation: newQ.rawEquation,
      subject: newQ.subject || 'Matematika',
      subTopic: newQ.subTopic || 'Umum',
      difficulty: newQ.difficulty || 'Sedang',
      tags: newQ.tags || ['HomeworkHelp'],
      bountyCoins: cost,
      bountyXp: cost * 2.5,
    });

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.success && result.question) {
      // Serialize dates before inserting into state to match Next.js RSC boundary behavior
      const dbQ = result.question;
      const created: Question = {
        ...dbQ,
        createdAt: new Date(dbQ.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        askerName: currentUser.name,
        askerAvatar: currentUser.avatar,
        askerSchool: currentUser.universityOrSchool,
        askerLevel: currentUser.level,
      } as any;

      setQuestions((prev) => [created, ...prev]);
      setCurrentUser((prev) => ({
        ...prev,
        temanCoins: prev.temanCoins - cost,
        xp: prev.xp + 20,
      }));
      showNotice(`Soal "${created.title.slice(0, 30)}..." berhasil diajukan dan disimpan ke database!`);
    }
  };

  // Upvote Question
  const handleUpvoteQuestion = async (qId: string) => {
    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === qId) {
          const isUpvoted = q.userUpvoted;
          return {
            ...q,
            upvotes: isUpvoted ? q.upvotes - 1 : q.upvotes + 1,
            userUpvoted: !isUpvoted,
          };
        }
        return q;
      })
    );
    // Background sync
    await upvoteQuestion(qId);
  };

  // Add Answer to Question & Earn Mentor Reputation
  const handleAddAnswer = async (qId: string, ans: Partial<QuestionAnswer>) => {
    const result = await createAnswer(qId, {
      content: ans.content || '',
      stepByStep: ans.stepByStep || [],
    });

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.success && result.answer) {
      const dbA = result.answer;
      const newAns: QuestionAnswer = {
        ...dbA,
        createdAt: new Date(dbA.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        authorSchool: currentUser.universityOrSchool,
        authorLevel: currentUser.level,
        authorBadges: ['Peer Helper', 'Honor Scholar'],
      } as any;

      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, answers: [...q.answers, newAns], answersCount: q.answers.length + 1 } : q))
      );

      const addedPoints = 60;
      const newReputation = (currentUser.reputationPoints || 0) + addedPoints;
      const newTier = computeTier(newReputation);

      // Award helper XP, reputation points & honor locally
      setCurrentUser((prev) => ({
        ...prev,
        xp: prev.xp + 80,
        honorScore: prev.honorScore + 25,
        reputationPoints: newReputation,
        reputationTier: newTier,
        totalQuestionsSolved: prev.totalQuestionsSolved + 1,
      }));

      showNotice('Jawaban Anda berhasil disimpan ke database! Anda memperoleh +80 XP dan +60 Poin Reputasi.');
    }
  };

  // Accept Answer & Award Bounty
  const handleAcceptAnswer = async (qId: string, ansId: string, bounty: number) => {
    const result = await acceptAnswer(qId, ansId, bounty);
    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.success) {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === qId) {
            const updatedAnswers = q.answers.map((a) => (a.id === ansId ? { ...a, isAccepted: true } : a));
            return { ...q, status: 'resolved', answers: updatedAnswers };
          }
          return q;
        })
      );

      showNotice(`Solusi diterima! Bounty +${bounty} TemanCoins berhasil disalurkan ke pembuat jawaban.`);
      confetti({ particleCount: 75, spread: 80 });
    }
  };

  // Start Live Session from Question
  const handleStartLiveSessionFromQuestion = (q: Question) => {
    const newSession: StudyRoomSession = {
      id: `room_${Date.now()}`,
      title: q.title,
      subject: q.subject,
      questionId: q.id,
      questionTitle: q.title,
      targetEquation: q.rawEquation,
      startedAt: Date.now(),
      durationSeconds: 0,
      status: 'active',
      mentor: {
        id: 'mentor-1',
        name: 'Dr. Sarah Amalia',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        role: 'mentor',
        isMicOn: true,
        isCameraOn: false,
        isHandRaised: false,
        isSpeaking: true,
        audioLevel: 50,
      },
      student: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: 'student',
        isMicOn: true,
        isCameraOn: false,
        isHandRaised: false,
        isSpeaking: false,
        audioLevel: 0,
      },
      messages: [
        {
          id: 'msg-init',
          senderId: 'mentor-1',
          senderName: 'Dr. Sarah Amalia',
          senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          text: `Halo ${currentUser.name}! Saya siap membantu membedah "${q.title}". Mari kita mulai uraikan di papan tulis ya.`,
          timestamp: 'Baru saja',
        },
      ],
      sharedNotes: '',
      sharedWhiteboard: [],
      bountyCoins: q.bountyCoins,
    };

    setActiveSession(newSession);
    setCurrentTab('whiteboard');
    showNotice('Sesi Live Audio-Visual & Whiteboard aktif! Terhubung dengan Mentor Dr. Sarah.');
  };

  // Request Instant Session with Specific Mentor
  const handleRequestInstantMentorSession = (mentor: MentorProfile) => {
    const newSession: StudyRoomSession = {
      id: `room_${Date.now()}`,
      title: `Bimbingan 1-on-1 bersama ${mentor.name}`,
      subject: mentor.specialties[0] || 'Matematika & Sains',
      startedAt: Date.now(),
      durationSeconds: 0,
      status: 'active',
      mentor: {
        id: mentor.id,
        name: mentor.name,
        avatar: mentor.avatar,
        role: 'mentor',
        isMicOn: true,
        isCameraOn: false,
        isHandRaised: false,
        isSpeaking: true,
        audioLevel: 60,
      },
      student: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: 'student',
        isMicOn: true,
        isCameraOn: false,
        isHandRaised: false,
        isSpeaking: false,
        audioLevel: 0,
      },
      messages: [
        {
          id: 'msg-1',
          senderId: mentor.id,
          senderName: mentor.name,
          senderAvatar: mentor.avatar,
          text: `Halo ${currentUser.name}! Senang bisa membimbing kamu hari ini. Silakan tulis soal atau rumus yang ingin kita diskusikan di whiteboard.`,
          timestamp: 'Baru saja',
        },
      ],
      sharedNotes: '',
      sharedWhiteboard: [],
      bountyCoins: mentor.hourlyCoins,
    };

    setActiveSession(newSession);
    setCurrentTab('whiteboard');
    showNotice(`Terhubung ke ruang belajar 1-on-1 dengan ${mentor.name}!`);
  };

  // End Session & Trigger Rewards and Mentor Reputation
  const handleEndSession = async (stats: { rating: number; review: string; bonusCoins: number }) => {
    const endedSession = activeSession;
    setActiveSession(null);
    setCurrentTab('gamification');

    const totalEarnedXp = 150;
    const newXp = currentUser.xp + totalEarnedXp;
    const newLevel = newXp >= currentUser.xpToNextLevel ? currentUser.level + 1 : currentUser.level;
    const newCoins = currentUser.temanCoins + 25; // Student completion bonus

    // Award mentor reputation & store review in DB
    if (endedSession && endedSession.mentor) {
      const mentorId = endedSession.mentor.id;
      const pointsAwarded = stats.rating === 5 ? 75 : stats.rating === 4 ? 50 : 30;
      
      const result = await submitMentorReview(mentorId, {
        rating: stats.rating,
        comment: stats.review || 'Sesi bimbingan papan tulis sangat membantu menyelesaikan soal!',
        pointsAwarded,
        sessionType: 'Live Whiteboard 1-on-1',
      });

      if (!result.error) {
        // Also update local state for the mentor to reflect the review
        handleAddReview(mentorId, {
          mentorId: mentorId,
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
          reviewerAvatar: currentUser.avatar,
          reviewerAcademicLevel: currentUser.academicLevel || currentUser.universityOrSchool || 'Pelajar TemanTugas',
          rating: stats.rating,
          tags: ['Live Whiteboard', 'Penjelasan Jelas', 'Sabar & Ramah'],
          comment: stats.review || 'Sesi bimbingan papan tulis sangat membantu menyelesaikan soal!',
          pointsAwarded,
          sessionType: 'Live Whiteboard 1-on-1',
        });
      }
    }

    setCurrentUser((prev) => ({
      ...prev,
      xp: newXp,
      level: newLevel,
      temanCoins: newCoins,
      honorScore: prev.honorScore + 40,
      totalHelpSessions: prev.totalHelpSessions + 1,
      badges: prev.badges.map((b) => {
        if (b.id === 'b3') {
          const nextProg = b.progress + 1;
          return { ...b, progress: nextProg, unlocked: nextProg >= b.maxProgress };
        }
        return b;
      }),
    }));

    showNotice(`Sesi selesai! Anda meraih +${totalEarnedXp} XP, +25 TemanCoins. Data berhasil disimpan.`);
    confetti({ particleCount: 100, spread: 90 });
  };

  // Claim Reward
  const handleClaimReward = async (rewardId: string, cost: number) => {
    const result = await claimReward(cost);
    if (result.error) {
      alert(result.error);
      return;
    }

    setRewards((prev) => prev.map((r) => (r.id === rewardId ? { ...r, claimed: true } : r)));
    setCurrentUser((prev) => ({
      ...prev,
      temanCoins: prev.temanCoins - cost,
      honorScore: prev.honorScore + 100,
    }));
    showNotice('Berhasil menukarkan reward!');
  };

  // Submit Mentor Application
  const handleOnboardMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await onboardMentor({
      universityOrSchool: mentorCampus,
      academicLevel: mentorAcademicLevel,
      expertSubjects: mentorSpecialty.split(',').map((s) => s.trim()),
      bio: mentorBio,
    });

    if (result.error) {
      alert(result.error);
      return;
    }

    const newMentorProfile: MentorProfile = {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username || currentUser.name.toLowerCase().replace(/\s+/g, '_'),
      avatar: currentUser.avatar,
      school: mentorCampus,
      academicLevel: mentorAcademicLevel,
      rating: 5.0,
      reviewsCount: 1,
      ratingDistribution: { 5: 1, 4: 0, 3: 0, 2: 0, 1: 0 },
      reputationPoints: Math.max(currentUser.reputationPoints || 0, 500),
      reputationTier: 'Trusted Peer',
      successRate: 100,
      hourlyCoins: 40,
      isOnline: true,
      bio: mentorBio,
      specialties: mentorSpecialty.split(',').map((s) => s.trim()),
      totalSessions: 1,
      responseRateMinutes: 2,
      badges: ['Verified Peer Tutor', 'New Star'],
      sampleSolutions: 12,
      availableNow: true,
      joinedDate: 'Hari ini',
      endorsements: mentorSpecialty.split(',').map((s) => ({ subject: s.trim(), count: 5, endorsedBy: ['Komunitas TemanTugas'] })),
      reviews: [],
      pastAssistance: [],
    };

    setMentors((prev) => [newMentorProfile, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      activeRole: 'mentor',
      role: 'mentor',
      academicLevel: mentorAcademicLevel,
      universityOrSchool: mentorCampus,
      bio: mentorBio,
      expertSubjects: mentorSpecialty.split(',').map((s) => s.trim()),
      reputationPoints: Math.max(prev.reputationPoints || 0, 500),
      reputationTier: 'Trusted Peer',
    }));
    setShowMentorOnboardModal(false);
    showNotice('Selamat! Profil Mentor Rekan Anda telah aktif di Marketplace.');
    confetti({ particleCount: 80, spread: 70 });
  };

  return (
    <div id="temantugas-app" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner Notice if triggered */}
      {bannerNotice && (
        <div className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 text-center shadow-md flex items-center justify-center gap-2 animate-fade-in z-50">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{bannerNotice}</span>
        </div>
      )}

      {/* Main Global Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onToggleRole={handleToggleRole}
        onOpenProfile={handleOpenOwnProfile}
        activeRoomActive={!!activeSession}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* Tab 1: Questions Board (StackOverflow + Brainly) */}
        {currentTab === 'questions' && (
          <QuestionsBoard
            questions={questions}
            currentUser={currentUser}
            onAskQuestion={handleAskQuestion}
            onStartLiveSession={handleStartLiveSessionFromQuestion}
            onUpvoteQuestion={handleUpvoteQuestion}
            onAddAnswer={handleAddAnswer}
            onAcceptAnswer={handleAcceptAnswer}
            onOpenSocraticHint={(q) => setSocraticQuestion(q)}
          />
        )}

        {/* Tab 2: Live Study Room or Interactive Whiteboard Sandbox */}
        {currentTab === 'whiteboard' && (
          activeSession ? (
            <LiveStudyRoom
              session={activeSession}
              currentUser={currentUser}
              onEndSession={handleEndSession}
              onLeaveRoom={() => setActiveSession(null)}
              onOpenSocraticHint={() => {
                const foundQ = questions.find((q) => q.id === activeSession.questionId) || {
                  id: 'q-live-hint',
                  title: activeSession.title,
                  description: 'Sesi bimbingan langsung di papan tulis interaktif.',
                  rawEquation: activeSession.targetEquation,
                  subject: activeSession.subject,
                  subTopic: 'Analisis Matematika & Sains',
                  difficulty: 'Sedang',
                  tags: ['LiveWhiteboard', activeSession.subject],
                  bountyCoins: 30,
                  bountyXp: 75,
                  askerId: currentUser.id,
                  askerName: currentUser.name,
                  askerAvatar: currentUser.avatar,
                  askerSchool: currentUser.universityOrSchool,
                  askerLevel: currentUser.level,
                  createdAt: 'Sesi aktif',
                  status: 'in_session',
                  answersCount: 0,
                  upvotes: 0,
                  views: 1,
                  answers: [],
                };
                setSocraticQuestion(foundQ);
              }}
            />
          ) : (
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 h-[calc(100vh-5rem)] flex flex-col">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Interactive Math & Science Whiteboard (Sandbox Mode)</h2>
                    <p className="text-xs text-slate-500">
                      Gunakan palet simbol matematika ($\int, \sum, \sqrt{}, \Delta$), pena, dan bangun geometri untuk mencoret ide.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('questions')}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Pilih Soal Dari Bank Tugas</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <Whiteboard
                  currentUser={{ id: currentUser.id, name: currentUser.name }}
                  partnerName="Papan Coretan Mandiri"
                  roomTitle="Interactive Whiteboard Sandbox"
                />
              </div>
            </div>
          )
        )}

        {/* Tab 3: Mentors Marketplace (Preply Style) */}
        {currentTab === 'mentors' && (
          <MentorMarketplace
            mentors={mentors}
            currentUser={currentUser}
            onRequestInstantSession={handleRequestInstantMentorSession}
            onBecomeMentorClick={() => setShowMentorOnboardModal(true)}
            onViewMentorProfile={handleViewMentorProfile}
          />
        )}

        {/* Tab 4: Gamification & Rewards */}
        {currentTab === 'gamification' && (
          <GamificationCenter
            currentUser={currentUser}
            rewards={rewards}
            leaderboard={leaderboard}
            onClaimReward={handleClaimReward}
          />
        )}
      </main>

      {/* User Detailed Profile & Reputation Modal */}
      {selectedUserProfile && (
        <UserProfileModal
          user={selectedUserProfile}
          currentUser={currentUser}
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          onStartSession={(targetUser) => {
            const asMentor = mentors.find((m) => m.id === targetUser.id) || {
              id: targetUser.id,
              name: targetUser.name,
              avatar: targetUser.avatar,
              school: targetUser.universityOrSchool || 'Perguruan Tinggi',
              rating: targetUser.rating || 5.0,
              reviewsCount: targetUser.reviewsCount || 1,
              hourlyCoins: targetUser.hourlyCoins || 40,
              isOnline: true,
              bio: targetUser.bio || '',
              specialties: targetUser.expertSubjects || ['Matematika'],
              totalSessions: targetUser.totalHelpSessions || 10,
              responseRateMinutes: 2,
              badges: ['Verified Peer Tutor'],
              sampleSolutions: targetUser.totalQuestionsSolved || 15,
              availableNow: true,
            };
            handleRequestInstantMentorSession(asMentor as MentorProfile);
          }}
          onAddReview={handleAddReview}
          onEndorseSubject={handleEndorseSubject}
          onVoteReviewHelpful={handleVoteReviewHelpful}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {/* Socratic AI Modal */}
      {socraticQuestion && (
        <SocraticModal
          question={socraticQuestion}
          onClose={() => setSocraticQuestion(null)}
          onOpenWhiteboardWithHint={(q, formula) => {
            handleStartLiveSessionFromQuestion({
              ...q,
              rawEquation: formula || q.rawEquation,
            });
            setSocraticQuestion(null);
          }}
        />
      )}

      {/* Become a Peer Mentor Modal */}
      {showMentorOnboardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto text-xs text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daftar Jadi Mentor Rekan Sebaya</h3>
                  <p className="text-[11px] text-slate-500">Bantu teman, dapatkan TemanCoins, poin reputasi & sertifikat mengajar</p>
                </div>
              </div>
              <button
                onClick={() => setShowMentorOnboardModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardMentorSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Asal Kampus / Sekolah:</label>
                <input
                  type="text"
                  required
                  value={mentorCampus}
                  onChange={(e) => setMentorCampus(e.target.value)}
                  placeholder="Contoh: Institut Teknologi Bandung (ITB)"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Jenjang Akademik:</label>
                <input
                  type="text"
                  required
                  value={mentorAcademicLevel}
                  onChange={(e) => setMentorAcademicLevel(e.target.value)}
                  placeholder="Contoh: Mahasiswa S1 Teknik Informatika (Semester 5)"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Keahlian Mata Pelajaran / Topik (Pisahkan koma):</label>
                <input
                  type="text"
                  required
                  value={mentorSpecialty}
                  onChange={(e) => setMentorSpecialty(e.target.value)}
                  placeholder="Contoh: Kalkulus Lanjut, Fisika Dasar, Algoritma Graf"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Bio Pengantar & Metode Membimbing:</label>
                <textarea
                  rows={3}
                  required
                  value={mentorBio}
                  onChange={(e) => setMentorBio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-3 rounded-xl focus:bg-white focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl text-[11px] text-emerald-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  Keuntungan Menjadi Mentor TemanTugas:
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                  <li>Dapatkan honor TemanCoins (dapat ditukarkan merchandise / buku / didonasikan)</li>
                  <li>Kumpulkan <strong>Poin Reputasi</strong> untuk naik ke jenjang <em>Elite Scholar</em> & <em>Master Mentor</em></li>
                  <li>Lencana eksklusif di profil & sertifikat resmi Jam Bimbingan Terverifikasi</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMentorOnboardModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md transition cursor-pointer"
                >
                  Aktifkan Profil Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

