/* ============================================================================
   UNDERCONTROL RP — Osrednja konfiguracija
   ----------------------------------------------------------------------------
   TU UREJAS VSE PODATKE. Ni ti treba odpirati HTML datotek.
   Vse vrednosti, oznacene s TODO, zamenjaj s pravimi podatki strezniku.
   ========================================================================== */

window.UC = {

  /* ---------------------------------------------------------- 1. STREZNIK */
  server: {
    name:      "UNDERCONTROL",
    suffix:    "RP",
    tagline:   "Slovenski FiveM RolePlay",
    // TODO: vpisi pravi cfx.re / connect naslov strezniku
    connect:   "connect.undercontrol.si",
    slots:     256,
    founded:   2026
  },

  /* ------------------------------------------------------------- 2. LINKI */
  links: {
    // TODO: vpisi pravo Discord vabilo
    discord:  "https://discord.gg/undercontrol",
    tiktok:   "#",
    youtube:  "#",
    instagram:"#",
    fivem:    "#"
  },

  /* --------------------------------------------------- 3. DISCORD PRIJAVA */
  /* Trgovina uporablja Discord OAuth2 zgolj za IDENTIFIKACIJO igralca.
     Na spletni strani NE pobiramo denarja — nakup se zakljuci na Discordu.

     Kako vklopiti pravo prijavo:
       1. https://discord.com/developers/applications -> New Application
       2. OAuth2 -> Redirects -> dodaj tocen naslov strani trgovine, npr.
          https://tvoja-domena.si/trgovina.html
       3. OAuth2 -> vklopi "Implicit grant"
       4. Client ID prilepi spodaj v clientId
     Dokler je clientId prazen, tece DEMO nacin (prijava se simulira lokalno). */
  discordAuth: {
    clientId:    "",           // TODO: npr. "1234567890123456789"
    redirectUri: "",           // prazno = trenutni naslov strani
    scope:       "identify"
  },

  /* ------------------------------------------- 4. WHITELIST — ODDAJA VLOGE */
  /* Staticna stran nima zaledja. Na voljo sta dva nacina:
       "manual"  — igralec dobi izpolnjeno vlogo za kopiranje in jo odda na Discordu
       "webhook" — vloga se posreduje na Discord webhook (glej opozorilo v README)  */
  whitelist: {
    mode:       "manual",
    webhookUrl: "",            // uporabi samo, ce je mode = "webhook"
    minAge:     16,
    reviewTime: "24 – 48 ur"
  },

  /* ------------------------------------------------------------ 5. VEDENJE */
  ui: {
    smoothScroll:   true,      // tekoce drsenje z inercijo
    smoothStrength: 0.11,      // 0.06 = zelo mehko, 0.2 = bolj neposredno
    bgParticles:    true,      // animirani delci v ozadju
    preloader:      true,
    customCursor:   false
  },

  /* -------------------------------------------------- 6. STATISTIKA (HERO) */
  /* TODO: zamenjaj s pravimi stevilkami, ko strežnik zazivi. */
  stats: {
    players:   1200,
    hours:     48000,
    peak:      180,
    factions:  24
  }
};
