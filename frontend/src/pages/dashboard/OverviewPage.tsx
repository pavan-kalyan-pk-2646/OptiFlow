import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  GitBranch,
  Layers3,
  Play,
  Settings2,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { getStoredUser } from "../../utils/auth";

interface SavedPipeline {
  id: string;
  name: string;
  stages: unknown[];
  constraints?: {
    deadline?: number;
    budget?: number;
    objective?: string;
  };
  updatedAt?: string;
}

interface OptimizationHistoryRecord {
  id: string;
  pipelineName: string;
  stageCount: number;
  strategyCount: number;
  configurations: number;
  objective: string;
  deadline: number;
  budget: number;
  totalTime: number;
  totalCost: number;
  statesGenerated: number;
  transitionsEvaluated: number;
  statesPruned: number;
  createdAt: string;
}

const PIPELINES_KEY = "optiflow_saved_pipelines";
const HISTORY_KEY = "optiflow_optimization_history";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function firstName(name?: string): string {
  return name?.trim()?.split(/\s+/)[0] || "Operator";
}

function relativeTime(value?: string): string {
  if (!value) return "NO RUN";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "RECENT";

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "JUST NOW";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M AGO`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;

  return `${Math.floor(hours / 24)}D AGO`;
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const pipelines = useMemo(
    () => readStorage<SavedPipeline[]>(PIPELINES_KEY, []),
    [],
  );

  const history = useMemo(
    () =>
      readStorage<OptimizationHistoryRecord[]>(
        HISTORY_KEY,
        [],
      ),
    [],
  );

  const latest = history[0];

  const totalStages = useMemo(
    () =>
      pipelines.reduce(
        (sum, pipeline) => sum + pipeline.stages.length,
        0,
      ),
    [pipelines],
  );

  const latestPruned = latest?.statesPruned ?? 0;
  const latestStates = latest?.statesGenerated ?? 0;
  const latestTransitions = latest?.transitionsEvaluated ?? 0;

  const flowNodes = [
    { id: "S0", label: "INIT", x: "5%", y: "52%" },
    { id: "S1", label: "BUILD", x: "22%", y: "28%" },
    { id: "S2", label: "TEST", x: "40%", y: "66%" },
    { id: "S3", label: "SECURITY", x: "59%", y: "30%" },
    { id: "S4", label: "PACKAGE", x: "77%", y: "63%" },
    { id: "S5", label: "OPTIMUM", x: "94%", y: "38%" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-70px)] overflow-hidden bg-[#050506] text-white">
      <Atmosphere />

      <main className="relative z-10 mx-auto w-full max-w-[1540px] px-4 pb-6 pt-4 sm:px-6 lg:px-7">
        {/* TOP SYSTEM BAR */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex h-8 items-center justify-between border-b border-white/[0.045] font-mono"
        >
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em]">
            <span className="text-cyan-400">COMMAND DECK</span>
            <span className="text-white/55">/</span>
            <span className="text-white/55">OVERVIEW</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em]">
            <span className="flex items-center gap-1.5 text-emerald-300/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              CORE READY
            </span>
            <span className="hidden text-white/45 sm:block">
              DP[i][time][cost]
            </span>
          </div>
        </motion.div>

        {/* HERO / DECISION SPACE */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative min-h-[250px] overflow-hidden rounded-[24px] border border-white/[0.075] bg-[#09090a]/92 shadow-[0_25px_90px_rgba(0,0,0,0.42)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(34,211,238,0.08),transparent_34%),radial-gradient(circle_at_80%_45%,rgba(139,92,246,0.065),transparent_36%)]" />

          {/* technical frame */}
          <div className="absolute left-4 top-4 h-5 w-5 border-l border-t border-cyan-300/30" />
          <div className="absolute right-4 top-4 h-5 w-5 border-r border-t border-cyan-300/30" />
          <div className="absolute bottom-4 left-4 h-5 w-5 border-b border-l border-cyan-300/30" />
          <div className="absolute bottom-4 right-4 h-5 w-5 border-b border-r border-cyan-300/30" />

          <div className="relative grid min-h-[250px] lg:grid-cols-[0.9fr_1.5fr]">
            {/* COPY */}
            <div className="relative z-20 flex flex-col justify-center px-6 py-7 sm:px-8 lg:px-9">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.045] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                  <CircleDot size={9} className="animate-pulse" />
                  Optimization Workspace
                </span>
              </div>

              <h1 className="mt-5 text-[clamp(2rem,4vw,3.45rem)] font-semibold leading-[0.98] tracking-[-0.055em]">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  {firstName(user?.name)}.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-[13px] leading-6 text-white/62 sm:text-[14px]">
                Your command surface for pipeline modeling, Dynamic
                Programming state exploration and measurable optimization.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/studio")}
                  className="group inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(34,211,238,0.14)]"
                >
                  Enter Studio
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dp-visualizer")}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-[13px] font-medium text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.04] hover:text-white"
                >
                  <GitBranch size={14} />
                  Trace DP
                </button>
              </div>
            </div>

            {/* LIVE DECISION SPACE */}
            <div className="relative hidden min-h-[250px] overflow-hidden lg:block">
              <div
                className="absolute inset-0 opacity-[0.055]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
                  backgroundSize: "34px 34px",
                }}
              />

              <div className="absolute left-[18%] top-[14%] font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                STATE SPACE
              </div>

              <div className="absolute right-[8%] top-[14%] font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                FRONTIER / LIVE
              </div>

              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 900 300"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="flow-cyan" x1="0" x2="1">
                    <stop offset="0" stopColor="#22d3ee" stopOpacity="0.05" />
                    <stop offset="0.45" stopColor="#22d3ee" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#a78bfa" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                <path
                  d="M45 158 C155 55, 205 80, 310 184 S465 238, 535 100 S690 45, 850 118"
                  fill="none"
                  stroke="url(#flow-cyan)"
                  strokeWidth="1.4"
                />

                <path
                  d="M45 158 C155 235, 215 215, 310 116 S455 45, 535 174 S690 240, 850 118"
                  fill="none"
                  stroke="rgba(139,92,246,0.20)"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                />

                <path
                  d="M45 158 L850 118"
                  fill="none"
                  stroke="rgba(255,255,255,0.035)"
                  strokeWidth="1"
                />
              </svg>

              {flowNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  className="absolute"
                  style={{ left: node.x, top: node.y }}
                  animate={{
                    y: [0, index % 2 === 0 ? -5 : 5, 0],
                  }}
                  transition={{
                    duration: 3 + index * 0.35,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div
                    className={`relative flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border ${
                      index === 5
                        ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.12)]"
                        : "border-white/[0.09] bg-[#0d0d0e]/95 text-slate-400"
                    }`}
                  >
                    <span className="font-mono text-[11px]">{node.id}</span>
                    <span
                      className={`absolute -bottom-4 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.13em] ${
                        index === 5 ? "text-cyan-300/70" : "text-white/45"
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* moving state packet */}
              <motion.div
                animate={{ x: ["5%", "92%"] }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute top-[52%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95)]"
              />

              <div className="absolute bottom-5 right-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.17em] text-white/55">
                <span className="text-cyan-400">●</span>
                Candidate states flowing
              </div>
            </div>
          </div>
        </motion.section>

        {/* SIGNAL RAIL */}
        <section className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <SignalCard
            icon={<Layers3 size={14} />}
            label="PIPELINE LIBRARY"
            value={`${pipelines.length}`}
            suffix="saved"
          />
          <SignalCard
            icon={<Workflow size={14} />}
            label="STAGE GRAPH"
            value={`${totalStages}`}
            suffix="stages"
          />
          <SignalCard
            icon={<Zap size={14} />}
            label="OPTIMIZATION RUNS"
            value={`${history.length}`}
            suffix="recorded"
          />
          <SignalCard
            icon={<Database size={14} />}
            label="DP STATES"
            value={`${latestStates}`}
            suffix="generated"
          />
        </section>

        {/* LOWER COMMAND GRID */}
        <section className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_0.75fr_0.75fr]">
          {/* DECISION MATRIX */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#09090a]/90 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-cyan-300" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Decision Matrix
                  </span>
                </div>
                <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.03em]">
                  Your optimization surface
                </h2>
              </div>

              <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/55">
                LIVE MODEL
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <MatrixCard
                icon={<Workflow size={15} />}
                code="01 / MODEL"
                title="Pipeline"
                text="Stages + strategy choices"
                onClick={() => navigate("/studio")}
              />
              <MatrixCard
                icon={<Settings2 size={15} />}
                code="02 / BOUND"
                title="Constraints"
                text="Deadline + budget + objective"
                onClick={() => navigate("/studio")}
              />
              <MatrixCard
                icon={<BrainCircuit size={15} />}
                code="03 / SOLVE"
                title="DP Engine"
                text="States + transitions + pruning"
                onClick={() => navigate("/dp-visualizer")}
              />
            </div>

            <div className="mt-3 rounded-xl border border-white/[0.055] bg-[#050506] px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                  State formulation
                </span>
                <span className="font-mono text-[11px] text-cyan-300/70">
                  FEASIBLE FRONTIER
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 overflow-hidden">
                <code className="shrink-0 font-mono text-[13px] text-slate-300">
                  DP[i][time][cost]
                </code>
                <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/25 to-transparent" />
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.13em] text-white/45 sm:block">
                  time ≤ deadline
                </span>
                <span className="hidden text-white/55 sm:block">·</span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.13em] text-white/45 sm:block">
                  cost ≤ budget
                </span>
              </div>
            </div>
          </motion.div>

          {/* LATEST RUN */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#09090a]/90 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                <Activity size={13} />
                Latest Run
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                {relativeTime(latest?.createdAt)}
              </span>
            </div>

            {latest ? (
              <>
                <h3 className="mt-4 truncate text-[16px] font-semibold text-white">
                  {latest.pipelineName}
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <RunValue
                    icon={<Clock3 size={13} />}
                    label="TIME"
                    value={`${latest.totalTime}m`}
                  />
                  <RunValue
                    icon={<Database size={13} />}
                    label="COST"
                    value={`$${latest.totalCost.toFixed(2)}`}
                  />
                  <RunValue
                    icon={<GitBranch size={13} />}
                    label="TRANSITIONS"
                    value={`${latestTransitions}`}
                  />
                  <RunValue
                    icon={<Target size={13} />}
                    label="PRUNED"
                    value={`${latestPruned}`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/optimization-history")}
                  className="group mt-4 flex w-full items-center justify-between border-t border-white/[0.05] pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55 transition hover:text-cyan-300"
                >
                  Open history
                  <ChevronRight
                    size={12}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </>
            ) : (
              <EmptyRun onOpen={() => navigate("/studio")} />
            )}
          </motion.div>

          {/* SYSTEM STATUS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#09090a]/90 p-5"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <CheckCircle2 size={13} />
              System Status
            </div>

            <div className="mt-5 space-y-3">
              <StatusRow
                label="AUTHENTICATION"
                value="ACTIVE"
                tone="green"
              />
              <StatusRow
                label="DP ENGINE"
                value="READY"
                tone="cyan"
              />
              <StatusRow
                label="PIPELINE STORE"
                value={`${pipelines.length} SAVED`}
                tone="violet"
              />
              <StatusRow
                label="BENCHMARK DATA"
                value={history.length ? "AVAILABLE" : "EMPTY"}
                tone={history.length ? "green" : "slate"}
              />
            </div>

            <div className="mt-5 border-t border-white/[0.05] pt-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/45">
                  Optimization pulse
                </span>
                <span className="font-mono text-[10px] text-cyan-300/70">
                  100%
                </span>
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  animate={{ x: ["-100%", "0%"] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-full w-full bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent"
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* QUICK ROUTES */}
        <section className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <QuickRoute
            icon={<BrainCircuit size={14} />}
            code="LEARN"
            title="DP Academy"
            text="Concepts → mastery"
            onClick={() => navigate("/dp-academy")}
          />
          <QuickRoute
            icon={<Play size={14} />}
            code="EXPLORE"
            title="DP Playground"
            text="Execute → observe"
            onClick={() => navigate("/dp-playground")}
          />
          <QuickRoute
            icon={<BarChart3 size={14} />}
            code="MEASURE"
            title="Benchmark Lab"
            text="Measure → compare"
            onClick={() => navigate("/benchmark-lab")}
          />
          <QuickRoute
            icon={<Layers3 size={14} />}
            code="STORE"
            title="My Pipelines"
            text="Save → reopen"
            onClick={() => navigate("/pipelines")}
          />
        </section>
      </main>
    </div>
  );
}

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-72 -top-72 h-[720px] w-[720px] rounded-full bg-cyan-500/[0.025] blur-[150px]" />
      <div className="absolute -bottom-80 -right-64 h-[760px] w-[760px] rounded-full bg-violet-500/[0.022] blur-[160px]" />

      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />

      <motion.div
        animate={{ x: ["-25%", "125%"] }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[18%] h-px w-[32%] bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent"
      />

      <motion.div
        animate={{ x: ["125%", "-25%"] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[74%] h-px w-[28%] bg-gradient-to-r from-transparent via-violet-300/14 to-transparent"
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
    </div>
  );
}

function SignalCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#09090a]/80 px-4 py-3 transition hover:border-cyan-400/15">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/10 bg-cyan-400/[0.035] text-cyan-300/80">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            {label}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-white">
            {value}
            <span className="ml-1 text-[11px] font-normal uppercase text-white/55">
              {suffix}
            </span>
          </p>
        </div>
      </div>
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 sm:block">
        SYNC
      </span>
    </div>
  );
}

function MatrixCard({
  icon,
  code,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-white/[0.055] bg-white/[0.018] p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/15 hover:bg-cyan-400/[0.025]"
    >
      <div className="flex items-center justify-between">
        <span className="text-cyan-300/75">{icon}</span>
        <ArrowRight
          size={12}
          className="text-white/55 transition group-hover:translate-x-1 group-hover:text-cyan-300"
        />
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400/60">
        {code}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-slate-200">
        {title}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-white/55">
        {text}
      </p>
    </button>
  );
}

function RunValue({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/20 p-2.5">
      <div className="flex items-center gap-1.5 text-cyan-300/60">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-[14px] font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "cyan" | "violet" | "slate";
}) {
  const toneClass = {
    green: "bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.65)]",
    cyan: "bg-cyan-400 shadow-[0_0_9px_rgba(34,211,238,0.65)]",
    violet: "bg-violet-400 shadow-[0_0_9px_rgba(167,139,250,0.65)]",
    slate: "bg-slate-600",
  }[tone];

  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] pb-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/55">
        {label}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[10px] text-white/62">
        <span className={`h-1.5 w-1.5 rounded-full ${toneClass}`} />
        {value}
      </span>
    </div>
  );
}

function QuickRoute({
  icon,
  code,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  code: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.055] bg-[#09090a]/70 px-3.5 py-3 text-left transition hover:border-cyan-400/15 hover:bg-[#0d0d0e]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/62 transition group-hover:border-cyan-400/15 group-hover:bg-cyan-400/[0.045] group-hover:text-cyan-300">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400/60">
          {code}
        </p>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-slate-300">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-white/45">{text}</p>
      </div>

      <ChevronRight
        size={13}
        className="shrink-0 text-white/55 transition group-hover:translate-x-1 group-hover:text-cyan-300"
      />
    </button>
  );
}

function EmptyRun({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mt-5">
      <div className="rounded-xl border border-dashed border-white/[0.07] bg-black/15 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] text-cyan-300">
            <Play size={14} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-300">
              No run recorded
            </p>
            <p className="mt-1 text-[11px] leading-4 text-white/45">
              Your first DP result will appear here.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/12 bg-cyan-400/[0.035] py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-400/[0.06]"
        >
          Initialize Pipeline
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}
