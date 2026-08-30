/* ============================================================================
   UNDERCONTROL RP — Trgovina
   Discord prijava sluzi SAMO identifikaciji. Placila stran ne pobira in ne hrani.
   ========================================================================== */
(function () {
  "use strict";

  var CFG  = window.UC || {};
  var AUTH = CFG.discordAuth || {};
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var toast = window.ucToast || function (m) { console.log(m); };

  var KEY  = "uc_discord_user";
  var DEMO = !AUTH.clientId;

  /* ====================================================== 1. STANJE PRIJAVE */
  function getUser() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); }
    catch (e) { return null; }
  }
  function setUser(u) {
    try {
      if (u) sessionStorage.setItem(KEY, JSON.stringify(u));
      else sessionStorage.removeItem(KEY);
    } catch (e) { /* zasebno okno — prijava velja le do osvezitve */ }
    render();
  }

  function render() {
    var u = getUser();
    var out = $("#auth-out"), inn = $("#auth-in");
    var bLogin = $("#btn-login"), bLogout = $("#btn-logout");
    if (!out || !inn) return;

    if (u) {
      out.classList.add("hide");
      inn.classList.remove("hide");
      bLogin.classList.add("hide");
      bLogout.classList.remove("hide");
      $("#auth-name").textContent = u.username || "Igralec";
      $("#auth-id").textContent = "ID: " + (u.id || "—");
      var av = $("#auth-avatar");
      if (u.avatarUrl) {
        av.style.background = "url(" + u.avatarUrl + ") center/cover";
        av.textContent = "";
      } else {
        av.style.background = "";
        av.textContent = (u.username || "?").charAt(0).toUpperCase();
      }
    } else {
      out.classList.remove("hide");
      inn.classList.add("hide");
      bLogin.classList.remove("hide");
      bLogout.classList.add("hide");
    }
  }

  /* ============================================== 2. DISCORD OAUTH2 (implicit) */
  function login() {
    if (DEMO) {
      setUser({ id: "000000000000000000", username: "DemoIgralec", demo: true });
      toast("Demo prijava — pravo prijavo vklopiš v config.js", "ok");
      return;
    }
    var redirect = AUTH.redirectUri || (location.origin + location.pathname);
    var url = "https://discord.com/api/oauth2/authorize" +
      "?client_id=" + encodeURIComponent(AUTH.clientId) +
      "&redirect_uri=" + encodeURIComponent(redirect) +
      "&response_type=token" +
      "&scope=" + encodeURIComponent(AUTH.scope || "identify");
    location.href = url;
  }

  // Ce se vrnemo z Discorda, je zeton v naslovu za znakom #
  function catchRedirect() {
    if (!location.hash || location.hash.indexOf("access_token") === -1) return;
    var params = new URLSearchParams(location.hash.slice(1));
    var token = params.get("access_token");
    history.replaceState(null, "", location.pathname + location.search);
    if (!token) return;

    fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        setUser({
          id: d.id,
          username: d.global_name || d.username,
          avatarUrl: d.avatar
            ? "https://cdn.discordapp.com/avatars/" + d.id + "/" + d.avatar + ".png?size=128"
            : null
        });
        toast("Prijava uspešna. Pozdravljen, " + (d.global_name || d.username) + "!", "ok");
      })
      .catch(function () { toast("Prijava ni uspela. Poskusi znova.", "bad"); });
  }

  /* ================================================================ 3. ZAVIHKI */
  function tabs() {
    var btns = $$(".store-tabs button");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        var name = b.getAttribute("data-tab");
        $$("[data-panel]").forEach(function (p) {
          p.classList.toggle("hide", p.getAttribute("data-panel") !== name);
        });
      });
    });
  }

  /* ============================================================== 4. NAKUP */
  var modal = $("#buy-modal");
  var lastSummary = "";

  function openModal(pack) {
    var u = getUser();
    if (!u) {
      toast("Najprej se prijavi z Discord računom.", "bad");
      var box = $("#auth-box");
      if (box) box.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var price = pack.getAttribute("data-price");
    if (pack.getAttribute("data-kind") === "Donacija") {
      var amt = parseInt(($("#don-amount") || {}).value || "0", 10);
      if (!amt || amt < 1) { toast("Vpiši znesek donacije.", "bad"); return; }
      price = amt + " €";
    }

    var rows = [
      ["Discord",   (u.username || "—") + "  ·  " + (u.id || "—")],
      ["Vrsta",     pack.getAttribute("data-kind") || "—"],
      ["Izbira",    pack.getAttribute("data-pack") || "—"],
      ["Znesek",    price || "—"],
      ["Oznaka",    "UC-" + Date.now().toString(36).toUpperCase().slice(-6)]
    ];

    var host = $("#buy-summary");
    host.innerHTML = "";
    rows.forEach(function (r) {
      var d = document.createElement("div");
      var s = document.createElement("span"); s.textContent = r[0];
      var b = document.createElement("b");    b.textContent = r[1];
      d.appendChild(s); d.appendChild(b);
      host.appendChild(d);
    });

    lastSummary = "UnderControl RP — zahtevek za nakup\n" +
      rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n");

    modal.classList.add("is-open");
    document.body.classList.add("is-locked");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.classList.remove("is-locked");
  }

  function copySummary() {
    var done = function () { toast("Podatki kopirani — prilepi jih v ticket.", "ok"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(lastSummary).then(done, fallback);
    } else fallback();

    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = lastSummary;
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); }
      catch (e) { toast("Kopiranje ni uspelo — označi besedilo ročno.", "bad"); }
      ta.remove();
    }
  }

  /* ================================================================ 5. ZAGON */
  catchRedirect();
  render();
  tabs();

  var bLogin = $("#btn-login");
  if (bLogin) bLogin.addEventListener("click", login);

  var bLogout = $("#btn-logout");
  if (bLogout) bLogout.addEventListener("click", function () {
    setUser(null);
    toast("Odjavljen.", "ok");
  });

  $$("[data-buy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pack = btn.closest("[data-pack]");
      if (pack) openModal(pack);
    });
  });

  if (modal) {
    $("#buy-close").addEventListener("click", closeModal);
    $("#buy-copy").addEventListener("click", copySummary);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  // Opomba o demo nacinu, da ni nejasnosti kaj stran trenutno pocne
  var note = $("#auth-demo-note");
  if (note) {
    note.textContent = DEMO
      ? "Opomba za ekipo: Discord prijava je trenutno v DEMO načinu (v config.js ni vpisan clientId), zato se prijava samo simulira. Navodila za vklop prave prijave so v README.md."
      : "Prijava poteka prek uradnega Discord OAuth2. Stran ne vidi tvojega gesla ali e-pošte.";
  }
})();
