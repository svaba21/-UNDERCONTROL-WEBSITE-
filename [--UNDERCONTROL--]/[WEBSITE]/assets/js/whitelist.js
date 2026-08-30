/* ============================================================================
   UNDERCONTROL RP — WhiteList prijavnica
   Vec korakov, sprotno preverjanje, samodejno shranjevanje osnutka.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.UC || {};
  var WL  = CFG.whitelist || {};
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var toast = window.ucToast || function (m) { console.log(m); };

  var form = $("#wl-form");
  if (!form) return;

  var panels = $$(".wl-panel", form);
  var navs   = $$(".wl-step");
  var LAST   = panels.length;          // zadnji panel je zahvala
  var step   = 1;
  var DRAFT  = "uc_wl_draft";

  /* Berljive oznake polj za pregled in za izvoz vloge */
  var LABELS = {
    discord:            "Discord ime",
    starost:            "Starost",
    igralno_ime:        "Ime v igri",
    vir:                "Vir",
    ure_na_teden:       "Ur na teden",
    izkusnje:           "Izkušnje z RP",
    prejsnji_strezniki: "Prejšnji strežniki",
    pretekle_kazni:     "Pretekle kazni",
    razlog_kazni:       "Razlog kazni",
    metagaming:         "Metagaming",
    powergaming:        "Powergaming",
    fear_rp:            "Fear RP",
    rdm_vdm:            "RDM in VDM",
    ime_lika:           "Ime lika",
    starost_lika:       "Starost lika",
    zgodba_lika:        "Zgodba lika",
    cilj_lika:          "Cilj lika",
    scenarij_rop:       "Scenarij — rop",
    scenarij_krsitev:   "Scenarij — kršitev"
  };

  /* ==================================================== 1. PREKLOP KORAKOV */
  function show(n, noScroll) {
    step = Math.min(Math.max(1, n), LAST);
    panels.forEach(function (p) {
      p.classList.toggle("is-active", parseInt(p.getAttribute("data-step"), 10) === step);
    });
    navs.forEach(function (nav) {
      var i = parseInt(nav.getAttribute("data-step-nav"), 10);
      nav.classList.toggle("is-active", i === step);
      nav.classList.toggle("is-done", i < step);
    });
    if (step === LAST - 1) buildReview();

    if (noScroll) return;
    var top = form.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  /* ================================================== 2. PREVERJANJE POLJ */
  function fieldOf(el) { return el.closest(".field") || el.closest(".check"); }

  function validate(el) {
    var wrap = fieldOf(el);
    if (!wrap) return true;
    var val = (el.value || "").trim();
    var ok = true;

    if (el.type === "checkbox") ok = el.checked;
    else if (el.required && !val) ok = false;
    else if (el.dataset.min && val.length < parseInt(el.dataset.min, 10)) ok = false;
    else if (el.type === "number" && val) {
      var num = parseFloat(val);
      if (el.min && num < parseFloat(el.min)) ok = false;
      if (el.max && num > parseFloat(el.max)) ok = false;
    }

    wrap.classList.toggle("has-error", !ok);
    return ok;
  }

  function validateStep(n) {
    var panel = panels.find(function (p) {
      return parseInt(p.getAttribute("data-step"), 10) === n;
    });
    if (!panel) return true;
    var ok = true, first = null;
    $$("input, textarea, select", panel).forEach(function (el) {
      if (!el.required && !el.dataset.min) return;
      if (!validate(el)) { ok = false; if (!first) first = el; }
    });
    if (!ok && first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      toast("Nekaj polj še ni izpolnjenih pravilno.", "bad");
    }
    return ok;
  }

  /* ================================================== 3. ŠTEVCI ZNAKOV */
  $$("[data-counter-for]").forEach(function (c) {
    var el = document.getElementById(c.getAttribute("data-counter-for"));
    if (!el) return;
    var min = parseInt(el.dataset.min || "0", 10);
    function upd() {
      var len = (el.value || "").trim().length;
      c.textContent = len + " / " + min;
      c.classList.toggle("is-ok", len >= min);
    }
    el.addEventListener("input", upd);
    el._updCounter = upd;
    upd();
  });

  /* =============================================== 4. OSNUTEK V BRSKALNIKU */
  function collect() {
    var data = {};
    $$("input[name], textarea[name], select[name]", form).forEach(function (el) {
      data[el.name] = (el.value || "").trim();
    });
    return data;
  }

  function saveDraft() {
    try { localStorage.setItem(DRAFT, JSON.stringify(collect())); } catch (e) { /* poln ali zaklenjen pomnilnik */ }
  }

  function loadDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT); } catch (e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    var filled = 0;
    Object.keys(data).forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el && data[k]) { el.value = data[k]; filled++; if (el._updCounter) el._updCounter(); }
    });
    $$("[data-counter-for]").forEach(function (c) {
      var el = document.getElementById(c.getAttribute("data-counter-for"));
      if (el && el._updCounter) el._updCounter();
    });
    if (filled) toast("Nadaljujem tvoj shranjeni osnutek.", "ok");
  }

  var saveTimer = null;
  form.addEventListener("input", function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 500);
  });

  /* ======================================================== 5. PREGLED */
  function buildReview() {
    var host = $("#wl-review");
    if (!host) return;
    var data = collect();
    host.innerHTML = "";

    Object.keys(LABELS).forEach(function (key) {
      var val = data[key];
      if (!val) return;
      var row = document.createElement("dl");
      row.className = "wl-review-row";
      var dt = document.createElement("dt"); dt.textContent = LABELS[key];
      var dd = document.createElement("dd"); dd.textContent = val;
      row.appendChild(dt); row.appendChild(dd);
      host.appendChild(row);
    });

    if (!host.children.length) {
      host.innerHTML = '<p class="hint">Vloga je še prazna — vrni se na prvi korak.</p>';
    }
  }

  /* =================================================== 6. IZVOZ IN ODDAJA */
  function asText() {
    var data = collect();
    var out = [
      "═══════════════════════════════════════",
      "  UNDERCONTROL RP — WHITELIST VLOGA",
      "═══════════════════════════════════════",
      "Oddano: " + new Date().toLocaleString("sl-SI"),
      ""
    ];
    Object.keys(LABELS).forEach(function (k) {
      if (!data[k]) return;
      out.push("── " + LABELS[k] + " ──");
      out.push(data[k]);
      out.push("");
    });
    return out.join("\n");
  }

  function copyText() {
    var txt = asText();
    var done = function () { toast("Vloga kopirana — prilepi jo v ticket na Discordu.", "ok"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(done, fb);
    } else fb();
    function fb() {
      var ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); }
      catch (e) { toast("Kopiranje ni uspelo — uporabi gumb za prenos.", "bad"); }
      ta.remove();
    }
  }

  function downloadText() {
    var data = collect();
    var name = (data.discord || "vloga").replace(/[^a-zA-Z0-9_-]/g, "_");
    var blob = new Blob([asText()], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "UnderControl_WhiteList_" + name + ".txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast("Datoteka prenesena.", "ok");
  }

  function sendWebhook() {
    var data = collect();
    var fields = Object.keys(LABELS)
      .filter(function (k) { return data[k]; })
      .slice(0, 25)
      .map(function (k) {
        return { name: LABELS[k], value: String(data[k]).slice(0, 1000) };
      });

    return fetch(WL.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "UnderControl WhiteList",
        embeds: [{
          title: "Nova WhiteList vloga — " + (data.discord || "neznano"),
          color: 6272238,
          fields: fields,
          timestamp: new Date().toISOString()
        }]
      })
    });
  }

  /* ============================================================= 7. ZAGON */
  $$("[data-next]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (validateStep(step)) { saveDraft(); show(step + 1); }
    });
  });
  $$("[data-prev]").forEach(function (b) {
    b.addEventListener("click", function () { show(step - 1); });
  });

  // Klik po korakih v stranski vrstici — samo nazaj ali na ze potrjene korake
  navs.forEach(function (nav) {
    nav.addEventListener("click", function () {
      var target = parseInt(nav.getAttribute("data-step-nav"), 10);
      if (target < step) { show(target); return; }
      for (var i = step; i < target; i++) { if (!validateStep(i)) return; }
      show(target);
    });
  });

  // Sprotno odpravljanje napake, ko uporabnik popravi polje
  form.addEventListener("input", function (e) {
    var w = fieldOf(e.target);
    if (w && w.classList.contains("has-error")) validate(e.target);
  });
  form.addEventListener("change", function (e) {
    if (e.target.type === "checkbox") validate(e.target);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Se enkrat preverimo vse vsebinske korake
    for (var i = 1; i <= 5; i++) {
      if (!validateStep(i)) { show(i); return; }
    }
    var boxes = ["#c-rules", "#c-true", "#c-mic", "#c-data"].map($);
    var allChecked = boxes.every(function (b) { return validate(b); });
    if (!allChecked) { toast("Potrdi vse izjave pred oddajo.", "bad"); return; }

    var btn = $("#wl-submit");
    btn.disabled = true;
    btn.textContent = "Oddajam…";

    var doneTx = $("#wl-done-tx");

    function finish(msg) {
      btn.disabled = false;
      btn.textContent = "Oddaj vlogo";
      if (doneTx) doneTx.textContent = msg;
      show(LAST);
      try { localStorage.removeItem(DRAFT); } catch (err) { /* ni kriticno */ }
    }

    if (WL.mode === "webhook" && WL.webhookUrl) {
      sendWebhook()
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          finish("Vloga je bila poslana naši ekipi. Odgovor prejmeš na Discordu v " +
                 (WL.reviewTime || "24 – 48 ur") + ". Za vsak primer si vlogo shrani tudi zase.");
        })
        .catch(function () {
          finish("Samodejna oddaja ni uspela, tvoji odgovori pa so shranjeni. " +
                 "Kopiraj vlogo s spodnjim gumbom in jo oddaj v ticket na Discordu.");
          toast("Pošiljanje ni uspelo — uporabi ročno oddajo.", "bad");
        });
    } else {
      finish("Kopiraj vlogo s spodnjim gumbom in jo prilepi v ticket na našem Discordu. " +
             "Odgovor prejmeš v " + (WL.reviewTime || "24 – 48 ur") + ".");
    }
  });

  var bCopy = $("#wl-copy");     if (bCopy) bCopy.addEventListener("click", copyText);
  var bDown = $("#wl-download"); if (bDown) bDown.addEventListener("click", downloadText);

  var bClear = $("#wl-clear");
  if (bClear) bClear.addEventListener("click", function () {
    if (!confirm("Res želiš izbrisati vse odgovore? Tega ni mogoče razveljaviti.")) return;
    form.reset();
    try { localStorage.removeItem(DRAFT); } catch (e) { /* ni kriticno */ }
    $$("[data-counter-for]").forEach(function (c) {
      var el = document.getElementById(c.getAttribute("data-counter-for"));
      if (el && el._updCounter) el._updCounter();
    });
    $$(".has-error", form).forEach(function (w) { w.classList.remove("has-error"); });
    show(1);
    toast("Osnutek izbrisan.", "ok");
  });

  loadDraft();
  show(1, true);
})();
