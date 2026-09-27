import {
  Activity,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Table2,
  Target,
  Zap,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";

import { CinematicButton, DemoBadge, HolographicLabel, NeonFrame, SectionReveal } from "../../cinematic";
import type { NodeStatus } from "../../cinematic/three/DPStateNode";
import type { PlaygroundNode } from "../../components/learn/PlaygroundStateScene";

const PlaygroundStateScene = lazy(() => import("../../components/learn/PlaygroundStateScene"));

type Algorithm = "memoization" | "tabulation";

type InputKind = "number" | "array";

type PlaygroundProblem = {
  id: string;
  title: string;
  description: string;
  recurrence: string;
  state: string;
  baseCase: string;
  complexity: string;
  input: InputKind;
  defaultInput: string;
  inputLabel: string;
};

type StepKind = "call" | "base" | "compute" | "hit";

type Step = {
  kind: StepKind;
  index: number;
  value: number | null;
  formula: string;
  dependencies: number[];
};

const playgroundProblems: PlaygroundProblem[] = [
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    description:
      "Count the number of distinct ways to reach the top when you can climb either one or two steps.",
    recurrence: "dp[n] = dp[n - 1] + dp[n - 2]",
    state: "dp[i] = number of ways to reach step i",
    baseCase: "dp[0] = 1, dp[1] = 1",
    complexity: "O(n) time · O(n) space",
    input: "number",
    defaultInput: "8",
    inputLabel: "Number of stairs (0–20)",
  },
  {
    id: "fibonacci",
    title: "Fibonacci Number",
    description:
      "Compute the nth Fibonacci number using overlapping subproblems.",
    recurrence: "dp[n] = dp[n - 1] + dp[n - 2]",
    state: "dp[i] = Fibonacci number at index i",
    baseCase: "dp[0] = 0, dp[1] = 1",
    complexity: "O(n) time · O(n) space",
    input: "number",
    defaultInput: "10",
    inputLabel: "N (0–20)",
  },
  {
    id: "house-robber",
    title: "House Robber (array)",
    description:
      "Given house values, pick non-adjacent houses to maximise the total. A constraint (no two neighbours) shapes every transition.",
    recurrence: "dp[i] = max(dp[i - 1], dp[i - 2] + a[i])",
    state: "dp[i] = best total using houses 0…i",
    baseCase: "dp[0] = a[0], dp[1] = max(a[0], a[1])",
    complexity: "O(n) time · O(n) space",
    input: "array",
    defaultInput: "2, 7, 9, 3, 1, 5",
    inputLabel: "House values (comma separated, up to 16)",
  },
];

/* ---------------------------------------------------------
   Values — the actual recurrences
--------------------------------------------------------- */

function parseInput(problem: PlaygroundProblem, raw: string): { n: number; values: number[]; error: string | null } {
  if (problem.input === "number") {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isInteger(n) || n < 0 || n > 20) {
      return { n: 0, values: [], error: "Enter a whole number between 0 and 20." };
    }
    return { n, values: [], error: null };
  }
  const parts = raw
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const values = parts.map(Number);
  if (values.length === 0 || values.some((v) => !Number.isFinite(v) || v < 0)) {
    return { n: 0, values: [], error: "Enter non-negative numbers separated by commas." };
  }
  if (values.length > 16) {
    return { n: 0, values: [], error: "Use at most 16 values for a clear visualization." };
  }
  return { n: values.length - 1, values, error: null };
}

function solveTable(problemId: string, n: number, values: number[]): number[] {
  const dp: number[] = [];
  for (let i = 0; i <= n; i++) {
    if (problemId === "fibonacci") dp.push(i === 0 ? 0 : i === 1 ? 1 : dp[i - 1] + dp[i - 2]);
    else if (problemId === "house-robber") dp.push(i === 0 ? values[0] : i === 1 ? Math.max(values[0], values[1]) : Math.max(dp[i - 1], dp[i - 2] + values[i]));
    else dp.push(i <= 1 ? 1 : dp[i - 1] + dp[i - 2]);
  }
  return dp;
}

function formulaFor(problemId: string, i: number, dp: number[], values: number[]): string {
  if (problemId === "house-robber") {
    if (i === 0) return `dp[0] = a[0] = ${values[0]}`;
    if (i === 1) return `dp[1] = max(a[0], a[1]) = max(${values[0]}, ${values[1]}) = ${dp[1]}`;
    return `dp[${i}] = max(dp[${i - 1}], dp[${i - 2}] + a[${i}]) = max(${dp[i - 1]}, ${dp[i - 2]} + ${values[i]}) = ${dp[i]}`;
  }
  if (i <= 1) return `dp[${i}] = ${dp[i]}`;
  return `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`;
}

/** Generate the real execution trace for either strategy. */
function buildSteps(problemId: string, n: number, values: number[], algorithm: Algorithm): Step[] {
  const dp = solveTable(problemId, n, values);
  const deps = (i: number) => (i <= 1 ? [] : [i - 1, i - 2]);

  if (algorithm === "tabulation") {
    return dp.map((value, i) => ({
      kind: i <= 1 ? "base" : "compute",
      index: i,
      value,
      formula: formulaFor(problemId, i, dp, values),
      dependencies: deps(i),
    }));
  }

  // Memoization: top-down recursion with a cache.
  const steps: Step[] = [];
  const memo = new Set<number>();
  const visit = (i: number) => {
    if (memo.has(i)) {
      steps.push({ kind: "hit", index: i, value: dp[i], formula: `memo[${i}] hit → ${dp[i]} (reused, not recomputed)`, dependencies: [] });
      return;
    }
    if (i <= 1) {
      memo.add(i);
      steps.push({ kind: "base", index: i, value: dp[i], formula: `${formulaFor(problemId, i, dp, values)}  (base case)`, dependencies: [] });
      return;
    }
    steps.push({ kind: "call", index: i, value: null, formula: `solve(${i}) → needs dp[${i - 1}] and dp[${i - 2}]`, dependencies: [] });
    visit(i - 1);
    visit(i - 2);
    memo.add(i);
    steps.push({ kind: "compute", index: i, value: dp[i], formula: formulaFor(problemId, i, dp, values), dependencies: deps(i) });
  };
  if (n >= 0) visit(n);
  return steps;
}

const PHASES = ["INPUT", "STATE GENERATION", "TRANSITIONS", "DP TABLE", "ANSWER"] as const;

export default function DPPlaygroundPage() {
  const [selectedId, setSelectedId] = useState("climbing-stairs");
  const [rawInput, setRawInput] = useState("8");
  const [algorithm, setAlgorithm] = useState<Algorithm>("tabulation");
  const [cursor, setCursor] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  const selectedProblem = playgroundProblems.find((problem) => problem.id === selectedId) ?? playgroundProblems[0];

  const parsed = useMemo(() => parseInput(selectedProblem, rawInput), [selectedProblem, rawInput]);

  const generatedSteps = useMemo(
    () => (parsed.error ? [] : buildSteps(selectedProblem.id, parsed.n, parsed.values, algorithm)),
    [selectedProblem.id, parsed, algorithm],
  );

  // Reset the trace whenever the problem definition changes.
  useEffect(() => {
    setCursor(-1);
    setIsRunning(false);
  }, [selectedProblem.id, rawInput, algorithm]);

  // Autoplay
  useEffect(() => {
    if (!isRunning) return;
    if (cursor >= generatedSteps.length - 1) {
      setIsRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setCursor((c) => c + 1), 520);
    return () => window.clearTimeout(timer);
  }, [isRunning, cursor, generatedSteps.length]);

  const executedSteps = generatedSteps.slice(0, cursor + 1);
  const current = cursor >= 0 ? generatedSteps[cursor] : null;
  const finished = generatedSteps.length > 0 && cursor === generatedSteps.length - 1;

  const known = useMemo(() => {
    const map = new Map<number, number>();
    executedSteps.forEach((step) => {
      if (step.value !== null && step.kind !== "call") map.set(step.index, step.value);
    });
    return map;
  }, [executedSteps]);

  const pending = useMemo(() => {
    const set = new Set<number>();
    executedSteps.forEach((step) => {
      if (step.kind === "call") set.add(step.index);
      if (step.kind === "compute") set.delete(step.index);
    });
    return set;
  }, [executedSteps]);

  const size = parsed.error ? 0 : parsed.n + 1;
  const result = finished ? known.get(parsed.n) ?? null : null;

  const phaseIndex = useMemo(() => {
    if (cursor < 0) return 0;
    if (finished) return 4;
    if (current?.kind === "base" || current?.kind === "call") return 1;
    if (current?.kind === "hit") return 3;
    return 2;
  }, [cursor, finished, current]);

  const nodes: PlaygroundNode[] = useMemo(
    () =>
      Array.from({ length: size }, (_, i) => {
        let status: NodeStatus = "idle";
        if (known.has(i)) status = "active";
        if (pending.has(i)) status = "candidate";
        if (current?.kind === "hit" && current.index === i) status = "cached";
        if (current && current.index === i && current.kind !== "hit") status = current.kind === "call" ? "candidate" : "optimal";
        if (finished && i === parsed.n) status = "optimal";
        return { index: i, value: known.has(i) ? known.get(i)! : null, status };
      }),
    [size, known, pending, current, finished, parsed.n],
  );

  const runAlgorithm = () => {
    if (generatedSteps.length === 0) return;
    if (finished) setCursor(-1);
    setIsRunning((value) => !value);
  };

  const reset = () => {
    setCursor(-1);
    setIsRunning(false);
  };

  const step = (delta: number) => {
    setIsRunning(false);
    setCursor((c) => Math.max(-1, Math.min(generatedSteps.length - 1, c + delta)));
  };

  const selectProblem = (id: string) => {
    const problem = playgroundProblems.find((item) => item.id === id) ?? playgroundProblems[0];
    setSelectedId(problem.id);
    setRawInput(problem.defaultInput);
  };

  const cacheHits = executedSteps.filter((s) => s.kind === "hit").length;

  return (
    <div className="min-h-full">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="relative mx-auto max-w-[1500px] px-5 py-9 sm:px-7 lg:px-9 lg:py-12">
          <SectionReveal>
            <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <HolographicLabel>
                  <BrainCircuit size={13} /> Interactive DP Lab
                </HolographicLabel>
                <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Think.
                  <br />
                  <span className="of-gradient-text">Execute. Visualize.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-[16px] leading-7 text-white/65">
                  Enter a problem and its input, then step through state generation, transitions and the DP table
                  one state at a time — in 3D.
                </p>
              </div>

              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                <MiniStat icon={<Activity size={16} />} label="Execution" value="Step-by-step" />
                <MiniStat icon={<Table2 size={16} />} label="State" value="Live DP table" />
              </div>
            </div>
          </SectionReveal>

          {/* PHASE PIPELINE */}
          <ol className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Execution phases">
            {PHASES.map((phase, index) => (
              <li key={phase}>
                <NeonFrame
                  active={index === phaseIndex}
                  quiet={index !== phaseIndex}
                  corners={index === phaseIndex}
                  radius={14}
                  className={`of-surface px-4 py-3 transition ${index <= phaseIndex ? "" : "opacity-55"}`}
                  style={{ borderRadius: 14 }}
                  aria-current={index === phaseIndex ? "step" : undefined}
                >
                  <div className="relative z-[5] flex items-center gap-2">
                    <span className={`font-mono text-[12px] ${index <= phaseIndex ? "text-cyan-200" : "text-white/45"}`}>0{index + 1}</span>
                    <span className="font-display text-[12px] font-bold tracking-[0.12em] text-white">{phase}</span>
                  </div>
                </NeonFrame>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WORKSPACE */}
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-9">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* LEFT PANEL */}
          <aside>
            <div className="sticky top-[84px] space-y-4">
              <div className="of-surface rounded-2xl p-5">
                <div className="flex items-center gap-2">
                  <Code2 size={15} className="text-cyan-400" />
                  <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/60">Problem</p>
                </div>
                <div className="of-frame of-field mt-4">
                  <div className="relative z-[5] flex items-center px-3">
                    <select
                      value={selectedId}
                      onChange={(event) => selectProblem(event.target.value)}
                      className="of-select !h-11 !text-[14px]"
                      aria-label="Problem"
                    >
                      {playgroundProblems.map((problem) => (
                        <option key={problem.id} value={problem.id}>
                          {problem.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="pointer-events-none shrink-0 text-white/55" />
                  </div>
                </div>
                <p className="mt-4 text-[14px] leading-6 text-white/60">{selectedProblem.description}</p>
              </div>

              <div className="of-surface rounded-2xl p-5">
                <label htmlFor="playground-input" className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/60">
                  Input
                </label>
                <p className="mt-1 text-[13px] text-white/55">{selectedProblem.inputLabel}</p>
                <div className="of-frame of-field mt-3" data-invalid={parsed.error ? "true" : undefined}>
                  <div className="relative z-[5] flex items-center px-3">
                    <input
                      id="playground-input"
                      type={selectedProblem.input === "number" ? "number" : "text"}
                      inputMode={selectedProblem.input === "number" ? "numeric" : "text"}
                      min={0}
                      max={20}
                      value={rawInput}
                      onChange={(event) => setRawInput(event.target.value)}
                      className="!h-11 font-mono !text-[14px]"
                      aria-invalid={Boolean(parsed.error) || undefined}
                    />
                  </div>
                </div>
                {parsed.error ? (
                  <p role="alert" className="mt-2 text-[13px] text-rose-200">{parsed.error}</p>
                ) : (
                  <p className="mt-2 font-mono text-[12px] text-white/50">{size} states · {generatedSteps.length} execution steps</p>
                )}
              </div>

              <div className="of-surface rounded-2xl p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/60">Execution strategy</p>
                <div className="mt-4 space-y-2">
                  <AlgorithmOption selected={algorithm === "tabulation"} title="Tabulation" description="Bottom-up · fill the table in order" onClick={() => setAlgorithm("tabulation")} />
                  <AlgorithmOption selected={algorithm === "memoization"} title="Memoization" description="Top-down · recurse, cache, reuse" onClick={() => setAlgorithm("memoization")} />
                </div>
              </div>

              {/* CONTROLS */}
              <div className="of-surface rounded-2xl p-4">
                <div className="flex gap-2">
                  <CinematicButton
                    size="md"
                    className="flex-1"
                    icon={isRunning ? <Pause size={15} /> : <Play size={15} />}
                    arrow={false}
                    onClick={runAlgorithm}
                    disabled={generatedSteps.length === 0}
                  >
                    {isRunning ? "Pause" : finished ? "Replay" : cursor >= 0 ? "Resume" : "Run DP"}
                  </CinematicButton>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 transition hover:text-white"
                    aria-label="Reset playground"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => step(-1)} disabled={cursor < 0} className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-white/10 text-[13px] text-white/75 transition hover:border-cyan-300/40 hover:text-white disabled:opacity-40">
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="min-w-[88px] text-center font-mono text-[12.5px] text-white/70" aria-live="polite">
                    STEP {Math.max(0, cursor + 1)}/{generatedSteps.length}
                  </span>
                  <button type="button" onClick={() => step(1)} disabled={cursor >= generatedSteps.length - 1} className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-white/10 text-[13px] text-white/75 transition hover:border-cyan-300/40 hover:text-white disabled:opacity-40">
                    Next <ChevronRight size={15} />
                  </button>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={Math.max(-1, generatedSteps.length - 1)}
                  value={cursor}
                  onChange={(event) => {
                    setIsRunning(false);
                    setCursor(Number(event.target.value));
                  }}
                  className="mt-3 w-full accent-cyan-400"
                  aria-label="Scrub execution steps"
                />
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <section className="min-w-0">
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard icon={<Target size={15} />} label="State" value={selectedProblem.state} />
              <InfoCard icon={<Zap size={15} />} label="Recurrence" value={selectedProblem.recurrence} mono />
              <InfoCard icon={<Clock3 size={15} />} label="Complexity" value={selectedProblem.complexity} />
            </div>

            {/* 3D STATE SPACE */}
            <NeonFrame active={cursor >= 0} radius={24} className="of-surface relative mt-5 overflow-hidden" style={{ borderRadius: 24 }}>
              <div className="relative h-[340px] sm:h-[400px]">
                {size > 0 && (
                  <Suspense fallback={null}>
                    <PlaygroundStateScene
                      className="absolute inset-0"
                      nodes={nodes}
                      currentIndex={current && current.kind === "compute" ? current.index : null}
                      dependencies={current && current.kind === "compute" ? current.dependencies : []}
                    />
                  </Suspense>
                )}
                <div className="pointer-events-none absolute inset-x-5 top-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[12px] tracking-[0.2em] text-cyan-100/80">STATE SPACE · {algorithm === "tabulation" ? "BOTTOM-UP" : "TOP-DOWN"}</span>
                  <DemoBadge kind="live">Computed in your browser</DemoBadge>
                </div>
              </div>

              <div className="relative z-[5] border-t border-white/[0.07] p-5">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {current ? `Step ${cursor + 1} · ${current.kind === "call" ? "recursive call" : current.kind === "hit" ? "cache hit" : current.kind === "base" ? "base case" : "transition"}` : "Current transition"}
                </p>
                <p className="mt-2 break-words font-mono text-[15px] text-cyan-200">
                  {current ? current.formula : "Press Run DP, or step through with Next."}
                </p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 transition-all duration-300"
                    style={{ width: generatedSteps.length === 0 ? "0%" : `${((cursor + 1) / generatedSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </NeonFrame>

            {/* DP TABLE */}
            <div className="of-surface mt-5 rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Table2 size={15} className="text-cyan-400" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/60">State table</p>
                    <h2 className="mt-1 text-[17px] font-semibold text-white">dp[] values</h2>
                  </div>
                </div>
                {result !== null && (
                  <div className="text-right">
                    <p className="text-[12px] text-white/55">Answer</p>
                    <p className="font-mono text-2xl font-semibold text-cyan-200">{result}</p>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto p-5">
                {size === 0 ? (
                  <EmptyTable />
                ) : (
                  <div className="flex min-w-max gap-2">
                    {nodes.map((node) => {
                      const isCurrent = current?.index === node.index;
                      return (
                        <div
                          key={node.index}
                          className={[
                            "flex w-16 flex-col overflow-hidden rounded-xl border transition-all duration-300",
                            isCurrent
                              ? "border-cyan-300/50 bg-cyan-300/[0.08] shadow-[0_0_20px_rgba(56,232,255,.18)]"
                              : node.value !== null
                                ? "border-white/[0.1] bg-white/[0.03]"
                                : "border-white/[0.05] bg-white/[0.01]",
                          ].join(" ")}
                        >
                          <div className="border-b border-white/[0.05] px-2 py-2 text-center font-mono text-[12px] text-white/55">dp[{node.index}]</div>
                          {selectedProblem.input === "array" && (
                            <div className="border-b border-white/[0.05] px-2 py-1 text-center font-mono text-[11px] text-violet-200/70">a={parsed.values[node.index]}</div>
                          )}
                          <div className={`px-2 py-3 text-center font-mono text-[15px] font-semibold ${node.value !== null ? "text-white" : "text-white/35"}`}>
                            {node.value !== null ? node.value : "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* INSPECTOR */}
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <section className="of-surface rounded-2xl p-5">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-cyan-400" />
                  <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-cyan-300">DP Inspector</p>
                </div>
                <div className="mt-5 space-y-4">
                  <InspectorRow label="State" value={selectedProblem.state} />
                  <InspectorRow label="Base Case" value={selectedProblem.baseCase} mono />
                  <InspectorRow label="Recurrence" value={selectedProblem.recurrence} mono />
                </div>
              </section>

              <section className="of-surface rounded-2xl p-5">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-cyan-400" />
                  <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-cyan-300">Execution insight</p>
                </div>
                <p className="mt-5 text-[15px] leading-7 text-white/68">
                  {current
                    ? current.kind === "hit"
                      ? `dp[${current.index}] was already solved, so memoization returns it instantly instead of recomputing the whole subtree.`
                      : current.kind === "call"
                        ? `solve(${current.index}) cannot finish yet — it waits for its subproblems.`
                        : `The engine settled state ${current.index} with value ${current.value}.`
                    : "Run the algorithm to watch each DP state get constructed from previously computed subproblems."}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 font-mono text-[12px]">
                  <div className="rounded-xl bg-white/[0.03] p-3 text-center"><div className="text-lg text-white">{known.size}</div><div className="text-white/50">solved</div></div>
                  <div className="rounded-xl bg-white/[0.03] p-3 text-center"><div className="text-lg text-white">{pending.size}</div><div className="text-white/50">pending</div></div>
                  <div className="rounded-xl bg-white/[0.03] p-3 text-center"><div className="text-lg text-white">{cacheHits}</div><div className="text-white/50">cache hits</div></div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                  <Check size={14} className={result !== null ? "text-cyan-400" : "text-white/45"} />
                  <span className="text-[13px] text-white/60">{result !== null ? "Execution completed." : "Waiting for execution…"}</span>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="text-cyan-300">{icon}</div>

      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-cyan-400">
        {icon}

        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/55">
          {label}
        </span>
      </div>

      <p
        className={[
          "mt-3 text-[13px] leading-5 text-white/62",
          mono
            ? "font-mono text-cyan-300/80"
            : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function AlgorithmOption({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
        selected
          ? "border-cyan-400/15 bg-cyan-400/[0.05]"
          : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.035]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg",
          selected
            ? "bg-cyan-400/[0.08] text-cyan-300"
            : "bg-white/[0.03] text-white/45",
        ].join(" ")}
      >
        {selected ? (
          <Check size={14} />
        ) : (
          <Code2 size={14} />
        )}
      </div>

      <div>
        <p
          className={[
            "text-xs font-medium",
            selected
              ? "text-white"
              : "text-white/62",
          ].join(" ")}
        >
          {title}
        </p>

        <p className="mt-0.5 text-[11px] text-white/45">
          {description}
        </p>
      </div>
    </button>
  );
}

function InspectorRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>

      <p
        className={[
          "mt-1.5 text-[13px] leading-5 text-white/62",
          mono
            ? "font-mono text-cyan-300/80"
            : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyTable() {
  return (
    <div className="flex min-h-[110px] items-center justify-center rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01]">
      <div className="text-center">
        <Table2
          size={20}
          className="mx-auto text-white/55"
        />

        <p className="mt-3 text-[12px] text-white/45">
          DP table will appear here after execution.
        </p>
      </div>
    </div>
  );
}