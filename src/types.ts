export type SectionId = 'data_analysis' | 'applied_math' | 'general_knowledge' | 'verbal_reasoning' | 'mixed';

export interface Question {
  id: string;
  section: SectionId;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  fromSyllabus?: boolean;
  referenceSource?: string;
}

export type QuizMode = 'section_practice' | 'mixed_duel' | 'friend_duel' | 'leaderboard' | 'syllabus' | 'stats';

export interface TimerOption {
  id: string;
  label: string;
  seconds: number | null; // null means untimed
  description: string;
  badge?: string;
}

export interface UserStats {
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  currentStreak: number;
  bestStreak: number;
  ratingElo: number;
  sectionPerformance: Record<SectionId, { correct: number; total: number }>;
  history: QuizHistoryItem[];
}

export interface QuizHistoryItem {
  id: string;
  timestamp: number;
  mode: 'solo' | 'friend_duel';
  section: SectionId;
  score: number;
  total: number;
  timeSpentSec: number;
  timerMode: string;
  accuracy: number;
}

export interface FriendDuelPlayer {
  name: string;
  score: number;
  university: string;
  avatarColor: string;
  answers: (number | null)[];
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  university: string;
  rating: number;
  duelsWon: number;
  accuracy: number;
  bestSection: string;
  badge: string;
  avatarSeed: string;
  isCurrentUser?: boolean;
}
