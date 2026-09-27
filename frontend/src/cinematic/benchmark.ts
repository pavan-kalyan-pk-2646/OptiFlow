import { EXAMPLE_STAGES, objectiveScore, type ExampleStage } from "./exampleProblem";

/* =========================================================
   BENCHMARK ENGINE
   Brute force vs Dynamic Programming on the same generated
   pipeline problems. Operation counts are exact; runtimes
   are real measurements taken in the user's browser.
========================================================= */

export interface BenchmarkProblem {
  stages: ExampleStage[];
  deadline: number;
  budget: number;
}

/** Repeat the Studio default stages to build an n-stage pipeline. */
export function generateProblem(size: number): BenchmarkProblem {
  const stages = Array.from({ length: size }, (_, i) => {
    const template = EXAMPLE_STAGES[i % EXAMPLE_STAGES.length];
    return {
      ...template,
      id: `${template.id}-${i}`,
      name: `${template.name} ${Math.floor(i / EXAMPLE_STAGES.length) + 1}`,
    };
  });
  return { stages, deadline: size * 6, budget: Number((size * 0.2).toFixed(2)) };
}

export function configurationCount(problem: BenchmarkProblem): number {
  return problem.stages.reduce((total, stage) => total * stage.strategies.length, 1);
}

export function bruteForce(problem: BenchmarkProblem) {
  const budgetCents = Math.round(problem.budget * 100);
  let operations = 0;
  let best = Infinity;
  const walk = (index: number, time: number, cost: number) => {
    if (index === problem.stages.length) {
      operations += 1;
      if (time <= problem.deadline && cost <= budgetCents) {
        best = Math.min(best, objectiveScore(time, cost, problem.deadline, problem.budget, "balanced"));
      }
      return;
    }
    for (const strategy of problem.stages[index].strategies) {
      walk(index + 1, time + strategy.time, cost + Math.round(strategy.cost * 100));
    }
  };
  walk(0, 0, 0);
  return { operations, best };
}

export function dynamicProgramming(problem: BenchmarkProblem) {
  const budgetCents = Math.round(problem.budget * 100);
  let operations = 0;
  let layer = new Map<number, number>([[0, 0]]); // key = time * 1e6 + cost → score
  for (const stage of problem.stages) {
    const next = new Map<number, number>();
    for (const key of layer.keys()) {
      const time = Math.floor(key / 1e6);
      const cost = key % 1e6;
      for (const strategy of stage.strategies) {
        operations += 1;
        const t = time + strategy.time;
        const c = cost + Math.round(strategy.cost * 100);
        if (t > problem.deadline || c > budgetCents) continue;
        const k = t * 1e6 + c;
        const score = objectiveScore(t, c, problem.deadline, problem.budget, "balanced");
        const existing = next.get(k);
        if (existing === undefined || score < existing) next.set(k, score);
      }
    }
    layer = next;
  }
  let best = Infinity;
  for (const score of layer.values()) best = Math.min(best, score);
  return { operations, best };
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface BenchmarkResult {
  size: number;
  configurations: number;
  brute: { ms: number; operations: number; best: number } | null;
  dp: { ms: number; operations: number; best: number };
  agree: boolean | null;
}

/** Brute force is skipped beyond this many configurations to keep the tab responsive. */
export const BRUTE_FORCE_LIMIT = 2_500_000;

export function measure(size: number, repetitions = 5): BenchmarkResult {
  const problem = generateProblem(size);
  const configurations = configurationCount(problem);

  const time = <T,>(fn: () => T, reps: number) => {
    fn(); // warm-up
    const samples: number[] = [];
    let result = fn();
    for (let i = 0; i < reps; i++) {
      const start = performance.now();
      result = fn();
      samples.push(performance.now() - start);
    }
    return { result, ms: median(samples) };
  };

  const dpRun = time(() => dynamicProgramming(problem), repetitions);
  let brute: BenchmarkResult["brute"] = null;
  if (configurations <= BRUTE_FORCE_LIMIT) {
    const reps = configurations > 200_000 ? 1 : repetitions;
    const bruteRun = time(() => bruteForce(problem), reps);
    brute = { ms: bruteRun.ms, operations: bruteRun.result.operations, best: bruteRun.result.best };
  }

  return {
    size,
    configurations,
    brute,
    dp: { ms: dpRun.ms, operations: dpRun.result.operations, best: dpRun.result.best },
    agree: brute ? Math.abs(brute.best - dpRun.result.best) < 1e-9 || (brute.best === Infinity && dpRun.result.best === Infinity) : null,
  };
}
