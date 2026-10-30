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
    var typed = demo.querySelector(".typed"), full = typed.textContent, num = demo.querySelector("[data-score]");
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
    var reset = function () { timers.forEach(clearTimeout); timers = []; set("s-typing"); typed.textContent = ""; num.textContent = "0"; };
    demo.classList.add("js"); reset();
    // plays every time the block comes into view; once it has left the screen completely it is reset,
    // so scrolling away and back shows the check again (a small scroll inside the block doesn't restart it)
    var shown = false;
    var dio = new IntersectionObserver(function (en) {
      var e = en[0];
      if (!shown && e.intersectionRatio >= 0.45) { shown = true; at(400, play); }
      else if (shown && !e.isIntersecting) { shown = false; reset(); }
    }, { threshold: [0, 0.45] });
    dio.observe(demo);
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

  // Screenshot gallery: drifts slowly from right to left in an endless loop; stops while the pointer is over it,
  // while it is touched or has keyboard focus, and when the tab is hidden. Swiping/scrolling by hand still works.
  var shots = document.querySelector("[data-shots]");
  if (shots && !reduce) {
    var originals = Array.prototype.slice.call(shots.children);
    originals.forEach(function (f) {
      var c = f.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.remove("reveal"); c.classList.add("in");
      c.querySelectorAll("img").forEach(function (im) { im.alt = ""; });
      shots.appendChild(c);
    });
    shots.classList.add("auto");
    var paused = false, last = 0, pos = shots.scrollLeft, speed = 32; // px per second
    var hold = function () { paused = true; };
    var go = function () { paused = false; pos = shots.scrollLeft; last = 0; };
    shots.addEventListener("mouseenter", hold); shots.addEventListener("mouseleave", go);
    shots.addEventListener("touchstart", hold, { passive: true }); shots.addEventListener("touchend", function () { setTimeout(go, 1500); });
    shots.addEventListener("focusin", hold); shots.addEventListener("focusout", go);
    var visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; last = 0; }).observe(shots);
    (function frame(ts) {
      if (!paused && visible && !document.hidden) {
        if (last) {
          // one loop = the distance from a screenshot to its copy, so the wrap is invisible
          var period = shots.children[originals.length].offsetLeft - shots.children[0].offsetLeft;
          pos += speed * (ts - last) / 1000;
          if (pos >= period) pos -= period;
          shots.scrollLeft = pos;
        }
        last = ts;
      } else last = 0;
      requestAnimationFrame(frame);
    })(0);
  }

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
