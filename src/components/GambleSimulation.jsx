import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import {
  Atom,
  Beaker,
  ChevronLeft,
  FlaskConical,
  Home,
  Play,
  RotateCcw,
  Settings2,
  Shuffle,
  Sparkles,
} from "lucide-react";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function runSimulation({ numEnvs, probs, applyWAPWhenAllFail }) {
  const steps = probs.length;
  const grid = Array.from({ length: steps }, () =>
    Array.from({ length: numEnvs }, () => ({ status: "pending" }))
  );

  let alive = new Set(Array.from({ length: numEnvs }, (_, i) => i));
  let wapFilledEnv = null;

  for (let s = 0; s < steps; s++) {
    if (alive.size === 1) {
      const lone = [...alive][0];
      for (let s2 = s; s2 < steps; s2++) grid[s2][lone] = { status: "wap" };
      wapFilledEnv = lone;
      break;
    }

    const p = clamp(probs[s], 0, 1);
    const nextAlive = new Set();

    for (const env of alive) {
      const success = Math.random() < p;
      grid[s][env] = { status: success ? "success" : "fail" };
      if (success) nextAlive.add(env);
    }

    if (nextAlive.size === 0) {
      if (applyWAPWhenAllFail) {
        const chosen = Math.floor(Math.random() * numEnvs);
        for (let s2 = 0; s2 < steps; s2++) {
          grid[s2][chosen] = { status: "wap" };
        }
        wapFilledEnv = chosen;
        alive = new Set([chosen]);
        break;
      } else {
        alive = new Set();
        break;
      }
    }

    alive = nextAlive;
  }

  const survivors = new Set();
  const lastRow = grid[grid.length - 1];
  lastRow.forEach((cell, idx) => {
    if (cell.status === "success" || cell.status === "wap") survivors.add(idx);
  });

  return { grid, survivors: [...survivors], wapFilledEnv };
}

const expectedPerLineage = (probs) =>
  probs.reduce((acc, p) => acc * clamp(p, 0, 1), 1);

const DEFAULT_STEPS = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

const DEFAULT_STEP_NAMES = [
  "origin of DNA coding",
  "formation of proteins",
  "origin of system of heredity",
  "origin of metabolic cycles",
  "origin of RNA polymerase",
  "RNA captured by vesicles",
  "formation of stable vesicles",
  "formation of RNA strings",
];

function AppShell({ sidebarOpen, setSidebarOpen, children }) {
  const navItems = [
    { label: "Dashboard", icon: Home, active: true },
    { label: "Simulation", icon: Atom },
    { label: "Chemistry", icon: FlaskConical },
    { label: "Scenarios", icon: Beaker },
    { label: "Settings", icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside
          className={`border-r border-slate-800 bg-slate-900/95 transition-all duration-300 ${
            sidebarOpen ? "w-72" : "w-20"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                <Atom className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <div>
                  <p className="text-sm font-semibold tracking-wide text-white">Origin Lab</p>
                  <p className="text-xs text-slate-400">Simulation Suite</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          <nav className="space-y-2 p-3">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                  active
                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-6">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Origin-of-Life Gamble
                </h1>
                <p className="text-sm text-slate-400">
                  Matrix simulation for multi-environment origin scenarios
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300 hover:bg-emerald-500/10">
                  Research App
                </Badge>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-xl shadow-black/20">
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
        {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function ControlPanel({
  numEnvs,
  setNumEnvs,
  steps,
  adjustSteps,
  applyWAPWhenAllFail,
  setApplyWAPWhenAllFail,
  expectedStats,
  outcomeLabel,
  randomizeProbs,
  resetProbs,
  handleRun,
  handleClear,
}) {
  return (
    <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg text-white">Simulation Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Number of suitable prebiotic settings
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={50}
              value={numEnvs}
              onChange={(e) =>
                setNumEnvs(clamp(parseInt(e.target.value || "1", 10), 1, 50))
              }
              className="w-28 border-slate-700 bg-slate-950 text-white"
            />
            <span className="text-sm text-slate-400">1–50 columns</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Step count</label>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-slate-700 bg-slate-950 text-white hover:bg-slate-800" onClick={() => adjustSteps(-1)}>
              - step
            </Button>
            <Badge variant="secondary" className="bg-slate-800 text-slate-200">
              {steps} steps
            </Badge>
            <Button variant="outline" className="border-slate-700 bg-slate-950 text-white hover:bg-slate-800" onClick={() => adjustSteps(1)}>
              + step
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <Checkbox
            id="wap"
            checked={applyWAPWhenAllFail}
            onCheckedChange={(checked) => setApplyWAPWhenAllFail(Boolean(checked))}
            className="mt-0.5 border-slate-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-slate-950"
          />
          <div>
            <label htmlFor="wap" className="text-sm font-medium text-white">
              Apply WAP fallback if all lineages fail
            </label>
            <p className="mt-1 text-sm text-slate-400">
              When every column fails, one environment is retrospectively preserved as a dashed WAP path.
            </p>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Expected per lineage</p>
            <p className="mt-2 text-2xl font-bold text-white">{expectedStats.p.toFixed(6)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Expected reaching cell</p>
            <p className="mt-2 text-2xl font-bold text-white">{expectedStats.expectedCount.toFixed(3)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Outcome</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white">{outcomeLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleRun} className="rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400">
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
          <Button variant="outline" onClick={handleClear} className="rounded-2xl border-slate-700 bg-slate-950 text-white hover:bg-slate-800">
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button variant="outline" onClick={randomizeProbs} className="rounded-2xl border-slate-700 bg-slate-950 text-white hover:bg-slate-800">
            <Shuffle className="mr-2 h-4 w-4" />
            Randomize p
          </Button>
          <Button variant="outline" onClick={resetProbs} className="rounded-2xl border-slate-700 bg-slate-950 text-white hover:bg-slate-800">
            <Sparkles className="mr-2 h-4 w-4" />
            Reset p = 0.5
          </Button>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm font-medium text-slate-200">Legend</p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <LegendPill label="Success" className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300" glyph="✓" />
            <LegendPill label="Fail" className="border-rose-400/30 bg-rose-500/15 text-rose-300" glyph="X" />
            <LegendPill label="WAP" className="border-emerald-400/40 border-dashed bg-emerald-500/10 text-emerald-200" glyph="☘" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendPill({ label, glyph, className }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${className}`}>
      <span className="text-sm font-bold">{glyph}</span>
      <span>{label}</span>
    </div>
  );
}

function MatrixCell({ status }) {
  const variants = {
    pending: "border-slate-800 bg-slate-950 text-slate-600",
    success: "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
    fail: "border border-rose-400/40 bg-rose-500/20 text-rose-300",
    wap: "border-2 border-dashed border-emerald-400/50 bg-emerald-500/10 text-emerald-200",
  };

  const glyph = {
    pending: "•",
    success: "✓",
    fail: "X",
    wap: "☘",
  };

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${variants[status]}`}
    >
      {glyph[status]}
    </div>
  );
}

function StepProbabilityControl({ value, onChange, label }) {
  return (
    <div className="w-60 pr-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">p(step)</p>
          <span className="text-sm font-semibold text-white">{value.toFixed(2)}</span>
        </div>
        <Slider
          value={[value]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(vals) => onChange(Number(vals[0].toFixed(2)))}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{label}</p>
    </div>
  );
}

function ResultBadges({ result }) {
  if (!result) return null;

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Badge className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-slate-100 hover:bg-slate-800">
        Survivors: {result.survivors.length}
      </Badge>
      {result.survivors.length === 1 && (
        <Badge className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/10">
          Monophyly ⭐
        </Badge>
      )}
      {result.survivors.length > 1 && (
        <Badge className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/10">
          Polyphyly ⭐×{result.survivors.length}
        </Badge>
      )}
      {result.wapFilledEnv !== null && (
        <Badge className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-200 hover:bg-emerald-500/10">
          WAP applied (Env {result.wapFilledEnv + 1}) ☘
        </Badge>
      )}
    </div>
  );
}

function SimulationMatrix({
  numEnvs,
  probs,
  setProbs,
  result,
  runKey,
  stepNames,
}) {
  const steps = probs.length;
  const statuses = Array.from({ length: steps }, (_, sIdx) =>
    Array.from(
      { length: numEnvs },
      (_, envIdx) => result?.grid?.[sIdx]?.[envIdx]?.status || "pending"
    )
  );
  const displayOrder = Array.from({ length: steps }, (_, i) => steps - 1 - i);
  const isSurvivorCol = (c) => result?.survivors?.includes(c);

  return (
    <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-lg text-white">Matrix View</CardTitle>
        <p className="text-sm text-slate-400">
          Rows are steps, columns are environments. Step 1 is shown at the base and the final step at the top.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-2xl border border-slate-800 bg-slate-950/50">
          <div className="min-w-max p-4">
            <div
              className="grid items-center gap-2"
              style={{ gridTemplateColumns: `240px repeat(${numEnvs}, 40px) minmax(220px, 1fr)` }}
            >
              <div />
              {Array.from({ length: numEnvs }, (_, c) => (
                <div key={`star-${runKey}-${c}`} className="text-center text-sm text-slate-300">
                  {isSurvivorCol(c) ? "⭐" : ""}
                </div>
              ))}
              <div />

              {displayOrder.map((rowIdx) => (
                <React.Fragment key={`row-${runKey}-${rowIdx}`}>
                  <StepProbabilityControl
                    value={probs[rowIdx]}
                    label={stepNames[rowIdx] || `Step ${rowIdx + 1}`}
                    onChange={(v) => {
                      const next = [...probs];
                      next[rowIdx] = v;
                      setProbs(next);
                    }}
                  />

                  {Array.from({ length: numEnvs }, (_, c) => (
                    <MatrixCell key={`cell-${runKey}-${rowIdx}-${c}`} status={statuses[rowIdx][c]} />
                  ))}

                  <div className="pl-2 text-sm leading-5 text-slate-300">
                    {stepNames[rowIdx] || `Step ${rowIdx + 1}`}
                  </div>
                </React.Fragment>
              ))}

              <div />
              {Array.from({ length: numEnvs }, (_, i) => (
                <div key={`num-${runKey}-${i}`} className="text-center">
                  <div className="rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-500/20">
                    {i + 1}
                  </div>
                </div>
              ))}
              <div className="text-sm text-slate-400"># of suitable prebiotic settings</div>
            </div>
          </div>
        </ScrollArea>

        <ResultBadges result={result} />

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-7 text-slate-400">
          <span className="font-semibold text-slate-200">Notes.</span> Move the sliders to set each per-step success probability. Press Run to simulate across independent environments. A column survives only if it remains green through the final row, or if it receives a WAP auto-fill after becoming the lone remaining lineage. If WAP triggers after all lineages fail, one column is rendered as a continuous dashed path.
        </div>
      </CardContent>
    </Card>
  );
}

export default function GambleSimulationApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [numEnvs, setNumEnvs] = useState(10);
  const [applyWAPWhenAllFail, setApplyWAPWhenAllFail] = useState(true);
  const [probs, setProbs] = useState(DEFAULT_STEPS);
  const [result, setResult] = useState(null);
  const [runKey, setRunKey] = useState(0);

  const steps = probs.length;

  const expectedStats = useMemo(() => {
    const p = expectedPerLineage(probs);
    return { p, expectedCount: p * numEnvs };
  }, [probs, numEnvs]);

  const randomizeProbs = () =>
    setProbs((prev) => prev.map(() => Number(Math.random().toFixed(2))));

  const resetProbs = () =>
    setProbs(Array.from({ length: steps }, () => 0.5));

  const handleRun = () => {
    setResult(runSimulation({ numEnvs, probs, applyWAPWhenAllFail }));
    setRunKey((k) => k + 1);
  };

  const handleClear = () => {
    setResult(null);
    setRunKey((k) => k + 1);
  };

  const adjustSteps = (delta) => {
    let next = [...probs];
    if (delta > 0) {
      for (let i = 0; i < delta; i++) next.push(0.5);
    }
    if (delta < 0) {
      for (let i = 0; i < -delta; i++) next.pop();
    }
    if (next.length < 1) next = [0.5];
    setProbs(next);
  };

  const outcomeLabel = result
    ? result.survivors.length === 0
      ? "Zero survivors (no cell)"
      : result.survivors.length === 1
      ? "origin of life singularity (monophyly)"
      : `multiple origins of life (polyphyly): ${result.survivors.length}`
    : "—";

  const stepNames = Array.from({ length: steps }, (_, i) => DEFAULT_STEP_NAMES[i] || `Step ${i + 1}`);

  return (
    <AppShell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Expected per lineage"
            value={expectedStats.p.toFixed(6)}
            hint="Joint probability across all steps"
          />
          <StatCard
            label="Expected surviving lineages"
            value={expectedStats.expectedCount.toFixed(3)}
            hint="Expected environments reaching the final cell"
          />
          <StatCard
            label="Live outcome"
            value={outcomeLabel}
            hint="Updates after each run"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <ControlPanel
            numEnvs={numEnvs}
            setNumEnvs={setNumEnvs}
            steps={steps}
            adjustSteps={adjustSteps}
            applyWAPWhenAllFail={applyWAPWhenAllFail}
            setApplyWAPWhenAllFail={setApplyWAPWhenAllFail}
            expectedStats={expectedStats}
            outcomeLabel={outcomeLabel}
            randomizeProbs={randomizeProbs}
            resetProbs={resetProbs}
            handleRun={handleRun}
            handleClear={handleClear}
          />

          <SimulationMatrix
            numEnvs={numEnvs}
            probs={probs}
            setProbs={setProbs}
            result={result}
            runKey={runKey}
            stepNames={stepNames}
          />
        </section>
      </div>
    </AppShell>
  );
}
