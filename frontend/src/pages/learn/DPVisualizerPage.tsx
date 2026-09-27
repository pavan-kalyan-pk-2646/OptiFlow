import {
  Activity,
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronDown,
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
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { HolographicLabel } from "../../cinematic";
import StateSpaceExplorer from "../../components/learn/StateSpaceExplorer";
import { EXAMPLE_CONSTRAINTS, EXAMPLE_STAGES, type Objective } from "../../cinematic/exampleProblem";
import { readPipelines } from "../../cinematic/workspaceData";

type Algorithm = "tabulation" | "memoization";

type Problem = {
  id: string;
  title: string;
  description: string;
  state: string;
  recurrence: string;
  baseCase: string;
  complexity: string;
  defaultInput: number;
};

type DPNode = {
  index: number;
  value: number;
  dependencies: number[];
};

const problems: Problem[] = [
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    description:
      "Visualize how the number of ways to reach each stair is constructed from smaller subproblems.",
    state: "dp[i] = number of ways to reach stair i",
    recurrence: "dp[i] = dp[i - 1] + dp[i - 2]",
    baseCase: "dp[0] = 1, dp[1] = 1",
    complexity: "O(n) time · O(n) space",
    defaultInput: 8,
  },
  {
    id: "fibonacci",
    title: "Fibonacci Number",
    description:
      "Visualize the dependency graph behind the Fibonacci recurrence.",
    state: "dp[i] = Fibonacci number at index i",
    recurrence: "dp[i] = dp[i - 1] + dp[i - 2]",
    baseCase: "dp[0] = 0, dp[1] = 1",
    complexity: "O(n) time · O(n) space",
    defaultInput: 9,
  },
];

function createNodes(
  problemId: string,
  input: number,
): DPNode[] {
  const nodes: DPNode[] = [];

  if (problemId === "fibonacci") {
    nodes.push({
      index: 0,
      value: 0,
      dependencies: [],
    });

    if (input >= 1) {
      nodes.push({
        index: 1,
        value: 1,
        dependencies: [],
      });
    }
  } else {
    nodes.push({
      index: 0,
      value: 1,
      dependencies: [],
    });

    if (input >= 1) {
      nodes.push({
        index: 1,
        value: 1,
        dependencies: [],
      });
    }
  }

  for (let i = 2; i <= input; i += 1) {
    const previous = nodes[i - 1]?.value ?? 0;
    const beforePrevious = nodes[i - 2]?.value ?? 0;

    nodes.push({
      index: i,
      value: previous + beforePrevious,
      dependencies: [i - 1, i - 2],
    });
  }

  return nodes;
}

export default function DPVisualizerPage() {
  const savedPipelines = useMemo(() => readPipelines().filter((pipeline) => pipeline.stages?.length), []);
  const [spaceSource, setSpaceSource] = useState("example");
  const spaceConfig = useMemo(() => {
    const saved = savedPipelines.find((pipeline) => pipeline.id === spaceSource);
    if (saved) {
      return {
        stages: saved.stages.map((stage) => ({ id: stage.id, name: stage.name, strategies: stage.strategies })),
        deadline: saved.constraints?.deadline ?? 30,
        budget: saved.constraints?.budget ?? 1,
        objective: (saved.constraints?.objective as Objective) ?? "balanced",
        label: `Your pipeline · ${saved.name}`,
        kind: "live" as const,
      };
    }
    return {
      stages: EXAMPLE_STAGES,
      deadline: EXAMPLE_CONSTRAINTS.deadline,
      budget: EXAMPLE_CONSTRAINTS.budget,
      objective: EXAMPLE_CONSTRAINTS.objective as Objective,
      label: "Example · Studio default pipeline",
      kind: "demo" as const,
    };
  }, [savedPipelines, spaceSource]);

  const [selectedId, setSelectedId] = useState(
    "climbing-stairs",
  );

  const selectedProblem =
    problems.find(
      (problem) => problem.id === selectedId,
    ) ?? problems[0];

  const [input, setInput] = useState(
    selectedProblem.defaultInput,
  );

  const [algorithm, setAlgorithm] =
    useState<Algorithm>("tabulation");

  const [currentStep, setCurrentStep] = useState(-1);

  const [playing, setPlaying] = useState(false);

  const nodes = useMemo(
    () =>
      createNodes(
        selectedProblem.id,
        Math.min(
          12,
          Math.max(0, input || 0),
        ),
      ),
    [selectedProblem.id, input],
  );

  const currentNode =
    currentStep >= 0
      ? nodes[currentStep]
      : null;

  const completedCount =
    currentStep >= 0
      ? Math.min(
          currentStep + 1,
          nodes.length,
        )
      : 0;

  const finalResult =
    completedCount === nodes.length &&
    nodes.length > 0
      ? nodes[nodes.length - 1].value
      : null;

  useEffect(() => {
    if (!playing) {
      return;
    }

    if (currentStep >= nodes.length - 1) {
      setPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentStep((previous) =>
        Math.min(
          previous + 1,
          nodes.length - 1,
        ),
      );
    }, 850);

    return () => {
      window.clearTimeout(timer);
    };
  }, [playing, currentStep, nodes.length]);

  const reset = () => {
    setCurrentStep(-1);
    setPlaying(false);
  };

  const stepForward = () => {
    if (nodes.length === 0) {
      return;
    }

    setPlaying(false);

    setCurrentStep((previous) =>
      Math.min(
        previous + 1,
        nodes.length - 1,
      ),
    );
  };

  const togglePlay = () => {
    if (
      currentStep >=
      nodes.length - 1
    ) {
      setCurrentStep(-1);
    }

    setPlaying((previous) => !previous);
  };

  const selectProblem = (id: string) => {
    const problem =
      problems.find(
        (item) => item.id === id,
      ) ?? problems[0];

    setSelectedId(problem.id);
    setInput(problem.defaultInput);
    setCurrentStep(-1);
    setPlaying(false);
  };

  const handleInput = (
    value: string,
  ) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      setInput(0);
      reset();
      return;
    }

    setInput(
      Math.min(
        12,
        Math.max(0, parsed),
      ),
    );

    reset();
  };

  return (
    <div className="min-h-full">
      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-400/[0.04] blur-[130px]" />

        <div className="pointer-events-none absolute left-1/3 top-10 h-[320px] w-[520px] rounded-full bg-violet-500/[0.025] blur-[110px]" />

        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto max-w-[1500px] px-5 py-9 sm:px-7 lg:px-9 lg:py-12">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.17em] text-cyan-300">
                <BrainCircuit size={13} />
                DP Visualizer
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                See the states.
                <br />

                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Understand the transitions.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                Watch Dynamic Programming construct an
                optimal result through state dependencies,
                transitions, and a live DP table.
              </p>
            </div>

            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              <MiniStat
                icon={<Activity size={16} />}
                label="Visualization"
                value="Live states"
              />

              <MiniStat
                icon={<Zap size={16} />}
                label="Execution"
                value="Step-by-step"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN
          ===================================================== */}

      {/* =====================================================
          3D STATE SPACE — DP[i][time][cost]
          ===================================================== */}

      <section className="mx-auto max-w-[1500px] px-5 pt-8 sm:px-7 lg:px-9" aria-labelledby="state-space-title">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <HolographicLabel>Pipeline state space</HolographicLabel>
            <h2 id="state-space-title" className="mt-3 font-heading text-[28px] font-bold tracking-tight text-white sm:text-[34px]">
              DP[i][time][cost] in three dimensions
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-7 text-white/65">
              Every state the OptiFlow recurrence generates for a pipeline — stage on x, accumulated time on y,
              accumulated cost on z. Rotate, zoom and pan; click a state to inspect it.
            </p>
          </div>
          <div className="of-frame of-field w-full max-w-sm">
            <div className="relative z-[5] flex items-center gap-3 px-3">
              <span className="font-mono text-[11px] tracking-[0.18em] text-white/55">SOURCE</span>
              <select
                value={spaceSource}
                onChange={(event) => setSpaceSource(event.target.value)}
                className="of-select !h-11 !text-[14px]"
                aria-label="State space source"
              >
                <option value="example">Example · Studio default pipeline</option>
                {savedPipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    Saved · {pipeline.name} ({pipeline.stages.length} stages)
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none shrink-0 text-white/55" />
            </div>
          </div>
        </div>

        <StateSpaceExplorer
          key={spaceSource}
          stages={spaceConfig.stages}
          deadline={spaceConfig.deadline}
          budget={spaceConfig.budget}
          objective={spaceConfig.objective}
          sourceLabel={spaceConfig.label}
          sourceKind={spaceConfig.kind}
        />
      </section>

      <div className="mx-auto mt-14 max-w-[1500px] px-5 sm:px-7 lg:px-9">
        <HolographicLabel>Recurrence explorer</HolographicLabel>
        <h2 className="mt-3 font-heading text-[26px] font-bold tracking-tight text-white">Classic problems, state by state</h2>
      </div>

      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-9">
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          {/* =================================================
              CONTROL PANEL
              ================================================= */}

          <aside>
            <div className="sticky top-[96px] space-y-4">
              {/* PROBLEM */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2">
                  <Code2
                    size={15}
                    className="text-cyan-400"
                  />

                  <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/55">
                    Problem
                  </p>
                </div>

                <div className="relative mt-4">
                  <select
                    value={selectedId}
                    onChange={(event) =>
                      selectProblem(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 pr-9 text-xs text-slate-300 outline-none transition focus:border-cyan-400/20"
                  >
                    {problems.map(
                      (problem) => (
                        <option
                          key={problem.id}
                          value={problem.id}
                          className="bg-[#0d0d0e] text-white"
                        >
                          {problem.title}
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/55"
                  />
                </div>

                <p className="mt-4 text-xs leading-6 text-white/55">
                  {selectedProblem.description}
                </p>
              </div>

              {/* INPUT */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/55">
                  Input
                </p>

                <label className="mt-4 block">
                  <span className="mb-2 block text-[12px] text-white/55">
                    Input value
                  </span>

                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={input}
                    onChange={(event) =>
                      handleInput(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 font-mono text-sm text-white outline-none transition focus:border-cyan-400/20"
                  />
                </label>

                <p className="mt-2 text-[11px] text-white/45">
                  Maximum 12 states for readable
                  visualization.
                </p>
              </div>

              {/* ALGORITHM */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/55">
                  Algorithm
                </p>

                <div className="mt-4 space-y-2">
                  <AlgorithmButton
                    selected={
                      algorithm ===
                      "tabulation"
                    }
                    title="Tabulation"
                    description="Bottom-up state construction"
                    onClick={() =>
                      setAlgorithm(
                        "tabulation",
                      )
                    }
                  />

                  <AlgorithmButton
                    selected={
                      algorithm ===
                      "memoization"
                    }
                    title="Memoization"
                    description="Top-down cached states"
                    onClick={() =>
                      setAlgorithm(
                        "memoization",
                      )
                    }
                  />
                </div>
              </div>

              {/* CONTROLS */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="group flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-xs font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    {playing ? (
                      <Pause
                        size={14}
                        fill="currentColor"
                      />
                    ) : (
                      <Play
                        size={14}
                        fill="currentColor"
                        className="transition-transform group-hover:scale-110"
                      />
                    )}

                    {playing
                      ? "Pause"
                      : "Play"}
                  </button>

                  <button
                    type="button"
                    onClick={stepForward}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/62 transition hover:bg-white/[0.05] hover:text-white"
                    aria-label="Next step"
                  >
                    <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/62 transition hover:bg-white/[0.05] hover:text-white"
                    aria-label="Reset visualization"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-white/45">
                    <span>Progress</span>
                    <span>
                      {completedCount}/
                      {nodes.length}
                    </span>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-300"
                      style={{
                        width:
                          nodes.length === 0
                            ? "0%"
                            : `${
                                (completedCount /
                                  nodes.length) *
                                100
                              }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* =================================================
              VISUALIZER
              ================================================= */}

          <section className="min-w-0">
            {/* TOP INFORMATION */}

            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                icon={<Target size={15} />}
                label="State"
                value={selectedProblem.state}
              />

              <InfoCard
                icon={<Zap size={15} />}
                label="Recurrence"
                value={selectedProblem.recurrence}
                mono
              />

              <InfoCard
                icon={<Clock3 size={15} />}
                label="Complexity"
                value={selectedProblem.complexity}
              />
            </div>

            {/* STATE GRAPH */}

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-cyan-500/70">
                    State Graph
                  </p>

                  <h2 className="mt-1 text-base font-semibold text-white">
                    DP dependency map
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55">
                    {algorithm ===
                    "tabulation"
                      ? "Bottom-up"
                      : "Top-down"}
                  </span>

                  <span className="rounded-full bg-cyan-400/[0.05] px-2.5 py-1 text-[11px] text-cyan-400">
                    {currentNode
                      ? `State ${currentNode.index}`
                      : "Ready"}
                  </span>
                </div>
              </div>

              <div className="relative min-h-[330px] overflow-x-auto p-6 sm:p-8">
                <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />

                <div className="relative mx-auto flex min-w-[680px] max-w-5xl flex-col items-center">
                  {/* TARGET NODE */}

                  <div
                    className={[
                      "relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border transition-all duration-500",
                      currentNode?.index ===
                        nodes.length - 1
                        ? "border-cyan-400/50 bg-cyan-400/[0.1] shadow-[0_0_35px_rgba(34,211,238,0.12)]"
                        : "border-white/[0.08] bg-white/[0.025]",
                    ].join(" ")}
                  >
                    <span className="text-[11px] uppercase tracking-[0.15em] text-white/55">
                      Target
                    </span>

                    <span className="mt-1 font-mono text-lg font-semibold text-cyan-300">
                      dp[
                      {nodes.length - 1}
                      ]
                    </span>

                    {finalResult !==
                      null && (
                      <span className="mt-0.5 font-mono text-[11px] text-white/62">
                        = {finalResult}
                      </span>
                    )}
                  </div>

                  <div className="mt-7 flex items-start gap-3">
                    {nodes
                      .slice(
                        Math.max(
                          0,
                          nodes.length - 6,
                        ),
                      )
                      .map(
                        (
                          node,
                          localIndex,
                        ) => {
                          const actualIndex =
                            Math.max(
                              0,
                              nodes.length -
                                6,
                            ) +
                            localIndex;

                          const isActive =
                            actualIndex ===
                            currentStep;

                          const isVisited =
                            actualIndex <=
                            currentStep;

                          return (
                            <div
                              key={
                                node.index
                              }
                              className="flex items-center gap-3"
                            >
                              <StateNode
                                node={node}
                                active={
                                  isActive
                                }
                                visited={
                                  isVisited
                                }
                                target={
                                  actualIndex ===
                                  nodes.length -
                                    1
                                }
                              />

                              {actualIndex <
                                nodes.length -
                                  1 && (
                                <ArrowRight
                                  size={14}
                                  className={
                                    actualIndex <
                                    currentStep
                                      ? "text-cyan-400/50"
                                      : "text-white/55"
                                  }
                                />
                              )}
                            </div>
                          );
                        },
                      )}
                  </div>

                  <div className="mt-7 flex items-center gap-2 text-[11px] text-white/45">
                    <ArrowDown size={12} />

                    <span>
                      Each state depends on smaller
                      previously solved states
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CURRENT STATE */}

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
              <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Activity
                      size={15}
                      className="text-cyan-400"
                    />

                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/55">
                        Current State
                      </p>

                      <h2 className="mt-1 text-base font-semibold text-white">
                        Transition inspector
                      </h2>
                    </div>
                  </div>

                  {currentNode && (
                    <span className="rounded-full bg-cyan-400/[0.05] px-2.5 py-1 font-mono text-[11px] text-cyan-300">
                      dp[
                      {
                        currentNode.index
                      }
                      ]
                    </span>
                  )}
                </div>

                <div className="p-5">
                  {currentNode ? (
                    <>
                      <div className="rounded-2xl border border-cyan-400/10 bg-[#050506] p-5">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                          Computed value
                        </p>

                        <div className="mt-2 flex items-end gap-3">
                          <span className="font-mono text-3xl font-semibold text-cyan-300">
                            {currentNode.value}
                          </span>

                          <span className="mb-1 font-mono text-[12px] text-white/55">
                            state value
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                          Dependencies
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {currentNode
                            .dependencies
                            .length >
                          0 ? (
                            currentNode.dependencies.map(
                              (
                                dependency,
                              ) => (
                                <span
                                  key={
                                    dependency
                                  }
                                  className="rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04] px-3 py-2 font-mono text-[12px] text-cyan-300"
                                >
                                  dp[
                                  {
                                    dependency
                                  }
                                  ] ={" "}
                                  {
                                    nodes[
                                      dependency
                                    ]
                                      ?.value
                                  }
                                </span>
                              ),
                            )
                          ) : (
                            <span className="text-xs text-white/55">
                              Base case — no
                              dependencies.
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyInspector />
                  )}
                </div>
              </section>

              {/* RECURRENCE */}

              <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={15}
                    className="text-cyan-400"
                  />

                  <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-cyan-300">
                    Recurrence
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-white/[0.06] bg-[#050506] p-5">
                  <p className="font-mono text-sm leading-7 text-cyan-300">
                    {selectedProblem.recurrence}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    Base Case
                  </p>

                  <p className="mt-2 font-mono text-[13px] leading-6 text-white/62">
                    {selectedProblem.baseCase}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    Core idea
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/55">
                    Solve smaller states first, reuse their
                    results, and combine them to construct
                    the current state.
                  </p>
                </div>
              </section>
            </div>

            {/* DP TABLE */}

            <section className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Table2
                    size={15}
                    className="text-cyan-400"
                  />

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.17em] text-white/55">
                      DP Table
                    </p>

                    <h2 className="mt-1 text-base font-semibold text-white">
                      State memory
                    </h2>
                  </div>
                </div>

                {finalResult !==
                  null && (
                  <div className="text-right">
                    <p className="text-[11px] text-white/55">
                      Optimal result
                    </p>

                    <p className="font-mono text-lg font-semibold text-cyan-300">
                      {finalResult}
                    </p>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto p-5">
                <div className="flex min-w-max gap-2">
                  {nodes.map(
                    (node, index) => {
                      const visible =
                        index <=
                        currentStep;

                      const active =
                        index ===
                        currentStep;

                      return (
                        <div
                          key={node.index}
                          className={[
                            "w-16 overflow-hidden rounded-xl border transition-all duration-300",
                            active
                              ? "border-cyan-400/35 bg-cyan-400/[0.07]"
                              : visible
                                ? "border-white/[0.07] bg-white/[0.025]"
                                : "border-white/[0.04] bg-white/[0.01]",
                          ].join(" ")}
                        >
                          <div className="border-b border-white/[0.05] px-2 py-2 text-center font-mono text-[11px] text-white/55">
                            dp[
                            {
                              node.index
                            }
                            ]
                          </div>

                          <div
                            className={[
                              "px-2 py-3 text-center font-mono text-sm font-semibold",
                              visible
                                ? "text-slate-200"
                                : "text-white/55",
                            ].join(" ")}
                          >
                            {visible
                              ? node.value
                              : "—"}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </section>

            {/* LEGEND */}

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
              <Legend
                className="bg-cyan-400/[0.1] border-cyan-400/30"
                label="Current state"
              />

              <Legend
                className="bg-white/[0.035] border-white/[0.08]"
                label="Computed state"
              />

              <Legend
                className="bg-white/[0.01] border-white/[0.04]"
                label="Unvisited state"
              />

              <div className="ml-auto flex items-center gap-2 text-[11px] text-white/45">
                <BrainCircuit size={12} />
                DP Visualizer
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   COMPONENTS
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
      <div className="text-cyan-300">
        {icon}
      </div>

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

function AlgorithmButton({
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

function StateNode({
  node,
  active,
  visited,
  target,
}: {
  node: DPNode;
  active: boolean;
  visited: boolean;
  target: boolean;
}) {
  return (
    <div
      className={[
        "flex h-[78px] w-[72px] flex-col items-center justify-center rounded-2xl border transition-all duration-500",
        active
          ? "border-cyan-400/50 bg-cyan-400/[0.1] shadow-[0_0_28px_rgba(34,211,238,0.12)]"
          : target
            ? "border-violet-400/20 bg-violet-400/[0.04]"
            : visited
              ? "border-white/[0.08] bg-white/[0.035]"
              : "border-white/[0.05] bg-white/[0.015]",
      ].join(" ")}
    >
      <span className="font-mono text-[11px] text-white/55">
        dp[{node.index}]
      </span>

      <span
        className={[
          "mt-1 font-mono text-sm font-semibold",
          active
            ? "text-cyan-300"
            : visited
              ? "text-slate-200"
              : "text-white/45",
        ].join(" ")}
      >
        {visited ? node.value : "·"}
      </span>

      {target && (
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-violet-400/60">
          target
        </span>
      )}
    </div>
  );
}

function EmptyInspector() {
  return (
    <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
      <div className="text-center">
        <Activity
          size={20}
          className="mx-auto text-white/55"
        />

        <p className="mt-3 text-[12px] text-white/45">
          Press Play or Step to inspect a state.
        </p>
      </div>
    </div>
  );
}

function Legend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3 w-3 rounded-md border ${className}`}
      />

      <span className="text-[11px] text-white/55">
        {label}
      </span>
    </div>
  );
}