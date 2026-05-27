(function() {
  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var update = function() {
      if (window.scrollY > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', function() {
      panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', panel.classList.contains('open') ? 'true' : 'false');
    });
  }

  function initSearchForms() {
    selectAll('[data-search-form]').forEach(function(form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var q = input ? input.value.trim() : '';
        if (!q) return;
        var root = document.body.getAttribute('data-root') || './';
        window.location.href = root + 'search.html?q=' + encodeURIComponent(q);
      });
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var slides = selectAll('.hero-slide', hero);
    var dots = selectAll('.hero-dot', hero);
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;
    var stopped = false;

    function show(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      if (stopped || slides.length < 2) return;
      timer = window.setInterval(function() {
        show(index + 1);
      }, 5000);
    }

    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() {
        stopped = true;
        show(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function() {
        stopped = true;
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function() {
        stopped = true;
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function normalize(text) {
    return (text || '').toString().toLowerCase();
  }

  function initCatalogFilters() {
    var grid = document.querySelector('[data-catalog-grid]');
    if (!grid) return;
    var cards = selectAll('[data-card]', grid);
    var input = document.querySelector('[data-filter-input]');
    var sort = document.querySelector('[data-sort-select]');
    var empty = document.querySelector('[data-empty-state]');
    var viewButtons = selectAll('[data-view]');
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q && input) input.value = q;

    function apply() {
      var keyword = normalize(input ? input.value : '');
      var visible = 0;
      cards.forEach(function(card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-year')
        ].join(' '));
        var hit = !keyword || haystack.indexOf(keyword) !== -1;
        card.style.display = hit ? '' : 'none';
        if (hit) visible += 1;
      });
      if (empty) empty.classList.toggle('show', visible === 0);
    }

    function sortCards() {
      if (!sort) return;
      var value = sort.value;
      var sorted = cards.slice().sort(function(a, b) {
        if (value === 'year') return (b.getAttribute('data-year') || '').localeCompare(a.getAttribute('data-year') || '', 'zh-CN');
        if (value === 'title') return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '', 'zh-CN');
        return Number(a.getAttribute('data-index')) - Number(b.getAttribute('data-index'));
      });
      sorted.forEach(function(card) {
        grid.appendChild(card);
      });
    }

    if (input) input.addEventListener('input', apply);
    if (sort) sort.addEventListener('change', function() {
      sortCards();
      apply();
    });

    viewButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        var mode = button.getAttribute('data-view');
        grid.classList.toggle('list-view', mode === 'list');
        viewButtons.forEach(function(item) {
          item.classList.toggle('active', item === button);
        });
      });
    });

    sortCards();
    apply();
  }

  function initPlayers() {
    selectAll('.player-shell').forEach(function(player) {
      var video = player.querySelector('video');
      var button = player.querySelector('.play-cover');
      var sourceNode = video ? video.querySelector('source') : null;
      var src = player.getAttribute('data-m3u8') || (sourceNode ? sourceNode.getAttribute('src') : '');
      var loaded = false;
      var hls = null;

      if (!video || !src) return;

      function load() {
        if (loaded) return;
        loaded = true;
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
        } else {
          video.src = src;
        }
      }

      function play() {
        load();
        player.classList.add('is-playing');
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function() {
            player.classList.remove('is-playing');
          });
        }
      }

      if (button) button.addEventListener('click', play);
      video.addEventListener('click', function() {
        if (video.paused) play();
      });
      video.addEventListener('play', function() {
        player.classList.add('is-playing');
      });
      video.addEventListener('pause', function() {
        if (!video.ended) return;
        player.classList.remove('is-playing');
      });
      window.addEventListener('pagehide', function() {
        if (hls) hls.destroy();
      });
    });
  }

  function initBackTop() {
    var button = document.querySelector('[data-back-top]');
    if (!button) return;
    var update = function() {
      button.classList.toggle('show', window.scrollY > 420);
    };
    button.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function() {
    initHeader();
    initMenu();
    initSearchForms();
    initHero();
    initCatalogFilters();
    initPlayers();
    initBackTop();
  });
})();
