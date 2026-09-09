import React from 'react';
import { QuizMode } from '../types';
import {
  Swords,
  Layers,
  Sparkles,
  Users2,
  Trophy,
  BookOpen,
  Volume2,
  VolumeX,
  Flame,
  GraduationCap
} from 'lucide-react';
import { duelSound } from '../utils/audio';
import { UserProfile } from '../utils/storage';

interface NavbarProps {
  currentMode: QuizMode;
  onSelectMode: (mode: QuizMode) => void;
  streak: number;
  profile: UserProfile;
  onOpenProfile: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  streak,
  profile,
  onOpenProfile,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-40 w-full border-b border-[#1b2b57] bg-[#070e26]/95 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo / Brand */}
        <div
          id="brand-logo"
          onClick={() => onSelectMode('section_practice')}
          className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-cyan-400/30 group-hover:scale-105 transition-transform">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-xl text-white font-mono">
                U<span className="text-cyan-400">DUEL</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                PRO TRAINER
              </span>
            </div>
            <span className="text-[11px] text-blue-200/70 font-medium hidden md:block">
              University Duel Competition Arena
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="main-navigation" className="hidden lg:flex items-center gap-1">
          <button
            id="nav-btn-sections"
            onClick={() => onSelectMode('section_practice')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentMode === 'section_practice'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200 hover:text-white hover:bg-[#121f42]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Section Drills
          </button>

          <button
            id="nav-btn-mixed"
            onClick={() => onSelectMode('mixed_duel')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentMode === 'mixed_duel'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold'
                : 'text-cyan-300 hover:text-white hover:bg-[#121f42]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Mixed Duel Mode
          </button>

          <button
            id="nav-btn-friend-duel"
            onClick={() => onSelectMode('friend_duel')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentMode === 'friend_duel'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-amber-300 hover:text-white hover:bg-[#121f42]'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            1v1 Friend Duel
          </button>

          <button
            id="nav-btn-leaderboard"
            onClick={() => onSelectMode('leaderboard')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentMode === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200 hover:text-white hover:bg-[#121f42]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Leaderboard
          </button>

          <button
            id="nav-btn-syllabus"
            onClick={() => onSelectMode('syllabus')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentMode === 'syllabus'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200 hover:text-white hover:bg-[#121f42]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Syllabus
          </button>
        </nav>

        {/* Right Actions: Streak, Audio, Profile */}
        <div className="flex items-center gap-2">
          {/* Streak Indicator */}
          <div
            id="streak-badge"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold"
            title={`${streak} consecutive duel accuracy streak`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{streak}</span>
          </div>

          {/* Audio toggle */}
          <button
            id="audio-toggle-btn"
            onClick={() => {
              duelSound.playTick();
              onToggleSound();
            }}
            aria-label="Toggle duel audio buzzer effects"
            className={`p-2 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? 'border-blue-500/40 bg-blue-950/60 text-cyan-300 hover:bg-blue-900/50'
                : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Audio buzzer enabled' : 'Audio muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Profile & University Tag */}
          <button
            id="user-profile-button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-[#1e346b] bg-[#0c183a] hover:bg-[#132454] transition-all text-left"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-xs font-bold text-white truncate max-w-[110px]">
                {profile.name || 'Contestant'}
              </span>
              <span className="text-[10px] text-cyan-300/80 flex items-center gap-1 truncate max-w-[110px]">
                <GraduationCap className="w-2.5 h-2.5 inline" />
                {profile.university.split(' ')[0]}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation */}
      <div id="mobile-nav-bar" className="lg:hidden flex items-center justify-between border-t border-[#152347] px-2 py-1.5 overflow-x-auto text-[11px] gap-1 bg-[#09122e]">
        <button
          onClick={() => onSelectMode('section_practice')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium flex items-center gap-1 ${
            currentMode === 'section_practice' ? 'bg-blue-600 text-white' : 'text-blue-200'
          }`}
        >
          <Layers className="w-3 h-3" /> Sections
        </button>
        <button
          onClick={() => onSelectMode('mixed_duel')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium flex items-center gap-1 ${
            currentMode === 'mixed_duel' ? 'bg-cyan-600 text-white' : 'text-cyan-300'
          }`}
        >
          <Sparkles className="w-3 h-3" /> Mixed Duel
        </button>
        <button
          onClick={() => onSelectMode('friend_duel')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium flex items-center gap-1 ${
            currentMode === 'friend_duel' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-300'
          }`}
        >
          <Users2 className="w-3 h-3" /> 1v1 Friends
        </button>
        <button
          onClick={() => onSelectMode('leaderboard')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium flex items-center gap-1 ${
            currentMode === 'leaderboard' ? 'bg-blue-600 text-white' : 'text-blue-200'
          }`}
        >
          <Trophy className="w-3 h-3" /> Ranks
        </button>
        <button
          onClick={() => onSelectMode('syllabus')}
          className={`px-2.5 py-1.5 rounded-md whitespace-nowrap font-medium flex items-center gap-1 ${
            currentMode === 'syllabus' ? 'bg-blue-600 text-white' : 'text-blue-200'
          }`}
        >
          <BookOpen className="w-3 h-3" /> Syllabus
        </button>
      </div>
    </header>
  );
};
