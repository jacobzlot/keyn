"""
KEYN Dashboard — Flask backend
Replaces python -m http.server. Run with: python app.py
"""

import json
import os
from urllib.parse import urlencode

import requests
from flask import Flask, jsonify, request, send_from_directory

import config

app = Flask(__name__, static_folder=".", static_url_path="")

YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://finance.yahoo.com/",
}


# ── Static files ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(".", "home.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(".", path)


# ── API: regions config ───────────────────────────────────────────────────────

@app.route("/api/regions")
def api_regions():
    """Return full region/ticker config so the frontend never has hardcoded tickers."""
    return jsonify({
        "regions": config.REGIONS,
        "default": config.DEFAULT_REGION,
    })


# ── API: Yahoo Finance quote (current price + delta) ─────────────────────────

@app.route("/api/quotes")
def api_quotes():
    """
    Batch quote fetch.
    GET /api/quotes?symbols=^GSPC,^DJI,^IXIC
    Returns: { "^GSPC": { price, change, changePct, name }, ... }
    """
    symbols = request.args.get("symbols", "")
    if not symbols:
        return jsonify({"error": "symbols param required"}), 400

    url = f"{config.YAHOO_BASE}/v8/finance/chart/{{}}"
    results = {}

    for sym in [s.strip() for s in symbols.split(",") if s.strip()]:
        try:
            chart_url = f"{config.YAHOO_BASE}/v8/finance/chart/{sym}?interval=1d&range=2d&includePrePost=false"
            resp = requests.get(chart_url, headers=YAHOO_HEADERS, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            meta       = data.get("chart", {}).get("result", [{}])[0].get("meta", {})
            price      = meta.get("regularMarketPrice")
            # Use regularMarketPreviousClose — the official prior session close
            # Yahoo's own site calculates change from this field, not chartPreviousClose
            prev_close = (meta.get("regularMarketPreviousClose")
                          or meta.get("chartPreviousClose")
                          or meta.get("previousClose"))
            change     = round(price - prev_close, 4) if price and prev_close else None
            change_pct = round((change / prev_close) * 100, 4) if change and prev_close else None
            results[sym] = {
                "symbol":    sym,
                "name":      meta.get("shortName") or meta.get("longName") or sym,
                "price":     price,
                "change":    change,
                "changePct": change_pct,
                "prevClose": prev_close,
                "currency":  meta.get("currency", "USD"),
            }
        except Exception as e:
            results[sym] = {"symbol": sym, "error": str(e)}

    return jsonify(results)


# ── API: Yahoo Finance chart (intraday price array) ───────────────────────────

@app.route("/api/chart")
def api_chart():
    """
    Single symbol intraday chart.
    GET /api/chart?symbol=^GSPC&interval=5m&range=1d
    Returns Yahoo chart JSON directly.
    """
    symbol   = request.args.get("symbol", "")
    interval = request.args.get("interval", "5m")
    rng      = request.args.get("range", "1d")

    if not symbol:
        return jsonify({"error": "symbol param required"}), 400

    try:
        url  = f"{config.YAHOO_BASE}/v8/finance/chart/{symbol}?interval={interval}&range={rng}&includePrePost=true"
        resp = requests.get(url, headers=YAHOO_HEADERS, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except requests.HTTPError as e:
        return jsonify({"error": f"Yahoo returned {e.response.status_code}"}), e.response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: Yahoo Finance screener (top movers) ──────────────────────────────────

@app.route("/api/screener")
def api_screener():
    """
    GET /api/screener?id=day_gainers&count=10
    """
    scr_id = request.args.get("id", "day_gainers")
    count  = request.args.get("count", "10")

    try:
        url  = (f"{config.YAHOO_BASE}/v1/finance/screener/predefined/saved"
                f"?scrIds={scr_id}&count={count}"
                f"&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent")
        resp = requests.get(url, headers=YAHOO_HEADERS, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: Yahoo Finance options (for P/C ratio) ────────────────────────────────

@app.route("/api/options")
def api_options():
    """
    GET /api/options?symbol=SPY
    """
    symbol = request.args.get("symbol", "SPY")
    try:
        url  = f"{config.YAHOO_BASE}/v7/finance/options/{symbol}"
        resp = requests.get(url, headers=YAHOO_HEADERS, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: Nasdaq IPO calendar ──────────────────────────────────────────────────

@app.route("/api/ipos")
def api_ipos():
    month = request.args.get("month", "")
    date_param = f"?date={month}" if month else ""
    try:
        url  = f"https://api.nasdaq.com/api/ipo/calendar{date_param}"
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: CNN Fear & Greed ─────────────────────────────────────────────────────

@app.route("/api/feargreed")
def api_feargreed():
    try:
        url  = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\n  KEYN Dashboard running at http://localhost:{config.PORT}\n")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)