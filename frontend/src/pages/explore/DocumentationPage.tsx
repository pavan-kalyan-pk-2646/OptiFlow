import {
  BookOpen,
  Braces,
  CheckCircle2,
  Code2,
  Gauge,
  Layers3,
  Server,
  Settings2,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";

const sections = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
  },
  {
    id: "model",
    title: "Optimization Model",
    icon: Workflow,
  },
  {
    id: "dp",
    title: "DP Engine",
    icon: Braces,
  },
  {
    id: "api",
    title: "API",
    icon: Server,
  },
  {
    id: "workflow",
    title: "Workflow",
    icon: Layers3,
  },
];

export default function DocumentationPage() {
  const [active, setActive] = useState("overview");

  return (
    <div className="min-h-screen bg-[#070708] px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/[0.07] pb-8">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-cyan-400">
            <BookOpen size={13} />
            Documentation
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            OptiFlow Documentation
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
            Understand the platform, optimization model, Dynamic
            Programming engine and execution workflow.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* DOC NAV */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-2">
              {sections.map((section) => {
                const Icon = section.icon;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActive(section.id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs transition",
                      active === section.id
                        ? "bg-cyan-400/[0.07] text-cyan-300"
                        : "text-white/62 hover:bg-white/[0.025] hover:text-slate-300",
                    ].join(" ")}
                  >
                    <Icon size={15} />
                    {section.title}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* DOC CONTENT */}
          <main className="space-y-6">
            {active === "overview" && (
              <>
                <DocHero
                  eyebrow="01 · Overview"
                  title="What is OptiFlow?"
                  text="OptiFlow is a Dynamic Programming–driven software pipeline optimization platform."
                />

                <DocCard title="Core idea">
                  <p>
                    A pipeline contains ordered stages. Each stage
                    offers multiple execution strategies. Every
                    strategy has an execution time and cost.
                  </p>

                  <p>
                    OptiFlow chooses exactly one strategy for every
                    stage while respecting the configured deadline
                    and budget.
                  </p>
                </DocCard>

                <DocCard title="Platform layers">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Layer
                      icon={<Workflow size={17} />}
                      title="Pipeline"
                      text="Define stages and strategies."
                    />

                    <Layer
                      icon={<Settings2 size={17} />}
                      title="Constraints"
                      text="Set deadline, budget and objective."
                    />

                    <Layer
                      icon={<Zap size={17} />}
                      title="DP Engine"
                      text="Find the optimal feasible configuration."
                    />
                  </div>
                </DocCard>
              </>
            )}

            {active === "model" && (
              <>
                <DocHero
                  eyebrow="02 · Optimization Model"
                  title="A bounded decision-space problem."
                  text="The first OptiFlow model is intentionally constrained so that Dynamic Programming can be justified mathematically."
                />

                <DocCard title="Decision">
                  <CodeBlock>
                    {`Choose exactly one strategy for each stage.`}
                  </CodeBlock>
                </DocCard>

                <DocCard title="Constraints">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Rule
                      title="Deadline"
                      expression="total time ≤ deadline"
                    />

                    <Rule
                      title="Budget"
                      expression="total cost ≤ budget"
                    />
                  </div>
                </DocCard>

                <DocCard title="Objectives">
                  <div className="space-y-3">
                    <Rule
                      title="Minimize Time"
                      expression="minimize normalized execution time"
                    />

                    <Rule
                      title="Minimize Cost"
                      expression="minimize normalized execution cost"
                    />

                    <Rule
                      title="Balanced"
                      expression="0.65 × time + 0.35 × cost"
                    />
                  </div>
                </DocCard>
              </>
            )}

            {active === "dp" && (
              <>
                <DocHero
                  eyebrow="03 · DP Engine"
                  title="Dynamic Programming inside OptiFlow."
                  text="The engine represents intermediate pipeline decisions as reusable states."
                />

                <DocCard title="State">
                  <CodeBlock>
                    {`DP[i][time][cost]`}
                  </CodeBlock>

                  <p className="mt-4">
                    The state identifies the stage reached and the
                    accumulated execution time and cost.
                  </p>
                </DocCard>

                <DocCard title="Transition">
                  <CodeBlock>
                    {`nextTime = currentTime + strategy.time
nextCost = currentCost + strategy.cost`}
                  </CodeBlock>

                  <p className="mt-4">
                    A transition selects one strategy for the next
                    stage and creates a new feasible state.
                  </p>
                </DocCard>

                <DocCard title="Reconstruction">
                  <p>
                    Each selected state stores information about its
                    previous state. After the optimal final state is
                    found, OptiFlow walks backward through those
                    references to reconstruct the selected strategy
                    sequence.
                  </p>
                </DocCard>
              </>
            )}

            {active === "api" && (
              <>
                <DocHero
                  eyebrow="04 · API"
                  title="Optimization API"
                  text="The frontend sends the pipeline decision problem to the FastAPI backend."
                />

                <DocCard title="Run optimization">
                  <CodeBlock>
                    {`POST /optimization/run`}
                  </CodeBlock>

                  <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 p-5">
                    <p className="text-[12px] uppercase tracking-wider text-white/55">
                      Request
                    </p>

                    <pre className="mt-4 overflow-x-auto text-xs leading-6 text-cyan-200">
{`{
  "stages": [...],
  "deadline": 30,
  "budget": 1.00,
  "objective": "balanced"
}`}
                    </pre>
                  </div>
                </DocCard>

                <DocCard title="Response">
                  <p>
                    The backend returns the optimal result together
                    with DP metrics, selected strategies, stage
                    results and reconstruction information.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <Layer
                      icon={<Gauge size={17} />}
                      title="States"
                      text="Generated and stored DP states."
                    />

                    <Layer
                      icon={<Code2 size={17} />}
                      title="Transitions"
                      text="Strategy transitions evaluated."
                    />

                    <Layer
                      icon={<CheckCircle2 size={17} />}
                      title="Reconstruction"
                      text="Recovered optimal decisions."
                    />
                  </div>
                </DocCard>
              </>
            )}

            {active === "workflow" && (
              <>
                <DocHero
                  eyebrow="05 · Workflow"
                  title="From pipeline definition to result."
                  text="OptiFlow turns engineering decisions into a measurable optimization workflow."
                />

                <div className="space-y-3">
                  <WorkflowStep
                    number="01"
                    icon={<Workflow size={17} />}
                    title="Define Pipeline"
                    text="Create ordered stages and provide alternative execution strategies."
                  />

                  <WorkflowStep
                    number="02"
                    icon={<Settings2 size={17} />}
                    title="Set Constraints"
                    text="Specify the maximum execution time, maximum budget and optimization objective."
                  />

                  <WorkflowStep
                    number="03"
                    icon={<Braces size={17} />}
                    title="Build DP States"
                    text="The engine explores feasible intermediate states and reuses overlapping subproblems."
                  />

                  <WorkflowStep
                    number="04"
                    icon={<Zap size={17} />}
                    title="Optimize"
                    text="The engine identifies the best feasible final state according to the selected objective."
                  />

                  <WorkflowStep
                    number="05"
                    icon={<CheckCircle2 size={17} />}
                    title="Reconstruct"
                    text="Previous-state references are followed backward to recover the strategy sequence."
                  />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function DocHero({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <section className="rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.025] p-7 lg:p-9">
      <p className="text-[12px] uppercase tracking-[0.2em] text-cyan-400">
        {eyebrow}
      </p>

      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
        {title}
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
        {text}
      </p>
    </section>
  );
}

function DocCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-7">
      <h2 className="text-base font-semibold">
        {title}
      </h2>

      <div className="mt-5 text-sm leading-7 text-white/62">
        {children}
      </div>
    </section>
  );
}

function Layer({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="text-cyan-300">{icon}</div>

      <h3 className="mt-4 text-sm font-medium text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-white/55">
        {text}
      </p>
    </div>
  );
}

function Rule({
  title,
  expression,
}: {
  title: string;
  expression: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <p className="text-xs font-medium text-white">
        {title}
      </p>

      <code className="mt-3 block text-xs text-cyan-300">
        {expression}
      </code>
    </div>
  );
}

function CodeBlock({
  children,
}: {
  children: string;
}) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#050506] p-5 font-mono text-xs leading-6 text-cyan-200">
      {children}
    </pre>
  );
}

function WorkflowStep({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-5 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300">
        {icon}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] text-cyan-400">
            {number}
          </span>

          <h3 className="text-sm font-semibold">
            {title}
          </h3>
        </div>

        <p className="mt-2 text-xs leading-6 text-white/55">
          {text}
        </p>
      </div>
    </div>
  );
}