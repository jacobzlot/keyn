// ── KEYN — shared data utility ────────────────────────────────────────────────
// All calls go to /api/... — served by app.py locally, or a deployed backend.
// No CORS issues, no proxy tricks, no keys in the browser.

(function() {

  // ── fetchYahooChart ─────────────────────────────────────────────────────────
  // Returns { prices, times, open, currentPrice, symbol }

  async function fetchYahooChart(symbol, interval, range, signal) {
    interval = interval || '5m';
    range    = range    || '1d';

    const url  = `/api/chart?symbol=${encodeURIComponent(symbol)}&interval=${interval}&range=${range}`;
    const res  = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) throw new Error(`Chart API ${res.status}: ${symbol}`);
    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result) throw new Error(`No chart data for ${symbol}`);

    const meta     = result.meta || {};
    const rawTS    = result.timestamp || [];
    const rawClose = result.indicators?.quote?.[0]?.close || [];
    const tz       = meta.exchangeTimezoneName || 'America/New_York';

    const pairs = rawTS
      .map((ts, i) => ({ ts, price: rawClose[i] }))
      .filter(p  => p.price != null);

    const prices = pairs.map(p => p.price);
    const times  = pairs.map(p => {
      return new Date(p.ts * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
      });
    });

    const open         = meta.chartPreviousClose ?? meta.regularMarketOpen ?? prices[0];
    const currentPrice = meta.regularMarketPrice ?? prices[prices.length - 1];

    return { prices, times, open, currentPrice, symbol };
  }


  // ── fetchYahooQuotes ────────────────────────────────────────────────────────
  // Batch quote fetch. Returns { [symbol]: quoteObject }

  async function fetchYahooQuotes(symbols, signal) {
    if (!symbols || !symbols.length) return {};

    const url  = `/api/quotes?symbols=${symbols.map(encodeURIComponent).join(',')}`;
    const res  = await fetch(url, signal ? { signal } : undefined);
    if (!res.ok) throw new Error(`Quotes API ${res.status}`);
    return res.json();
  }


  // ── fetchRegions ────────────────────────────────────────────────────────────
  // Returns the full region/ticker config from config.py

  async function fetchRegions() {
    const res = await fetch('/api/regions');
    if (!res.ok) throw new Error(`Regions API ${res.status}`);
    return res.json();
  }


  // ── Expose globally ─────────────────────────────────────────────────────────
  window.KeynYahoo = { fetchYahooChart, fetchYahooQuotes, fetchRegions };

})();