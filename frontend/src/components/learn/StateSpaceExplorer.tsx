import { lazy, Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { Crosshair, Move3d, RotateCcw } from "lucide-react";

import { DemoBadge, NeonFrame } from "../../cinematic";
import { predecessorChain, traceStateSpace, type SpaceStage } from "../../cinematic/dpStateSpace";
import type { Objective } from "../../cinematic/exampleProblem";

const StateSpaceScene = lazy(() => import("./StateSpaceScene"));

/* =========================================================
   STATE SPACE EXPLORER
   3D DP[i][time][cost] scene + live counters + inspector.
   Rotate / zoom / pan · hover · click to inspect · replay.
========================================================= */

export interface BackendCounters {
  statesGenerated: number;
  transitionsEvaluated: number;
  statesPruned: number;
  statesStored: number;
}

export interface StateSpaceExplorerProps {
  stages: SpaceStage[];
  deadline: number;
  budget: number;
  objective: Objective;
  sourceLabel: string;
  sourceKind?: "demo" | "live";
  /** When provided, counters show the backend's own numbers */
  backend?: BackendCounters | null;
  height?: string;
  headerExtra?: ReactNode;
}

function Counter({ label, value, backend }: { label: string; value: number; backend?: number }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/55">{label}</div>
      <div className="mt-1 font-heading text-[24px] font-bold tabular-nums text-white">{(backend ?? value).toLocaleString()}</div>
      {backend !== undefined && backend !== value && (
        <div className="font-mono text-[10.5px] text-white/45">trace: {value}</div>
      )}
    </div>
  );
}

export default function StateSpaceExplorer({
  stages,
  deadline,
  budget,
  objective,
  sourceLabel,
  sourceKind = "demo",
  backend,
  height = "h-[460px] sm:h-[560px]",
  headerExtra,
}: StateSpaceExplorerProps) {
  const trace = useMemo(() => traceStateSpace(stages, deadline, budget, objective), [stages, deadline, budget, objective]);
  const reveal = useRef(0);
  const [replayKey, setReplayKey] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const selectedState = selected !== null ? trace.states[selected] : null;
  const chain = useMemo(() => (selected === null ? [] : predecessorChain(trace, selected)), [selected, trace]);
  const optimal = trace.optimalPath.length ? trace.states[trace.optimalPath[trace.optimalPath.length - 1]] : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <NeonFrame active radius={26} className="of-surface relative overflow-hidden" style={{ borderRadius: 26 }}>
        <div className={`relative ${height}`}>
          <Suspense fallback={null}>
            <StateSpaceScene
              className="absolute inset-0"
              trace={trace}
              reveal={reveal}
              selected={selected}
              onSelect={setSelected}
              replayKey={replayKey}
            />
          </Suspense>

          <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-2">
            <DemoBadge kind={sourceKind}>{sourceLabel}</DemoBadge>
            <div className="pointer-events-auto flex gap-2">
              {headerExtra}
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setReplayKey((k) => k + 1);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/12 bg-black/60 px-3 text-[13px] text-white/80 backdrop-blur transition hover:border-cyan-300/50 hover:text-white"
              >
                <RotateCcw size={14} /> Replay
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tracking-[0.1em] text-white/65">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_6px_#38e8ff]" /> kept</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-400" /> dominated</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-400" /> pruned</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-white shadow-[0_0_6px_#fff]" /> optimal</span>
          </div>
          <div className="pointer-events-none absolute bottom-4 right-4 hidden items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-white/55 sm:flex">
            <Move3d size={14} /> DRAG · SCROLL · RIGHT-DRAG TO PAN
          </div>
        </div>
      </NeonFrame>

      <div className="grid content-start gap-4">
        <div className="of-surface rounded-2xl p-4">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">
            {backend ? "Backend counters" : "Live counters"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Counter label="Generated" value={trace.statesGenerated} backend={backend?.statesGenerated} />
            <Counter label="Transitions" value={trace.transitionsEvaluated} backend={backend?.transitionsEvaluated} />
            <Counter label="Pruned" value={trace.statesPruned} backend={backend?.statesPruned} />
            <Counter label="Stored" value={trace.statesStored} backend={backend?.statesStored} />
          </div>
        </div>

        <div className="of-surface rounded-2xl p-4" aria-live="polite">
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">
            <Crosshair size={13} /> State inspector
          </div>
          {selectedState ? (
            <div>
              <div className="font-mono text-[16px] text-white">
                DP[{selectedState.layer}][{selectedState.time}][{(selectedState.costCents / 100).toFixed(2)}]
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13.5px]">
                <dt className="text-white/55">Status</dt>
                <dd className={selectedState.status === "pruned" ? "text-rose-200" : selectedState.status === "dominated" ? "text-violet-200" : "text-cyan-100"}>
                  {selectedState.status}
                  {selectedState.pruneReason ? ` (${selectedState.pruneReason})` : ""}
                </dd>
                <dt className="text-white/55">Stage</dt>
                <dd className="text-white">{selectedState.stageName}</dd>
                <dt className="text-white/55">Choice</dt>
                <dd className="text-white">{selectedState.strategyName ?? "—"}</dd>
                <dt className="text-white/55">Score</dt>
                <dd className="font-mono text-white">{selectedState.score.toFixed(4)}</dd>
              </dl>
              <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Predecessor chain</div>
              <ol className="mt-2 space-y-1">
                {chain.map((id) => {
                  const s = trace.states[id];
                  return (
                    <li key={id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[12.5px]">
                      <span className="text-white/80">S{s.layer} · {s.strategyName ?? "start"}</span>
                      <span className="font-mono text-white/60">{s.time}m · ${(s.costCents / 100).toFixed(2)}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <p className="text-[14px] leading-6 text-white/60">
              Click any state to inspect it and trace its predecessors back to S0. Hover for a quick readout.
            </p>
          )}
        </div>

        <div className="of-surface rounded-2xl p-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">Optimal state</div>
          {optimal ? (
            <div className="mt-2 font-mono text-[15px] text-white">
              DP[{optimal.layer}][{optimal.time}][{(optimal.costCents / 100).toFixed(2)}]
              <div className="mt-1 text-[12.5px] text-white/60">score {optimal.score.toFixed(4)}</div>
            </div>
          ) : (
            <p className="mt-2 text-[14px] text-rose-200">No feasible final state — every path crosses a constraint.</p>
          )}
        </div>
      </div>
    </div>
  );
}
