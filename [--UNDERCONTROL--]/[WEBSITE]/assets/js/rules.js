/* ============================================================================
   UNDERCONTROL RP — Stran s pravili: iskanje in sledenje odseku
   ========================================================================== */
(function () {
  "use strict";

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var input   = $("#rules-q");
  var body    = $("#rules-body");
  var empty   = $("#rules-empty");
  var cats    = $$(".rule-cat", body);
  var rules   = $$(".rule", body);
  var navLinks= $$(".rules-nav a");
  if (!body) return;

  /* Slovenske sicumnike poenotimo, da iskanje deluje tudi brez strehic */
  function norm(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[čć]/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "d")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Iskalni indeks pripravimo enkrat
  rules.forEach(function (r) { r.dataset.idx = norm(r.textContent); });

  /* ------------------------------------------------------------- ISKANJE */
  function search(q) {
    var needle = norm(q);
    if (!needle) {
      rules.forEach(function (r) { r.classList.remove("hide"); });
      cats.forEach(function (c) { c.classList.remove("hide"); });
      if (empty) empty.classList.add("hide");
      return;
    }
    var hits = 0;
    cats.forEach(function (cat) {
      var visible = 0;
      $$(".rule", cat).forEach(function (r) {
        var match = r.dataset.idx.indexOf(needle) !== -1;
        r.classList.toggle("hide", !match);
        if (match) { visible++; hits++; }
      });
      cat.classList.toggle("hide", visible === 0);
    });
    if (empty) empty.classList.toggle("hide", hits > 0);
  }

  if (input) {
    var t = null;
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { search(input.value); }, 130);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { input.value = ""; search(""); input.blur(); }
    });
  }

  /* -------------------------------------------- SLEDENJE AKTIVNI KATEGORIJI */
  if (!cats.length || !navLinks.length) return;

  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }

  var spy = new IntersectionObserver(function (entries) {
    // Izberemo najvisji viden odsek
    var best = null;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      if (!best || en.boundingClientRect.top < best.boundingClientRect.top) best = en;
    });
    if (best) setActive(best.target.id);
  }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });

  cats.forEach(function (c) { spy.observe(c); });
  setActive(cats[0].id);
})();
