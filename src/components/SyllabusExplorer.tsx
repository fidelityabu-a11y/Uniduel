import React, { useState } from 'react';
import { SectionId } from '../types';
import { SYLLABUS_SECTIONS, QUESTION_BANK } from '../data/syllabusQuestions';
import {
  BookOpen,
  BarChart3,
  Calculator,
  Globe2,
  BrainCircuit,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { duelSound } from '../utils/audio';

interface SyllabusExplorerProps {
  onStartTopicDrill: (sectionId: SectionId) => void;
}

const FORMULAS_AND_CHEAT_SHEET = [
  {
    category: 'Data Analysis',
    title: "Pearson's Empirical Skewness",
    formula: 'Mode = 3(Median) - 2(Mean)',
    note: 'Used in UDuel to find missing central tendency values in moderately skewed distributions.'
  },
  {
    category: 'Data Analysis',
    title: 'Outlier Detection (1.5 IQR Rule)',
    formula: 'IQR = Q3 - Q1 | Upper Fence = Q3 + 1.5(IQR) | Lower Fence = Q1 - 1.5(IQR)',
    note: 'Standard statistical criteria for boxplot whisker endpoints and outlier identification.'
  },
  {
    category: 'Data Analysis',
    title: 'Independent Events Probability',
    formula: 'P(A and B) = P(A) × P(B) | P(A | B) = P(A ∩ B) / P(B)',
    note: 'Probability of simultaneous occurrence equals the product of independent marginal probabilities.'
  },
  {
    category: 'Applied Mathematics',
    title: 'Volume & Rate of Drainage',
    formula: 'Time = Total Active Volume / Flow Rate (1 m³ = 1,000 Liters = 1 kL)',
    note: 'Essential conversion in fluid kinetics and capacity word problems.'
  },
  {
    category: 'Applied Mathematics',
    title: 'Calculus Differentials & Small Changes',
    formula: 'ΔV ≈ dV = (dV/dr) × dr = 4πr² dr (for Sphere)',
    note: 'First-order differential approximation for melting ice or thermal thermal expansion.'
  },
  {
    category: 'Applied Mathematics',
    title: 'Logarithmic pH Concentration',
    formula: 'pH = -log₁₀[H⁺]  <=>  [H⁺] = 10^(-pH)',
    note: 'Exponential translation between molarity and acidity index in chemistry.'
  },
  {
    category: 'Applied Mathematics',
    title: 'Vectors & 3D Geometry',
    formula: 'Vector EF = f - e = (x₂ - x₁)i + (y₂ - y₁)j',
    note: 'Displacement between two coordinates using unit standard basis vectors.'
  }
];

export const SyllabusExplorer: React.FC<SyllabusExplorerProps> = ({ onStartTopicDrill }) => {
  const [expandedSection, setExpandedSection] = useState<SectionId | 'all'>('data_analysis');
  const [showFormulaSheet, setShowFormulaSheet] = useState<boolean>(true);

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
      default:
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
    }
  };

  return (
    <div id="syllabus-explorer-container" className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c1a40] via-[#0f2459] to-[#0a1738] border border-[#1e346f] p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-semibold border border-blue-400/30">
          <BookOpen className="w-3.5 h-3.5" />
          OFFICIAL UDUEL SYLLABUS SPECIFICATION
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          University Duel <span className="text-cyan-400">Curriculum & Topics</span>
        </h1>
        <p className="text-xs sm:text-sm text-blue-200/80 max-w-2xl leading-relaxed">
          Comprehensive breakdown extracted directly from the official competition syllabus. Review required subtopics, key competition formulas, and launch targeted drill sessions.
        </p>
      </div>

      {/* Formula & Key Concept Quick-Sheet */}
      <div className="rounded-2xl bg-[#091433] border border-[#182a57] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              High-Yield UDuel Competition Formulas & Shortcuts
            </h3>
          </div>
          <button
            onClick={() => setShowFormulaSheet(!showFormulaSheet)}
            className="text-xs text-blue-300 hover:text-white flex items-center gap-1"
          >
            {showFormulaSheet ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showFormulaSheet ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {showFormulaSheet && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {FORMULAS_AND_CHEAT_SHEET.map((f, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#0c183b] border border-[#1d3570] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">{f.title}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-900/60 text-cyan-300">
                    {f.category}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#060d22] font-mono text-xs text-cyan-300 border border-blue-900/50">
                  {f.formula}
                </div>
                <p className="text-[11px] text-blue-300/70 leading-normal">{f.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Syllabus Sections Detailed Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
          The 4 Core Duel Branches (As Outlined in Official Syllabus)
        </h3>

        <div className="space-y-3">
          {SYLLABUS_SECTIONS.map((sec) => {
            const isExpanded = expandedSection === sec.id;
            const qCount = QUESTION_BANK.filter((q) => q.section === sec.id).length;

            return (
              <div
                key={sec.id}
                className="rounded-xl bg-[#091433] border border-[#192b57] overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedSection(isExpanded ? 'all' : sec.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#0d1c47] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0e1d47] border border-blue-600/40 flex items-center justify-center">
                      {getSectionIcon(sec.id)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                        {sec.name}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-cyan-300 border border-blue-700/40">
                          {qCount} Questions in Bank
                        </span>
                      </h4>
                      <p className="text-xs text-blue-200/70 mt-0.5">{sec.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duelSound.playTick();
                        onStartTopicDrill(sec.id);
                      }}
                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30"
                    >
                      <span>Drill This Branch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Subtopics & Syllabus Detail */}
                {isExpanded && (
                  <div className="p-5 border-t border-[#15244b] bg-[#070e24] space-y-4 animate-in fade-in">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-2">
                        Topics & Competencies Covered:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sec.topics.map((topic, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-2.5 rounded-lg bg-[#0c183a] border border-[#192c5a] flex items-center gap-2.5 text-xs text-blue-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          duelSound.playTick();
                          onStartTopicDrill(sec.id);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                      >
                        <span>Start Practice in {sec.name}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
