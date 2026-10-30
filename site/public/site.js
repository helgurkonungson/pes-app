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

  // Hero phone: cycle through screenshots.
  var rot = document.querySelector("[data-rotate]");
  if (rot && !reduce) {
    var imgs = rot.querySelectorAll("img"), k = 0;
    setInterval(function () {
      if (document.hidden) return;
      imgs[k].classList.remove("on"); k = (k + 1) % imgs.length; imgs[k].classList.add("on");
    }, 3200);
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
