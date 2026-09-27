/* =========================================================
   EXAMPLE PROBLEM
   ---------------------------------------------------------
   The default OptiFlow Studio pipeline, used ONLY for the
   clearly-labelled EXAMPLE visuals on public pages.

   Values mirror INITIAL_STAGES / INITIAL_CONSTRAINTS in
   OptiFlow Studio, and the objective mirrors the backend
   DPPipelineSolver._calculate_score (65% time / 35% cost).
   Everything below is computed, not hard-coded.
========================================================= */

export interface ExampleStrategy {
  id: string;
  name: string;
  time: number;
  cost: number;
}

export interface ExampleStage {
  id: string;
  name: string;
  strategies: ExampleStrategy[];
}

export const EXAMPLE_STAGES: ExampleStage[] = [
  {
    id: "build",
    name: "BUILD",
    strategies: [
      { id: "build-standard", name: "Standard", time: 8, cost: 0.08 },
      { id: "build-fast", name: "Fast", time: 5, cost: 0.15 },
      { id: "build-premium", name: "High Power", time: 3, cost: 0.25 },
    ],
  },
  {
    id: "test",
    name: "TEST",
    strategies: [
      { id: "test-standard", name: "Standard", time: 12, cost: 0.14 },
      { id: "test-parallel", name: "Parallel", time: 7, cost: 0.24 },
      { id: "test-high", name: "High Power", time: 5, cost: 0.35 },
    ],
  },
  {
    id: "security",
    name: "SECURITY",
    strategies: [
      { id: "security-standard", name: "Standard Scan", time: 7, cost: 0.09 },
      { id: "security-fast", name: "Accelerated Scan", time: 5, cost: 0.16 },
      { id: "security-deep", name: "Deep Scan", time: 10, cost: 0.13 },
    ],
  },
  {
    id: "package",
    name: "PACKAGE",
    strategies: [
      { id: "package-standard", name: "Standard", time: 5, cost: 0.05 },
      { id: "package-fast", name: "Accelerated", time: 3, cost: 0.09 },
    ],
  },
  {
    id: "deploy",
    name: "DEPLOY",
    strategies: [
      { id: "deploy-standard", name: "Standard", time: 4, cost: 0.04 },
      { id: "deploy-fast", name: "Accelerated", time: 2, cost: 0.08 },
    ],
  },
];

export const EXAMPLE_CONSTRAINTS = {
  deadline: 30,
  budget: 1,
  objective: "balanced" as const,
};

export type Objective = "time" | "cost" | "balanced";

export function objectiveScore(
  time: number,
  costCents: number,
  deadline: number,
  budget: number,
  objective: Objective,
): number {
  const t = time / Math.max(deadline, 1);
  const c = costCents / 100 / Math.max(budget, 0.01);
  if (objective === "time") return t;
  if (objective === "cost") return c;
  return t * 0.65 + c * 0.35;
}

export interface Configuration {
  /** strategy index per stage */
  choice: number[];
  time: number;
  costCents: number;
  score: number;
  timeFeasible: boolean;
  costFeasible: boolean;
}

export function enumerateConfigurations(
  stages: ExampleStage[] = EXAMPLE_STAGES,
  constraints = EXAMPLE_CONSTRAINTS,
): Configuration[] {
  const out: Configuration[] = [];
  const budgetCents = Math.round(constraints.budget * 100);

  const walk = (index: number, choice: number[], time: number, cost: number) => {
    if (index === stages.length) {
      out.push({
        choice: [...choice],
        time,
        costCents: cost,
        score: objectiveScore(time, cost, constraints.deadline, constraints.budget, constraints.objective),
        timeFeasible: time <= constraints.deadline,
        costFeasible: cost <= budgetCents,
      });
      return;
    }
    stages[index].strategies.forEach((strategy, i) => {
      choice.push(i);
      walk(index + 1, choice, time + strategy.time, cost + Math.round(strategy.cost * 100));
      choice.pop();
    });
  };

  walk(0, [], 0, 0);
  return out;
}

export interface ExampleSolution {
  configurations: Configuration[];
  total: number;
  afterTime: number;
  afterCost: number;
  optimal: Configuration;
  /** cumulative states along the optimal path, S0 … Sn */
  path: { label: string; stage: string; strategy: string; time: number; cost: number; score: number }[];
}

let cached: ExampleSolution | null = null;

export function solveExample(): ExampleSolution {
  if (cached) return cached;
  const configurations = enumerateConfigurations();
  const timeOk = configurations.filter((c) => c.timeFeasible);
  const bothOk = timeOk.filter((c) => c.costFeasible);
  const optimal = [...bothOk].sort(
    (a, b) => a.score - b.score || a.time - b.time || a.costCents - b.costCents,
  )[0];

  const path: ExampleSolution["path"] = [
    { label: "S0", stage: "INIT", strategy: "—", time: 0, cost: 0, score: 0 },
  ];
  let t = 0;
  let c = 0;
  optimal.choice.forEach((index, stageIndex) => {
    const stage = EXAMPLE_STAGES[stageIndex];
    const strategy = stage.strategies[index];
    t += strategy.time;
    c += Math.round(strategy.cost * 100);
    path.push({
      label: `S${stageIndex + 1}`,
      stage: stage.name,
      strategy: strategy.name,
      time: t,
      cost: c / 100,
      score: objectiveScore(t, c, EXAMPLE_CONSTRAINTS.deadline, EXAMPLE_CONSTRAINTS.budget, "balanced"),
    });
  });

  cached = {
    configurations,
    total: configurations.length,
    afterTime: timeOk.length,
    afterCost: bothOk.length,
    optimal,
    path,
  };
  return cached;
}
