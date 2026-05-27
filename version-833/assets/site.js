(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.hero-tab'));
  var current = 0;
  var timer = null;

  function setSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    tabs.forEach(function (tab, tabIndex) {
      tab.classList.toggle('is-active', tabIndex === current);
    });
  }

  function startSlider() {
    if (timer || slides.length < 2) {
      return;
    }
    timer = window.setInterval(function () {
      setSlide(current + 1);
    }, 5200);
  }

  function stopSlider() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      stopSlider();
      setSlide(index);
      startSlider();
    });
  });

  setSlide(0);
  startSlider();

  var filterInput = document.querySelector('[data-filter-input]');
  var filterRegion = document.querySelector('[data-filter-region]');
  var filterYear = document.querySelector('[data-filter-year]');
  var filterType = document.querySelector('[data-filter-type]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
  var noResults = document.querySelector('[data-no-results]');

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function applyFilters() {
    if (!cards.length) {
      return;
    }

    var keyword = normalize(filterInput && filterInput.value);
    var region = normalize(filterRegion && filterRegion.value);
    var year = normalize(filterYear && filterYear.value);
    var type = normalize(filterType && filterType.value);
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute('data-search'));
      var cardRegion = normalize(card.getAttribute('data-region'));
      var cardYear = normalize(card.getAttribute('data-year'));
      var cardType = normalize(card.getAttribute('data-type'));
      var matched = true;

      if (keyword && haystack.indexOf(keyword) === -1) {
        matched = false;
      }
      if (region && cardRegion !== region) {
        matched = false;
      }
      if (year && cardYear !== year) {
        matched = false;
      }
      if (type && cardType !== type) {
        matched = false;
      }

      card.classList.toggle('hidden-card', !matched);
      if (matched) {
        visible += 1;
      }
    });

    if (noResults) {
      noResults.classList.toggle('is-visible', visible === 0);
    }
  }

  [filterInput, filterRegion, filterYear, filterType].forEach(function (control) {
    if (control) {
      control.addEventListener('input', applyFilters);
      control.addEventListener('change', applyFilters);
    }
  });

  var heroSearch = document.querySelector('[data-hero-search]');
  if (heroSearch) {
    heroSearch.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = heroSearch.querySelector('input');
      var query = input ? encodeURIComponent(input.value.trim()) : '';
      window.location.href = './search.html' + (query ? '?q=' + query : '');
    });
  }

  var params = new URLSearchParams(window.location.search);
  var q = params.get('q');
  if (q && filterInput) {
    filterInput.value = q;
    applyFilters();
  }
}());

function initMoviePlayer(source) {
  var video = document.getElementById('movie-video');
  var mask = document.getElementById('player-mask');
  var button = document.getElementById('play-button');
  var prepared = false;
  var hlsInstance = null;

  if (!video || !source) {
    return;
  }

  function prepare() {
    if (prepared) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      prepared = true;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(video);
      prepared = true;
      return;
    }

    video.src = source;
    prepared = true;
  }

  function start() {
    prepare();
    if (mask) {
      mask.classList.add('is-hidden');
    }
    var playTask = video.play();
    if (playTask && typeof playTask.catch === 'function') {
      playTask.catch(function () {});
    }
  }

  if (button) {
    button.addEventListener('click', start);
  }

  if (mask) {
    mask.addEventListener('click', start);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      start();
    }
  });

  video.addEventListener('play', function () {
    if (mask) {
      mask.classList.add('is-hidden');
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });

  prepare();
}
