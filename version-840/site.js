
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function initNav() {
    const shell = $('.nav-shell');
    const toggle = $('.nav-toggle');
    if (!shell || !toggle) return;

    toggle.addEventListener('click', () => {
      const open = shell.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', (e) => {
      if (!shell.contains(e.target)) {
        shell.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initHero() {
    const slides = $$('.hero-slide');
    if (!slides.length) return;

    const dotsWrap = $('.hero-dots');
    const prev = $('.hero-prev');
    const next = $('.hero-next');
    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === index);
      });
      if (dotsWrap) {
        $$('.hero-dot', dotsWrap).forEach((dot, dotIndex) => {
          dot.classList.toggle('active', dotIndex === index);
        });
      }
    }

    function step(dir) {
      show(index + dir);
      reset();
    }

    function reset() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => show(index + 1), 5000);
    }

    if (dotsWrap && dotsWrap.children.length === 0) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', '切换焦点 ' + (i + 1));
        dot.addEventListener('click', () => {
          show(i);
          reset();
        });
        dotsWrap.appendChild(dot);
      });
    }

    prev && prev.addEventListener('click', () => step(-1));
    next && next.addEventListener('click', () => step(1));
    show(0);
    reset();
  }

  function normalize(str) {
    return (str || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function filterCards(container, query, category, year) {
    const cards = $$('.movie-card, .rank-row, .category-card[data-title]', container);
    let visible = 0;
    cards.forEach((card) => {
      const hay = normalize(card.dataset.search || card.textContent);
      const matchQuery = !query || hay.includes(normalize(query));
      const matchCat = !category || category === 'all' || card.dataset.category === category;
      const matchYear = !year || year === 'all' || card.dataset.year === year;
      const show = matchQuery && matchCat && matchYear;
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });
    return visible;
  }

  function initLocalFilters() {
    const bar = $('.search-bar');
    const grid = $('[data-filter-grid]');
    if (!bar || !grid) return;

    const input = $('[data-search-input]', bar);
    const category = $('[data-category-select]', bar);
    const year = $('[data-year-select]', bar);
    const chips = $$('.filter-chip', bar);
    const empty = $('[data-empty-state]');

    function sync() {
      const visible = filterCards(grid, input ? input.value : '', category ? category.value : '', year ? year.value : '');
      if (empty) empty.style.display = visible ? 'none' : 'block';
    }

    input && input.addEventListener('input', sync);
    category && category.addEventListener('change', sync);
    year && year.addEventListener('change', sync);

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        if (category) category.value = chip.dataset.category || 'all';
        sync();
      });
    });

    sync();
  }

  function createMovieCard(movie) {
    const title = movie.title || '';
    const cover = movie.cover || './1.jpg';
    const search = [movie.title, movie.region, movie.type, movie.genre, movie.tags, movie.oneLine, movie.summary].filter(Boolean).join(' ');
    const tags = [movie.region, movie.type, movie.genre].filter(Boolean).join(' · ');
    const summary = (movie.oneLine || movie.summary || '').slice(0, 86);
    return `
      <article class="movie-card" data-title="${escapeHtml(title)}" data-search="${escapeHtml(search)}" data-category="${escapeHtml(movie.category)}" data-year="${escapeHtml(movie.year || '')}">
        <a class="media-link" href="movie-${movie.id}.html">
          <div class="media-frame">
            <img src="${escapeHtml(cover)}" alt="${escapeHtml(title)} 封面" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="media-fallback" style="display:none;">
              <span class="media-fallback-num">${escapeHtml(movie.id)}</span>
              <span class="media-fallback-letter">${escapeHtml(title.slice(0, 1) || '片')}</span>
            </div>
            <div class="media-badge">${escapeHtml(movie.year || '')}</div>
            <div class="media-play">▶</div>
          </div>
          <div class="card-body">
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <p class="card-summary">${escapeHtml(summary)}</p>
            <div class="chip-row">
              <span class="chip">${escapeHtml(movie.region || '未知地区')}</span>
              <span class="chip">${escapeHtml(movie.type || '')}</span>
              <span class="chip">${escapeHtml(movie.genre || '')}</span>
            </div>
            <div class="card-meta">${escapeHtml(tags)}</div>
          </div>
        </a>
      </article>
    `;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initSearchPage() {
    const input = $('[data-search-live]');
    const results = $('[data-search-results]');
    const stats = $('[data-search-stats]');
    if (!input || !results || !window.MOVIES_DATA || !Array.isArray(window.MOVIES_DATA)) return;

    const dataset = window.MOVIES_DATA;
    const yearSelect = $('[data-search-year]');
    const catSelect = $('[data-search-category]');
    const sortSelect = $('[data-search-sort]');

    function render(list) {
      results.innerHTML = list.map(createMovieCard).join('');
      if (stats) stats.textContent = `共 ${list.length} 部`;
    }

    function run() {
      const q = normalize(input.value);
      const year = yearSelect ? yearSelect.value : 'all';
      const cat = catSelect ? catSelect.value : 'all';
      const sort = sortSelect ? sortSelect.value : 'rank';
      let list = dataset.filter((movie) => {
        const hay = normalize([movie.title, movie.region, movie.type, movie.genre, movie.tags, movie.oneLine, movie.summary].filter(Boolean).join(' '));
        const matchQ = !q || hay.includes(q);
        const matchYear = year === 'all' || String(movie.year) === year;
        const matchCat = cat === 'all' || movie.category === cat;
        return matchQ && matchYear && matchCat;
      });
      if (sort === 'year') {
        list = list.slice().sort((a, b) => (b.year || 0) - (a.year || 0));
      } else if (sort === 'title') {
        list = list.slice().sort((a, b) => String(a.title).localeCompare(String(b.title), 'zh-Hans-CN'));
      } else {
        list = list.slice().sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0));
      }
      render(list);
    }

    input.addEventListener('input', run);
    yearSelect && yearSelect.addEventListener('change', run);
    catSelect && catSelect.addEventListener('change', run);
    sortSelect && sortSelect.addEventListener('change', run);
    render(dataset.slice(0, 120));
    run();
  }

  function initPlayer() {
    const shell = $('[data-player]');
    if (!shell) return;
    const video = $('video', shell);
    const playBtn = $('.player-overlay-button', shell);
    const sourceButtons = $$('.source-btn', shell);
    if (!video || !sourceButtons.length) return;

    let current = sourceButtons[0].dataset.src;
    let hls = null;

    function setActive(btn) {
      sourceButtons.forEach((b) => b.classList.toggle('active', b === btn));
    }

    function loadSource(src) {
      current = src;
      if (window.Hls && window.Hls.isSupported && window.Hls.isSupported()) {
        if (hls) {
          try { hls.destroy(); } catch (e) {}
        }
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            try { hls.destroy(); } catch (e) {}
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        video.src = src;
      }
    }

    async function start(src) {
      if (src && current !== src) {
        loadSource(src);
      } else if (!video.src) {
        loadSource(current);
      }
      try {
        await video.play();
      } catch (err) {
        // user gesture may be required; keep button visible.
      }
    }

    sourceButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        setActive(btn);
        loadSource(btn.dataset.src);
        start(btn.dataset.src);
      });
    });

    playBtn && playBtn.addEventListener('click', () => start(current));
    video.addEventListener('click', () => start(current));
    loadSource(current);
    setActive(sourceButtons[0]);
  }

  function initRankSort() {
    const sel = $('[data-rank-sort]');
    const rows = $$('.rank-row[data-rank-row]');
    if (!sel || !rows.length) return;
    sel.addEventListener('change', () => {
      const mode = sel.value;
      rows.sort((a, b) => {
        const ay = Number(a.dataset.year || 0);
        const by = Number(b.dataset.year || 0);
        const as = Number(a.dataset.score || 0);
        const bs = Number(b.dataset.score || 0);
        if (mode === 'year') return by - ay;
        if (mode === 'title') return a.dataset.title.localeCompare(b.dataset.title, 'zh-Hans-CN');
        return bs - as;
      }).forEach((row) => row.parentElement.appendChild(row));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initHero();
    initLocalFilters();
    initSearchPage();
    initPlayer();
    initRankSort();
  });
})();
