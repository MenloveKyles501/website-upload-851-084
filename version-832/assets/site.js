(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  function norm(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  }

  ready(function () {
    var toggle = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');

    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var willOpen = panel.hasAttribute('hidden');
        panel.toggleAttribute('hidden', !willOpen);
        toggle.setAttribute('aria-expanded', String(willOpen));
      });
    }

    var backTop = document.querySelector('.back-top');
    if (backTop) {
      window.addEventListener('scroll', function () {
        backTop.classList.toggle('visible', window.scrollY > 520);
      }, { passive: true });
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    initHero();
    initRails();
    initFilters();
    initPlayers();
  });

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot) {
        dot.classList.toggle('active', Number(dot.getAttribute('data-hero-dot')) === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')));
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initRails() {
    document.querySelectorAll('[data-scroll-target]').forEach(function (button) {
      button.addEventListener('click', function () {
        var target = document.getElementById(button.getAttribute('data-scroll-target'));
        if (!target) {
          return;
        }
        var dir = button.getAttribute('data-scroll-dir') === 'left' ? -1 : 1;
        target.scrollBy({ left: dir * Math.max(260, target.clientWidth * 0.75), behavior: 'smooth' });
      });
    });
  }

  function initFilters() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-card-filter]'));
    if (!inputs.length) {
      return;
    }

    inputs.forEach(function (input) {
      var list = input.closest('section') ? input.closest('section').querySelector('[data-card-list]') : document.querySelector('[data-card-list]');
      if (!list) {
        return;
      }
      var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));

      function run() {
        var q = norm(input.value);
        cards.forEach(function (card) {
          var hay = norm([
            card.getAttribute('data-title'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region'),
            card.textContent
          ].join(' '));
          card.classList.toggle('is-hidden', q && hay.indexOf(q) === -1);
        });
      }

      input.addEventListener('input', run);

      var params = new URLSearchParams(window.location.search);
      var q = params.get('q');
      if (q && input.id === 'searchInput') {
        input.value = q;
        run();
      }
    });

    document.querySelectorAll('[data-clear-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        var input = document.querySelector('[data-card-filter]');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input'));
          input.focus();
        }
      });
    });
  }

  function initPlayers() {
    document.querySelectorAll('.player-shell').forEach(function (shell) {
      var video = shell.querySelector('video');
      var button = shell.querySelector('.player-mask');
      var message = shell.querySelector('.player-message');
      var hls = null;
      var loaded = false;

      if (!video || !button) {
        return;
      }

      function fail() {
        if (message) {
          message.hidden = false;
        }
        button.hidden = false;
      }

      function play() {
        var url = video.getAttribute('data-stream');
        if (!url) {
          fail();
          return;
        }

        if (message) {
          message.hidden = true;
        }
        button.hidden = true;

        if (!loaded) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            loaded = true;
          } else if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                fail();
              }
            });
            loaded = true;
          } else {
            video.src = url;
            loaded = true;
          }
        }

        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            button.hidden = false;
          });
        }
      }

      button.addEventListener('click', play);
      video.addEventListener('play', function () {
        button.hidden = true;
      });
      video.addEventListener('error', fail);
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }
})();
