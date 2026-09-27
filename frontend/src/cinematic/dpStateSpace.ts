import { objectiveScore, type Objective } from "./exampleProblem";

/* =========================================================
   DP STATE SPACE (client-side trace)
   ---------------------------------------------------------
   A faithful re-implementation of the backend
   DPPipelineSolver loop, instrumented so every generated,
   merged and pruned state can be drawn:

     for each stage i
       for each reachable state (time, cost)
         for each strategy
           transition → (time + t, cost + c)
           prune if time > deadline or cost > budget
           keep the better score for identical (time, cost)

   Used for visualisation only; the Studio result always
   comes from the backend API.
========================================================= */

export interface SpaceStrategy {
  id: string;
  name: string;
  time: number;
  cost: number;
}

export interface SpaceStage {
  id: string;
  name: string;
  strategies: SpaceStrategy[];
}

export interface SpaceState {
  id: number;
  layer: number;
  time: number;
  costCents: number;
  score: number;
  prev: number | null;
  stageName: string;
  strategyName: string | null;
  strategyId: string | null;
  status: "kept" | "dominated" | "pruned";
  pruneReason?: "time" | "cost";
}

export interface SpaceTransition {
  from: number;
  to: number;
  status: "kept" | "dominated" | "pruned";
}

export interface StateSpaceTrace {
  states: SpaceState[];
  transitions: SpaceTransition[];
  optimalPath: number[];
  layers: number;
  deadline: number;
  budgetCents: number;
  maxTime: number;
  maxCostCents: number;
  statesGenerated: number;
  transitionsEvaluated: number;
  statesPruned: number;
  statesStored: number;
  feasible: boolean;
}

export function traceStateSpace(
  stages: SpaceStage[],
  deadline: number,
  budget: number,
  objective: Objective,
): StateSpaceTrace {
  const budgetCents = Math.round(budget * 100);
  const states: SpaceState[] = [];
  const transitions: SpaceTransition[] = [];
  let statesGenerated = 0;
  let transitionsEvaluated = 0;
  let statesPruned = 0;

  const root: SpaceState = {
    id: 0,
    layer: 0,
    time: 0,
    costCents: 0,
    score: 0,
    prev: null,
    stageName: "INIT",
    strategyName: null,
    strategyId: null,
    status: "kept",
  };
  states.push(root);
  let current = new Map<string, SpaceState>([["0|0", root]]);

  stages.forEach((stage, stageIndex) => {
    const next = new Map<string, SpaceState>();
    current.forEach((previous) => {
      stage.strategies.forEach((strategy) => {
        transitionsEvaluated += 1;
        const time = previous.time + strategy.time;
        const costCents = previous.costCents + Math.round(strategy.cost * 100);
        const pruned = time > deadline || costCents > budgetCents;
        const state: SpaceState = {
          id: states.length,
          layer: stageIndex + 1,
          time,
          costCents,
          score: objectiveScore(time, costCents, deadline, budget, objective),
          prev: previous.id,
          stageName: stage.name,
          strategyName: strategy.name,
          strategyId: strategy.id,
          status: pruned ? "pruned" : "kept",
          pruneReason: pruned ? (time > deadline ? "time" : "cost") : undefined,
        };
        states.push(state);
        const transition: SpaceTransition = { from: previous.id, to: state.id, status: pruned ? "pruned" : "kept" };
        transitions.push(transition);

        if (pruned) {
          statesPruned += 1;
          return;
        }
        statesGenerated += 1;

        const key = `${time}|${costCents}`;
        const existing = next.get(key);
        if (!existing) {
          next.set(key, state);
        } else if (state.score < existing.score) {
          existing.status = "dominated";
          const old = transitions.find((t) => t.to === existing.id);
          if (old) old.status = "dominated";
          next.set(key, state);
        } else {
          state.status = "dominated";
          transition.status = "dominated";
        }
      });
    });
    current = next;
  });

  const finals = [...current.values()];
  let optimalPath: number[] = [];
  if (finals.length > 0 && stages.length > 0) {
    const best = finals.sort((a, b) => a.score - b.score || a.time - b.time || a.costCents - b.costCents)[0];
    let cursor: SpaceState | undefined = best;
    while (cursor) {
      optimalPath.unshift(cursor.id);
      cursor = cursor.prev === null ? undefined : states[cursor.prev];
    }
  } else {
    optimalPath = [];
  }

  const maxTime = Math.max(deadline, ...states.map((s) => s.time));
  const maxCostCents = Math.max(budgetCents, ...states.map((s) => s.costCents));

  return {
    states,
    transitions,
    optimalPath,
    layers: stages.length + 1,
    deadline,
    budgetCents,
    maxTime,
    maxCostCents,
    statesGenerated,
    transitionsEvaluated,
    statesPruned,
    statesStored: 1 + states.filter((s) => s.status === "kept" && s.layer > 0).length,
    feasible: optimalPath.length > 0,
  };
}

/** Walk predecessors back to S0 (inclusive). */
export function predecessorChain(trace: StateSpaceTrace, id: number): number[] {
  const chain: number[] = [];
  let cursor: SpaceState | undefined = trace.states[id];
  while (cursor) {
    chain.unshift(cursor.id);
    cursor = cursor.prev === null ? undefined : trace.states[cursor.prev];
  }
  return chain;
}
