import json
import os

from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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

Reply in 2-3 short paragraphs. Be warm, clear, and concise."""

    try:
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return jsonify({"response": response.text.strip()})
    except Exception as e:
        return jsonify({"response": f"Sorry, I couldn't process that. ({str(e)})"}), 500
