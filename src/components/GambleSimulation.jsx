import React, { useEffect, useMemo, useRef, useState } from "react";

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
        for (let s2 = 0; s2 < steps; s2++) grid[s2][chosen] = { status: "wap" };
        wapFilledEnv = chosen;
        alive = new Set([chosen]);
        break;
      }

      alive = new Set();
      break;
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

function formatProbability(value) {
  if (value === 0) return "0%";
  if (value >= 0.001) return `${(value * 100).toFixed(3)}%`;

  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exponent;
  return `${mantissa.toFixed(2)} × 10^${exponent}`;
}

function formatExpectedCount(value) {
  if (value === 0) return "0";
  if (value >= 0.001) return value.toFixed(3);

  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exponent;
  return `${mantissa.toFixed(2)} × 10^${exponent}`;
}

const DEFAULT_STEPS = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

const DEFAULT_STEP_NAMES = [
  "Amino acids form from inorganic chemistry",
  "Nucleotides assemble from simpler molecules",
  "Monomers concentrate in a local environment",
  "Monomers polymerize into chains without enzymes",
  "A molecule emerges that copies itself",
  "Copies vary and those differences are inherited",
  "A membrane forms that encloses the chemistry",
  "Replication and membrane division become coupled",
  "A code linking nucleotides to amino acids emerges",
  "Machinery that reads the code and builds proteins appears",
];

function SectionCard({ className = "", children }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <SectionCard className="p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{hint}</div>
    </SectionCard>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
        <span className="font-bold">✓</span>
        <span>success</span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700">
        <span className="font-bold">X</span>
        <span>fail</span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-emerald-300 bg-emerald-50 px-3 py-1.5 text-emerald-700">
        <span className="font-bold">☘</span>
        <span>WAP</span>
      </div>
    </div>
  );
}

function ConfigDrawer({ open, onClose, onRun, children }) {
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[100] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-slate-900/35 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 bottom-0 w-full max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Configure simulation</h2>
            <p className="text-sm text-slate-500">Adjust steps and probabilities</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRun}
              className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white active:bg-emerald-700"
            >
              Run
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Done
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

function ProbabilityEditor({ probs, setProbs, stepNames }) {
  const displayOrder = Array.from({ length: probs.length }, (_, i) => probs.length - 1 - i);

  return (
    <div className="space-y-4">
      {displayOrder.map((rowIdx) => (
        <div key={rowIdx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-900">{stepNames[rowIdx] || `Step ${rowIdx + 1}`}</div>
              <div className="text-xs text-slate-500">Per-step success probability</div>
            </div>
            <div className="rounded-xl bg-white px-2.5 py-1 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
              {Math.round(probs[rowIdx] * 100)}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={probs[rowIdx]}
            onChange={(e) => {
              const next = [...probs];
              next[rowIdx] = Number(Number(e.target.value).toFixed(2));
              setProbs(next);
            }}
            className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600"
          />
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wide text-slate-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Controls({
  compact = false,
  numEnvs,
  setNumEnvs,
  steps,
  adjustSteps,
  applyWAPWhenAllFail,
  setApplyWAPWhenAllFail,
  randomizeProbs,
  resetProbs,
  handleRun,
  handleClear,
  probs,
  setProbs,
  stepNames,
}) {
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <SectionCard className={compact ? "p-3" : "p-4"}>
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Suitable settings (columns)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={numEnvs}
              onChange={(e) => setNumEnvs(clamp(parseInt(e.target.value || "1", 10), 1, 50))}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500"
            />
            <div className="mt-1 text-xs text-slate-500">Choose between 1 and 50 environments.</div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Number of steps</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustSteps(-1)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                - step
              </button>
              <div className="min-w-24 rounded-2xl bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-700">
                {steps} total
              </div>
              <button
                type="button"
                onClick={() => adjustSteps(1)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + step
              </button>
            </div>
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={applyWAPWhenAllFail}
            onChange={(e) => setApplyWAPWhenAllFail(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <div className="text-sm font-medium text-slate-900">Apply WAP fallback if all lineages fail</div>
            <div className="mt-1 text-sm text-slate-500">
              If every environment fails, one column is retrospectively preserved as a continuous dashed path.
            </div>
          </div>
        </label>

        <div className={`mt-4 flex flex-wrap gap-2 ${compact ? "sticky bottom-0 bg-white pt-2" : ""}`}>
          <button
            type="button"
            onClick={handleRun}
            className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Run simulation
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={randomizeProbs}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Randomize probabilities
          </button>
          <button
            type="button"
            onClick={resetProbs}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset to 50%
          </button>
        </div>
      </SectionCard>

      <SectionCard className={compact ? "p-3" : "p-4"}>
        <div className="mb-3 text-sm font-semibold text-slate-900">Step probabilities</div>
        <ProbabilityEditor probs={probs} setProbs={setProbs} stepNames={stepNames} />
      </SectionCard>
    </div>
  );
}

function MatrixCell({ status, small = false }) {
  const variants = {
    pending: "border-slate-200 bg-white text-slate-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    fail: "border-rose-200 bg-rose-50 text-rose-700",
    wap: "border-emerald-300 border-dashed bg-emerald-50 text-emerald-700",
  };

  const glyph = {
    pending: "•",
    success: "✓",
    fail: "X",
    wap: "☘",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-xl border font-bold ${small ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"} ${variants[status]}`}
    >
      {glyph[status]}
    </div>
  );
}

function ResultBadges({ result }) {
  if (!result) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
        Survivors: {result.survivors.length}
      </div>
      {result.survivors.length === 1 && (
        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
          Monophyly ⭐
        </div>
      )}
      {result.survivors.length > 1 && (
        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
          Polyphyly ⭐×{result.survivors.length}
        </div>
      )}
      {result.wapFilledEnv !== null && (
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
          WAP applied in env {result.wapFilledEnv + 1}
        </div>
      )}
    </div>
  );
}

function MobileMatrixViewer({ numEnvs, probs, result, stepNames }) {
  const [activeEnv, setActiveEnv] = useState(0);
  const steps = probs.length;
  const displayOrder = Array.from({ length: steps }, (_, i) => steps - 1 - i);
  const isSurvivor = result?.survivors?.includes(activeEnv);

  useEffect(() => {
    if (activeEnv > numEnvs - 1) setActiveEnv(Math.max(0, numEnvs - 1));
  }, [activeEnv, numEnvs]);

  return (
    <div className="md:hidden">
      <SectionCard className="overflow-hidden p-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Matrix view</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Swipe the environment strip below, then inspect one column at a time.
            </p>
          </div>
        </div>

        <div className="mb-3">
          <Legend />
        </div>

        <div className="mb-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            {Array.from({ length: numEnvs }, (_, idx) => {
              const selected = idx === activeEnv;
              const survivor = result?.survivors?.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveEnv(idx)}
                  className={`min-w-[56px] rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {survivor ? "⭐ " : ""}{idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
            Viewing environment <span className="font-semibold">{activeEnv + 1}</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
            {isSurvivor ? "Survived to end ⭐" : "Did not survive"}
          </div>
        </div>

        <div className="space-y-2">
          {displayOrder.map((rowIdx) => {
            const status = result?.grid?.[rowIdx]?.[activeEnv]?.status || "pending";
            return (
              <div
                key={rowIdx}
                className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <MatrixCell status={status} small={true} />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-5 text-slate-900">
                    {stepNames[rowIdx] || `Step ${rowIdx + 1}`}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    p = {probs[rowIdx].toFixed(2)} ({Math.round(probs[rowIdx] * 100)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <ResultBadges result={result} />
      </SectionCard>
    </div>
  );
}

function DesktopMatrixViewer({ numEnvs, probs, result, runKey, stepNames }) {
  const steps = probs.length;
  const statuses = Array.from({ length: steps }, (_, sIdx) =>
    Array.from(
      { length: numEnvs },
      (_, envIdx) => result?.grid?.[sIdx]?.[envIdx]?.status || "pending"
    )
  );
  const displayOrder = Array.from({ length: steps }, (_, i) => steps - 1 - i);
  const isSurvivorCol = (c) => result?.survivors?.includes(c);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (result?.survivors?.length) {
      const first = result.survivors[0];
      const leftPad = 160;
      const cellWidth = 46;
      el.scrollLeft = Math.max(0, first * cellWidth - leftPad);
    } else {
      el.scrollLeft = 0;
    }
  }, [result, numEnvs]);

  return (
    <div className="hidden md:block">
      <SectionCard className="overflow-hidden p-3 sm:p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Matrix view</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Each row is a step. Each column is an environment. Step 1 is shown at the bottom and the final step at the top.
            </p>
          </div>
          <Legend />
        </div>

        <div
          ref={scrollerRef}
          className="overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-200 bg-slate-50 overscroll-contain touch-pan-x"
        >
          <div className="min-w-max p-3 sm:p-4">
            <div
              className="grid items-center gap-2"
              style={{ gridTemplateColumns: `minmax(220px, 250px) repeat(${numEnvs}, 44px) minmax(120px, 1fr)` }}
            >
              <div />
              {Array.from({ length: numEnvs }, (_, c) => (
                <div key={`star-${runKey}-${c}`} className="text-center text-sm text-slate-500">
                  {isSurvivorCol(c) ? "⭐" : ""}
                </div>
              ))}
              <div />

              {displayOrder.map((rowIdx) => (
                <React.Fragment key={`row-${runKey}-${rowIdx}`}>
                  <div className="pr-2">
                    <div className="text-sm font-medium leading-5 text-slate-900">
                      {stepNames[rowIdx] || `Step ${rowIdx + 1}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      p = {probs[rowIdx].toFixed(2)} ({Math.round(probs[rowIdx] * 100)}%)
                    </div>
                  </div>

                  {Array.from({ length: numEnvs }, (_, c) => (
                    <MatrixCell key={`cell-${runKey}-${rowIdx}-${c}`} status={statuses[rowIdx][c]} />
                  ))}

                  <div className="pl-2 text-xs leading-5 text-slate-500 sm:text-sm">
                    {rowIdx === 0 ? "Base step" : rowIdx === steps - 1 ? "Final step" : "Intermediate step"}
                  </div>
                </React.Fragment>
              ))}

              <div />
              {Array.from({ length: numEnvs }, (_, i) => (
                <div key={`num-${runKey}-${i}`} className="text-center">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                    {i + 1}
                  </div>
                </div>
              ))}
              <div className="text-sm text-slate-500">environment index</div>
            </div>
          </div>
        </div>

        <ResultBadges result={result} />
      </SectionCard>
    </div>
  );
}

export default function GambleSimulationApp() {
  const [numEnvs, setNumEnvs] = useState(10);
  const [applyWAPWhenAllFail, setApplyWAPWhenAllFail] = useState(true);
  const [probs, setProbs] = useState(DEFAULT_STEPS);
  const [result, setResult] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);

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
    setControlsOpen(false);
  };

  const handleClear = () => {
    setResult(null);
    setRunKey((k) => k + 1);
  };

  const adjustSteps = (delta) => {
    let next = [...probs];
    if (delta > 0) for (let i = 0; i < delta; i++) next.push(0.5);
    if (delta < 0) for (let i = 0; i < -delta; i++) next.pop();
    if (next.length < 1) next = [0.5];
    setProbs(next);
  };

  const outcomeLabel = result
    ? result.survivors.length === 0
      ? "Zero survivors"
      : result.survivors.length === 1
      ? "One surviving lineage"
      : `${result.survivors.length} surviving lineages`
    : "Not run yet";

  const stepNames = Array.from(
    { length: steps },
    (_, i) => DEFAULT_STEP_NAMES[i] || `Step ${i + 1}`
  );

  const drawerControls = (
    <Controls
      compact={true}
      numEnvs={numEnvs}
      setNumEnvs={setNumEnvs}
      steps={steps}
      adjustSteps={adjustSteps}
      applyWAPWhenAllFail={applyWAPWhenAllFail}
      setApplyWAPWhenAllFail={setApplyWAPWhenAllFail}
      randomizeProbs={randomizeProbs}
      resetProbs={resetProbs}
      handleRun={handleRun}
      handleClear={handleClear}
      probs={probs}
      setProbs={setProbs}
      stepNames={stepNames}
    />
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1600px] p-3 pb-24 sm:p-5 sm:pb-28 lg:p-6 lg:pb-6">
        <div className="mb-4 flex flex-col gap-4 lg:mb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Origin-of-Life Gamble
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
              Simulate multiple environments competing to survive a sequence of origin-of-life steps.
              Adjust the per-step success probabilities, then run the matrix.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[700px]">
            <MetricCard
              label="Per-lineage probability"
              value={formatProbability(expectedStats.p)}
              hint="Chance that a single environment survives every step. Tiny values switch to scientific notation."
            />
            <MetricCard
              label="Expected survivors"
              value={formatExpectedCount(expectedStats.expectedCount)}
              hint="Average number of environments expected to reach the end. Tiny values switch to scientific notation."
            />
            <MetricCard
              label="Current outcome"
              value={outcomeLabel}
              hint="Result from the most recent run."
            />
          </div>
        </div>

        <div className="mb-4 flex justify-end  items-center gap-2">
          <button
            type="button"
            onClick={() => setControlsOpen(true)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex-1"
          >
            Edit thresholds & settings
          </button>
                    <button
            type="button"
            onClick={handleRun}
            className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white active:bg-emerald-700"
          >
            Run
          </button>
        </div>

        <div className="space-y-4 md:hidden">
          <MobileMatrixViewer
            numEnvs={numEnvs}
            probs={probs}
            result={result}
            stepNames={stepNames}
          />
        </div>

        <DesktopMatrixViewer
          numEnvs={numEnvs}
          probs={probs}
          result={result}
          runKey={runKey}
          stepNames={stepNames}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2">
          <button
            type="button"
            onClick={() => setControlsOpen(true)}
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 active:bg-slate-50"
          >
            Edit thresholds & settings
          </button>
          <button
            type="button"
            onClick={handleRun}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white active:bg-emerald-700"
          >
            Run
          </button>
        </div>
      </div>

      <ConfigDrawer open={controlsOpen} onClose={() => setControlsOpen(false)} onRun={handleRun}>
        {drawerControls}
      </ConfigDrawer>
    </div>
  );
}
