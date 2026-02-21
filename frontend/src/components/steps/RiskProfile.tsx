"use client";

import { useState } from "react";
import { RiskProfile } from "@/types";

interface Props {
  onNext: (profile: RiskProfile) => void;
  onBack: () => void;
}

const profiles: {
  id: RiskProfile;
  label: string;
  tagline: string;
  returns: string;
  description: string;
  color: string;
  ring: string;
  badge: string;
  icon: string;
}[] = [
  {
    id: "conservative",
    label: "Conservative",
    tagline: "Safe & Steady",
    returns: "4–7% / year",
    description:
      "Capital preservation is the priority. Mostly bonds and stable funds with a small equity allocation. Low volatility — your portfolio won't swing wildly.",
    color: "border-emerald-400",
    ring: "ring-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    icon: "🛡️",
  },
  {
    id: "balanced",
    label: "Balanced",
    tagline: "Grow & Protect",
    returns: "7–10% / year",
    description:
      "A classic mix of growth and stability. Broad ETFs with a bond cushion. Best for medium-term horizons who can tolerate some volatility.",
    color: "border-indigo-400",
    ring: "ring-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
    icon: "⚖️",
  },
  {
    id: "aggressive",
    label: "Aggressive",
    tagline: "Maximum Growth",
    returns: "10–15% / year",
    description:
      "High equity exposure aiming for maximum long-term returns. Expect significant short-term swings. Suitable for 5+ year horizons.",
    color: "border-rose-400",
    ring: "ring-rose-200",
    badge: "bg-rose-100 text-rose-700",
    icon: "🚀",
  },
];

export default function RiskProfileStep({ onNext, onBack }: Props) {
  const [selected, setSelected] = useState<RiskProfile | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Risk Profile</h2>
        <p className="text-gray-500 mt-1">
          How comfortable are you with your investments going up and down in value?
        </p>
      </div>

      <div className="space-y-4">
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
              selected === p.id
                ? `${p.color} ring-4 ${p.ring} bg-white`
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{p.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-lg">{p.label}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.badge}`}>
                    {p.tagline}
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-500 mb-2">
                  Expected return: {p.returns}
                </div>
                <p className="text-sm text-gray-600">{p.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 mt-1 flex-shrink-0 flex items-center justify-center ${
                  selected === p.id ? `${p.color} bg-white` : "border-gray-300"
                }`}
              >
                {selected === p.id && (
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      p.id === "conservative"
                        ? "bg-emerald-400"
                        : p.id === "balanced"
                        ? "bg-indigo-400"
                        : "bg-rose-400"
                    }`}
                  />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => selected && onNext(selected)}
          disabled={!selected}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Generate Strategy →
        </button>
      </div>
    </div>
  );
}
