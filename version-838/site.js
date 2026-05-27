
(function () {
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function makePoster(movie) {
    const hue = (Number(movie.id) * 37 + Number(movie.year || 2024)) % 360;
    const hue2 = (hue + 38) % 360;
    const hue3 = (hue + 86) % 360;
    const lines = [];
    const raw = String(movie.title || '影片');
    let buf = '';
    for (const ch of raw) {
      buf += ch;
      if (buf.length >= 11) {
        lines.push(buf);
        buf = '';
      }
    }
    if (buf) lines.push(buf);
    const title = lines.slice(0, 3).map((line, i) => `<tspan x="40" dy="${i === 0 ? 0 : 48}">${escapeXml(line)}</tspan>`).join('');
    const tagText = escapeXml([movie.region, movie.type, movie.year].filter(Boolean).join(' · '));
    const genre = escapeXml(String(movie.genre || '').slice(0, 30));
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 680" role="img" aria-label="${escapeXml(raw)}">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="hsl(${hue} 88% 54%)" />
            <stop offset="55%" stop-color="hsl(${hue2} 76% 38%)" />
            <stop offset="100%" stop-color="hsl(${hue3} 72% 24%)" />
          </linearGradient>
          <radialGradient id="r" cx="30%" cy="20%" r="70%">
            <stop offset="0%" stop-color="rgba(255,255,255,.36)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <rect width="480" height="680" rx="36" fill="url(#g)"/>
        <circle cx="392" cy="102" r="120" fill="rgba(255,255,255,.10)"/>
        <circle cx="82" cy="580" r="132" fill="rgba(255,255,255,.08)"/>
        <rect x="34" y="30" width="112" height="34" rx="17" fill="rgba(255,255,255,.22)"/>
        <text x="90" y="53" text-anchor="middle" fill="#fff" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="17" font-weight="700">${escapeXml(movie.region || '')}</text>
        <rect x="330" y="30" width="116" height="34" rx="17" fill="rgba(0,0,0,.22)"/>
        <text x="388" y="53" text-anchor="middle" fill="#fff" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="16" font-weight="700">${escapeXml(movie.year || '')}</text>
        <circle cx="388" cy="170" r="82" fill="url(#r)"/>
        <g transform="translate(40 170)">
          <rect x="0" y="0" width="96" height="36" rx="18" fill="rgba(255,255,255,.16)"/>
          <text x="48" y="24" text-anchor="middle" fill="#fff" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="16" font-weight="700">${escapeXml(movie.type || '')}</text>
        </g>
        <text x="40" y="215" fill="#fff" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="44" font-weight="800" letter-spacing="0.5">${title}</text>
        <text x="40" y="468" fill="rgba(255,255,255,.92)" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="21" font-weight="500">${genre}</text>
        <text x="40" y="520" fill="rgba(255,255,255,.86)" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="18" font-weight="400">${tagText}</text>
        <rect x="40" y="562" width="176" height="58" rx="18" fill="rgba(255,255,255,.16)"/>
        <text x="128" y="598" text-anchor="middle" fill="#fff" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="18" font-weight="700">精选剧集片库</text>
      </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function initNav() {
    const toggle = qs('.js-menu-toggle');
    const nav = qs('.js-main-nav');
    const chips = qs('.nav-search');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('is-open');
      if (chips) chips.classList.toggle('is-open');
    });
  }

  function renderCard(movie) {
    const a = document.createElement('a');
    a.className = 'movie-card compact';
    a.href = movie.detailUrl;
    a.innerHTML = `
      <div class="poster-wrap">
        <img loading="lazy" src="${makePoster(movie)}" alt="${escapeXml(movie.title)}">
        <span class="badge left">${escapeXml(movie.region || '')}</span>
        <span class="badge right">${escapeXml(movie.year || '')}</span>
      </div>
      <div class="movie-body">
        <h3>${escapeXml(movie.title || '')}</h3>
        <p>${escapeXml(movie.oneLine || '')}</p>
        <div class="movie-meta">
          <span>${escapeXml(movie.type || '')}</span>
          <span>${escapeXml(movie.genre || '')}</span>
        </div>
      </div>`;
    return a;
  }

  function initSearch() {
    const input = qs('#search-input');
    const results = qs('#search-results');
    const form = qs('#search-form');
    const count = qs('#result-count');
    const title = qs('#result-title');
    const filtersWrap = qs('#filter-row');
    if (!input || !results || !Array.isArray(window.MOVIES)) return;

    const filters = [
      { label: '全部', value: '' },
      { label: '国产', value: '国产' },
      { label: '日韩', value: '日韩' },
      { label: '欧美', value: '欧美' },
      { label: '电影', value: '电影' },
      { label: '剧集', value: '剧集' },
      { label: '纪录片', value: '纪录片' },
      { label: '动画', value: '动画' },
    ];
    let activeFilter = '';
    if (filtersWrap) {
      filtersWrap.innerHTML = filters.map(f => `<button class="filter-chip${f.value === '' ? ' is-active' : ''}" type="button" data-value="${escapeXml(f.value)}">${escapeXml(f.label)}</button>`).join('');
      qsa('.filter-chip', filtersWrap).forEach(btn => btn.addEventListener('click', () => {
        activeFilter = btn.dataset.value || '';
        qsa('.filter-chip', filtersWrap).forEach(x => x.classList.toggle('is-active', x === btn));
        run();
      }));
    }

    function run() {
      const q = input.value.trim().toLowerCase();
      let list = window.MOVIES.slice();
      if (activeFilter) {
        list = list.filter(m => {
          const text = [m.region, m.type, m.genre, ...(m.tags || [])].join(' ');
          return text.includes(activeFilter);
        });
      }
      if (q) {
        list = list.filter(m => {
          const hay = [m.title, m.region, m.type, m.year, m.genre, m.oneLine, ...(m.tags || [])].join(' ').toLowerCase();
          return hay.includes(q);
        });
      }
      list.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
      results.innerHTML = '';
      const frag = document.createDocumentFragment();
      list.slice(0, 120).forEach(m => frag.appendChild(renderCard(m)));
      results.appendChild(frag);
      if (count) count.textContent = `${list.length} 条结果`;
      if (title) title.textContent = q || activeFilter ? `搜索结果：${q || activeFilter}` : '全部影片';
      if (!list.length) {
        results.innerHTML = '<div class="content-card" style="grid-column:1/-1">未找到匹配内容，请尝试其他关键词。</div>';
      }
    }

    form && form.addEventListener('submit', ev => { ev.preventDefault(); run(); });
    input.addEventListener('input', run);
    run();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initSearch();
  });

  window.makePoster = makePoster;
})();
