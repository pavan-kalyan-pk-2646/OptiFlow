import type { CoreState } from "./three/OptimizationCore";

/* =========================================================
   WORKSPACE DATA (read-only helpers)
   Reads the user's real data that OptiFlow Studio already
   persists. Nothing here writes or invents records.
========================================================= */

export const PIPELINES_KEY = "optiflow_saved_pipelines";
export const HISTORY_KEY = "optiflow_optimization_history";

export interface StoredStageResult {
  stage_id: string;
  stage_name: string;
  strategy_id: string;
  strategy_name: string;
  time: number;
  cost: number;
}

export interface StoredReconstruction {
  stage_index: number;
  time: number;
  cost: number;
  score: number;
  strategy_id: string | null;
}

export interface StoredHistoryRecord {
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
  score?: number;
  statesGenerated: number;
  transitionsEvaluated: number;
  statesPruned: number;
  selectedStrategies?: string[];
  stageResults?: StoredStageResult[];
  reconstruction?: StoredReconstruction[];
  createdAt: string;
}

export interface StoredStrategy {
  id: string;
  name: string;
  time: number;
  cost: number;
}

export interface StoredStage {
  id: string;
  name: string;
  description?: string;
  strategies: StoredStrategy[];
  dependencies?: string[];
}

export interface StoredPipeline {
  id: string;
  name: string;
  stages: StoredStage[];
  constraints?: { deadline?: number; budget?: number; objective?: string };
  createdAt?: string;
  updatedAt?: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readHistory(): StoredHistoryRecord[] {
  const list = read<StoredHistoryRecord[]>(HISTORY_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function readPipelines(): StoredPipeline[] {
  const list = read<StoredPipeline[]>(PIPELINES_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Convert a backend reconstruction into Optimization Core states. */
export function coreStatesFromRun(
  reconstruction?: StoredReconstruction[],
  stageResults?: StoredStageResult[],
): CoreState[] {
  if (!reconstruction || reconstruction.length === 0) return [];
  return reconstruction.map((state, index) => {
    const stage = index === 0 ? undefined : stageResults?.[index - 1];
    return {
      label: `S${index}`,
      stage: index === 0 ? "INIT" : stage?.stage_name ?? `STAGE ${index}`,
      strategy: index === 0 ? "—" : stage?.strategy_name,
      time: Number(state.time) || 0,
      cost: Number(state.cost) || 0,
      score: Number(state.score) || 0,
    };
  });
}

export function relativeTime(value?: string): string {
  if (!value) return "—";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "recently";
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function objectiveName(objective?: string): string {
  if (objective === "time") return "Minimize time";
  if (objective === "cost") return "Minimize cost";
  return "Balanced";
}
