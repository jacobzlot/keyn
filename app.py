"""
KEYN Dashboard — Flask backend
Run locally: python app.py
Run on Railway: gunicorn app:app
"""

import os

import requests
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder=".", static_url_path="")

# ── Config from environment variables ────────────────────────────────────────
RSS2JSON_KEY = os.environ.get("RSS2JSON_KEY", "")
YAHOO_BASE   = os.environ.get("YAHOO_BASE", "https://query1.finance.yahoo.com")
PORT         = int(os.environ.get("PORT", 5000))
DEBUG        = os.environ.get("DEBUG", "false").lower() == "true"

YAHOO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://finance.yahoo.com/",
}

# ── Regions & Tickers ─────────────────────────────────────────────────────────
REGIONS = {
    "us": {
        "label": "United States",
        "flag":  "svg/usa.svg",
        "tickers": [
            {"symbol": "^GSPC",  "name": "SPX"},
            {"symbol": "^DJI",   "name": "DJIA"},
            {"symbol": "^IXIC",  "name": "COMP"},
            {"symbol": "^RUT",   "name": "RUT"},
            {"symbol": "^NYA",   "name": "NYSE"},
            {"symbol": "^VIX",   "name": "VIX"},
            {"symbol": "^TNX",   "name": "10Y"},
            {"symbol": "^TYX",   "name": "30Y"},
            {"symbol": "^MOVE",  "name": "MOVE"},
            {"symbol": "^SKEW",  "name": "SKEW"},
        ],
    },
    "ca": {
        "label": "Canada",
        "flag":  "svg/canada.svg",
        "tickers": [
            {"symbol": "^GSPTSE",  "name": "TSX"},
            {"symbol": "TX60.TS",  "name": "TSX60"},
            {"symbol": "^SPCDNX",  "name": "TSX-V"},
            {"symbol": "^GSPC",    "name": "SPX"},
            {"symbol": "^TNX",     "name": "US10Y"},
            {"symbol": "CADUSD=X", "name": "CAD"},
            {"symbol": "^VIX",     "name": "VIX"},
            {"symbol": "^GVZ",     "name": "GLDVOL"},
            {"symbol": "^OVX",     "name": "OILVOL"},
            {"symbol": "^SPGSCI",  "name": "CMDTY"},
        ],
    },
    "eu": {
        "label": "European Union",
        "flag":  "svg/eu.svg",
        "tickers": [
            {"symbol": "^GDAXI",     "name": "DAX"},
            {"symbol": "^FCHI",      "name": "CAC40"},
            {"symbol": "^STOXX50E",  "name": "EU50"},
            {"symbol": "^STOXX",     "name": "STX600"},
            {"symbol": "^IBEX",      "name": "IBEX"},
            {"symbol": "^AEX",       "name": "AEX"},
            {"symbol": "FTSEMIB.MI", "name": "MIB"},
            {"symbol": "^BFX",       "name": "BEL20"},
            {"symbol": "^ATX",       "name": "ATX"},
            {"symbol": "EURUSD=X",   "name": "EUR"},
        ],
    },
    "cn": {
        "label": "China",
        "flag":  "svg/china.svg",
        "tickers": [
            {"symbol": "000001.SS", "name": "SSE"},
            {"symbol": "399001.SZ", "name": "SZSE"},
            {"symbol": "^HSI",      "name": "HSI"},
            {"symbol": "^HSCE",     "name": "HSCE"},
            {"symbol": "000300.SS", "name": "CSI300"},
            {"symbol": "^STI",      "name": "SGX"},
            {"symbol": "^TWII",     "name": "TWSE"},
            {"symbol": "^KS11",     "name": "KOSPI"},
            {"symbol": "^N225",     "name": "N225"},
            {"symbol": "CNYUSD=X",  "name": "CNY"},
        ],
    },
    "globe_am": {
        "label": "Americas",
        "flag":  "svg/americas.svg",
        "tickers": [
            {"symbol": "^GSPC",     "name": "SPX"},
            {"symbol": "^BVSP",     "name": "BVSP"},
            {"symbol": "^MXX",      "name": "IPC"},
            {"symbol": "^MERV",     "name": "MERV"},
            {"symbol": "^IPSA",     "name": "IPSA"},
            {"symbol": "^SPCOSLCP", "name": "COLCAP"},
            {"symbol": "^SPBLPGPT", "name": "LIMA"},
            {"symbol": "^GSPTSE",   "name": "TSX"},
            {"symbol": "^NYA",      "name": "NYSE"},
            {"symbol": "^RUT",      "name": "RUT"},
        ],
    },
    "globe_eu": {
        "label": "Europe & Africa",
        "flag":  "svg/eurafrica.svg",
        "tickers": [
            {"symbol": "^FTSE",      "name": "FTSE"},
            {"symbol": "^GDAXI",     "name": "DAX"},
            {"symbol": "^FCHI",      "name": "CAC40"},
            {"symbol": "^SSMI",      "name": "SMI"},
            {"symbol": "^AEX",       "name": "AEX"},
            {"symbol": "^IBEX",      "name": "IBEX"},
            {"symbol": "FTSEMIB.MI", "name": "MIB"},
            {"symbol": "^OMX",       "name": "OMX"},
            {"symbol": "^JN0U.JO",   "name": "JSE"},
            {"symbol": "^CASE30",    "name": "EGX30"},
        ],
    },
    "globe_as": {
        "label": "Asia",
        "flag":  "svg/asia.svg",
        "tickers": [
            {"symbol": "^N225",  "name": "N225"},
            {"symbol": "^HSI",   "name": "HSI"},
            {"symbol": "^KS11",  "name": "KOSPI"},
            {"symbol": "^AXJO",  "name": "ASX"},
            {"symbol": "^BSESN", "name": "SENSEX"},
            {"symbol": "^NSEI",  "name": "NIFTY"},
            {"symbol": "^STI",   "name": "SGX"},
            {"symbol": "^TWII",  "name": "TWSE"},
            {"symbol": "^KLSE",  "name": "KLCI"},
            {"symbol": "^SET",   "name": "SET"},
        ],
    },
}

DEFAULT_REGION = "us"


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
    return jsonify({"regions": REGIONS, "default": DEFAULT_REGION})


# ── API: Yahoo Finance quotes ─────────────────────────────────────────────────

@app.route("/api/quotes")
def api_quotes():
    symbols = request.args.get("symbols", "")
    if not symbols:
        return jsonify({"error": "symbols param required"}), 400

    results = {}
    for sym in [s.strip() for s in symbols.split(",") if s.strip()]:
        try:
            chart_url = f"{YAHOO_BASE}/v8/finance/chart/{sym}?interval=1d&range=2d&includePrePost=false"
            resp = requests.get(chart_url, headers=YAHOO_HEADERS, timeout=8)
            resp.raise_for_status()
            meta       = resp.json().get("chart", {}).get("result", [{}])[0].get("meta", {})
            price      = meta.get("regularMarketPrice")
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


# ── API: Yahoo Finance chart ──────────────────────────────────────────────────

@app.route("/api/chart")
def api_chart():
    symbol   = request.args.get("symbol", "")
    interval = request.args.get("interval", "5m")
    rng      = request.args.get("range", "1d")

    if not symbol:
        return jsonify({"error": "symbol param required"}), 400

    try:
        url  = f"{YAHOO_BASE}/v8/finance/chart/{symbol}?interval={interval}&range={rng}&includePrePost=true"
        resp = requests.get(url, headers=YAHOO_HEADERS, timeout=8)
        resp.raise_for_status()
        return jsonify(resp.json())
    except requests.HTTPError as e:
        return jsonify({"error": f"Yahoo returned {e.response.status_code}"}), e.response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: Yahoo Finance screener ───────────────────────────────────────────────

@app.route("/api/screener")
def api_screener():
    scr_id = request.args.get("id", "day_gainers")
    count  = request.args.get("count", "10")
    try:
        url  = (f"{YAHOO_BASE}/v1/finance/screener/predefined/saved"
                f"?scrIds={scr_id}&count={count}"
                f"&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent")
        resp = requests.get(url, headers=YAHOO_HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # Validate the response has usable quotes before returning
        quotes = (data.get("finance", {}).get("result") or [{}])[0].get("quotes", [])
        if not quotes:
            # Try alternate Yahoo screener endpoint as fallback
            url2 = (f"{YAHOO_BASE}/v1/finance/screener"
                    f"?scrIds={scr_id}&count={count}"
                    f"&fields=symbol,shortName,regularMarketPrice,regularMarketChange,regularMarketChangePercent")
            resp2 = requests.get(url2, headers=YAHOO_HEADERS, timeout=10)
            if resp2.ok:
                data2 = resp2.json()
                quotes2 = (data2.get("finance", {}).get("result") or [{}])[0].get("quotes", [])
                if quotes2:
                    return jsonify(data2)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: Yahoo Finance options ────────────────────────────────────────────────

@app.route("/api/options")
def api_options():
    symbol = request.args.get("symbol", "SPY")
    try:
        url  = f"{YAHOO_BASE}/v7/finance/options/{symbol}"
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
    print(f"\n  KEYN Dashboard running at http://localhost:{PORT}\n")
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)