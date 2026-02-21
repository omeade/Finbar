import os
import traceback
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from openai import OpenAI

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
CHAT_MAX_TOKENS = int(os.getenv("OPENAI_CHAT_MAX_TOKENS", "180"))

chat_bp = Blueprint("chat", __name__)


@chat_bp.post("/chat")
def chat():
    data = request.get_json()
    message = data.get("message", "")
    context = data.get("context", {})

    strategy = context.get("strategy")
    risk_profile = context.get("risk_profile", "unknown")

    strategy_context = ""
    if strategy:
        allocation = strategy.get("allocation", [])
        allocation_text = ", ".join(
            f"{a['asset']} ({a['percentage']}%)" for a in allocation
        )
        strategy_context = f"""
The user has a {risk_profile} risk profile.
Their suggested portfolio is: {allocation_text}.
Monthly investable amount: €{strategy.get('monthly_investable', 0)}.
"""

    prompt = f"""You are a friendly, educational investment coach for beginners.
Explain things simply, use analogies, and always be encouraging.
You are educational only — never guarantee returns or give specific stock picks.
Always add: "This is educational, not financial advice."

{strategy_context}

User: {message}

Reply in 3-5 short sentences total.
Keep the response under 110 words.
Use plain language and no bullet points unless explicitly requested."""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=CHAT_MAX_TOKENS,
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
                "max_tokens": CHAT_MAX_TOKENS,
                "message_excerpt": message[:180],
                "risk_profile": risk_profile,
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
