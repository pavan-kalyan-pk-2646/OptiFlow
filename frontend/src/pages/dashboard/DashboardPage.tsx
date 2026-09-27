import { lazy, Suspense, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Boxes,
  Clock3,
  DollarSign,
  GitBranch,
  History,
  Layers3,
  Workflow,
  Zap,
} from "lucide-react";

import { getStoredUser } from "../../utils/auth";
import {
  CinematicButton,
  DemoBadge,
  Glass3DCard,
  HolographicLabel,
  NeonFrame,
  SectionReveal,
} from "../../cinematic";
import {
  coreStatesFromRun,
  objectiveName,
  readHistory,
  readPipelines,
  relativeTime,
} from "../../cinematic/workspaceData";

const CommandCoreScene = lazy(() => import("../../components/dashboard/CommandCoreScene"));

/* =========================================================
   OPTIFLOW COMMAND CENTER
   Every number on this page comes from the user's own
   saved pipelines and optimization history.
========================================================= */

function firstName(name?: string) {
  return name?.trim()?.split(/\s+/)[0] || "Operator";
}

function Metric({
  icon,
  label,
  value,
  unit,
  note,
  active = false,
  tone = "cyan",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  note: string;
  active?: boolean;
  tone?: "cyan" | "violet";
}) {
  return (
    <Glass3DCard active={active} tone={tone} innerClassName="p-5" radius={18}>
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)]">
          {icon}
        </span>
        <span className="font-mono text-[10.5px] tracking-[0.2em] text-white/45">LIVE</span>
      </div>
      <div className="mt-4 font-mono text-[11.5px] uppercase tracking-[0.2em] text-white/60">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-heading text-[32px] font-bold leading-none tabular-nums text-white">{value}</span>
        {unit && <span className="text-[13px] text-white/55">{unit}</span>}
      </div>
      <p className="mt-2 text-[12.5px] leading-5 text-white/50">{note}</p>
    </Glass3DCard>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const pipelines = useMemo(() => readPipelines(), []);
  const history = useMemo(() => readHistory(), []);
  const latest = history[0];

  const totals = useMemo(() => {
    const states = history.reduce((sum, run) => sum + (Number(run.statesGenerated) || 0), 0);
    const pruned = history.reduce((sum, run) => sum + (Number(run.statesPruned) || 0), 0);
    const timeHeadroom = history.reduce((sum, run) => sum + Math.max(0, (Number(run.deadline) || 0) - (Number(run.totalTime) || 0)), 0);
    const costHeadroom = history.reduce((sum, run) => sum + Math.max(0, (Number(run.budget) || 0) - (Number(run.totalCost) || 0)), 0);
    return { states, pruned, timeHeadroom, costHeadroom };
  }, [history]);

  const liveStates = useMemo(
    () => coreStatesFromRun(latest?.reconstruction, latest?.stageResults),
    [latest],
  );
  const hasLive = liveStates.length > 0;

  return (
    <div className="relative mx-auto w-full max-w-[1480px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* HEADER */}
      <SectionReveal>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <HolographicLabel>OptiFlow Command Center</HolographicLabel>
            <h1 className="mt-4 font-heading text-[clamp(2.2rem,4.5vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-white">
              Welcome back, <span className="of-gradient-text">{firstName(user?.name)}.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/65">
              Your optimization workspace: pipelines, state spaces and every result the DP engine has produced for you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CinematicButton size="lg" kicker="BUILD" icon={<Workflow size={20} />} onClick={() => navigate("/studio")}>
              OPEN STUDIO
            </CinematicButton>
            <CinematicButton variant="ghost" icon={<GitBranch size={16} />} arrow={false} onClick={() => navigate("/dp-visualizer")}>
              Visualize DP
            </CinematicButton>
          </div>
        </div>
      </SectionReveal>

      {/* CORE + SPATIAL PANELS */}
      <SectionReveal delay={0.08} className="mt-8">
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_260px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:content-center" style={{ perspective: 1200 }}>
            <Metric
              icon={<Boxes size={17} />}
              label="Active pipelines"
              value={String(pipelines.length)}
              note="Saved in My Pipelines."
              active={pipelines.length > 0}
            />
            <Metric
              icon={<Layers3 size={17} />}
              label="DP states"
              value={totals.states.toLocaleString()}
              unit="generated"
              note={`${totals.pruned.toLocaleString()} pruned by constraints across all runs.`}
              tone="violet"
            />
            <Metric
              icon={<Zap size={17} />}
              label="Optimizations"
              value={String(history.length)}
              unit="runs"
              note="Each run is a real call to the DP engine."
            />
          </div>

          <NeonFrame
            active={hasLive}
            radius={28}
            className="of-surface relative min-h-[420px] overflow-hidden sm:min-h-[520px]"
            style={{ borderRadius: 28 }}
          >
            <div className="of-grid-floor opacity-70" aria-hidden="true" />
            <Suspense fallback={null}>
              <CommandCoreScene
                className="absolute inset-0"
                states={hasLive ? liveStates : undefined}
                source={hasLive ? "LATEST RUN" : undefined}
              />
            </Suspense>
            <div className="pointer-events-none absolute left-5 right-5 top-5 flex flex-wrap items-center justify-between gap-3">
              {hasLive ? (
                <DemoBadge kind="live">Latest run · {relativeTime(latest?.createdAt)}</DemoBadge>
              ) : (
                <DemoBadge>Example · run Studio to see your own states</DemoBadge>
              )}
              <span className="font-mono text-[11px] tracking-[0.2em] text-white/50">HOVER A STATE</span>
            </div>
            <div className="pointer-events-none absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[11px] tracking-[0.22em] text-cyan-100/70">DP[i][time][cost]</div>
                <div className="mt-1 font-heading text-[18px] font-bold text-white">
                  {latest ? `${latest.pipelineName} · ${objectiveName(latest.objective)}` : "Optimization core idle"}
                </div>
              </div>
              {latest && (
                <div className="text-right font-mono text-[13px] text-white/80">
                  {latest.totalTime} min · ${Number(latest.totalCost).toFixed(2)}
                </div>
              )}
            </div>
          </NeonFrame>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:content-center" style={{ perspective: 1200 }}>
            <Metric
              icon={<Clock3 size={17} />}
              label="Time saved"
              value={String(totals.timeHeadroom)}
              unit="min"
              note="Sum of (deadline − optimized time) over your runs."
            />
            <Metric
              icon={<DollarSign size={17} />}
              label="Cost saved"
              value={`$${totals.costHeadroom.toFixed(2)}`}
              note="Sum of (budget − optimized cost) over your runs."
              tone="violet"
            />
            <Metric
              icon={<Activity size={17} />}
              label="Latest score"
              value={latest?.score !== undefined ? Number(latest.score).toFixed(3) : "—"}
              note={latest ? `Objective: ${objectiveName(latest.objective)}.` : "No run yet."}
            />
          </div>
        </div>
      </SectionReveal>

      {/* RECENT RUNS + QUICK ACCESS */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <SectionReveal>
          <NeonFrame radius={22} className="of-surface overflow-hidden" style={{ borderRadius: 22 }}>
            <div className="relative z-[5] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <HolographicLabel>Recent runs</HolographicLabel>
                  <h2 className="mt-2 text-[22px] font-bold text-white">Optimization history</h2>
                </div>
                <CinematicButton variant="ghost" size="sm" onClick={() => navigate("/optimization-history")}>
                  View all
                </CinematicButton>
              </div>

              {history.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/12 p-8 text-center">
                  <History className="mx-auto text-cyan-200/70" size={26} />
                  <p className="mt-3 text-[15px] text-white/75">No optimization runs yet.</p>
                  <p className="mt-1 text-[13.5px] text-white/50">Run the DP engine in OptiFlow Studio — results appear here automatically.</p>
                  <div className="mt-5 flex justify-center">
                    <CinematicButton size="sm" onClick={() => navigate("/studio")}>Start in Studio</CinematicButton>
                  </div>
                </div>
              ) : (
                <ul className="mt-5 divide-y divide-white/[0.06]">
                  {history.slice(0, 5).map((run, index) => (
                    <li key={run.id} className="flex flex-wrap items-center gap-4 py-3.5">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[12px] ${index === 0 ? "bg-cyan-300/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(56,232,255,.4)]" : "bg-white/[0.04] text-white/60"}`}>
                        R{history.length - index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold text-white">{run.pipelineName}</div>
                        <div className="font-mono text-[11.5px] tracking-[0.08em] text-white/50">
                          {run.stageCount} stages · {run.configurations} configs · {objectiveName(run.objective)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[14px] text-white">
                          {run.totalTime} min · ${Number(run.totalCost).toFixed(2)}
                        </div>
                        <div className="text-[12px] text-white/45">{relativeTime(run.createdAt)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </NeonFrame>
        </SectionReveal>

        <SectionReveal delay={0.06}>
          <div className="grid h-full gap-3">
            {[
              { title: "Learn the model", text: "DP Notes & Academy", path: "/dp-notes", icon: <Layers3 size={18} /> },
              { title: "Build a pipeline", text: "OptiFlow Studio", path: "/studio", icon: <Workflow size={18} /> },
              { title: "Inspect state space", text: "DP Visualizer", path: "/dp-visualizer", icon: <GitBranch size={18} /> },
              { title: "Compare algorithms", text: "Benchmark Lab", path: "/benchmark-lab", icon: <Activity size={18} /> },
            ].map((item) => (
              <Glass3DCard key={item.path} innerClassName="p-0" radius={18}>
                <button type="button" className="flex w-full items-center gap-4 p-4 text-left" onClick={() => navigate(item.path)}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/[0.07] text-cyan-200">{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-white">{item.title}</span>
                    <span className="block text-[13px] text-white/55">{item.text}</span>
                  </span>
                  <ArrowRight size={16} className="text-white/50" />
                </button>
              </Glass3DCard>
            ))}
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}
