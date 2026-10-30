// chompbook.online — small enhancements; every page works without this file.
(function () {
  var LANGS = ["en", "ru", "uk", "be", "es", "de", "fr", "zh", "hi"];
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // Language: remember an explicit choice; on the English home page, follow the saved choice or the browser language once.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-lang]");
    if (a) store("lang", a.getAttribute("data-lang"));
  });
  if (document.body.classList.contains("root") && location.pathname === "/" && !/[?&]stay/.test(location.search)) {
    var saved = store("lang");
    var want = saved;
    if (!want) {
      var list = navigator.languages || [navigator.language || "en"];
      for (var i = 0; i < list.length && !want; i++) {
        var c = String(list[i]).slice(0, 2).toLowerCase();
        if (LANGS.indexOf(c) >= 0) want = c;
      }
    }
    if (want && want !== "en" && LANGS.indexOf(want) >= 0) { location.replace("/" + want + "/" + location.hash); return; }
  }

  // Close the language menu on outside click / Escape.
  var pick = document.querySelector(".lang-pick");
  if (pick) {
    document.addEventListener("click", function (e) { if (pick.open && !pick.contains(e.target)) pick.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pick.open) { pick.open = false; pick.querySelector("summary").focus(); } });
  }

  // Header border once scrolled.
  var top = document.querySelector(".top");
  function onScroll() { if (top) top.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Reveal on scroll.
  var els = document.querySelectorAll(".reveal, .step");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("in"); });
  }

  // Hero phone: cycle through screenshots. The next image fades in on top of the current one,
  // which stays fully visible underneath until the fade ends — no dark dip, no jump when the cycle restarts.
  var rot = document.querySelector("[data-rotate]");
  if (rot && !reduce) {
    var imgs = rot.querySelectorAll("img"), k = 0, z = 1;
    imgs[0].style.zIndex = z;
    setInterval(function () {
      if (document.hidden) return;
      var prev = imgs[k]; k = (k + 1) % imgs.length; var next = imgs[k];
      next.style.zIndex = ++z; next.classList.add("on");
      setTimeout(function () { prev.style.transition = "none"; prev.classList.remove("on"); void prev.offsetWidth; prev.style.transition = ""; }, 1000);
    }, 3600);
  }

  // AI answer check demo: type the answer, "check" it, show the score and the feedback.
  var demo = document.querySelector("[data-demo]");
  if (demo && !reduce && "IntersectionObserver" in window) {
    var typed = demo.querySelector(".typed"), full = typed.getAttribute("data-text"), num = demo.querySelector("[data-score]");
    var timers = [];
    var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
    var set = function (cls) { demo.className = "demo reveal in js " + cls; };
    var play = function () {
      timers.forEach(clearTimeout); timers = [];
      set("s-typing"); typed.textContent = ""; num.textContent = "0";
      var chars = Array.from(full), step = Math.max(14, Math.min(32, 2600 / chars.length)), i = 0;
      (function tick() { typed.textContent = chars.slice(0, ++i).join(""); if (i < chars.length) at(step, tick); else at(450, check); })();
    };
    var check = function () {
      set("s-checking");
      at(1300, function () {
        set("s-scored");
        var n = 0, target = Number(num.getAttribute("data-score"));
        (function count() { num.textContent = String(++n); if (n < target) at(110, count); })();
        at(900, function () { set("s-scored s-good"); });
        at(1500, function () { set("s-scored s-good s-warn"); });
        at(2200, function () { set("s-scored s-good s-warn s-done"); });
      });
    };
    demo.classList.add("js"); demo.classList.add("s-typing"); typed.textContent = "";
    var dio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { dio.disconnect(); at(500, play); } }, { threshold: 0.45 });
    dio.observe(demo);
    demo.querySelector("[data-replay]").addEventListener("click", play);
  }

  // "Pick your minutes" chips.
  var mins = document.querySelector("[data-minutes]");
  if (mins && !reduce) {
    var m = mins.querySelectorAll("span"), j = 1;
    setInterval(function () { m[j].classList.remove("on"); j = (j + 1) % m.length; m[j].classList.add("on"); }, 1600);
  }

  // Floating crumbs behind the hero phone.
  var stage = document.querySelector(".stage");
  if (stage && !reduce) {
    for (var n = 0; n < 9; n++) {
      var c = document.createElement("i");
      c.className = "crumb";
      c.style.left = (8 + Math.random() * 84) + "%";
      c.style.bottom = (Math.random() * 30) + "%";
      c.style.animationDelay = (-Math.random() * 9) + "s";
      c.style.animationDuration = (7 + Math.random() * 6) + "s";
      var s = 6 + Math.random() * 9; c.style.width = c.style.height = s + "px";
      stage.appendChild(c);
    }
  }

  // Screenshot gallery arrows.
  var shots = document.querySelector("[data-shots]");
  document.querySelectorAll("[data-dir]").forEach(function (b) {
    b.addEventListener("click", function () {
      var w = shots.querySelector(".shot").getBoundingClientRect().width + 22;
      shots.scrollBy({ left: Number(b.getAttribute("data-dir")) * w * 2, behavior: reduce ? "auto" : "smooth" });
    });
  });

  // Documents: highlight the current section in the table of contents.
  var toc = document.querySelectorAll(".toc a");
  if (toc.length && "IntersectionObserver" in window) {
    var map = {};
    toc.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { toc.forEach(function (a) { a.classList.remove("on"); }); var a = map[en.target.id]; if (a) a.classList.add("on"); }
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    document.querySelectorAll(".doc h2[id]").forEach(function (h) { tio.observe(h); });
  }
})();
