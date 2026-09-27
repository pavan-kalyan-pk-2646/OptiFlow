import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FlaskConical,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  DollarSign,
  GitBranch,
  Info,
  Layers3,
  Play,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
  Target,
  Timer,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { apiRequest } from "../../services/api";
import Ambient from "../../cinematic/Ambient";
import CinematicButton from "../../cinematic/ui/CinematicButton";
import NeonFrame from "../../cinematic/ui/NeonFrame";
import Glass3DCard from "../../cinematic/ui/Glass3DCard";
import { DemoBadge } from "../../cinematic/ui/HolographicLabel";
import StateSpaceExplorer from "../../components/learn/StateSpaceExplorer";
import { traceStateSpace } from "../../cinematic/dpStateSpace";
import { objectiveScore } from "../../cinematic/exampleProblem";

const PipelineModulesScene = lazy(() =>
  import("../../components/studio/StudioScenes").then((module) => ({ default: module.PipelineModulesScene })),
);
const ConstraintFieldScene = lazy(() =>
  import("../../components/studio/StudioScenes").then((module) => ({ default: module.ConstraintFieldScene })),
);

/* =========================================================
   TYPES
========================================================= */

type StudioMode = "landing" | "introduction" | "workspace";

type WorkspaceSection =
  | "pipeline"
  | "constraints"
  | "engine"
  | "visualizer"
  | "simulation"
  | "results"
  | "benchmark";

type Objective = "time" | "cost" | "balanced";

interface Strategy {
  id: string;
  name: string;
  time: number;
  cost: number;
}

interface Stage {
  id: string;
  name: string;
  description: string;
  strategies: Strategy[];
  dependencies: string[];
}

interface Constraints {
  deadline: number;
  budget: number;
  objective: Objective;
}

interface StudioOptimizationResult {
  success: boolean;
  message: string;
  objective: Objective;
  total_time: number;
  total_cost: number;
  score: number;
  selected_strategies: string[];
  stage_results: Array<{
    stage_id: string;
    stage_name: string;
    strategy_id: string;
    strategy_name: string;
    time: number;
    cost: number;
  }>;
  states_generated: number;
  transitions_evaluated: number;
  states_pruned: number;
  total_states_stored: number;
  reconstruction: Array<{
    stage_index: number;
    time: number;
    cost: number;
    score: number;
    strategy_id: string | null;
  }>;
  dp_model: {
    state: string;
    transition: string;
    constraints: string[];
    objective: Objective;
  };
  selections: Record<string, string>;
  time: number;
  cost: number;
  totalPossibleConfigurations: number;
}


/* =========================================================
   LOCAL PRODUCT PERSISTENCE
========================================================= */

interface SavedPipelineRecord {
  id: string;
  name: string;
  stages: Stage[];
  constraints: Constraints;
  createdAt: string;
  updatedAt: string;
}

interface OptimizationHistoryRecord {
  id: string;
  pipelineName: string;
  stageCount: number;
  strategyCount: number;
  configurations: number;
  objective: Objective;
  deadline: number;
  budget: number;
  totalTime: number;
  totalCost: number;
  score: number;
  statesGenerated: number;
  transitionsEvaluated: number;
  statesPruned: number;
  selectedStrategies: string[];
  /** Per-stage decisions returned by the backend (added for 3D replays; optional for older records) */
  stageResults?: StudioOptimizationResult["stage_results"];
  /** Backend reconstruction states S0…Sn (optional for older records) */
  reconstruction?: StudioOptimizationResult["reconstruction"];
  createdAt: string;
}

const PIPELINES_STORAGE_KEY = "optiflow_saved_pipelines";
const HISTORY_STORAGE_KEY = "optiflow_optimization_history";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function createStorageId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the timestamp-based fallback.
  }

  return `pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function savePipelineRecord(
  stages: Stage[],
  constraints: Constraints,
  activePipelineId: string | null = null,
): SavedPipelineRecord {
  const now = new Date().toISOString();
  const existing = readStorage<SavedPipelineRecord[]>(
    PIPELINES_STORAGE_KEY,
    [],
  );

  const current = activePipelineId
    ? existing.find((item) => item.id === activePipelineId)
    : undefined;

  const record: SavedPipelineRecord = {
    id: current?.id ?? createStorageId(),
    name: current?.name ?? "My Pipeline",
    stages: structuredClone(stages),
    constraints: { ...constraints },
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  const next = current
    ? existing.map((item) =>
        item.id === record.id ? record : item,
      )
    : [record, ...existing];

  writeStorage(PIPELINES_STORAGE_KEY, next);

  // Keep a copy of the last explicitly saved pipeline so the
  // Studio can restore it reliably when opened from My Pipelines.
  writeStorage("optiflow_last_saved_pipeline", record);

  return record;
}

function saveOptimizationHistory(
  stages: Stage[],
  constraints: Constraints,
  result: StudioOptimizationResult,
): void {
  const existing = readStorage<OptimizationHistoryRecord[]>(
    HISTORY_STORAGE_KEY,
    [],
  );

  const strategyCount = stages.reduce(
    (total, stage) => total + stage.strategies.length,
    0,
  );

  const configurations = stages.reduce(
    (total, stage) => total * stage.strategies.length,
    1,
  );

  const record: OptimizationHistoryRecord = {
    id: crypto.randomUUID(),
    pipelineName: "My Pipeline",
    stageCount: stages.length,
    strategyCount,
    configurations,
    objective: constraints.objective,
    deadline: constraints.deadline,
    budget: constraints.budget,
    totalTime: result.total_time,
    totalCost: result.total_cost,
    score: result.score,
    statesGenerated: result.states_generated,
    transitionsEvaluated: result.transitions_evaluated,
    statesPruned: result.states_pruned,
    selectedStrategies: result.selected_strategies,
    stageResults: result.stage_results,
    reconstruction: result.reconstruction,
    createdAt: new Date().toISOString(),
  };

  writeStorage(HISTORY_STORAGE_KEY, [record, ...existing].slice(0, 50));
}

/* =========================================================
   INITIAL DATA
========================================================= */

const INITIAL_STAGES: Stage[] = [
  {
    id: "build",
    name: "BUILD",
    description: "Compile source code and create application artifacts.",
    strategies: [
      {
        id: "build-standard",
        name: "Standard",
        time: 8,
        cost: 0.08,
      },
      {
        id: "build-fast",
        name: "Fast",
        time: 5,
        cost: 0.15,
      },
      {
        id: "build-premium",
        name: "High Power",
        time: 3,
        cost: 0.25,
      },
    ],
    dependencies: [],
  },
  {
    id: "test",
    name: "TEST",
    description: "Run automated unit, integration and regression tests.",
    strategies: [
      {
        id: "test-standard",
        name: "Standard",
        time: 12,
        cost: 0.14,
      },
      {
        id: "test-parallel",
        name: "Parallel",
        time: 7,
        cost: 0.24,
      },
      {
        id: "test-high",
        name: "High Power",
        time: 5,
        cost: 0.35,
      },
    ],
    dependencies: ["build"],
  },
  {
    id: "security",
    name: "SECURITY",
    description: "Scan source code and generated artifacts for vulnerabilities.",
    strategies: [
      {
        id: "security-standard",
        name: "Standard Scan",
        time: 7,
        cost: 0.09,
      },
      {
        id: "security-fast",
        name: "Accelerated Scan",
        time: 5,
        cost: 0.16,
      },
      {
        id: "security-deep",
        name: "Deep Scan",
        time: 10,
        cost: 0.13,
      },
    ],
    dependencies: ["build"],
  },
  {
    id: "package",
    name: "PACKAGE",
    description: "Create the production-ready application artifact.",
    strategies: [
      {
        id: "package-standard",
        name: "Standard",
        time: 5,
        cost: 0.05,
      },
      {
        id: "package-fast",
        name: "Accelerated",
        time: 3,
        cost: 0.09,
      },
    ],
    dependencies: ["test", "security"],
  },
  {
    id: "deploy",
    name: "DEPLOY",
    description: "Release the validated production artifact.",
    strategies: [
      {
        id: "deploy-standard",
        name: "Standard",
        time: 4,
        cost: 0.04,
      },
      {
        id: "deploy-fast",
        name: "Accelerated",
        time: 2,
        cost: 0.08,
      },
    ],
    dependencies: ["package"],
  },
];

const INITIAL_CONSTRAINTS: Constraints = {
  deadline: 30,
  budget: 1,
  objective: "balanced",
};

/* =========================================================
   HELPERS
========================================================= */

function objectiveLabel(objective: Objective) {
  if (objective === "time") return "Minimize Time";
  if (objective === "cost") return "Minimize Cost";
  return "Balanced — Time + Cost";
}

/*
  We intentionally use a bounded V1 optimization model:

  - One strategy is selected for each pipeline stage.
  - Every strategy has time and cost.
  - Deadline and budget are hard constraints.
  - Objective is time, cost, or balanced.

  This allows us to demonstrate a real decision-space optimization
  model before extending the engine with more complex resource models.
*/

/* =========================================================
   ANIMATED BACKGROUND
========================================================= */

function StudioBackground() {
  // The persistent cinematic environment (stars, DP constellation, depth fog).
  return <Ambient variant="studio" intensity={0.75} />;
}

/* =========================================================
   COMMON COMPONENTS
========================================================= */

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <img
      src="/assets/brand/optiflow-logo-horizontal.png"
      alt="OptiFlow"
      className={`object-contain ${
        small ? "w-[105px]" : "w-[150px]"
      }`}
    />
  );
}

function Eyebrow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <span className="of-eyebrow">{children}</span>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  icon = <ArrowRight size={16} />,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
}) {
  return (
    <CinematicButton type={type} onClick={onClick} icon={icon} arrow={false} size="md">
      {children}
    </CinematicButton>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <Glass3DCard innerClassName="p-5" radius={18}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/[0.08] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(56,232,255,.25)]">
          {icon}
        </div>

        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/45">
          Live
        </span>
      </div>

      <p className="font-mono text-[11.5px] uppercase tracking-[0.18em] text-white/60">
        {label}
      </p>

      <div className="mt-2 flex items-end gap-2">
        <span className="font-heading text-[28px] font-bold tabular-nums tracking-tight text-white">
          {value}
        </span>

        {suffix && (
          <span className="pb-1 text-[13px] text-white/55">
            {suffix}
          </span>
        )}
      </div>
    </Glass3DCard>
  );
}

/* =========================================================
   STUDIO INTRO
========================================================= */

function StudioIntroduction({
  onEnterPipeline,
  onBack,
}: {
  onEnterPipeline: () => void;
  onBack: () => void;
}) {
  const sections = [
    {
      number: "01",
      title: "The problem",
      text: "A software pipeline can contain several stages, and each stage may have multiple execution strategies. Every strategy can have a different execution time and cost.",
    },
    {
      number: "02",
      title: "The decision space",
      text: "As stages and choices increase, the number of possible pipeline configurations grows rapidly. Manually comparing every configuration becomes inefficient.",
    },
    {
      number: "03",
      title: "What OptiFlow does",
      text: "OptiFlow models those choices as an optimization problem and searches for the best feasible combination while respecting the constraints defined by the user.",
    },
    {
      number: "04",
      title: "Why Dynamic Programming",
      text: "Dynamic Programming avoids repeatedly solving identical intermediate subproblems by storing useful state information and reusing it.",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-y-auto text-white">

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-8 lg:px-10">
        <header className="flex items-center justify-between">
          <BrandMark />

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-[13px] text-white/62 transition hover:border-white/[0.12] hover:text-white"
          >
            <ArrowLeft size={14} />
            Return to Dashboard
          </button>
        </header>

        <main className="pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Eyebrow>OptiFlow Studio</Eyebrow>

              <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-7xl">
                Find the best way
                <br />
                <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  to execute your pipeline.
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-white/62">
                OptiFlow Studio is the optimization workbench where you
                define a software pipeline, give each stage possible
                execution strategies, set your constraints, and let the
                Dynamic Programming engine determine the best feasible
                configuration.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-10"
            >
              <PrimaryButton
                onClick={onEnterPipeline}
                icon={<ArrowRight size={17} />}
              >
                Enter Studio
              </PrimaryButton>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mx-auto mt-24 max-w-5xl"
          >
            <div className="rounded-3xl border border-white/[0.07] bg-[#0c0c0d]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
              <div className="mb-10">
                <Eyebrow>Understand the system</Eyebrow>

                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  What exactly happens inside OptiFlow?
                </h2>

                <p className="mt-4 max-w-3xl text-[14px] leading-7 text-white/62">
                  OptiFlow is not simply a pipeline editor. The pipeline
                  is the input to an optimization problem. The actual
                  purpose of the Studio is to transform your pipeline
                  decisions into a mathematical decision space that the
                  optimization engine can evaluate.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {sections.map((item, index) => (
                  <motion.div
                    key={item.number}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="font-mono text-[12px] tracking-[0.2em] text-cyan-400">
                        {item.number}
                      </span>

                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
                    </div>

                    <h3 className="text-base font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-[14px] leading-6 text-white/62">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-8 max-w-5xl rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.025] p-8"
          >
            <Eyebrow>Simple example</Eyebrow>

            <div className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  One stage. Multiple decisions.
                </h3>

                <p className="mt-3 text-[14px] leading-6 text-white/62">
                  BUILD may have three possible execution strategies.
                  Choosing one affects the overall pipeline time and
                  cost.
                </p>
              </div>

              <ArrowRight className="hidden text-cyan-400 lg:block" />

              <div className="space-y-2">
                {[
                  ["Standard", "8 min", "$0.08"],
                  ["Fast", "5 min", "$0.15"],
                  ["High Power", "3 min", "$0.25"],
                ].map(([name, time, cost]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[1fr_auto_auto] gap-5 rounded-xl border border-white/[0.06] bg-[#0a0a0b] px-4 py-3 text-[13px]"
                  >
                    <span className="font-medium text-slate-300">
                      {name}
                    </span>

                    <span className="text-white/62">
                      {time}
                    </span>

                    <span className="font-mono text-cyan-300">
                      {cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto mt-8 max-w-5xl rounded-3xl border border-white/[0.07] bg-[#0c0c0d] p-8"
          >
            <div className="grid gap-8 lg:grid-cols-4">
              {[
                ["DEFINE", "Pipeline + strategies"],
                ["CONSTRAIN", "Deadline + budget"],
                ["OPTIMIZE", "Dynamic Programming"],
                ["EXPLAIN", "Optimal decisions"],
              ].map(([title, text], index) => (
                <div key={title} className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-400/[0.05] font-mono text-[11px] text-cyan-300">
                      0{index + 1}
                    </span>

                    {index < 3 && (
                      <div className="hidden h-px flex-1 bg-white/[0.06] lg:block" />
                    )}
                  </div>

                  <h4 className="text-[13px] font-semibold tracking-wide text-white">
                    {title}
                  </h4>

                  <p className="mt-2 text-[13px] leading-5 text-white/55">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="mt-14 flex justify-center">
            <PrimaryButton onClick={onEnterPipeline}>
              Enter Pipeline
            </PrimaryButton>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   WORKSPACE HEADER
========================================================= */

function WorkspaceHeader({
  activeSection,
  onSectionChange,
  onBack,
  onRun,
  onReset,
  onSave,
  hasResults,
  isOptimizing,
}: {
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
  onBack: () => void;
  onRun: () => void;
  onReset: () => void;
  onSave: () => void;
  hasResults: boolean;
  isOptimizing: boolean;
}) {
  const nav = [
    { id: "pipeline" as WorkspaceSection, label: "Pipeline", icon: Workflow },
    { id: "constraints" as WorkspaceSection, label: "Constraints", icon: Settings2 },
    { id: "engine" as WorkspaceSection, label: "DP Engine", icon: BrainCircuitIcon },
    { id: "visualizer" as WorkspaceSection, label: "Visualizer", icon: GitBranch },
    { id: "simulation" as WorkspaceSection, label: "Simulation", icon: Play },
    { id: "results" as WorkspaceSection, label: "Results", icon: BarChart3 },
    { id: "benchmark" as WorkspaceSection, label: "Benchmark", icon: FlaskConical },
  ];

  return (
    <header className="of-topbar sticky top-0 z-50">
      <div className="mx-auto flex min-h-[72px] w-full items-center gap-3 px-4 sm:px-5 lg:px-7">
        {/* Brand / exit */}
        <div className="flex min-w-[205px] shrink-0 items-center gap-3 border-r border-white/[0.07] pr-4 lg:min-w-[235px] lg:pr-5">
          <button
            onClick={onBack}
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.02] text-slate-400 transition-all duration-200 hover:border-cyan-400/25 hover:bg-cyan-400/[0.05] hover:text-white"
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
          >
            <ArrowLeft
              size={16}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>

          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400">
              OptiFlow Studio
            </p>
            <p className="mt-0.5 truncate text-[14px] font-semibold leading-5 text-white lg:text-[14px]">
              Pipeline Workbench
            </p>
          </div>
        </div>

        {/* Desktop workspace navigation */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center 2xl:flex" aria-label="Studio sections">
          <div className="of-frame of-controlbar flex max-w-full items-center gap-1 p-1.5" data-active="true">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : undefined}
                  className="of-frame of-navitem !h-11 !normal-case !tracking-[0.04em]"
                >
                  <Icon size={16} strokeWidth={active ? 2.1 : 1.7} className={active ? "text-cyan-200" : "text-white/55"} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div
            className={`hidden h-10 items-center gap-2 rounded-xl border px-3.5 lg:flex ${
              hasResults
                ? "border-emerald-400/15 bg-emerald-400/[0.045]"
                : "border-cyan-400/12 bg-cyan-400/[0.03]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasResults
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  : "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
              }`}
            />
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {hasResults ? "Optimized" : "Ready"}
            </span>
          </div>

          <button
            onClick={onReset}
            className="hidden h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.015] px-3.5 text-[13px] font-medium text-slate-400 transition-all hover:border-white/[0.14] hover:bg-white/[0.035] hover:text-white md:flex"
          >
            <RotateCcw size={14} />
            Reset
          </button>

          <button
            type="button"
            onClick={onSave}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.02] px-3.5 text-[13px] font-medium text-slate-300 transition-all hover:border-cyan-400/25 hover:bg-cyan-400/[0.05] hover:text-white"
          >
            <Save size={14} />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={onRun}
            disabled={isOptimizing}
            className="of-btn of-btn--solid of-btn--sm group !h-10 disabled:cursor-wait"
          >
            {isOptimizing ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                className="inline-flex"
              >
                <Sparkles size={14} />
              </motion.span>
            ) : (
              <Zap size={14} />
            )}

            <span className="hidden sm:inline">
              {isOptimizing ? "Running DP..." : "Run Optimization"}
            </span>

            {!isOptimizing && (
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            )}
          </button>
        </div>
      </div>

      {/* Tablet / mobile navigation */}
      <nav aria-label="Studio sections (compact)" className="border-t border-white/[0.05] px-3 py-2 2xl:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : undefined}
                className="of-frame of-navitem shrink-0 !h-10 !normal-case !tracking-[0.04em]"
              >
                <Icon size={13} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
/* =========================================================
   BRAIN ICON
========================================================= */

function BrainCircuitIcon({
  size = 16,
}: {
  size?: number;
}) {
  return <Sparkles size={size} />;
}

/* =========================================================
   PIPELINE WORKSPACE
========================================================= */

function PipelineWorkspace({
  stages,
  setStages,
}: {
  stages: Stage[];
  setStages: Dispatch<SetStateAction<Stage[]>>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    "build",
  );

  const [editingStrategy, setEditingStrategy] = useState<{
    stageId: string;
    strategyId: string;
  } | null>(null);

  function addStage() {
    const id = `stage-${Date.now()}`;

    setStages((current) => [
      ...current,
      {
        id,
        name: `STAGE ${current.length + 1}`,
        description: "New pipeline execution stage.",
        strategies: [
          {
            id: `${id}-standard`,
            name: "Standard",
            time: 5,
            cost: 0.1,
          },
        ],
        dependencies:
          current.length > 0
            ? [current[current.length - 1].id]
            : [],
      },
    ]);

    setExpandedId(id);
  }

  function removeStage(stageId: string) {
    setStages((current) =>
      current
        .filter((stage) => stage.id !== stageId)
        .map((stage) => ({
          ...stage,
          dependencies: stage.dependencies.filter(
            (dependency) => dependency !== stageId,
          ),
        })),
    );

    if (expandedId === stageId) {
      setExpandedId(null);
    }
  }

  function moveStage(stageId: string, direction: -1 | 1) {
    setStages((current) => {
      const index = current.findIndex((stage) => stage.id === stageId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateStage(
    stageId: string,
    patch: Partial<Stage>,
  ) {
    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? { ...stage, ...patch }
          : stage,
      ),
    );
  }

  function addStrategy(stageId: string) {
    setStages((current) =>
      current.map((stage) => {
        if (stage.id !== stageId) return stage;

        const nextNumber = stage.strategies.length + 1;

        return {
          ...stage,
          strategies: [
            ...stage.strategies,
            {
              id: `${stageId}-strategy-${Date.now()}`,
              name: `Strategy ${nextNumber}`,
              time: 5,
              cost: 0.1,
            },
          ],
        };
      }),
    );
  }

  function removeStrategy(
    stageId: string,
    strategyId: string,
  ) {
    setStages((current) =>
      current.map((stage) => {
        if (stage.id !== stageId) return stage;

        if (stage.strategies.length <= 1) {
          return stage;
        }

        return {
          ...stage,
          strategies: stage.strategies.filter(
            (strategy) => strategy.id !== strategyId,
          ),
        };
      }),
    );
  }

  function updateStrategy(
    stageId: string,
    strategyId: string,
    patch: Partial<Strategy>,
  ) {
    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              strategies: stage.strategies.map(
                (strategy) =>
                  strategy.id === strategyId
                    ? { ...strategy, ...patch }
                    : strategy,
              ),
            }
          : stage,
      ),
    );
  }

  const totalStrategies = stages.reduce(
    (sum, stage) => sum + stage.strategies.length,
    0,
  );

  const totalConfigurations = stages.reduce(
    (sum, stage) => sum * stage.strategies.length,
    1,
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Eyebrow>01 · Define</Eyebrow>

          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Define your pipeline.
          </h1>

          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-white/62">
            Each stage represents a decision in the optimization
            problem. Give each stage one or more execution strategies
            with different time and cost characteristics.
          </p>
        </div>

        <PrimaryButton
          onClick={addStage}
          icon={<Workflow size={15} />}
        >
          Add Pipeline Stage
        </PrimaryButton>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Layers3 size={16} />}
          label="Pipeline stages"
          value={String(stages.length)}
          suffix="defined"
        />

        <StatCard
          icon={<Zap size={16} />}
          label="Available strategies"
          value={String(totalStrategies)}
          suffix="choices"
        />

        <StatCard
          icon={<GitBranch size={16} />}
          label="Dependencies"
          value={String(
            stages.reduce(
              (sum, stage) => sum + stage.dependencies.length,
              0,
            ),
          )}
          suffix="links"
        />

        <StatCard
          icon={<Target size={16} />}
          label="Decision space"
          value={String(totalConfigurations)}
          suffix="configs"
        />
      </div>

      <NeonFrame active radius={26} className="of-surface relative mt-8 overflow-hidden" style={{ borderRadius: 26 }}>
        <div className="relative h-[340px] sm:h-[380px]">
          <div className="of-grid-floor opacity-60" aria-hidden="true" />
          <Suspense fallback={null}>
            <PipelineModulesScene
              className="absolute inset-0"
              stages={stages}
              mode="build"
              selectedId={expandedId}
              onSelect={(id) => {
                setExpandedId(id);
                window.setTimeout(() => document.getElementById(`stage-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
              }}
            />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-5 top-4 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[12px] tracking-[0.2em] text-cyan-100/80">3D PIPELINE · CLICK A MODULE TO EDIT</span>
            <span className="font-mono text-[12px] tracking-[0.14em] text-white/55">DEPENDENCIES = ENERGY BEAMS</span>
          </div>
        </div>
      </NeonFrame>

      <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
        <div className="flex gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300">
            <Info size={16} />
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-white">
              Why these inputs matter
            </h3>

            <p className="mt-1.5 max-w-4xl text-[13px] leading-6 text-white/62">
              OptiFlow does not optimize task names alone. Every stage
              needs meaningful alternatives. The execution time and
              cost of those alternatives create the trade-offs that
              the optimization engine evaluates. Dependencies describe
              the valid pipeline structure.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-400">
              Pipeline definition
            </p>

            <p className="mt-1 text-[13px] text-white/55">
              Select a stage to inspect and edit its decision choices.
            </p>
          </div>

          <span className="rounded-full border border-white/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-white/55">
            {stages.length} stages
          </span>
        </div>

        <div className="space-y-3">
          {stages.map((stage, index) => {
            const expanded = expandedId === stage.id;

            return (
              <motion.div
                layout
                key={stage.id}
                id={`stage-${stage.id}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="of-frame of-surface overflow-hidden rounded-2xl"
                data-active={expanded ? "true" : undefined}
                style={{ borderRadius: 16 }}
              >
                <div className="relative z-[5] flex items-stretch">
                <button
                  onClick={() =>
                    setExpandedId(
                      expanded ? null : stage.id,
                    )
                  }
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-center gap-4 px-5 py-5 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] font-mono text-[11px] text-cyan-300">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-semibold text-white">
                        {stage.name}
                      </span>

                      <span className="rounded-md border border-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/55">
                        {stage.strategies.length} choices
                      </span>
                    </div>

                    <p className="mt-1 truncate text-[13px] text-white/55">
                      {stage.description}
                    </p>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    {stage.dependencies.length > 0 && (
                      <span className="rounded-lg border border-white/[0.05] px-2.5 py-1.5 text-[11px] text-white/55">
                        {stage.dependencies.length} dependencies
                      </span>
                    )}
                  </div>

                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-white/55 transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div className="flex flex-col justify-center gap-1 border-l border-white/[0.06] px-2">
                  <button
                    type="button"
                    onClick={() => moveStage(stage.id, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${stage.name} up`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-25"
                  >
                    <ChevronDown size={15} className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(stage.id, 1)}
                    disabled={index === stages.length - 1}
                    aria-label={`Move ${stage.name} down`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-25"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
                </div>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="border-t border-white/[0.05] px-5 pb-6 pt-6">
                        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                          <div>
                            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                              Stage definition
                            </p>

                            <div className="space-y-4">
                              <label className="block">
                                <span className="mb-2 block text-[12px] text-white/62">
                                  Stage name
                                </span>

                                <input
                                  value={stage.name}
                                  onChange={(event) =>
                                    updateStage(stage.id, {
                                      name: event.target.value.toUpperCase(),
                                    })
                                  }
                                  className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#09090a] px-3 text-[13px] text-white outline-none transition focus:border-cyan-400/30"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-2 block text-[12px] text-white/62">
                                  Description
                                </span>

                                <textarea
                                  value={stage.description}
                                  onChange={(event) =>
                                    updateStage(stage.id, {
                                      description:
                                        event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-white/[0.07] bg-[#09090a] px-3 py-3 text-[13px] leading-5 text-white outline-none transition focus:border-cyan-400/30"
                                />
                              </label>

                              <div>
                                <span className="mb-2 block text-[12px] text-white/62">
                                  Dependencies
                                </span>

                                <div className="flex flex-wrap gap-2">
                                  {stages
                                    .filter(
                                      (candidate) =>
                                        candidate.id !==
                                        stage.id,
                                    )
                                    .map((candidate) => {
                                      const selected =
                                        stage.dependencies.includes(
                                          candidate.id,
                                        );

                                      return (
                                        <button
                                          key={candidate.id}
                                          onClick={() => {
                                            const next =
                                              selected
                                                ? stage.dependencies.filter(
                                                    (id) =>
                                                      id !==
                                                      candidate.id,
                                                  )
                                                : [
                                                    ...stage.dependencies,
                                                    candidate.id,
                                                  ];

                                            updateStage(
                                              stage.id,
                                              {
                                                dependencies:
                                                  next,
                                              },
                                            );
                                          }}
                                          className={`rounded-lg border px-3 py-2 text-[11px] transition ${
                                            selected
                                              ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
                                              : "border-white/[0.06] text-white/55 hover:text-slate-300"
                                          }`}
                                        >
                                          {candidate.name}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  removeStage(stage.id)
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-red-400/10 px-3 py-2 text-[11px] text-red-400/70 transition hover:bg-red-400/[0.04] hover:text-red-400"
                              >
                                <X size={12} />
                                Remove stage
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                                  Execution choices
                                </p>

                                <p className="mt-1 text-[12px] text-white/45">
                                  Each choice creates a possible DP decision.
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  addStrategy(stage.id)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.03] px-3 py-2 text-[11px] text-cyan-300"
                              >
                                <span>+</span>
                                Add choice
                              </button>
                            </div>

                            <div className="space-y-2">
                              {stage.strategies.map(
                                (strategy) => {
                                  const editing =
                                    editingStrategy?.stageId ===
                                      stage.id &&
                                    editingStrategy?.strategyId ===
                                      strategy.id;

                                  return (
                                    <div
                                      key={strategy.id}
                                      className="rounded-xl border border-white/[0.06] bg-[#09090a] p-3"
                                    >
                                      <div className="grid gap-2 sm:grid-cols-[1fr_80px_90px_36px]">
                                        <input
                                          value={strategy.name}
                                          onFocus={() =>
                                            setEditingStrategy(
                                              {
                                                stageId:
                                                  stage.id,
                                                strategyId:
                                                  strategy.id,
                                              },
                                            )
                                          }
                                          onChange={(event) =>
                                            updateStrategy(
                                              stage.id,
                                              strategy.id,
                                              {
                                                name: event
                                                  .target
                                                  .value,
                                              },
                                            )
                                          }
                                          className={`h-10 rounded-lg border bg-[#0d0d0e] px-3 text-[12px] text-white outline-none ${
                                            editing
                                              ? "border-cyan-400/20"
                                              : "border-white/[0.06]"
                                          }`}
                                        />

                                        <div className="relative">
                                          <Clock3
                                            size={11}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                                          />

                                          <input
                                            type="number"
                                            min="1"
                                            value={
                                              strategy.time
                                            }
                                            onChange={(
                                              event,
                                            ) =>
                                              updateStrategy(
                                                stage.id,
                                                strategy.id,
                                                {
                                                  time: Math.max(
                                                    1,
                                                    Number(
                                                      event
                                                        .target
                                                        .value,
                                                    ),
                                                  ),
                                                },
                                              )
                                            }
                                            className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#0d0d0e] pl-8 pr-2 text-[12px] text-white outline-none"
                                          />
                                        </div>

                                        <div className="relative">
                                          <DollarSign
                                            size={11}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                                          />

                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                              strategy.cost
                                            }
                                            onChange={(
                                              event,
                                            ) =>
                                              updateStrategy(
                                                stage.id,
                                                strategy.id,
                                                {
                                                  cost: Math.max(
                                                    0,
                                                    Number(
                                                      event
                                                        .target
                                                        .value,
                                                    ),
                                                  ),
                                                },
                                              )
                                            }
                                            className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#0d0d0e] pl-8 pr-2 text-[12px] text-white outline-none"
                                          />
                                        </div>

                                        <button
                                          onClick={() =>
                                            removeStrategy(
                                              stage.id,
                                              strategy.id,
                                            )
                                          }
                                          className="flex h-10 items-center justify-center rounded-lg border border-white/[0.05] text-white/45 transition hover:border-red-400/10 hover:text-red-400"
                                        >
                                          <X size={13} />
                                        </button>
                                      </div>

                                      <div className="mt-2 flex gap-3 font-mono text-[10px] uppercase tracking-wider text-white/45">
                                        <span>
                                          TIME · {strategy.time} MIN
                                        </span>

                                        <span>•</span>

                                        <span>
                                          COST · $
                                          {strategy.cost.toFixed(
                                            2,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CONSTRAINTS WORKSPACE
========================================================= */

/** Every complete configuration (or the DP frontier when the space is huge). */
function fieldPointsFor(stages: Stage[], constraints: Constraints) {
  const total = stages.reduce((product, stage) => product * Math.max(1, stage.strategies.length), 1);
  if (stages.length === 0) return { points: [], exhaustive: true, total: 0 };

  if (total <= 12000) {
    const points: { time: number; costCents: number; score: number }[] = [];
    const walk = (index: number, time: number, cost: number) => {
      if (index === stages.length) {
        points.push({
          time,
          costCents: cost,
          score: objectiveScore(time, cost, constraints.deadline, constraints.budget, constraints.objective),
        });
        return;
      }
      stages[index].strategies.forEach((strategy) => walk(index + 1, time + strategy.time, cost + Math.round(strategy.cost * 100)));
    };
    walk(0, 0, 0);
    return { points, exhaustive: true, total };
  }

  // Too many configurations to draw one by one: show the final DP frontier instead.
  const trace = traceStateSpace(stages, constraints.deadline, constraints.budget, constraints.objective);
  const points = trace.states
    .filter((state) => state.layer === stages.length)
    .map((state) => ({ time: state.time, costCents: state.costCents, score: state.score }));
  return { points, exhaustive: false, total };
}

function Gauge({
  label,
  value,
  unit,
  min,
  max,
  limit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  min: number;
  max: number;
  limit: number;
  tone: "cyan" | "violet";
}) {
  const span = Math.max(max, limit) || 1;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const limitFraction = Math.min(1, limit / span);
  const minFraction = Math.min(1, min / span);
  const stroke = tone === "cyan" ? "#38e8ff" : "#9a7bff";
  const feasible = min <= limit;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 132 132" className="h-[132px] w-[132px] shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="66" cy="66" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circumference * limitFraction} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 6px ${stroke})`, transition: "stroke-dasharray .5s cubic-bezier(.16,1,.3,1)" }}
        />
        <circle
          cx="66"
          cy="66"
          r={radius - 14}
          fill="none"
          stroke={feasible ? "rgba(70,240,180,.8)" : "rgba(255,84,112,.9)"}
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * (radius - 14) * minFraction} ${2 * Math.PI * (radius - 14)}`}
          style={{ transition: "stroke-dasharray .5s cubic-bezier(.16,1,.3,1)" }}
        />
      </svg>
      <div>
        <div className="font-mono text-[11.5px] uppercase tracking-[0.2em] text-white/60">{label}</div>
        <div className="mt-1 font-heading text-[30px] font-bold tabular-nums text-white">
          {value} <span className="text-[14px] font-medium text-white/55">{unit}</span>
        </div>
        <div className={`mt-1 text-[13px] ${feasible ? "text-emerald-200/85" : "text-rose-200"}`}>
          {feasible ? "Reachable" : "Unreachable"} · best possible {unit === "min" ? `${min} min` : `$${(min / 100).toFixed(2)}`}
        </div>
      </div>
    </div>
  );
}

function ConstraintsWorkspace({
  stages,
  constraints,
  setConstraints,
}: {
  stages: Stage[];
  constraints: Constraints;
  setConstraints: Dispatch<
    SetStateAction<Constraints>
  >;
}) {
  const field = useMemo(() => fieldPointsFor(stages, constraints), [stages, constraints]);
  const budgetCents = Math.round(constraints.budget * 100);
  const feasibleCount = field.points.filter((point) => point.time <= constraints.deadline && point.costCents <= budgetCents).length;
  const minTime = stages.reduce((sum, stage) => sum + Math.min(...stage.strategies.map((strategy) => strategy.time)), 0);
  const maxTime = stages.reduce((sum, stage) => sum + Math.max(...stage.strategies.map((strategy) => strategy.time)), 0);
  const minCost = stages.reduce((sum, stage) => sum + Math.min(...stage.strategies.map((strategy) => Math.round(strategy.cost * 100))), 0);
  const maxCost = stages.reduce((sum, stage) => sum + Math.max(...stage.strategies.map((strategy) => Math.round(strategy.cost * 100))), 0);
  const violating = stages.flatMap((stage) =>
    stage.strategies
      .filter((strategy) => strategy.time > constraints.deadline || Math.round(strategy.cost * 100) > budgetCents)
      .map((strategy) => `${stage.name} · ${strategy.name}`),
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <Eyebrow>02 · Constrain</Eyebrow>

      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
        Tell OptiFlow what must not be violated.
      </h1>

      <p className="mt-3 max-w-2xl text-[14px] leading-6 text-white/62">
        Constraints define the boundaries of the optimization problem.
        The engine can choose different strategies, but the final
        configuration must remain within these limits.
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <NeonFrame active radius={24} className="of-surface relative overflow-hidden" style={{ borderRadius: 24 }}>
          <div className="relative h-[340px] sm:h-[380px]">
            <Suspense fallback={null}>
              <ConstraintFieldScene
                className="absolute inset-0"
                points={field.points}
                deadline={constraints.deadline}
                budget={constraints.budget}
              />
            </Suspense>
            <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[12px] tracking-[0.18em] text-cyan-100/80">CONSTRAINT BOUNDARY FIELD</span>
              <DemoBadge kind="live">{field.exhaustive ? "All configurations" : "DP frontier"} · your pipeline</DemoBadge>
            </div>
          </div>
          <div className="relative z-[5] grid grid-cols-3 gap-2 border-t border-white/[0.07] p-4 text-center font-mono text-[12px]">
            <div><div className="font-heading text-[22px] font-bold text-white">{field.total.toLocaleString()}</div><div className="text-white/55">configurations</div></div>
            <div><div className="font-heading text-[22px] font-bold text-cyan-200">{field.exhaustive ? feasibleCount.toLocaleString() : "—"}</div><div className="text-white/55">feasible</div></div>
            <div><div className="font-heading text-[22px] font-bold text-rose-200">{field.exhaustive ? (field.total - feasibleCount).toLocaleString() : "—"}</div><div className="text-white/55">pruned by limits</div></div>
          </div>
        </NeonFrame>

        <div className="grid content-start gap-4">
          <div className="of-surface rounded-2xl p-5">
            <Gauge label="Time limit" value={String(constraints.deadline)} unit="min" min={minTime} max={maxTime} limit={constraints.deadline} tone="cyan" />
          </div>
          <div className="of-surface rounded-2xl p-5">
            <Gauge label="Budget limit" value={`$${constraints.budget.toFixed(2)}`} unit="" min={minCost} max={maxCost} limit={budgetCents} tone="violet" />
          </div>
          {violating.length > 0 && (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-4 text-[13.5px] leading-6 text-rose-100">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose-200/80">Strategies outside feasible space</div>
              <p className="mt-1">{violating.slice(0, 6).join(", ")}{violating.length > 6 ? ` +${violating.length - 6} more` : ""}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] text-cyan-300">
            <Timer size={17} />
          </div>

          <h2 className="mt-5 text-base font-semibold text-white">
            Maximum execution time
          </h2>

          <p className="mt-2 text-[13px] leading-6 text-white/55">
            The selected pipeline configuration cannot exceed this
            total execution time.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={constraints.deadline}
              onChange={(event) =>
                setConstraints((current) => ({
                  ...current,
                  deadline: Math.max(
                    1,
                    Number(event.target.value),
                  ),
                }))
              }
              className="h-12 w-full rounded-xl border border-white/[0.07] bg-[#09090a] px-4 text-lg font-semibold text-white outline-none focus:border-cyan-400/30"
            />

            <span className="text-[13px] text-white/55">
              minutes
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] text-cyan-300">
            <DollarSign size={17} />
          </div>

          <h2 className="mt-5 text-base font-semibold text-white">
            Maximum budget
          </h2>

          <p className="mt-2 text-[13px] leading-6 text-white/55">
            The selected pipeline configuration cannot exceed this
            total execution cost.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-white/55">$</span>

            <input
              type="number"
              min="0.01"
              step="0.05"
              value={constraints.budget}
              onChange={(event) =>
                setConstraints((current) => ({
                  ...current,
                  budget: Math.max(
                    0.01,
                    Number(event.target.value),
                  ),
                }))
              }
              className="h-12 w-full rounded-xl border border-white/[0.07] bg-[#09090a] px-4 text-lg font-semibold text-white outline-none focus:border-cyan-400/30"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/[0.04] text-violet-300">
            <Target size={17} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              Optimization objective
            </h2>

            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/55">
              The objective determines what the DP engine considers
              "better" when comparing feasible configurations.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {[
            {
              id: "time" as Objective,
              title: "Minimize Time",
              text: "Prefer the fastest feasible pipeline.",
            },
            {
              id: "cost" as Objective,
              title: "Minimize Cost",
              text: "Prefer the cheapest feasible pipeline.",
            },
            {
              id: "balanced" as Objective,
              title: "Balanced",
              text: "Trade execution time against cost.",
            },
          ].map((item) => {
            const selected =
              constraints.objective === item.id;

            return (
              <button
                key={item.id}
                onClick={() =>
                  setConstraints((current) => ({
                    ...current,
                    objective: item.id,
                  }))
                }
                className={`rounded-xl border p-5 text-left transition ${
                  selected
                    ? "border-cyan-400/20 bg-cyan-400/[0.05]"
                    : "border-white/[0.06] bg-[#09090a] hover:border-white/[0.1]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[13px] font-semibold ${
                      selected
                        ? "text-cyan-300"
                        : "text-slate-400"
                    }`}
                  >
                    {item.title}
                  </span>

                  <div
                    className={`h-4 w-4 rounded-full border ${
                      selected
                        ? "border-cyan-300 bg-cyan-300"
                        : "border-slate-700"
                    }`}
                  />
                </div>

                <p className="mt-2 text-[12px] leading-5 text-white/55">
                  {item.text}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-6">
        <div className="flex items-center gap-3">
          <CircleHelp size={15} className="text-cyan-300" />

          <h3 className="text-[13px] font-semibold text-white">
            Current optimization problem
          </h3>
        </div>

        <p className="mt-3 text-[13px] leading-6 text-white/62">
          Choose one strategy for every pipeline stage. The total
          execution time must be ≤{" "}
          <span className="font-mono text-cyan-300">
            {constraints.deadline} minutes
          </span>{" "}
          and total cost must be ≤{" "}
          <span className="font-mono text-cyan-300">
            ${constraints.budget.toFixed(2)}
          </span>
          . Among feasible configurations, OptiFlow will optimize for{" "}
          <span className="text-white">
            {objectiveLabel(constraints.objective)}
          </span>
          .
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   DP ENGINE WORKSPACE
========================================================= */

function DPEngineWorkspace({
  stages,
  constraints,
  result,
}: {
  stages: Stage[];
  constraints: Constraints;
  result: StudioOptimizationResult | null;
}) {
  const [activeState, setActiveState] = useState(0);

  const reconstruction = result?.reconstruction ?? [];

  const stateRows = useMemo(() => {
    return reconstruction.map((state, index) => {
      // The backend reconstruction begins with S0 (the zero-stage state),
      // followed by one state for each pipeline stage.
      const isInitial = index === 0 && state.strategy_id === null;
      const stage = isInitial ? undefined : stages[index - 1];
      const strategy = stage?.strategies.find(
        (item) => item.id === state.strategy_id,
      );

      return {
        ...state,
        index,
        stage,
        strategy,
        isInitial,
      };
    });
  }, [reconstruction, stages]);

  const active = stateRows[activeState];

  const algorithmSteps = [
    {
      number: "01",
      title: "Initialize",
      text: "Start from the zero-stage state with zero accumulated time and cost.",
    },
    {
      number: "02",
      title: "Generate states",
      text: "For the next stage, consider each available execution strategy.",
    },
    {
      number: "03",
      title: "Apply transition",
      text: "Add the selected strategy's time and cost to the current state.",
    },
    {
      number: "04",
      title: "Check constraints",
      text: "Reject transitions that exceed the deadline or budget.",
    },
    {
      number: "05",
      title: "Retain state",
      text: "Store reachable states and preserve predecessor information for reconstruction.",
    },
    {
      number: "06",
      title: "Select optimum",
      text: "Choose the feasible final state with the best objective score.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <Eyebrow>03 · Optimize</Eyebrow>

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Inside the DP engine.
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-white/62">
            This is the mathematical decision layer behind OptiFlow. The
            backend converts each pipeline choice into a bounded state,
            evaluates valid transitions, and reconstructs the best feasible
            strategy sequence.
          </p>
        </div>

        <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
            Objective
          </p>
          <p className="mt-1 text-[13px] font-medium text-cyan-300">
            {objectiveLabel(constraints.objective)}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <StateSpaceExplorer
          stages={stages}
          deadline={constraints.deadline}
          budget={constraints.budget}
          objective={constraints.objective}
          sourceLabel={result ? "Your pipeline · counters from the backend run" : "Your pipeline · preview trace (run for backend counters)"}
          sourceKind="live"
          backend={
            result
              ? {
                  statesGenerated: result.states_generated,
                  transitionsEvaluated: result.transitions_evaluated,
                  statesPruned: result.states_pruned,
                  statesStored: result.total_states_stored,
                }
              : null
          }
          height="h-[420px] sm:h-[520px]"
        />
      </div>

      {!result ? (
        <div className="mt-10 rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.025] p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300">
            <Code2 size={22} />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Run the optimizer to inspect the DP execution.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-white/62">
            The engine view becomes data-driven after an optimization run.
            You will then be able to inspect the returned state model,
            transitions, metrics, and reconstructed decisions.
          </p>
        </div>
      ) : (
        <>
          {/* MODEL */}
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                    State model
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    What does one DP state mean?
                  </h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300">
                  <Code2 size={17} />
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-white/[0.06] bg-[#070708] p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
                  Backend state representation
                </p>
                <code className="mt-4 block text-2xl font-semibold tracking-tight text-cyan-300">
                  {result.dp_model.state}
                </code>
                <p className="mt-4 max-w-2xl text-[13px] leading-6 text-white/62">
                  At stage <span className="text-white">i</span>, the state
                  records the accumulated execution time and accumulated cost.
                  Only states within the configured deadline and budget are
                  allowed to continue.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-4">
                  <p className="font-mono text-[11px] tracking-widest text-cyan-400">
                    STATE
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-slate-400">
                    Stage + accumulated resources
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-4">
                  <p className="font-mono text-[11px] tracking-widest text-cyan-400">
                    TRANSITION
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-slate-400">
                    Select one strategy for the next stage
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-4">
                  <p className="font-mono text-[11px] tracking-widest text-cyan-400">
                    VALUE
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-slate-400">
                    Objective score of the state
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6 sm:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                Transition rule
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                How the next state is produced.
              </h2>

              <div className="mt-7 rounded-2xl border border-white/[0.06] bg-[#070708] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
                  Recurrence
                </p>
                <code className="mt-4 block text-sm leading-7 text-cyan-300">
                  {result.dp_model.transition}
                </code>
              </div>

              <div className="mt-4 space-y-2">
                {result.dp_model.constraints.map((constraint, index) => (
                  <div
                    key={constraint}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-[#09090a] px-4 py-3"
                  >
                    <span className="font-mono text-[11px] text-cyan-400">
                      0{index + 1}
                    </span>
                    <span className="text-[13px] text-slate-400">
                      {constraint}
                    </span>
                    <Check size={13} className="ml-auto text-emerald-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LIVE EXECUTION METRICS */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Layers3 size={16} />}
              label="States generated"
              value={String(result.states_generated)}
              suffix="states"
            />
            <StatCard
              icon={<Activity size={16} />}
              label="Transitions evaluated"
              value={String(result.transitions_evaluated)}
              suffix="checks"
            />
            <StatCard
              icon={<Target size={16} />}
              label="States pruned"
              value={String(result.states_pruned)}
              suffix="discarded"
            />
            <StatCard
              icon={<BarChart3 size={16} />}
              label="States stored"
              value={String(result.total_states_stored)}
              suffix="unique"
            />
          </div>

          {/* ALGORITHM PIPELINE */}
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                  Execution logic
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  From input to optimal state.
                </h2>
              </div>
              <span className="hidden rounded-full border border-white/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-white/55 sm:block">
                Backend result
              </span>
            </div>

            <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {algorithmSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative rounded-xl border border-white/[0.06] bg-[#09090a] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-cyan-400">
                      {step.number}
                    </span>
                    {index < algorithmSteps.length - 1 && (
                      <ArrowRight size={13} className="text-white/55" />
                    )}
                  </div>
                  <h3 className="mt-4 text-[14px] font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-5 text-white/55">
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RECONSTRUCTION */}
          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                  Reconstruction path
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Follow the optimal state backwards.
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-5 text-white/55">
                  The backend stores predecessor information while building
                  states. Once the best final state is known, those decisions
                  are followed to recover the selected strategy sequence.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
                  Optimal result
                </p>
                <p className="mt-1 text-[13px] font-semibold text-white">
                  {result.total_time} min · ${result.total_cost.toFixed(2)}
                </p>
              </div>
            </div>

            {stateRows.length > 0 ? (
              <>
                <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
                  {stateRows.map((row) => (
                    <button
                      key={`${row.stage?.id ?? row.index}-${row.index}`}
                      onClick={() => setActiveState(row.index)}
                      className={`flex min-w-[92px] shrink-0 items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                        activeState === row.index
                          ? "border-cyan-400/20 bg-cyan-400/[0.07]"
                          : "border-white/[0.06] bg-[#09090a] hover:border-white/[0.1]"
                      }`}
                    >
                      <div>
                        <p className="font-mono text-[11px] text-cyan-400">
                          S{row.index + 1}
                        </p>
                        <p className="mt-1 text-[12px] font-medium text-white">
                          {row.stage?.name ?? "Stage"}
                        </p>
                      </div>
                      <ArrowRight size={11} className="text-white/45" />
                    </button>
                  ))}
                </div>

                {active && (
                  <motion.div
                    key={activeState}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
                      <p className="font-mono text-[11px] text-white/45">STAGE</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {active.isInitial
                          ? "Initial state"
                          : active.stage?.name ?? `Stage ${active.index}`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-5">
                      <p className="font-mono text-[11px] text-white/45">DECISION</p>
                      <p className="mt-2 text-sm font-semibold text-cyan-300">
                        {active.isInitial
                          ? "Initial state"
                          : active.strategy?.name ?? "Decision unavailable"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-5">
                      <p className="font-mono text-[11px] text-white/45">TIME</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {active.time} min
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-5">
                      <p className="font-mono text-[11px] text-white/45">COST</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        ${active.cost.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-5">
                      <p className="font-mono text-[11px] text-white/45">SCORE</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {active.score.toFixed(4)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="mt-7 rounded-xl border border-white/[0.06] bg-[#09090a] p-6 text-[13px] text-white/55">
                The backend did not return reconstruction states for this run.
              </div>
            )}
          </div>

          {/* COMPLEXITY + RESULT */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                Complexity model
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Why the state space is bounded.
              </h2>
              <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#070708] p-5">
                <code className="text-sm font-semibold text-cyan-300">
                  O(n × T × B × k)
                </code>
                <p className="mt-3 text-[13px] leading-5 text-white/55">
                  n = pipeline stages, T = deadline range, B = budget range,
                  and k = strategies considered per stage. OptiFlow uses the
                  bounded integer time/cost state space defined by the V1
                  optimization model.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                Final engine decision
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                The DP engine selected this state.
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-5">
                  <p className="font-mono text-[11px] text-white/45">TIME</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {result.total_time}
                    <span className="ml-1 text-[12px] font-normal text-white/55">
                      min
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-5">
                  <p className="font-mono text-[11px] text-white/45">COST</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    ${result.total_cost.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[13px] leading-5 text-white/62">
                Objective score: <span className="font-mono text-cyan-300">{result.score.toFixed(4)}</span> · Deadline {constraints.deadline} min · Budget ${constraints.budget.toFixed(2)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   DP VISUALIZER WORKSPACE
========================================================= */

function DPVisualizerWorkspace({
  stages,
  constraints,
  result,
}: {
  stages: Stage[];
  constraints: Constraints;
  result: StudioOptimizationResult | null;
}) {
  const reconstruction = result?.reconstruction ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const states = useMemo(() => {
    return reconstruction.map((state, index) => {
      const isInitial = index === 0 && state.strategy_id === null;
      const stage = isInitial ? undefined : stages[index - 1];
      const strategy = stage?.strategies.find(
        (item) => item.id === state.strategy_id,
      );

      return {
        ...state,
        index,
        isInitial,
        stage,
        strategy,
      };
    });
  }, [reconstruction, stages]);

  const active = states[activeIndex];
  const previous = states[activeIndex - 1];

  const activeStageChoices = active?.stage?.strategies ?? [];

  const transitionAccepted = activeIndex > 0 && Boolean(active?.strategy);

  function nextStep() {
    setPlaying(false);
    setActiveIndex((current) =>
      Math.min(current + 1, Math.max(states.length - 1, 0)),
    );
  }

  function previousStep() {
    setPlaying(false);
    setActiveIndex((current) => Math.max(current - 1, 0));
  }

  function togglePlay() {
    if (states.length <= 1) return;

    if (playing) {
      setPlaying(false);
      return;
    }

    if (activeIndex >= states.length - 1) {
      setActiveIndex(0);
    }

    setPlaying(true);
  }

  useEffect(() => {
    if (!playing) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= states.length - 1) {
          window.clearInterval(timer);
          setPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 1100);

    return () => window.clearInterval(timer);
  }, [playing, states.length]);

  function resetVisualizer() {
    setPlaying(false);
    setActiveIndex(0);
  }

  if (!result || states.length === 0) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-150px)] max-w-4xl items-center justify-center px-5 py-16">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] text-cyan-300">
            <GitBranch size={25} />
          </div>

          <Eyebrow>04 · Visualize</Eyebrow>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Visualize the DP decision path.
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-6 text-white/62">
            Run the optimization first. The visualizer will then trace the
            backend's reconstructed states from the zero-stage state to the
            optimal final state.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <Eyebrow>04 · Visualize</Eyebrow>

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Trace the DP solution.
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-white/62">
            Step through the states returned by the backend reconstruction.
            Each step shows how one strategy changes the accumulated time,
            cost and objective value on the path to the optimal solution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={previousStep}
            disabled={activeIndex === 0}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 text-[13px] font-medium text-slate-400 transition hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft size={14} />
            Previous
          </button>

          <button
            onClick={togglePlay}
            className="flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-semibold text-[#030711] transition hover:bg-cyan-100"
          >
            {playing ? <span>Pause</span> : <Play size={13} />}
            {playing ? "Pause" : "Play"}
          </button>

          <button
            onClick={nextStep}
            disabled={activeIndex >= states.length - 1}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 text-[13px] font-medium text-slate-400 transition hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
            <ArrowRight size={14} />
          </button>

          <button
            onClick={resetVisualizer}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] text-white/62 transition hover:border-white/[0.12] hover:text-white"
            title="Reset visualizer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/[0.07] bg-[#0c0c0d] p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-400">
              Optimal reconstruction path
            </p>
            <p className="mt-1 text-[13px] text-white/55">
              Backend-generated states · {activeIndex + 1} / {states.length}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-3 py-2">
            <p className="font-mono text-[11px] text-emerald-300">
              {activeIndex === states.length - 1 ? "OPTIMAL STATE" : "TRACING"}
            </p>
          </div>
        </div>

        <div className="mt-7 overflow-x-auto pb-2">
          <div className="flex min-w-max items-center gap-2">
            {states.map((state, index) => {
              const selected = index === activeIndex;
              const complete = index < activeIndex;
              const title = state.isInitial
                ? "INITIAL"
                : state.stage?.name ?? `STAGE ${index}`;

              return (
                <div key={`${state.stage_index}-${index}`} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPlaying(false);
                      setActiveIndex(index);
                    }}
                    className={`relative min-w-[118px] rounded-xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-cyan-400/30 bg-cyan-400/[0.07] shadow-[0_0_35px_rgba(34,211,238,0.06)]"
                        : complete
                          ? "border-emerald-400/10 bg-emerald-400/[0.025]"
                          : "border-white/[0.06] bg-[#09090a] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-cyan-400">
                        S{index}
                      </span>
                      {complete && <Check size={11} className="text-emerald-400" />}
                    </div>
                    <p className="mt-2 text-[12px] font-semibold text-white">
                      {title}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-white/55">
                      {state.isInitial ? "Zero-stage state" : state.strategy?.name ?? "Decision"}
                    </p>
                  </button>

                  {index < states.length - 1 && (
                    <ArrowRight size={13} className="shrink-0 text-white/55" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                Current state
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {active?.isInitial ? "Initial state" : active?.stage?.name}
              </h2>
            </div>
            <span className="font-mono text-[11px] text-white/55">
              S{activeIndex}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Layers3 size={15} />}
              label="Stage index"
              value={String(active?.stage_index ?? 0)}
            />
            <StatCard
              icon={<Clock3 size={15} />}
              label="Accumulated time"
              value={`${active?.time ?? 0}`}
              suffix="min"
            />
            <StatCard
              icon={<DollarSign size={15} />}
              label="Accumulated cost"
              value={`$${(active?.cost ?? 0).toFixed(2)}`}
            />
            <StatCard
              icon={<Target size={15} />}
              label="Objective score"
              value={(active?.score ?? 0).toFixed(4)}
            />
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#070708] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              State interpretation
            </p>
            <p className="mt-3 text-[13px] leading-6 text-slate-400">
              {active?.isInitial
                ? "This is the zero-stage state: no strategy has been selected, so accumulated time and cost are both zero."
                : `After selecting ${active?.strategy?.name ?? "this strategy"} for ${active?.stage?.name ?? "the current stage"}, the state reaches ${active?.time ?? 0} minutes and $${(active?.cost ?? 0).toFixed(2)}.`}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
            Transition inspector
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {active?.isInitial ? "Waiting for first decision" : "How this state was reached"}
          </h2>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-white/[0.06] bg-[#09090a] p-4">
              <p className="font-mono text-[11px] text-white/45">
                PREVIOUS STATE
              </p>
              <p className="mt-2 text-[13px] font-medium text-white">
                {previous ? `S${previous.index} · ${previous.time} min · $${previous.cost.toFixed(2)}` : "None — initial state"}
              </p>
            </div>

            <div className="flex justify-center text-white/45">
              ↓
            </div>

            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4">
              <p className="font-mono text-[11px] text-cyan-400">
                SELECTED TRANSITION
              </p>
              <p className="mt-2 text-[13px] font-medium text-cyan-300">
                {active?.isInitial
                  ? "Initialize DP state"
                  : `${active?.stage?.name} → ${active?.strategy?.name ?? "Selected strategy"}`}
              </p>
              {!active?.isInitial && previous && (
                <p className="mt-2 text-[12px] leading-5 text-white/55">
                  +{(active.time - previous.time).toFixed(0)} min · +${(active.cost - previous.cost).toFixed(2)}
                </p>
              )}
            </div>

            <div className={`flex items-center gap-2 rounded-xl border p-4 ${
              transitionAccepted
                ? "border-emerald-400/10 bg-emerald-400/[0.025]"
                : "border-white/[0.06] bg-[#09090a]"
            }`}>
              <Check size={14} className={transitionAccepted ? "text-emerald-400" : "text-white/45"} />
              <span className="text-[13px] text-slate-400">
                {active?.isInitial ? "Valid starting state" : "Selected transition is present in the reconstructed optimal path"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
              Strategy choices at this stage
            </p>
            <p className="mt-1 text-[13px] text-white/55">
              Input strategies available to the backend for the active stage.
            </p>
          </div>
          <span className="font-mono text-[11px] text-white/45">
            {activeStageChoices.length} choices
          </span>
        </div>

        {activeStageChoices.length > 0 ? (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {activeStageChoices.map((strategy) => {
              const selected = strategy.id === active?.strategy_id;

              return (
                <div
                  key={strategy.id}
                  className={`rounded-xl border p-4 transition ${
                    selected
                      ? "border-cyan-400/25 bg-cyan-400/[0.05]"
                      : "border-white/[0.06] bg-[#09090a]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-[13px] font-semibold ${selected ? "text-cyan-300" : "text-white"}`}>
                      {strategy.name}
                    </p>
                    {selected && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                        selected
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <span className="rounded-lg border border-white/[0.05] px-2.5 py-1.5 font-mono text-[11px] text-white/62">
                      {strategy.time} min
                    </span>
                    <span className="rounded-lg border border-white/[0.05] px-2.5 py-1.5 font-mono text-[11px] text-white/62">
                      ${strategy.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 text-[13px] text-white/55">
            The initial state has no stage-level strategy choices.
          </p>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
              DP reconstruction table
            </p>
            <p className="mt-1 text-[13px] text-white/55">
              The exact state sequence returned by the optimization backend.
            </p>
          </div>
          <span className="font-mono text-[11px] text-white/45">
            {constraints.deadline} min · ${constraints.budget.toFixed(2)}
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['STATE', 'STAGE', 'DECISION', 'TIME', 'COST', 'SCORE'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-mono text-[11px] tracking-[0.16em] text-white/45">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {states.map((state, index) => (
                <tr
                  key={`${state.stage_index}-${index}`}
                  onClick={() => {
                    setPlaying(false);
                    setActiveIndex(index);
                  }}
                  className={`cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.02] ${
                    index === activeIndex ? "bg-cyan-400/[0.035]" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-cyan-400">S{index}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-white">
                    {state.isInitial ? "Initial" : state.stage?.name}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-400">
                    {state.isInitial ? "—" : state.strategy?.name}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-white/62">
                    {state.time} min
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-white/62">
                    ${state.cost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-cyan-300">
                    {state.score.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0d] p-5">
          <p className="font-mono text-[11px] tracking-[0.18em] text-cyan-400">
            STATE
          </p>
          <p className="mt-3 text-[13px] leading-5 text-white/62">
            {result.dp_model.state}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0d] p-5">
          <p className="font-mono text-[11px] tracking-[0.18em] text-cyan-400">
            TRANSITION
          </p>
          <p className="mt-3 text-[13px] leading-5 text-white/62">
            {result.dp_model.transition}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0d] p-5">
          <p className="font-mono text-[11px] tracking-[0.18em] text-cyan-400">
            CONSTRAINTS
          </p>
          <div className="mt-3 space-y-2">
            {result.dp_model.constraints.map((constraint) => (
              <p key={constraint} className="text-[12px] text-white/62">
                ✓ {constraint}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   SIMULATION WORKSPACE
========================================================= */

function SimulationWorkspace({
  stages,
  result,
}: {
  stages: Stage[];
  result: StudioOptimizationResult | null;
}) {
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function startSimulation() {
    if (running || stages.length === 0) {
      return;
    }

    setRunning(true);
    setCurrent(-1);
    setSimulationComplete(false);
    timers.current.forEach(window.clearTimeout);
    timers.current = [];

    // Each stage runs for a duration proportional to its selected strategy time.
    let elapsed = 400;
    stages.forEach((stage, index) => {
      const selectedId = result?.selections?.[stage.id] ?? stage.strategies[0]?.id;
      const strategy = stage.strategies.find((item) => item.id === selectedId) ?? stage.strategies[0];
      timers.current.push(
        window.setTimeout(() => {
          setCurrent(index);
        }, elapsed),
      );
      elapsed += 700 + Math.min(1400, (strategy?.time ?? 5) * 90);
    });
    timers.current.push(
      window.setTimeout(() => {
        setCurrent(-1);
        setSimulationComplete(true);
        setRunning(false);
      }, elapsed + 300),
    );
  }

  const timelineComplete = simulationComplete && !running;
  const completedCount = timelineComplete ? stages.length : Math.max(0, current);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <Eyebrow>04 · Simulate</Eyebrow>

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Watch the selected strategy execute.
          </h1>

          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-white/62">
            Simulation turns the reconstructed optimal strategy into a
            visual execution sequence. This is not the optimization
            itself — it is the execution view of the selected result.
          </p>
        </div>

        <PrimaryButton
          onClick={startSimulation}
          icon={
            running ? (
              <Sparkles size={15} />
            ) : (
              <Play size={15} />
            )
          }
        >
          {running ? "Simulation Running" : "Start Simulation"}
        </PrimaryButton>
      </div>

      {!result && (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-violet-300/25 bg-violet-400/[0.06] px-4 py-3.5 text-[14px] leading-6 text-violet-50">
          <DemoBadge>Simulation</DemoBadge>
          <span>No optimization result yet — this runs each stage's first strategy. Run the optimization to simulate the optimal plan.</span>
        </div>
      )}

      <NeonFrame active={running} radius={26} className="of-surface relative mt-8 overflow-hidden" style={{ borderRadius: 26 }}>
        <div className="relative h-[360px] sm:h-[420px]">
          <div className="of-grid-floor opacity-60" aria-hidden="true" />
          <Suspense fallback={null}>
            <PipelineModulesScene
              className="absolute inset-0"
              stages={stages}
              mode="simulate"
              activeIndex={running ? current : -1}
              completed={completedCount}
              selections={result?.selections}
              label="Simulation: the camera follows the pipeline as each selected strategy executes."
            />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-5 top-4 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[12px] tracking-[0.2em] text-cyan-100/80">3D EXECUTION SEQUENCE</span>
            <span className="font-mono text-[12px] tracking-[0.16em] text-white/60">
              {timelineComplete ? "ALL STAGES COMPLETE" : running && current >= 0 ? `EXECUTING ${stages[current]?.name}` : "READY"}
            </span>
          </div>
        </div>
      </NeonFrame>

      <div className="mt-10 rounded-3xl border border-white/[0.07] bg-[#0c0c0d] p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
              Execution timeline
            </p>

            <p className="mt-1 text-[13px] text-white/55">
              Reconstructed strategy sequence
            </p>
          </div>

          <span className="font-mono text-[11px] text-white/45">
            {timelineComplete
              ? `${stages.length}/${stages.length}`
              : current >= 0
                ? `${current + 1}/${stages.length}`
                : "READY"}
          </span>
        </div>

        <div className="space-y-3">
          {stages.map((stage, index) => {
            const selectedId =
              result?.selections?.[stage.id] ??
              stage.strategies[0]?.id;

            const strategy =
              stage.strategies.find(
                (item) => item.id === selectedId,
              ) ?? stage.strategies[0];

            const active =
              current === index &&
              !timelineComplete;

            const completed =
              timelineComplete ||
              current > index;

            return (
              <motion.div
                key={stage.id}
                animate={{
                  scale: active ? 1.015 : 1,
                  opacity:
                    current === -1 ||
                    completed ||
                    active
                      ? 1
                      : 0.45,
                }}
                className={`relative overflow-hidden rounded-2xl border p-5 ${
                  active
                    ? "border-cyan-400/25 bg-cyan-400/[0.05]"
                    : completed
                      ? "border-emerald-400/10 bg-emerald-400/[0.025]"
                      : "border-white/[0.06] bg-[#09090a]"
                }`}
              >
                {active && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                    }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/[0.06] to-transparent"
                  />
                )}

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-[11px] ${
                        active
                          ? "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-300"
                          : completed
                            ? "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-300"
                            : "border-white/[0.06] text-white/45"
                      }`}
                    >
                      {completed ? (
                        <Check size={14} />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </div>

                    <div>
                      <p className="text-[14px] font-semibold text-white">
                        {stage.name}
                      </p>

                      <p className="mt-1 text-[12px] text-white/55">
                        {strategy?.name ?? "No strategy"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:ml-auto">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 py-2 font-mono text-[11px] text-white/62">
                      <Clock3 size={10} />
                      {strategy?.time ?? 0} min
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.05] px-3 py-2 font-mono text-[11px] text-white/62">
                      <DollarSign size={10} />$
                      {strategy?.cost.toFixed(2) ?? "0.00"}
                    </span>

                    {active && (
                      <span className="font-mono text-[11px] uppercase tracking-widest text-cyan-300">
                        Executing
                      </span>
                    )}

                    {completed && (
                      <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Clock3 size={16} />}
          label="Selected execution time"
          value={`${result?.total_time ?? 0}`}
          suffix="minutes"
        />

        <StatCard
          icon={<DollarSign size={16} />}
          label="Selected execution cost"
          value={`$${(result?.total_cost ?? 0).toFixed(2)}`}
        />

        <StatCard
          icon={<Check size={16} />}
          label="Execution state"
          value={
            timelineComplete
              ? "Complete"
              : running
                ? "Running"
                : "Ready"
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   BENCHMARK LAB WORKSPACE
========================================================= */





interface BenchmarkRow {
  stages: number;
  configurations: number;
  results: Array<{
    name: string;
    shortName: string;
    ms: number;
    operations: number;
  }>;
}

function cents(value: number) {
  return Math.round(value * 100);
}

function benchmarkScore(
  time: number,
  costCents: number,
  constraints: Constraints,
) {
  const deadline = Math.max(constraints.deadline, 1);
  const budget = Math.max(cents(constraints.budget), 1);

  if (constraints.objective === "time") return time / deadline;
  if (constraints.objective === "cost") return costCents / budget;

  return (time / deadline) * 0.65 + (costCents / budget) * 0.35;
}

function decisionSpace(stages: Stage[]) {
  return stages.reduce(
    (total, stage) => total * stage.strategies.length,
    1,
  );
}

function runBruteForceBenchmark(
  stages: Stage[],
  constraints: Constraints,
) {
  let operations = 0;
  let best = Number.POSITIVE_INFINITY;
  const budgetCents = cents(constraints.budget);

  function visit(index: number, time: number, costCents: number) {
    operations += 1;

    if (time > constraints.deadline || costCents > budgetCents) {
      return;
    }

    if (index === stages.length) {
      best = Math.min(
        best,
        benchmarkScore(time, costCents, constraints),
      );
      return;
    }

    for (const strategy of stages[index].strategies) {
      visit(
        index + 1,
        time + strategy.time,
        costCents + cents(strategy.cost),
      );
    }
  }

  visit(0, 0, 0);
  return { operations, best };
}

function runMemoizedBenchmark(
  stages: Stage[],
  constraints: Constraints,
) {
  const memo = new Map<string, number>();
  let operations = 0;
  const budgetCents = cents(constraints.budget);

  function solve(index: number, time: number, costCents: number): number {
    operations += 1;

    if (time > constraints.deadline || costCents > budgetCents) {
      return Number.POSITIVE_INFINITY;
    }

    if (index === stages.length) {
      return benchmarkScore(time, costCents, constraints);
    }

    const key = `${index}|${time}|${costCents}`;
    const cached = memo.get(key);

    if (cached !== undefined) {
      return cached;
    }

    let best = Number.POSITIVE_INFINITY;

    for (const strategy of stages[index].strategies) {
      best = Math.min(
        best,
        solve(
          index + 1,
          time + strategy.time,
          costCents + cents(strategy.cost),
        ),
      );
    }

    memo.set(key, best);
    return best;
  }

  const best = solve(0, 0, 0);
  return { operations, best, states: memo.size };
}

function runTabulationBenchmark(
  stages: Stage[],
  constraints: Constraints,
) {
  const budgetCents = cents(constraints.budget);
  let operations = 0;
  let states = new Map<string, number>();
  states.set("0|0", 0);

  for (let index = 0; index < stages.length; index += 1) {
    const next = new Map<string, number>();

    for (const [key] of states) {
      const [timeText, costText] = key.split("|");
      const time = Number(timeText);
      const costCents = Number(costText);

      for (const strategy of stages[index].strategies) {
        operations += 1;

        const nextTime = time + strategy.time;
        const nextCost = costCents + cents(strategy.cost);

        if (
          nextTime > constraints.deadline ||
          nextCost > budgetCents
        ) {
          continue;
        }

        const nextKey = `${nextTime}|${nextCost}`;
        const score = benchmarkScore(
          nextTime,
          nextCost,
          constraints,
        );

        const existing = next.get(nextKey);

        if (existing === undefined || score < existing) {
          next.set(nextKey, score);
        }
      }
    }

    states = next;
  }

  let best = Number.POSITIVE_INFINITY;
  for (const score of states.values()) {
    best = Math.min(best, score);
  }

  return { operations, best, states: states.size };
}

function BenchmarkWorkspace({
  baseStages,
  baseConstraints,
}: {
  baseStages: Stage[];
  baseConstraints: Constraints;
}) {
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [selectedSize, setSelectedSize] = useState(9);

  const benchmarkSizes = [5, 7, 9, 11, 13, 15];
  const benchmarkRepetitions = 5;

  function createBenchmarkStages(count: number): Stage[] {
    const templates = baseStages.length
      ? baseStages
      : INITIAL_STAGES;

    return Array.from({ length: count }, (_, index) => {
      const template = templates[index % templates.length];

      return {
        ...template,
        id: `benchmark-stage-${index + 1}`,
        name: `Stage ${String(index + 1).padStart(2, "0")}`,
        strategies: template.strategies.map((strategy) => ({
          ...strategy,
          id: `benchmark-stage-${index + 1}-${strategy.id}`,
        })),
      };
    });
  }

  function constraintsForSize(count: number): Constraints {
    return {
      ...baseConstraints,
      deadline: count * 6,
      budget: Number((count * 0.45).toFixed(2)),
      objective: "balanced",
    };
  }

  function median(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  function measureAlgorithm(
    name: string,
    stages: Stage[],
    constraints: Constraints,
  ) {
    const samples: number[] = [];
    let operations = 0;

    const execute = () => {
      if (name === "Brute Force") {
        return runBruteForceBenchmark(stages, constraints);
      }

      if (name === "Memoization") {
        return runMemoizedBenchmark(stages, constraints);
      }

      return runTabulationBenchmark(stages, constraints);
    };

    // Warm up once so the first JIT pass does not dominate the measurements.
    execute();

    for (let run = 0; run < benchmarkRepetitions; run += 1) {
      const start = performance.now();
      const result = execute();
      samples.push(performance.now() - start);
      operations = result.operations;
    }

    return {
      name,
      shortName: name,
      ms: Number(median(samples).toFixed(3)),
      operations,
    };
  }

  function runBenchmark() {
    if (running) return;

    setRunning(true);

    window.setTimeout(() => {
      const nextRows: BenchmarkRow[] = [];

      for (const size of benchmarkSizes) {
        const stages = createBenchmarkStages(size);
        const constraints = constraintsForSize(size);
        const configurations = decisionSpace(stages);

        const results = [
          measureAlgorithm("Brute Force", stages, constraints),
          measureAlgorithm("Memoization", stages, constraints),
          measureAlgorithm("Tabulation DP", stages, constraints),
        ];

        nextRows.push({
          stages: size,
          configurations,
          results,
        });
      }

      setRows(nextRows);
      setSelectedSize(9);
      setRunning(false);
    }, 50);
  }

  const selectedRow =
    rows.find((row) => row.stages === selectedSize) ?? rows[rows.length - 1];

  const winner = selectedRow
    ? selectedRow.results.reduce((best, current) =>
        current.ms < best.ms ? current : best,
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <Eyebrow>06 · Benchmark</Eyebrow>

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Measure the optimization advantage.
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-white/62">
            Run the same bounded pipeline problem through brute force,
            memoization and tabulation. Each algorithm is warmed up and then
            measured repeatedly; the displayed runtime is the median, while
            operation counts provide the primary algorithmic comparison.
          </p>
        </div>

        <PrimaryButton
          onClick={runBenchmark}
          icon={running ? <Sparkles size={15} /> : <FlaskConical size={15} />}
        >
          {running ? "Running Benchmark..." : "Run Benchmark"}
        </PrimaryButton>
      </div>

      <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
              Benchmark model
            </p>
            <p className="mt-2 text-[13px] leading-5 text-white/62">
              Each run uses the same generated stages, deadline, budget and
              balanced objective for every algorithm. Runtime is measured on
              this browser; operation counts show the algorithmic work.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#09090a] px-4 py-3">
            <p className="font-mono text-[11px] text-white/45">OBJECTIVE</p>
            <p className="mt-1 text-[13px] text-cyan-300">Balanced — Time + Cost</p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] text-cyan-300">
            <FlaskConical size={22} />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Benchmark the algorithms on the same problem.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-white/55">
            The benchmark measures JavaScript execution time and algorithmic
            operations for increasing decision spaces.
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={runBenchmark}>Run Benchmark</PrimaryButton>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((row) => (
              <button
                key={row.stages}
                onClick={() => setSelectedSize(row.stages)}
                className={`rounded-2xl border p-5 text-left transition ${
                  selectedSize === row.stages
                    ? "border-cyan-400/20 bg-cyan-400/[0.05]"
                    : "border-white/[0.07] bg-[#0c0c0d] hover:border-white/[0.12]"
                }`}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
                  PIPELINE SIZE
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {row.stages}
                </p>
                <p className="mt-1 text-[12px] text-white/55">
                  {row.configurations.toLocaleString()} configurations
                </p>
              </button>
            ))}
          </div>

          {selectedRow && (
            <>
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                      Runtime comparison
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      {selectedRow.stages} stages · {selectedRow.configurations.toLocaleString()} configurations
                    </h2>
                  </div>
                  {winner && (
                    <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-4 py-3">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
                        Fastest measured
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-white">
                        {winner.name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-7 space-y-3">
                  {selectedRow.results.map((item, index) => {
                    const max = Math.max(...selectedRow.results.map((x) => x.ms), 0.001);
                    const width = Math.max((item.ms / max) * 100, 3);

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.07 }}
                        className="rounded-xl border border-white/[0.05] bg-[#09090a] p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[13px] font-semibold text-white">
                              {item.name}
                            </p>
                            <p className="mt-1 font-mono text-[11px] text-white/55">
                              {item.operations.toLocaleString()} operations
                            </p>
                          </div>
                          <p className="font-mono text-[13px] text-cyan-300">
                            {item.ms.toFixed(3)} ms
                          </p>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.04]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 0.55, delay: index * 0.07 }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400/70 via-blue-400/70 to-violet-400/70"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300">
                  Benchmark note
                </p>
                <p className="mt-2 text-[13px] leading-5 text-white/62">
                  Browser runtime depends on hardware, background activity and
                  JavaScript JIT behavior. Treat the median runtime as an
                  empirical measurement for this machine and use operation
                  counts plus scaling trends as the primary algorithmic evidence.
                </p>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                {[
                  [
                    "BRUTE FORCE",
                    "Explores complete strategy combinations. Its search space grows multiplicatively with every additional stage.",
                  ],
                  [
                    "MEMOIZATION",
                    "Reuses recursive subproblems identified by stage, accumulated time and accumulated cost.",
                  ],
                  [
                    "TABULATION DP",
                    "Builds reachable bounded states iteratively and avoids recomputing equivalent intermediate states.",
                  ],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/[0.06] bg-[#0c0c0d] p-5"
                  >
                    <p className="font-mono text-[11px] tracking-[0.18em] text-cyan-400">
                      {title}
                    </p>
                    <p className="mt-3 text-[13px] leading-5 text-white/62">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   RESULTS WORKSPACE
========================================================= */

function ResultsWorkspace({
  stages,
  constraints,
  result,
  onRun,
}: {
  stages: Stage[];
  constraints: Constraints;
  result: StudioOptimizationResult | null;
  onRun: () => void;
}) {
  const [replay, setReplay] = useState(false);

  if (!result) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-150px)] max-w-4xl items-center justify-center px-5 py-16">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] text-cyan-300">
            <Target size={25} />
          </div>

          <Eyebrow>05 · Results</Eyebrow>

          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Your optimal solution will appear here.
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-6 text-white/62">
            Define your pipeline and constraints, then run the
            optimization engine. OptiFlow will reconstruct the best
            feasible strategy sequence and explain the result here.
          </p>

          <div className="mt-8">
            <PrimaryButton onClick={onRun}>
              Run Optimization
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  const timeValid = result.time <= constraints.deadline;
  const costValid = result.cost <= constraints.budget;

  // Explain each decision against the stage's own alternatives.
  const decisionNotes = stages.map((stage) => {
    const chosen = stage.strategies.find((item) => item.id === result.selections[stage.id]);
    if (!chosen) return null;
    const fastest = stage.strategies.reduce((a, b) => (b.time < a.time ? b : a));
    const cheapest = stage.strategies.reduce((a, b) => (b.cost < a.cost ? b : a));
    let reason: string;
    if (stage.strategies.length === 1) reason = "only available strategy";
    else if (chosen.id === fastest.id && chosen.id === cheapest.id) reason = "fastest and cheapest option";
    else if (chosen.id === fastest.id) reason = `fastest option — ${(chosen.cost - cheapest.cost).toFixed(2)} more than the cheapest (${cheapest.name}), worth it under the objective`;
    else if (chosen.id === cheapest.id) reason = `cheapest option — ${chosen.time - fastest.time} min slower than the fastest (${fastest.name}), still within the deadline`;
    else reason = `balanced choice between ${fastest.name} (${fastest.time}m) and ${cheapest.name} ($${cheapest.cost.toFixed(2)})`;
    return { stage: stage.name, strategy: chosen.name, reason };
  }).filter((note): note is { stage: string; strategy: string; reason: string } => note !== null);

  const timeSlack = constraints.deadline - result.time;
  const costSlack = constraints.budget - result.cost;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <Eyebrow>05 · Results</Eyebrow>

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Optimal configuration.
          </h1>

          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-white/62">
            OptiFlow reconstructed the selected strategy for every
            pipeline stage and evaluated it against your constraints.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-4 py-3">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />

            <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
              Feasible solution
            </span>
          </div>
        </div>
      </div>

      <NeonFrame active radius={26} className="of-surface relative mt-8 overflow-hidden" style={{ borderRadius: 26 }}>
        <div className="relative h-[340px] sm:h-[400px]">
          <div className="of-grid-floor opacity-60" aria-hidden="true" />
          <Suspense fallback={null}>
            <PipelineModulesScene
              className="absolute inset-0"
              stages={stages}
              mode="results"
              completed={stages.length}
              selections={result.selections}
              reconstruct={replay}
              label="Reconstruction of the optimal path from the final state back to S0."
            />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-5 top-4 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[12px] tracking-[0.2em] text-cyan-100/80">OPTIMAL SOLUTION · RECONSTRUCTED PATH</span>
            <DemoBadge kind="live">Backend result</DemoBadge>
          </div>
          <button
            type="button"
            onClick={() => setReplay((value) => !value)}
            className="absolute bottom-4 right-4 inline-flex h-9 items-center gap-2 rounded-lg border border-white/12 bg-black/60 px-3 text-[13px] text-white/80 backdrop-blur transition hover:border-violet-300/50 hover:text-white"
          >
            <RotateCcw size={14} /> Replay reconstruction
          </button>
        </div>
        <div className="relative z-[5] grid grid-cols-2 gap-3 border-t border-white/[0.07] p-5 sm:grid-cols-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Total time</div>
            <div className="mt-1 font-heading text-[28px] font-bold tabular-nums text-white">{result.time} <span className="text-[14px] text-white/55">min</span></div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Total cost</div>
            <div className="mt-1 font-heading text-[28px] font-bold tabular-nums text-white">${result.cost.toFixed(2)}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Objective</div>
            <div className="mt-1 text-[16px] font-semibold text-white">{objectiveLabel(constraints.objective)}</div>
            <div className="font-mono text-[12px] text-white/55">score {result.score.toFixed(4)}</div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Feasibility</div>
            <div className={`mt-1 text-[16px] font-semibold ${timeValid && costValid ? "text-emerald-200" : "text-rose-200"}`}>
              {timeValid && costValid ? "Feasible" : "Constraint violated"}
            </div>
            <div className="font-mono text-[12px] text-white/55">{timeSlack} min · ${costSlack.toFixed(2)} headroom</div>
          </div>
        </div>
      </NeonFrame>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Clock3 size={16} />}
          label="Total time"
          value={`${result.time}`}
          suffix="minutes"
        />

        <StatCard
          icon={<DollarSign size={16} />}
          label="Total cost"
          value={`$${result.cost.toFixed(2)}`}
        />

        <StatCard
          icon={<Layers3 size={16} />}
          label="DP states generated"
          value={String(result.states_generated)}
        />

        <StatCard
          icon={<Activity size={16} />}
          label="Transitions evaluated"
          value={String(result.transitions_evaluated)}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
                Selected strategy
              </p>

              <p className="mt-1 text-[13px] text-white/55">
                The strategy reconstructed from the optimal state.
              </p>
            </div>

            <Sparkles size={16} className="text-cyan-300" />
          </div>

          <div className="space-y-2">
            {stages.map((stage, index) => {
              const strategyId =
                result.selections[stage.id];

              const strategy =
                stage.strategies.find(
                  (item) => item.id === strategyId,
                ) ?? stage.strategies[0];

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.06,
                  }}
                  className="flex flex-col gap-4 rounded-xl border border-white/[0.05] bg-[#09090a] px-4 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-cyan-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="text-[13px] font-semibold text-white">
                      {stage.name}
                    </span>
                  </div>

                  <ArrowRight
                    size={13}
                    className="hidden text-white/55 sm:block"
                  />

                  <span className="text-[13px] text-cyan-300">
                    {strategy?.name}
                  </span>

                  <div className="flex gap-2 sm:ml-auto">
                    <span className="rounded-lg border border-white/[0.05] px-2.5 py-1.5 font-mono text-[11px] text-white/55">
                      {strategy?.time} min
                    </span>

                    <span className="rounded-lg border border-white/[0.05] px-2.5 py-1.5 font-mono text-[11px] text-white/55">
                      ${strategy?.cost.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
              Constraint checks
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#09090a] p-4">
                <div>
                  <p className="text-[13px] font-medium text-white">
                    Deadline
                  </p>

                  <p className="mt-1 text-[11px] text-white/55">
                    {result.time} / {constraints.deadline} minutes
                  </p>
                </div>

                <Check
                  size={16}
                  className={
                    timeValid
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#09090a] p-4">
                <div>
                  <p className="text-[13px] font-medium text-white">
                    Budget
                  </p>

                  <p className="mt-1 text-[11px] text-white/55">
                    ${result.cost.toFixed(2)} / $
                    {constraints.budget.toFixed(2)}
                  </p>
                </div>

                <Check
                  size={16}
                  className={
                    costValid
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
              Why this solution?
            </p>

            <div className="mt-5 space-y-4">
              {[
                `Total time ${result.time} min is ${timeSlack} min under the ${constraints.deadline}-min deadline; total cost $${result.cost.toFixed(2)} is $${costSlack.toFixed(2)} under the $${constraints.budget.toFixed(2)} budget.`,
                `Among all feasible final states, this one has the lowest ${objectiveLabel(constraints.objective).toLowerCase()} score (${result.score.toFixed(4)}).`,
                `${result.states_pruned} transitions were pruned for breaking a constraint; ${result.states_generated} feasible states were generated from ${result.totalPossibleConfigurations.toLocaleString()} possible configurations.`,
                ...decisionNotes.map((note) => `${note.stage} → ${note.strategy}: ${note.reason}.`),
              ].map((text, index) => (
                <div
                  key={text}
                  className="flex gap-3"
                >
                  <span className="font-mono text-[11px] text-cyan-400">
                    0{index + 1}
                  </span>

                  <p className="text-[12px] leading-5 text-white/62">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/45">
              OBJECTIVE
            </p>

            <p className="mt-2 text-[13px] text-white">
              {objectiveLabel(constraints.objective)}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/45">
              STATES PRUNED
            </p>

            <p className="mt-2 text-[13px] text-white">
              {result.states_pruned}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/45">
              DECISION SPACE
            </p>

            <p className="mt-2 text-[13px] text-white">
              {result.totalPossibleConfigurations.toLocaleString()} configurations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function OptiFlowStudioPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<StudioMode>("landing");

  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>("pipeline");

  const [stages, setStages] =
    useState<Stage[]>(INITIAL_STAGES);

  const [constraints, setConstraints] =
    useState<Constraints>(INITIAL_CONSTRAINTS);

  const [result, setResult] =
    useState<StudioOptimizationResult | null>(null);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("optiflow_active_pipeline");
      if (!raw) return;

      const saved = JSON.parse(raw) as SavedPipelineRecord;
      if (saved?.stages?.length) {
        setStages(saved.stages);
        setConstraints(saved.constraints);
        setResult(null);
        setActivePipelineId(saved.id ?? null);
      }

      localStorage.removeItem("optiflow_active_pipeline");
    } catch {
      localStorage.removeItem("optiflow_active_pipeline");
    }
  }, []);

  const [optimizationError, setOptimizationError] =
    useState<string | null>(null);

  async function runOptimization() {
    if (isOptimizing) return;

    setOptimizationError(null);
    setIsOptimizing(true);

    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        objective: Objective;
        total_time?: number;
        total_cost?: number;
        score?: number;
        selected_strategies?: string[];
        stage_results?: Array<{
          stage_id: string;
          stage_name: string;
          strategy_id: string;
          strategy_name: string;
          time: number;
          cost: number;
        }>;
        states_generated?: number;
        transitions_evaluated?: number;
        states_pruned?: number;
        total_states_stored?: number;
        reconstruction?: Array<{
          stage_index: number;
          time: number;
          cost: number;
          score: number;
          strategy_id: string | null;
        }>;
        dp_model?: {
          state: string;
          transition: string;
          constraints: string[];
          objective: Objective;
        };
      }>("/optimization/run", {
        method: "POST",
        body: JSON.stringify({
          stages: stages.map((stage) => ({
            id: stage.id,
            name: stage.name,
            strategies: stage.strategies.map((strategy) => ({
              id: strategy.id,
              name: strategy.name,
              time: strategy.time,
              cost: strategy.cost,
            })),
          })),
          deadline: constraints.deadline,
          budget: constraints.budget,
          objective: constraints.objective,
        }),
      });

      if (!response.success) {
        throw new Error(
          response.message ||
            "No feasible configuration was found.",
        );
      }

      const selectedStrategies =
        response.selected_strategies ?? [];

      const selections: Record<string, string> = {};

      stages.forEach((stage, index) => {
        const selectedId = selectedStrategies[index];

        if (selectedId) {
          selections[stage.id] = selectedId;
        }
      });

      const totalPossibleConfigurations =
        stages.reduce(
          (total, stage) =>
            total * stage.strategies.length,
          1,
        );

      const normalizedResult: StudioOptimizationResult = {
        success: response.success,
        message: response.message,
        objective: response.objective,
        total_time: response.total_time ?? 0,
        total_cost: response.total_cost ?? 0,
        score: response.score ?? 0,
        selected_strategies: selectedStrategies,
        stage_results: response.stage_results ?? [],
        states_generated:
          response.states_generated ?? 0,
        transitions_evaluated:
          response.transitions_evaluated ?? 0,
        states_pruned:
          response.states_pruned ?? 0,
        total_states_stored:
          response.total_states_stored ?? 0,
        reconstruction:
          response.reconstruction ?? [],
        dp_model:
          response.dp_model ?? {
            state: "DP[i][time][cost]",
            transition:
              "Select exactly one strategy for the next stage.",
            constraints: [
              "time <= deadline",
              "cost <= budget",
            ],
            objective: constraints.objective,
          },
        selections,
        time: response.total_time ?? 0,
        cost: response.total_cost ?? 0,
        totalPossibleConfigurations,
      };

      setResult(normalizedResult);
      const savedPipeline = savePipelineRecord(
        stages,
        constraints,
        activePipelineId,
      );
      setActivePipelineId(savedPipeline.id);
      saveOptimizationHistory(stages, constraints, normalizedResult);
      setActiveSection("results");
    } catch (error) {
      setOptimizationError(
        error instanceof Error
          ? error.message
          : "Optimization failed. Please try again.",
      );
    } finally {
      setIsOptimizing(false);
    }
  }

  function saveCurrentPipeline() {
    try {
      const saved = savePipelineRecord(stages, constraints, activePipelineId);
      setActivePipelineId(saved.id);

      // Also make the current snapshot immediately available to
      // the Studio restore flow without changing the saved-list data.
      writeStorage("optiflow_active_pipeline", saved);

      setSaveNotice("Saved successfully · My Pipeline");
      window.setTimeout(() => setSaveNotice(null), 2600);
    } catch (error) {
      console.error("OptiFlow save failed:", error);

      setSaveNotice(
        error instanceof Error
          ? `Save failed · ${error.message}`
          : "Save failed · Please try again.",
      );

      window.setTimeout(() => setSaveNotice(null), 3200);
    }
  }

  function resetStudio() {
    // Restore a fresh copy of the default pipeline.
    setStages(structuredClone(INITIAL_STAGES));

    // Restore the default optimization constraints.
    setConstraints({ ...INITIAL_CONSTRAINTS });

    // Clear all previous optimization output.
    setResult(null);

    // Clear any previous optimization error.
    setOptimizationError(null);

    // Ensure the workspace is no longer running.
    setIsOptimizing(false);

    // Return to the Pipeline section.
    setActiveSection("pipeline");

    // Reset means a fresh working configuration.
    // Prevent the next Save from overwriting the previously
    // opened pipeline.
    setActivePipelineId(null);
    localStorage.removeItem("optiflow_active_pipeline");

    // Clear any previous save notification.
    setSaveNotice(null);
  }

  function enterStudio() {
    setMode("introduction");
  }

  function enterPipeline() {
    setMode("workspace");
    setActiveSection("pipeline");
  }

  if (mode === "landing") {
    /*
      This is intentionally minimal.

      When the user clicks "OptiFlow Studio" from the dashboard,
      they should NOT immediately see a giant editor.

      They see the Studio entry point first.
    */

    return (
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <StudioBackground />

        {/* 3D preview of the pipeline you are about to optimize */}
        <div className="absolute inset-x-0 bottom-0 top-[38%] z-[1] opacity-90 sm:top-[42%]">
          <Suspense fallback={null}>
            <PipelineModulesScene
              className="absolute inset-0"
              stages={stages}
              mode="build"
              label="Preview of your current pipeline as 3D modules."
            />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="absolute left-5 top-5 z-20 inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 text-[13px] text-white/70 backdrop-blur transition hover:border-cyan-300/40 hover:text-white"
        >
          <ArrowLeft size={15} />
          Command Center
        </button>

        <div className="relative z-10 flex min-h-[46vh] items-end justify-center px-6 pt-24 sm:min-h-[50vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="mb-6 flex justify-center">
              <BrandMark />
            </div>

            <p className="of-eyebrow justify-center">Pipeline Optimization Workbench</p>

            <h1 className="mt-5 font-display text-[clamp(2.6rem,7vw,5.2rem)] font-black leading-[0.95] tracking-[0.04em] text-white">
              OPTIFLOW <span className="of-gradient-text">STUDIO</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-7 text-white/65">
              Define, constrain and optimize software pipeline execution strategies using Dynamic Programming.
            </p>

            <div className="mt-8 flex justify-center">
              <CinematicButton size="lg" kicker="INITIALIZE" icon={<Workflow size={20} />} onClick={enterStudio}>
                ENTER STUDIO
              </CinematicButton>
            </div>
            <p className="mt-4 font-mono text-[12px] tracking-[0.16em] text-white/50">
              {stages.length} STAGES · {stages.reduce((total, stage) => total * stage.strategies.length, 1).toLocaleString()} CONFIGURATIONS
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  /*
    Once the user enters Studio, the entire screen becomes the Studio.
    Dashboard sidebar and dashboard chrome are visually replaced by
    this fixed fullscreen workspace.
  */

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] overflow-y-auto bg-black text-white"
    >
      <StudioBackground />

      <div className="relative z-10 min-h-screen">
        {mode === "introduction" && (
          <StudioIntroduction
            onEnterPipeline={enterPipeline}
            onBack={() => navigate("/dashboard")}
          />
        )}

        {mode === "workspace" && (
          <>
            <WorkspaceHeader
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onBack={() => navigate("/dashboard")}
              onRun={runOptimization}
              onReset={resetStudio}
              onSave={saveCurrentPipeline}
              hasResults={Boolean(result)}
              isOptimizing={isOptimizing}
            />

            <main>
              {optimizationError && (
                <div className="mx-auto max-w-6xl px-5 pt-5 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.04] px-4 py-3"
                  >
                    <CircleHelp
                      size={15}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-red-300">
                        Optimization failed
                      </p>

                      <p className="mt-1 text-[13px] leading-5 text-red-200/60">
                        {optimizationError}
                      </p>
                    </div>

                    <button
                      onClick={() => setOptimizationError(null)}
                      className="ml-auto shrink-0 text-red-300/50 transition hover:text-red-300"
                      aria-label="Dismiss error"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                </div>
              )}

              {saveNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="pointer-events-none fixed right-6 top-[88px] z-[120] px-0"
                >
                  <div
                    className={`rounded-xl border px-4 py-3 text-[13px] font-medium shadow-2xl backdrop-blur-xl ${
                      saveNotice.startsWith("Save failed")
                        ? "border-red-400/20 bg-[#14080b]/95 text-red-200"
                        : "border-emerald-400/20 bg-[#0b0b0c]/95 text-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          saveNotice.startsWith("Save failed")
                            ? "bg-red-400/10 text-red-300"
                            : "bg-emerald-400/10 text-emerald-300"
                        }`}
                      >
                        {saveNotice.startsWith("Save failed") ? (
                          <X size={13} />
                        ) : (
                          <Check size={13} />
                        )}
                      </span>
                      {saveNotice}
                    </div>
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.22,
                  }}
                >
                  {activeSection === "pipeline" && (
                    <PipelineWorkspace
                      stages={stages}
                      setStages={setStages}
                    />
                  )}

                  {activeSection === "constraints" && (
                    <ConstraintsWorkspace
                      stages={stages}
                      constraints={constraints}
                      setConstraints={setConstraints}
                    />
                  )}

                  {activeSection === "engine" && (
                    <DPEngineWorkspace
                      stages={stages}
                      constraints={constraints}
                      result={result}
                    />
                  )}

                  {activeSection === "visualizer" && (
                    <DPVisualizerWorkspace
                      stages={stages}
                      constraints={constraints}
                      result={result}
                    />
                  )}

                  {activeSection === "simulation" && (
                    <SimulationWorkspace
                      stages={stages}
                      result={result}
                    />
                  )}

                  {activeSection === "benchmark" && (
                    <BenchmarkWorkspace
                      baseStages={stages}
                      baseConstraints={constraints}
                    />
                  )}

                  {activeSection === "results" && (
                    <ResultsWorkspace
                      stages={stages}
                      constraints={constraints}
                      result={result}
                      onRun={runOptimization}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>

            <footer className="border-t border-white/[0.05] px-5 py-6 lg:px-8">
              <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />

                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
                    OptiFlow Optimization Workspace
                  </span>
                </div>

                <span className="text-[11px] text-white/55">
                  Dynamic Programming · Pipeline Strategy Optimization
                </span>
              </div>
            </footer>
          </>
        )}
      </div>
    </motion.div>
  );
}

