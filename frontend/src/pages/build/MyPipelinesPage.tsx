import {
  ArrowRight,
  Calendar,
  Clock3,
  Copy,
  DollarSign,
  FolderKanban,
  Layers3,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Strategy {
  id: string;
  name: string;
  time: number;
  cost: number;
}

interface Stage {
  id: string;
  name: string;
  description?: string;
  strategies: Strategy[];
  dependencies?: string[];
}

interface Constraints {
  deadline: number;
  budget: number;
  objective: "time" | "cost" | "balanced";
}

interface SavedPipeline {
  id: string;
  name: string;
  stages: Stage[];
  constraints: Constraints;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "optiflow_saved_pipelines";
const ACTIVE_PIPELINE_KEY = "optiflow_active_pipeline";

function readPipelines(): SavedPipeline[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePipelines(
  pipelines: SavedPipeline[],
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(pipelines),
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getObjectiveLabel(
  objective: Constraints["objective"],
): string {
  if (objective === "time") {
    return "Minimize Time";
  }

  if (objective === "cost") {
    return "Minimize Cost";
  }

  return "Balanced";
}

function createDuplicate(
  pipeline: SavedPipeline,
): SavedPipeline {
  const now = new Date().toISOString();

  return {
    ...pipeline,
    id: `pipeline_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    name: `${pipeline.name} Copy`,
    createdAt: now,
    updatedAt: now,
    stages: pipeline.stages.map((stage) => ({
      ...stage,
      id: `${stage.id}_copy_${Date.now()}`,
      strategies: stage.strategies.map(
        (strategy) => ({
          ...strategy,
          id: `${strategy.id}_copy_${Date.now()}`,
        }),
      ),
    })),
  };
}

export default function MyPipelinesPage() {
  const navigate = useNavigate();

  const [pipelines, setPipelines] =
    useState<SavedPipeline[]>([]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    setPipelines(readPipelines());
  }, []);

  const filteredPipelines = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return pipelines;
    }

    return pipelines.filter((pipeline) =>
      pipeline.name
        .toLowerCase()
        .includes(query),
    );
  }, [pipelines, search]);

  const totalStages = useMemo(() => {
    return pipelines.reduce(
      (total, pipeline) =>
        total + pipeline.stages.length,
      0,
    );
  }, [pipelines]);

  function createPipeline() {
    localStorage.removeItem(
      ACTIVE_PIPELINE_KEY,
    );

    navigate("/studio");
  }

  function openPipeline(
    pipeline: SavedPipeline,
  ) {
    localStorage.setItem(
      ACTIVE_PIPELINE_KEY,
      JSON.stringify(pipeline),
    );

    navigate("/studio");
  }

  function deletePipeline(id: string) {
    const pipeline = pipelines.find(
      (item) => item.id === id,
    );

    if (!pipeline) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${pipeline.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    const updated = pipelines.filter(
      (item) => item.id !== id,
    );

    savePipelines(updated);
    setPipelines(updated);

    const activePipeline =
      localStorage.getItem(
        ACTIVE_PIPELINE_KEY,
      );

    if (activePipeline) {
      try {
        const active =
          JSON.parse(activePipeline);

        if (active?.id === id) {
          localStorage.removeItem(
            ACTIVE_PIPELINE_KEY,
          );
        }
      } catch {
        localStorage.removeItem(
          ACTIVE_PIPELINE_KEY,
        );
      }
    }
  }

  function duplicatePipeline(
    pipeline: SavedPipeline,
  ) {
    const duplicate =
      createDuplicate(pipeline);

    const updated = [
      duplicate,
      ...pipelines,
    ];

    savePipelines(updated);
    setPipelines(updated);
  }

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto w-full max-w-[1500px] px-6 py-8 lg:px-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex flex-col gap-6 border-b border-white/[0.07] pb-8 xl:flex-row xl:items-end xl:justify-between">

          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-cyan-400">
              <FolderKanban size={14} />
              Build Workspace
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              My Pipelines
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
              Manage your saved software pipeline
              optimization configurations, reopen them in
              Studio, or create new pipeline models.
            </p>
          </div>

          <button
            type="button"
            onClick={createPipeline}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            <Plus size={17} />
            Create Pipeline
          </button>
        </header>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">

          <SummaryCard
            icon={<FolderKanban size={17} />}
            label="Saved Pipelines"
            value={pipelines.length}
          />

          <SummaryCard
            icon={<Layers3 size={17} />}
            label="Total Stages"
            value={totalStages}
          />

          <SummaryCard
            icon={<Workflow size={17} />}
            label="Optimization Model"
            value="Dynamic Programming"
          />

        </section>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <section className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Saved configurations
            </h2>

            <p className="mt-1 text-xs text-white/55">
              {pipelines.length === 0
                ? "No saved pipelines"
                : `${pipelines.length} saved ${
                    pipelines.length === 1
                      ? "pipeline"
                      : "pipelines"
                  }`}
            </p>
          </div>

          {pipelines.length > 0 && (
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search pipelines..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm text-white outline-none placeholder:text-white/45 transition focus:border-cyan-400/30 md:w-[280px]"
            />
          )}

        </section>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {pipelines.length === 0 && (
          <section className="mt-6 rounded-3xl border border-dashed border-white/[0.10] bg-[#0c0c0d] px-6 py-24 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05]">
              <Workflow
                size={28}
                className="text-cyan-300"
              />
            </div>

            <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.25em] text-cyan-400">
              OptiFlow Studio
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              No pipelines yet
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/62">
              Create your first pipeline in OptiFlow
              Studio. Define stages, execution strategies,
              deadline, budget and optimization objective.
            </p>

            <button
              type="button"
              onClick={createPipeline}
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] px-5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/[0.12]"
            >
              Open OptiFlow Studio
              <ArrowRight size={15} />
            </button>

          </section>
        )}

        {/* =================================================
            SEARCH EMPTY
        ================================================= */}

        {pipelines.length > 0 &&
          filteredPipelines.length === 0 && (
            <section className="mt-6 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] px-6 py-20 text-center">
              <h2 className="text-lg font-semibold">
                No matching pipelines
              </h2>

              <p className="mt-2 text-sm text-white/55">
                Try a different pipeline name.
              </p>
            </section>
          )}

        {/* =================================================
            PIPELINE GRID
        ================================================= */}

        {filteredPipelines.length > 0 && (
          <section className="mt-6 grid gap-5 xl:grid-cols-2">

            {filteredPipelines.map(
              (pipeline, index) => (
                <PipelineCard
                  key={pipeline.id}
                  pipeline={pipeline}
                  index={index}
                  onOpen={() =>
                    openPipeline(pipeline)
                  }
                  onDuplicate={() =>
                    duplicatePipeline(pipeline)
                  }
                  onDelete={() =>
                    deletePipeline(pipeline.id)
                  }
                />
              ),
            )}

          </section>
        )}

      </div>
    </div>
  );
}

/* =========================================================
   PIPELINE CARD
========================================================= */

function PipelineCard({
  pipeline,
  index,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  pipeline: SavedPipeline;
  index: number;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0c0d] transition duration-300 hover:border-cyan-400/15 hover:bg-[#0e0e0f]">

      {/* Top line */}

      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="p-6">

        {/* =================================================
            CARD HEADER
        ================================================= */}

        <div className="flex items-start justify-between gap-5">

          <div className="flex min-w-0 items-center gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] font-mono text-xs font-medium text-cyan-300">
              {String(index + 1).padStart(
                2,
                "0",
              )}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-white">
                {pipeline.name ||
                  "Untitled Pipeline"}
              </h3>

              <p className="mt-1 text-xs text-white/55">
                {pipeline.stages.length}{" "}
                {pipeline.stages.length === 1
                  ? "stage"
                  : "stages"}{" "}
                ·{" "}
                {pipeline.stages.reduce(
                  (total, stage) =>
                    total +
                    stage.strategies.length,
                  0,
                )}{" "}
                strategies
              </p>
            </div>

          </div>

          <div className="flex shrink-0 items-center gap-1">

            <button
              type="button"
              onClick={onDuplicate}
              title="Duplicate pipeline"
              className="rounded-lg p-2 text-white/55 transition hover:bg-white/[0.04] hover:text-cyan-300"
            >
              <Copy size={15} />
            </button>

            <button
              type="button"
              onClick={onDelete}
              title="Delete pipeline"
              className="rounded-lg p-2 text-white/55 transition hover:bg-red-400/[0.06] hover:text-red-300"
            >
              <Trash2 size={15} />
            </button>

          </div>
        </div>

        {/* =================================================
            METRICS
        ================================================= */}

        <div className="mt-6 grid grid-cols-3 gap-3">

          <Metric
            icon={<Clock3 size={14} />}
            label="Deadline"
            value={`${pipeline.constraints.deadline} min`}
          />

          <Metric
            icon={<DollarSign size={14} />}
            label="Budget"
            value={`$${Number(
              pipeline.constraints.budget,
            ).toFixed(2)}`}
          />

          <Metric
            label="Objective"
            value={getObjectiveLabel(
              pipeline.constraints
                .objective,
            )}
          />

        </div>

        {/* =================================================
            STAGES
        ================================================= */}

        <div className="mt-5">

          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Pipeline stages
          </p>

          <div className="flex flex-wrap gap-2">

            {pipeline.stages
              .slice(0, 6)
              .map((stage, stageIndex) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1.5"
                >
                  <span className="font-mono text-[11px] text-cyan-500/70">
                    {String(
                      stageIndex + 1,
                    ).padStart(2, "0")}
                  </span>

                  <span className="max-w-[120px] truncate text-[12px] text-slate-400">
                    {stage.name}
                  </span>
                </div>
              ))}

            {pipeline.stages.length > 6 && (
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[12px] text-white/55">
                +{pipeline.stages.length - 6} more
              </div>
            )}

          </div>

        </div>

        {/* =================================================
            UPDATED
        ================================================= */}

        <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-[12px] text-white/55">
          <Calendar size={13} />

          <span>
            Updated {formatDate(
              pipeline.updatedAt,
            )}
          </span>
        </div>

        {/* =================================================
            OPEN
        ================================================= */}

        <button
          type="button"
          onClick={onOpen}
          className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs font-medium text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.05] hover:text-cyan-300"
        >
          Open in OptiFlow Studio
          <ArrowRight size={14} />
        </button>

      </div>
    </article>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-5">

      <div className="flex items-center gap-2 text-white/55">
        {icon}

        <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">

      <div className="flex items-center gap-1.5 text-white/45">
        {icon}

        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-1.5 truncate text-xs font-medium text-slate-300">
        {value}
      </p>

    </div>
  );
}