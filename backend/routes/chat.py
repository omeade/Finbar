import os
import traceback
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
CHAT_MAX_TOKENS = int(os.getenv("OPENAI_CHAT_MAX_TOKENS", "550"))

chat_bp = Blueprint("chat", __name__)

APP_KNOWLEDGE = """
ABOUT FINBAR:
Finbar is a personal finance and investment copilot app. It helps users manage their budget, understand investments, track their portfolio, and learn about finance. Here is what every page does:

1. DASHBOARD: Shows a financial overview with net worth trend, monthly income, monthly spending, budget status (on track / at risk), and AI-generated recommendations. Uses mock data for demonstration.

2. ADVISOR (Budget page): The user enters monthly income (after tax), total monthly expenses, monthly savings target, risk profile (conservative/balanced/aggressive), emergency fund months covered, whether they have high-interest debt, and investment time horizon in years. The app calculates: surplus = income - expenses - savings. Investable amount = 50% of surplus. Budget status: "healthy" if surplus >= 200, "tight" if 0-200, "overspending" if negative. Clicking "Generate Strategy" creates a personalised investment allocation using AI.

3. MARKET (Stocks page): Users browse and compare stocks and ETFs. They can search by company name or ticker (e.g. "Apple", "AAPL"), filter by group (All, Tech, Healthcare, Finance, Energy, Consumer, ETF), add up to 12 symbols to a comparison chart, and view normalised 1-year performance charts using live Stooq data. Risk ratings: low (stable ETFs/bonds), medium (diversified equities), high (individual stocks/sector ETFs).

4. LEARN: Educational content with learning paths (Starter: cashflow, risk basics; Builder: diversification, DCA vs lump sum; Confident: behaviour, monthly review), an interactive quiz, a compounding simulator (monthly amount + annual return + years = projected value), a glossary search (ETF, DCA, drawdown, expense ratio, rebalancing), and curated YouTube resources.

5. SIMULATE STOCK: A stock trading simulator to practise buying and selling without real money. Helps users learn order types and position sizing risk-free.

6. PORTFOLIO: Connect a Trading 212 brokerage account via API Key ID and Secret Key. Once connected shows live account cash (free, invested, total, P&L) and all open positions (ticker, quantity, average price, current price, P&L per position). Supports live and demo Trading 212 accounts.

7. SETTINGS: Personalise display name, email, currency (EUR/USD/GBP), monthly savings goal, AI response length, agent debug logs, theme (light/dark), accent colour (ocean/mint/sunset), and default startup page.

KEY FINANCIAL CONCEPTS IN THE APP:
- Surplus investing: only invest money not needed for living or emergencies
- Emergency fund: 3+ months of expenses recommended before investing
- Risk profiles: conservative (bonds-heavy), balanced (60/40 ETF/bonds), aggressive (equity-heavy)
- DCA: dollar-cost averaging — investing a fixed amount on a regular schedule
- ETFs: low-cost index-tracking funds with built-in diversification
- Rebalancing: periodically restoring your target asset allocation
- Compounding: investment returns generating further returns over time

EDUCATIONAL GUIDANCE ON STOCKS AND INDEXES:
You can and should give specific educational examples of well-known ETFs and indexes that suit a user's risk profile. Always frame these as educational examples, not personal financial advice. Here is your knowledge base:

BROAD MARKET INDEX ETFs (suitable for most investors):
- VWRP / VWCE (Vanguard FTSE All-World) — single fund covering 3,700+ global stocks across developed and emerging markets. The go-to for long-term, low-cost global diversification. Expense ratio ~0.22%.
- IWDA (iShares Core MSCI World) — developed markets only (no emerging). Lower volatility than all-world. Expense ratio ~0.20%.
- CSPX / SPY (S&P 500) — 500 largest US companies. Strong long-term track record. US-heavy. Expense ratio 0.03–0.07%.
- VUSA (Vanguard S&P 500 UCITS ETF) — same as above, popular in Europe. Expense ratio ~0.07%.
- QQQ / EQQQ (NASDAQ-100) — top 100 non-financial US companies, heavily tech. Higher growth potential, higher volatility.

BOND ETFs (for stability / conservative allocation):
- VAGU / AGGH (Vanguard Global Aggregate Bond) — diversified global bonds. Reduces portfolio volatility.
- BND (Vanguard Total Bond Market) — US bonds, widely used in US portfolios.
- IGLT (iShares UK Gilts) — UK government bonds, low risk.
- IDTM (iShares EUR Govt Bond) — Eurozone government bonds, suitable for EUR investors.

SECTOR / THEMATIC ETFs (higher risk, for aggressive allocation):
- INRG / ICLN (clean energy) — renewable energy companies globally.
- IITU / XLK (technology) — tech-focused, high growth potential but volatile.
- HEAL (healthcare) — defensive sector ETF.
- IQQH (ESG screened global) — global equities with ESG filters.

INDIVIDUAL STOCKS (examples only, higher single-stock risk):
- Apple (AAPL), Microsoft (MSFT), Nvidia (NVDA) — mega-cap tech, widely held
- Amazon (AMZN), Alphabet (GOOGL) — big tech / consumer
- Note: individual stocks carry concentration risk; prefer ETFs for most of a portfolio

MATCHING RISK PROFILES TO ETF CHOICES:
- Conservative investor: 50–60% bond ETF (VAGU/BND) + 30–40% global equity ETF (IWDA/VWRP) + cash buffer
- Balanced investor: 60–70% global equity ETF (VWRP/IWDA or S&P 500) + 20–30% bond ETF + optional 5–10% sector ETF
- Aggressive investor: 70–80% global equity ETF + 10–20% growth/tech ETF (QQQ/EQQQ) + 5–10% individual stocks if desired

WHERE TO BUY (platforms the app integrates with):
- Trading 212 (connected via Portfolio page) — commission-free, supports fractional shares, both ISA and invest accounts
- Other common platforms: Degiro, eToro, Revolut Stocks, Freetrade (EU/UK)

IMPORTANT CAVEATS TO ALWAYS MENTION:
- Past performance does not guarantee future results
- ETF suggestions are educational examples based on widely-used, low-cost funds
- Users should consider their own tax situation (e.g. ETFs domiciled in Ireland are tax-efficient for EU investors)
- Always encourage users to do their own research (DYOR) before investing
"""


def build_user_context_block(context: dict) -> str:
    lines = []

    settings = context.get("settings") or {}
    name = settings.get("displayName", "").strip()
    currency = settings.get("currency", "EUR")
    savings_goal = settings.get("monthlySavingsGoal", 0)
    response_length = settings.get("responseLength", "normal")
    if name:
        lines.append(f"User name: {name}")
    lines.append(f"Preferred currency: {currency}")
    if savings_goal:
        lines.append(f"Monthly savings goal: {currency}{savings_goal}")
    lines.append(f"Preferred AI response length: {response_length}")

    budget = context.get("budget") or {}
    if budget:
        lines.append("")
        lines.append("ADVISOR PAGE INPUTS:")
        lines.append(f"  Monthly income: {currency}{budget.get('income', 0)}")
        lines.append(f"  Monthly expenses: {currency}{budget.get('expenses', 0)}")
        lines.append(f"  Monthly savings target: {currency}{budget.get('savings', 0)}")
        lines.append(f"  Monthly surplus: {currency}{budget.get('surplus', 0)}")
        lines.append(f"  Savings rate: {budget.get('savingsRate', '0')}%")
        lines.append(f"  Monthly investable (50% of surplus): {currency}{budget.get('investable', 0)}")
        lines.append(f"  Risk profile: {budget.get('riskProfile', 'balanced')}")
        lines.append(f"  Emergency fund: {budget.get('emergencyFundMonths', 0)} months covered")
        lines.append(f"  Has high-interest debt: {budget.get('hasDebt', False)}")
        lines.append(f"  Investment time horizon: {budget.get('timeHorizonYears', 0)} years")
        lines.append(f"  Budget status: {budget.get('budgetStatus', 'unknown')}")

    strategy = context.get("strategy") or {}
    risk_profile = context.get("risk_profile", "")
    if strategy:
        lines.append("")
        lines.append("GENERATED INVESTMENT STRATEGY:")
        lines.append(f"  Risk profile: {risk_profile}")
        lines.append(f"  Monthly investable: {currency}{strategy.get('monthly_investable', 0)}")
        lines.append(f"  Monthly surplus: {currency}{strategy.get('monthly_surplus', 0)}")
        lines.append(f"  Ready to invest: {strategy.get('ready_to_invest', False)}")
        allocation = strategy.get("allocation", [])
        if allocation:
            lines.append("  Allocation:")
            for item in allocation:
                lines.append(f"    - {item.get('asset')}: {item.get('percentage')}% — {item.get('description')}")
        rationale = strategy.get("rationale", "")
        if rationale:
            lines.append(f"  Rationale: {rationale}")

    portfolio = context.get("portfolio") or {}
    if portfolio:
        cash = portfolio.get("cash") or {}
        positions = portfolio.get("positions") or []
        if cash:
            lines.append("")
            lines.append("TRADING 212 PORTFOLIO (live):")
            lines.append(f"  Free cash: {currency}{cash.get('free', 0):.2f}")
            lines.append(f"  Invested: {currency}{cash.get('invested', 0):.2f}")
            lines.append(f"  Total value: {currency}{cash.get('total', 0):.2f}")
            lines.append(f"  Total P&L: {currency}{cash.get('ppl', 0):.2f}")
        if positions:
            lines.append(f"  Positions ({len(positions)} open):")
            for p in positions[:10]:
                ppl = p.get("ppl", 0)
                sign = "+" if ppl >= 0 else ""
                lines.append(
                    f"    - {p.get('ticker')}: {p.get('quantity')} units, avg {currency}{p.get('averagePrice', 0):.2f}, "
                    f"current {currency}{p.get('currentPrice', 0):.2f}, P&L {sign}{currency}{ppl:.2f}"
                )

    return "\n".join(lines) if lines else ""


def resolve_response_length(settings: dict) -> tuple[str, int]:
    value = (settings.get("responseLength") or "normal").strip().lower()
    if value == "short":
        return ("Keep responses concise: about 60-110 words.", min(CHAT_MAX_TOKENS, 150))
    if value == "detailed":
        return ("Provide deeper detail when useful: about 220-340 words.", min(CHAT_MAX_TOKENS, 700))
    return ("Responses should be thorough enough to be genuinely useful: about 120-200 words.", CHAT_MAX_TOKENS)


@chat_bp.post("/chat")
def chat():
    data = request.get_json()
    message = data.get("message", "")
    context = data.get("context", {})

    user_context_block = build_user_context_block(context)

    settings = context.get("settings") or {}
    name = settings.get("displayName", "").strip()
    name_instruction = f"The user's name is {name}. Address them by name when it feels natural." if name else ""
    response_length_instruction, max_tokens = resolve_response_length(settings)

    system_prompt = f"""You are Finbar's AI financial coach — a friendly, knowledgeable, and educational assistant built into the Finbar personal finance app.

{APP_KNOWLEDGE}

YOUR BEHAVIOUR:
- You have full knowledge of Finbar and all its features. Answer questions about any page or feature confidently.
- When the user asks about their finances, reference their actual numbers — be specific and personal.
- If no data is provided, encourage the user to visit the Advisor page first.
- When asked about which stocks, ETFs, or indexes to invest in, give concrete educational examples from your knowledge base above, tailored to the user's risk profile and time horizon. For example, suggest VWRP for a beginner wanting global diversification, QQQ for an aggressive investor comfortable with tech volatility, or bond ETFs for a conservative profile. Name specific tickers where helpful.
- When referencing the user's portfolio from Trading 212, comment on their actual holdings — whether they are diversified, concentrated, profitable, etc.
- Keep answers conversational. Use plain language. Bullet points are fine when listing ETF options.
- {response_length_instruction}
- Always end with: "This is educational, not financial advice — always do your own research before investing (DYOR)."
- Never guarantee specific returns.
{name_instruction}"""

    if user_context_block:
        user_prompt = f"""The user's current financial data from the app:

{user_context_block}

User message: {message}"""
    else:
        user_prompt = f"""The user has not yet entered financial data (no Advisor page inputs or portfolio connected yet).

User message: {message}"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.6,
            max_tokens=max_tokens,
        )
        text = response.choices[0].message.content or ""
        return jsonify({"response": text.strip()})
    except Exception as e:
        error_text = str(e)
        error_type = e.__class__.__name__
        trace = traceback.format_exc(limit=4)
        timestamp = datetime.now(timezone.utc).isoformat()
        print(
            "[CHAT_ERROR]",
            {
                "timestamp_utc": timestamp,
                "model": MODEL_NAME,
                "error_type": error_type,
                "error_message": error_text,
                "max_tokens": max_tokens,
                "message_excerpt": message[:180],
                "traceback": trace,
            },
            flush=True,
        )

        if "429" in error_text or "rate" in error_text.lower() or "quota" in error_text.lower():
            fallback = "Live AI is temporarily unavailable (quota limit reached). Please try again shortly."
            return jsonify(
                {
                    "response": fallback,
                    "source": "fallback",
                    "error_code": "quota_exceeded",
                    "error_type": error_type,
                    "error_message": error_text,
                    "timestamp_utc": timestamp,
                    "model": MODEL_NAME,
                }
            )

        fallback = "Live AI is unavailable right now. Please try again in a moment."
        return jsonify(
            {
                "response": fallback,
                "source": "fallback",
                "error_code": "model_unavailable",
                "error_type": error_type,
                "error_message": error_text,
                "timestamp_utc": timestamp,
                "model": MODEL_NAME,
            }
        )
