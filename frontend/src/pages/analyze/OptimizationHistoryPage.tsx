import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  DollarSign,
  History,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface HistoryRecord {
  id: string;
  createdAt: string;
  pipelineName: string;
  objective: "time" | "cost" | "balanced";
  totalTime: number;
  totalCost: number;
  score: number;
  success: boolean;
  selectedStrategies?: string[];
  statesGenerated?: number;
  transitionsEvaluated?: number;
  statesPruned?: number;
}

const STORAGE_KEY = "optiflow_optimization_history";

function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    /*
      PATCH 03 — Legacy history migration

      Older OptiFlow history records were created only after a
      successful optimization completed, but those records did
      not contain an explicit `success` property.

      Therefore:
      - success === false  -> failed
      - success === true   -> successful
      - success missing    -> legacy successful record
    */
    const normalized: HistoryRecord[] = parsed.map(
      (item: Partial<HistoryRecord>) => ({
        id:
          typeof item.id === "string"
            ? item.id
            : `history-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        createdAt:
          typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString(),

        pipelineName:
          typeof item.pipelineName === "string"
            ? item.pipelineName
            : "My Pipeline",

        objective:
          item.objective === "time" ||
          item.objective === "cost" ||
          item.objective === "balanced"
            ? item.objective
            : "balanced",

        totalTime:
          typeof item.totalTime === "number"
            ? item.totalTime
            : 0,

        totalCost:
          typeof item.totalCost === "number"
            ? item.totalCost
            : 0,

        score:
          typeof item.score === "number"
            ? item.score
            : 0,

        /*
          IMPORTANT:
          Legacy records without `success` were generated after
          successful optimization, so they are treated as true.
        */
        success: item.success !== false,

        selectedStrategies:
          Array.isArray(item.selectedStrategies)
            ? item.selectedStrategies
            : [],

        statesGenerated:
          typeof item.statesGenerated === "number"
            ? item.statesGenerated
            : 0,

        transitionsEvaluated:
          typeof item.transitionsEvaluated === "number"
            ? item.transitionsEvaluated
            : 0,

        statesPruned:
          typeof item.statesPruned === "number"
            ? item.statesPruned
            : 0,
      }),
    );

    /*
      Persist the normalized structure so the migration happens
      once and future page loads receive proper boolean values.
    */
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalized),
    );

    return normalized;
  } catch {
    return [];
  }
}

export default function OptimizationHistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filter, setFilter] = useState<
    "all" | "successful" | "failed"
  >("all");

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const filtered = useMemo(() => {
    if (filter === "successful") {
      return history.filter((item) => item.success);
    }

    if (filter === "failed") {
      return history.filter((item) => !item.success);
    }

    return history;
  }, [history, filter]);

  const successful = useMemo(
    () => history.filter((item) => item.success),
    [history],
  );

  const failed = useMemo(
    () => history.filter((item) => !item.success),
    [history],
  );

  const averageTime = useMemo(() => {
    if (!successful.length) {
      return 0;
    }

    return (
      successful.reduce(
        (sum, item) => sum + item.totalTime,
        0,
      ) / successful.length
    );
  }, [successful]);

  const averageCost = useMemo(() => {
    if (!successful.length) {
      return 0;
    }

    return (
      successful.reduce(
        (sum, item) => sum + item.totalCost,
        0,
      ) / successful.length
    );
  }, [successful]);

  return (
    <div className="min-h-screen bg-[#070708] px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="border-b border-white/[0.07] pb-7">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-cyan-400">
            <History size={13} />
            Analyze
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            Optimization History
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
            Review previous optimization runs, selected
            strategies and Dynamic Programming execution metrics.
          </p>
        </header>

        {/* =====================================================
            METRICS
        ===================================================== */}

        <div className="mt-7 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <Metric
            icon={<History size={16} />}
            label="Total Runs"
            value={history.length}
          />

          <Metric
            icon={<CheckCircle2 size={16} />}
            label="Successful"
            value={successful.length}
            valueClass="text-emerald-300"
          />

          <Metric
            icon={<XCircle size={16} />}
            label="Failed"
            value={failed.length}
            valueClass={
              failed.length > 0
                ? "text-red-300"
                : "text-slate-300"
            }
          />

          <Metric
            icon={<Clock3 size={16} />}
            label="Average Time"
            value={`${averageTime.toFixed(1)}m`}
          />

          <Metric
            icon={<DollarSign size={16} />}
            label="Average Cost"
            value={`$${averageCost.toFixed(2)}`}
          />
        </div>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All"],
              ["successful", "Successful"],
              ["failed", "Failed"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={[
                "rounded-lg border px-4 py-2 text-xs transition",
                filter === value
                  ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
                  : "border-white/[0.07] text-white/62 hover:border-white/[0.12] hover:text-slate-300",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* =====================================================
            HISTORY LIST
        ===================================================== */}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0c0d]">
          {filtered.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <Activity
                size={30}
                className="mx-auto text-white/45"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No optimization runs
              </h2>

              <p className="mt-2 text-sm text-white/55">
                {filter === "failed"
                  ? "No failed optimization runs were recorded."
                  : filter === "successful"
                    ? "No successful optimization runs were recorded."
                    : "Run an optimization from OptiFlow Studio to see results here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filtered.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HISTORY ITEM
============================================================ */

function HistoryItem({
  item,
}: {
  item: HistoryRecord;
}) {
  const formattedDate = (() => {
    const date = new Date(item.createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    return date.toLocaleString();
  })();

  return (
    <div className="p-5 transition hover:bg-white/[0.015]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* =====================================================
            IDENTITY
        ===================================================== */}

        <div className="flex items-start gap-4">
          <div
            className={[
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              item.success
                ? "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-300"
                : "border-red-400/15 bg-red-400/[0.05] text-red-300",
            ].join(" ")}
          >
            {item.success ? (
              <CheckCircle2 size={17} />
            ) : (
              <XCircle size={17} />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-semibold text-white">
                {item.pipelineName}
              </h2>

              <span className="rounded-full border border-cyan-400/10 bg-cyan-400/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-wider text-cyan-300">
                {item.objective}
              </span>

              <span
                className={[
                  "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wider",
                  item.success
                    ? "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-300"
                    : "border-red-400/10 bg-red-400/[0.04] text-red-300",
                ].join(" ")}
              >
                {item.success ? "Successful" : "Failed"}
              </span>
            </div>

            <p className="mt-1 text-xs text-white/55">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* =====================================================
            RESULT METRICS
        ===================================================== */}

        <div className="grid grid-cols-3 gap-3 xl:w-[420px]">
          <ResultBox
            label="Time"
            value={`${item.totalTime}m`}
          />

          <ResultBox
            label="Cost"
            value={`$${item.totalCost.toFixed(2)}`}
          />

          <ResultBox
            label="DP States"
            value={String(
              item.statesGenerated ?? 0,
            )}
          />
        </div>
      </div>

      {/* =======================================================
          SECONDARY METRICS
      ======================================================= */}

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/[0.05] pt-4 text-[12px] text-white/55">
        <span>
          Transitions:{" "}
          {item.transitionsEvaluated ?? 0}
        </span>

        <span>
          States Pruned:{" "}
          {item.statesPruned ?? 0}
        </span>

        <span>
          Score:{" "}
          {Number.isFinite(item.score)
            ? item.score.toFixed(4)
            : "0.0000"}
        </span>

        <span>
          Strategies:{" "}
          {item.selectedStrategies?.length ?? 0}
        </span>

        <span
          className={[
            "ml-auto flex items-center gap-1",
            item.success
              ? "text-emerald-400"
              : "text-red-400",
          ].join(" ")}
        >
          {item.success
            ? "Optimization complete"
            : "Optimization failed"}

          {item.success ? (
            <ArrowRight size={12} />
          ) : (
            <XCircle size={12} />
          )}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   METRIC CARD
============================================================ */

function Metric({
  icon,
  label,
  value,
  valueClass = "text-white",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-5">
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}

        <span className="text-[12px] uppercase tracking-wider text-white/55">
          {label}
        </span>
      </div>

      <p
        className={`mt-3 text-2xl font-semibold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   RESULT BOX
============================================================ */

function ResultBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-white/55">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}