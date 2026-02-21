"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import FinancialSnapshotStep from "@/components/steps/FinancialSnapshot";
import RiskProfileStep from "@/components/steps/RiskProfile";
import StrategyResultStep from "@/components/steps/StrategyResult";
import SimulationStep from "@/components/steps/Simulation";
import ChatPanel from "@/components/ChatPanel";
import { FinancialSnapshot, RiskProfile, Strategy } from "@/types";

const STEPS = ["Financial Snapshot", "Risk Profile", "Your Strategy", "Simulation"];

export default function Home() {
  const [step, setStep] = useState(0); // 0 = landing
  const [currentStep, setCurrentStep] = useState(1);
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  function reset() {
    setStep(0);
    setCurrentStep(1);
    setSnapshot(null);
    setRiskProfile(null);
    setStrategy(null);
    setChatOpen(false);
  }

  // Landing page
  if (step === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
        <div className="max-w-xl text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            AI-Powered · Educational · Responsible
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Invest<span className="text-indigo-600">IQ</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            Your personalised investment coach. We&apos;ll understand your finances, match you with a strategy,
            and show you what your money could look like over time.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: "📊", label: "Financial Snapshot" },
              { icon: "⚖️", label: "Risk Profiling" },
              { icon: "📈", label: "AI Strategy + Simulation" },
            ].map((f) => (
              <div key={f.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs font-medium text-gray-700">{f.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(1)}
            className="px-10 py-4 bg-indigo-600 text-white font-bold text-lg rounded-2xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            Get Started →
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Educational purposes only. Not financial advice.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-1.5 group">
            <span className="text-xl font-extrabold text-indigo-600 group-hover:text-indigo-700">
              InvestIQ
            </span>
          </button>
          <div className="flex items-center gap-3">
            {currentStep >= 3 && (
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                <span>💬</span>
                Ask Coach
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <StepIndicator currentStep={currentStep} steps={STEPS} />
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {currentStep === 1 && (
          <FinancialSnapshotStep
            onNext={(data) => {
              setSnapshot(data);
              setCurrentStep(2);
            }}
          />
        )}
        {currentStep === 2 && (
          <RiskProfileStep
            onNext={(profile) => {
              setRiskProfile(profile);
              setCurrentStep(3);
            }}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && snapshot && riskProfile && (
          <StrategyResultStep
            snapshot={snapshot}
            riskProfile={riskProfile}
            onNext={(s) => {
              setStrategy(s);
              setCurrentStep(4);
            }}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && strategy && riskProfile && (
          <SimulationStep
            strategy={strategy}
            riskProfile={riskProfile}
            onBack={() => setCurrentStep(3)}
          />
        )}
      </div>

      {/* Chat Panel */}
      {chatOpen && currentStep >= 3 && (
        <ChatPanel
          context={{ strategy, risk_profile: riskProfile }}
          onClose={() => setChatOpen(false)}
        />
      )}
    </main>
  );
}
