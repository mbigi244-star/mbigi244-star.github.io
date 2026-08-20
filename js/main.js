(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Pasek postępu lektury
  var progress = document.createElement("div");
  progress.className = "progress";
  document.body.appendChild(progress);

  // Stan nagłówka + postęp + parallax hero
  var header = document.getElementById("header");
  var heroImg = window.matchMedia("(min-width: 48rem)").matches
    ? document.querySelector(".hero__figure")
    : null;
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 24);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      if (heroImg && !reduceMotion && y < window.innerHeight) {
        heroImg.style.translate = "0 " + y * 0.1 + "px";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Nawigacja mobilna
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    var closeNav = function (returnFocus) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeNav(false);
    });
    // Escape zamyka menu, Tab zostaje w jego obrębie (pułapka fokusa)
    document.addEventListener("keydown", function (e) {
      var overlayActive = nav.classList.contains("open") &&
        getComputedStyle(toggle).display !== "none";
      if (!overlayActive) return;
      if (e.key === "Escape") {
        closeNav(true);
        return;
      }
      if (e.key === "Tab") {
        var items = [toggle].concat([].slice.call(nav.querySelectorAll("a")));
        var first = items[0];
        var last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (items.indexOf(document.activeElement) === -1) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // Bez migotania nav przy zmianie rozmiaru okna (przejście przez breakpoint)
  var desktopMq = window.matchMedia("(min-width: 48rem)");
  var closeIfDesktop = function () {
    if (nav && toggle && nav.classList.contains("open") && desktopMq.matches) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  };
  var resizeTimer;
  window.addEventListener("resize", function () {
    document.documentElement.classList.add("resizing");
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.documentElement.classList.remove("resizing");
    }, 180);
    closeIfDesktop();
  });
  if (desktopMq.addEventListener) desktopMq.addEventListener("change", closeIfDesktop);

  // Fokus z klawiatury natychmiast odsłania ukryte elementy scroll-reveal
  document.addEventListener("focusin", function (e) {
    var el = e.target.closest ? e.target.closest(".reveal") : null;
    if (el) el.classList.add("visible");
  });

  // Scroll reveal
  var revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("visible"); });
  }

  // Split-letter stagger w hero
  if (!reduceMotion && !document.documentElement.classList.contains("shot")) {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var text = el.textContent;
      el.textContent = "";
      text.split("").forEach(function (ch, i) {
        var s = document.createElement("span");
        s.textContent = ch;
        s.style.setProperty("--i", i);
        el.appendChild(s);
      });
      el.classList.add("split-ready");
    });
  }

  // Żywy portret: wideo w hero (desktop i mobile, lżejszy plik na małych ekranach)
  var heroVideo = document.querySelector(".hero__video");
  if (heroVideo && !reduceMotion) {
    var isSmall = window.matchMedia("(max-width: 48rem)").matches;
    var mobileSrc = heroVideo.getAttribute("data-src-mobile");
    heroVideo.src = (isSmall && mobileSrc) ? mobileSrc : heroVideo.getAttribute("data-src");
    heroVideo.addEventListener("playing", function () {
      heroVideo.classList.add("playing");
    });
    var tryPlay = function () {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    };
    tryPlay();
    // iOS/Android bywają wybredne: ponów przy pierwszym dotknięciu i po powrocie do karty
    ["pointerdown", "touchstart"].forEach(function (evt) {
      document.addEventListener(evt, function retry() {
        if (heroVideo.paused) tryPlay();
        document.removeEventListener(evt, retry);
      }, { once: true, passive: true });
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && heroVideo.paused && heroVideo.currentTime === 0) tryPlay();
    });
  }

  // Złoty kursor + przyciski magnetyczne (desktop, bez reduced motion)
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);

    var mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
    });
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      var half = ring.offsetWidth / 2;
      ring.style.transform = "translate(" + (rx - half) + "px," + (ry - half) + "px)";
      requestAnimationFrame(follow);
    })();

    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button")) ring.classList.add("active");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button")) ring.classList.remove("active");
    });

    // Magnetyzm przycisków
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + dx * 0.18 + "px," + dy * 0.3 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }
})();
