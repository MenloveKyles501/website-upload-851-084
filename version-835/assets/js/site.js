(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function setupNavigation() {
    var button = document.querySelector("[data-menu-button]");
    var menu = document.querySelector("[data-mobile-nav]");

    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dots] button"));
    var current = 0;

    if (!slides.length) {
      return;
    }

    function show(index) {
      current = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
      });
    });

    show(0);

    if (slides.length > 1) {
      window.setInterval(function () {
        show((current + 1) % slides.length);
      }, 5200);
    }
  }

  function setupFilters() {
    var input = document.querySelector("[data-filter-input]");
    var category = document.querySelector("[data-filter-category]");
    var list = document.querySelector("[data-filter-list]");
    var empty = document.querySelector("[data-empty-state]");

    if (!list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll(".filter-card"));

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function apply() {
      var term = normalize(input ? input.value : "");
      var selectedCategory = normalize(category ? category.value : "");
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-search"));
        var cardCategory = normalize(card.getAttribute("data-category"));
        var matchTerm = !term || haystack.indexOf(term) !== -1;
        var matchCategory = !selectedCategory || cardCategory === selectedCategory;
        var isVisible = matchTerm && matchCategory;
        card.style.display = isVisible ? "" : "none";
        if (isVisible) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("show", visible === 0);
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }

    if (category) {
      category.addEventListener("change", apply);
    }

    apply();
  }

  ready(function () {
    setupNavigation();
    setupHero();
    setupFilters();
  });
})();
