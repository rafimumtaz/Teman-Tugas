export interface PastAssistance {
  id: string;
  title: string;
  subject: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentSchool?: string;
  type: 'live_session' | 'qna_solution' | 'socratic_hint';
  date: string;
  rating: number; // 1 to 5
  reviewSnippet?: string;
  pointsEarned: number; // Reputation points earned
  coinsEarned: number; // TemanCoins earned
  isAccepted: boolean;
  durationMinutes?: number;
}

export interface MentorReview {
  id: string;
  mentorId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerAcademicLevel: string;
  rating: number; // 1 to 5
  tags: string[];
  comment: string;
  createdAt: string;
  pointsAwarded: number;
  sessionType: string;
  helpfulCount: number;
  userVotedHelpful?: boolean;
}

export interface Endorsement {
  subject: string;
  count: number;
  endorsedBy: string[];
}

export type ReputationTier = 'Novice Mentor' | 'Trusted Peer' | 'Elite Scholar' | 'Master Mentor';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatar: string;
  role: 'student' | 'mentor' | 'scholar';
  academicLevel: string; // e.g. 'Mahasiswa S1 Teknik Elektro (Semester 5)'
  universityOrSchool: string;
  bio: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  temanCoins: number;
  honorScore: number;
  reputationPoints: number; // Points for successful mentorship & collaboration
  reputationTier: ReputationTier;
  rating: number;
  reviewsCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  streakDays: number;
  activeRole: 'student' | 'mentor';
  hourlyCoins: number;
  isOnline: boolean;
  totalHelpSessions: number;
  totalQuestionsSolved: number;
  successRate: number; // percentage, e.g. 98%
  badges: UserBadge[];
  expertSubjects: string[];
  pastAssistance: PastAssistance[];
  reviews: MentorReview[];
  endorsements: Endorsement[];
  joinedDate: string;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'math' | 'stem' | 'mentorship' | 'community' | 'streak' | 'impact';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  rawEquation?: string;
  subject: string;
  subTopic: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit' | 'Olimpiade';
  tags: string[];
  bountyCoins: number;
  bountyXp: number;
  askerId: string;
  askerName: string;
  askerAvatar: string;
  askerSchool: string;
  askerLevel: number;
  createdAt: string;
  status: 'open' | 'in_session' | 'resolved';
  answersCount: number;
  upvotes: number;
  userUpvoted?: boolean;
  views: number;
  answers: QuestionAnswer[];
  whiteboardSnapshot?: string;
  activeRoomId?: string;
}

export interface QuestionAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorSchool: string;
  authorLevel: number;
  authorBadges: string[];
  content: string;
  stepByStep: string[];
  formulas?: string[];
  createdAt: string;
  upvotes: number;
  userUpvoted?: boolean;
  isAccepted: boolean;
  isVerifiedByMentor: boolean;
  aiValidation?: {
    isCorrect: boolean;
    clarityScore: number;
    praise: string;
    improvementTip: string;
    suggestedHonorBonus: number;
  };
}

export interface MentorProfile {
  id: string;
  username: string;
  name: string;
  avatar: string;
  school: string;
  academicLevel: string;
  rating: number;
  reviewsCount: number;
  reputationPoints: number;
  reputationTier: ReputationTier;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  hourlyCoins: number;
  isOnline: boolean;
  bio: string;
  specialties: string[];
  totalSessions: number;
  responseRateMinutes: number;
  badges: string[];
  sampleSolutions: number;
  availableNow: boolean;
  successRate: number;
  pastAssistance: PastAssistance[];
  reviews: MentorReview[];
  endorsements: Endorsement[];
  joinedDate: string;
}

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  tool: 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'triangle' | 'axis' | 'text' | 'formula' | 'pan';
  color: string;
  size: number;
  points: WhiteboardPoint[];
  text?: string;
  formula?: string;
  authorId: string;
  authorName: string;
  timestamp: number;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'mentor' | 'observer';
  isMicOn: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

export interface RoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isFormula?: boolean;
}

export interface StudyRoomSession {
  id: string;
  title: string;
  subject: string;
  questionId?: string;
  questionTitle?: string;
  targetEquation?: string;
  startedAt: number;
  durationSeconds: number;
  status: 'pending' | 'connecting' | 'active' | 'completed' | 'rejected';
  mentor: RoomParticipant;
  student: RoomParticipant;
  messages: RoomMessage[];
  sharedNotes: string;
  sharedWhiteboard: WhiteboardElement[];
  bountyCoins: number;
}

export interface GamificationReward {
  id: string;
  title: string;
  description: string;
  costCoins: number;
  category: 'perk' | 'badge' | 'social_good' | 'swag';
  icon: string;
  claimed: boolean;
}

export interface LeaderboardUser {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  school: string;
  solvedCount: number;
  helpedStudents: number;
  honorScore: number;
  coinsEarned: number;
  topSubject: string;
  streakDays: number;
}
