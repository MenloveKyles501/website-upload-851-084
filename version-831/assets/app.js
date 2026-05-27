(function () {
  "use strict";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initMobileMenu() {
    var button = $("[data-mobile-menu-button]");
    var panel = $("[data-mobile-menu]");

    if (!button || !panel) {
      return;
    }

    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      button.textContent = panel.classList.contains("is-open") ? "×" : "☰";
    });
  }

  function initHeroCarousel() {
    var hero = $("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = $all("[data-hero-slide]", hero);
    var dots = $all("[data-hero-dot]", hero);
    var prev = $("[data-hero-prev]", hero);
    var next = $("[data-hero-next]", hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initImageFallbacks() {
    $all("img[data-fallback]").forEach(function (img) {
      img.addEventListener("error", function () {
        var frame = img.closest(".poster-frame");
        if (frame) {
          frame.classList.add("is-missing");
        }
      });
    });
  }

  function itemMatches(item, keyword, year, type) {
    var haystack = normalize([
      item.getAttribute("data-title"),
      item.getAttribute("data-region"),
      item.getAttribute("data-year"),
      item.getAttribute("data-type"),
      item.getAttribute("data-genre"),
      item.getAttribute("data-category")
    ].join(" "));

    var itemYear = item.getAttribute("data-year") || "";
    var itemType = item.getAttribute("data-type") || "";
    var yearMatches = true;

    if (year === "classic") {
      yearMatches = Number(itemYear) > 0 && Number(itemYear) < 2010;
    } else if (year) {
      yearMatches = itemYear === year;
    }

    var typeMatches = !type || itemType === type;
    var keywordMatches = !keyword || haystack.indexOf(keyword) !== -1;

    return keywordMatches && yearMatches && typeMatches;
  }

  function initPageFilter() {
    var form = $(".js-page-filter");

    if (!form) {
      return;
    }

    var countNode = $("[data-filter-count]");

    function applyFilter() {
      var keyword = normalize(form.elements.keyword && form.elements.keyword.value);
      var year = form.elements.year ? form.elements.year.value : "";
      var type = form.elements.type ? form.elements.type.value : "";
      var items = $all("[data-filter-grid] .movie-card, [data-filter-grid] .ranking-row");
      var visible = 0;

      items.forEach(function (item) {
        var matches = itemMatches(item, keyword, year, type);
        item.classList.toggle("is-hidden", !matches);
        if (matches) {
          visible += 1;
        }
      });

      if (countNode) {
        countNode.textContent = "当前显示 " + visible + " 条结果";
      }
    }

    form.addEventListener("input", applyFilter);
    form.addEventListener("change", applyFilter);
    form.addEventListener("reset", function () {
      window.setTimeout(applyFilter, 0);
    });

    applyFilter();
  }

  function createSearchCard(item) {
    return [
      '<article class="movie-card">',
      '  <a href="' + escapeHtml(item.url) + '" class="movie-card__link" aria-label="观看 ' + escapeHtml(item.title) + '">',
      '    <div class="poster-frame">',
      '      <img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" data-fallback="' + escapeHtml(item.title) + '">',
      '      <span class="poster-fallback-text">' + escapeHtml(item.title) + '</span>',
      '      <span class="play-float" aria-hidden="true">▶</span>',
      '    </div>',
      '    <div class="movie-card__body">',
      '      <div class="movie-card__meta">',
      '        <span>' + escapeHtml(item.region) + '</span>',
      '        <span>' + escapeHtml(item.year) + '</span>',
      '      </div>',
      '      <h3>' + escapeHtml(item.title) + '</h3>',
      '      <p>' + escapeHtml(item.oneLine) + '</p>',
      '      <div class="movie-card__tags">',
      '        <span>' + escapeHtml(item.type) + '</span>',
      '        <span>' + escapeHtml(item.genre) + '</span>',
      '      </div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join("");
  }

  function initSearchPage() {
    var page = $("[data-search-page]");

    if (!page || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var input = $(".search-large input", page);
    var results = $("#search-results", page);
    var count = $("[data-search-count]", page);

    if (input) {
      input.value = query;
    }

    var normalizedQuery = normalize(query);
    var matched = window.MOVIE_SEARCH_INDEX.filter(function (item) {
      if (!normalizedQuery) {
        return true;
      }

      var haystack = normalize([
        item.title,
        item.region,
        item.year,
        item.type,
        item.genre,
        item.tags,
        item.oneLine
      ].join(" "));

      return haystack.indexOf(normalizedQuery) !== -1;
    }).slice(0, 240);

    if (count) {
      if (normalizedQuery) {
        count.textContent = "关键词“" + query + "”找到 " + matched.length + " 条结果（最多显示 240 条）";
      } else {
        count.textContent = "默认展示全部片库中的前 " + matched.length + " 条影片";
      }
    }

    if (results) {
      results.innerHTML = matched.map(createSearchCard).join("");
      initImageFallbacks();
    }
  }

  function initPlayers() {
    $all("[data-player-shell]").forEach(function (shell) {
      var video = $(".js-hls-player", shell);
      var button = $("[data-play-button]", shell);
      var message = $("[data-player-message]", shell);

      if (!video || !button) {
        return;
      }

      function setMessage(text) {
        if (message) {
          message.textContent = text || "";
        }
      }

      function startPlayback() {
        var source = video.getAttribute("data-src");

        if (!source) {
          setMessage("当前影片未配置播放源。");
          return;
        }

        shell.classList.add("is-playing");
        video.setAttribute("controls", "controls");

        if (window.Hls && window.Hls.isSupported()) {
          if (!video._hlsInstance) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90
            });

            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                setMessage("播放源加载失败，请稍后重试或更换浏览器。");
              }
            });
            video._hlsInstance = hls;
          }
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          if (!video.src) {
            video.src = source;
          }
        } else {
          setMessage("当前浏览器需要 HLS 支持才能播放 m3u8 视频。");
          return;
        }

        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {
            setMessage("浏览器阻止了自动播放，请再次点击播放按钮。");
          });
        }
      }

      button.addEventListener("click", startPlayback);
      video.addEventListener("click", function () {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
    });
  }

  function initBackTop() {
    var button = $("[data-back-top]");

    if (!button) {
      return;
    }

    window.addEventListener("scroll", function () {
      button.classList.toggle("is-visible", window.scrollY > 600);
    }, { passive: true });

    button.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initHeroCarousel();
    initImageFallbacks();
    initPageFilter();
    initSearchPage();
    initPlayers();
    initBackTop();
  });
})();
