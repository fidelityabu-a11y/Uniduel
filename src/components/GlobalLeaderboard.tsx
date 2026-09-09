import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, QuizHistoryItem } from '../types';
import { getStoredLeaderboard, getStoredStats, getStoredProfile, saveStoredLeaderboard } from '../utils/storage';
import { fetchRealLeaderboard } from '../utils/duelRoomService';
import {
  Trophy,
  Medal,
  Flame,
  Search,
  Building2,
  GraduationCap,
  History,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Zap,
  Users
} from 'lucide-react';

interface GlobalLeaderboardProps {
  onStartPractice: () => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ onStartPractice }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUniversityFilter, setSelectedUniversityFilter] = useState<string>('all');
  const [historyItems, setHistoryItems] = useState<QuizHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history'>('leaderboard');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadLeaderboardData = async () => {
    setIsLoading(true);
    const local = getStoredLeaderboard();
    try {
      const serverEntries = await fetchRealLeaderboard();
      if (serverEntries && serverEntries.length > 0) {
        // Merge server and local, prioritizing server rankings
        const mergedMap = new Map<string, LeaderboardEntry>();
        local.forEach((e) => mergedMap.set(e.id, e));
        serverEntries.forEach((e) => mergedMap.set(e.id, e));
        let merged = Array.from(mergedMap.values());
        merged.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0) || b.rating - a.rating);
        merged = merged.map((e, idx) => ({ ...e, rank: idx + 1 }));
        setLeaderboard(merged);
        saveStoredLeaderboard(merged);
      } else {
        setLeaderboard(local);
      }
    } catch {
      setLeaderboard(local);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
    setHistoryItems(getStoredStats().history || []);
  }, []);

  const profile = getStoredProfile();
  const stats = getStoredStats();

  const userRankEntry = leaderboard.find((e) => e.isCurrentUser || e.id === 'user-self' || (e.name === profile.name && e.university === profile.university));

  const filteredEntries = leaderboard.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.bestSection.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUni =
      selectedUniversityFilter === 'all' || entry.university.includes(selectedUniversityFilter);

    return matchesSearch && matchesUni;
  });

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/30';
      case 2:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black shadow-md shadow-slate-400/20';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black shadow-md shadow-amber-700/20';
      default:
        return 'bg-[#0f1d45] text-blue-300 border border-blue-800 font-bold';
    }
  };

  return (
    <div id="leaderboard-page-container" className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1a40] via-[#0f2459] to-[#091538] border border-[#1e346f] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              GLOBAL UNIVERSITY DUEL LEAGUE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Contestant <span className="text-cyan-400">Leaderboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl">
              Track your ELO rating, duel win count, and accuracy against premier university duelists across Nigeria and Africa.
            </p>
          </div>

          {/* User's Current Standing Quick Widget */}
          <div className="p-4 rounded-xl bg-[#091330]/90 border border-cyan-400/40 shadow-xl space-y-2 min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-blue-300">
              <span>Your Official Standing</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-400 text-slate-950 font-bold">YOU</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                #{userRankEntry ? userRankEntry.rank : '—'}
              </span>
              <span className="text-xs text-cyan-300 font-mono font-bold">
                {stats.ratingElo} ELO
              </span>
            </div>
            <div className="text-[11px] text-blue-300/70 truncate">
              {profile.university.split(' ')[0]} • {stats.totalQuizzesTaken} Duels Completed
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Leaderboard vs Recent Duels History) */}
      <div className="flex items-center justify-between border-b border-[#182954] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-300 hover:text-white hover:bg-[#0f1d45]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Live Global Standings
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-300 hover:text-white hover:bg-[#0f1d45]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            Your Duel History ({historyItems.length})
          </button>
        </div>

        <button
          onClick={onStartPractice}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Climb Rankings Now
        </button>
      </div>

      {activeTab === 'leaderboard' ? (
        <div className="space-y-4">
          {/* Filters, Search Bar, and Refresh Standings */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search real duelists, universities, or specialty sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#091433] border border-[#1b2f63] text-white text-xs placeholder-blue-300/40 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <select
                value={selectedUniversityFilter}
                onChange={(e) => setSelectedUniversityFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-[#091433] border border-[#1b2f63] text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Universities</option>
                <option value="Lagos">UNILAG</option>
                <option value="Ibadan">UI</option>
                <option value="Awolowo">OAU</option>
                <option value="Bello">ABU</option>
                <option value="Nsukka">UNN</option>
                <option value="Covenant">Covenant</option>
                <option value="Akure">FUTA</option>
              </select>

              <button
                onClick={loadLeaderboardData}
                disabled={isLoading}
                title="Sync Latest Real Duel Scores"
                className="px-3 py-2.5 rounded-xl bg-[#091433] border border-[#1b2f63] hover:border-cyan-400 text-blue-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="overflow-hidden rounded-2xl bg-[#091433] border border-[#192b57] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c1a40] text-blue-300 font-bold uppercase tracking-wider border-b border-[#182954]">
                  <tr>
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Duelist & University</th>
                    <th className="py-3.5 px-4 text-right">Points</th>
                    <th className="py-3.5 px-4 text-right">Rating ELO</th>
                    <th className="py-3.5 px-4 text-right">Duels Won</th>
                    <th className="py-3.5 px-4 text-right">Accuracy</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Specialty</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Tier Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#132349]">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <Trophy className="w-10 h-10 text-amber-400/60 mx-auto" />
                          <h4 className="font-bold text-white text-base">Real Leaderboard</h4>
                          <p className="text-xs text-blue-300/70">
                            No made-up names! Only real contestants who have earned points in 1v1 duels or solo syllabus practice appear here.
                          </p>
                          <button
                            onClick={onStartPractice}
                            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30"
                          >
                            Play Duel to Earn First Points
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`hover:bg-[#0e1d47] transition-colors ${
                          entry.isCurrentUser ? 'bg-blue-950/70 font-semibold ring-1 ring-inset ring-cyan-400/40' : ''
                        }`}
                      >
                        {/* Rank Number */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs ${getRankBadgeColor(
                              entry.rank
                            )}`}
                          >
                            {entry.rank}
                          </span>
                        </td>

                        {/* Name & University */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/80 border border-cyan-400/40 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {entry.name ? entry.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {entry.name}
                                {entry.isCurrentUser && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-400 text-slate-950 font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-blue-300/80 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-blue-400" />
                                {entry.university}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                          {entry.totalPoints !== undefined ? entry.totalPoints : 0} pts
                        </td>

                        {/* ELO Rating */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300 text-sm">
                          {entry.rating}
                        </td>

                        {/* Duels Won */}
                        <td className="py-3.5 px-4 text-right font-mono text-white">
                          {entry.duelsWon}
                        </td>

                        {/* Accuracy */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-mono font-bold ${
                              entry.accuracy >= 90
                                ? 'text-emerald-400'
                                : entry.accuracy >= 75
                                ? 'text-cyan-300'
                                : 'text-amber-400'
                            }`}
                          >
                            {entry.accuracy}%
                          </span>
                        </td>

                        {/* Best Branch */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-900/40 text-blue-200 border border-blue-700/30">
                            {entry.bestSection}
                          </span>
                        </td>

                        {/* Tier Badge */}
                        <td className="py-3.5 px-4 hidden lg:table-cell">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {entry.badge}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-3">
          {historyItems.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#091433] border border-[#182954] text-center space-y-3">
              <History className="w-8 h-8 text-blue-400 mx-auto" />
              <h3 className="font-bold text-white text-sm">No Duel Records Yet</h3>
              <p className="text-xs text-blue-300/70 max-w-sm mx-auto">
                Take your first practice round or multiplayer duel to build your match history and track progress.
              </p>
              <button
                onClick={onStartPractice}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Start First Practice Round
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {historyItems.map((item) => {
                const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#091433] border border-[#182a57] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-cyan-300 uppercase">
                          {item.section.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-blue-300/70">{item.timerMode}</span>
                      </div>
                      <span className="text-xs text-blue-400/80 block">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs text-blue-300 block">Score</span>
                        <span className="font-bold font-mono text-white text-sm">
                          {item.score} / {item.total}
                        </span>
                      </div>

                      <div className="text-right min-w-[60px]">
                        <span className="text-xs text-blue-300 block">Accuracy</span>
                        <span
                          className={`font-bold font-mono text-sm ${
                            item.accuracy >= 70 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {item.accuracy}%
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-blue-300 block">Time</span>
                        <span className="font-mono text-xs text-blue-200">
                          {item.timeSpentSec}s
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
