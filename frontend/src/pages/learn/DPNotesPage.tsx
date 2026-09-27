import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Code2,
  GitBranch,
  Layers3,
  Target,
  Workflow,
  Zap,
  BrainCircuit,
  Compass,
  Eye,
  Orbit,
  Radio,
  ScanLine,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { NeonFrame } from "../../cinematic";
import type { DPConcept } from "../../cinematic/scenes/DPConceptScene";

const DPConceptScene = lazy(() => import("../../cinematic/scenes/DPConceptScene"));

const SECTION_CONCEPT: Record<string, DPConcept> = {
  introduction: "state",
  "what-is-dp": "transition",
  characteristics: "constraint",
  "optimal-substructure": "optimality",
  overlapping: "overlap",
  approaches: "memo",
  workflow: "pruning",
  optiflow: "reconstruction",
};

const CONCEPT_CAPTION: Record<DPConcept, string> = {
  state: "A state stores exactly what the future needs to know.",
  transition: "Transitions carry energy from one state to the next.",
  constraint: "Constraints form the boundary of the feasible region.",
  pruning: "States outside the boundary dissolve before they branch.",
  optimality: "Optimal substructure: the best path is built from best sub-paths.",
  reconstruction: "Stored predecessors let us walk the answer backwards.",
  overlap: "Overlapping subproblems: identical states merge into one.",
  memo: "Memoization: a solved state glows as cached and is reused.",
  grid: "Tabulation: the table fills bottom-up, cell by cell.",
};

const TOUR: { concept: DPConcept; caption: string }[] = (
  ["state", "transition", "optimality", "overlap", "memo", "grid", "pruning", "reconstruction"] as DPConcept[]
).map((concept) => ({ concept, caption: CONCEPT_CAPTION[concept] }));

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "what-is-dp", label: "What is Dynamic Programming?" },
  { id: "characteristics", label: "Core Characteristics" },
  { id: "optimal-substructure", label: "Optimal Substructure" },
  { id: "overlapping", label: "Overlapping Subproblems" },
  { id: "approaches", label: "DP Approaches" },
  { id: "workflow", label: "DP Workflow" },
  { id: "optiflow", label: "DP inside OptiFlow" },
];

export default function DPNotesPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("introduction");
  const [orbitMode, setOrbitMode] = useState(true);
  const [tourIndex, setTourIndex] = useState(0);

  // Auto-tour of the 3D concept views (hero)
  useEffect(() => {
    if (!orbitMode) return;
    const timer = window.setInterval(() => setTourIndex((v) => (v + 1) % TOUR.length), 4200);
    return () => window.clearInterval(timer);
  }, [orbitMode]);

  // Approaches section alternates memoization ↔ tabulation
  const [approachFlip, setApproachFlip] = useState(false);
  useEffect(() => {
    if (activeSection !== "approaches") return;
    const timer = window.setInterval(() => setApproachFlip((v) => !v), 4000);
    return () => window.clearInterval(timer);
  }, [activeSection]);

  const sectionConcept: DPConcept =
    activeSection === "approaches" ? (approachFlip ? "grid" : "memo") : SECTION_CONCEPT[activeSection] ?? "state";
  const heroConcept: DPConcept = orbitMode ? TOUR[tourIndex].concept : sectionConcept;
  const heroCaption = orbitMode ? TOUR[tourIndex].caption : CONCEPT_CAPTION[sectionConcept];

  useEffect(() => {
    const onScroll = () => {
      const positions = sections
        .map((section) => {
          const element = document.getElementById(section.id);
          return element
            ? { id: section.id, distance: Math.abs(element.getBoundingClientRect().top - 150) }
            : null;
        })
        .filter(Boolean) as { id: string; distance: number }[];

      if (positions.length) {
        positions.sort((a, b) => a.distance - b.distance);
        setActiveSection(positions[0].id);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="of-cinematic-notes relative min-h-full text-white">
      <style>{`
        @keyframes noteStar {
          0%,100% { opacity:.16; transform:scale(.75); }
          50% { opacity:.9; transform:scale(1.45); }
        }
        @keyframes dataDrift {
          0% { transform:translateX(-20px); opacity:0; }
          15% { opacity:.8; }
          80% { opacity:.45; }
          100% { transform:translateX(260px); opacity:0; }
        }
        @keyframes scan {
          0% { transform:translateY(-100%); opacity:0; }
          20% { opacity:.45; }
          80% { opacity:.12; }
          100% { transform:translateY(500%); opacity:0; }
        }
        @keyframes edge {
          0%,100% { opacity:.15; }
          50% { opacity:.75; }
        }
        @keyframes pulseCore {
          0%,100% { box-shadow:0 0 0 rgba(90,240,255,0), 0 0 22px rgba(90,240,255,.05); }
          50% { box-shadow:0 0 0 5px rgba(90,240,255,.025), 0 0 40px rgba(90,240,255,.16); }
        }
        @keyframes floatNode {
          0%,100% { transform:translateY(0); }
          50% { transform:translateY(-7px); }
        }


        .of-cinematic-notes {
          --of-cyan: #69edff;
          --of-cyan-bright: #c9fbff;
          --of-violet: #a77bff;
          --of-white: #f7fbff;
          font-family: 'Space Grotesk', Inter, sans-serif;
          letter-spacing: -0.005em;
        }

        .of-cinematic-notes h1,
        .of-cinematic-notes h2,
        .of-cinematic-notes h3,
        .of-cinematic-notes h4 {
          font-family: 'Space Grotesk', Inter, sans-serif;
          font-weight: 700 !important;
          color: var(--of-white) !important;
          text-shadow: 0 0 18px rgba(105,237,255,.08);
        }

        .of-cinematic-notes h1 {
          font-size: clamp(2.6rem, 5.2vw, 4.8rem) !important;
          line-height: .94 !important;
          letter-spacing: -.055em !important;
        }

        .of-cinematic-notes h2 {
          font-size: clamp(1.55rem, 2.3vw, 2.15rem) !important;
          letter-spacing: -.035em !important;
        }

        .of-cinematic-notes h3 {
          font-size: 1rem !important;
          letter-spacing: -.015em !important;
        }

        .of-cinematic-notes p {
          color: rgba(238,245,255,.68) !important;
        }

        .of-cinematic-notes strong {
          color: #f8fdff !important;
          font-weight: 700 !important;
          text-shadow: 0 0 10px rgba(105,237,255,.12);
        }

        .of-cinematic-notes button,
        .of-cinematic-notes a {
          font-family: 'Space Grotesk', Inter, sans-serif;
        }

        .of-cinematic-notes .font-mono,
        .of-cinematic-notes pre,
        .of-cinematic-notes code {
          font-family: 'JetBrains Mono', monospace !important;
        }

        .of-cinematic-notes .of-display {
          font-family: 'Orbitron', sans-serif !important;
          letter-spacing: .08em;
        }

        .of-neon-card {
          position: relative;
          isolation: isolate;
          border-color: rgba(255,255,255,.095) !important;
          box-shadow:
            inset 0 0 28px rgba(255,255,255,.012),
            0 0 0 1px rgba(0,0,0,.65),
            0 0 24px rgba(71,218,255,.018);
          transition:
            border-color .35s ease,
            box-shadow .35s ease,
            transform .35s ease;
        }

        .of-neon-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
          border: 1px solid rgba(101,236,255,.20);
          clip-path: polygon(
            0 13px, 13px 0, calc(100% - 13px) 0, 100% 13px,
            100% calc(100% - 13px), calc(100% - 13px) 100%,
            13px 100%, 0 calc(100% - 13px)
          );
          box-shadow:
            inset 0 0 15px rgba(69,224,255,.035),
            0 0 8px rgba(69,224,255,.035);
          transition: all .35s ease;
        }

        .of-neon-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: -35%;
          width: 35%;
          height: 1px;
          z-index: 21;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(220,253,255,.95), rgba(105,237,255,.55), transparent);
          filter: blur(.35px);
          opacity: 0;
        }

        .of-neon-card:hover {
          border-color: rgba(105,237,255,.26) !important;
          box-shadow:
            inset 0 0 32px rgba(69,224,255,.025),
            0 0 15px rgba(69,224,255,.045),
            0 0 38px rgba(130,86,255,.025);
          transform: translateY(-2px);
        }

        .of-neon-card:hover::before {
          border-color: rgba(105,237,255,.48);
          box-shadow:
            inset 0 0 18px rgba(69,224,255,.05),
            0 0 11px rgba(69,224,255,.10),
            0 0 25px rgba(105,86,255,.035);
        }

        .of-neon-card:hover::after {
          animation: ofCardScan 1.25s ease-out forwards;
        }

        @keyframes ofCardScan {
          0% { left: -35%; opacity: 0; }
          12% { opacity: .95; }
          100% { left: 105%; opacity: 0; }
        }

        .of-glow-button {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          font-weight: 700 !important;
          color: #f6fbff !important;
          letter-spacing: .005em;
          box-shadow: inset 0 0 18px rgba(90,230,255,.025);
        }

        .of-glow-button::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border: 1px solid rgba(105,237,255,.24);
          clip-path: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));
          transition: all .3s ease;
        }

        .of-glow-button::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: -25%;
          width: 18%;
          background: linear-gradient(90deg, transparent, rgba(210,253,255,.42), transparent);
          transform: skewX(-18deg);
          opacity: 0;
          pointer-events: none;
        }

        .of-glow-button:hover {
          border-color: rgba(105,237,255,.48) !important;
          box-shadow:
            inset 0 0 20px rgba(69,224,255,.045),
            0 0 12px rgba(69,224,255,.12),
            0 0 30px rgba(105,86,255,.045);
        }

        .of-glow-button:hover::before {
          border-color: rgba(144,246,255,.78);
          box-shadow: 0 0 12px rgba(105,237,255,.12);
        }

        .of-glow-button:hover::after {
          animation: ofButtonSweep .9s ease-out forwards;
        }

        @keyframes ofButtonSweep {
          0% { left: -25%; opacity: 0; }
          20% { opacity: 1; }
          100% { left: 115%; opacity: 0; }
        }

        .of-nav-frame {
          isolation: isolate;
        }

        .of-nav-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid transparent;
          clip-path: polygon(0 7px, 7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px));
          pointer-events: none;
          opacity: 0;
          transition: .3s ease;
        }

        .of-nav-frame:hover::before,
        .of-nav-frame:focus-visible::before {
          opacity: 1;
          border-color: rgba(105,237,255,.48);
          box-shadow: 0 0 13px rgba(105,237,255,.09);
        }

        .of-note-section {
          position: relative;
        }

        .of-note-section::before {
          content: "";
          position: absolute;
          left: -12px;
          top: 18%;
          bottom: 18%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(105,237,255,.28), transparent);
          box-shadow: 0 0 9px rgba(105,237,255,.12);
          opacity: .55;
        }

        .of-cinematic-notes .bg-gradient-to-r.from-white {
          filter: drop-shadow(0 0 12px rgba(105,237,255,.12));
        }

        .of-cinematic-notes .text-cyan-100,
        .of-cinematic-notes .text-cyan-50 {
          text-shadow: 0 0 9px rgba(105,237,255,.25);
        }

        .of-cinematic-notes .text-violet-100 {
          text-shadow: 0 0 9px rgba(167,123,255,.24);
        }

        .of-cinematic-notes ::selection {
          background: rgba(105,237,255,.22);
          color: white;
        }

            `}</style>

      <div className="relative z-10">
        {/* Cinematic command header */}
        <section className="relative overflow-hidden border-b border-white/[0.07]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/35 to-transparent" />
          <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-100/15 to-transparent" />
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-violet-200/10 to-transparent" />
          <div className="absolute right-[12%] top-[-160px] h-[360px] w-[360px] rounded-full border border-cyan-200/[0.035]" />
          <div className="absolute right-[15%] top-[-130px] h-[300px] w-[300px] rounded-full border border-white/[0.025]" />

          <div className="mx-auto max-w-[1550px] px-5 py-8 sm:px-7 lg:px-10 lg:py-11">
            <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 border border-white/[0.09] bg-white/[0.025] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                    <BookIcon />
                    DP KNOWLEDGE SYSTEM
                  </span>
                  <span className="inline-flex items-center gap-2 border border-cyan-200/10 bg-cyan-200/[0.025] px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] text-cyan-100/55">
                    <Radio size={10} />
                    {sections.length} CONCEPTS · 3D
                  </span>
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[0.98]"
                >
                  Understand the logic.
                  <br />
                  <span className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                    Master Dynamic Programming.
                  </span>
                </motion.h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                  A practical guide to states, transitions, overlapping
                  subproblems, optimal substructure, and the reasoning that
                  powers the OptiFlow optimization engine.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/dp-visualizer")}
                    className="of-glow-button group inline-flex h-11 items-center gap-2 border border-cyan-100/20 bg-white/[0.06] px-5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(90,240,255,.06)] transition hover:border-cyan-100/45 hover:bg-white/[0.09]"
                  >
                    <Eye size={15} className="text-cyan-100" />
                    Open Visualizer
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/dp-playground")}
                    className="of-glow-button inline-flex h-11 items-center gap-2 border border-white/[0.09] bg-black/60 px-5 text-sm font-medium text-white/55 transition hover:border-white/20 hover:text-white"
                  >
                    <Code2 size={15} />
                    Try Playground
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrbitMode((v) => !v)}
                    className={`of-glow-button inline-flex h-11 items-center gap-2 border px-4 text-sm transition ${
                      orbitMode
                        ? "border-violet-200/30 bg-violet-200/[0.06] text-violet-100"
                        : "border-white/[0.09] bg-black/60 text-white/60 hover:text-white"
                    }`}
                  >
                    <Orbit size={15} />
                    {orbitMode ? "Auto-tour on" : "Auto-tour off"}
                  </button>
                </div>
              </div>

              <div className="relative w-full max-w-[460px]">
                <NeonFrame active radius={20} className="of-surface relative h-[300px] overflow-hidden" style={{ borderRadius: 20 }}>
                  <Suspense fallback={null}>
                    <DPConceptScene concept={heroConcept} className="absolute inset-0" distance={7.4} label={heroCaption} />
                  </Suspense>
                  <div className="pointer-events-none absolute inset-x-4 top-3 flex items-center justify-between font-mono text-[11px] tracking-[0.18em] text-white/60">
                    <span>DP STATE CONSTELLATION</span>
                    <span className="text-cyan-100/80">{heroConcept.toUpperCase()}</span>
                  </div>
                  <p className="pointer-events-none absolute inset-x-4 bottom-3 text-[13px] leading-5 !text-white/75">{heroCaption}</p>
                </NeonFrame>
              </div>
            </div>

            <div className="mt-9 grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
              <Metric icon={<Layers3 size={14} />} label="FOUNDATION" value="Core Concepts" />
              <Metric icon={<GitBranch size={14} />} label="FOCUS" value="States + Transitions" />
              <Metric icon={<Target size={14} />} label="APPLICATION" value="Optimization" />
            </div>
          </div>
        </section>

        {/* Main */}
        <div className="mx-auto grid max-w-[1550px] grid-cols-1 gap-7 px-5 py-8 sm:px-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-10">
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <div className="mb-3 flex items-center justify-between px-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                  Knowledge Map
                </p>
                <ScanLine size={11} className="text-cyan-100/30" />
              </div>

              <nav className="space-y-1">
                {sections.map((section, index) => {
                  const active = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`of-nav-frame group relative flex w-full items-center gap-2 border px-3 py-2.5 text-left text-[12px] transition ${
                        active
                          ? "border-cyan-100/15 bg-white/[0.045] text-cyan-100"
                          : "border-transparent text-white/62 hover:border-white/[0.06] hover:bg-white/[0.025] hover:text-white/75"
                      }`}
                    >
                      {active && (
                        <span className="absolute bottom-1 left-0 top-1 w-px bg-cyan-100 shadow-[0_0_9px_rgba(110,240,255,.8)]" />
                      )}
                      <span className="w-5 font-mono text-[11px] text-white/55">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <ChevronRight
                        size={11}
                        className={active ? "text-cyan-100" : "text-white/55 group-hover:text-white/45"}
                      />
                      <span className="truncate">{section.label}</span>
                    </button>
                  );
                })}
              </nav>

              <NeonFrame active radius={16} className="of-surface relative mt-6 h-[210px] overflow-hidden" style={{ borderRadius: 16 }}>
                <Suspense fallback={null}>
                  <DPConceptScene concept={sectionConcept} className="absolute inset-0" distance={10.5} label={CONCEPT_CAPTION[sectionConcept]} />
                </Suspense>
                <div className="pointer-events-none absolute inset-x-3 top-2.5 font-mono text-[10.5px] tracking-[0.18em] text-cyan-100/80">
                  CONCEPT VIEW · {sectionConcept.toUpperCase()}
                </div>
              </NeonFrame>
              <p className="mt-2 px-1 text-[12.5px] leading-5 !text-white/60">{CONCEPT_CAPTION[sectionConcept]}</p>

              <div className="relative mt-6 overflow-hidden border border-white/[0.07] bg-black/80 p-4">
                <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-cyan-100/40 to-transparent" />
                <div className="flex items-center gap-2">
                  <Compass size={13} className="text-cyan-100/65" />
                  <span className="text-[11px] font-semibold tracking-[0.16em] text-white/55">
                    LEARNING PATH
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-white/62">
                  Build the mental model first. Then observe the same logic
                  operating inside OptiFlow.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/dp-academy")}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] text-cyan-100/60 hover:text-cyan-100"
                >
                  Open Academy <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 max-w-5xl">
            <NoteSection id="introduction" eyebrow="01 · FOUNDATION" title="Introduction">
              <p>
                Dynamic Programming, commonly called <strong>DP</strong>, is a
                problem-solving technique used to solve complex problems by
                breaking them into smaller subproblems, solving those
                subproblems once, and reusing their results.
              </p>
              <p>
                The key idea is simple:
                <span className="text-white/75"> don't repeatedly solve the same problem.</span>
              </p>
              <QuoteBox>
                Solve smaller problems once. Store their answers. Build the
                final solution from those stored results.
              </QuoteBox>
            </NoteSection>

            <NoteSection id="what-is-dp" eyebrow="02 · CONCEPT" title="What is Dynamic Programming?">
              <p>
                Dynamic Programming is an algorithmic technique for problems
                where a large problem can be represented as a collection of
                smaller subproblems whose solutions can be reused.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <ConceptCard icon={<Layers3 size={18} />} title="Break Down" description="Decompose a large problem into smaller, manageable subproblems." />
                <ConceptCard icon={<Zap size={18} />} title="Reuse" description="Store previously calculated results instead of recalculating them." />
                <ConceptCard icon={<Target size={18} />} title="Optimize" description="Combine optimal subproblem solutions to construct an optimal result." />
                <ConceptCard icon={<Workflow size={18} />} title="Reconstruct" description="Track decisions or transitions to recover the actual solution." />
              </div>
              <CodeBlock title="The basic DP mindset" code={`solve(problem):
    if problem is already known:
        return stored_result

    solve smaller subproblems
    combine their results
    store the result

    return result`} />
            </NoteSection>

            <NoteSection id="characteristics" eyebrow="03 · CHARACTERISTICS" title="Core Characteristics">
              <p>
                A problem is a strong candidate for Dynamic Programming when
                its structure provides the properties needed to reuse
                subproblem results and construct an optimal solution.
              </p>
              <div className="mt-7 space-y-3">
                <FeatureRow number="01" title="Subproblems" description="The original problem can be divided into smaller related problems." />
                <FeatureRow number="02" title="Overlapping Subproblems" description="The same smaller problems appear repeatedly during computation." />
                <FeatureRow number="03" title="Optimal Substructure" description="An optimal solution can be constructed from optimal solutions to relevant subproblems." />
                <FeatureRow number="04" title="State Representation" description="A compact state can capture the information required to make future decisions." />
              </div>
            </NoteSection>

            <NoteSection id="optimal-substructure" eyebrow="04 · STRUCTURE" title="Optimal Substructure">
              <p>
                Optimal substructure means that an optimal solution to the
                complete problem can be derived from optimal solutions to its
                smaller subproblems.
              </p>
              <DecisionConstellation />
              <p className="mt-6">
                This idea becomes especially important in OptiFlow, where
                pipeline decisions are evaluated against execution time, cost,
                constraints, and the optimization objective.
              </p>
            </NoteSection>

            <NoteSection id="overlapping" eyebrow="05 · REUSE" title="Overlapping Subproblems">
              <p>
                In many recursive solutions, the same subproblem gets
                calculated multiple times. Dynamic Programming avoids that
                repeated work by storing the result.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <TreePanel title="WITHOUT DP" tone="red" nodes={["F(n)", "F(n - 1)", "F(n - 2)", "F(n - 2)  ← repeated"]} />
                <TreePanel title="WITH DP" tone="cyan" nodes={["F(n)", "F(n - 1)", "F(n - 2)  ✓ stored", "Reuse stored result"]} />
              </div>
            </NoteSection>

            <NoteSection id="approaches" eyebrow="06 · IMPLEMENTATION" title="DP Approaches">
              <p>
                There are two classical ways to implement Dynamic Programming:
                <strong> Top-Down</strong> and <strong> Bottom-Up</strong>.
              </p>
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                <ApproachCard title="Top-Down" subtitle="Memoization" icon={<GitBranch size={19} />} steps={["Start from the original problem.", "Recursively solve required subproblems.", "Store each computed result.", "Reuse stored results when encountered again."]} />
                <ApproachCard title="Bottom-Up" subtitle="Tabulation" icon={<Layers3 size={19} />} steps={["Start with the smallest states.", "Build the DP table iteratively.", "Use previous states to compute new states.", "Reach the final state without recursion."]} />
              </div>
              <CodeBlock title="Memoization vs Tabulation" code={`Top-Down:
answer = solve(state)
          ↓
      memo[state]

Bottom-Up:
dp[base] → dp[next] → dp[next] → ... → dp[target]`} />
            </NoteSection>

            <NoteSection id="workflow" eyebrow="07 · METHOD" title="DP Problem-Solving Workflow">
              <p>
                The hardest part of Dynamic Programming is usually not writing
                the code. It is identifying the correct state and recurrence.
              </p>
              <div className="mt-7 space-y-3">
                <WorkflowStep number="01" title="Define the State" description="Identify the minimum information required to represent a subproblem." />
                <WorkflowStep number="02" title="Define the Decision" description="Determine what choices can be made from the current state." />
                <WorkflowStep number="03" title="Write the Recurrence" description="Express the value of the current state using smaller states." />
                <WorkflowStep number="04" title="Define Base Cases" description="Specify the smallest states whose answers are directly known." />
                <WorkflowStep number="05" title="Choose the Evaluation Strategy" description="Use memoization or tabulation depending on the problem structure." />
                <WorkflowStep number="06" title="Reconstruct the Solution" description="Track decisions when the actual sequence of choices is required." />
              </div>
            </NoteSection>

            <NoteSection id="optiflow" eyebrow="08 · OPTIFLOW" title="How DP fits inside OptiFlow">
              <p>
                OptiFlow applies Dynamic Programming as an actual optimization
                engine rather than using DP only as a visual concept.
              </p>
              <OptiFlowConstellation />
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <InsightCard icon={<CircleDot size={17} />} title="State" text="Represents the relevant pipeline decision context." />
                <InsightCard icon={<GitBranch size={17} />} title="Transition" text="Represents a valid decision from one state to another." />
                <InsightCard icon={<CheckCircle2 size={17} />} title="Optimal Result" text="Selects the best valid strategy according to the objective." />
              </div>
              <div className="mt-6 flex flex-col gap-4 border border-white/[0.07] bg-white/[0.025] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Ready to see Dynamic Programming in action?</p>
                  <p className="mt-1 text-xs text-white/62">
                    Explore states, transitions and optimization visually inside the OptiFlow tools.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dp-visualizer")}
                  className="of-glow-button inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-cyan-100/15 bg-white/[0.05] px-4 text-xs font-semibold text-white transition hover:border-cyan-100/35 hover:bg-white/[0.08]"
                >
                  Launch Visualizer <ArrowRight size={14} />
                </button>
              </div>
            </NoteSection>
          </main>
        </div>
      </div>
    </div>
  );
}

function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="of-neon-card bg-black px-4 py-4">
      <div className="flex items-center gap-2 text-white/48">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-white/65">{value}</p>
    </div>
  );
}

function NoteSection({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="of-note-section scroll-mt-20 border-b border-white/[0.07] py-11 first:pt-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/45">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">{title}</h2>
      <div className="mt-5 space-y-4 text-sm leading-7 text-white/68">{children}</div>
    </section>
  );
}

function QuoteBox({ children }: { children: ReactNode }) {
  return (
    <div className="of-neon-card relative my-7 overflow-hidden border border-cyan-100/10 bg-white/[0.025] px-5 py-5 text-sm italic text-white/75">
      <span className="absolute bottom-0 left-0 top-0 w-px bg-cyan-100/60 shadow-[0_0_10px_rgba(100,240,255,.45)]" />
      <span className="absolute right-5 top-3 text-4xl leading-none text-white/[0.05]">“</span>
      {children}
    </div>
  );
}

function ConceptCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="of-neon-card group relative overflow-hidden border border-white/[0.07] bg-white/[0.018] p-5 transition hover:border-cyan-100/15">
      <div className="absolute left-0 top-0 h-px w-0 bg-cyan-100/60 transition-all duration-500 group-hover:w-full" />
      <div className="flex h-9 w-9 items-center justify-center border border-cyan-100/10 bg-cyan-100/[0.04] text-cyan-100/70">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-white/85">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-white/62">{description}</p>
    </motion.div>
  );
}

function FeatureRow({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="of-neon-card group relative flex gap-4 overflow-hidden border border-white/[0.06] bg-white/[0.015] p-4 transition hover:border-white/[0.12]">
      <div className="absolute bottom-0 left-0 top-0 w-px bg-white/[0.06] group-hover:bg-cyan-100/40" />
      <span className="font-mono text-[12px] text-cyan-100/40">{number}</span>
      <div>
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/62">{description}</p>
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="of-neon-card mt-7 overflow-hidden border border-white/[0.07] bg-black">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Code2 size={13} className="text-cyan-100/65" />
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/62">{title}</span>
        </div>
        <span className="font-mono text-[10px] text-white/55">DP.LOGIC</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-white/60"><code>{code}</code></pre>
    </div>
  );
}

function DecisionConstellation() {
  const points = [
    { label: "STATE", x: "8%", y: "55%" },
    { label: "DECISION", x: "31%", y: "25%" },
    { label: "NEXT", x: "53%", y: "66%" },
    { label: "OPTIMUM", x: "79%", y: "34%" },
  ];

  return (
    <div className="of-neon-card relative mt-7 h-[230px] overflow-hidden border border-white/[0.07] bg-black">
      <div className="absolute inset-0 opacity-40">
        <svg className="h-full w-full">
          <line x1="9%" y1="55%" x2="31%" y2="25%" stroke="rgba(130,240,255,.25)" />
          <line x1="31%" y1="25%" x2="53%" y2="66%" stroke="rgba(130,240,255,.2)" />
          <line x1="53%" y1="66%" x2="79%" y2="34%" stroke="rgba(180,150,255,.24)" />
        </svg>
      </div>
      <div className="absolute left-4 top-4 font-mono text-[10px] tracking-[0.18em] text-white/55">OPTIMAL SUBSTRUCTURE / DECISION PATH</div>
      {points.map((point, index) => (
        <div key={point.label} className="absolute" style={{ left: point.x, top: point.y }}>
          <div className={`-translate-x-1/2 -translate-y-1/2 border px-3 py-2 text-[11px] font-mono tracking-[0.12em] ${
            index === 3
              ? "border-cyan-100/25 bg-cyan-100/[0.05] text-cyan-100 shadow-[0_0_24px_rgba(100,240,255,.12)]"
              : "border-white/[0.1] bg-white/[0.025] text-white/45"
          }`}>
            <span className="mr-2 text-white/60">S{index}</span>{point.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function TreePanel({ title, tone, nodes }: { title: string; tone: "red" | "cyan"; nodes: string[] }) {
  const positive = tone === "cyan";
  return (
    <div className={`of-neon-card border p-5 ${positive ? "border-cyan-100/10 bg-cyan-100/[0.018]" : "border-red-200/10 bg-red-200/[0.012]"}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${positive ? "text-cyan-100/55" : "text-red-200/45"}`}>{title}</p>
      <div className="mt-5 space-y-2">
        {nodes.map((node, index) => (
          <div key={node} className={`border border-white/[0.05] bg-white/[0.018] px-3 py-2 font-mono text-[12px] ${index > 0 ? "ml-4" : ""} ${node.includes("repeated") ? "text-red-200/50" : node.includes("stored") ? "text-cyan-100/65" : "text-white/55"}`}>
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApproachCard({ title, subtitle, icon, steps }: { title: string; subtitle: string; icon: ReactNode; steps: string[] }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="of-neon-card border border-white/[0.07] bg-white/[0.018] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-cyan-100/10 bg-cyan-100/[0.04] text-cyan-100/65">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-white/85">{title}</h3>
          <p className="text-[11px] text-white/48">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div key={step} className="flex gap-3">
            <span className="font-mono text-[11px] text-cyan-100/35">0{index + 1}</span>
            <p className="text-xs leading-5 text-white/62">{step}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WorkflowStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="of-neon-card group relative flex gap-4 border border-white/[0.06] bg-white/[0.015] p-5 transition hover:border-cyan-100/12">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/[0.08] bg-white/[0.02] font-mono text-[12px] text-cyan-100/55">{number}</div>
      <div>
        <h3 className="text-sm font-semibold text-white/82">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-white/62">{description}</p>
      </div>
    </div>
  );
}

function OptiFlowConstellation() {
  const stages = [
    ["PIPELINE", "INPUT"],
    ["STATE", "MODEL"],
    ["DP ENGINE", "OPTIMIZE"],
    ["CONSTRAINTS", "VALIDATE"],
    ["STRATEGY", "OUTPUT"],
  ];

  return (
    <div className="of-neon-card relative mt-7 overflow-hidden border border-cyan-100/10 bg-black p-6">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-cyan-100/50 via-violet-200/20 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-cyan-100/20 to-transparent" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-cyan-100/50">OPTIFLOW DECISION CONSTELLATION</p>
          <p className="mt-1 text-[12px] text-white/48">From pipeline definition to reconstructed strategy</p>
        </div>
        <BrainCircuit size={18} className="text-cyan-100/50" />
      </div>

      <div className="relative">
        <div className="absolute left-[5%] right-[5%] top-8 hidden h-px bg-gradient-to-r from-white/[0.05] via-cyan-100/25 to-violet-200/15 md:block" />
        <div className="grid gap-3 md:grid-cols-5">
          {stages.map(([label, description], index) => (
            <div key={label} className="relative border border-white/[0.08] bg-white/[0.018] p-4 text-center">
              <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border ${
                index === 2 || index === 4
                  ? "border-cyan-100/30 bg-cyan-100/[0.05] text-cyan-100 shadow-[0_0_22px_rgba(100,240,255,.1)]"
                  : "border-white/[0.1] bg-black text-white/45"
              }`}>
                {index === 0 ? <Workflow size={16} /> : index === 1 ? <CircleDot size={16} /> : index === 2 ? <BrainCircuit size={16} /> : index === 3 ? <CheckCircle2 size={16} /> : <Target size={16} />}
              </div>
              <p className="mt-3 text-[12px] font-semibold text-white/70">{label}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/60">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="of-neon-card border border-white/[0.07] bg-white/[0.018] p-4">
      <div className="text-cyan-100/55">{icon}</div>
      <p className="mt-3 text-xs font-semibold text-white/75">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-white/62">{text}</p>
    </motion.div>
  );
}
