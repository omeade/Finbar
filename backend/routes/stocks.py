import csv
import io
from datetime import datetime, timedelta

import requests
from flask import Blueprint, jsonify, request

stocks_bp = Blueprint("stocks", __name__)

TICKERS = {
    "SPY": "spy.us",
    "QQQ": "qqq.us",
    "BND": "bnd.us",
}


def fetch_stooq(symbol: str, days: int = 365) -> dict:
    end = datetime.now()
    start = end - timedelta(days=days)
    url = (
        f"https://stooq.com/q/d/l/?s={symbol}"
        f"&d1={start.strftime('%Y%m%d')}&d2={end.strftime('%Y%m%d')}&i=d"
    )
    try:
        r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        reader = csv.DictReader(io.StringIO(r.text))
        rows = [(row["Date"], float(row["Close"])) for row in reader if row.get("Close") and row["Close"] != "null"]
        rows.sort(key=lambda x: x[0])
        dates = [row[0] for row in rows]
        prices = [row[1] for row in rows]
        # Normalise to base 100 for easy comparison
        if prices:
            base = prices[0]
            normalised = [round(p / base * 100, 2) for p in prices]
        else:
            normalised = []
        return {"dates": dates, "prices": prices, "normalised": normalised}
    except Exception as e:
        return {"dates": [], "prices": [], "normalised": [], "error": str(e)}


@stocks_bp.get("/stocks")
def get_stocks():
    symbols_param = request.args.get("symbols", "spy.us,qqq.us,bnd.us")
    symbols = [s.strip() for s in symbols_param.split(",")]
    result = {}
    for symbol in symbols:
        label = symbol.split(".")[0].upper()
        result[label] = fetch_stooq(symbol)
    return jsonify(result)
