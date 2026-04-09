/**
 * KEYN Partials — keyn-partials.js
 *
 * Injects the shared sidebar and topbar into any KEYN page,
 * then wires up nav routing and the full search bar.
 *
 * Usage — add ONE call at the bottom of each page's <body>:
 *
 *   <div id="keyn-sidebar-host"></div>
 *   …inside .right-pane…
 *   <div id="keyn-topbar-host"></div>
 *
 *   <script src="partials/keyn-partials.js"></script>
 *   <script>KEYN.initPage('portfolio');</script>
 *
 * Valid page IDs:
 *   dashboard | portfolio | laboratory | timemachine | shortlists | community | settings
 */

(function () {

  // ── Nav item definitions ──────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id: 'dashboard',   label: 'Dashboard',   href: 'home.html',      icon: 'Dashboard'   },
    { id: 'portfolio',   label: 'Portfolio',   href: 'portfolio.html', icon: 'Portfolio'   },
    { id: 'laboratory',  label: 'Laboratory',  href: null,             icon: 'Laboratory'  },
    { id: 'timemachine', label: 'Time Machine',href: null,             icon: 'Time Machine'},
    { id: 'shortlists',  label: 'Shortlists',  href: null,             icon: 'Shortlists'  },
    { id: 'community',   label: 'Community',   href: null,             icon: 'Community'   },
    { id: 'settings',    label: 'Settings',    href: null,             icon: 'Settings'    },
  ];

  // ── HTML builders ─────────────────────────────────────────────────────────

  function buildSidebar(activeId) {
    const navHTML = NAV_ITEMS.map(item => {
      const active  = item.id === activeId;
      const iconSrc = `svg/${item.icon} ${active ? 'Active' : 'Inactive'}.svg`;
      const href    = item.href ? `data-href="${item.href}"` : '';
      return `
        <div class="nav-item${active ? ' active' : ''}" ${href}>
          <div class="active-indicator"></div>
          <img class="nav-icon"
               src="${iconSrc}"
               data-active="svg/${item.icon} Active.svg"
               data-inactive="svg/${item.icon} Inactive.svg"
               alt="${item.label}" />
          <span class="nav-label">${item.label}</span>
        </div>`;
    }).join('');

    return `
      <aside class="sidebar">
        <div class="logo-wrap">
          <img src="content/Keyn-Logo.png" alt="Keyn" class="logo-img" />
        </div>
        <nav class="nav" id="main-nav">${navHTML}</nav>
      </aside>`;
  }

  function buildTopbar() {
    return `
      <div class="topbar">
        <div class="search-wrap" id="search-wrap">
          <div class="search-spacer"></div>
          <div class="search-container" id="search-container">
            <div class="search-input-row">
              <img class="search-icon" src="svg/Search.svg" alt="search" />
              <input class="search-input"
                     id="search-input"
                     type="text"
                     placeholder="Search"
                     autocomplete="off" />
            </div>
            <div class="search-dropdown" id="search-dropdown"></div>
          </div>
        </div>
        <div class="profile-area">
          <span class="username">@jacobzlot</span>
          <div class="avatar">JZ</div>
        </div>
      </div>`;
  }

  // ── Nav click handler ─────────────────────────────────────────────────────

  function initNav() {
    document.querySelectorAll('#main-nav .nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const href = item.dataset.href;
        if (href) window.location.href = href;
      });
    });
  }

  // ── Search bar ────────────────────────────────────────────────────────────
  // Exact replica of the search functionality in home.html.

  function initSearch() {
    const input     = document.getElementById('search-input');
    const dropdown  = document.getElementById('search-dropdown');
    const wrap      = document.getElementById('search-wrap');
    const container = document.getElementById('search-container');
    if (!input || !dropdown || !wrap || !container) return;

    // ── Mock data ───────────────────────────────────────────────────────────
    const STOCKS = [
      { ticker: 'AAPL',  name: 'Apple',                                    pct: '-3.28', dir: 'dn'   },
      { ticker: 'TTDNY', name: 'Techtronic',                               pct: '+1.03', dir: 'up'   },
      { ticker: 'RIVN',  name: 'Rivian Automatic',                         pct: '+2.74', dir: 'up'   },
      { ticker: 'JD',    name: 'JD.com',                                   pct: '-0.73', dir: 'dn'   },
      { ticker: 'INTC',  name: 'Intel Corp',                               pct: '0.00',  dir: 'flat' },
      { ticker: 'SPY',   name: 'SPDR S&P 500 ETF Trust',                  pct: '-3.28', dir: 'dn'   },
      { ticker: 'GLD',   name: 'SPDR Gold Trust',                         pct: '+1.03', dir: 'up'   },
      { ticker: 'SPOT',  name: 'Spotify',                                  pct: '+2.74', dir: 'up'   },
      { ticker: 'SPYM',  name: 'State Street SPDR Portfolio S&P 5...',    pct: '-0.73', dir: 'dn'   },
      { ticker: 'ASTS',  name: 'AST SpaceMobile',                         pct: '0.00',  dir: 'flat' },
      { ticker: 'CRSP',  name: 'CRISPR Therapeutics',                     pct: '+3.29', dir: 'up'   },
      { ticker: 'SOFI',  name: 'SoFi Technologies',                       pct: '-0.29', dir: 'dn'   },
      { ticker: 'GE',    name: 'General Electric',                        pct: '+2.14', dir: 'up'   },
      { ticker: 'SE',    name: 'Sea Limited',                             pct: '+0.01', dir: 'flat' },
      { ticker: 'FAZE',  name: 'FaZe Clan',                               pct: '-4.93', dir: 'dn'   },
      { ticker: 'ARKK',  name: 'ARK Innovation ETF',                      pct: '-2.21', dir: 'dn'   },
    ];

    const INDEXES = [
      { ticker: 'SPX',  name: 'S&P 500 Index',          pct: '-1.33',  dir: 'dn'  },
      { ticker: 'DJIA', name: 'Dow Jones Industrial Avg',pct: '+0.95',  dir: 'up'  },
      { ticker: 'COMP', name: 'Nasdaq Composite',        pct: '-1.59',  dir: 'dn'  },
      { ticker: 'RUT',  name: 'Russell 2000',            pct: '+2.33',  dir: 'up'  },
      { ticker: 'NYA',  name: 'NYSE Composite',          pct: '-1.19',  dir: 'dn'  },
      { ticker: 'VIX',  name: 'CBOE Volatility Index',  pct: '+24.17', dir: 'up'  },
    ];

    // ── Helpers ─────────────────────────────────────────────────────────────

    function highlight(text, query) {
      if (!query) return document.createTextNode(text);
      const idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx === -1) return document.createTextNode(text);
      const span = document.createElement('span');
      span.appendChild(document.createTextNode(text.slice(0, idx)));
      const hl = document.createElement('span');
      hl.className = 'hl';
      hl.textContent = text.slice(idx, idx + query.length);
      span.appendChild(hl);
      span.appendChild(document.createTextNode(text.slice(idx + query.length)));
      return span;
    }

    function makeRow(item, query) {
      const row = document.createElement('div');
      row.className = 'search-result-row';

      const tickerEl = document.createElement('span');
      tickerEl.className = 'sr-ticker';
      tickerEl.appendChild(highlight(item.ticker, query));

      const nameEl = document.createElement('span');
      nameEl.className = 'sr-name';
      nameEl.appendChild(highlight(item.name, query));

      const pctEl = document.createElement('span');
      pctEl.className = 'sr-pct ' + item.dir;
      if (item.dir === 'flat')      pctEl.textContent = item.pct + '%';
      else if (item.dir === 'up')   pctEl.textContent = (item.pct.startsWith('+') ? '' : '+') + item.pct + '%';
      else                          pctEl.textContent = item.pct + '%';

      row.appendChild(tickerEl);
      row.appendChild(nameEl);
      row.appendChild(pctEl);
      return row;
    }

    function makeSection(label, items, query, maxShown) {
      if (!items.length) return null;
      const wrapper = document.createElement('div');

      const lbl = document.createElement('div');
      lbl.className = 'search-section-label';
      lbl.textContent = label;
      wrapper.appendChild(lbl);

      const list = document.createElement('div');
      list.className = 'search-section';
      items.slice(0, maxShown).forEach(item => list.appendChild(makeRow(item, query)));

      if (items.length > maxShown) {
        const more = document.createElement('div');
        more.className = 'search-show-more';
        more.textContent = 'Show More';
        more.addEventListener('click', e => {
          e.stopPropagation();
          items.slice(maxShown).forEach(item => list.appendChild(makeRow(item, query)));
          more.remove();
        });
        list.appendChild(more);
      }

      wrapper.appendChild(list);
      return wrapper;
    }

    function renderTrending() {
      dropdown.innerHTML = '';
      const sec = makeSection('Trending', STOCKS.slice(0, 5), '', 5);
      if (sec) dropdown.appendChild(sec);
    }

    function renderFiltered(query) {
      dropdown.innerHTML = '';
      const matchStocks  = STOCKS.filter(s =>
        s.ticker.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      );
      const matchIndexes = INDEXES.filter(s =>
        s.ticker.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      );

      const stockSec = makeSection('Stocks', matchStocks, query, 5);
      if (stockSec) dropdown.appendChild(stockSec);

      const idxSec = makeSection('Market indexes', matchIndexes, query, 3);
      if (idxSec) dropdown.appendChild(idxSec);

      if (!stockSec && !idxSec) {
        const empty = document.createElement('div');
        empty.className = 'search-section-label';
        empty.textContent = 'No results';
        dropdown.appendChild(empty);
      }
    }

    function openSearch() {
      container.classList.add('open');
      wrap.classList.add('active');
      input.focus();
      if (input.value.trim() === '') renderTrending();
      else renderFiltered(input.value.trim());
    }

    function closeSearch() {
      container.classList.remove('open');
      wrap.classList.remove('active');
      input.value = '';
    }

    // ── Events ──────────────────────────────────────────────────────────────
    input.addEventListener('focus', openSearch);

    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length === 0) renderTrending();
      else renderFiltered(q);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeSearch(); input.blur(); }
    });

    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) closeSearch();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.KEYN = {
    /**
     * Call once per page after the DOM is ready.
     * @param {string} activeId  The nav item ID for the current page.
     */
    initPage: function (activeId) {
      // Inject sidebar
      const sidebarHost = document.getElementById('keyn-sidebar-host');
      if (sidebarHost) sidebarHost.outerHTML = buildSidebar(activeId);

      // Inject topbar
      const topbarHost = document.getElementById('keyn-topbar-host');
      if (topbarHost) topbarHost.outerHTML = buildTopbar();

      // Wire up nav + search after injection
      initNav();
      initSearch();
    },
  };

})();