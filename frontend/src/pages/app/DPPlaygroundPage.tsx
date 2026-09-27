import {
  Activity,
  Check,
  ChevronDown,
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type ProblemType = "climbing" | "fibonacci";
type AlgorithmType = "tabulation" | "memoization";

interface ExecutionStep {
  index: number;
  state: string;
  expression: string;
  value: number;
}

interface AlgorithmResult {
  value: number;
  table: number[];
  steps: ExecutionStep[];
  operations: number;
  cacheHits: number;
  recursiveCalls: number;
}

const MAX_INPUT = 20;

function clampInput(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(
    Math.max(Math.floor(value), 1),
    MAX_INPUT,
  );
}

/* =========================================================
   TABULATION
========================================================= */

function runTabulation(
  problem: ProblemType,
  input: number,
): AlgorithmResult {
  const n = clampInput(input);

  const table = new Array<number>(n + 1).fill(0);
  const steps: ExecutionStep[] = [];

  let operations = 0;

  if (problem === "climbing") {
    table[0] = 1;

    if (n >= 1) {
      table[1] = 1;
    }

    steps.push({
      index: 0,
      state: "dp[0]",
      expression: "Base case = 1",
      value: table[0],
    });

    if (n >= 1) {
      steps.push({
        index: 1,
        state: "dp[1]",
        expression: "Base case = 1",
        value: table[1],
      });
    }

    for (let i = 2; i <= n; i += 1) {
      table[i] = table[i - 1] + table[i - 2];
      operations += 1;

      steps.push({
        index: i,
        state: `dp[${i}]`,
        expression: `dp[${i - 1}] + dp[${i - 2}] = ${table[i - 1]} + ${table[i - 2]}`,
        value: table[i],
      });
    }
  } else {
    table[0] = 0;

    if (n >= 1) {
      table[1] = 1;
    }

    steps.push({
      index: 0,
      state: "dp[0]",
      expression: "Base case = 0",
      value: table[0],
    });

    if (n >= 1) {
      steps.push({
        index: 1,
        state: "dp[1]",
        expression: "Base case = 1",
        value: table[1],
      });
    }

    for (let i = 2; i <= n; i += 1) {
      table[i] = table[i - 1] + table[i - 2];
      operations += 1;

      steps.push({
        index: i,
        state: `dp[${i}]`,
        expression: `dp[${i - 1}] + dp[${i - 2}] = ${table[i - 1]} + ${table[i - 2]}`,
        value: table[i],
      });
    }
  }

  return {
    value: table[n],
    table,
    steps,
    operations,
    cacheHits: 0,
    recursiveCalls: 0,
  };
}

/* =========================================================
   MEMOIZATION
========================================================= */

function runMemoization(
  problem: ProblemType,
  input: number,
): AlgorithmResult {
  const n = clampInput(input);

  const memo = new Array<number | undefined>(n + 1).fill(
    undefined,
  );

  const table = new Array<number>(n + 1).fill(0);
  const steps: ExecutionStep[] = [];

  let operations = 0;
  let cacheHits = 0;
  let recursiveCalls = 0;

  function solve(index: number): number {
    recursiveCalls += 1;

    if (problem === "climbing") {
      if (index === 0) {
        return 1;
      }

      if (index === 1) {
        return 1;
      }
    } else {
      if (index === 0) {
        return 0;
      }

      if (index === 1) {
        return 1;
      }
    }

    if (memo[index] !== undefined) {
      cacheHits += 1;

      return memo[index];
    }

    const previous = solve(index - 1);
    const beforePrevious = solve(index - 2);

    operations += 1;

    const value = previous + beforePrevious;

    memo[index] = value;
    table[index] = value;

    steps.push({
      index,
      state: `dp[${index}]`,
      expression: `dp[${index - 1}] + dp[${index - 2}] = ${previous} + ${beforePrevious}`,
      value,
    });

    return value;
  }

  const value = solve(n);

  table[0] = problem === "climbing" ? 1 : 0;

  if (n >= 1) {
    table[1] = 1;
  }

  /*
    Memoization computes states on demand.
    Populate the visible table from the memo cache.
  */
  for (let i = 0; i <= n; i += 1) {
    const cachedValue = memo[i];
    if (cachedValue !== undefined) {
      table[i] = cachedValue;
    }
  }

  return {
    value,
    table,
    steps: steps.sort(
      (a, b) => a.index - b.index,
    ),
    operations,
    cacheHits,
    recursiveCalls,
  };
}

/* =========================================================
   EXECUTION ENGINE
========================================================= */

function executeAlgorithm(
  problem: ProblemType,
  algorithm: AlgorithmType,
  input: number,
): AlgorithmResult {
  if (algorithm === "memoization") {
    return runMemoization(problem, input);
  }

  return runTabulation(problem, input);
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function DPPlaygroundPage() {
  const [problem, setProblem] =
    useState<ProblemType>("climbing");

  const [algorithm, setAlgorithm] =
    useState<AlgorithmType>("tabulation");

  const [input, setInput] = useState(8);

  const [result, setResult] =
    useState<AlgorithmResult | null>(() =>
      executeAlgorithm(
        "climbing",
        "tabulation",
        8,
      ),
    );

  const [activeStep, setActiveStep] = useState(0);

  const currentStep =
    result?.steps[
      Math.min(
        activeStep,
        Math.max((result?.steps.length ?? 1) - 1, 0),
      )
    ];

  const problemInfo = useMemo(() => {
    if (problem === "climbing") {
      return {
        title: "Climbing Stairs",
        description:
          "Count the number of distinct ways to reach the top when you can climb either one or two steps.",
        state: "dp[i] = number of ways to reach step i",
        recurrence:
          "dp[n] = dp[n - 1] + dp[n - 2]",
        complexity: "O(n) time · O(n) space",
      };
    }

    return {
      title: "Fibonacci",
      description:
        "Compute the nth Fibonacci number by reusing previously solved subproblems.",
      state: "dp[i] = Fibonacci value at index i",
      recurrence:
        "dp[n] = dp[n - 1] + dp[n - 2]",
      complexity: "O(n) time · O(n) space",
    };
  }, [problem]);

  const run = () => {
    const safeInput = clampInput(input);

    setInput(safeInput);

    const nextResult = executeAlgorithm(
      problem,
      algorithm,
      safeInput,
    );

    setResult(nextResult);
    setActiveStep(
      Math.max(nextResult.steps.length - 1, 0),
    );
  };

  const reset = () => {
    setProblem("climbing");
    setAlgorithm("tabulation");
    setInput(8);

    const nextResult = executeAlgorithm(
      "climbing",
      "tabulation",
      8,
    );

    setResult(nextResult);
    setActiveStep(
      Math.max(nextResult.steps.length - 1, 0),
    );
  };

  return (
    <div className="min-h-screen bg-[#070708] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#09090a] px-6 py-10 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(34,211,238,0.09),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.08),transparent_32%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles size={12} />
              Interactive DP Lab
            </div>

            <div className="mt-6 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Think.
                  <br />
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                    Execute. Visualize.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62">
                  Experiment with Dynamic Programming states,
                  transitions, recurrence relations, and execution
                  strategies one step at a time.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  icon={<Activity size={15} />}
                  label="Execution"
                  value="Step-by-step"
                />

                <MiniStat
                  icon={<Target size={15} />}
                  label="State"
                  value="Live DP table"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN LAB
        ===================================================== */}

        <div className="mt-6 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* ===================================================
              CONTROL PANEL
          =================================================== */}

          <aside className="rounded-3xl border border-white/[0.07] bg-[#0c0c0d] p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
              Experiment
            </p>

            {/* Problem */}

            <div className="mt-6">
              <label className="text-xs text-white/62">
                Problem
              </label>

              <div className="mt-2 space-y-2">
                <ProblemButton
                  active={problem === "climbing"}
                  title="Climbing Stairs"
                  subtitle="O(n)"
                  onClick={() =>
                    setProblem("climbing")
                  }
                />

                <ProblemButton
                  active={problem === "fibonacci"}
                  title="Fibonacci"
                  subtitle="O(n)"
                  onClick={() =>
                    setProblem("fibonacci")
                  }
                />
              </div>
            </div>

            {/* Input */}

            <div className="mt-7">
              <label
                htmlFor="dp-input"
                className="text-xs text-white/62"
              >
                Input size
              </label>

              <input
                id="dp-input"
                type="number"
                min={1}
                max={MAX_INPUT}
                value={input}
                onChange={(event) =>
                  setInput(
                    clampInput(
                      Number(event.target.value),
                    ),
                  )
                }
                className="mt-2 h-11 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-sm text-white outline-none transition focus:border-cyan-400/30"
              />

              <p className="mt-2 text-[12px] leading-5 text-white/45">
                Input is limited to {MAX_INPUT} for clear
                visualization.
              </p>
            </div>

            {/* Algorithm */}

            <div className="mt-7">
              <p className="text-xs text-white/62">
                Execution strategy
              </p>

              <div className="mt-2 space-y-2">
                <AlgorithmButton
                  active={
                    algorithm === "tabulation"
                  }
                  title="Tabulation"
                  subtitle="Bottom-up"
                  icon={<Code2 size={15} />}
                  onClick={() =>
                    setAlgorithm("tabulation")
                  }
                />

                <AlgorithmButton
                  active={
                    algorithm === "memoization"
                  }
                  title="Memoization"
                  subtitle="Top-down"
                  icon={<Zap size={15} />}
                  onClick={() =>
                    setAlgorithm("memoization")
                  }
                />
              </div>
            </div>

            {/* Actions */}

            <div className="mt-7 flex gap-2">
              <button
                type="button"
                onClick={run}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 text-xs font-semibold text-[#031017] transition hover:bg-cyan-300"
              >
                <Play size={14} />
                Run DP
              </button>

              <button
                type="button"
                onClick={reset}
                aria-label="Reset playground"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.015] text-white/62 transition hover:text-white"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </aside>

          {/* ===================================================
              EXECUTION AREA
          =================================================== */}

          <main className="min-w-0">
            {/* Problem summary */}

            <section className="rounded-3xl border border-white/[0.07] bg-[#0c0c0d] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Code2 size={17} />

                    <span className="text-xs font-semibold">
                      {problemInfo.title}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                    {problemInfo.title} with{" "}
                    <span className="text-cyan-300">
                      {algorithm}
                    </span>
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">
                    {problemInfo.description}
                  </p>
                </div>

                <div className="shrink-0 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-5 py-4 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-400">
                    Result
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-white">
                    {result?.value ?? "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* State / recurrence / complexity */}

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <InfoCard
                icon={<Target size={16} />}
                title="State"
                value={problemInfo.state}
              />

              <InfoCard
                icon={<Zap size={16} />}
                title="Recurrence"
                value={problemInfo.recurrence}
              />

              <InfoCard
                icon={<Activity size={16} />}
                title="Complexity"
                value={problemInfo.complexity}
              />
            </div>

            {/* Execution */}

            <section className="mt-5 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0c0c0d]">
              <div className="flex flex-col gap-3 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                    Execution
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    DP state transitions
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[11px] text-white/62">
                    {algorithm === "tabulation"
                      ? "Bottom-up"
                      : "Top-down"}
                  </span>

                  <span className="rounded-full border border-cyan-400/10 bg-cyan-400/[0.04] px-3 py-1.5 text-[11px] text-cyan-300">
                    {result?.steps.length ?? 0} states
                  </span>
                </div>
              </div>

              <div className="p-6">
                {currentStep ? (
                  <>
                    <div className="rounded-2xl border border-cyan-400/10 bg-[#080809] p-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
                        Current transition
                      </p>

                      <p className="mt-3 font-mono text-sm text-cyan-300">
                        {currentStep.expression}
                      </p>
                    </div>

                    {/* Step selector */}

                    <div className="mt-5 overflow-x-auto pb-2">
                      <div className="flex min-w-max items-center gap-2">
                        {result?.steps.map(
                          (step, index) => (
                            <button
                              key={`${step.state}-${index}`}
                              type="button"
                              onClick={() =>
                                setActiveStep(index)
                              }
                              className={[
                                "flex h-16 w-16 flex-col items-center justify-center rounded-xl border transition",
                                index === activeStep
                                  ? "border-cyan-400/30 bg-cyan-400/[0.06] text-cyan-300"
                                  : "border-white/[0.06] bg-white/[0.01] text-white/62 hover:text-slate-300",
                              ].join(" ")}
                            >
                              <span className="font-mono text-[10px]">
                                {step.state}
                              </span>

                              <span className="mt-1 text-sm font-semibold">
                                {step.value}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all"
                        style={{
                          width: `${
                            result
                              ? ((activeStep + 1) /
                                  result.steps.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <EmptyExecution />
                )}
              </div>
            </section>

            {/* DP table */}

            <section className="mt-5 rounded-3xl border border-white/[0.07] bg-[#0c0c0d]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                    State table
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    dp[i] values
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-white/55">
                    Result
                  </p>

                  <p className="mt-1 text-lg font-semibold text-cyan-300">
                    {result?.value ?? "—"}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto p-6">
                <div className="flex min-w-max gap-2">
                  {result?.table.map(
                    (value, index) => (
                      <div
                        key={index}
                        className={[
                          "flex h-16 w-16 flex-col items-center justify-center rounded-xl border",
                          index ===
                          result.table.length - 1
                            ? "border-cyan-400/30 bg-cyan-400/[0.05] text-cyan-300"
                            : "border-white/[0.06] bg-black/10 text-slate-300",
                        ].join(" ")}
                      >
                        <span className="font-mono text-[10px] text-white/55">
                          dp[{index}]
                        </span>

                        <span className="mt-1 text-sm font-semibold">
                          {value}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </section>

            {/* Metrics */}

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MetricCard
                label="State computations"
                value={result?.operations ?? 0}
                description={
                  algorithm === "tabulation"
                    ? "Each state is computed once in order."
                    : "New states are computed once and cached."
                }
              />

              <MetricCard
                label="Recursive calls"
                value={result?.recursiveCalls ?? 0}
                description={
                  algorithm === "memoization"
                    ? "Top-down calls generated by recursion."
                    : "No recursion in bottom-up execution."
                }
              />

              <MetricCard
                label="Cache hits"
                value={result?.cacheHits ?? 0}
                description={
                  algorithm === "memoization"
                    ? "Previously computed states reused."
                    : "Not applicable to tabulation."
                }
              />
            </div>

            {/* Inspector */}

            <section className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/[0.07] bg-[#0c0c0d] p-6">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Sparkles size={16} />

                  <h3 className="text-sm font-semibold">
                    DP Inspector
                  </h3>
                </div>

                <div className="mt-6 space-y-5">
                  <InspectorRow
                    label="State"
                    value={problemInfo.state}
                  />

                  <InspectorRow
                    label="Base case"
                    value={
                      problem === "climbing"
                        ? "dp[0] = 1, dp[1] = 1"
                        : "dp[0] = 0, dp[1] = 1"
                    }
                  />

                  <InspectorRow
                    label="Recurrence"
                    value={problemInfo.recurrence}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-cyan-400/10 bg-[#0d0d0e] p-6">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Activity size={16} />

                  <h3 className="text-sm font-semibold">
                    Execution Insight
                  </h3>
                </div>

                <p className="mt-6 text-sm leading-7 text-white/62">
                  The engine evaluated{" "}
                  <span className="text-white">
                    {result?.operations ?? 0}
                  </span>{" "}
                  new DP states using{" "}
                  <span className="text-cyan-300">
                    {algorithm}
                  </span>
                  .
                </p>

                <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-3 text-xs text-emerald-300">
                  <Check size={14} />
                  Execution completed successfully.
                </div>
              </div>
            </section>

            {/* Why this matters */}

            <section className="mt-5 rounded-3xl border border-cyan-400/10 bg-[#0d0d0e] p-6">
              <div className="flex items-center gap-2 text-cyan-300">
                <Sparkles size={16} />

                <h3 className="text-sm font-semibold">
                  Why this matters for OptiFlow
                </h3>
              </div>

              <p className="mt-4 text-sm leading-7 text-white/62">
                OptiFlow applies the same Dynamic Programming
                principles to its pipeline optimization engine:
                states represent accumulated decisions, transitions
                extend feasible states, and previously solved states
                prevent unnecessary recomputation.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[140px] rounded-2xl border border-white/[0.06] bg-white/[0.015] px-4 py-4">
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}

        <span className="font-mono text-[11px] uppercase tracking-wider text-white/55">
          {label}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-300">
        {value}
      </p>
    </div>
  );
}

function ProblemButton({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-xl border px-3 py-3 text-left transition",
        active
          ? "border-cyan-400/20 bg-cyan-400/[0.05]"
          : "border-white/[0.06] bg-transparent hover:bg-white/[0.02]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            "text-xs font-medium",
            active
              ? "text-white"
              : "text-slate-400",
          ].join(" ")}
        >
          {title}
        </span>

        {active && (
          <Check
            size={13}
            className="text-cyan-300"
          />
        )}
      </div>

      <p className="mt-1 text-[11px] text-white/55">
        {subtitle}
      </p>
    </button>
  );
}

function AlgorithmButton({
  active,
  title,
  subtitle,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
        active
          ? "border-cyan-400/20 bg-cyan-400/[0.05]"
          : "border-white/[0.06] opacity-70 hover:opacity-100",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg",
          active
            ? "bg-cyan-400/10 text-cyan-300"
            : "bg-white/[0.03] text-white/55",
        ].join(" ")}
      >
        {icon}
      </div>

      <div>
        <p
          className={[
            "text-xs font-medium",
            active
              ? "text-white"
              : "text-slate-400",
          ].join(" ")}
        >
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-white/55">
          {subtitle}
        </p>
      </div>
    </button>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-5">
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}

        <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>

      <p className="mt-4 font-mono text-[13px] leading-6 text-white/62">
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-5">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-[12px] leading-5 text-white/55">
        {description}
      </p>
    </div>
  );
}

function InspectorRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>

      <p className="mt-2 font-mono text-[13px] leading-6 text-white/62">
        {value}
      </p>
    </div>
  );
}

function EmptyExecution() {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/[0.07]">
      <div className="text-center">
        <ChevronDown
          size={20}
          className="mx-auto text-white/45"
        />

        <p className="mt-3 text-sm text-white/62">
          Run the algorithm to inspect its states.
        </p>
      </div>
    </div>
  );
}