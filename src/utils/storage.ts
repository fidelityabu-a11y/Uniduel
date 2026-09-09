import { LeaderboardEntry, QuizHistoryItem, UserStats } from '../types';
import { INITIAL_LEADERBOARD } from '../data/syllabusQuestions';
import { submitScoreToRealLeaderboard, getOrCreateClientId } from './duelRoomService';

const STATS_KEY = 'uduel_user_stats_v1';
const PROFILE_KEY = 'uduel_user_profile_v1';
const LEADERBOARD_KEY = 'uduel_leaderboard_v2';
const LOCAL_DUEL_KEY = 'uduel_local_duel_state_v1';
const ONLINE_ROOM_KEY = 'uduel_online_room_code_v1';

export interface StoredLocalDuelState {
  isActive: boolean;
  questions: any[];
  currentQIndex: number;
  p1Score: number;
  p2Score: number;
  hostName: string;
  hostUni: string;
  guestName: string;
  guestUni: string;
  selectedSection: string;
  questionCount: number;
  isFinished?: boolean;
}

export function getStoredLocalDuel(): StoredLocalDuelState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_DUEL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredLocalDuel(state: StoredLocalDuelState | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (state && state.isActive) {
      localStorage.setItem(LOCAL_DUEL_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(LOCAL_DUEL_KEY);
    }
  } catch {}
}

export function clearStoredLocalDuel(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_DUEL_KEY);
  } catch {}
}

export function getStoredOnlineRoomId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ONLINE_ROOM_KEY);
  } catch {
    return null;
  }
}

export function saveStoredOnlineRoomId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(ONLINE_ROOM_KEY, id);
    } else {
      localStorage.removeItem(ONLINE_ROOM_KEY);
    }
  } catch {}
}

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
    window.dispatchEvent(new CustomEvent('uduel_profile_updated', { detail: profile }));
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

  // Submit to server real leaderboard
  submitScoreToRealLeaderboard({
    playerId: getOrCreateClientId(),
    name: profile.name,
    university: profile.university,
    points: historyItem.score * 10,
    ratingDelta: eloDelta,
    accuracy: historyItem.accuracy,
    bestSection: historyItem.section
  }).catch(() => {});

  return updatedStats;
}

export function getStoredLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return INITIAL_LEADERBOARD;
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return INITIAL_LEADERBOARD;
    const parsed: LeaderboardEntry[] = JSON.parse(raw);
    // Purge any old fake IDs
    const realOnly = parsed.filter((e) => !e.id.startsWith('lb-'));
    return realOnly;
  } catch {
    return INITIAL_LEADERBOARD;
  }
}

export function saveStoredLeaderboard(entries: LeaderboardEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {}
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

  const totalPoints = stats.totalCorrect * 10;

  const userEntry: LeaderboardEntry = {
    id: 'user-self',
    rank: 0,
    name: profile.name || 'You',
    university: profile.university,
    rating: stats.ratingElo,
    totalPoints: totalPoints,
    duelsWon: Math.floor(stats.totalQuizzesTaken * 0.7),
    accuracy: accuracy,
    bestSection: bestSec,
    badge: stats.ratingElo > 2300 || totalPoints >= 300 ? 'Championship Grandmaster' : stats.ratingElo > 1800 || totalPoints >= 100 ? 'Varsity Champion' : 'Rising Duelist',
    avatarSeed: profile.avatarSeed,
    isCurrentUser: true
  };

  // Replace or add user
  entries = entries.filter((e) => !e.isCurrentUser && e.id !== 'user-self');
  // Add user to leaderboard so they can see where they stand
  entries.push(userEntry);

  // Sort by totalPoints descending, then rating descending
  entries.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0) || b.rating - a.rating);

  // Re-rank
  entries = entries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));

  saveStoredLeaderboard(entries);
  return entries;
}

export function recordContestantDuelResult(contestant: {
  id?: string;
  name: string;
  university: string;
  pointsWon: number;
  isWinner: boolean;
  accuracy?: number;
  section?: string;
}): void {
  if (!contestant.name) return;
  let entries = getStoredLeaderboard();
  const id = contestant.id || `duelist_${contestant.name.toLowerCase().replace(/\s+/g, '_')}`;

  const existing = entries.find((e) => e.id === id || (e.name.toLowerCase() === contestant.name.toLowerCase() && e.university === contestant.university));
  const newPoints = (existing?.totalPoints || 0) + contestant.pointsWon;
  const newDuelsWon = (existing?.duelsWon || 0) + (contestant.isWinner ? 1 : 0);
  const newRating = (existing?.rating || 1500) + (contestant.isWinner ? 25 : 5);

  const updatedEntry: LeaderboardEntry = {
    id,
    rank: 0,
    name: contestant.name,
    university: contestant.university,
    totalPoints: newPoints,
    rating: newRating,
    duelsWon: newDuelsWon,
    accuracy: contestant.accuracy || existing?.accuracy || 85,
    bestSection: contestant.section || existing?.bestSection || '1v1 Duel Arena',
    badge: newRating >= 2200 || newPoints >= 200 ? 'Championship Grandmaster' : newRating >= 1800 || newPoints >= 100 ? 'Varsity Champion' : 'Rising Duelist',
    avatarSeed: contestant.name,
    isCurrentUser: contestant.id === 'user-self' || existing?.isCurrentUser
  };

  entries = entries.filter((e) => e.id !== id && e.id !== existing?.id);
  entries.push(updatedEntry);

  entries.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0) || b.rating - a.rating);
  entries = entries.map((e, idx) => ({ ...e, rank: idx + 1 }));

  saveStoredLeaderboard(entries);

  // Submit to server
  submitScoreToRealLeaderboard({
    playerId: id,
    name: contestant.name,
    university: contestant.university,
    points: contestant.pointsWon,
    isDuelWin: contestant.isWinner,
    ratingDelta: contestant.isWinner ? 25 : 5,
    accuracy: contestant.accuracy,
    bestSection: contestant.section
  }).catch(() => {});
}
