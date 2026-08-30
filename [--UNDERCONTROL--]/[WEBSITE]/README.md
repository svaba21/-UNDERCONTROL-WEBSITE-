# UNDERCONTROL RP — spletna stran

Statična spletna stran (HTML / CSS / JavaScript) brez zunanjih knjižnic in brez
postopka gradnje. Deluje takoj — tudi z lokalnega diska.

---

## 1. Kako stran zaženeš

**Najhitreje:** dvoklikni `index.html`.

> **Pomembno:** ob odpiranju neposredno z diska (`file:///…`) nekateri brskalniki
> blokirajo del funkcij (kopiranje v odložišče, Discord prijava). Za pravo sliko
> uporabi lokalni strežnik:

```bash
python -m http.server 5173 --directory "D:\[--UNDERCONTROL--]\[WEBSITE]"
```

Nato v brskalnik vpiši `http://localhost:5173`.

---

## 2. Struktura

```
[WEBSITE]/
├── index.html          Domača stran — vizija, pečati, statistika, FAQ
├── pravila.html        Pravila po kategorijah + iskalnik
├── trgovina.html       Paketi + Discord prijava (nakup se zaključi na Discordu)
├── whitelist.html      Prijavnica v 6 korakih
├── ekipa.html          Struktura ekipe in postopek obravnave prijav
├── README.md           Ta datoteka
└── assets/
    ├── css/
    │   ├── main.css    Barve, tipografija, steklo, gumbi, glava, noga
    │   └── pages.css   Hero, kartice in posamezne podstrani
    ├── js/
    │   ├── config.js   ← TU UREJAŠ VSE PODATKE
    │   ├── main.js     Animacijski motor (skupen vsem stranem)
    │   ├── rules.js    Iskanje po pravilih
    │   ├── store.js    Discord prijava in izbira paketa
    │   └── whitelist.js Prijavnica
    └── img/            Logotipi in grafike
```

---

## 3. Kaj urediš NAJPREJ

Odpri **`assets/js/config.js`**. Vse označeno s `TODO` zamenjaj s pravimi podatki:

| Nastavitev | Kaj je to |
|---|---|
| `server.connect` | Pravi naslov za povezavo (prikazan v glavi in nogi) |
| `links.discord` | Pravo Discord vabilo — uporabljeno na **vseh** gumbih |
| `links.tiktok` … | Družbena omrežja v nogi |
| `whitelist.minAge` | Najnižja starost za prijavo |
| `whitelist.reviewTime` | Obljubljen rok odgovora |
| `stats.*` | Številke na domači strani |

Spremembe veljajo takoj na vseh straneh — v HTML ti ni treba posegati.

**Imena članov ekipe** so edina izjema: uredi jih neposredno v `ekipa.html`
(v datoteki je označen komentar z navodilom). Trenutna imena so zgolj primeri
razporeditve.

---

## 4. Discord prijava v trgovini

Trenutno teče **DEMO način** — prijava se samo simulira, da lahko preizkusiš potek.

### Vklop prave prijave

1. Pojdi na <https://discord.com/developers/applications> → **New Application**
2. **OAuth2 → Redirects** → dodaj točen naslov strani trgovine, npr.
   `https://tvoja-domena.si/trgovina.html`
   (pri lokalnem testiranju: `http://localhost:5173/trgovina.html`)
3. **OAuth2** → vklopi **Implicit grant**
4. Prekopiraj **Client ID** in ga v `config.js` vpiši v `discordAuth.clientId`

Stran zahteva samo dovoljenje `identify` — vidi le uporabniško ime, ID in
profilno sliko. Gesla, e-pošte ali seznama strežnikov **ne** vidi.

> **Denarja stran ne pobira in ne shranjuje.** Igralec izbere paket, dobi
> povzetek z referenčno oznako, nakup pa dokonča v pogovoru z ekipo na Discordu.
> To je bilo namerno in tako tudi piše na strani.

---

## 5. Oddaja WhiteList vlog

V `config.js` pod `whitelist.mode` izbereš enega od dveh načinov:

**`"manual"` (privzeto in priporočeno)**
Igralec po oddaji dobi vlogo za kopiranje ali prenos in jo prilepi v ticket
na Discordu. Nič se ne izgubi, ekipa ima vse na enem mestu.

**`"webhook"`**
Vloga se samodejno pošlje na Discord webhook. Vpiši še `whitelist.webhookUrl`.

> ⚠️ **Opozorilo pri načinu `webhook`:** naslov webhooka je v tem primeru viden
> vsakomur, ki pogleda izvorno kodo strani. Kdorkoli lahko nanj pošilja sporočila
> in tvoj kanal zasuje. Za javno objavljeno stran je edina varna rešitev majhno
> zaledje (backend), ki webhook skrije. Do takrat priporočam `"manual"`.

Osnutek vloge se sproti shranjuje v igralčev brskalnik (`localStorage`), zato
lahko izpolnjevanje kadarkoli nadaljuje. Podatki ne zapustijo njegovega
računalnika, dokler vloge ne odda.

---

## 6. Nastavitve videza

V `config.js` pod `ui`:

| Nastavitev | Učinek |
|---|---|
| `smoothScroll` | Tekoče drsenje z inercijo (`false` = običajno) |
| `smoothStrength` | 0.06 = zelo mehko · 0.20 = bolj neposredno |
| `bgParticles` | Animirani delci v ozadju |
| `preloader` | Nalagalni zaslon z logotipom |

Barve so na enem mestu — na vrhu `assets/css/main.css` v odseku `1. TOKENI`.
Sprememba `--ice-500` ali `--glow` prebarva celotno stran.

---

## 7. Kaj je vgrajeno

- **Liquid glass** — steklene površine z zamegljenim ozadjem, robnim odsevom in
  odsevom, ki sledi kazalcu; kjer brskalnik zmore, tudi pravi lom svetlobe (SVG filter)
- **3D** — hero z globinskimi plastmi, nagibanje kartic ob premiku miške, lebdeči emblem
- **Animacije ob drsenju** — razkrivanje odsekov, razpad naslovov na črke,
  besedilo, ki se osvetljuje med branjem, števci, parallax
- **Ozadje na platnu** — lebdeči delci z globino in svetlobni pramen v barvi logotipa
- **Dostopnost** — tipkovnična navigacija, vidni fokusni okvirji, povezava za preskok
  vsebine, spoštovanje nastavitve »zmanjšaj gibanje«
- **Odzivnost** — preverjeno brez vodoravnega prelivanja pri 365, 414, 768, 900,
  1024, 1280, 1440 in 1920 px

---

## 8. Objava na spletu

Stran je statična, zato deluje povsod: Netlify, Cloudflare Pages, GitHub Pages,
navaden gostitelj prek FTP. Naloži vsebino mape `[WEBSITE]` in to je vse.

**Po objavi ne pozabi:**
1. v `config.js` vpisati pravi `discordAuth.redirectUri` (ali pusti prazno —
   takrat se uporabi trenutni naslov strani),
2. v Discord aplikaciji dodati produkcijski Redirect URI,
3. zamenjati imena v `ekipa.html`.

---

## 9. Kaj še ni narejeno

- Podstrani **Zasebnost** in **Pogoji uporabe** (v nogi vodita na `#`)
- Prikaz števila igralcev v živo (zahteva klic na FiveM API prek zaledja)
- Prijava v ekipo kot obrazec (trenutno vodi na Discord)

---

*Zadnja posodobitev: 30. avgust 2026*
