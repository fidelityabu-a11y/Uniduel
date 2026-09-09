import React, { useState } from 'react';
import { SectionId, TimerOption } from '../types';
import { SYLLABUS_SECTIONS, TIMER_PRESETS } from '../data/syllabusQuestions';
import {
  Timer,
  Play,
  Sparkles,
  BarChart3,
  Calculator,
  Globe2,
  BrainCircuit,
  Sliders,
  CheckCircle2,
  Flame,
  HelpCircle
} from 'lucide-react';
import { duelSound } from '../utils/audio';

interface PracticeConfigProps {
  initialSection?: SectionId;
  onStartQuiz: (config: {
    section: SectionId;
    questionCount: number;
    timerSeconds: number | null;
    timerLabel: string;
  }) => void;
  onViewSyllabus: () => void;
}

export const PracticeConfig: React.FC<PracticeConfigProps> = ({
  initialSection = 'mixed',
  onStartQuiz,
  onViewSyllabus
}) => {
  const [selectedSection, setSelectedSection] = useState<SectionId>(initialSection);
  const [selectedTimerId, setSelectedTimerId] = useState<string>('tournament');
  const [customTimerValue, setCustomTimerValue] = useState<number>(25);
  const [isCustomTimer, setIsCustomTimer] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const getSectionIcon = (id: SectionId) => {
    switch (id) {
      case 'data_analysis':
        return <BarChart3 className="w-5 h-5 text-cyan-400" />;
      case 'applied_math':
        return <Calculator className="w-5 h-5 text-emerald-400" />;
      case 'general_knowledge':
        return <Globe2 className="w-5 h-5 text-amber-400" />;
      case 'verbal_reasoning':
        return <BrainCircuit className="w-5 h-5 text-purple-400" />;
      case 'mixed':
      default:
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
    }
  };

  const handleStart = () => {
    duelSound.playFanfare();
    let finalSeconds: number | null = null;
    let finalLabel = '';

    if (isCustomTimer) {
      finalSeconds = customTimerValue;
      finalLabel = `${customTimerValue}s Custom Timer`;
    } else {
      const preset = TIMER_PRESETS.find((p) => p.id === selectedTimerId);
      finalSeconds = preset ? preset.seconds : 20;
      finalLabel = preset ? preset.label : '20s Tournament';
    }

    onStartQuiz({
      section: selectedSection,
      questionCount,
      timerSeconds: finalSeconds,
      timerLabel: finalLabel
    });
  };

  return (
    <div id="practice-config-container" className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1a40] via-[#0f2459] to-[#0a1738] border border-[#1d3570] p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-semibold border border-blue-400/30">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              UDUEL SYLLABUS DRILL ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Prepare for the <span className="text-cyan-400">University Duel</span>
            </h1>
            <p className="text-blue-200/80 text-sm max-w-xl">
              Target specific syllabus domains or face the randomized mixed championship round. Pick your buzzer timer pace to replicate the live television stage.
            </p>
          </div>
          <button
            id="view-syllabus-btn"
            onClick={onViewSyllabus}
            className="self-start md:self-center px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            Inspect Full Syllabus
          </button>
        </div>
      </div>

      {/* Step 1: Section Selection */}
      <div id="section-selection-step" className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
            Select Duel Mode or Syllabus Branch
          </label>
          <span className="text-xs text-blue-300/70">
            {selectedSection === 'mixed' ? 'Randomized from all 4 branches' : 'Focused single-branch drill'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Mixed All Section Card */}
          <div
            id="mode-card-mixed"
            onClick={() => {
              duelSound.playTick();
              setSelectedSection('mixed');
            }}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
              selectedSection === 'mixed'
                ? 'bg-gradient-to-br from-[#12285e] to-[#15347f] border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                : 'bg-[#0b1633] border-[#1b2b57] hover:border-blue-500/50 hover:bg-[#0f1d45]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
              {selectedSection === 'mixed' && (
                <CheckCircle2 className="w-5 h-5 text-cyan-400 animate-in fade-in" />
              )}
            </div>
            <div className="mt-3">
              <h3 className="font-bold text-white text-sm">Mixed Duel (All 4 Branches)</h3>
              <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
                Full competition simulation blending Data Analysis, Applied Math, General Knowledge & Verbal Reasoning.
              </p>
            </div>
            <div className="mt-3 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              Championship Format
            </div>
          </div>

          {/* 4 Core Syllabus Branches */}
          {SYLLABUS_SECTIONS.map((sec) => {
            const isSelected = selectedSection === sec.id;
            return (
              <div
                key={sec.id}
                id={`section-card-${sec.id}`}
                onClick={() => {
                  duelSound.playTick();
                  setSelectedSection(sec.id);
                }}
                className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#12285e] to-[#15347f] border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-[#0b1633] border-[#1b2b57] hover:border-blue-500/50 hover:bg-[#0f1d45]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-blue-900/60 border border-blue-600/40 flex items-center justify-center">
                    {getSectionIcon(sec.id)}
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 animate-in fade-in" />
                  )}
                </div>
                <div className="mt-3">
                  <h3 className="font-bold text-white text-sm">{sec.name}</h3>
                  <p className="text-xs text-blue-200/70 mt-1 leading-relaxed line-clamp-2">
                    {sec.description}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {sec.topics.slice(0, 2).map((t, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-[#12234f] text-blue-200 border border-blue-800"
                    >
                      {t}
                    </span>
                  ))}
                  {sec.topics.length > 2 && (
                    <span className="text-[9px] text-blue-400 self-center">
                      +{sec.topics.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Timer Section (Pick practice timing) */}
      <div id="timer-section-step" className="space-y-4 rounded-2xl bg-[#091433] border border-[#182a57] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">2</span>
              Timer Section: Pick Practice Timing
            </label>
            <p className="text-xs text-blue-200/70 mt-0.5">
              Select standard television buzzer timings or set your own custom countdown.
            </p>
          </div>
          <button
            onClick={() => setIsCustomTimer(!isCustomTimer)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isCustomTimer
                ? 'bg-blue-600 text-white border-blue-400'
                : 'border-blue-800 text-blue-300 hover:bg-blue-900/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {isCustomTimer ? 'Use Standard Presets' : 'Custom Seconds'}
          </button>
        </div>

        {!isCustomTimer ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {TIMER_PRESETS.map((preset) => {
              const isSelected = selectedTimerId === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`timer-option-${preset.id}`}
                  onClick={() => {
                    duelSound.playTick();
                    setSelectedTimerId(preset.id);
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 border-cyan-400 ring-1 ring-cyan-400 text-white'
                      : 'bg-[#0c1a40] border-[#1c3063] hover:bg-[#112354] text-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <Timer className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-blue-400'}`} />
                      <span className="font-bold text-xs">
                        {preset.seconds ? `${preset.seconds}s` : 'Untimed'}
                      </span>
                    </div>
                    {preset.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-semibold border border-blue-500/30">
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-200/70 mt-2 line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0b1738] p-4 rounded-xl border border-blue-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Countdown Per Question: <span className="text-cyan-400 font-mono text-base font-bold">{customTimerValue} seconds</span>
              </span>
              <span className="text-[11px] text-blue-300/70">Range: 5s to 120s</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={customTimerValue}
              onChange={(e) => setCustomTimerValue(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-blue-950 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-blue-400">
              <span>5s (Extreme Blitz)</span>
              <span>30s</span>
              <span>60s</span>
              <span>120s (Extended)</span>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Round Length */}
      <div id="round-length-step" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#091433] border border-[#182a57]">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
            Questions Per Duel Round
          </label>
          <span className="text-xs text-blue-300/70 mt-0.5 block">
            Choose your drill volume
          </span>
        </div>

        <div className="flex items-center gap-2">
          {[5, 10, 15, 20].map((count) => (
            <button
              key={count}
              id={`question-count-btn-${count}`}
              onClick={() => {
                duelSound.playTick();
                setQuestionCount(count);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                questionCount === count
                  ? 'bg-blue-600 text-white border-cyan-400 shadow-md shadow-blue-600/30'
                  : 'bg-[#0c1a40] border-[#1e336b] text-blue-200 hover:bg-[#122457]'
              }`}
            >
              {count} Questions
            </button>
          ))}
        </div>
      </div>

      {/* Launch CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-blue-300/80">
          Ready to enter the arena with{' '}
          <strong className="text-white">
            {selectedSection === 'mixed' ? 'Mixed Duel' : SYLLABUS_SECTIONS.find((s) => s.id === selectedSection)?.name}
          </strong>{' '}
          ({questionCount} Questions,{' '}
          {isCustomTimer ? `${customTimerValue}s per question` : TIMER_PRESETS.find((p) => p.id === selectedTimerId)?.label})
        </div>

        <button
          id="launch-duel-btn"
          onClick={handleStart}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-cyan-400/40"
        >
          <Play className="w-4 h-4 fill-white" />
          START DUEL ROUND
        </button>
      </div>
    </div>
  );
};
