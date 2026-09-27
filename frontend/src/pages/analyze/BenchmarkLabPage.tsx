import { lazy, Suspense, useState } from "react";
import { Check, FlaskConical, Gauge, Info, TriangleAlert } from "lucide-react";

import {
  CinematicButton,
  DemoBadge,
  HolographicLabel,
  NeonFrame,
  OrbitalLoader,
  SectionReveal,
  SpatialPanel,
} from "../../cinematic";
import { BRUTE_FORCE_LIMIT, measure, type BenchmarkResult } from "../../cinematic/benchmark";
import type { BenchMetric } from "../../components/analyze/BenchmarkBarsScene";

const BenchmarkBarsScene = lazy(() => import("../../components/analyze/BenchmarkBarsScene"));

/* =========================================================
   BENCHMARK LAB
   Brute Force vs Dynamic Programming, measured live in this
   browser on generated pipelines (the Studio default stages,
   repeated). No numbers are pre-baked.
========================================================= */

const SIZES = [4, 6, 8, 10, 12, 14];

export default function BenchmarkLabPage() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metric, setMetric] = useState<BenchMetric>("operations");

  const run = () => {
    if (running) return;
    setRunning(true);
    setResults([]);
    setProgress(0);
    const collected: BenchmarkResult[] = [];
    // One size per task so the UI stays responsive between measurements.
    const next = (index: number) => {
      if (index >= SIZES.length) {
        setRunning(false);
        return;
      }
      window.setTimeout(() => {
        collected.push(measure(SIZES[index]));
        setResults([...collected]);
        setProgress(index + 1);
        next(index + 1);
      }, 30);
    };
    next(0);
  };

  const largest = results[results.length - 1];
  const comparable = [...results].reverse().find((r) => r.brute);
  const speedup = comparable?.brute ? comparable.brute.operations / Math.max(1, comparable.dp.operations) : null;
  const allAgree = results.every((r) => r.agree !== false);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <SectionReveal>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <HolographicLabel>Benchmark Lab</HolographicLabel>
            <h1 className="mt-4 font-heading text-[clamp(2.2rem,4.5vw,3.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-white">
              Brute force <span className="text-white/45">vs</span> <span className="of-gradient-text">Dynamic Programming.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/65">
              The same pipeline problem, solved twice. Brute force enumerates every configuration; the DP engine only
              explores reachable (time, cost) states. Both must agree on the optimum.
            </p>
          </div>
          <CinematicButton size="lg" kicker={running ? "MEASURING" : "EXECUTE"} icon={<FlaskConical size={20} />} onClick={run} loading={running}>
            {results.length ? "RUN AGAIN" : "RUN BENCHMARK"}
          </CinematicButton>
        </div>
      </SectionReveal>

      <SectionReveal delay={0.06} className="mt-8">
        <NeonFrame active={results.length > 0} radius={28} className="of-surface relative overflow-hidden" style={{ borderRadius: 28 }}>
          <div className="relative h-[420px] sm:h-[500px]">
            {results.length > 0 ? (
              <Suspense fallback={null}>
                <BenchmarkBarsScene className="absolute inset-0" results={results} metric={metric} />
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                {running ? (
                  <OrbitalLoader label="Measuring" />
                ) : (
                  <div>
                    <Gauge className="mx-auto text-cyan-200/80" size={30} />
                    <p className="mt-4 text-[16px] text-white/80">Run the benchmark to measure both algorithms on this device.</p>
                    <p className="mt-1 text-[14px] text-white/50">
                      Pipelines of {SIZES.join(", ")} stages · up to {(108 ** 2 * 81).toLocaleString()} configurations.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-5 top-4 flex flex-wrap items-center justify-between gap-2">
              <DemoBadge kind="live">Measured in your browser</DemoBadge>
              <div className="pointer-events-auto flex gap-1 rounded-xl bg-black/60 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)]" role="radiogroup" aria-label="Metric">
                {(["operations", "ms"] as BenchMetric[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={metric === item}
                    onClick={() => setMetric(item)}
                    className={`h-8 rounded-lg px-3 text-[13px] transition ${metric === item ? "bg-cyan-300/15 text-white shadow-[inset_0_0_0_1px_rgba(56,232,255,.5)]" : "text-white/60 hover:text-white"}`}
                  >
                    {item === "ms" ? "Runtime" : "Operations"}
                  </button>
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-4 left-5 flex gap-4 font-mono text-[12px] text-white/70">
              <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-violet-400" /> Brute force</span>
              <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-sm bg-cyan-300" /> Dynamic Programming</span>
            </div>
            {running && results.length > 0 && (
              <div className="absolute bottom-4 right-5 font-mono text-[12px] text-cyan-100/80">
                {progress}/{SIZES.length} sizes measured…
              </div>
            )}
          </div>
        </NeonFrame>
      </SectionReveal>

      {results.length > 0 && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <SpatialPanel kicker="Measurements" title="Results table" bodyClassName="p-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[14px]">
                <thead className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
                  <tr>
                    <th className="pb-3">Stages</th>
                    <th className="pb-3">Configurations</th>
                    <th className="pb-3">Brute ops</th>
                    <th className="pb-3">DP ops</th>
                    <th className="pb-3">Brute ms</th>
                    <th className="pb-3">DP ms</th>
                    <th className="pb-3">Same optimum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums text-white/85">
                  {results.map((r) => (
                    <tr key={r.size}>
                      <td className="py-2.5">{r.size}</td>
                      <td>{r.configurations.toLocaleString()}</td>
                      <td>{r.brute ? r.brute.operations.toLocaleString() : "skipped"}</td>
                      <td className="text-cyan-100">{r.dp.operations.toLocaleString()}</td>
                      <td>{r.brute ? r.brute.ms.toFixed(3) : "—"}</td>
                      <td className="text-cyan-100">{r.dp.ms.toFixed(3)}</td>
                      <td>
                        {r.agree === null ? (
                          <span className="text-white/50">n/a</span>
                        ) : r.agree ? (
                          <Check size={16} className="text-emerald-300" aria-label="yes" />
                        ) : (
                          <TriangleAlert size={16} className="text-rose-300" aria-label="no" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpatialPanel>

          <div className="grid content-start gap-4">
            {speedup !== null && comparable && (
              <NeonFrame active radius={20} className="of-surface p-5" style={{ borderRadius: 20 }}>
                <div className="relative z-[5]">
                  <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">Work reduction · {comparable.size} stages</div>
                  <div className="mt-1 font-heading text-[40px] font-bold tabular-nums text-white">{speedup.toFixed(1)}×</div>
                  <p className="text-[14px] text-white/60">fewer operations than brute force (exact counts, not timings).</p>
                </div>
              </NeonFrame>
            )}
            <div className="of-surface rounded-2xl p-5 text-[14px] leading-6 text-white/65">
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100/75">
                <Info size={13} /> Method
              </div>
              Each size repeats the Studio default stages (deadline 6 min/stage, budget $0.20/stage, balanced objective). Runtimes are
              medians after a warm-up and depend on this device. Brute force is skipped above {BRUTE_FORCE_LIMIT.toLocaleString()} configurations.
              {largest && ` Largest run: ${largest.configurations.toLocaleString()} configurations.`}
              {!allAgree && <span className="mt-2 block text-rose-200">Warning: an optimum mismatch was detected.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
