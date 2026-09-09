import { LeaderboardEntry, QuizHistoryItem, UserStats } from '../types';
import { INITIAL_LEADERBOARD } from '../data/syllabusQuestions';

const STATS_KEY = 'uduel_user_stats_v1';
const PROFILE_KEY = 'uduel_user_profile_v1';
const LEADERBOARD_KEY = 'uduel_leaderboard_v1';

export interface UserProfile {
  name: string;
  university: string;
  avatarSeed: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Contestant You',
  university: 'University of Lagos (UNILAG)',
  avatarSeed: 'Duelist1'
};

const DEFAULT_STATS: UserStats = {
  totalQuizzesTaken: 0,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  currentStreak: 0,
  bestStreak: 0,
  ratingElo: 1500,
  sectionPerformance: {
    data_analysis: { correct: 0, total: 0 },
    applied_math: { correct: 0, total: 0 },
    general_knowledge: { correct: 0, total: 0 },
    verbal_reasoning: { correct: 0, total: 0 },
    mixed: { correct: 0, total: 0 }
  },
  history: []
};

export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function getStoredStats(): UserStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStoredStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function recordQuizCompletion(
  historyItem: QuizHistoryItem,
  answersBySection: Record<string, { correct: number; total: number }>
): UserStats {
  const currentStats = getStoredStats();
  const profile = getStoredProfile();

  const newTotalQuizzes = currentStats.totalQuizzesTaken + 1;
  const newTotalAnswered = currentStats.totalQuestionsAnswered + historyItem.total;
  const newTotalCorrect = currentStats.totalCorrect + historyItem.score;

  // Streak logic
  let newStreak = currentStats.currentStreak;
  if (historyItem.accuracy >= 70) {
    newStreak += 1;
  } else if (historyItem.accuracy < 50) {
    newStreak = 0;
  }
  const newBestStreak = Math.max(newStreak, currentStats.bestStreak);

  // ELO calculation: gain points based on accuracy and speed
  const scoreRatio = historyItem.total > 0 ? historyItem.score / historyItem.total : 0;
  const eloDelta = Math.round((scoreRatio - 0.5) * 40 + (historyItem.score * 5));
  const newRating = Math.max(1200, currentStats.ratingElo + eloDelta);

  const updatedSectionPerf = { ...currentStats.sectionPerformance };
  Object.entries(answersBySection).forEach(([sec, data]) => {
    const s = sec as keyof typeof updatedSectionPerf;
    if (updatedSectionPerf[s]) {
      updatedSectionPerf[s] = {
        correct: updatedSectionPerf[s].correct + data.correct,
        total: updatedSectionPerf[s].total + data.total
      };
    }
  });

  const updatedStats: UserStats = {
    ...currentStats,
    totalQuizzesTaken: newTotalQuizzes,
    totalQuestionsAnswered: newTotalAnswered,
    totalCorrect: newTotalCorrect,
    currentStreak: newStreak,
    bestStreak: newBestStreak,
    ratingElo: newRating,
    sectionPerformance: updatedSectionPerf,
    history: [historyItem, ...currentStats.history.slice(0, 49)]
  };

  saveStoredStats(updatedStats);
  updateLeaderboardWithUser(profile, updatedStats);
  return updatedStats;
}

export function getStoredLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return INITIAL_LEADERBOARD;
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return INITIAL_LEADERBOARD;
    return JSON.parse(raw);
  } catch {
    return INITIAL_LEADERBOARD;
  }
}

export function updateLeaderboardWithUser(profile: UserProfile, stats: UserStats): LeaderboardEntry[] {
  let entries = getStoredLeaderboard();
  const accuracy = stats.totalQuestionsAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 1000) / 10
    : 0;

  // Find best section
  let bestSec = 'Mixed Duel';
  let bestRatio = -1;
  Object.entries(stats.sectionPerformance).forEach(([sec, d]) => {
    if (d.total >= 3) {
      const ratio = d.correct / d.total;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestSec = sec.replace('_', ' ').toUpperCase();
      }
    }
  });

  const userEntry: LeaderboardEntry = {
    id: 'user-self',
    rank: 0,
    name: profile.name || 'You',
    university: profile.university,
    rating: stats.ratingElo,
    duelsWon: Math.floor(stats.totalQuizzesTaken * 0.7),
    accuracy: accuracy,
    bestSection: bestSec,
    badge: stats.ratingElo > 2300 ? 'Master Duelist' : stats.ratingElo > 1800 ? 'Varsity Champion' : 'Rising Duelist',
    avatarSeed: profile.avatarSeed,
    isCurrentUser: true
  };

  // Replace or add user
  entries = entries.filter((e) => !e.isCurrentUser && e.id !== 'user-self');
  entries.push(userEntry);

  // Sort by rating descending
  entries.sort((a, b) => b.rating - a.rating);

  // Re-rank
  entries = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {}

  return entries;
}
