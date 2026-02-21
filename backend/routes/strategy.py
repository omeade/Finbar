import json
import os

from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

strategy_bp = Blueprint("strategy", __name__)

FALLBACK_STRATEGIES = {
    "conservative": {
        "monthly_investable": 0,
        "allocation": [
            {"asset": "Bond ETF", "percentage": 50, "description": "Stable fixed-income returns with low volatility"},
            {"asset": "Global Equity ETF", "percentage": 30, "description": "Broad market exposure with lower risk"},
            {"asset": "Money Market Fund", "percentage": 20, "description": "Highly liquid, near-cash safety net"},
        ],
        "rationale": "A conservative approach prioritising capital preservation with modest growth. Bonds provide stability while a small equity allocation allows for inflation-beating returns over time.",
        "education": ["Bonds pay fixed interest and are less volatile than stocks", "Diversification reduces risk without sacrificing all returns", "Compound interest works best over long time horizons"],
        "risk_warning": "All investments carry risk. Past performance does not guarantee future results.",
        "ready_to_invest": True,
    },
    "balanced": {
        "monthly_investable": 0,
        "allocation": [
            {"asset": "Global ETF", "percentage": 60, "description": "Broad exposure to global stock markets for long-term growth"},
            {"asset": "Bond ETF", "percentage": 25, "description": "Cushions volatility and provides steady income"},
            {"asset": "Growth Stocks ETF", "percentage": 15, "description": "Higher-risk, higher-reward allocation for upside potential"},
        ],
        "rationale": "A balanced strategy targeting steady growth while managing volatility. The majority is in diversified ETFs, with bonds acting as a buffer during market downturns.",
        "education": ["ETFs track an index and offer instant diversification", "A 60/40 stock-bond split is a classic balanced portfolio", "Rebalancing annually keeps your risk level consistent"],
        "risk_warning": "All investments carry risk. Past performance does not guarantee future results.",
        "ready_to_invest": True,
    },
    "aggressive": {
        "monthly_investable": 0,
        "allocation": [
            {"asset": "Global Equity ETF", "percentage": 70, "description": "Maximum stock market exposure for long-term growth"},
            {"asset": "Tech/Growth ETF", "percentage": 20, "description": "Higher-volatility sector bets on innovation and technology"},
            {"asset": "Individual Stocks", "percentage": 10, "description": "Small allocation for selective, high-conviction picks"},
        ],
        "rationale": "An aggressive strategy maximising growth potential, suitable for long time horizons and high risk tolerance. Expect significant short-term volatility in exchange for higher long-term returns.",
        "education": ["Higher risk typically means higher potential returns over long periods", "Individual stocks are more volatile than ETFs — position sizing matters", "Time in the market typically beats timing the market"],
        "risk_warning": "Aggressive portfolios can lose significant value in the short term. Only invest money you can leave untouched for 5+ years.",
        "ready_to_invest": True,
    },
}


@strategy_bp.post("/strategy")
def generate_strategy():
    data = request.get_json()
    snapshot = data.get("snapshot", {})
    risk_profile = data.get("risk_profile", "balanced")

    monthly_income = float(snapshot.get("monthly_income", 0))
    monthly_expenses = float(snapshot.get("monthly_expenses", 0))
    emergency_fund_months = float(snapshot.get("emergency_fund_months", 0))
    has_debt = bool(snapshot.get("has_debt", False))
    time_horizon_years = int(snapshot.get("time_horizon_years", 5))

    monthly_surplus = monthly_income - monthly_expenses
    safe_investable = round(monthly_surplus * 0.5, 2)

    prompt = f"""You are an educational investment coach. Generate a structured strategy for this user.

User data:
- Monthly income: €{monthly_income}
- Monthly expenses: €{monthly_expenses}
- Monthly surplus: €{monthly_surplus}
- Emergency fund: {emergency_fund_months} months of expenses covered
- Has high-interest debt: {has_debt}
- Time horizon: {time_horizon_years} years
- Risk profile: {risk_profile}

Respond ONLY with valid JSON (no markdown, no code blocks) in this exact structure:
{{
  "monthly_investable": <number, at most 50% of surplus, 0 if not ready>,
  "allocation": [
    {{"asset": "<name>", "percentage": <number>, "description": "<one sentence why>"}},
    {{"asset": "<name>", "percentage": <number>, "description": "<one sentence why>"}},
    {{"asset": "<name>", "percentage": <number>, "description": "<one sentence why>"}}
  ],
  "rationale": "<2-3 sentence strategy explanation>",
  "education": ["<concept 1>", "<concept 2>", "<concept 3>"],
  "risk_warning": "<one sentence disclaimer>",
  "ready_to_invest": <true if emergency fund >= 3 months and no high-interest debt, else false>
}}

Rules:
- Allocation percentages must sum to exactly 100
- If has_debt is true: set ready_to_invest false, suggest debt payoff first
- If emergency_fund_months < 3: set ready_to_invest false, suggest building fund first
- conservative: bonds 50%, global ETF 30%, money market 20%
- balanced: global ETF 60%, bonds 25%, growth ETF 15%
- aggressive: global ETF 70%, tech/growth ETF 20%, individual stocks 10%
- Be educational and responsible. Never guarantee returns."""

    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = response.text.strip()
        # Strip markdown code fences if present
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        strategy = json.loads(text.strip())
    except Exception:
        strategy = FALLBACK_STRATEGIES.get(risk_profile, FALLBACK_STRATEGIES["balanced"]).copy()
        strategy["monthly_investable"] = safe_investable

    strategy["monthly_surplus"] = monthly_surplus
    return jsonify(strategy)
