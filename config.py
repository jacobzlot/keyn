# ── KEYN Configuration ────────────────────────────────────────────────────────

# ── API Keys ──────────────────────────────────────────────────────────────────
RSS2JSON_KEY = "tfmbu25mybher9t6dwwdwy9qeukrbth57wcudiqi"

# ── Server ────────────────────────────────────────────────────────────────────
HOST = "0.0.0.0"
PORT = 5000
DEBUG = True

# ── Yahoo Finance base URL ────────────────────────────────────────────────────
YAHOO_BASE = "https://query1.finance.yahoo.com"

# ── Regions & Tickers ─────────────────────────────────────────────────────────
# Each region has a key, label, flag SVG path, and 10 index tickers.
# `symbol` = Yahoo Finance symbol. `name` = display label in the ticker bar.

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
            {"symbol": "TX60.TS",  "name": "TSX60"},   # was ^TXSI
            {"symbol": "^SPCDNX",  "name": "TSX-V"},   # was ^JX
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
            {"symbol": "FTSEMIB.MI", "name": "MIB"},   # was ^FTMIB
            {"symbol": "^BFX",       "name": "BEL20"},
            {"symbol": "^ATX",       "name": "ATX"},
            {"symbol": "EURUSD=X",   "name": "EUR"},
        ],
    },
    "cn": {
        "label": "China",
        "flag":  "svg/china.svg",
        "tickers": [
            {"symbol": "000001.SS", "name": "SSE"},    # was ^SSEC
            {"symbol": "399001.SZ", "name": "SZSE"},   # was ^SZSC
            {"symbol": "^HSI",      "name": "HSI"},
            {"symbol": "^HSCE",     "name": "HSCE"},
            {"symbol": "000300.SS", "name": "CSI300"}, # was ^CSI300
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
            {"symbol": "^SPCOSLCP", "name": "COLCAP"}, # was ^IGBC
            {"symbol": "^SPBLPGPT", "name": "LIMA"},   # was ^SPBL25P
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
            {"symbol": "FTSEMIB.MI", "name": "MIB"},   # was ^FTMIB
            {"symbol": "^OMX",       "name": "OMX"},
            {"symbol": "^JN0U.JO",   "name": "JSE"},   # was ^J203
            {"symbol": "^CASE30",    "name": "EGX30"},  # was ^EGX30
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

# Default region shown on load
DEFAULT_REGION = "us"