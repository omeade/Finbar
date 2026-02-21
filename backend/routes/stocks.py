import random
from datetime import datetime, timedelta

import yfinance as yf
from flask import Blueprint, current_app, jsonify, request

stocks_bp = Blueprint("stocks", __name__)


def generate_fallback_series(symbol: str, days: int = 365) -> dict:
    end = datetime.now().date()
    start = end - timedelta(days=days)
    dates = []
    prices = []
    base_prices = {"spy.us": 500.0, "qqq.us": 430.0, "bnd.us": 72.0}
    base = base_prices.get(symbol.lower(), 100.0)
    rng = random.Random(f"fallback:{symbol.lower()}")
    price = base
    current = start
    while current <= end:
        if current.weekday() < 5:
            drift = 0.0002
            shock = rng.uniform(-0.012, 0.012)
            price = max(1.0, round(price * (1 + drift + shock), 2))
            dates.append(current.isoformat())
            prices.append(price)
        current += timedelta(days=1)
    if prices:
        first = prices[0]
        normalised = [round(p / first * 100, 2) for p in prices]
    else:
        normalised = []
    return {
        "dates": dates,
        "prices": prices,
        "normalised": normalised,
        "source": "fallback",
    }


def fetch_yahoo(symbol: str, days: int = 365) -> dict:
    # Convert "spy.us" → "SPY", pass directly for unknown symbols
    ticker = symbol.split(".")[0].upper()
    end = datetime.now()
    start = end - timedelta(days=days)
    try:
        df = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
        if df.empty:
            raise ValueError(f"Yahoo Finance returned no data for {ticker!r}")
        # Flatten multi-index columns if present (yfinance >=0.2 returns them)
        if hasattr(df.columns, "levels"):
            df.columns = df.columns.get_level_values(0)
        dates = df.index.strftime("%Y-%m-%d").tolist()
        prices = [round(float(p), 2) for p in df["Close"]]
        base = prices[0]
        normalised = [round(p / base * 100, 2) for p in prices]
        return {"dates": dates, "prices": prices, "normalised": normalised, "source": "yahoo"}
    except Exception as e:
        current_app.logger.warning("Yahoo fetch failed for %s: %s", ticker, e)
        fallback = generate_fallback_series(symbol, days=days)
        fallback["error"] = str(e)
        return fallback


@stocks_bp.get("/stocks")
def get_stocks():
    symbols_param = request.args.get("symbols", "spy.us,qqq.us,bnd.us")
    symbols = [s.strip() for s in symbols_param.split(",")]
    result = {}
    for symbol in symbols:
        label = symbol.split(".")[0].upper()
        result[label] = fetch_yahoo(symbol)
    return jsonify(result)
