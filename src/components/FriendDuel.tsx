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
  Gamepad2
} from 'lucide-react';
import { getStoredProfile } from '../utils/storage';

interface FriendDuelProps {
  customQuestions?: Question[];
  onExit: () => void;
  onOpenLeaderboard: () => void;
}

type DuelFormat = 'buzzer_battle' | 'turn_based' | 'room_code';

export const FriendDuel: React.FC<FriendDuelProps> = ({
  customQuestions,
  onExit,
  onOpenLeaderboard
}) => {
  const userProfile = getStoredProfile();

  // Setup state
  const [duelFormat, setDuelFormat] = useState<DuelFormat>('buzzer_battle');
  const [player1Name, setPlayer1Name] = useState<string>(userProfile.name || 'Player 1');
  const [player1Uni, setPlayer1Uni] = useState<string>(userProfile.university || 'University of Lagos (UNILAG)');
  const [player2Name, setPlayer2Name] = useState<string>('Challenger Friend');
  const [player2Uni, setPlayer2Uni] = useState<string>('University of Ibadan (UI)');

  const [questionCount, setQuestionCount] = useState<number>(8);
  const [selectedSection, setSelectedSection] = useState<SectionId>('mixed');
  const [isDuelActive, setIsDuelActive] = useState<boolean>(false);

  // Active Game State
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [buzzedPlayer, setBuzzedPlayer] = useState<1 | 2 | null>(null);
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [p1Answers, setP1Answers] = useState<boolean[]>([]);
  const [p2Answers, setP2Answers] = useState<boolean[]>([]);
  const [roundAnswered, setRoundAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(15);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Room code share state
  const [roomCode, setRoomCode] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize room code on mount
  useEffect(() => {
    const randomCode = 'UDUEL-' + Math.floor(1000 + Math.random() * 9000);
    setRoomCode(randomCode);
  }, []);

  const startDuelGame = (questionsToUse?: Question[]) => {
    duelSound.playFanfare();
    let qSet: Question[] = [];

    if (questionsToUse && questionsToUse.length > 0) {
      qSet = [...questionsToUse].slice(0, questionCount);
    } else if (customQuestions && customQuestions.length > 0) {
      qSet = [...customQuestions].slice(0, questionCount);
    } else {
      let filtered = QUESTION_BANK;
      if (selectedSection !== 'mixed') {
        filtered = QUESTION_BANK.filter((q) => q.section === selectedSection);
      }
      // Shuffle
      qSet = [...filtered].sort(() => Math.random() - 0.5).slice(0, questionCount);
    }

    setActiveQuestions(qSet);
    setCurrentQIndex(0);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setP1Answers([]);
    setP2Answers([]);
    setBuzzedPlayer(null);
    setRoundAnswered(false);
    setSelectedOption(null);
    setCountdown(15);
    setIsFinished(false);
    setIsDuelActive(true);
  };

  // Buzzer timer logic
  useEffect(() => {
    if (!isDuelActive || isFinished || roundAnswered) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleTimeout();
          return 0;
        }
        if (prev <= 4) {
          duelSound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDuelActive, currentQIndex, roundAnswered, isFinished]);

  const handleTimeout = () => {
    duelSound.playBuzzer();
    setRoundAnswered(true);
  };

  const handleBuzzIn = (player: 1 | 2) => {
    if (roundAnswered || buzzedPlayer !== null) return;
    duelSound.playBuzzer();
    setBuzzedPlayer(player);
    // Give 7 seconds to answer after buzzing!
    setCountdown(7);
  };

  const handleAnswer = (optionIdx: number) => {
    if (roundAnswered || buzzedPlayer === null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIdx);
    setRoundAnswered(true);

    const currentQ = activeQuestions[currentQIndex];
    const isCorrect = optionIdx === currentQ.correctIndex;

    if (isCorrect) {
      duelSound.playCorrect();
      if (buzzedPlayer === 1) {
        setPlayer1Score((prev) => prev + 10);
        setP1Answers((prev) => [...prev, true]);
      } else {
        setPlayer2Score((prev) => prev + 10);
        setP2Answers((prev) => [...prev, true]);
      }
    } else {
      duelSound.playWrong();
      // Penalty for wrong answer on buzzer like TV duel!
      if (buzzedPlayer === 1) {
        setPlayer1Score((prev) => Math.max(0, prev - 5));
        setP1Answers((prev) => [...prev, false]);
      } else {
        setPlayer2Score((prev) => Math.max(0, prev - 5));
        setP2Answers((prev) => [...prev, false]);
      }
    }
  };

  const handleNextRound = () => {
    if (currentQIndex + 1 < activeQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setBuzzedPlayer(null);
      setRoundAnswered(false);
      setSelectedOption(null);
      setCountdown(15);
    } else {
      finishDuel();
    }
  };

  const finishDuel = () => {
    setIsFinished(true);
    duelSound.playFanfare();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const copyDuelRoomLink = () => {
    const url = `${window.location.origin}/?duelRoom=${roomCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Keyboard hotkeys for fast 2-player buzzer battle!
  // Player 1: Key 'A' or 'Q' to buzz
  // Player 2: Key 'L' or 'P' to buzz
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDuelActive || roundAnswered || isFinished) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'q' || e.key === 'Q') {
        handleBuzzIn(1);
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'p' || e.key === 'P') {
        handleBuzzIn(2);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDuelActive, roundAnswered, isFinished, buzzedPlayer]);

  // Finished Screen
  if (isFinished) {
    const p1Won = player1Score > player2Score;
    const isTie = player1Score === player2Score;
    const winnerName = isTie ? 'It is a Tie Duel!' : p1Won ? player1Name : player2Name;
    const winnerUni = isTie ? '' : p1Won ? player1Uni : player2Uni;

    return (
      <div id="duel-finished-screen" className="max-w-3xl mx-auto py-8 space-y-6">
        <div className="rounded-2xl bg-gradient-to-b from-[#0c1a40] to-[#070e24] border border-[#1d3570] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              DUEL SHOWDOWN CHAMPION
            </span>
            <h2 className="text-3xl font-black text-white mt-1">
              {isTie ? 'Incredible Deadlock!' : `${winnerName} Wins!`}
            </h2>
            {!isTie && (
              <p className="text-xs text-blue-200/80 mt-1 font-semibold">
                Representing {winnerUni}
              </p>
            )}
          </div>

          {/* Side-by-Side Duel Results */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            {/* Player 1 Card */}
            <div className={`p-4 rounded-xl border ${
              p1Won && !isTie
                ? 'bg-blue-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                : 'bg-[#091536] border-[#182a57]'
            }`}>
              <div className="text-xs font-bold text-cyan-300 truncate">{player1Name}</div>
              <div className="text-[10px] text-blue-300/70 truncate">{player1Uni.split(' ')[0]}</div>
              <div className="text-3xl font-black text-white mt-2">{player1Score} <span className="text-xs text-blue-400 font-normal">pts</span></div>
            </div>

            {/* Player 2 Card */}
            <div className={`p-4 rounded-xl border ${
              !p1Won && !isTie
                ? 'bg-blue-950/60 border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                : 'bg-[#091536] border-[#182a57]'
            }`}>
              <div className="text-xs font-bold text-amber-300 truncate">{player2Name}</div>
              <div className="text-[10px] text-blue-300/70 truncate">{player2Uni.split(' ')[0]}</div>
              <div className="text-3xl font-black text-white mt-2">{player2Score} <span className="text-xs text-blue-400 font-normal">pts</span></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => startDuelGame()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rematch Duel
            </button>

            <button
              onClick={onOpenLeaderboard}
              className="px-5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Trophy className="w-3.5 h-3.5" />
              Check Global Rankings
            </button>

            <button
              onClick={() => setIsDuelActive(false)}
              className="px-5 py-2.5 rounded-xl border border-blue-800 bg-[#0c183b] text-blue-300 hover:bg-[#112354] text-xs font-bold transition-all"
            >
              Back to Duel Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Buzzer Battle Game Arena
  if (isDuelActive && activeQuestions.length > 0) {
    const currentQ = activeQuestions[currentQIndex];

    return (
      <div id="active-friend-duel-arena" className="max-w-4xl mx-auto py-4 space-y-6">
        {/* Head-to-Head Duel Scoreboard Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0d1c44] via-[#091533] to-[#0d1c44] border border-[#1e346d] p-4 sm:p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 Left Corner */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 border border-cyan-300 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                P1
              </div>
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  {player1Name}
                  {buzzedPlayer === 1 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-400 text-slate-950 font-black animate-pulse">
                      BUZZED IN!
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-cyan-300/80">{player1Uni.split(' ')[0]}</div>
                <div className="text-xl font-black text-cyan-400 mt-0.5">{player1Score} pts</div>
              </div>
            </div>

            {/* Center Duel Progress & Clock */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                ROUND {currentQIndex + 1} OF {activeQuestions.length}
              </span>
              <div className={`mt-1 px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                countdown <= 4
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-bounce'
                  : 'bg-blue-950 border-cyan-500/40 text-cyan-300'
              }`}>
                {countdown}s
              </div>
              <span className="text-[9px] text-blue-400 mt-1">
                {buzzedPlayer ? `Locked to P${buzzedPlayer}` : 'Waiting for Buzzer'}
              </span>
            </div>

            {/* Player 2 Right Corner */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-sm font-extrabold text-white flex items-center justify-end gap-1.5">
                  {buzzedPlayer === 2 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400 text-slate-950 font-black animate-pulse">
                      BUZZED IN!
                    </span>
                  )}
                  {player2Name}
                </div>
                <div className="text-[11px] text-amber-300/80">{player2Uni.split(' ')[0]}</div>
                <div className="text-xl font-black text-amber-400 mt-0.5">{player2Score} pts</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500 border border-yellow-300 flex items-center justify-center text-slate-950 font-extrabold text-sm shadow-md">
                P2
              </div>
            </div>
          </div>
        </div>

        {/* Buzzer Triggers Section (If no player has buzzed yet!) */}
        {!buzzedPlayer && !roundAnswered && (
          <div className="grid grid-cols-2 gap-4">
            <button
              id="p1-buzz-button"
              onClick={() => handleBuzzIn(1)}
              className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 border-2 border-cyan-400 shadow-xl shadow-blue-500/30 text-center text-white active:scale-95 transition-all group cursor-pointer"
            >
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-cyan-300 group-hover:scale-110 transition-transform" />
              <div className="font-black text-lg sm:text-xl mt-2 tracking-wide">
                BUZZ IN (P1)
              </div>
              <div className="text-[11px] text-cyan-200 mt-1">
                Click or press <kbd className="px-1.5 py-0.5 bg-blue-900 rounded border border-blue-400 font-mono text-[10px]">A</kbd>
              </div>
            </button>

            <button
              id="p2-buzz-button"
              onClick={() => handleBuzzIn(2)}
              className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border-2 border-yellow-300 shadow-xl shadow-amber-500/30 text-center text-slate-950 active:scale-95 transition-all group cursor-pointer"
            >
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-yellow-200 fill-slate-950 group-hover:scale-110 transition-transform" />
              <div className="font-black text-lg sm:text-xl mt-2 tracking-wide">
                BUZZ IN (P2)
              </div>
              <div className="text-[11px] text-slate-900 font-bold mt-1">
                Click or press <kbd className="px-1.5 py-0.5 bg-amber-800 text-white rounded border border-amber-300 font-mono text-[10px]">L</kbd>
              </div>
            </button>
          </div>
        )}

        {/* Question Board */}
        <div className="rounded-2xl bg-gradient-to-b from-[#0b173b] to-[#070f28] border border-[#1c336b] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between text-xs text-blue-300/70 border-b border-[#182a57] pb-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-cyan-300 border border-blue-700/40">
              {currentQ.topic}
            </span>
            <span>
              {buzzedPlayer
                ? `Active Turn: ${buzzedPlayer === 1 ? player1Name : player2Name} (Select Option)`
                : 'Hit your buzzer to unlock answer choices!'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            {currentQ.question}
          </h2>

          {/* Options (Disabled until buzzed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let style = 'bg-[#0c1a40] border-[#1c3066] text-blue-100 hover:border-cyan-400 hover:bg-[#112354]';

              if (!buzzedPlayer && !roundAnswered) {
                style = 'bg-[#09122c] border-[#152347] text-blue-200/40 cursor-not-allowed opacity-60';
              }

              if (roundAnswered) {
                if (isCorrect) {
                  style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 font-bold';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500 font-bold';
                } else {
                  style = 'bg-[#09122c] border-[#152347] text-blue-200/40 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={!buzzedPlayer || roundAnswered}
                  onClick={() => handleAnswer(idx)}
                  className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#12234e] text-cyan-300 border border-blue-800 flex items-center justify-center font-bold text-xs">
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-medium">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation if Round is answered */}
          {roundAnswered && (
            <div className="p-4 rounded-xl bg-[#091433] border border-cyan-500/30 text-xs text-blue-200 space-y-2">
              <span className="font-bold text-cyan-300 block">Syllabus Breakdown:</span>
              <p className="leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Round Button */}
          {roundAnswered && (
            <div className="flex justify-end pt-2">
              <button
                id="next-duel-round-btn"
                onClick={handleNextRound}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>{currentQIndex + 1 === activeQuestions.length ? 'See Champion' : 'Next Duel Round'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Lobby Setup Screen
  return (
    <div id="friend-duel-setup-container" className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
          <Users2 className="w-3.5 h-3.5" />
          MULTIPLAYER CONTEST ARENA
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Duel With <span className="text-amber-400">Your Friends</span>
        </h1>
        <p className="text-xs sm:text-sm text-blue-200/80 max-w-lg mx-auto">
          Experience the live University Duel buzzer pressure. Face off on the same screen or generate a challenge room code to compare scores!
        </p>
      </div>

      {/* Duel Format Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setDuelFormat('buzzer_battle')}
          className={`p-4 rounded-xl border text-left transition-all ${
            duelFormat === 'buzzer_battle'
              ? 'bg-[#10204d] border-amber-400 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
              : 'bg-[#0b1633] border-[#182a57] text-blue-200 hover:bg-[#0f1d45]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Head-to-Head Buzzer Battle</span>
          </div>
          <p className="text-xs text-blue-300/70 mt-1">
            2 players on same device! Quickest finger on keyboard/screen buzzes in first to win 10 pts.
          </p>
        </button>

        <button
          onClick={() => setDuelFormat('room_code')}
          className={`p-4 rounded-xl border text-left transition-all ${
            duelFormat === 'room_code'
              ? 'bg-[#10204d] border-cyan-400 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
              : 'bg-[#0b1633] border-[#182a57] text-blue-200 hover:bg-[#0f1d45]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-sm">Challenge Room Code</span>
          </div>
          <p className="text-xs text-blue-300/70 mt-1">
            Share a competition room seed with a friend across devices and compare your final accuracy.
          </p>
        </button>
      </div>

      {duelFormat === 'buzzer_battle' ? (
        /* 2-Player Roster Form */
        <div className="rounded-2xl bg-[#091433] border border-[#182a57] p-6 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Configure Contestants & University Affiliations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Player 1 Details */}
            <div className="p-4 rounded-xl bg-[#0c1a40] border border-blue-800/60 space-y-3">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" /> Contestant 1 (Key A / Left Buzzer)
              </span>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">Name / Handle</label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">University</label>
                <select
                  value={player1Uni}
                  onChange={(e) => setPlayer1Uni(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {NIGERIAN_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Player 2 Details */}
            <div className="p-4 rounded-xl bg-[#0c1a40] border border-blue-800/60 space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" /> Contestant 2 (Key L / Right Buzzer)
              </span>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">Name / Handle</label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-blue-300 font-medium block">University</label>
                <select
                  value={player2Uni}
                  onChange={(e) => setPlayer2Uni(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  {NIGERIAN_UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Match Settings */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#142347]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-200 font-semibold">Duel Length:</span>
              {[6, 8, 12].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                    questionCount === cnt
                      ? 'bg-blue-600 text-white border-cyan-400'
                      : 'bg-[#0c1a40] border-[#192b57] text-blue-300'
                  }`}
                >
                  {cnt} Questions
                </button>
              ))}
            </div>

            <button
              id="start-friend-duel-btn"
              onClick={() => startDuelGame()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4 text-slate-950" />
              START BUZZER BATTLE
            </button>
          </div>
        </div>
      ) : (
        /* Room Code Generation & Share */
        <div className="rounded-2xl bg-[#091433] border border-[#182a57] p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">Create Challenge Room</h3>
            <p className="text-xs text-blue-200/70">
              Send this code to your friends so you can test each other on the identical tournament question set.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#070e24] border border-[#1d3570]">
            <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400 tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={copyDuelRoomLink}
              className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied Link!' : 'Copy Room Link'}
            </button>
          </div>

          <div className="border-t border-[#142347] pt-4 space-y-3">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Or Join a Friend’s Room Code:
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. UDUEL-4821"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 rounded-lg bg-[#070e24] border border-[#1d3570] text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  if (joinCodeInput.trim()) {
                    startDuelGame();
                  }
                }}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
