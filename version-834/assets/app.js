(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHero() {
    var root = document.querySelector('[data-hero-carousel]');
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.hero-dot'));
    if (!slides.length) return;
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function start() {
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function restart() {
      if (timer) clearInterval(timer);
      start();
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    root.addEventListener('mouseenter', function () {
      if (timer) clearInterval(timer);
    });
    root.addEventListener('mouseleave', start);
    start();
  }

  function initCatalogFilters() {
    document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
      var input = panel.querySelector('.catalog-search');
      var chips = Array.prototype.slice.call(panel.querySelectorAll('.filter-chip'));
      var grid = panel.parentElement.querySelector('[data-catalog-grid]');
      if (!grid) return;
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
      var active = 'all';

      function apply() {
        var q = input ? input.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var hay = [
            card.getAttribute('data-title') || '',
            card.getAttribute('data-region') || '',
            card.getAttribute('data-year') || '',
            card.getAttribute('data-type') || '',
            card.getAttribute('data-tags') || ''
          ].join(' ').toLowerCase();
          var region = card.getAttribute('data-region') || '';
          var okText = !q || hay.indexOf(q) !== -1;
          var okRegion = active === 'all' || region.indexOf(active) !== -1;
          card.classList.toggle('is-hidden-card', !(okText && okRegion));
        });
      }

      if (input) {
        input.addEventListener('input', apply);
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          active = chip.getAttribute('data-filter') || 'all';
          chips.forEach(function (item) {
            item.classList.toggle('is-active', item === chip);
          });
          apply();
        });
      });
    });
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('.player-overlay');
      if (!video || !button) return;
      var stream = video.getAttribute('data-stream');
      var loaded = false;
      var hls = null;

      function load() {
        if (loaded || !stream) return;
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
        } else {
          video.src = stream;
        }
      }

      function play() {
        load();
        var result = video.play();
        if (result && result.catch) {
          result.catch(function () {});
        }
      }

      button.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) play();
      });
      video.addEventListener('play', function () {
        button.classList.add('is-hidden');
      });
      video.addEventListener('pause', function () {
        button.classList.remove('is-hidden');
      });
      window.addEventListener('pagehide', function () {
        if (hls) hls.destroy();
      });
    });
  }

  function cardTemplate(item) {
    return [
      '<article class="movie-card">',
      '<a href="' + item.href + '" class="poster-link" aria-label="观看' + item.title + '">',
      '<img src="' + item.cover + '" alt="' + item.title + '" loading="lazy">',
      '<span class="poster-shade"></span>',
      '<span class="card-play">▶</span>',
      '</a>',
      '<div class="card-body">',
      '<a class="card-title" href="' + item.href + '">' + item.title + '</a>',
      '<p>' + item.oneLine + '</p>',
      '<div class="card-meta">',
      '<a href="' + item.categoryHref + '">' + item.category + '</a>',
      '<span>' + item.duration + '</span>',
      '<span>' + item.year + '</span>',
      '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function initSearchPage() {
    var root = document.querySelector('[data-search-page]');
    if (!root || !window.SEARCH_MOVIES) return;
    var input = document.getElementById('searchInput');
    var category = document.getElementById('categorySelect');
    var region = document.getElementById('regionSelect');
    var year = document.getElementById('yearSelect');
    var results = document.getElementById('searchResults');
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    if (input) input.value = initial;

    function render() {
      var q = (input ? input.value : '').trim().toLowerCase();
      var cat = category ? category.value : '';
      var reg = region ? region.value : '';
      var yr = year ? year.value : '';
      var matched = window.SEARCH_MOVIES.filter(function (item) {
        var hay = [item.title, item.region, item.type, item.year, item.category, item.tags].join(' ').toLowerCase();
        return (!q || hay.indexOf(q) !== -1) &&
          (!cat || item.category === cat) &&
          (!reg || item.region === reg) &&
          (!yr || item.year === yr);
      }).slice(0, 96);
      results.innerHTML = matched.map(cardTemplate).join('');
    }

    [input, category, region, year].forEach(function (el) {
      if (el) el.addEventListener('input', render);
      if (el) el.addEventListener('change', render);
    });
    render();
  }

  ready(function () {
    initMenu();
    initHero();
    initCatalogFilters();
    initPlayers();
    initSearchPage();
  });
})();
