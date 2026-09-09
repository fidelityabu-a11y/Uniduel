import React, { useState, useEffect, useRef } from 'react';
import { Question, SectionId, QuizHistoryItem } from '../types';
import { duelSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Users2,
  BookOpen,
  Award,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { recordQuizCompletion } from '../utils/storage';

interface SoloQuizProps {
  questions: Question[];
  section: SectionId;
  timerSeconds: number | null;
  timerLabel: string;
  onExit: () => void;
  onRestart: () => void;
  onChallengeFriend: (questions: Question[]) => void;
  onOpenLeaderboard: () => void;
}

export const SoloQuiz: React.FC<SoloQuizProps> = ({
  questions,
  section,
  timerSeconds,
  timerLabel,
  onExit,
  onRestart,
  onChallengeFriend,
  onOpenLeaderboard
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(timerSeconds);
  const [startTime] = useState<number>(Date.now());
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentIndex];

  // Reset timer on question change
  useEffect(() => {
    if (timerSeconds !== null) {
      setTimeLeft(timerSeconds);
    }
    setSelectedOption(null);
    setIsAnswered(false);
  }, [currentIndex, timerSeconds]);

  // Countdown timer logic
  useEffect(() => {
    if (isCompleted || isAnswered || timerSeconds === null) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Time expired! Auto-submit as timeout
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleTimeExpire();
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
  }, [currentIndex, isAnswered, isCompleted, timerSeconds]);

  const handleTimeExpire = () => {
    duelSound.playBuzzer();
    setSelectedOption(-1); // -1 indicates timeout
    setIsAnswered(true);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = -1;
    setAnswers(newAnswers);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      duelSound.playCorrect();
    } else {
      duelSound.playWrong();
    }

    const newAnswers = [...answers];
    newAnswers[currentIndex] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setTotalTimeSpent(elapsed);
    setIsCompleted(true);

    // Calculate score
    const correctCount = answers.filter(
      (ans, i) => ans === questions[i].correctIndex
    ).length;
    const accuracy = Math.round((correctCount / questions.length) * 100);

    if (accuracy >= 60) {
      duelSound.playFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Tally by section
    const bySection: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, idx) => {
      if (!bySection[q.section]) {
        bySection[q.section] = { correct: 0, total: 0 };
      }
      bySection[q.section].total += 1;
      if (answers[idx] === q.correctIndex) {
        bySection[q.section].correct += 1;
      }
    });

    const historyRecord: QuizHistoryItem = {
      id: `duel-${Date.now()}`,
      timestamp: Date.now(),
      mode: 'solo',
      section,
      score: correctCount,
      total: questions.length,
      timeSpentSec: elapsed,
      timerMode: timerLabel,
      accuracy
    };

    recordQuizCompletion(historyRecord, bySection);
  };

  // Completion Screen
  if (isCompleted) {
    const correctCount = answers.filter(
      (ans, i) => ans === questions[i].correctIndex
    ).length;
    const accuracy = Math.round((correctCount / questions.length) * 100);

    return (
      <div id="quiz-results-container" className="max-w-3xl mx-auto py-6 space-y-6">
        {/* Scorecard Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0c1a42] to-[#070e24] border border-[#1d3570] p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-300/40">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Duel Arena Result
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {accuracy >= 80
                ? 'Championship Caliber!'
                : accuracy >= 50
                ? 'Strong Performance!'
                : 'Keep Drilling!'}
            </h2>
            <p className="text-xs text-blue-200/70 mt-1">
              Completed {questions.length} questions in {timerLabel} mode
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
            <div className="p-3 rounded-xl bg-[#0e1c45] border border-[#1e346f]">
              <span className="text-[11px] text-blue-300 font-medium block">Score</span>
              <span className="text-xl sm:text-2xl font-black text-white">
                {correctCount} / {questions.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0e1c45] border border-[#1e346f]">
              <span className="text-[11px] text-blue-300 font-medium block">Accuracy</span>
              <span className={`text-xl sm:text-2xl font-black ${
                accuracy >= 70 ? 'text-emerald-400' : accuracy >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {accuracy}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0e1c45] border border-[#1e346f]">
              <span className="text-[11px] text-blue-300 font-medium block">Duration</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300">
                {Math.floor(totalTimeSpent / 60)}m {totalTimeSpent % 60}s
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              id="results-restart-btn"
              onClick={onRestart}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Duel Round
            </button>

            <button
              id="results-challenge-friend-btn"
              onClick={() => onChallengeFriend(questions)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all"
            >
              <Users2 className="w-3.5 h-3.5" />
              Duel a Friend on These Questions
            </button>

            <button
              id="results-leaderboard-btn"
              onClick={onOpenLeaderboard}
              className="px-5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              View Global Leaderboard
            </button>

            <button
              id="results-exit-btn"
              onClick={onExit}
              className="px-5 py-2.5 rounded-xl border border-blue-800 bg-[#0c183b] text-blue-300 hover:bg-[#112354] text-xs font-bold transition-all"
            >
              Choose Another Section
            </button>
          </div>
        </div>

        {/* Detailed Solutions & Explanations Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Detailed Solutions & Explanations Review
            </h3>
            <span className="text-xs text-blue-300/70">
              {correctCount} Correct • {questions.length - correctCount} Mistakes
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isAnsCorrect = userAns === q.correctIndex;
              const isTimeout = userAns === -1;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border ${
                    isAnsCorrect
                      ? 'bg-[#091836] border-emerald-500/30'
                      : 'bg-[#181228] border-rose-500/30'
                  } space-y-3`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          Q{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-cyan-300 border border-blue-700/40">
                          {q.topic}
                        </span>
                        {q.fromSyllabus && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Syllabus Sample
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">
                        {q.question}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {isAnsCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : isTimeout ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded-md border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" /> Timed Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-1 rounded-md border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const isCorrectChoice = oIdx === q.correctIndex;
                      const isSelectedChoice = oIdx === userAns;

                      let badgeClass = 'bg-[#0b142d] border-[#1a2b57] text-blue-200/70';
                      if (isCorrectChoice) {
                        badgeClass = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-bold';
                      } else if (isSelectedChoice && !isCorrectChoice) {
                        badgeClass = 'bg-rose-950/60 border-rose-500/60 text-rose-300 line-through';
                      }

                      return (
                        <div key={oIdx} className={`p-2 rounded-lg border flex items-center justify-between ${badgeClass}`}>
                          <span>
                            <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                          </span>
                          {isCorrectChoice && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {isSelectedChoice && !isCorrectChoice && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mathematical / Logical Explanation */}
                  <div className="p-3 rounded-lg bg-[#070e24] border border-[#162752] text-xs text-blue-200/90 space-y-1">
                    <span className="font-bold text-cyan-300 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Step-by-Step Solution:
                    </span>
                    <p className="leading-relaxed pl-4 border-l border-cyan-500/30">
                      {q.explanation}
                    </p>
                    {q.referenceSource && (
                      <span className="text-[10px] text-blue-400 block pt-1">
                        Source Reference: {q.referenceSource}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz Question Card
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const timeProgress = timerSeconds !== null && timeLeft !== null ? (timeLeft / timerSeconds) * 100 : 100;

  return (
    <div id="active-quiz-arena" className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Top HUD: Progress & Timer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-cyan-400 text-sm">
              QUESTION {currentIndex + 1} OF {questions.length}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-200 border border-blue-700/40">
              {currentQ.topic}
            </span>
            {currentQ.fromSyllabus && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Official Syllabus
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          {timerSeconds !== null ? (
            <div
              id="buzzer-clock"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border transition-colors ${
                (timeLeft ?? 0) <= 5
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-blue-950/80 border-cyan-500/40 text-cyan-300'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          ) : (
            <span className="text-[11px] text-blue-300/70 font-mono">Untimed Practice</span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#0d1838] h-1.5 rounded-full overflow-hidden border border-[#192b57]">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Timer Decay Bar */}
        {timerSeconds !== null && (
          <div className="w-full bg-[#0a122a] h-1 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 linear ${
                (timeLeft ?? 0) <= 5 ? 'bg-rose-500' : (timeLeft ?? 0) <= 10 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${timeProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Main Duel Question Board */}
      <div
        id="question-card"
        className="rounded-2xl bg-gradient-to-b from-[#0b173b] to-[#070f28] border border-[#1c336b] p-6 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-blue-300/70">
            <span>Difficulty: <strong className="text-cyan-300">{currentQ.difficulty}</strong></span>
            <span>UDuel Stage Arena</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed tracking-wide">
            {currentQ.question}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {currentQ.options.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;

            let cardStyles = 'bg-[#0c1a40] border-[#1c3066] text-blue-100 hover:border-cyan-400 hover:bg-[#112354]';

            if (isAnswered) {
              if (isCorrect) {
                cardStyles = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 font-bold';
              } else if (isSelected && !isCorrect) {
                cardStyles = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500 font-bold';
              } else {
                cardStyles = 'bg-[#09122c] border-[#152347] text-blue-200/40 opacity-70';
              }
            }

            return (
              <button
                key={idx}
                id={`option-btn-${idx}`}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all group ${cardStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-sm border transition-colors ${
                      isAnswered && isCorrect
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : isAnswered && isSelected && !isCorrect
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-[#12234e] text-cyan-300 border-blue-800 group-hover:border-cyan-400'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm font-medium leading-relaxed">
                    {option}
                  </span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Real-time Explanation Drawer when answered */}
        {isAnswered && (
          <div
            id="explanation-drawer"
            className={`p-4 rounded-xl border space-y-2 animate-in fade-in slide-in-from-top-2 ${
              selectedOption === currentQ.correctIndex
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-[#151a38] border-blue-600/40 text-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Solution & Contest Analysis
              </span>
            </div>
            <p className="text-xs leading-relaxed text-blue-100">
              {currentQ.explanation}
            </p>
            {currentQ.referenceSource && (
              <span className="text-[10px] text-blue-300/70 block">
                UDuel Reference: {currentQ.referenceSource}
              </span>
            )}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#162752]">
          <button
            onClick={onExit}
            className="text-xs text-blue-300 hover:text-white transition-colors"
          >
            Leave Practice
          </button>

          {isAnswered && (
            <button
              id="next-question-btn"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <span>{currentIndex + 1 === questions.length ? 'View Final Results' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
