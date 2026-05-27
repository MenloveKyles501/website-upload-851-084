(function () {
  const toggle = document.querySelector(".menu-toggle");
  const panel = document.querySelector(".mobile-panel");

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      const open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dots = Array.from(document.querySelectorAll(".hero-dot"));
  const prev = document.querySelector(".hero-arrow.prev");
  const next = document.querySelector(".hero-arrow.next");
  let current = 0;
  let timer = null;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, idx) {
      slide.classList.toggle("active", idx === current);
    });
    dots.forEach(function (dot, idx) {
      dot.classList.toggle("active", idx === current);
    });
  }

  function startTimer() {
    if (timer || !slides.length) {
      return;
    }
    timer = window.setInterval(function () {
      showSlide(current + 1);
    }, 5000);
  }

  function restartTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    startTimer();
  }

  if (prev) {
    prev.addEventListener("click", function () {
      showSlide(current - 1);
      restartTimer();
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      showSlide(current + 1);
      restartTimer();
    });
  }

  dots.forEach(function (dot, idx) {
    dot.addEventListener("click", function () {
      showSlide(idx);
      restartTimer();
    });
  });

  startTimer();

  const searchInputs = Array.from(document.querySelectorAll(".js-search-input"));
  const filterButtons = Array.from(document.querySelectorAll(".filter-button"));
  const scopes = Array.from(document.querySelectorAll(".filter-scope"));
  const empty = document.querySelector(".empty-state");
  let activeKey = "all";
  let activeValue = "all";

  function getQuery() {
    const input = searchInputs[0];
    return input ? input.value.trim().toLowerCase() : "";
  }

  function applyFilter() {
    const query = getQuery();
    let visible = 0;
    scopes.forEach(function (scope) {
      const cards = Array.from(scope.querySelectorAll(".movie-card"));
      cards.forEach(function (card) {
        const text = (card.getAttribute("data-search") || "").toLowerCase();
        const matchesText = !query || text.indexOf(query) !== -1;
        let matchesButton = true;
        if (activeKey === "category") {
          matchesButton = card.getAttribute("data-category") === activeValue;
        }
        if (activeKey === "type") {
          matchesButton = (card.getAttribute("data-type") || "").indexOf(activeValue) !== -1;
        }
        const show = matchesText && matchesButton;
        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
        }
      });
    });
    if (empty) {
      empty.classList.toggle("show", scopes.length > 0 && visible === 0);
    }
  }

  searchInputs.forEach(function (input) {
    input.addEventListener("input", applyFilter);
  });

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterButtons.forEach(function (item) {
        item.classList.remove("active");
      });
      button.classList.add("active");
      activeKey = button.getAttribute("data-filter-key") || "all";
      activeValue = button.getAttribute("data-filter-value") || "all";
      if (activeKey === "all") {
        activeValue = "all";
      }
      applyFilter();
    });
  });

  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q && searchInputs.length) {
    searchInputs.forEach(function (input) {
      input.value = q;
    });
    applyFilter();
  }
}());
