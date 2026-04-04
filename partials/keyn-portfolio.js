/**
 * KEYN Portfolio Page Logic — keyn-portfolio.js
 * Requires: keyn-partials.js, keyn-dashboard.css, portfolio.css
 */

// ── Drum digit animation (matches dashboard) ───────────────────────────────
window.KEYN_DRUM = (function () {
  const SPD = '0.28s', EASE = 'cubic-bezier(0.72,0.01,0.30,1)';

  function mkCol(ch) {
    const col = document.createElement('span');
    col.style.cssText = 'display:inline-flex;flex-direction:column;height:1em;will-change:transform;';
    '9876543210'.split('').forEach(d => {
      const c = document.createElement('span');
      c.style.cssText = 'display:block;height:1em;line-height:1em;text-align:center;';
      c.textContent = d; col.appendChild(c);
    });
    setPos(col, parseInt(ch, 10), true); return col;
  }

  function mkStat(ch) {
    const s = document.createElement('span');
    s.style.cssText = 'display:inline-block;line-height:1em;';
    s.textContent = ch; return s;
  }

  function setPos(col, digit, instant) {
    const y = -(9 - digit);
    if (instant) {
      const t = col.style.transition; col.style.transition = 'none';
      col.style.transform = `translateY(${y}em)`; col.offsetHeight;
      col.style.transition = t;
    } else {
      col.style.transition = `transform ${SPD} ${EASE}`;
      col.style.transform  = `translateY(${y}em)`;
    }
  }

  function build(el, str) {
    el.innerHTML = ''; el.style.display = 'inline-flex'; el.style.overflow = 'hidden';
    el.style.verticalAlign = 'bottom'; el.style.lineHeight = '1em'; el._drum = [];
    str.split('').forEach(ch => {
      const isD = /\d/.test(ch);
      if (isD) { const col = mkCol(ch); el.appendChild(col); el._drum.push({ ch, el: col, isD: true }); }
      else     { const s   = mkStat(ch); el.appendChild(s);  el._drum.push({ ch, el: s,   isD: false }); }
    });
    el.dataset.dv = str;
  }

  function tick(el, str) {
    if (el.dataset.dv === str) return;
    if (!el._drum) { build(el, str); return; }
    const chars = str.split('');
    const ok = chars.length === el._drum.length && chars.every((c, i) => /\d/.test(c) === el._drum[i].isD);
    if (!ok) { build(el, str); return; }
    chars.forEach((ch, i) => {
      const e = el._drum[i]; if (e.ch === ch) return;
      e.ch = ch;
      if (e.isD) setPos(e.el, parseInt(ch, 10), false); else e.el.textContent = ch;
    });
    el.dataset.dv = str;
  }

  return { tick, build };
})();

// ── State ──────────────────────────────────────────────────────────────────
let positions = [];
try { positions = JSON.parse(localStorage.getItem('keyn_portfolio') || '[]'); } catch (e) {}

// ── DOM refs ───────────────────────────────────────────────────────────────
const totalValEl   = document.getElementById('pp-total-val');
const dayDeltaEl   = document.getElementById('pp-day-delta');
const emptyStateEl = document.getElementById('pp-empty-state');
const canvasEl     = document.getElementById('pp-canvas');
const listEl       = document.getElementById('pp-list');
const listEmptyEl  = document.getElementById('pp-list-empty');
const posMetaEl    = document.getElementById('pos-meta');
let   currentTotalMkt = 0;

const statInv  = document.getElementById('stat-invested');
const statMkt  = document.getElementById('stat-mktval');
const statRet  = document.getElementById('stat-return');
const statDay  = document.getElementById('stat-daypnl');
const statCnt  = document.getElementById('stat-count');

const overlay   = document.getElementById('pp-overlay');
const fTicker      = document.getElementById('f-ticker');
const fShares      = document.getElementById('f-shares');
const fAvg         = document.getElementById('f-avg');
const fDate        = document.getElementById('f-date');
const fCashAmt     = document.getElementById('f-cash-amt');
const fSellShares  = document.getElementById('f-sell-shares');
const fSellPrice   = document.getElementById('f-sell-price');
const errEl        = document.getElementById('modal-err');
const submitBtn    = document.getElementById('modal-submit-btn');
const deleteBtn    = document.getElementById('modal-delete-btn');
const titleEl      = document.getElementById('modal-title');
const subEl        = document.getElementById('modal-sub');
const modeToggle   = document.getElementById('modal-mode-toggle');
const modeBtns     = document.querySelectorAll('.pp-mode-btn');
const fieldsStock  = document.getElementById('fields-stock');
const fieldsCash   = document.getElementById('fields-cash');
const sellSection  = document.getElementById('sell-section');
const statCashEl   = document.getElementById('stat-cash');

// ── Cash balance ───────────────────────────────────────────────────────────
function getCash() { try { return parseFloat(localStorage.getItem('keyn_cash') || '0') || 0; } catch { return 0; } }
function setCash(v) { try { localStorage.setItem('keyn_cash', String(Math.max(0, v))); } catch {} }
function refreshCashStat() { if (statCashEl) statCashEl.textContent = fmt$(getCash()); }

// ── Formatting ─────────────────────────────────────────────────────────────
function fmt$(v) {
  if (v == null || isNaN(v)) return '—';
  const a = Math.abs(v);
  const s = a >= 1e6
    ? (a / 1e6).toFixed(2) + 'M'
    : a.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v < 0 ? '-$' : '$') + s;
}

function fmtPct(v, signed = true) {
  if (v == null || isNaN(v)) return '—';
  return (signed && v > 0 ? '+' : '') + v.toFixed(2) + '%';
}

// ── Modal mode (stock | cash) ──────────────────────────────────────────────
let modalMode = 'stock'; // 'stock' | 'cash'

function setModalMode(mode) {
  modalMode = mode;
  modeBtns.forEach(b => b.classList.toggle('active', b.id === `mode-${mode}-btn`));
  fieldsStock.style.display = mode === 'stock' ? '' : 'none';
  fieldsCash.style.display  = mode === 'cash'  ? '' : 'none';
  submitBtn.textContent     = mode === 'cash'  ? 'Add Cash' : 'Add to Portfolio';
  errEl.textContent = '';
  if (mode === 'cash') setTimeout(() => fCashAmt.focus(), 80);
  else setTimeout(() => fTicker.focus(), 80);
}

document.getElementById('mode-stock-btn').addEventListener('click', () => setModalMode('stock'));
document.getElementById('mode-cash-btn').addEventListener('click',  () => setModalMode('cash'));

// ── Modal open/close ───────────────────────────────────────────────────────
let editingTicker = null;

function openModal(ticker = null) {
  editingTicker = ticker;
  overlay.classList.add('open');
  errEl.textContent  = '';
  submitBtn.disabled = false;
  fSellShares.value  = '';
  fSellPrice.value   = '';

  if (ticker) {
    // Edit mode
    const p = positions.find(pos => pos.ticker === ticker);
    titleEl.textContent       = 'Edit Position';
    subEl.textContent         = ticker;
    fTicker.value             = ticker;
    fTicker.readOnly          = true;
    fShares.value             = p.shares;
    fAvg.value                = p.avgPrice;
    fDate.value               = isoToDisplay(p.purchaseDate || new Date().toISOString().slice(0, 10));
    submitBtn.textContent     = 'Save Changes';
    deleteBtn.style.display   = 'block';
    modeToggle.style.display  = 'none';     // no mode toggle in edit
    sellSection.style.display = 'block';     // show sell section
    fieldsStock.style.display = '';
    fieldsCash.style.display  = 'none';
    setTimeout(() => fShares.focus(), 180);
  } else {
    // Add mode
    titleEl.textContent       = 'Add Position';
    subEl.textContent         = 'Enter your stock details below';
    fTicker.value             = '';
    fTicker.readOnly          = false;
    fShares.value             = '';
    fAvg.value                = '';
    fCashAmt.value            = '';
    fDate.value               = isoToDisplay(new Date().toISOString().slice(0, 10));
    deleteBtn.style.display   = 'none';
    modeToggle.style.display  = '';         // show toggle in add
    sellSection.style.display = 'none';     // no sell in add
    setModalMode('stock');
    setTimeout(() => fTicker.focus(), 180);
  }
}

function closeModal() { overlay.classList.remove('open'); editingTicker = null; }

document.getElementById('pp-add-btn').addEventListener('click',       () => openModal());
document.getElementById('pp-empty-btn').addEventListener('click',     () => openModal());
document.getElementById('modal-close-btn').addEventListener('click',  closeModal);
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

deleteBtn.addEventListener('click', () => {
  if (editingTicker) { removePosition(editingTicker); closeModal(); }
});

fTicker.addEventListener('input', () => {
  if (!editingTicker) fTicker.value = fTicker.value.toUpperCase();
});

// ── Date field — force MM/DD/YYYY mask, digits only ───────────────────────
fDate.addEventListener('keydown', e => {
  // Allow: backspace, delete, tab, escape, arrows, home, end
  if (['Backspace','Delete','Tab','Escape','ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
  // Block anything that isn't a digit
  if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
});

fDate.addEventListener('input', () => {
  // Strip everything except digits
  let digits = fDate.value.replace(/\D/g, '').slice(0, 8);
  let out = '';
  if (digits.length >= 1) out = digits.slice(0, 2);
  if (digits.length >= 3) out += '/' + digits.slice(2, 4);
  if (digits.length >= 5) out += '/' + digits.slice(4, 8);
  // Move cursor before reassigning value (preserve caret for backspace UX)
  const sel = fDate.selectionStart;
  fDate.value = out;
  // Restore caret, accounting for inserted slashes
  try { fDate.setSelectionRange(sel, sel); } catch(_) {}
});

fDate.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); });

[fTicker, fShares, fAvg].forEach(inp =>
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitBtn.click(); })
);

// ── Date helpers ───────────────────────────────────────────────────────────
// Storage format: YYYY-MM-DD  |  Display format: MM/DD/YYYY
function isoToDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}
function displayToIso(display) {
  const parts = display.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}
function validateDisplayDate(display) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(display)) return 'Date must be MM/DD/YYYY.';
  const [m, d, y] = display.split('/').map(Number);
  if (m < 1 || m > 12) return 'Month must be 01–12.';
  if (d < 1 || d > 31) return 'Day must be 01–31.';
  if (y < 1900 || y > new Date().getFullYear()) return 'Please enter a valid year.';
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return 'That date does not exist.';
  return null; // valid
}

// ── Submit ─────────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', async () => {
  errEl.textContent = '';

  // ── Cash mode ─────────────────────────────────────────────────────────────
  if (!editingTicker && modalMode === 'cash') {
    const amt = parseFloat(fCashAmt.value);
    if (!amt || amt <= 0) { errEl.textContent = 'Enter a positive cash amount.'; return; }
    setCash(getCash() + amt);
    refreshCashStat();
    closeModal();
    return;
  }

  const ticker      = fTicker.value.trim().toUpperCase();
  const shares      = parseFloat(fShares.value);
  const avg         = parseFloat(fAvg.value);
  const dateDisplay = fDate.value.trim();
  const dateErr     = validateDisplayDate(dateDisplay);
  if (dateErr) { errEl.textContent = dateErr; return; }
  const purchaseDate = displayToIso(dateDisplay) || new Date().toISOString().slice(0, 10);
  if (!ticker)                { errEl.textContent = 'Please enter a ticker symbol.';     return; }
  if (!shares || shares <= 0) { errEl.textContent = 'Shares must be a positive number.'; return; }
  if (!avg    || avg    <= 0) { errEl.textContent = 'Average price must be positive.';   return; }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editingTicker) {
    const idx = positions.findIndex(p => p.ticker === editingTicker);
    if (idx !== -1) {
      const p       = positions[idx];
      const changed = shares !== p.shares || avg !== p.avgPrice || purchaseDate !== p.purchaseDate;
      p.shares = shares; p.avgPrice = avg; p.purchaseDate = purchaseDate;
      if (changed)
        Object.keys(rangeCache).forEach(k => { if (k.startsWith(ticker + ':')) delete rangeCache[k]; });

      // Process sale if both sell fields are filled
      const sellSh = parseFloat(fSellShares.value);
      const sellPr = parseFloat(fSellPrice.value);
      if (sellSh > 0 || sellPr > 0) {
        if (!sellSh || sellSh <= 0) { errEl.textContent = 'Enter shares to sell.'; return; }
        if (!sellPr || sellPr <= 0) { errEl.textContent = 'Enter a sale price.'; return; }
        if (sellSh > p.shares)      { errEl.textContent = `Can't sell more than ${p.shares} shares.`; return; }
        const proceeds = sellSh * sellPr;
        p.shares = Math.round((p.shares - sellSh) * 1e8) / 1e8;
        setCash(getCash() + proceeds);
        refreshCashStat();
        if (p.shares <= 0) { positions.splice(idx, 1); save(); closeModal(); renderAll(); return; }
      }
    }
    save(); closeModal(); renderAll(); return;
  }

  // ── Add mode ───────────────────────────────────────────────────────────────
  if (positions.find(p => p.ticker === ticker)) {
    errEl.textContent = `${ticker} already exists. Click its row to edit it.`;
    return;
  }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Fetching live data\u2026';

  let currentPrice = avg, change = null, changePct = null, name = ticker;
  let prices = [], times = [];

  try {
    const quotes = await window.KeynYahoo.fetchYahooQuotes([ticker]);
    const q = quotes[ticker];
    if (q && !q.error && q.price) {
      currentPrice = q.price; change = q.change; changePct = q.changePct; name = q.name || ticker;
    }
  } catch (e) {}

  try {
    const chart = await window.KeynYahoo.fetchYahooChart(ticker, '5m', '1d');
    if (chart && chart.prices && chart.prices.length > 2) {
      prices = chart.prices; times = chart.times;
      if (!change) currentPrice = chart.currentPrice || currentPrice;
    }
  } catch (e) {}

  if (prices.length < 2) {
    const n = 40, drift = (currentPrice - avg) / n;
    let p = avg;
    for (let i = 0; i < n; i++) {
      p += drift + (Math.random() - 0.5) * avg * 0.006;
      prices.push(Math.max(p, 0.01));
    }
    prices[prices.length - 1] = currentPrice;
  }

  positions.push({ ticker, shares, avgPrice: avg, purchaseDate, currentPrice, change, changePct, name, prices, times });
  save(); closeModal(); renderAll();
});

// ── Persistence ────────────────────────────────────────────────────────────
function save() {
  try { localStorage.setItem('keyn_portfolio', JSON.stringify(positions)); } catch (e) {}
}

function removePosition(ticker) {
  positions = positions.filter(p => p.ticker !== ticker);
  save(); renderAll();
}

// ── Range delta header ─────────────────────────────────────────────────────
function updateRangeDelta() {
  if (!positions.length) {
    dayDeltaEl.innerHTML = '<span class="pp-delta-muted">\u2014</span>';
    return;
  }

  let deltaVal = 0, prevTotal = 0;

  if (activeRange === '1D') {
    positions.forEach(p => {
      // Use p.prevClose (from chart meta) for accurate today-vs-yesterday comparison
      const pc   = p.prevClose != null ? p.prevClose : (p.currentPrice || p.avgPrice) - (p.change || 0);
      const cur  = p.currentPrice || p.avgPrice;
      deltaVal  += (cur - pc) * p.shares;
      prevTotal += pc * p.shares;
    });
  } else {
    positions.forEach(p => {
      const { prices } = getRangeData(p);
      if (!prices.length) return;
      prevTotal += prices[0] * p.shares;
      deltaVal  += (prices[prices.length - 1] - prices[0]) * p.shares;
    });
  }

  const pct = prevTotal > 0 ? (deltaVal / prevTotal) * 100 : 0;
  const up  = deltaVal >= 0;
  const tri = up
    ? '<img src="svg/triangle-up.svg" class="tri-svg-up" alt="\u25b2">'
    : '<img src="svg/triangle-down.svg" class="tri-svg-dn" alt="\u25bc">';

  dayDeltaEl.innerHTML =
    `<span class="pp-delta-${up ? 'up' : 'dn'}">${tri} ${fmt$(Math.abs(deltaVal))} (${fmtPct(pct)})</span>`;
}

// ── Render all ─────────────────────────────────────────────────────────────
function renderAll() {
  const has = positions.length > 0;
  emptyStateEl.classList.toggle('hidden', has);

  let totalInvest = 0, totalMkt = 0, totalDayPnl = 0;
  positions.forEach(p => {
    totalInvest += p.avgPrice * p.shares;
    totalMkt    += p.currentPrice * p.shares;
    // Use p.prevClose (from chart meta) for accurate day P&L; fall back to p.change
    const pc = p.prevClose != null ? p.prevClose : (p.currentPrice - (p.change || 0));
    totalDayPnl += (p.currentPrice - pc) * p.shares;
  });

  const totalRet    = totalMkt - totalInvest;
  const totalRetPct = totalInvest > 0 ? (totalRet / totalInvest) * 100 : 0;
  const dayPct      = totalMkt   > 0 ? (totalDayPnl / (totalMkt - totalDayPnl)) * 100 : 0;

  currentTotalMkt = totalMkt;
  KEYN_DRUM.tick(totalValEl, fmt$(totalMkt));
  updateRangeDelta();

  statInv.textContent = fmt$(totalInvest);
  statMkt.textContent = fmt$(totalMkt);

  statRet.textContent = has ? fmt$(totalRet) + ' (' + fmtPct(totalRetPct) + ')' : '\u2014';
  statRet.style.color = has ? ((totalRet >= 0) ? 'var(--green)' : 'var(--red)') : '';

  statDay.textContent = has ? fmt$(totalDayPnl) + ' (' + fmtPct(Math.abs(dayPct)) + ')' : '\u2014';
  statDay.style.color = has ? ((totalDayPnl >= 0) ? 'var(--green)' : 'var(--red)') : '';

  statCnt.textContent   = positions.length;
  posMetaEl.textContent = has
    ? `${positions.length} holding${positions.length !== 1 ? 's' : ''} \u00b7 ${fmt$(totalMkt)} total`
    : 'No holdings';

  renderList();
  if (has) drawChart(); else clearChart();
}

// ── Positions list ─────────────────────────────────────────────────────────
function renderList() {
  [...listEl.querySelectorAll('.pp-row')].forEach(el => el.remove());
  listEmptyEl.style.display = positions.length ? 'none' : '';

  positions.forEach(p => {
    const pc      = p.prevClose != null ? p.prevClose : (p.currentPrice - (p.change || 0));
    const dayChg  = pc > 0 ? ((p.currentPrice - pc) / pc) * 100 : 0;
    const isUp    = dayChg >= 0;

    const row = document.createElement('div');
    row.className = 'pp-row';

    const DPR = window.devicePixelRatio || 1;
    const SW = 72, SH = 36;

    row.innerHTML = `
      <div class="pp-row-info">
        <div class="pp-row-ticker">${p.ticker}</div>
        <div class="pp-row-sub">${p.shares} sh \u00b7 avg ${fmt$(p.avgPrice)}</div>
      </div>
      <canvas width="${SW * DPR}" height="${SH * DPR}" style="width:${SW}px;height:${SH}px;display:block;"></canvas>
      <div class="pp-row-nums">
        <div class="pp-row-val">${fmt$(p.currentPrice)}</div>
        <div class="pp-row-pnl ${isUp ? 'up' : 'dn'}">${isUp ? '+' : ''}${dayChg.toFixed(2)}%</div>
      </div>
    `;

    row.addEventListener('click', () => openModal(p.ticker));

    sparkline(row.querySelector('canvas'), p.prices, isUp ? 'up' : 'dn', pc);
    listEl.appendChild(row);
  });
}

function sparkline(canvas, prices, dir, refPrice) {
  const DPR = window.devicePixelRatio || 1;
  const W = canvas.width / DPR, H = canvas.height / DPR;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!prices || prices.length < 2) return;
  const n   = prices.length;
  const ref = refPrice != null ? refPrice : prices[0];
  const last = prices[n - 1];
  const isUp = last >= ref;
  const allV = [...prices, ref];
  const mn = Math.min(...allV), mx = Math.max(...allV);
  const pad = Math.max((mx - mn) * 0.15, Math.abs(ref) * 0.001, 0.01);
  const minV = mn - pad, maxV = mx + pad;
  const color = isUp ? '#2bff00' : '#ff1a1a';
  const fx = i => (i / (n - 1)) * W;
  const fy = v => H - ((v - minV) / (maxV - minV)) * H;

  // Reference dashed line
  ctx.save();
  ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(0, fy(ref)); ctx.lineTo(W, fy(ref));
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, isUp ? 'rgba(43,255,0,0.3)' : 'rgba(255,26,26,0.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.moveTo(fx(0), fy(prices[0]));
  for (let i = 1; i < n; i++) {
    const m = (fx(i-1)+fx(i))/2;
    ctx.bezierCurveTo(m, fy(prices[i-1]), m, fy(prices[i]), fx(i), fy(prices[i]));
  }
  ctx.lineTo(fx(n-1), H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.beginPath(); ctx.moveTo(fx(0), fy(prices[0]));
  for (let i = 1; i < n; i++) {
    const m = (fx(i-1)+fx(i))/2;
    ctx.bezierCurveTo(m, fy(prices[i-1]), m, fy(prices[i]), fx(i), fy(prices[i]));
  }
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();

  // Dark end dot
  ctx.beginPath(); ctx.arc(fx(n-1), fy(last), 2.5, 0, Math.PI*2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(fx(n-1), fy(last), 1.2, 0, Math.PI*2);
  ctx.fillStyle = '#111'; ctx.fill();
}

// ── Chart ──────────────────────────────────────────────────────────────────
let _portVals = [], _portTimes = [], _chartXOf = null;
let activeRange = '1D';

const RANGE_PARAMS = {
  '1D':  { interval: '5m',  range: '1d'  },
  '1W':  { interval: '60m', range: '5d'  },
  '1M':  { interval: '1d',  range: '1mo' },
  'YTD': { interval: '1d',  range: 'ytd' },
  '1Y':  { interval: '1d',  range: '1y'  },
  'ALL': { interval: '1wk', range: 'max' },
};

// rangeCache: non-1D ranges only (1D is always fetched fresh)
const rangeCache = {};

function getRangeData(p) {
  if (activeRange === '1D') {
    // Always use the live intraday data stored on the position itself
    return { prices: p.prices || [], times: p.times || [] };
  }
  return rangeCache[`${p.ticker}:${activeRange}`] || { prices: p.prices || [], times: p.times || [] };
}

function formatTimeLabel(ts, range, tz) {
  const d = new Date(ts * 1000), opt = { timeZone: tz };
  if (range === '1D')
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, ...opt });
  if (range === '1W' || range === '1M') {
    const dp = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...opt });
    const tp = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, ...opt });
    return `${dp} \u00b7 ${tp}`;
  }
  if (range === 'YTD')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...opt });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...opt });
}

// Fetch 1D fresh — always, no cache, no date filter (Yahoo range=1d gives current/last trading day)
async function fetch1D() {
  if (!positions.length) return;
  let anyUpdated = false;

  await Promise.allSettled(positions.map(async p => {
    try {
      const resp = await fetch(
        `/api/chart?symbol=${encodeURIComponent(p.ticker)}&interval=5m&range=1d`
      );
      if (!resp.ok) return;
      const data = await resp.json();
      const result = data?.chart?.result?.[0];
      if (!result) return;

      const rawTS    = result.timestamp || [];
      const rawClose = result.indicators?.quote?.[0]?.close || [];
      const tz       = result.meta?.exchangeTimezoneName || 'America/New_York';
      const pc       = result.meta?.regularMarketPreviousClose || result.meta?.chartPreviousClose;
      const mp       = result.meta?.regularMarketPrice;

      // Take all valid bars including after-hours (like Robinhood)
      let pairs = rawTS
        .map((ts, i) => ({ ts, price: rawClose[i] }))
        .filter(pt => pt.price != null);

      if (pairs.length < 2) return;

      p.prices = pairs.map(pt => pt.price);
      p.times  = pairs.map(pt =>
        new Date(pt.ts * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
        })
      );
      if (pc) p.prevClose = pc;
      // Use last bar price — includes after-hours so it's the most current price
      const lastBarPrice = p.prices[p.prices.length - 1];
      p.currentPrice = lastBarPrice;
      if (pc) {
        p.change    = Math.round((lastBarPrice - pc) * 1e4) / 1e4;
        p.changePct = Math.round((lastBarPrice - pc) / pc * 100 * 1e4) / 1e4;
      }
      anyUpdated = true;
      console.log(`[KEYN] ${p.ticker} 1D fetched: ${pairs.length} bars, last=$${p.prices[p.prices.length-1]?.toFixed(2)}`);
    } catch(e) { console.warn('[KEYN] 1D fetch failed:', p.ticker, e.message); }
  }));

  if (anyUpdated) {
    try { localStorage.setItem('keyn_portfolio', JSON.stringify(positions)); } catch(e) {}
  }
  return anyUpdated;
}

async function fetchAndDraw(range) {
  canvasEl.style.cursor = 'wait';

  if (range === '1D') {
    await fetch1D();
  } else {
    const params = RANGE_PARAMS[range];
    await Promise.allSettled(positions.map(async p => {
      const key = `${p.ticker}:${range}`;
      if (rangeCache[key]) return; // non-1D ranges cached until tab switch
      try {
        const resp = await fetch(
          `/api/chart?symbol=${encodeURIComponent(p.ticker)}&interval=${params.interval}&range=${params.range}`
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const result = (await resp.json())?.chart?.result?.[0];
        if (!result) return;
        const rawTS    = result.timestamp || [];
        const rawClose = result.indicators?.quote?.[0]?.close || [];
        const tz       = result.meta?.exchangeTimezoneName || 'America/New_York';
        let pairs      = rawTS.map((ts, i) => ({ ts, price: rawClose[i] })).filter(pt => pt.price != null);
        if (range === 'ALL' && p.purchaseDate) {
          const pts      = new Date(p.purchaseDate).getTime() / 1000;
          const filtered = pairs.filter(pt => pt.ts >= pts - 86400);
          if (filtered.length >= 2) pairs = filtered;
        }
        rangeCache[key] = {
          prices: pairs.map(pt => pt.price),
          times:  pairs.map(pt => formatTimeLabel(pt.ts, range, tz)),
        };
      } catch(e) { console.warn(`[KEYN] fetchChart ${range} failed for ${p.ticker}:`, e.message); }
    }));
  }

  canvasEl.style.cursor = 'crosshair';
  renderAll();
  drawChart();
  updateRangeDelta();
}

// ── Midnight reset ─────────────────────────────────────────────────────────
// At midnight ET: clear everything and start fresh for the new day
function scheduleMidnightReset() {
  const now = new Date();
  const et  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const midnight = new Date(et);
  midnight.setHours(24, 0, 5, 0); // 12:00:05 AM ET
  const msUntilMidnight = midnight - et;

  setTimeout(() => {
    // Clear all caches and position intraday data
    Object.keys(rangeCache).forEach(k => delete rangeCache[k]);
    positions.forEach(p => { p.prices = []; p.times = []; });
    if (activeRange === '1D') fetchAndDraw('1D');
    scheduleMidnightReset(); // reschedule for next midnight
  }, msUntilMidnight);
}


function clearChart() {
  const wrap = canvasEl.parentElement;
  canvasEl.width  = wrap.clientWidth  * devicePixelRatio;
  canvasEl.height = wrap.clientHeight * devicePixelRatio;
  canvasEl.style.width  = wrap.clientWidth  + 'px';
  canvasEl.style.height = wrap.clientHeight + 'px';
  canvasEl.getContext('2d').clearRect(0, 0, canvasEl.width, canvasEl.height);
  _portVals = []; _chartXOf = null;
}

function drawChart(hoverIdx = null) {
  const wrap = canvasEl.parentElement;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  if (!W || !H) return;

  canvasEl.width  = W * devicePixelRatio;
  canvasEl.height = H * devicePixelRatio;
  canvasEl.style.width  = W + 'px';
  canvasEl.style.height = H + 'px';

  const ctx = canvasEl.getContext('2d');
  ctx.scale(devicePixelRatio, devicePixelRatio);

  let maxLen = 0, longestTimes = [];
  positions.forEach(p => {
    const { prices, times } = getRangeData(p);
    if (prices.length > maxLen) { maxLen = prices.length; longestTimes = times; }
  });
  if (maxLen < 2) return;
  _portTimes = longestTimes;

  const vals = [];
  for (let i = 0; i < maxLen; i++) {
    let total = 0;
    positions.forEach(p => {
      const { prices } = getRangeData(p);
      total += prices[Math.min(i, prices.length - 1)] * p.shares;
    });
    vals.push(total);
  }
  _portVals = vals;

  const n            = vals.length;
  const costBasis    = positions.reduce((s, p) => s + p.avgPrice * p.shares, 0);
  // Use p.prevClose (set from chart meta) for accurate 1D reference; fall back to derived value
  const prevClose    = positions.reduce((s, p) => {
    const pc = p.prevClose != null ? p.prevClose : (p.currentPrice || p.avgPrice) - (p.change || 0);
    return s + pc * p.shares;
  }, 0);
  const refVal       = activeRange === '1D' ? prevClose : activeRange === 'ALL' ? costBasis : vals[0];

  const allV   = [...vals, refVal];
  const lo     = Math.min(...allV);
  const hi     = Math.max(...allV);
  const spread = Math.max(hi - lo, hi * 0.0008);
  const minV   = lo - spread * 0.2;
  const maxV   = hi + spread * 0.2;
  const PL = 12, PR = 12, PT = 16, PB = 12;
  const isUp   = vals[n - 1] >= refVal;

  const xOf = i => PL + (n > 1 ? i / (n - 1) : 0) * (W - PL - PR);
  const yOf = v => PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);
  _chartXOf = xOf;

  // Reference dashed line
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.moveTo(PL, yOf(refVal)); ctx.lineTo(W - PR, yOf(refVal));
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();

  // Gradient fill
  const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
  fillGrad.addColorStop(0,    isUp ? 'rgba(43,255,0,0.35)' : 'rgba(255,26,26,0.35)');
  fillGrad.addColorStop(0.55, isUp ? 'rgba(43,255,0,0.08)' : 'rgba(255,26,26,0.08)');
  fillGrad.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(vals[0]));
  for (let i = 1; i < n; i++) {
    const m = (xOf(i-1)+xOf(i))/2;
    ctx.bezierCurveTo(m, yOf(vals[i-1]), m, yOf(vals[i]), xOf(i), yOf(vals[i]));
  }
  ctx.lineTo(xOf(n-1), H); ctx.lineTo(PL, H); ctx.closePath();
  ctx.fillStyle = fillGrad; ctx.fill();

  // Line
  const lineColor = isUp ? '#2bff00' : '#ff1a1a';
  ctx.beginPath(); ctx.moveTo(xOf(0), yOf(vals[0]));
  for (let i = 1; i < n; i++) {
    const m = (xOf(i-1)+xOf(i))/2;
    ctx.bezierCurveTo(m, yOf(vals[i-1]), m, yOf(vals[i]), xOf(i), yOf(vals[i]));
  }
  ctx.strokeStyle = lineColor; ctx.lineWidth = 2; ctx.stroke();

  if (hoverIdx !== null) {
    const hx = xOf(hoverIdx), hy = yOf(vals[hoverIdx]);
    ctx.save(); ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(hx, PT); ctx.lineTo(hx, H - PB);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2); ctx.fillStyle = lineColor; ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fillStyle = '#0d0d17'; ctx.fill();
    const timeStr = _portTimes[hoverIdx] || '';
    if (timeStr) {
      ctx.font = 'bold 11px Zain, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const lx = Math.max(28, Math.min(W - 28, hx));
      const tw = ctx.measureText(timeStr).width;
      ctx.fillStyle = 'rgba(32,41,49,0.85)';
      ctx.beginPath(); ctx.roundRect(lx - tw/2 - 6, H - PB - 18, tw + 12, 16, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(timeStr, lx, H - PB - 3);
    }
  } else {
    ctx.beginPath(); ctx.arc(xOf(n-1), yOf(vals[n-1]), 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor; ctx.fill();
  }
}

canvasEl.addEventListener('mousemove', e => {
  if (!_portVals.length || !_chartXOf) return;
  const rect = canvasEl.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  let best = 0, bestD = Infinity;
  for (let i = 0; i < _portVals.length; i++) {
    const d = Math.abs(_chartXOf(i) - mx);
    if (d < bestD) { bestD = d; best = i; }
  }
  drawChart(best);
  KEYN_DRUM.tick(totalValEl, fmt$(_portVals[best]));

  // Update header delta and Day's P&L stat to show delta at hovered point vs reference
  const costBasis = positions.reduce((s, p) => s + p.avgPrice * p.shares, 0);
  const prevClose = positions.reduce((s, p) => {
    const pc = p.prevClose != null ? p.prevClose : (p.currentPrice || p.avgPrice) - (p.change || 0);
    return s + pc * p.shares;
  }, 0);
  const refVal = activeRange === '1D' ? prevClose : activeRange === 'ALL' ? costBasis : _portVals[0];
  const delta  = _portVals[best] - refVal;
  const pct    = refVal > 0 ? (delta / refVal) * 100 : 0;
  const up     = delta >= 0;
  const tri    = up
    ? '<img src="svg/triangle-up.svg" class="tri-svg-up" alt="▲">'
    : '<img src="svg/triangle-down.svg" class="tri-svg-dn" alt="▼">';
  const deltaStr = (up ? '+' : '') + fmt$(delta) + ' (' + (up ? '+' : '') + pct.toFixed(2) + '%)';

  dayDeltaEl.innerHTML = `<span class="pp-delta-${up ? 'up' : 'dn'}">${tri} ${fmt$(Math.abs(delta))} (${Math.abs(pct).toFixed(2)}%)</span>`;
  statDay.textContent  = deltaStr;
  statDay.style.color  = up ? 'var(--green)' : 'var(--red)';
});

canvasEl.addEventListener('mouseleave', () => {
  if (_portVals.length) drawChart();
  KEYN_DRUM.tick(totalValEl, fmt$(currentTotalMkt));
  // Restore Day's P&L stat to current value
  renderAll();
});

document.querySelectorAll('.pp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pp-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeRange = tab.dataset.range;
    if (positions.length) fetchAndDraw(activeRange);
  });
});

window.addEventListener('resize', () => {
  if (positions.length) drawChart(); else clearChart();
});

// ── Bootstrap ──────────────────────────────────────────────────────────────
KEYN.initPage('portfolio');

renderAll();
refreshCashStat();

async function refreshLive() {
  if (!positions.length) return;
  await fetch1D();
  // Always redraw — even if fetch returned same data, prices may have moved
  renderAll();
  if (activeRange === '1D') {
    drawChart();
    updateRangeDelta();
  } else {
    positions.forEach(p => { delete rangeCache[`${p.ticker}:${activeRange}`]; });
    fetchAndDraw(activeRange);
  }
}


// Initial load
refreshLive();

// Poll every 30s — simple setInterval, no recursive scheduling
setInterval(refreshLive, 30_000);

scheduleMidnightReset();