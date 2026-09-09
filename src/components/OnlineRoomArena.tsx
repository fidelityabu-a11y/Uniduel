import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import {
  DuelRoom,
  submitDuelAnswer,
  requestDuelRematch,
  getSyncedServerTime
} from '../utils/duelRoomService';
import { duelSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Swords,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  HelpCircle
} from 'lucide-react';
import { shuffleArray } from '../utils/shuffle';
import { QUESTION_BANK } from '../data/syllabusQuestions';
import { recordContestantDuelResult } from '../utils/storage';

interface OnlineRoomArenaProps {
  room: DuelRoom;
  myPlayerId: string;
  isHost: boolean;
  onExitDuel: () => void;
}

export const OnlineRoomArena: React.FC<OnlineRoomArenaProps> = ({
  room,
  myPlayerId,
  isHost,
  onExitDuel
}) => {
  const questions = room.questions;
  const currentQIndex = room.currentQIndex;
  const isRoundTransitioning = Boolean(room.isTransitioning);
  const [localSelectedOption, setLocalSelectedOption] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(15);
  const [rematchLoading, setRematchLoading] = useState<boolean>(false);

  const lastSeenRoundResultRef = useRef<number | null>(null);
  const currentQ: Question | undefined = questions[currentQIndex];

  const myPlayer = room.host.id === myPlayerId ? room.host : room.guest;
  const opponentPlayer = room.host.id === myPlayerId ? room.guest : room.host;

  // Clear local selected option when the question advances
  useEffect(() => {
    setLocalSelectedOption(null);
  }, [currentQIndex]);

  // Synchronized countdown computed from server-authoritative roundEndsAt
  useEffect(() => {
    if (room.status !== 'in_progress' || isRoundTransitioning) {
      return;
    }

    const updateTimer = () => {
      if (!room.roundEndsAt) {
        setCountdown(15);
        return;
      }
      const now = getSyncedServerTime();
      const remainingMs = Math.max(0, room.roundEndsAt - now);
      const secs = Math.ceil(remainingMs / 1000);
      setCountdown(secs);

      if (secs <= 3 && secs > 0) {
        duelSound.playTick();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [room.roundEndsAt, isRoundTransitioning, room.status]);

  // Audio cues when opponent triggers a reveal or round timeout
  useEffect(() => {
    if (!room.lastRoundResult) return;
    const res = room.lastRoundResult;
    if (lastSeenRoundResultRef.current === res.timestamp) return;
    lastSeenRoundResultRef.current = res.timestamp;

    if (res.status === 'timeout') {
      duelSound.playBuzzer();
    } else if (res.answeredBy !== myPlayerId) {
      if (res.isCorrect) {
        duelSound.playBuzzer();
      } else {
        duelSound.playWrong();
      }
    }
  }, [room.lastRoundResult, myPlayerId]);

  // Format transition banner message
  const getTransitionMessage = () => {
    const lastRes = room.lastRoundResult;
    if (!lastRes) return 'Round concluded! Advancing both players...';

    const correctLetter = String.fromCharCode(65 + (lastRes.correctIndex ?? currentQ?.correctIndex ?? 0));
    const optLetter = String.fromCharCode(65 + (lastRes.optionIndex ?? 0));
    const points = lastRes.pointsEarned || 10;

    if (lastRes.status === 'timeout') {
      return `⏱️ Time's up! Correct answer was Option ${correctLetter}. Advancing together...`;
    }

    const isMe = lastRes.answeredBy === myPlayerId;
    const actorName = isMe ? 'You' : opponentPlayer?.name || lastRes.answeredByName || 'Opponent';

    if (lastRes.isCorrect) {
      return `⚡ ${actorName} picked Option ${optLetter} — Correct! (+${points} pts). Advancing together...`;
    } else {
      return `❌ ${actorName} picked Option ${optLetter} — Incorrect (0 pts). Correct answer was Option ${correctLetter}. Advancing together...`;
    }
  };

  // Handle player selecting an option
  const handleSelectOption = async (optionIdx: number) => {
    if (isRoundTransitioning || !currentQ || room.status !== 'in_progress') return;
    if (localSelectedOption !== null) return;

    setLocalSelectedOption(optionIdx);
    const clientTimestamp = Date.now();
    const isCorrect = optionIdx === currentQ.correctIndex;
    const timeSpent = Math.max(1, 15 - countdown);

    if (isCorrect) {
      duelSound.playCorrect();
    } else {
      duelSound.playWrong();
    }

    await submitDuelAnswer({
      roomId: room.id,
      playerId: myPlayerId,
      qIndex: currentQIndex,
      optionIndex: optionIdx,
      isCorrect,
      timeSpent,
      clientTimestamp
    });
  };

  // Keyboard hotkeys for instant answering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRoundTransitioning || room.status !== 'in_progress') return;
      const key = e.key.toLowerCase();
      if (key === '1' || key === 'a') handleSelectOption(0);
      else if (key === '2' || key === 'b') handleSelectOption(1);
      else if (key === '3' || key === 'c') handleSelectOption(2);
      else if (key === '4' || key === 'd') handleSelectOption(3);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRoundTransitioning, room.status, currentQIndex, countdown]);

  // Trigger celebration on match finished and record real contestant scores to leaderboard
  useEffect(() => {
    if (room.status === 'finished') {
      duelSound.playFanfare();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 }
      });

      const hostScore = room.host.score;
      const guestScore = room.guest ? room.guest.score : 0;
      const hostWon = hostScore > guestScore;
      const guestWon = guestScore > hostScore;

      // Record Host to real leaderboard
      recordContestantDuelResult({
        id: room.host.id,
        name: room.host.name,
        university: room.host.university,
        pointsWon: hostScore,
        isWinner: hostWon,
        section: room.section
      });

      // Record Guest to real leaderboard
      if (room.guest) {
        recordContestantDuelResult({
          id: room.guest.id,
          name: room.guest.name,
          university: room.guest.university,
          pointsWon: guestScore,
          isWinner: guestWon,
          section: room.section
        });
      }
    }
  }, [room.status]);

  const handleRematch = async () => {
    setRematchLoading(true);
    const freshSet = shuffleArray([...QUESTION_BANK]).slice(0, room.questionCount);
    await requestDuelRematch(room.id, freshSet);
    setRematchLoading(false);
  };

  // ---------------- MATCH FINISHED VIEW ----------------
  if (room.status === 'finished') {
    const hostScore = room.host.score;
    const guestScore = room.guest ? room.guest.score : 0;
    const isTie = hostScore === guestScore;
    const hostWon = hostScore > guestScore;

    const winnerName = isTie
      ? 'Deadlock!'
      : hostWon
      ? room.host.name
      : room.guest?.name;

    const winnerUni = isTie
      ? 'Both Universities Tied!'
      : hostWon
      ? room.host.university
      : room.guest?.university;

    const amIWinner = !isTie && ((hostWon && isHost) || (!hostWon && !isHost));

    return (
      <div id="duel-finished-screen" className="max-w-3xl mx-auto py-8 space-y-6">
        <div className="rounded-3xl bg-gradient-to-b from-[#0c1a40] via-[#070e24] to-[#040918] border border-[#1d3570] p-6 sm:p-10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              1V1 ARENA SHOWDOWN COMPLETE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {isTie ? 'Epic Deadlock Tie!' : `${winnerName} Crowned Champion!`}
            </h2>
            <p className="text-sm text-blue-200/80 font-semibold max-w-md mx-auto">
              {winnerUni}
            </p>
            {amIWinner && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mt-2">
                <Sparkles className="w-3.5 h-3.5" /> Victory Registered on Leaderboard!
              </div>
            )}
          </div>

          {/* Side-by-Side Comparative Scorecard */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-2">
            {/* Host Card */}
            <div
              className={`p-4 rounded-2xl border text-left space-y-2 ${
                hostWon && !isTie
                  ? 'bg-gradient-to-b from-blue-900/60 to-blue-950/80 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                  : 'bg-[#091536] border-[#182a57]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Player 1 (Host)
                </span>
                {hostWon && !isTie && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950">
                    WINNER
                  </span>
                )}
              </div>
              <div className="font-extrabold text-white text-base truncate">
                {room.host.name}
              </div>
              <div className="text-[11px] text-blue-300/70 truncate">
                {room.host.university}
              </div>
              <div className="text-3xl font-black text-white pt-1">
                {room.host.score} <span className="text-xs text-blue-400 font-normal">pts</span>
              </div>
            </div>

            {/* Guest Card */}
            <div
              className={`p-4 rounded-2xl border text-left space-y-2 ${
                !hostWon && !isTie
                  ? 'bg-gradient-to-b from-blue-900/60 to-blue-950/80 border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                  : 'bg-[#091536] border-[#182a57]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Player 2 (Challenger)
                </span>
                {!hostWon && !isTie && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-slate-950">
                    WINNER
                  </span>
                )}
              </div>
              <div className="font-extrabold text-white text-base truncate">
                {room.guest ? room.guest.name : 'Challenger'}
              </div>
              <div className="text-[11px] text-blue-300/70 truncate">
                {room.guest ? room.guest.university : ''}
              </div>
              <div className="text-3xl font-black text-white pt-1">
                {room.guest ? room.guest.score : 0} <span className="text-xs text-blue-400 font-normal">pts</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#142347]">
            <button
              id="rematch-duel-btn"
              onClick={handleRematch}
              disabled={rematchLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{rematchLoading ? 'Preparing Rematch...' : 'Rematch With Fresh Questions'}</span>
            </button>

            <button
              id="exit-duel-btn"
              onClick={onExitDuel}
              className="px-6 py-3 rounded-xl border border-blue-800 bg-[#0c183b] text-blue-200 hover:bg-[#112354] hover:text-white font-bold text-xs transition-all cursor-pointer"
            >
              Return to Duel Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- ACTIVE GAMEPLAY VIEW ----------------
  if (!currentQ) {
    return (
      <div className="text-center py-12 text-blue-200 text-sm">
        Loading challenge round...
      </div>
    );
  }

  return (
    <div id="online-room-arena" className="max-w-3xl mx-auto py-4 space-y-5">
      {/* Live Duel Synchronized Scoreboard Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#091533] via-[#0d1f47] to-[#091533] border border-[#1e346d] shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* My Player Info */}
          <div className="flex items-center gap-3 max-w-[40%]">
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-cyan-400 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
              {isHost ? 'P1' : 'P2'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span className="truncate">{myPlayer?.name}</span>
                <span className="text-[10px] text-cyan-300 font-semibold">(You)</span>
              </div>
              <div className="text-[10px] text-blue-300/70 truncate">{myPlayer?.university}</div>
              <div className="text-sm font-black text-cyan-400 mt-0.5">
                {myPlayer?.score || 0} pts
              </div>
            </div>
          </div>

          {/* Center Round & Timer */}
          <div className="text-center flex flex-col items-center flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
              Round {currentQIndex + 1} of {questions.length}
            </span>

            {/* Countdown Badge */}
            <div
              className={`mt-1 px-3 py-1 rounded-full flex items-center gap-1.5 font-mono text-sm font-black transition-all ${
                countdown <= 3
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-blue-900/40 text-cyan-300 border border-blue-700/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{countdown}s</span>
            </div>
          </div>

          {/* Opponent Player Info */}
          <div className="flex items-center gap-3 justify-end max-w-[40%] text-right">
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {opponentPlayer?.name || 'Waiting...'}
              </div>
              <div className="text-[10px] text-blue-300/70 truncate">{opponentPlayer?.university}</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">
                {opponentPlayer?.score || 0} pts
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-600 border border-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md flex-shrink-0">
              {isHost ? 'P2' : 'P1'}
            </div>
          </div>
        </div>

        {/* Live Status Strip */}
        <div className="pt-2 border-t border-[#162752] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            {isRoundTransitioning ? (
              <span className="text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {getTransitionMessage()}
              </span>
            ) : (
              <span className="text-cyan-300/90 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Real-Time Synchronized Duel: Answers and countdowns match simultaneously on both screens.
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-blue-300/60 font-mono text-[10px]">
            <span>Press [1-4] or [A-D]</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl bg-[#091433] border border-[#182a57] p-5 sm:p-6 space-y-4">
        {/* Meta badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-cyan-300 border border-blue-700/40">
              {currentQ.topic}
            </span>
            {currentQ.isFastFire && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                Rapid-Fire Sudden Death
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-blue-300/60">
            {currentQ.difficulty}
          </span>
        </div>

        {/* Question Text */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
          {currentQ.question}
        </h3>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {currentQ.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isMyPick = localSelectedOption === idx;
            const isOpponentPick =
              room.lastRoundResult?.qIndex === currentQIndex &&
              room.lastRoundResult?.answeredBy !== myPlayerId &&
              room.lastRoundResult?.optionIndex === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let btnStyle = 'bg-[#0b1633] border-[#1a2e5c] text-blue-100 hover:bg-[#0f1f47] hover:border-cyan-500/40';

            if (isRoundTransitioning) {
              if (isCorrect) {
                // Highlight correct option prominently with emerald ring and glowing border
                btnStyle = 'bg-emerald-950/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30 font-semibold';
              } else if (isMyPick || isOpponentPick) {
                btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200 ring-2 ring-rose-500/60';
              } else {
                btnStyle = 'bg-[#070e24]/60 border-[#142347] text-blue-300/40 opacity-40';
              }
            }

            return (
              <button
                key={idx}
                id={`duel-option-${idx}`}
                onClick={() => handleSelectOption(idx)}
                disabled={isRoundTransitioning || localSelectedOption !== null}
                className={`p-3.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isRoundTransitioning || localSelectedOption !== null ? 'cursor-default' : 'cursor-pointer'
                } ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isRoundTransitioning && isCorrect
                        ? 'bg-emerald-400 text-slate-950 font-black'
                        : isRoundTransitioning && (isMyPick || isOpponentPick) && !isCorrect
                        ? 'bg-rose-500 text-white font-black'
                        : isMyPick || isOpponentPick
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-[#12234e] text-blue-300 border border-blue-700/50'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs sm:text-sm font-medium leading-relaxed">
                    {option}
                  </span>
                </div>

                {isRoundTransitioning && isCorrect && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-900/80 px-2.5 py-1 rounded-md border border-emerald-400/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isMyPick
                      ? 'You (+10 pts)'
                      : isOpponentPick
                      ? `${opponentPlayer?.name || 'Opponent'} (+10 pts)`
                      : 'Correct Option'}
                  </span>
                )}
                {isRoundTransitioning && !isCorrect && isMyPick && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/90 px-2.5 py-1 rounded-md border border-rose-500/60">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    You (Incorrect, 0 pts)
                  </span>
                )}
                {isRoundTransitioning && !isCorrect && isOpponentPick && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/90 px-2.5 py-1 rounded-md border border-rose-500/60">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    {opponentPlayer?.name || 'Opponent'} (Incorrect, 0 pts)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Rapid-Fire Auto-Advance Status Banner */}
        {isRoundTransitioning && (
          <div
            id="duel-auto-advance-banner"
            className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/90 via-[#0a183d] to-blue-950/90 border border-cyan-500/50 flex flex-col gap-2 animate-in fade-in"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-cyan-200 font-bold">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                <span>{getTransitionMessage()}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/90 uppercase tracking-wider font-bold">
                Next Question Incoming
              </span>
            </div>
            <div className="w-full bg-blue-950/80 h-1.5 rounded-full overflow-hidden border border-blue-800/40">
              <div className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 w-full animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onExitDuel}
          className="text-xs text-rose-300/70 hover:text-rose-200 transition-colors"
        >
          Exit Duel
        </button>

        <span className="text-[11px] text-blue-300/60 font-mono">
          UDuel Head-to-Head Arena • Room: {room.id}
        </span>
      </div>
    </div>
  );
};
