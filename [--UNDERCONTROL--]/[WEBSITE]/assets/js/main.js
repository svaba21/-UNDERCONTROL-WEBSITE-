/* ============================================================================
   UNDERCONTROL RP — Animacijski motor
   Brez zunanjih knjiznic. Deluje tudi ce stran odpres neposredno z diska.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.UC || {};
  var UI  = CFG.ui || {};
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TOUCH   = window.matchMedia("(hover: none)").matches;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };

  /* ====================================================== 1. PRELOADER */
  function preloader() {
    var el = $(".preload");
    if (!el) return;
    if (UI.preloader === false) { el.remove(); document.body.classList.remove("is-locked"); return; }

    var bar = $(".preload-bar i", el);
    var pct = 0;
    var tick = setInterval(function () {
      pct = Math.min(96, pct + Math.random() * 16);
      if (bar) bar.style.width = pct + "%";
    }, 130);

    function finish() {
      clearInterval(tick);
      if (bar) bar.style.width = "100%";
      setTimeout(function () {
        el.classList.add("is-done");
        document.body.classList.remove("is-locked");
        document.documentElement.classList.add("is-ready");
        setTimeout(function () { el.remove(); }, 900);
      }, 380);
    }

    if (document.readyState === "complete") setTimeout(finish, 420);
    else window.addEventListener("load", function () { setTimeout(finish, 420); });
    // Varovalka, ce se kaksna slika ne nalozi
    setTimeout(finish, 6000);
  }

  /* ============================================ 2. TEKOCE DRSENJE (inercija) */
  /* Namesto premikanja vsebine s transformom animiramo pravi scroll polozaj —
     tako ostanejo position:sticky in position:fixed elementi popolnoma pravilni. */
  function smoothScroll() {
    if (REDUCED || TOUCH || UI.smoothScroll === false) return;

    var target  = window.scrollY;
    var current = window.scrollY;
    var running = false;
    var ease    = UI.smoothStrength || 0.11;

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function frame() {
      current = lerp(current, target, ease);
      if (Math.abs(target - current) < 0.4) { current = target; running = false; }
      window.scrollTo(0, current);
      if (running) requestAnimationFrame(frame);
    }
    function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;                       // priblizevanje pustimo pri miru
      // Cilj je lahko tudi Window ali Document — tam metode closest ni
      var t = e.target;
      if (t && t.closest && t.closest("[data-native-scroll]")) return;
      e.preventDefault();
      target = clamp(target + e.deltaY, 0, maxScroll());
      start();
    }, { passive: false });

    // Ce scroll spremeni kaj drugega (tipkovnica, sidro, JS), se sinhroniziramo
    window.addEventListener("scroll", function () {
      if (!running) { target = window.scrollY; current = window.scrollY; }
    }, { passive: true });

    document.documentElement.classList.add("has-smooth");

    // Sidra premaknemo z lastno animacijo
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id === "#") return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var top = t.getBoundingClientRect().top + window.scrollY - 96;
        target = clamp(top, 0, maxScroll());
        start();
        history.replaceState(null, "", id);
      });
    });
  }

  /* ============================================================ 3. GLAVA */
  function header() {
    var head = $(".header");
    if (!head) return;
    var last = 0;

    function onScroll() {
      var y = window.scrollY;
      head.classList.toggle("is-stuck", y > 40);
      // Skrijemo ob drsenju navzdol, prikazemo ob drsenju navzgor
      if (y > 460 && y > last + 6) head.classList.add("is-hidden");
      else if (y < last - 6 || y < 200) head.classList.remove("is-hidden");
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobilna navigacija
    var burger = $(".burger");
    var mob = $(".mobile-nav");
    if (burger && mob) {
      $$("a", mob).forEach(function (a, i) { a.style.setProperty("--i", i); });
      burger.addEventListener("click", function () {
        var open = mob.classList.toggle("is-open");
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("is-locked", open);
      });
      $$("a", mob).forEach(function (a) {
        a.addEventListener("click", function () {
          mob.classList.remove("is-open");
          burger.classList.remove("is-open");
          document.body.classList.remove("is-locked");
        });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && mob.classList.contains("is-open")) burger.click();
      });
    }

    // Oznacimo trenutno stran
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$(".nav-links a, .mobile-nav a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      if (href === page || (page === "" && href === "index.html")) a.classList.add("is-active");
    });
  }

  /* ================================================== 4. VRSTICA NAPREDKA */
  function progressBar() {
    var bar = $(".progress");
    if (!bar) return;
    function upd() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  /* ================================================ 5. RAZKRIVANJE OB SCROLLU */
  function reveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (REDUCED) { items.forEach(function (n) { n.classList.add("is-in"); }); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (n) {
      var d = n.getAttribute("data-delay");
      if (d) n.style.setProperty("--d", d + "ms");
      io.observe(n);
    });
  }

  /* ==================================== 6. RAZBITJE NASLOVA NA ZNAKE (3D) */
  function splitText() {
    $$("[data-split]").forEach(function (node) {
      if (REDUCED) return;
      // Vsako besedo zavijemo v svoj inline-block, da se beseda nikoli ne prelomi
      // sredi crk — crke znotraj nje pa animiramo posamicno.
      var walk = function (el) {
        Array.prototype.slice.call(el.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            if (!n.textContent.trim()) return;
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
              var word = document.createElement("span");
              word.className = "split-word";
              part.split("").forEach(function (ch) {
                var s = document.createElement("span");
                s.className = "split-char";
                s.textContent = ch;
                word.appendChild(s);
              });
              frag.appendChild(word);
            });
            el.replaceChild(frag, n);
          } else if (n.nodeType === 1) {
            walk(n);
          }
        });
      };
      walk(node);
      $$(".split-char", node).forEach(function (s, i) { s.style.setProperty("--i", i); });
    });
  }

  /* ============================ 7. BESEDILO, KI SE OSVETLI OB DRSENJU */
  function scrollText() {
    var blocks = $$(".scroll-tx");
    if (!blocks.length) return;

    blocks.forEach(function (b) {
      if (b.dataset.built) return;
      b.dataset.built = "1";
      var html = b.innerHTML;
      // Ohranimo oznako <em> kot poudarjeno besedo
      var tmp = document.createElement("div");
      tmp.innerHTML = html;
      var out = document.createDocumentFragment();
      Array.prototype.slice.call(tmp.childNodes).forEach(function (n) {
        var hl = n.nodeType === 1 && n.tagName === "EM";
        var text = n.textContent;
        text.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(" ")); return; }
          var s = document.createElement("span");
          s.className = "w" + (hl ? " hl" : "");
          s.textContent = part;
          out.appendChild(s);
        });
      });
      b.innerHTML = "";
      b.appendChild(out);
    });

    function upd() {
      blocks.forEach(function (b) {
        var words = $$(".w", b);
        var r = b.getBoundingClientRect();
        var vh = window.innerHeight;
        // 0 -> blok pride v spodnjo tretjino, 1 -> blok zapusti zgornjo tretjino
        var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.34), 0, 1);
        var upto = Math.round(p * words.length * 1.18);
        words.forEach(function (w, i) { w.classList.toggle("on", i < upto); });
      });
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  /* ======================================================== 8. PARALLAX */
  function parallax() {
    var nodes = $$("[data-parallax]");
    var bgImg = $(".bg-img");
    if (!nodes.length && !bgImg) return;
    if (REDUCED) return;

    var ticking = false;
    function upd() {
      var y = window.scrollY;
      nodes.forEach(function (n) {
        var sp = parseFloat(n.getAttribute("data-parallax")) || 0.15;
        var r = n.getBoundingClientRect();
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        n.style.transform = "translate3d(0," + (-mid * sp).toFixed(2) + "px,0)";
      });
      if (bgImg) bgImg.style.transform = "scale(1.08) translate3d(0," + (y * 0.13).toFixed(2) + "px,0)";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(upd); }
    }, { passive: true });
    upd();
  }

  /* ============================================ 9. 3D SCENA HEROJA (miska) */
  function heroScene() {
    var hero = $(".hero");
    if (!hero || REDUCED || TOUCH) return;
    var layers = $$("[data-depth]", hero);
    if (!layers.length) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function frame() {
      cx = lerp(cx, tx, 0.075);
      cy = lerp(cy, ty, 0.075);
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 0.2;
        l.style.transform =
          "translate3d(" + (cx * 46 * d).toFixed(2) + "px," + (cy * 34 * d).toFixed(2) + "px,0)" +
          " rotateY(" + (cx * 5 * d).toFixed(2) + "deg)" +
          " rotateX(" + (-cy * 5 * d).toFixed(2) + "deg)";
      });
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) raf = requestAnimationFrame(frame);
      else raf = null;
    }
    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(frame);
    });
  }

  /* ================================================= 10. 3D NAGIB KARTIC */
  function tilt() {
    if (REDUCED || TOUCH) return;
    $$("[data-tilt]").forEach(function (card) {
      var max = parseFloat(card.getAttribute("data-tilt")) || 7;
      var raf = null, tX = 0, tY = 0, cX = 0, cY = 0, active = false;

      function frame() {
        cX = lerp(cX, tX, 0.14);
        cY = lerp(cY, tY, 0.14);
        card.style.transform =
          "perspective(1100px) rotateX(" + cY.toFixed(2) + "deg) rotateY(" + cX.toFixed(2) + "deg)" +
          (active ? " translateY(-5px)" : "");
        if (Math.abs(cX - tX) > 0.02 || Math.abs(cY - tY) > 0.02) raf = requestAnimationFrame(frame);
        else raf = null;
      }
      function kick() { if (!raf) raf = requestAnimationFrame(frame); }

      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        tX = (px - 0.5) * max * 2;
        tY = -(py - 0.5) * max * 2;
        active = true;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        kick();
      });
      card.addEventListener("mouseleave", function () {
        tX = 0; tY = 0; active = false; kick();
      });
    });
  }

  /* ================================== 11. STEKLENI ODSEV, KI SLEDI KAZALCU */
  function specular() {
    if (TOUCH) return;
    $$(".glass, .feat, .pack, .member").forEach(function (el) {
      if (el.hasAttribute("data-tilt")) return;   // te ze pokriva tilt()
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
      });
    });
  }

  /* ==================================================== 12. MAGNETNI GUMBI */
  function magnetic() {
    if (REDUCED || TOUCH) return;
    $$(".magnetic").forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnet")) || 0.28;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * strength).toFixed(1) + "px");
        el.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * strength).toFixed(1) + "px");
      });
      el.addEventListener("mouseleave", function () {
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
      });
    });
  }

  /* ========================================================= 13. STEVCI */
  function counters() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;

    function fmt(n, dec) {
      return n.toLocaleString("sl-SI", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var to  = parseFloat(el.getAttribute("data-count")) || 0;
        var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var pre = el.getAttribute("data-prefix") || "";
        var suf = el.getAttribute("data-suffix") || "";
        if (REDUCED) { el.textContent = pre + fmt(to, dec) + suf; return; }
        var dur = 1900, t0 = performance.now();
        (function step(t) {
          var p = clamp((t - t0) / dur, 0, 1);
          var e = 1 - Math.pow(1 - p, 4);
          el.textContent = pre + fmt(to * e, dec) + suf;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ============================================================ 14. FAQ */
  function faq() {
    $$(".faq-item").forEach(function (item) {
      var q = $(".faq-q", item);
      if (!q) return;
      q.setAttribute("aria-expanded", "false");
      q.addEventListener("click", function () {
        var open = item.classList.toggle("is-open");
        q.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ========================================================= 15. OBVESTILA */
  function toast(msg, kind) {
    var host = $(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    var t = document.createElement("div");
    t.className = "toast" + (kind ? " is-" + kind : "");
    t.textContent = msg;
    host.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-in"); });
    setTimeout(function () {
      t.classList.remove("is-in");
      setTimeout(function () { t.remove(); }, 500);
    }, 3200);
  }
  window.ucToast = toast;

  /* ================================================== 16. KOPIRANJE (IP …) */
  function copyables() {
    $$("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.getAttribute("data-copy");
        var done = function () { toast("Kopirano: " + val, "ok"); };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(val).then(done, function () { fallback(val, done); });
        } else fallback(val, done);
      });
    });
    function fallback(val, done) {
      var ta = document.createElement("textarea");
      ta.value = val;
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); }
      catch (e) { toast("Kopiranje ni uspelo — oznaci rocno.", "bad"); }
      ta.remove();
    }
  }

  /* ============================================== 17. OZADJE NA PLATNU (2D) */
  function bgCanvas() {
    var cv = $("#bg-canvas");
    if (!cv || REDUCED || UI.bgParticles === false) { if (cv) cv.remove(); return; }
    var ctx = cv.getContext("2d");
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var dots = [], beams = [], raf = null;

    function resize() {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function build() {
      var count = Math.round(clamp((w * h) / 22000, 26, 90));
      dots = [];
      for (var i = 0; i < count; i++) {
        var z = Math.random();                      // globina 0..1
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: z,
          r: 0.5 + z * 1.7,
          vx: (Math.random() - 0.5) * (0.06 + z * 0.16),
          vy: -(0.05 + z * 0.2),
          a: 0.06 + z * 0.34,
          ph: Math.random() * Math.PI * 2
        });
      }
      beams = [];
      for (var j = 0; j < 3; j++) {
        beams.push({
          y: Math.random() * h,
          x: -Math.random() * w,
          len: w * (0.3 + Math.random() * 0.4),
          v: 0.9 + Math.random() * 1.5,
          a: 0.05 + Math.random() * 0.09
        });
      }
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);

      // Vodoravni svetlobni pramen — odmev grafike v logotipu
      beams.forEach(function (b) {
        b.x += b.v;
        if (b.x - b.len > w) { b.x = -b.len; b.y = Math.random() * h; }
        var g = ctx.createLinearGradient(b.x - b.len, 0, b.x, 0);
        g.addColorStop(0, "rgba(127,212,255,0)");
        g.addColorStop(0.55, "rgba(160,222,255," + b.a + ")");
        g.addColorStop(1, "rgba(127,212,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(b.x - b.len, b.y, b.len, 1);
      });

      // Lebdeci prasni delci z globinsko perspektivo
      dots.forEach(function (d) {
        d.x += d.vx; d.y += d.vy;
        if (d.y < -12) { d.y = h + 12; d.x = Math.random() * w; }
        if (d.x < -12) d.x = w + 12;
        if (d.x > w + 12) d.x = -12;
        var tw = 0.65 + 0.35 * Math.sin(t * 0.0013 + d.ph);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168,214,250," + (d.a * tw).toFixed(3) + ")";
        ctx.fill();
        if (d.z > 0.72) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(127,212,255," + (d.a * tw * 0.09).toFixed(3) + ")";
          ctx.fill();
        }
      });
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) raf = requestAnimationFrame(frame);
    });
    resize();
    raf = requestAnimationFrame(frame);
  }

  /* ============================================ 18. VSTAVLJANJE KONFIG. */
  function applyConfig() {
    var srv = CFG.server || {}, lk = CFG.links || {}, wl = CFG.whitelist || {};

    $$("[data-uc]").forEach(function (el) {
      var key = el.getAttribute("data-uc");
      var map = {
        "server.name":        srv.name,
        "server.suffix":      srv.suffix,
        "server.tagline":     srv.tagline,
        "server.connect":     srv.connect,
        "server.slots":       srv.slots,
        "server.founded":     srv.founded,
        "whitelist.reviewTime": wl.reviewTime,
        "whitelist.minAge":     wl.minAge,
        "year":               new Date().getFullYear()
      };
      if (map[key] !== undefined && map[key] !== null) el.textContent = map[key];
    });

    $$("[data-uc-href]").forEach(function (el) {
      var key = el.getAttribute("data-uc-href");
      if (lk[key]) {
        el.setAttribute("href", lk[key]);
        if (/^https?:/i.test(lk[key])) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
      }
    });

    if (srv.connect) {
      $$("[data-connect]").forEach(function (el) {
        el.textContent = srv.connect;
        var btn = el.parentElement && el.parentElement.querySelector("[data-copy]");
        if (btn) btn.setAttribute("data-copy", srv.connect);
      });
    }
  }

  /* =========================================================== ZAGON */
  function init() {
    applyConfig();
    preloader();
    header();
    progressBar();
    splitText();
    reveal();
    scrollText();
    parallax();
    heroScene();
    tilt();
    specular();
    magnetic();
    counters();
    faq();
    copyables();
    bgCanvas();
    smoothScroll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
