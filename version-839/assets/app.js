(function () {
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  const slides = Array.from(document.querySelectorAll('[data-hero-slide]'));
  if (slides.length > 1) {
    let active = 0;
    const setActive = (idx) => {
      slides.forEach((slide, i) => slide.hidden = i !== idx);
      active = idx;
    };
    setActive(0);
    const next = () => setActive((active + 1) % slides.length);
    let timer = window.setInterval(next, 5000);
    const hero = document.querySelector('[data-hero-carousel]');
    if (hero) {
      hero.addEventListener('mouseenter', () => window.clearInterval(timer));
      hero.addEventListener('mouseleave', () => timer = window.setInterval(next, 5000));
    }
    document.querySelectorAll('[data-hero-prev]').forEach(btn => btn.addEventListener('click', () => setActive((active - 1 + slides.length) % slides.length)));
    document.querySelectorAll('[data-hero-next]').forEach(btn => btn.addEventListener('click', () => setActive((active + 1) % slides.length)));
  }

  const searchRoot = document.querySelector('[data-search-root]');
  if (searchRoot) {
    const input = searchRoot.querySelector('[data-search-input]');
    const typeSelect = searchRoot.querySelector('[data-type-select]');
    const yearSelect = searchRoot.querySelector('[data-year-select]');
    const results = searchRoot.querySelector('[data-search-results]');
    const count = searchRoot.querySelector('[data-search-count]');
    const empty = searchRoot.querySelector('[data-search-empty]');
    const jsonUrl = searchRoot.getAttribute('data-json-url');

    fetch(jsonUrl)
      .then(r => r.json())
      .then(movies => {
        const years = [...new Set(movies.map(m => m.year).filter(Boolean))].sort((a, b) => b - a);
        if (yearSelect && yearSelect.options.length <= 1) {
          years.slice(0, 30).forEach(y => {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = String(y);
            yearSelect.appendChild(opt);
          });
        }

        const render = () => {
          const q = (input?.value || '').trim().toLowerCase();
          const typ = typeSelect?.value || '';
          const year = yearSelect?.value || '';
          const filtered = movies.filter(m => {
            const hit = !q || [m.title, m.type, m.region, m.genre, m.one_line, m.summary, m.review, ...(m.tags || [])].join(' ').toLowerCase().includes(q);
            const typeHit = !typ || m.group === typ;
            const yearHit = !year || String(m.year) === year;
            return hit && typeHit && yearHit;
          });
          if (count) count.textContent = String(filtered.length);
          if (results) {
            results.innerHTML = filtered.slice(0, 200).map(cardHTML).join('');
          }
          if (empty) empty.hidden = filtered.length !== 0;
        };

        const cardHTML = (m) => `
          <a class="movie-card" href="${m.href}">
            <div class="poster"><img src="${m.poster}" alt="${escapeHTML(m.title)} 海报"></div>
            <div class="body">
              <h3>${escapeHTML(m.title)}</h3>
              <div class="meta-line">
                <span>${escapeHTML(String(m.year || ''))}</span>
                <span>${escapeHTML(m.group || '')}</span>
              </div>
              <p class="excerpt">${escapeHTML(m.one_line || m.summary || '').slice(0, 90)}${(m.one_line || m.summary || '').length > 90 ? '…' : ''}</p>
            </div>
          </a>`;

        window.escapeHTML = function (s) {
          return String(s)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
        };

        if (input) input.addEventListener('input', render);
        if (typeSelect) typeSelect.addEventListener('change', render);
        if (yearSelect) yearSelect.addEventListener('change', render);
        render();
      })
      .catch(() => {
        if (results) results.innerHTML = '<div class="notice">搜索数据加载失败，请返回首页浏览。</div>';
      });
  }
})();
