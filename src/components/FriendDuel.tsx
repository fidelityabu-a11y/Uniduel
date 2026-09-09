import React, { useState, useEffect, useRef } from 'react';
import { Question, SectionId } from '../types';
import { QUESTION_BANK, NIGERIAN_UNIVERSITIES } from '../data/syllabusQuestions';
import { duelSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Users2,
  Swords,
  Zap,
  RotateCcw,
  Trophy,
  Share2,
  Copy,
  Check,
  Award,
  Clock,
  ArrowRight,
  ShieldAlert,
  Flame,
  Radio,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Play,
  Save,
  Pause
} from 'lucide-react';
import {
  getStoredProfile,
  saveStoredProfile,
  UserProfile,
  recordContestantDuelResult,
  getStoredLocalDuel,
  saveStoredLocalDuel,
  clearStoredLocalDuel,
  getStoredOnlineRoomId,
  saveStoredOnlineRoomId,
  StoredLocalDuelState
} from '../utils/storage';
import { shuffleArray, shuffleQuestionsDeep } from '../utils/shuffle';
import {
  DuelRoom,
  createDuelRoom,
  joinDuelRoom,
  startDuelMatch,
  leaveDuelRoom,
  subscribeToDuelRoom,
  getOrCreateClientId,
  getDuelRoom,
  normalizeRoomCode
} from '../utils/duelRoomService';
import { OnlineRoomLobby } from './OnlineRoomLobby';
import { OnlineRoomArena } from './OnlineRoomArena';

interface FriendDuelProps {
  customQuestions?: Question[];
  onExit: () => void;
  onOpenLeaderboard: () => void;
}

type DuelFormat = 'room_code' | 'buzzer_battle';

export const FriendDuel: React.FC<FriendDuelProps> = ({
  customQuestions,
  onExit,
  onOpenLeaderboard
}) => {
  const [storedProfile, setStoredProfile] = useState<UserProfile>(getStoredProfile());
  const [myPlayerId, setMyPlayerId] = useState<string>(() => getOrCreateClientId());

  // Format selection ('room_code' by default for online challenge)
  const [duelFormat, setDuelFormat] = useState<DuelFormat>('room_code');

  // Shared Profile Setup initialized with stored profile
  const [hostName, setHostName] = useState<string>(storedProfile.name || 'Contestant');
  const [hostUni, setHostUni] = useState<string>(storedProfile.university || 'University of Lagos (UNILAG)');
  const [guestName, setGuestName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uduel_guest_name');
      if (saved) return saved;
    }
    return 'Challenger';
  });
  const [guestUni, setGuestUni] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uduel_guest_uni');
      if (saved) return saved;
    }
    return 'Obafemi Awolowo University (OAU)';
  });

  // Auto-listen to profile updates so user profile changes update host
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      const updated: UserProfile = e.detail || getStoredProfile();
      setStoredProfile(updated);
      if (updated.name) setHostName(updated.name);
      if (updated.university) setHostUni(updated.university);
    };

    window.addEventListener('uduel_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('uduel_profile_updated', handleProfileUpdate);
  }, []);

  const updateAndSaveHostName = (name: string) => {
    setHostName(name);
    const updated = { ...storedProfile, name };
    saveStoredProfile(updated);
    setStoredProfile(updated);
  };

  const updateAndSaveHostUni = (uni: string) => {
    setHostUni(uni);
    const updated = { ...storedProfile, university: uni };
    saveStoredProfile(updated);
    setStoredProfile(updated);
  };

  const updateAndSaveGuestName = (name: string) => {
    setGuestName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uduel_guest_name', name);
    }
  };

  const updateAndSaveGuestUni = (uni: string) => {
    setGuestUni(uni);
    if (typeof window !== 'undefined') {
      localStorage.setItem('uduel_guest_uni', uni);
    }
  };

  const [questionCount, setQuestionCount] = useState<number>(8);
  const [selectedSection, setSelectedSection] = useState<SectionId>('mixed');

  // Online Challenge Room State
  const [activeOnlineRoom, setActiveOnlineRoom] = useState<DuelRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [guestJoinedNotification, setGuestJoinedNotification] = useState<string | null>(null);
  const [urlInviteCode, setUrlInviteCode] = useState<string | null>(null);

  // Local Same-Device Buzzer Battle State
  const [isLocalDuelActive, setIsLocalDuelActive] = useState<boolean>(false);
  const [localActiveQuestions, setLocalActiveQuestions] = useState<Question[]>([]);
  const [localCurrentQIndex, setLocalCurrentQIndex] = useState<number>(0);
  const [localP1Score, setLocalP1Score] = useState<number>(0);
  const [localP2Score, setLocalP2Score] = useState<number>(0);
  const [localRoundAnswered, setLocalRoundAnswered] = useState<boolean>(false);
  const [localSelectedOption, setLocalSelectedOption] = useState<number | null>(null);
  const [localWinningPlayer, setLocalWinningPlayer] = useState<1 | 2 | null>(null);
  const [localLockedPlayers, setLocalLockedPlayers] = useState<(1 | 2)[]>([]);
  const [localRoundFeedback, setLocalRoundFeedback] = useState<string | null>(null);
  const [localCountdown, setLocalCountdown] = useState<number>(15);
  const [localIsFinished, setLocalIsFinished] = useState<boolean>(false);

  const localTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localAutoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore stored active local duel or stored online room on mount
  useEffect(() => {
    // 1. Check local duel persistence
    const savedLocal = getStoredLocalDuel();
    if (savedLocal && savedLocal.isActive && !savedLocal.isFinished && savedLocal.questions && savedLocal.questions.length > 0) {
      setLocalActiveQuestions(savedLocal.questions);
      setLocalCurrentQIndex(savedLocal.currentQIndex || 0);
      setLocalP1Score(savedLocal.p1Score || 0);
      setLocalP2Score(savedLocal.p2Score || 0);
      if (savedLocal.hostName) setHostName(savedLocal.hostName);
      if (savedLocal.hostUni) setHostUni(savedLocal.hostUni);
      if (savedLocal.guestName) setGuestName(savedLocal.guestName);
      if (savedLocal.guestUni) setGuestUni(savedLocal.guestUni);
      if (savedLocal.selectedSection) setSelectedSection(savedLocal.selectedSection as SectionId);
      if (savedLocal.questionCount) setQuestionCount(savedLocal.questionCount);
      setIsLocalDuelActive(true);
      setDuelFormat('buzzer_battle');
    }

    // 2. Check online room persistence
    const savedRoomId = getStoredOnlineRoomId();
    if (savedRoomId && !activeOnlineRoom) {
      getDuelRoom(savedRoomId).then((room) => {
        if (room && room.status !== 'finished') {
          setActiveOnlineRoom(room);
          setDuelFormat('room_code');
        } else {
          saveStoredOnlineRoomId(null);
        }
      }).catch(() => {});
    }
  }, []);

  // Continuously save local duel progress so switching menus never loses progress
  useEffect(() => {
    if (isLocalDuelActive && localActiveQuestions.length > 0 && !localIsFinished) {
      saveStoredLocalDuel({
        isActive: true,
        questions: localActiveQuestions,
        currentQIndex: localCurrentQIndex,
        p1Score: localP1Score,
        p2Score: localP2Score,
        hostName,
        hostUni,
        guestName,
        guestUni,
        selectedSection,
        questionCount,
        isFinished: false
      });
    }
  }, [
    isLocalDuelActive,
    localCurrentQIndex,
    localP1Score,
    localP2Score,
    localActiveQuestions,
    hostName,
    hostUni,
    guestName,
    guestUni,
    selectedSection,
    questionCount,
    localIsFinished
  ]);

  // Continuously sync online room ID to localStorage
  useEffect(() => {
    if (activeOnlineRoom?.id && activeOnlineRoom.status !== 'finished') {
      saveStoredOnlineRoomId(activeOnlineRoom.id);
    } else if (!activeOnlineRoom || activeOnlineRoom.status === 'finished') {
      saveStoredOnlineRoomId(null);
    }
  }, [activeOnlineRoom?.id, activeOnlineRoom?.status]);

  // URL query check: ?duelRoom=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('duelRoom');
      if (roomParam) {
        const normalized = normalizeRoomCode(roomParam);
        setDuelFormat('room_code');
        setJoinCodeInput(normalized);
        setUrlInviteCode(normalized);
      }
    }
  }, []);

  // Real-time Room subscription
  useEffect(() => {
    if (!activeOnlineRoom?.id) return;

    const roomId = activeOnlineRoom.id;
    const unsubscribe = subscribeToDuelRoom(roomId, myPlayerId, (freshRoom) => {
      // Detect when guest joins for the first time
      setActiveOnlineRoom((prev) => {
        if (!prev?.guest && freshRoom.guest) {
          duelSound.playFanfare();
          setGuestJoinedNotification(
            `⚔️ Participant Joined! ${freshRoom.guest.name} (${freshRoom.guest.university}) has joined the duel room!`
          );
          setTimeout(() => setGuestJoinedNotification(null), 5000);
        }
        return freshRoom;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [activeOnlineRoom?.id, myPlayerId]);

  // ---------------- ONLINE 1v1 ACTION HANDLERS ----------------
  const handleCreateOnlineRoom = async () => {
    setIsCreatingRoom(true);
    setJoinError(null);

    // Pick question set with cryptographic high-entropy shuffling
    let pool = QUESTION_BANK;
    if (selectedSection !== 'mixed') {
      pool = QUESTION_BANK.filter((q) => q.section === selectedSection);
    }
    const chosenQuestions = shuffleQuestionsDeep(pool, questionCount);
    const generatedCode = 'UD-' + Math.floor(1000 + Math.random() * 9000);

    const room = await createDuelRoom({
      roomId: generatedCode,
      host: {
        id: myPlayerId,
        name: hostName.trim() || 'Contestant 1',
        university: hostUni
      },
      questions: chosenQuestions,
      questionCount,
      section: selectedSection
    });

    setActiveOnlineRoom(room);
    saveStoredOnlineRoomId(room.id);
    setIsCreatingRoom(false);
  };

  const handleJoinOnlineRoom = async (codeToJoin?: string) => {
    const rawCode = codeToJoin || joinCodeInput;
    const targetCode = normalizeRoomCode(rawCode);
    if (!targetCode) {
      setJoinError('Please enter a challenge room code.');
      return;
    }

    setIsJoiningRoom(true);
    setJoinError(null);

    const res = await joinDuelRoom({
      roomId: targetCode,
      guest: {
        id: myPlayerId,
        name: guestName.trim() || 'Challenger',
        university: guestUni
      }
    });

    setIsJoiningRoom(false);

    if (res.success && res.room) {
      if (res.guestId && res.guestId !== myPlayerId) {
        setMyPlayerId(res.guestId);
      }
      duelSound.playFanfare();
      setActiveOnlineRoom(res.room);
      saveStoredOnlineRoomId(res.room.id);
      setUrlInviteCode(null);
    } else {
      setJoinError(res.error || 'Failed to join room. Please verify the code.');
    }
  };

  const handleLaunchOnlineMatch = async () => {
    if (!activeOnlineRoom) return;
    const updated = await startDuelMatch(activeOnlineRoom.id, myPlayerId);
    if (updated) {
      setActiveOnlineRoom(updated);
    }
  };

  const handleLeaveOnlineRoom = async () => {
    if (activeOnlineRoom) {
      await leaveDuelRoom(activeOnlineRoom.id, myPlayerId);
      saveStoredOnlineRoomId(null);
      setActiveOnlineRoom(null);
    }
  };

  // ---------------- LOCAL SAME-DEVICE REFLEX BATTLE HANDLERS ----------------
  const startLocalBuzzerGame = () => {
    duelSound.playFanfare();
    let qSet: Question[] = [];

    if (customQuestions && customQuestions.length > 0) {
      qSet = shuffleQuestionsDeep(customQuestions, questionCount);
    } else {
      let filtered = QUESTION_BANK;
      if (selectedSection !== 'mixed') {
        filtered = QUESTION_BANK.filter((q) => q.section === selectedSection);
      }
      qSet = shuffleQuestionsDeep(filtered, questionCount);
    }

    setLocalActiveQuestions(qSet);
    setLocalCurrentQIndex(0);
    setLocalP1Score(0);
    setLocalP2Score(0);
    setLocalWinningPlayer(null);
    setLocalLockedPlayers([]);
    setLocalRoundFeedback(null);
    setLocalRoundAnswered(false);
    setLocalSelectedOption(null);
    setLocalCountdown(15);
    setLocalIsFinished(false);
    setIsLocalDuelActive(true);

    saveStoredLocalDuel({
      isActive: true,
      questions: qSet,
      currentQIndex: 0,
      p1Score: 0,
      p2Score: 0,
      hostName,
      hostUni,
      guestName,
      guestUni,
      selectedSection,
      questionCount,
      isFinished: false
    });
  };

  // Reset or clear in-progress duel
  const handleDiscardLocalDuel = () => {
    if (localTimerRef.current) clearInterval(localTimerRef.current);
    if (localAutoAdvanceTimerRef.current) clearTimeout(localAutoAdvanceTimerRef.current);
    clearStoredLocalDuel();
    setIsLocalDuelActive(false);
    setLocalIsFinished(false);
    setLocalActiveQuestions([]);
    setLocalCurrentQIndex(0);
    setLocalP1Score(0);
    setLocalP2Score(0);
    setLocalRoundFeedback(null);
  };

  // Local Round timer
  useEffect(() => {
    if (!isLocalDuelActive || localIsFinished || localRoundAnswered) return;

    localTimerRef.current = setInterval(() => {
      setLocalCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(localTimerRef.current as NodeJS.Timeout);
          handleLocalTimeout();
          return 0;
        }
        if (prev <= 4) duelSound.playTick();
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [isLocalDuelActive, localCurrentQIndex, localRoundAnswered, localIsFinished]);

  const handleLocalTimeout = () => {
    duelSound.playBuzzer();
    setLocalRoundAnswered(true);
    const currentQ = localActiveQuestions[localCurrentQIndex];
    const correctLetter = currentQ ? String.fromCharCode(65 + currentQ.correctIndex) : '';
    setLocalRoundFeedback(`⏱️ Time expired! Correct answer was Option ${correctLetter}. Advancing...`);

    localAutoAdvanceTimerRef.current = setTimeout(() => {
      handleLocalNextRound();
    }, 800);
  };

  // ANY ANSWER ENDS ROUND: If anyone picks an answer whether correct or not,
  // display correct option and proceed to next question automatically!
  const handlePlayerTouchAnswer = (player: 1 | 2, optionIdx: number) => {
    if (!isLocalDuelActive || localIsFinished || localRoundAnswered) return;

    const currentQ = localActiveQuestions[localCurrentQIndex];
    if (!currentQ) return;

    if (localTimerRef.current) clearInterval(localTimerRef.current);
    if (localAutoAdvanceTimerRef.current) clearTimeout(localAutoAdvanceTimerRef.current);

    const isCorrect = optionIdx === currentQ.correctIndex;
    const playerName = player === 1 ? hostName : guestName;
    const optLetter = String.fromCharCode(65 + optionIdx);
    const correctLetter = String.fromCharCode(65 + currentQ.correctIndex);

    setLocalRoundAnswered(true);
    setLocalSelectedOption(optionIdx);

    if (isCorrect) {
      setLocalWinningPlayer(player);
      if (player === 1) setLocalP1Score((prev) => prev + 10);
      else setLocalP2Score((prev) => prev + 10);

      duelSound.playCorrect();
      setLocalRoundFeedback(
        `⚡ ${playerName} picked Option ${optLetter} — Correct! (+10 pts). Advancing to next question...`
      );
    } else {
      setLocalWinningPlayer(null);
      duelSound.playWrong();
      setLocalRoundFeedback(
        `❌ ${playerName} picked Option ${optLetter} — Incorrect (0 pts). Correct answer was Option ${correctLetter}. Advancing to next question...`
      );
    }

    localAutoAdvanceTimerRef.current = setTimeout(() => {
      handleLocalNextRound();
    }, 1400);
  };

  const handleLocalNextRound = () => {
    if (localAutoAdvanceTimerRef.current) clearTimeout(localAutoAdvanceTimerRef.current);

    if (localCurrentQIndex + 1 < localActiveQuestions.length) {
      setLocalCurrentQIndex((prev) => prev + 1);
      setLocalRoundAnswered(false);
      setLocalSelectedOption(null);
      setLocalWinningPlayer(null);
      setLocalLockedPlayers([]);
      setLocalRoundFeedback(null);
      setLocalCountdown(15);
    } else {
      setLocalIsFinished(true);
      clearStoredLocalDuel();
      duelSound.playFanfare();
      confetti({ particleCount: 120, spread: 85, origin: { y: 0.6 } });

      // Record both contestants to real leaderboard
      recordContestantDuelResult({
        name: hostName,
        university: hostUni,
        pointsWon: localP1Score,
        isWinner: localP1Score >= localP2Score,
        section: selectedSection
      });
      recordContestantDuelResult({
        name: guestName,
        university: guestUni,
        pointsWon: localP2Score,
        isWinner: localP2Score >= localP1Score,
        section: selectedSection
      });
    }
  };

  // Dual-keypad Hotkeys for 1v1 Reflex Battle:
  // Player 1: 1, 2, 3, 4 (or Q, W, E, R)
  // Player 2: 7, 8, 9, 0 (or U, I, O, P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLocalDuelActive || localRoundAnswered || localIsFinished) return;

      const key = e.key.toLowerCase();

      // Player 1 Hotkeys
      if (key === '1' || key === 'q') handlePlayerTouchAnswer(1, 0);
      else if (key === '2' || key === 'w') handlePlayerTouchAnswer(1, 1);
      else if (key === '3' || key === 'e') handlePlayerTouchAnswer(1, 2);
      else if (key === '4' || key === 'r') handlePlayerTouchAnswer(1, 3);

      // Player 2 Hotkeys
      else if (key === '7' || key === 'u') handlePlayerTouchAnswer(2, 0);
      else if (key === '8' || key === 'i') handlePlayerTouchAnswer(2, 1);
      else if (key === '9' || key === 'o') handlePlayerTouchAnswer(2, 2);
      else if (key === '0' || key === 'p') handlePlayerTouchAnswer(2, 3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isLocalDuelActive,
    localRoundAnswered,
    localIsFinished,
    localCurrentQIndex,
    localLockedPlayers,
    localActiveQuestions
  ]);

  // ---------------- RENDER ACTIVE ONLINE ROOM ----------------
  if (activeOnlineRoom) {
    const isHost = activeOnlineRoom.host.id === myPlayerId;

    return (
      <div className="space-y-4">
        {/* Participant Joined Alert Banner */}
        {guestJoinedNotification && (
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-100 flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>{guestJoinedNotification}</span>
            </div>
            <button
              onClick={() => setGuestJoinedNotification(null)}
              className="text-xs text-emerald-300/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lobby vs Live Arena */}
        {activeOnlineRoom.status === 'in_progress' || activeOnlineRoom.status === 'finished' ? (
          <OnlineRoomArena
            room={activeOnlineRoom}
            myPlayerId={myPlayerId}
            isHost={isHost}
            onExitDuel={handleLeaveOnlineRoom}
          />
        ) : (
          <OnlineRoomLobby
            room={activeOnlineRoom}
            myPlayerId={myPlayerId}
            isHost={isHost}
            onStartMatch={handleLaunchOnlineMatch}
            onLeaveRoom={handleLeaveOnlineRoom}
          />
        )}
      </div>
    );
  }

  // ---------------- RENDER LOCAL BUZZER BATTLE ACTIVE ----------------
  if (isLocalDuelActive && localActiveQuestions.length > 0) {
    if (localIsFinished) {
      const p1Won = localP1Score > localP2Score;
      const isTie = localP1Score === localP2Score;
      return (
        <div id="duel-finished-screen" className="max-w-3xl mx-auto py-8 space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl bg-gradient-to-b from-[#0c1a40] to-[#070e24] border border-[#1d3570] p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                LOCAL REFLEX DUEL COMPLETE
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                {isTie ? 'Incredible Deadlock Tie!' : `${p1Won ? hostName : guestName} Wins!`}
              </h2>
              <p className="text-xs text-blue-200/70 mt-1">
                Results recorded to the real university leaderboard!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="p-4 rounded-xl border bg-[#091536] border-cyan-400 text-left">
                <div className="text-xs font-bold text-cyan-300 truncate">{hostName}</div>
                <div className="text-[10px] text-blue-300/70 truncate">{hostUni}</div>
                <div className="text-2xl font-black text-white mt-1">{localP1Score} pts</div>
              </div>
              <div className="p-4 rounded-xl border bg-[#091536] border-amber-400 text-left">
                <div className="text-xs font-bold text-amber-300 truncate">{guestName}</div>
                <div className="text-[10px] text-blue-300/70 truncate">{guestUni}</div>
                <div className="text-2xl font-black text-white mt-1">{localP2Score} pts</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={startLocalBuzzerGame}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Rematch Local
              </button>
              <button
                onClick={handleDiscardLocalDuel}
                className="px-6 py-2.5 rounded-xl border border-blue-800 bg-[#0c183b] text-blue-300 hover:bg-[#112354] text-xs font-bold cursor-pointer"
              >
                Back to Duel Lobby
              </button>
              <button
                onClick={onOpenLeaderboard}
                className="px-6 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-cyan-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> View Leaderboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentQ = localActiveQuestions[localCurrentQIndex];
    const isP1Locked = localLockedPlayers.includes(1);
    const isP2Locked = localLockedPlayers.includes(2);

    return (
      <div id="active-friend-duel-arena" className="max-w-4xl mx-auto py-3 sm:py-5 space-y-4 sm:space-y-6">
        {/* Top Controls: Session Persistence & Pause to Explore */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs text-blue-300/80">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
              <Save className="w-3 h-3" /> Progress Auto-Saved
            </span>
            <span className="hidden sm:inline text-[11px] text-blue-300/60">
              Leave anytime to explore other menus; your duel will resume right here!
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-700/50 text-blue-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Explore other tabs. Your progress is saved!"
            >
              <Pause className="w-3 h-3 text-cyan-400" />
              <span>Explore Menus</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to end this 1v1 duel?')) {
                  handleDiscardLocalDuel();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 hover:text-rose-100 text-xs font-medium transition-colors cursor-pointer"
            >
              Exit Match
            </button>
          </div>
        </div>

        {/* Score & Round Header Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0d1c44] via-[#091533] to-[#0d1c44] border border-[#1e346d] p-3 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            {/* Player 1 Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs sm:text-sm font-black text-cyan-300 truncate max-w-[120px] sm:max-w-[180px]">
                  {hostName}
                </span>
                {isP1Locked && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    Locked
                  </span>
                )}
              </div>
              <div className="text-[10px] text-blue-300/70 truncate hidden sm:block">{hostUni}</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{localP1Score} <span className="text-xs text-blue-300 font-normal">pts</span></div>
            </div>

            {/* Central Round & Timer Countdown */}
            <div className="text-center px-2 sm:px-4 border-x border-[#1a2f63]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-300">
                Round {localCurrentQIndex + 1}/{localActiveQuestions.length}
              </div>
              <div className={`text-2xl sm:text-3xl font-mono font-black ${
                localCountdown <= 4 ? 'text-rose-400 animate-ping' : 'text-amber-400'
              }`}>
                {localCountdown}s
              </div>
              <div className="w-20 sm:w-28 h-1.5 bg-blue-950 rounded-full mx-auto overflow-hidden mt-1 border border-blue-800/60">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-1000"
                  style={{ width: `${(localCountdown / 15) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Player 2 Info */}
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-1.5">
                {isP2Locked && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    Locked
                  </span>
                )}
                <span className="text-xs sm:text-sm font-black text-amber-300 truncate max-w-[120px] sm:max-w-[180px]">
                  {guestName}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              </div>
              <div className="text-[10px] text-blue-300/70 truncate hidden sm:block">{guestUni}</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{localP2Score} <span className="text-xs text-amber-300 font-normal">pts</span></div>
            </div>
          </div>
        </div>

        {/* Live Feedback / Reflex Banner */}
        {localRoundFeedback && (
          <div className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
            localWinningPlayer
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
              : localLockedPlayers.length >= 2 || localCountdown === 0
              ? 'bg-rose-950/90 border-rose-400 text-rose-200'
              : 'bg-amber-950/90 border-amber-400 text-amber-200'
          }`}>
            <Zap className="w-4 h-4 animate-bounce" />
            <span>{localRoundFeedback}</span>
          </div>
        )}

        {/* Question Card with central options */}
        <div className="rounded-2xl bg-[#091433] border border-[#182a57] p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-blue-300/70 border-b border-[#14234a] pb-2">
            <span className="px-2.5 py-0.5 rounded bg-blue-950 border border-blue-800/80 font-bold uppercase text-[10px] text-cyan-300">
              {currentQ.section.replace('_', ' ')}
            </span>
            <span className="font-semibold text-amber-400/90">{currentQ.topic}</span>
          </div>

          <h3 className="text-base sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.question}
          </h3>

          {/* 4 Central Option Display Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {currentQ.options.map((opt, oIdx) => {
              const optLetter = String.fromCharCode(65 + oIdx);
              const isCorrectOption = oIdx === currentQ.correctIndex;
              const isSelected = localSelectedOption === oIdx;

              let optionStyle = 'bg-[#0b1633] border-[#1a2e5c] text-blue-100 hover:border-cyan-400/80';
              if (localRoundAnswered) {
                if (isCorrectOption) {
                  optionStyle = 'bg-emerald-950/80 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400 font-bold shadow-lg shadow-emerald-500/20';
                } else if (isSelected) {
                  optionStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 line-through opacity-70';
                } else {
                  optionStyle = 'bg-[#070e24] border-blue-950 text-blue-300/40';
                }
              }

              return (
                <div
                  key={oIdx}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-2.5 ${optionStyle}`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    localRoundAnswered && isCorrectOption
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-blue-900/60 border border-blue-700/60 text-cyan-300'
                  }`}>
                    {optLetter}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-snug">{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Explanation reveal when round answered */}
          {localRoundAnswered && currentQ.explanation && (
            <div className="p-3 rounded-xl bg-blue-950/60 border border-cyan-500/30 text-xs text-blue-200 animate-in fade-in duration-300">
              <strong className="text-cyan-400 font-bold">Solution Note: </strong>
              {currentQ.explanation}
            </div>
          )}
        </div>

        {/* ---------------- DEDICATED SPLIT TOUCH KEYPADS ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Player 1 Controller (Left / Cyan) */}
          <div className="p-4 rounded-2xl border transition-all bg-gradient-to-b from-[#08173d] to-[#06102b] border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <div>
                  <span className="text-xs font-black text-cyan-300">{hostName}</span>
                  <div className="text-[10px] text-blue-300/70">Hotkeys: 1, 2, 3, 4 (or Q, W, E, R)</div>
                </div>
              </div>
            </div>

            {/* 4 Touch Buttons for Player 1 */}
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((idx) => {
                const letter = String.fromCharCode(65 + idx);
                const hotkeyNum = idx + 1;
                return (
                  <button
                    key={idx}
                    disabled={localRoundAnswered}
                    onClick={() => handlePlayerTouchAnswer(1, idx)}
                    className="py-3 px-2 rounded-xl bg-[#0e245a] hover:bg-cyan-500 hover:text-slate-950 active:scale-95 border border-cyan-400/40 text-cyan-200 font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all shadow cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>{letter}</span>
                    <span className="text-[9px] font-mono text-cyan-300/60">[{hotkeyNum}]</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-cyan-300/70 text-center mt-2 font-medium">
              Pick your answer — reveals correct option and advances!
            </div>
          </div>

          {/* Player 2 Controller (Right / Amber) */}
          <div className="p-4 rounded-2xl border transition-all bg-gradient-to-b from-[#241a05] to-[#120d02] border-amber-500/40 shadow-lg shadow-amber-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <span className="text-xs font-black text-amber-300">{guestName}</span>
                  <div className="text-[10px] text-amber-200/70">Hotkeys: 7, 8, 9, 0 (or U, I, O, P)</div>
                </div>
              </div>
            </div>

            {/* 4 Touch Buttons for Player 2 */}
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((idx) => {
                const letter = String.fromCharCode(65 + idx);
                const hotkeyNum = idx === 3 ? 0 : 7 + idx;
                return (
                  <button
                    key={idx}
                    disabled={localRoundAnswered}
                    onClick={() => handlePlayerTouchAnswer(2, idx)}
                    className="py-3 px-2 rounded-xl bg-[#3d2c08] hover:bg-amber-400 hover:text-slate-950 active:scale-95 border border-amber-400/40 text-amber-200 font-black text-sm flex flex-col items-center justify-center gap-0.5 transition-all shadow cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span>{letter}</span>
                    <span className="text-[9px] font-mono text-amber-300/60">[{hotkeyNum}]</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-amber-300/70 text-center mt-2 font-medium">
              Pick your answer — reveals correct option and advances!
            </div>
          </div>
        </div>

        {/* Auto Advance Progress Indication */}
        {localRoundAnswered && (
          <div className="text-center py-1">
            <span className="text-xs font-bold text-cyan-300 inline-flex items-center gap-1.5 animate-pulse">
              <span>Automatically proceeding to next question...</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  // Check if there is an existing saved local duel to resume
  const storedDuelState = getStoredLocalDuel();
  const hasSavedDuel = Boolean(storedDuelState?.isActive && !storedDuelState?.isFinished && storedDuelState?.questions?.length > 0);

  // ---------------- RENDER MAIN FRIEND DUEL SETUP SCREEN ----------------
  return (
    <div id="friend-duel-setup-container" className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Resume In-Progress Duel Banner */}
      {hasSavedDuel && storedDuelState && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/90 via-indigo-950/90 to-blue-900/90 border-2 border-cyan-400 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>Resume Saved 1v1 Match</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Round {(storedDuelState.currentQIndex || 0) + 1} of {storedDuelState.questions.length}
                </span>
              </div>
              <div className="text-xs text-blue-200/80">
                {storedDuelState.hostName} ({storedDuelState.p1Score} pts) vs {storedDuelState.guestName} ({storedDuelState.p2Score} pts)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setLocalActiveQuestions(storedDuelState.questions);
                setLocalCurrentQIndex(storedDuelState.currentQIndex || 0);
                setLocalP1Score(storedDuelState.p1Score || 0);
                setLocalP2Score(storedDuelState.p2Score || 0);
                setIsLocalDuelActive(true);
                setDuelFormat('buzzer_battle');
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Match</span>
            </button>
            <button
              onClick={handleDiscardLocalDuel}
              className="px-3 py-2.5 rounded-xl border border-rose-800/60 bg-rose-950/40 hover:bg-rose-950 text-rose-300 text-xs font-semibold cursor-pointer"
              title="Discard saved match and start a new duel"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Header & Active Profile Indicator */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
          <Users2 className="w-3.5 h-3.5" />
          1V1 MULTIPLAYER CONTEST ARENA
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Duel With <span className="text-amber-400">Your Friends</span>
        </h1>
        <p className="text-xs sm:text-sm text-blue-200/80 max-w-lg mx-auto">
          Create a real-time challenge room to see when your friend joins, or battle on the same device with ultra-fast reflex triggers!
        </p>

        {/* Auto-saved Profile Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-950/70 border border-cyan-500/30 text-xs text-cyan-200">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Profile: <strong className="text-white">{storedProfile.name}</strong> • <span className="text-cyan-300">{storedProfile.university}</span></span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Saved</span>
        </div>
      </div>

      {/* Duel Format Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          id="select-online-room-format"
          onClick={() => setDuelFormat('room_code')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            duelFormat === 'room_code'
              ? 'bg-[#10204d] border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
              : 'bg-[#0b1633] border-[#182a57] text-blue-200 hover:bg-[#0f1d45]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-bold text-sm">Online 1v1 Challenge Room</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Sync
            </span>
          </div>
          <p className="text-xs text-blue-300/70 mt-2">
            Create a room, share code/link, and see your friend join in real-time. Compete on identical shuffled questions across devices!
          </p>
        </button>

        <button
          id="select-buzzer-format"
          onClick={() => setDuelFormat('buzzer_battle')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            duelFormat === 'buzzer_battle'
              ? 'bg-[#10204d] border-amber-400 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
              : 'bg-[#0b1633] border-[#182a57] text-blue-200 hover:bg-[#0f1d45]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm">Same-Device Buzzer Battle</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Split-Key
            </span>
          </div>
          <p className="text-xs text-blue-300/70 mt-2">
            2 players face-off on one keyboard or screen. Key A vs Key L buzzers to lock in answers first!
          </p>
        </button>
      </div>

      {/* Format Content */}
      {duelFormat === 'room_code' ? (
        /* ONLINE 1v1 ROOM CREATION & JOINING */
        <div className="space-y-5">
          {/* Invite Code Quick-Join Banner */}
          {urlInviteCode && (
            <div
              id="url-invite-banner"
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 via-cyan-900/40 to-blue-900/60 border border-cyan-400 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-cyan-400" />
                  Direct Duel Invitation Received
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/40">
                  Room: {urlInviteCode}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                You were invited to compete in room <strong className="text-cyan-300 font-mono">{urlInviteCode}</strong>.
                Verify your contestant name and tap below to enter the lobby!
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    placeholder="Your Contestant Name"
                    value={guestName}
                    onChange={(e) => updateAndSaveGuestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#070e24] border border-cyan-500/50 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <button
                  id="accept-invite-btn"
                  onClick={() => handleJoinOnlineRoom(urlInviteCode)}
                  disabled={isJoiningRoom}
                  className="w-full sm:w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isJoiningRoom ? 'Connecting to Room...' : `ACCEPT & JOIN ROOM ${urlInviteCode}`}</span>
                </button>
              </div>
            </div>
          )}

          {/* Join Error Banner */}
          {joinError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center justify-between">
              <span>{joinError}</span>
              <button onClick={() => setJoinError(null)} className="text-rose-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Side-by-Side: Create Room vs Join Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room Box */}
            <div className="p-5 rounded-2xl bg-[#091433] border border-cyan-500/40 space-y-4 shadow-lg shadow-cyan-500/10">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" /> Option 1: Host a Duel
                </span>
                <h3 className="text-base font-bold text-white">Create Challenge Room</h3>
                <p className="text-xs text-blue-300/70">
                  Form a private room. You can watch the lobby live to see your friend join!
                </p>
              </div>

              {/* Host details */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-blue-300 font-medium block">Your Contestant Name</label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => updateAndSaveHostName(e.target.value)}
                    onBlur={() => {
                      if (!hostName.trim()) updateAndSaveHostName('Contestant');
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-blue-300 font-medium block">Your University Affiliation</label>
                  <select
                    value={hostUni}
                    onChange={(e) => updateAndSaveHostUni(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {NIGERIAN_UNIVERSITIES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Match config */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-blue-300 font-medium block">Questions</label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
                    >
                      <option value={6}>6 Questions</option>
                      <option value={8}>8 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={12}>12 Questions</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-blue-300 font-medium block">Category</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value as SectionId)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
                    >
                      <option value="mixed">Mixed Syllabus</option>
                      <option value="data_analysis">Data Analysis</option>
                      <option value="applied_math">Applied Math</option>
                      <option value="general_knowledge">General Knowledge</option>
                      <option value="verbal_reasoning">Verbal Reasoning</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                id="create-room-btn"
                onClick={handleCreateOnlineRoom}
                disabled={isCreatingRoom}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>{isCreatingRoom ? 'Creating Room...' : 'CREATE 1V1 CHALLENGE ROOM'}</span>
              </button>
            </div>

            {/* Join Room Box */}
            <div className="p-5 rounded-2xl bg-[#091433] border border-[#182a57] space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Option 2: Join a Friend
                </span>
                <h3 className="text-base font-bold text-white">Enter Friend's Room</h3>
                <p className="text-xs text-blue-300/70">
                  Received a code or invitation link? Enter or paste it here to join their lobby.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-blue-300 font-medium block">Room Code or Invite Link</label>
                  <input
                    type="text"
                    placeholder="Enter code (e.g. UD-4821 or 4821)"
                    value={joinCodeInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes('duelRoom=') || val.includes('http')) {
                        setJoinCodeInput(normalizeRoomCode(val));
                      } else {
                        setJoinCodeInput(val.toUpperCase());
                      }
                    }}
                    onBlur={() => {
                      if (joinCodeInput.trim()) {
                        setJoinCodeInput(normalizeRoomCode(joinCodeInput));
                      }
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-cyan-300 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-blue-300 font-medium block">Your Contestant Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => updateAndSaveGuestName(e.target.value)}
                    onBlur={() => {
                      if (!guestName.trim()) updateAndSaveGuestName('Challenger');
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-blue-300 font-medium block">Your University</label>
                  <select
                    value={guestUni}
                    onChange={(e) => updateAndSaveGuestUni(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    {NIGERIAN_UNIVERSITIES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                id="join-room-btn"
                onClick={() => handleJoinOnlineRoom()}
                disabled={isJoiningRoom || !joinCodeInput.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Users2 className="w-4 h-4" />
                <span>{isJoiningRoom ? 'Connecting to Room...' : 'ENTER DUEL ARENA'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SAME-DEVICE BUZZER BATTLE FORM */
        <div className="rounded-2xl bg-[#091433] border border-[#182a57] p-6 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Configure Same-Device Buzzers & Affiliations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0c1a40] border border-blue-800/60 space-y-3">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" /> Player 1 (Key A / Left)
              </span>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">Name</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => updateAndSaveHostName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">University</label>
                <select
                  value={hostUni}
                  onChange={(e) => updateAndSaveHostUni(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs"
                >
                  {NIGERIAN_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1a40] border border-blue-800/60 space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" /> Player 2 (Key L / Right)
              </span>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => updateAndSaveGuestName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">University</label>
                <select
                  value={guestUni}
                  onChange={(e) => updateAndSaveGuestUni(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs"
                >
                  {NIGERIAN_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#142347]">
            <button
              onClick={startLocalBuzzerGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              START SPLIT-KEY BUZZER BATTLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
