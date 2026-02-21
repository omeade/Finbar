"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import FinancialSnapshotStep from "@/components/steps/FinancialSnapshot";
import RiskProfileStep from "@/components/steps/RiskProfile";
import StrategyResultStep from "@/components/steps/StrategyResult";
import SimulationStep from "@/components/steps/Simulation";
import type { FinancialSnapshot, RiskProfile, Strategy } from "@/types";
import {
  clearStoredPortfolioContext,
  writeStoredPortfolioContext,
} from "@/lib/portfolioContext";

const STEPS = ["Financial Snapshot", "Risk Profile", "Your Strategy", "Simulation"];

export default function PortfolioPage() {
  const [step, setStep] = useState(1);
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  function reset() {
    setStep(1);
    setSnapshot(null);
    setRiskProfile(null);
    setStrategy(null);
    clearStoredPortfolioContext();
  }

  return (
    <div className="space-y-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">
              Investment Wizard
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
              Build Your Portfolio
            </h1>
          </div>
          {step > 1 && (
            <button
              onClick={reset}
              className="text-xs text-[var(--muted-ink)] hover:text-[var(--ink)] transition"
            >
              Start over
            </button>
          )}
        </div>
        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--muted-ink)]">
          Your selected risk profile and generated strategy are now synced to the Agent panel automatically.
        </div>
      </section>

      <div className="app-panel fade-up rounded-3xl p-6">
        <StepIndicator currentStep={step} steps={STEPS} />
        <div className="mt-8">
          {step === 1 && (
            <FinancialSnapshotStep
              onNext={(data) => { setSnapshot(data); setStep(2); }}
            />
          )}
          {step === 2 && (
            <RiskProfileStep
              onNext={(profile) => {
                setRiskProfile(profile);
                writeStoredPortfolioContext({ strategy: null, risk_profile: profile });
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && snapshot && riskProfile && (
            <StrategyResultStep
              snapshot={snapshot}
              riskProfile={riskProfile}
              onNext={(s) => {
                setStrategy(s);
                writeStoredPortfolioContext({ strategy: s, risk_profile: riskProfile });
                setStep(4);
              }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && strategy && riskProfile && (
            <SimulationStep
              strategy={strategy}
              riskProfile={riskProfile}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
