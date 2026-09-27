import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  CircleDot,
  GitBranch,
  Layers3,
  Network,
  Orbit,
  Play,
  RotateCcw,
  SkipForward,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import PublicNavbar from "../../components/layout/PublicNavbar";
import Ambient from "../../cinematic/Ambient";
import {
  CinematicButton,
  DemoBadge,
  Glass3DCard,
  HolographicLabel,
  NeonFrame,
  SectionReveal,
  useQuality,
} from "../../cinematic";
import { EXAMPLE_CONSTRAINTS, EXAMPLE_STAGES, solveExample } from "../../cinematic/exampleProblem";
import type { DPConcept } from "../../cinematic/scenes/DPConceptScene";

const HeroCoreScene = lazy(() => import("../../components/landing/scenes/HeroCoreScene"));
const EngineScene = lazy(() => import("../../components/landing/scenes/EngineScene"));
const DecisionCollapseScene = lazy(() => import("../../components/landing/scenes/DecisionCollapseScene"));
const DPConceptScene = lazy(() => import("../../cinematic/scenes/DPConceptScene"));

/* =========================================================
   CONTENT
========================================================= */

const ENGINE_MODULES = [
  {
    id: "pipeline",
    title: "PIPELINE",
    subtitle: "stages · strategies",
    icon: Workflow,
    text: "Model a software delivery pipeline as ordered stages. Every stage offers alternative execution strategies, each with its own time and cost.",
    states: "S0 — the empty pipeline, before any decision.",
  },
  {
    id: "state-space",
    title: "STATE SPACE",
    subtitle: "DP[i][time][cost]",
    icon: GitBranch,
    text: "Each state records how many stages are decided and the accumulated time and cost. Choosing a strategy is a transition to the next state.",
    states: "One state per reachable (stage, time, cost) combination.",
  },
  {
    id: "optimize",
    title: "OPTIMIZE",
    subtitle: "prune · compare",
    icon: Target,
    text: "Transitions that break the deadline or budget are pruned immediately. Equal states keep only the better objective score — the DP dominance rule.",
    states: "Infeasible states are discarded before they can spread.",
  },
  {
    id: "reconstruct",
    title: "RECONSTRUCT",
    subtitle: "follow predecessors",
    icon: Layers3,
    text: "The best final state stores its predecessor. Walking those links backward recovers the exact strategy chosen for every stage.",
    states: "S_n → S_n-1 → … → S0, in reverse.",
  },
  {
    id: "execute",
    title: "EXECUTE",
    subtitle: "plan · simulate",
    icon: Zap,
    text: "The reconstructed configuration becomes an execution plan you can simulate stage by stage and save alongside your pipeline.",
    states: "States activate in sequence as the plan runs.",
  },
];

const PROBLEMS = [
  {
    icon: GitBranch,
    title: "Too many possible paths",
    text: "Every stage multiplies the number of configurations. Five small stages already produce over a hundred.",
  },
  {
    icon: CircleDot,
    title: "Time gets wasted",
    text: "Evaluating every configuration by hand — or by brute force — grows exponentially with the pipeline.",
  },
  {
    icon: Network,
    title: "Resources compete",
    text: "Deadlines and budgets make many configurations infeasible. Speed costs money; savings cost time.",
  },
];

const CONCEPTS: { id: DPConcept; title: string; text: string }[] = [
  { id: "state", title: "STATE", text: "A state captures everything the future needs: which stage we are at and what we have spent so far." },
  { id: "transition", title: "TRANSITION", text: "Choosing a strategy moves energy from one state to the next — adding its time and its cost." },
  { id: "constraint", title: "CONSTRAINT", text: "Deadline and budget form a boundary field. States that cross it cannot be part of any valid answer." },
  { id: "pruning", title: "PRUNING", text: "Invalid states dissolve instead of branching further, so the search never explores them." },
  { id: "optimality", title: "OPTIMALITY", text: "Among surviving final states, the objective picks one. Its path is optimal because every prefix is optimal too." },
  { id: "reconstruction", title: "RECONSTRUCTION", text: "Energy flows backward along stored predecessors, recovering the decision made at every stage." },
];

/* =========================================================
   HELPERS
========================================================= */

function SceneFallback({ className = "" }: { className?: string }) {
  return <div className={className} aria-hidden="true" />;
}

function useIntroState(reducedMotion: boolean) {
  const [skipped, setSkipped] = useState(() => {
    try {
      return reducedMotion || sessionStorage.getItem("optiflow_intro_seen") === "1";
    } catch {
      return reducedMotion;
    }
  });
  const [started, setStarted] = useState(skipped);
  const [stage, setStage] = useState(skipped ? 5 : 0);

  useEffect(() => {
    if (reducedMotion) {
      setSkipped(true);
      setStage(5);
    }
  }, [reducedMotion]);

  // Safety: if the 3D scene never reports in (no WebGL), start anyway.
  useEffect(() => {
    if (started) return;
    const timer = window.setTimeout(() => setStarted(true), 1800);
    return () => window.clearTimeout(timer);
  }, [started]);

  useEffect(() => {
    if (!started || skipped) return;
    const marks = [3.6, 4.3, 4.8, 5.3, 5.6];
    const timers = marks.map((seconds, index) => window.setTimeout(() => setStage(index + 1), seconds * 1000));
    return () => timers.forEach(window.clearTimeout);
  }, [started, skipped]);

  useEffect(() => {
    if (stage >= 5) {
      try {
        sessionStorage.setItem("optiflow_intro_seen", "1");
      } catch {
        /* ignore */
      }
    }
  }, [stage]);

  return {
    skipped,
    stage,
    onSceneStart: () => setStarted(true),
    skip: () => {
      setSkipped(true);
      setStage(5);
    },
    replay: () => {
      try {
        sessionStorage.removeItem("optiflow_intro_seen");
      } catch {
        /* ignore */
      }
      window.scrollTo({ top: 0 });
      window.location.reload();
    },
  };
}

function Reveal({ show, delay = 0, children, className = "" }: { show: boolean; delay?: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={show ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 26, scale: 0.985 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero() {
  const navigate = useNavigate();
  const quality = useQuality();
  const intro = useIntroState(quality.reducedMotion);
  const example = useMemo(() => solveExample(), []);
  const introPlaying = !intro.skipped && intro.stage < 5;

  return (
    <section id="home" className="relative min-h-[100svh] overflow-hidden" aria-labelledby="hero-title">
      <Suspense fallback={<SceneFallback className="absolute inset-0" />}>
        <HeroCoreScene skipped={intro.skipped} onStart={intro.onSceneStart} className="absolute inset-0" />
      </Suspense>

      {/* Cinematic letterbox during the intro */}
      <AnimatePresence>
        {introPlaying && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <div className="absolute inset-x-0 top-0 h-[9vh] bg-black" />
            <div className="absolute inset-x-0 bottom-0 h-[9vh] bg-black" />
            <div className="absolute inset-x-0 bottom-[12vh] flex justify-center">
              <motion.p
                className="of-intro-caption text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 3.6, times: [0, 0.15, 0.8, 1], delay: 0.5 }}
              >
                INITIALIZING STATE SPACE · S0 → S1 → S2 → S3 → S4 → S5
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {introPlaying && (
        <button
          type="button"
          onClick={intro.skip}
          className="absolute bottom-[calc(9vh+16px)] right-5 z-30 inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 font-mono text-[12px] tracking-[0.2em] text-white/75 backdrop-blur transition hover:border-cyan-300/50 hover:text-white"
        >
          <SkipForward size={14} />
          SKIP INTRO
        </button>
      )}

      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[100svh] max-w-[1320px] flex-col justify-end px-5 pb-24 pt-32 sm:px-8 md:justify-center md:pb-16 lg:px-12">
        <div className="pointer-events-auto max-w-[680px]">
          <Reveal show={intro.stage >= 1}>
            <HolographicLabel>Dynamic Programming System</HolographicLabel>
          </Reveal>

          <Reveal show={intro.stage >= 1} delay={0.1}>
            <h1 id="hero-title" className="of-hero-title mt-6" aria-label="OptiFlow">
              <span className="of-hero-word" data-text="OPTI">OPTI</span>
              <span className="of-hero-word of-hero-word--flow" data-text="FLOW">FLOW</span>
            </h1>
          </Reveal>

          <Reveal show={intro.stage >= 2} className="mt-16 sm:mt-20">
            <p className="font-heading text-[15px] font-bold uppercase leading-[1.7] tracking-[0.2em] text-white/85 sm:text-[17px]">
              Dynamic Programming–Driven
              <br />
              Software Pipeline
              <br />
              <span className="text-cyan-200">Optimization Engine</span>
            </p>
          </Reveal>

          <Reveal show={intro.stage >= 3} className="mt-6">
            <p className="of-tagline font-display text-[18px] font-bold tracking-[0.24em] text-white sm:text-[22px]">
              {["OPTIMIZE.", "EXECUTE.", "SHIP SMARTER."].map((word, index) => (
                <motion.span
                  key={word}
                  className={`mr-4 ${index === 2 ? "of-gradient-text" : ""}`}
                  initial={false}
                  animate={intro.stage >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                  transition={{ delay: 0.12 * index, duration: 0.7 }}
                >
                  {word}
                </motion.span>
              ))}
            </p>
          </Reveal>

          <Reveal show={intro.stage >= 4} className="mt-9 flex flex-wrap items-center gap-3">
            <CinematicButton
              size="lg"
              kicker="INITIALIZE"
              icon={<Orbit size={20} />}
              onClick={() => navigate("/login")}
            >
              ENTER OPTIFLOW
            </CinematicButton>
            <CinematicButton
              variant="ghost"
              size="md"
              arrow={false}
              icon={<ChevronDown size={16} />}
              onClick={() => document.getElementById("engine")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore the engine
            </CinematicButton>
          </Reveal>

          <Reveal show={intro.stage >= 5} className="mt-10 hidden sm:block">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[12px] tracking-[0.18em] text-white/55">
              <span className="text-cyan-200/90">DP[i][time][cost]</span>
              <span aria-hidden="true">·</span>
              <span>STATE TRANSITIONS</span>
              <span aria-hidden="true">·</span>
              <span>CONSTRAINT PRUNING</span>
              <span aria-hidden="true">·</span>
              <span>OPTIMAL RECONSTRUCTION</span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Core annotation */}
      <Reveal
        show={intro.stage >= 5}
        className="pointer-events-none absolute right-6 top-28 z-10 hidden text-right md:block lg:right-12"
      >
        <DemoBadge>Example · Studio default pipeline</DemoBadge>
        <p className="mt-3 font-mono text-[12px] leading-6 tracking-[0.14em] text-white/60">
          HOVER A STATE TO INSPECT IT
          <br />
          OPTIMAL: <span className="text-white">{example.optimal.time} MIN · ${(example.optimal.costCents / 100).toFixed(2)}</span>
        </p>
      </Reveal>

      <Reveal show={intro.stage >= 5} className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex justify-center">
        <div className="flex flex-col items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-white/50">
          SCROLL TO ENTER THE ENGINE
          <motion.span animate={quality.reducedMotion ? undefined : { y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
            <ChevronDown size={16} />
          </motion.span>
        </div>
      </Reveal>

      {intro.skipped && intro.stage >= 5 && (
        <button
          type="button"
          onClick={intro.replay}
          className="absolute bottom-6 right-5 z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-2 font-mono text-[11px] tracking-[0.18em] text-white/55 transition hover:text-white md:inline-flex"
        >
          <RotateCcw size={12} />
          REPLAY INTRO
        </button>
      )}
    </section>
  );
}

/* =========================================================
   ENGINE
========================================================= */

function EngineSection() {
  const [active, setActive] = useState<number | null>(null);
  const [auto, setAuto] = useState(0);
  const [interacting, setInteracting] = useState(false);
  const quality = useQuality();

  useEffect(() => {
    if (interacting || quality.reducedMotion) return;
    const timer = window.setInterval(() => setAuto((value) => (value + 1) % ENGINE_MODULES.length), 3600);
    return () => window.clearInterval(timer);
  }, [interacting, quality.reducedMotion]);

  const shown = active ?? (interacting ? null : auto);
  const info = ENGINE_MODULES[shown ?? 0];
  const Icon = info.icon;

  return (
    <section id="engine" className="relative py-28 sm:py-36" aria-labelledby="engine-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <SectionReveal>
          <HolographicLabel>01 · The Engine</HolographicLabel>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <h2 id="engine-title" className="of-section-title">
              Five modules.
              <br />
              <span className="of-gradient-text">One optimal decision.</span>
            </h2>
            <p className="of-lead max-w-xl">
              OptiFlow turns a pipeline into a state space, searches it with Dynamic Programming, and reconstructs the
              best feasible execution plan. Hover a module to bring it forward.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.1} className="mt-12">
          <NeonFrame
            className="of-surface relative overflow-hidden"
            radius={28}
            style={{ borderRadius: 28 }}
            active={shown !== null}
            onMouseEnter={() => setInteracting(true)}
            onMouseLeave={() => {
              setInteracting(false);
              setActive(null);
            }}
          >
            <div className="of-grid-floor" aria-hidden="true" />
            <Suspense fallback={<SceneFallback className="h-[440px] sm:h-[520px]" />}>
              <EngineScene
                className="h-[440px] w-full sm:h-[520px]"
                modules={ENGINE_MODULES}
                active={shown}
                onActive={(index) => setActive(index)}
              />
            </Suspense>

            <div className="relative z-10 grid gap-4 border-t border-white/[0.08] bg-black/50 p-5 sm:p-6 lg:grid-cols-[1fr_1.2fr]">
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Engine modules">
                {ENGINE_MODULES.map((module, index) => (
                  <button
                    key={module.id}
                    type="button"
                    role="tab"
                    aria-selected={shown === index}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => {
                      setInteracting(true);
                      setActive(index);
                    }}
                    onClick={() => {
                      setInteracting(true);
                      setActive(index);
                    }}
                    data-active={shown === index ? "true" : undefined}
                    className="of-frame of-navitem !h-11 !text-[12px]"
                  >
                    <span className="font-mono text-cyan-200/80">0{index + 1}</span>
                    {module.title}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={info.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-4"
                  aria-live="polite"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(56,232,255,.35)]">
                    <Icon size={19} />
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] font-bold tracking-[0.14em] text-white">{info.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-7 text-white/72">{info.text}</p>
                    <p className="mt-2 font-mono text-[12px] tracking-[0.08em] text-cyan-100/70">{info.states}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </NeonFrame>
        </SectionReveal>
      </div>
    </section>
  );
}

/* =========================================================
   PROBLEM + OPTIMIZATION COLLAPSE
========================================================= */

const PHASES = [
  { title: "Possible configurations", caption: "Every combination of strategies is a candidate path." },
  { title: "Time constraint", caption: `Paths whose total time exceeds ${EXAMPLE_CONSTRAINTS.deadline} min are pruned.` },
  { title: "Cost constraint", caption: `Paths above the $${EXAMPLE_CONSTRAINTS.budget.toFixed(2)} budget are pruned.` },
  { title: "Objective", caption: "Surviving paths are ranked: score = 0.65·time/T + 0.35·cost/B." },
  { title: "Optimal configuration", caption: "One path remains — reconstructed stage by stage." },
];

function ProblemSection() {
  const example = useMemo(() => solveExample(), []);
  const track = useRef<HTMLDivElement>(null);
  const phase = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = track.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      phase.current = progress * 4.9;
      const next = Math.min(4, Math.floor(phase.current));
      setStep((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const jumpTo = (index: number) => {
    const element = track.current;
    if (!element) return;
    const total = element.offsetHeight - window.innerHeight;
    const top = element.getBoundingClientRect().top + window.scrollY + total * ((index + 0.35) / 4.9);
    window.scrollTo({ top, behavior: "smooth" });
  };

  const counts = [example.total, example.afterTime, example.afterCost, example.afterCost, 1];
  const pruned = [0, example.total - example.afterTime, example.afterTime - example.afterCost, 0, example.afterCost - 1];

  return (
    <section id="problem" aria-labelledby="problem-title">
      <div className="mx-auto max-w-[1320px] px-5 pt-16 sm:px-8 lg:px-12">
        <SectionReveal>
          <HolographicLabel>02 · The Optimization Problem</HolographicLabel>
          <h2 id="problem-title" className="of-section-title mt-5 max-w-4xl">
            Complex pipelines create
            <br />
            <span className="of-gradient-text">too many decisions.</span>
          </h2>
        </SectionReveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <SectionReveal key={problem.title} delay={index * 0.08}>
                <Glass3DCard scan={index === 1} innerClassName="p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-6 text-[20px] font-bold text-white">{problem.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-white/68">{problem.text}</p>
                </Glass3DCard>
              </SectionReveal>
            );
          })}
        </div>

        {/* Decision-space equation */}
        <SectionReveal className="mt-16">
          <div className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-3">
            {EXAMPLE_STAGES.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-2 sm:gap-3">
                <NeonFrame className="of-surface px-4 py-3 text-center sm:px-5" radius={14} style={{ borderRadius: 14 }} corners={false}>
                  <div className="font-display text-[13px] font-bold tracking-[0.14em] text-white sm:text-[14px]">{stage.name}</div>
                  <div className="mt-1 font-mono text-[12px] text-cyan-100/75">{stage.strategies.length} strategies</div>
                </NeonFrame>
                {index < EXAMPLE_STAGES.length - 1 && <span className="font-display text-xl text-white/40">×</span>}
              </div>
            ))}
            <div className="flex items-center gap-3">
              <span className="font-display text-xl text-white/40">=</span>
              <NeonFrame active className="of-surface px-5 py-3 text-center" radius={14} style={{ borderRadius: 14 }}>
                <div className="font-heading text-[28px] font-bold tabular-nums text-white">{example.total}</div>
                <div className="font-mono text-[11px] tracking-[0.16em] text-cyan-100/80">CONFIGURATIONS</div>
              </NeonFrame>
            </div>
          </div>
        </SectionReveal>
      </div>

      {/* Scroll-driven collapse */}
      <div ref={track} className="relative mt-10 h-[430vh]">
        <div className="of-sticky-stage">
          <div className="absolute inset-0">
            <Suspense fallback={<SceneFallback className="absolute inset-0" />}>
              <DecisionCollapseScene phase={phase} className="absolute inset-0" />
            </Suspense>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.92)_0%,rgba(0,0,0,.55)_32%,transparent_60%)] max-md:bg-[linear-gradient(180deg,rgba(0,0,0,.95)_0%,rgba(0,0,0,.75)_50%,transparent_72%)]" />

          <div className="relative z-10 mx-auto flex h-full max-w-[1320px] flex-col justify-start px-5 pt-24 sm:px-8 md:justify-center md:pt-0 lg:px-12">
            <div className="max-w-[440px]">
              <div className="flex items-center gap-3">
                <HolographicLabel>Optimization collapse</HolographicLabel>
              </div>
              <DemoBadge className="mt-4">Example · computed live from the Studio default pipeline</DemoBadge>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="mt-6"
                  aria-live="polite"
                >
                  <div className="font-mono text-[12px] tracking-[0.22em] text-cyan-200/85">
                    PHASE 0{step + 1} / 05
                  </div>
                  <h3 className="mt-2 font-heading text-[30px] font-bold leading-tight text-white sm:text-[36px]">
                    {PHASES[step].title}
                  </h3>
                  <p className="mt-2 hidden text-[15px] leading-7 text-white/70 sm:block">{PHASES[step].caption}</p>

                  <div className="mt-6 flex items-end gap-4">
                    <div className="font-heading text-[68px] font-bold leading-none tabular-nums text-white sm:text-[88px]">
                      {counts[step]}
                    </div>
                    <div className="pb-2 font-mono text-[12px] leading-5 tracking-[0.14em] text-white/60">
                      {step === 4 ? "OPTIMAL" : "FEASIBLE"}
                      <br />
                      {step === 4 ? "CONFIGURATION" : "CONFIGURATIONS"}
                    </div>
                  </div>

                  {step > 0 && step < 4 && (
                    <p className="mt-3 font-mono text-[12px] tracking-[0.1em] text-rose-200/80">
                      {pruned[step] > 0
                        ? `− ${pruned[step]} paths pruned in this phase`
                        : step === 2
                          ? "0 additional paths pruned — every time-feasible path is within budget"
                          : `${counts[step]} paths ranked by objective score`}
                    </p>
                  )}

                  {step === 4 && (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <NeonFrame active className="of-surface p-4" radius={16} style={{ borderRadius: 16 }}>
                        <div className="font-mono text-[11px] tracking-[0.18em] text-white/60">TOTAL TIME</div>
                        <div className="mt-1 font-heading text-[30px] font-bold tabular-nums text-white">{example.optimal.time} MIN</div>
                      </NeonFrame>
                      <NeonFrame active tone="violet" className="of-surface p-4" radius={16} style={{ borderRadius: 16 }}>
                        <div className="font-mono text-[11px] tracking-[0.18em] text-white/60">TOTAL COST</div>
                        <div className="mt-1 font-heading text-[30px] font-bold tabular-nums text-white">
                          ${(example.optimal.costCents / 100).toFixed(2)}
                        </div>
                      </NeonFrame>
                      <p className="col-span-2 hidden font-mono text-[12px] leading-6 text-white/65 sm:block">
                        {example.path
                          .slice(1)
                          .map((state) => `${state.stage}: ${state.strategy}`)
                          .join("  →  ")}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="pointer-events-auto mt-8 flex flex-wrap gap-1.5" aria-label="Collapse phases">
                {PHASES.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => jumpTo(index)}
                    aria-label={`Go to phase ${index + 1}: ${item.title}`}
                    className={`h-2 rounded-full transition-all ${
                      index === step ? "w-10 bg-cyan-300 shadow-[0_0_12px_rgba(56,232,255,.8)]" : index < step ? "w-5 bg-white/45" : "w-5 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-5 pb-10 text-center sm:px-8 lg:px-12">
        <SectionReveal>
          <p className="mx-auto max-w-3xl font-heading text-[22px] font-semibold leading-snug text-white/75 sm:text-[28px]">
            The challenge is not generating another execution path.
            <br />
            <span className="text-white">It is finding the optimal feasible one.</span>
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}

/* =========================================================
   HOW DP THINKS
========================================================= */

function DPSection() {
  const [index, setIndex] = useState(0);
  const [pinned, setPinned] = useState(false);
  const quality = useQuality();

  useEffect(() => {
    if (pinned || quality.reducedMotion) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % CONCEPTS.length), 4200);
    return () => window.clearInterval(timer);
  }, [pinned, quality.reducedMotion]);

  const concept = CONCEPTS[index];

  return (
    <section id="dp" className="relative py-28 sm:py-36" aria-labelledby="dp-title">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <SectionReveal>
          <HolographicLabel>03 · How DP thinks</HolographicLabel>
          <h2 id="dp-title" className="of-section-title mt-5 max-w-4xl">
            Watch Dynamic Programming
            <br />
            <span className="of-gradient-text">collapse the decision space.</span>
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.1} className="mt-12 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-2" role="tablist" aria-label="Dynamic programming concepts">
            {CONCEPTS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => {
                  setPinned(true);
                  setIndex(i);
                }}
                className="text-left"
              >
                <NeonFrame
                  active={i === index}
                  corners={i === index}
                  quiet={i !== index}
                  radius={16}
                  className={`of-surface px-5 py-4 transition ${i === index ? "" : "opacity-70 hover:opacity-100"}`}
                  style={{ borderRadius: 16 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] text-cyan-200/80">0{i + 1}</span>
                    <span className="font-display text-[14px] font-bold tracking-[0.16em] text-white">{item.title}</span>
                  </div>
                  {i === index && <p className="mt-2 text-[14px] leading-6 text-white/72">{item.text}</p>}
                </NeonFrame>
              </button>
            ))}
            {pinned && (
              <button
                type="button"
                onClick={() => setPinned(false)}
                className="mt-2 inline-flex items-center gap-2 self-start font-mono text-[12px] tracking-[0.16em] text-cyan-200/80 hover:text-white"
              >
                <Play size={12} /> RESUME AUTOPLAY
              </button>
            )}
          </div>

          <NeonFrame active className="of-surface relative min-h-[420px] overflow-hidden sm:min-h-[520px]" radius={28} style={{ borderRadius: 28 }}>
            <Suspense fallback={<SceneFallback className="absolute inset-0" />}>
              <DPConceptScene concept={concept.id} className="absolute inset-0" label={`${concept.title}: ${concept.text}`} />
            </Suspense>
            <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-3">
              <DemoBadge>Illustration</DemoBadge>
              <span className="font-display text-[13px] font-bold tracking-[0.2em] text-white/85">{concept.title}</span>
            </div>
          </NeonFrame>
        </SectionReveal>
      </div>
    </section>
  );
}

/* =========================================================
   LAUNCH
========================================================= */

function LaunchSection() {
  const navigate = useNavigate();
  return (
    <section id="launch" className="relative overflow-hidden py-32 sm:py-44" aria-labelledby="launch-title">
      <div className="of-grid-floor opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <SectionReveal>
          <HolographicLabel className="justify-center">The decision space awaits</HolographicLabel>
          <h2 id="launch-title" className="mt-7 font-display text-[clamp(2.8rem,8vw,6.5rem)] font-black leading-[0.92] tracking-[0.02em] text-white">
            OPTIMIZE
            <br />
            <span className="of-gradient-text">THE FLOW.</span>
          </h2>
          <p className="of-lead mx-auto mt-6 max-w-xl">
            From a hundred possible decisions to one optimal execution strategy — built, explained and simulated in
            OptiFlow Studio.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <CinematicButton size="lg" kicker="INITIALIZE" icon={<Orbit size={20} />} onClick={() => navigate("/login")}>
              ENTER OPTIFLOW
            </CinematicButton>
            <CinematicButton variant="ghost" size="md" onClick={() => navigate("/register")}>
              Create a workspace
            </CinematicButton>
          </div>
        </SectionReveal>
      </div>

      <footer className="relative mx-auto mt-28 flex max-w-[1320px] flex-col items-center justify-between gap-3 border-t border-white/[0.08] px-5 pt-8 font-mono text-[12px] tracking-[0.16em] text-white/50 sm:flex-row sm:px-8 lg:px-12">
        <span>OPTIFLOW · OPTIMIZE. EXECUTE. SHIP SMARTER.</span>
        <span className="flex items-center gap-2">
          MODEL <ArrowRight size={11} /> ANALYZE <ArrowRight size={11} /> OPTIMIZE <ArrowRight size={11} /> EXECUTE
        </span>
      </footer>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <Ambient variant="landing" />
      <PublicNavbar />
      <main className="of-layer">
        <Hero />
        <EngineSection />
        <ProblemSection />
        <DPSection />
        <LaunchSection />
      </main>
    </div>
  );
}
