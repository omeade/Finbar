import random
from datetime import datetime, timedelta

import requests
import yfinance as yf
from flask import Blueprint, current_app, jsonify, request

stocks_bp = Blueprint("stocks", __name__)

COMMON_SUFFIXES = ("us", "uk", "de")

YAHOO_GROUPS_RAW = {
    "top-100": {
        "label": "Top 100",
        "symbols": [
            "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "BRK-B", "JPM", "V",
            "MA", "WMT", "UNH", "XOM", "PG", "JNJ", "HD", "BAC", "ABBV", "KO",
            "PEP", "CVX", "MRK", "ORCL", "AMD", "CRM", "ACN", "CSCO", "TMUS", "QCOM",
            "INTC", "IBM", "ADBE", "DHR", "TMO", "ABT", "DIS", "VZ", "T", "CMCSA",
            "NKE", "LIN", "MCD", "TXN", "WFC", "AMGN", "PM", "CAT", "GE", "HON",
            "UBER", "BLK", "MS", "GS", "SPGI", "DE", "ADP", "ISRG", "SYK", "MDT",
            "GILD", "LLY", "PFE", "BA", "COP", "SLB", "BKNG", "ABNB", "MAR", "AXP",
            "C", "PLTR", "SOFI", "COIN", "RBLX", "SNAP", "PINS", "SHOP", "PYPL", "NFLX",
            "BABA", "PDD", "JD", "NIO", "SONY", "TM", "SAP", "ASML", "NVO", "AZN",
            "SHEL", "BP", "RIO", "UL", "LOW", "COST", "AVGO", "AMAT", "PANW", "CRWD",
        ],
    },
    "popular": {
        "label": "Popular",
        "symbols": [
            "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "NFLX", "AMD", "PLTR",
            "COIN", "SOFI", "RBLX", "SHOP", "PYPL", "UBER", "ABNB", "BABA", "PDD", "NIO",
        ],
    },
    "lower-risk": {
        "label": "Lower Risk",
        "symbols": [
            "BRK-B", "V", "WMT", "KO", "PEP", "PG", "JNJ", "MCD", "COST", "HD",
            "MRK", "ABBV", "T", "VZ", "CMCSA", "ADP", "IBM", "CSCO", "TXN", "TM",
        ],
    },
    "higher-risk": {
        "label": "Higher Risk",
        "symbols": [
            "TSLA", "NVDA", "PLTR", "COIN", "SOFI", "RBLX", "SNAP", "PINS", "SHOP", "PYPL",
            "NIO", "PDD", "JD", "BABA", "ABNB", "UBER", "CRWD", "PANW", "SMCI", "MSTR",
        ],
    },
    "etfs": {
        "label": "ETFs",
        "symbols": [
            "SPY", "QQQ", "VTI", "VOO", "IVV", "DIA", "BND", "XLK", "XLF", "XLE",
            "XLP", "XLU", "XLV", "XLI", "XLY", "IWM", "EFA", "EEM", "TLT", "GLD",
        ],
    },
}


def yahoo_to_app_symbol(ticker: str) -> str:
    return f"{ticker.lower()}.us"


def app_to_yahoo_ticker(symbol: str) -> str:
    return symbol.split(".")[0].upper()


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
    ticker = app_to_yahoo_ticker(symbol)
    end = datetime.now()
    start = end - timedelta(days=days)

    def fetch_yahoo_chart_api() -> dict:
        period1 = int(start.timestamp())
        period2 = int(end.timestamp())
        url = "https://query1.finance.yahoo.com/v8/finance/chart/" + ticker
        params = {
            "period1": period1,
            "period2": period2,
            "interval": "1d",
            "events": "history",
            "includeAdjustedClose": "true",
        }
        r = requests.get(url, params=params, timeout=12, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        payload = r.json()
        chart = payload.get("chart", {})
        error = chart.get("error")
        if error:
            raise ValueError(f"Yahoo chart API error: {error}")
        results = chart.get("result") or []
        if not results:
            raise ValueError(f"Yahoo chart API returned no result for {ticker!r}")
        result0 = results[0]
        timestamps = result0.get("timestamp") or []
        indicators = result0.get("indicators", {})
        quote_arr = indicators.get("quote") or []
        quote0 = quote_arr[0] if quote_arr else {}
        closes = quote0.get("close") or []
        rows = []
        for ts, close in zip(timestamps, closes):
            if close is None:
                continue
            date = datetime.utcfromtimestamp(int(ts)).strftime("%Y-%m-%d")
            rows.append((date, round(float(close), 2)))
        if not rows:
            raise ValueError(f"Yahoo chart API returned empty close series for {ticker!r}")
        dates = [d for d, _ in rows]
        prices = [p for _, p in rows]
        base = prices[0]
        normalised = [round(p / base * 100, 2) for p in prices]
        return {"dates": dates, "prices": prices, "normalised": normalised, "source": "yahoo"}

    try:
        df = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
        if df.empty:
            raise ValueError(f"Yahoo Finance returned no data for {ticker!r}")
        if hasattr(df.columns, "levels"):
            df.columns = df.columns.get_level_values(0)
        dates = df.index.strftime("%Y-%m-%d").tolist()
        prices = [round(float(p), 2) for p in df["Close"]]
        base = prices[0]
        normalised = [round(p / base * 100, 2) for p in prices]
        return {"dates": dates, "prices": prices, "normalised": normalised, "source": "yahoo"}
    except Exception as yf_error:
        current_app.logger.warning("Yahoo yfinance fetch failed for %s: %s", ticker, yf_error)
        try:
            return fetch_yahoo_chart_api()
        except Exception as chart_error:
            current_app.logger.warning(
                "Yahoo chart API fetch failed for %s: %s", ticker, chart_error
            )
            fallback = generate_fallback_series(symbol, days=days)
            fallback["error"] = f"yfinance: {yf_error}; chart_api: {chart_error}"
            return fallback


def symbol_candidates(query: str) -> list[str]:
    q = query.strip().lower()
    if not q:
        return []
    if "." in q:
        return [q]
    return [f"{q}.{suffix}" for suffix in COMMON_SUFFIXES]


@stocks_bp.get("/stocks")
def get_stocks():
    symbols_param = request.args.get("symbols", "spy.us,qqq.us,bnd.us")
    symbols = [s.strip() for s in symbols_param.split(",") if s.strip()]
    result = {}
    for symbol in symbols:
        label = symbol.split(".")[0].upper()
        result[label] = fetch_yahoo(symbol)
    return jsonify(result)


@stocks_bp.get("/stocks/groups")
def get_stock_groups():
    groups = []
    for group_id, group in YAHOO_GROUPS_RAW.items():
        symbols = [yahoo_to_app_symbol(ticker) for ticker in group["symbols"]]
        groups.append(
            {
                "id": group_id,
                "label": group["label"],
                "symbols": symbols,
            }
        )
    return jsonify({"groups": groups, "source": "yahoo"})


@stocks_bp.get("/stocks/search")
def search_stock():
    query = request.args.get("q", "").strip()
    days = int(request.args.get("days", "365"))

    for candidate in symbol_candidates(query):
        data = fetch_yahoo(candidate, days=days)
        if data.get("dates"):
            return jsonify(
                {
                    "query": query,
                    "resolved_symbol": candidate,
                    "label": candidate.split(".")[0].upper(),
                    "data": data,
                }
            )

    return (
        jsonify(
            {
                "query": query,
                "error": "No stock data found for that symbol on Yahoo Finance.",
            }
        ),
        404,
    )
