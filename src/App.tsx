import React, { useState, useEffect } from 'react';
import { QuizMode, SectionId, Question } from './types';
import { QUESTION_BANK } from './data/syllabusQuestions';
import { Navbar } from './components/Navbar';
import { PracticeConfig } from './components/PracticeConfig';
import { SoloQuiz } from './components/SoloQuiz';
import { FriendDuel } from './components/FriendDuel';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { SyllabusExplorer } from './components/SyllabusExplorer';
import { ProfileModal } from './components/ProfileModal';
import { getStoredProfile, getStoredStats, UserProfile } from './utils/storage';
import { duelSound } from './utils/audio';
import { shuffleArray } from './utils/shuffle';

export default function App() {
  const [currentMode, setCurrentMode] = useState<QuizMode>('section_practice');
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [stats, setStats] = useState(getStoredStats());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active Quiz State (Solo Practice / Mixed)
  const [activeQuizState, setActiveQuizState] = useState<{
    isActive: boolean;
    questions: Question[];
    section: SectionId;
    timerSeconds: number | null;
    timerLabel: string;
    config: {
      section: SectionId;
      questionCount: number;
      timerSeconds: number | null;
      timerLabel: string;
      questionPace?: 'fast_fire' | 'all' | 'syllabus';
    };
  } | null>(null);

  // Shared question set for Friend Duel
  const [friendDuelQuestions, setFriendDuelQuestions] = useState<Question[] | undefined>(undefined);

  useEffect(() => {
    // Check URL search params and hash for shared duel room if any
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let roomParam = searchParams.get('duelRoom');

      if (!roomParam && window.location.hash) {
        const hashStr = window.location.hash;
        if (hashStr.includes('duelRoom=')) {
          const match = hashStr.match(/duelRoom=([A-Za-z0-9_%-]+)/i);
          if (match && match[1]) {
            roomParam = decodeURIComponent(match[1]);
          }
        }
      }

      if (roomParam) {
        setCurrentMode('friend_duel');
      }
    } catch {}
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    duelSound.enabled = next;
    setSoundEnabled(next);
  };

  const handleStartPractice = (config: {
    section: SectionId;
    questionCount: number;
    timerSeconds: number | null;
    timerLabel: string;
    questionPace?: 'fast_fire' | 'all' | 'syllabus';
  }) => {
    let pool = QUESTION_BANK;
    if (config.section !== 'mixed') {
      pool = QUESTION_BANK.filter((q) => q.section === config.section);
    }

    // Filter or prioritize based on requested question pace
    const isSpeedTimer = config.timerSeconds !== null && config.timerSeconds <= 10;
    const preferFastFire =
      config.questionPace === 'fast_fire' ||
      (isSpeedTimer && config.questionPace !== 'all' && config.questionPace !== 'syllabus');

    let candidatePool: Question[];
    if (preferFastFire) {
      const fastFire = shuffleArray(pool.filter((q) => q.isFastFire));
      const standard = shuffleArray(pool.filter((q) => !q.isFastFire));
      candidatePool = [...fastFire, ...standard];
    } else if (config.questionPace === 'syllabus') {
      const syllabusOnly = shuffleArray(pool.filter((q) => q.fromSyllabus));
      const others = shuffleArray(pool.filter((q) => !q.fromSyllabus));
      candidatePool = [...syllabusOnly, ...others];
    } else {
      candidatePool = shuffleArray(pool);
    }

    // Always do a Fisher-Yates shuffle on the final selected questions
    const selectedQuestions = shuffleArray(candidatePool.slice(0, config.questionCount));

    setActiveQuizState({
      isActive: true,
      questions: selectedQuestions,
      section: config.section,
      timerSeconds: config.timerSeconds,
      timerLabel: config.timerLabel,
      config
    });
  };

  const handleChallengeFriend = (questions: Question[]) => {
    setActiveQuizState(null);
    setFriendDuelQuestions(shuffleArray(questions));
    setCurrentMode('friend_duel');
  };

  const handleRestartQuiz = () => {
    if (!activeQuizState) return;
    // Resample fresh randomized questions using the same config
    handleStartPractice(activeQuizState.config);
  };

  const refreshStats = () => {
    setStats(getStoredStats());
  };

  return (
    <div className="min-h-screen bg-[#050a1b] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Dark blue backdrop grid illumination */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,42,107,0.45),rgba(5,10,27,0))]" />

      {/* Top Navigation */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setActiveQuizState(null);
          setCurrentMode(mode);
          refreshStats();
        }}
        streak={stats.currentStreak}
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main App Arena */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-12">
        {activeQuizState && activeQuizState.isActive ? (
          <SoloQuiz
            questions={activeQuizState.questions}
            section={activeQuizState.section}
            timerSeconds={activeQuizState.timerSeconds}
            timerLabel={activeQuizState.timerLabel}
            onExit={() => {
              setActiveQuizState(null);
              refreshStats();
            }}
            onRestart={handleRestartQuiz}
            onChallengeFriend={handleChallengeFriend}
            onOpenLeaderboard={() => {
              setActiveQuizState(null);
              setCurrentMode('leaderboard');
              refreshStats();
            }}
          />
        ) : (
          <>
            {currentMode === 'section_practice' && (
              <PracticeConfig
                initialSection="data_analysis"
                onStartQuiz={handleStartPractice}
                onViewSyllabus={() => setCurrentMode('syllabus')}
              />
            )}

            {currentMode === 'mixed_duel' && (
              <PracticeConfig
                initialSection="mixed"
                onStartQuiz={handleStartPractice}
                onViewSyllabus={() => setCurrentMode('syllabus')}
              />
            )}

            {currentMode === 'friend_duel' && (
              <FriendDuel
                customQuestions={friendDuelQuestions}
                onExit={() => setCurrentMode('section_practice')}
                onOpenLeaderboard={() => setCurrentMode('leaderboard')}
              />
            )}

            {currentMode === 'leaderboard' && (
              <GlobalLeaderboard
                onStartPractice={() => {
                  setCurrentMode('mixed_duel');
                }}
              />
            )}

            {currentMode === 'syllabus' && (
              <SyllabusExplorer
                onStartTopicDrill={(secId) => {
                  handleStartPractice({
                    section: secId,
                    questionCount: 10,
                    timerSeconds: 20,
                    timerLabel: '20s Tournament'
                  });
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Contestant Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          refreshStats();
        }}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#121f42] bg-[#040816]/90 py-6 text-center text-xs text-blue-300/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>University Duel (UDuel) Official Syllabus Competition Trainer</span>
          <span>Data Analysis • Applied Mathematics • General Knowledge • Verbal Reasoning</span>
        </div>
      </footer>
    </div>
  );
}
