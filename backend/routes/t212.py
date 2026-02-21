import base64
import requests
from flask import Blueprint, request, jsonify

t212_bp = Blueprint("t212", __name__)

T212_BASES = {
    "live": "https://live.trading212.com/api/v0",
    "demo": "https://demo.trading212.com/api/v0",
}


def _build_auth_header() -> tuple[str, str | None]:
    """
    Build the Authorization header value from request headers.
    Supports:
      - X-T212-Key + X-T212-Secret  →  Basic base64(key:secret)
      - X-T212-Key alone (legacy)   →  Authorization: <key>
    Returns (auth_value, error_message).
    """
    api_key = request.headers.get("X-T212-Key", "").strip()
    api_secret = request.headers.get("X-T212-Secret", "").strip()

    if not api_key:
        return "", "Missing X-T212-Key header"

    if api_secret:
        credentials = f"{api_key}:{api_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}", None
    else:
        # Fallback: pass key directly (old single-key format)
        return api_key, None


def _t212_get(path: str):
    auth_value, error = _build_auth_header()
    if error:
        return jsonify({"error": error}), 400

    account_type = request.args.get("account_type", "demo")
    base = T212_BASES.get(account_type, T212_BASES["demo"])
    url = f"{base}{path}"

    try:
        resp = requests.get(
            url,
            headers={"Authorization": auth_value, "Accept": "application/json"},
            timeout=10,
        )
    except requests.exceptions.ConnectionError:
        return jsonify({"error": "Could not reach Trading 212. Check your connection."}), 503
    except requests.exceptions.Timeout:
        return jsonify({"error": "Trading 212 request timed out."}), 504

    if resp.status_code == 401:
        return jsonify({"error": "Invalid credentials. Check your API key and secret."}), 401
    if resp.status_code == 429:
        return jsonify({"error": "Too many requests. Please wait a moment."}), 429

    try:
        data = resp.json()
    except ValueError:
        return jsonify({"error": f"Unexpected response from Trading 212 (status {resp.status_code})"}), 502

    return jsonify(data), resp.status_code


@t212_bp.get("/t212/account/info")
def account_info():
    return _t212_get("/equity/account/info")


@t212_bp.get("/t212/account/cash")
def account_cash():
    return _t212_get("/equity/account/cash")


@t212_bp.get("/t212/portfolio")
def portfolio():
    return _t212_get("/equity/portfolio")
