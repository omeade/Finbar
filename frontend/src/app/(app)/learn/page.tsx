"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type LearningPath = "starter" | "builder" | "confident";

type Lesson = {
  id: string;
  title: string;
  minutes: number;
  level: LearningPath;
  summary: string;
  body: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  explain: string;
};

type GlossaryTerm = {
  term: string;
  definition: string;
  example: string;
};

const STORAGE_KEY = "finbar.learn.progress.v1";

const PATH_META: Record<LearningPath, { label: string; description: string }> = {
  starter: {
    label: "Starter",
    description: "Build fundamentals: cashflow, emergency fund, and simple ETF basics.",
  },
  builder: {
    label: "Builder",
    description: "Develop your process: risk sizing, diversification, and consistent investing.",
  },
  confident: {
    label: "Confident",
    description: "Level up decisions: portfolio review habits, market context, and behavior under volatility.",
  },
};

const LESSONS: Lesson[] = [
  {
    id: "budget-core",
    title: "Cashflow First: Invest from surplus",
    minutes: 6,
    level: "starter",
    summary: "Why investing starts with positive monthly cashflow and a repeatable budget.",
    body:
      "Your most important investing engine is monthly surplus. If income - expenses - safety savings is negative, fix that first. A steady surplus lets you invest without panic-selling later. Start with realistic expense tracking, cap variable spending, and set one automatic transfer day each month.",
  },
  {
    id: "risk-basics",
    title: "Risk, return, and time horizon",
    minutes: 8,
    level: "starter",
    summary: "How risk tolerance and timeline shape your stock/ETF mix.",
    body:
      "Risk is the size of possible downside, not just expected return. The longer your horizon, the more short-term volatility you can usually absorb. Choose a mix you can hold through bad months. A good plan is one you can stick with when prices fall.",
  },
  {
    id: "diversification",
    title: "Diversification that actually works",
    minutes: 10,
    level: "builder",
    summary: "Avoid concentration risk by spreading across sectors and asset types.",
    body:
      "Holding many tickers is not always diversified. If all holdings move together, risk stays concentrated. Real diversification blends broad market ETFs, geographies, and sometimes bonds/cash buffers. Review top position weights and ask: if this drops 30%, can I stay invested?",
  },
  {
    id: "dca-vs-lump",
    title: "DCA vs lump sum: practical decision rules",
    minutes: 7,
    level: "builder",
    summary: "How to choose between investing now or spreading entries over time.",
    body:
      "Lump sum tends to win over long periods because money is invested earlier. DCA can reduce emotional stress when markets feel uncertain. If fear would cause you to delay entirely, DCA is often the better real-world choice because consistency beats perfect timing.",
  },
  {
    id: "behavior",
    title: "Behavior > prediction",
    minutes: 9,
    level: "confident",
    summary: "Build a system that survives volatility instead of chasing headlines.",
    body:
      "Most underperformance comes from behavior: buying after rallies and selling after drops. Use rules: rebalance cadence, max position size, and a checklist before trades. Your edge is discipline and process, not guessing next week’s market move.",
  },
  {
    id: "review-cycle",
    title: "Monthly portfolio review checklist",
    minutes: 8,
    level: "confident",
    summary: "A lightweight routine to improve your portfolio decisions each month.",
    body:
      "Review once per month: 1) savings rate and emergency fund, 2) allocation drift, 3) biggest position weight, 4) fees and tax implications, 5) whether strategy still matches goals. Small recurring reviews outperform random, emotional changes.",
  },
];

const QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    question: "If your monthly cashflow is negative, what should come first?",
    choices: ["Increase stock allocation", "Fix spending/income gap", "Trade more frequently"],
    answer: 1,
    explain: "Investing works best from durable surplus; otherwise you may need to sell at bad times.",
  },
  {
    id: "q2",
    question: "Which is the strongest example of diversification?",
    choices: [
      "Five stocks in one sector",
      "One broad ETF + one bond ETF + cash buffer",
      "Only a single high-growth stock",
    ],
    answer: 1,
    explain: "Diversification reduces correlation and concentration risk.",
  },
  {
    id: "q3",
    question: "Why do many investors underperform their own portfolios?",
    choices: ["Expense ratios are always too high", "Behavior during volatility", "Markets are random daily"],
    answer: 1,
    explain: "Timing mistakes and emotional reactions are a common source of underperformance.",
  },
];

const TERMS: GlossaryTerm[] = [
  {
    term: "ETF",
    definition: "A fund that holds many assets and trades like a stock.",
    example: "A global equity ETF gives exposure to many companies in one position.",
  },
  {
    term: "Expense Ratio",
    definition: "Annual percentage fee charged by a fund.",
    example: "A 0.10% fee means €1 per year on each €1,000 invested.",
  },
  {
    term: "Drawdown",
    definition: "Drop from portfolio peak to a later low.",
    example: "If €10,000 falls to €8,000, drawdown is 20%.",
  },
  {
    term: "DCA",
    definition: "Dollar-cost averaging: invest fixed amounts on a schedule.",
    example: "Investing €300 on the 1st of each month regardless of market level.",
  },
  {
    term: "Rebalancing",
    definition: "Adjusting holdings back to target allocation.",
    example: "Selling some equity after a rally to restore a 70/30 target mix.",
  },
];

const VIDEOS = [
  {
    title: "Index Funds & ETFs for Beginners",
    creator: "Ben Felix",
    duration: "13 min",
    href: "https://www.youtube.com/results?search_query=Ben+Felix+index+funds",
  },
  {
    title: "Personal Finance and Budgeting Basics",
    creator: "Khan Academy",
    duration: "Playlist",
    href: "https://www.youtube.com/results?search_query=Khan+Academy+personal+finance+budgeting",
  },
  {
    title: "Behavioral Investing Mistakes",
    creator: "The Plain Bagel",
    duration: "10-20 min",
    href: "https://www.youtube.com/results?search_query=The+Plain+Bagel+behavioral+investing",
  },
  {
    title: "Bogleheads-style Long-Term Investing",
    creator: "Bogleheads / Community",
    duration: "Varies",
    href: "https://www.youtube.com/results?search_query=Bogleheads+long+term+investing",
  },
];

export default function LearnPage() {
  const [path, setPath] = useState<LearningPath>(() => {
    if (typeof window === "undefined") return "starter";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return "starter";
      const parsed = JSON.parse(raw) as { path?: LearningPath };
      return parsed.path ?? "starter";
    } catch {
      return "starter";
    }
  });
  const [expandedLesson, setExpandedLesson] = useState<string | null>(LESSONS[0]?.id ?? null);
  const [completed, setCompleted] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { completed?: string[] };
      return parsed.completed ?? [];
    } catch {
      return [];
    }
  });

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number | null>>(
    Object.fromEntries(QUIZ.map((q) => [q.id, null]))
  );
  const [showQuizResults, setShowQuizResults] = useState(false);

  const [amount, setAmount] = useState(300);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [years, setYears] = useState(15);

  const [glossaryQuery, setGlossaryQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, path }));
  }, [completed, path]);

  const pathLessons = useMemo(() => LESSONS.filter((lesson) => lesson.level === path), [path]);
  const overallProgress = Math.round((completed.length / LESSONS.length) * 100);

  const quizScore = useMemo(() => {
    return QUIZ.reduce((sum, q) => {
      if (quizAnswers[q.id] === q.answer) return sum + 1;
      return sum;
    }, 0);
  }, [quizAnswers]);

  const monthlyRate = annualReturn / 100 / 12;
  const periods = years * 12;
  const futureValue =
    monthlyRate === 0
      ? amount * periods
      : amount * ((Math.pow(1 + monthlyRate, periods) - 1) / monthlyRate);
  const totalContrib = amount * periods;
  const growth = futureValue - totalContrib;

  const filteredTerms = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return TERMS;
    return TERMS.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q)
    );
  }, [glossaryQuery]);

  function toggleCompleted(id: string) {
    setCompleted((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6 pb-6">
      <section className="app-panel fade-up rounded-3xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-ink)]">Learn</div>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)] md:text-3xl">
              Learn Investing with Reading + Interactive Practice
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">
              Build strong money habits with short lessons, quizzes, glossary tools, and practical calculators.
            </p>
          </div>
          <div className="min-w-[220px] rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
              Progress
            </div>
            <div className="mt-1 text-xl font-semibold text-[var(--ink)]">{overallProgress}% complete</div>
            <div className="mt-2 h-2 w-full rounded-full bg-[var(--border)]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Learning Paths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(PATH_META) as LearningPath[]).map((key) => (
              <button
                key={key}
                onClick={() => setPath(key)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  path === key
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--brand)]"
                )}
              >
                <div className="text-sm font-semibold text-[var(--ink)]">{PATH_META[key].label}</div>
                <div className="mt-1 text-xs text-[var(--muted-ink)]">{PATH_META[key].description}</div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {pathLessons.map((lesson) => {
              const isOpen = expandedLesson === lesson.id;
              const isDone = completed.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                >
                  <button
                    onClick={() => setExpandedLesson((prev) => (prev === lesson.id ? null : lesson.id))}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[var(--ink)]">{lesson.title}</div>
                      <div className="text-xs text-[var(--muted-ink)]">
                        {lesson.minutes} min read · {lesson.summary}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                        isDone ? "bg-emerald-100 text-emerald-700" : "bg-[var(--surface-soft)] text-[var(--muted-ink)]"
                      )}
                    >
                      {isDone ? "Done" : "Open"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--ink)]">
                      <p className="leading-relaxed">{lesson.body}</p>
                      <button
                        onClick={() => toggleCompleted(lesson.id)}
                        className="mt-3 rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand-strong)] transition hover:bg-[var(--brand)] hover:text-white"
                      >
                        {isDone ? "Mark Incomplete" : "Mark Complete"}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interactive Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {QUIZ.map((q, index) => (
              <div key={q.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                  Question {index + 1}
                </div>
                <div className="mt-1 text-sm font-medium text-[var(--ink)]">{q.question}</div>
                <div className="mt-2 grid gap-2">
                  {q.choices.map((choice, choiceIdx) => (
                    <button
                      key={choice}
                      onClick={() =>
                        setQuizAnswers((prev) => ({
                          ...prev,
                          [q.id]: choiceIdx,
                        }))
                      }
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-xs transition",
                        quizAnswers[q.id] === choiceIdx
                          ? "border-[var(--brand)] bg-[var(--surface)] text-[var(--ink)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-ink)] hover:border-[var(--brand)]"
                      )}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {showQuizResults ? (
                  <div className="mt-2 text-xs text-[var(--muted-ink)]">
                    {quizAnswers[q.id] === q.answer ? "Correct. " : "Not quite. "}
                    {q.explain}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowQuizResults(true)}
                className="rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                Check Answers
              </button>
              <button
                onClick={() => {
                  setQuizAnswers(Object.fromEntries(QUIZ.map((q) => [q.id, null])));
                  setShowQuizResults(false);
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)]"
              >
                Reset Quiz
              </button>
            </div>
            {showQuizResults ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]">
                Score: {quizScore}/{QUIZ.length}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compounding Simulator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Monthly Invest
                <input
                  type="number"
                  min={0}
                  step={25}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                />
              </label>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Annual Return %
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(Math.min(20, Math.max(0, Number(e.target.value) || 0)))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                />
              </label>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-ink)]">
                Years
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={years}
                  onChange={(e) => setYears(Math.min(45, Math.max(1, Number(e.target.value) || 1)))}
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-ink)]">Contributions</div>
                <div className="mt-1 text-lg font-semibold text-[var(--ink)]">€{Math.round(totalContrib).toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-ink)]">Growth</div>
                <div className="mt-1 text-lg font-semibold text-emerald-700">€{Math.round(growth).toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-ink)]">Projected Value</div>
                <div className="mt-1 text-lg font-semibold text-[var(--brand-strong)]">
                  €{Math.round(futureValue).toLocaleString()}
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--muted-ink)]">
              Educational estimate only. Real returns vary and markets are not linear.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Glossary Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              value={glossaryQuery}
              onChange={(e) => setGlossaryQuery(e.target.value)}
              placeholder="Search terms like ETF, DCA, drawdown..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--brand)]"
            />
            <div className="space-y-2">
              {filteredTerms.map((item) => (
                <div key={item.term} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="text-sm font-semibold text-[var(--ink)]">{item.term}</div>
                  <div className="mt-1 text-xs text-[var(--muted-ink)]">{item.definition}</div>
                  <div className="mt-2 rounded-xl bg-[var(--surface-soft)] px-2.5 py-2 text-xs text-[var(--ink)]">
                    Example: {item.example}
                  </div>
                </div>
              ))}
              {filteredTerms.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--muted-ink)]">
                  No glossary matches found.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Helpful YouTube Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {VIDEOS.map((video) => (
              <div key={video.href} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink)]">{video.title}</div>
                    <div className="mt-1 text-xs text-[var(--muted-ink)]">
                      {video.creator} · {video.duration}
                    </div>
                  </div>
                  <a
                    href={video.href}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--brand)]"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
            <p className="text-xs text-[var(--muted-ink)]">
              Tip: Start with one channel and follow a sequence instead of jumping between random clips.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
