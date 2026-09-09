import React, { useState } from 'react';
import { NIGERIAN_UNIVERSITIES } from '../data/syllabusQuestions';
import { UserProfile, saveStoredProfile, getStoredStats, updateLeaderboardWithUser } from '../utils/storage';
import { X, GraduationCap, User, Trophy, Flame, Check } from 'lucide-react';
import { duelSound } from '../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [university, setUniversity] = useState<string>(profile.university);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const stats = getStoredStats();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    duelSound.playCorrect();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'Contestant',
      university
    };
    saveStoredProfile(updated);
    updateLeaderboardWithUser(updated, stats);
    onProfileUpdated(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#091433] border border-[#1d3570] shadow-2xl p-6 space-y-6 relative text-left">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-[#11214d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Contestant Profile</h3>
          </div>
          <p className="text-xs text-blue-200/70">
            Set your contestant identity and university colors for the University Duel global leaderboard.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#060e24] border border-blue-900/60 text-center">
          <div>
            <span className="text-[10px] text-blue-400 block">Rating ELO</span>
            <span className="font-mono font-bold text-cyan-300 text-sm">{stats.ratingElo}</span>
          </div>
          <div>
            <span className="text-[10px] text-blue-400 block">Duels Run</span>
            <span className="font-mono font-bold text-white text-sm">{stats.totalQuizzesTaken}</span>
          </div>
          <div>
            <span className="text-[10px] text-blue-400 block">Streak</span>
            <span className="font-mono font-bold text-amber-400 text-sm flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 fill-amber-400" /> {stats.currentStreak}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-blue-200 block mb-1">
              Duelist Name / Stage Alias
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tunde Adebayo"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-blue-200 block mb-1">
              University Affiliation
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                {NIGERIAN_UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-blue-800 text-xs font-semibold text-blue-300 hover:bg-[#11214d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/30"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              {isSaved ? 'Saved!' : 'Save Contestant Info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
