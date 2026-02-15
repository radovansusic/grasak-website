# 🫛 GRAŠAK — VODIČ ZA POKRETANJE SAJTA

## Sve od nule do živog sajta. Korak po korak.

**Šta dobijaš na kraju:**
- Profesionalni sajt na adresi grasak.vercel.app (besplatno)
- 6 jezika (Latinica, Ćirilica, English, Русский, Español, Türkçe)
- WhatsApp + Viber lebdeća dugmad (uvijek vidljiva)
- Mobilni "Zakaži" bar na dnu ekrana
- Booking forma → šalje poruku na WhatsApp
- Cjenovnik, galerija, FAQ, recenzije, Google mapa
- SEO optimizovano za Google (JSON-LD, meta tagovi, sitemap)
- Potpuno responsive (telefon, tablet, desktop)

**Trošak: 0€** (domen dodaš kad budeš spreman za ~10€/god)

---

## PREDUSLOV: INSTALACIJE (samo jednom)

### 1. Node.js

1. Idi na https://nodejs.org
2. Klikni zeleno dugme **"LTS"** (npr. 20.x.x LTS)
3. Pokreni instalaciju: **Next → Next → Next → Install → Finish**
4. PROVJERA: Otvori **Command Prompt** (Windows tipka → ukucaj `cmd` → Enter)
5. Ukucaj: `node --version`
6. Treba da kaže nešto kao `v20.11.0` — ako da, OK ✅

### 2. Git

1. Idi na https://git-scm.com/download/win
2. Klikni **"Click here to download"**
3. Instaliraj: sve default opcije (Next, Next... Install, Finish)
4. PROVJERA: U Command Prompt ukucaj: `git --version`
5. Treba da kaže `git version 2.x.x` — OK ✅

### 3. VS Code (editor za kod)

1. Idi na https://code.visualstudio.com
2. Skini i instaliraj (sve default)
3. Ovo će ti biti za pregled i izmjene fajlova

---

## KORAK 1: RASPAKUJ PROJEKAT

1. Skini **grasak-website.zip** fajl (koji si dobio od Clauda)
2. Na desktopu napravi folder `Projekti`
3. Raspakuj ZIP u `C:\Users\TvojeIme\Desktop\Projekti\`
4. Treba da dobiješ: `C:\Users\TvojeIme\Desktop\Projekti\grasak-website\`

**Unutra treba da budu ovi fajlovi:**
```
grasak-website/
├── package.json          ← popis biblioteka
├── next.config.js        ← podešavanja Next.js
├── jsconfig.json         ← podešavanja putanja
├── .gitignore            ← šta Git ignoriše
├── public/
│   ├── favicon.png       ← ikonica sajta
│   ├── robots.txt        ← za Google
│   ├── sitemap.xml       ← za Google
│   └── images/           ← sve slike
│       ├── salon.jpg
│       ├── oprema.jpg
│       ├── djecak.jpg
│       ├── nikola.jpg
│       ├── prvo_sisanje.jpg
│       ├── tri_za_ustedu.jpg
│       ├── zadovoljni.jpg
│       ├── lojaliti.jpg
│       └── fb_cover.jpg
└── src/
    └── app/
        ├── globals.css   ← stilovi
        ├── layout.js     ← SEO + struktura
        └── page.js       ← GLAVNI FAJL — sav sadržaj sajta
```

---

## KORAK 2: INSTALIRAJ BIBLIOTEKE

1. Otvori **Command Prompt** (ili **PowerShell**)
2. Idi do projekta:
```
cd Desktop\Projekti\grasak-website
```
3. Instaliraj sve potrebno:
```
npm install
```
4. Čekaj 1-2 minuta dok se sve skine
5. Kad završi, vidješ folder `node_modules` — to je OK ✅

---

## KORAK 3: TESTIRAJ LOKALNO

1. U istom terminalu ukucaj:
```
npm run dev
```
2. Vidješ poruku: `ready - started server on 0.0.0.0:3000`
3. Otvori browser i idi na: **http://localhost:3000**
4. VIDIŠ SAJT! 🎉 Provjeri:
   - ✅ Slike se učitavaju
   - ✅ Jezici rade (klikni zastavu gore desno)
   - ✅ WhatsApp/Viber dugmad lebde dole desno
   - ✅ Na telefonu (smanji browser prozor) vidiš zeleni bar na dnu
   - ✅ "Zakaži termin" otvara WhatsApp
   - ✅ FAQ se otvara/zatvara
   - ✅ Filtriranje usluga radi (Sve/Osnovno/Paketi/Dodatno)
5. Kad završiš pregled, u terminalu pritisni **Ctrl+C** da ugasiš server

---

## KORAK 4: POSTAVI NA GITHUB

### 4a. Napravi novi repository

1. Idi na https://github.com
2. Uloguj se
3. Klikni zeleno dugme **"New"** (ili idi na https://github.com/new)
4. Popuni:
   - **Repository name:** `grasak-website`
   - **Description:** `Grašak - Dječiji frizerski salon`
   - **Public** (ostavi čekirano)
   - **NE čekiraj** "Add a README" — mi već imamo fajlove
5. Klikni **"Create repository"**
6. Vidješ stranicu sa uputstvima — NE ZATVARAT JE

### 4b. Poveži lokalni projekat sa GitHub-om

1. Otvori **Command Prompt** u folder projekta:
```
cd Desktop\Projekti\grasak-website
```

2. Pokreni ove komande **jednu po jednu** (kopiraj-zalijepi):
```
git init
```
```
git add .
```
```
git commit -m "Grašak sajt v1"
```
```
git branch -M main
```

3. Sada poveži sa GitHub-om (zamijeni `TVOJ-USERNAME` sa tvojim GitHub korisničkim imenom):
```
git remote add origin https://github.com/TVOJ-USERNAME/grasak-website.git
```
```
git push -u origin main
```

4. Ako traži login:
   - Browser će se otvoriti → uloguj se na GitHub → odobri
   - ILI: ukucaj username i password/token

5. Osvježi GitHub stranicu → vidiš sve fajlove ✅

---

## KORAK 5: DEPLOY NA VERCEL (SAJT IDE ONLINE!)

1. Idi na https://vercel.com
2. Uloguj se (sa GitHub nalogom)
3. Klikni **"Add New..."** → **"Project"**
4. Nađi **grasak-website** u listi → klikni **"Import"**
5. Na sljedećem ekranu:
   - **Framework Preset:** Next.js (automatski prepozna)
   - **Root Directory:** ostavi prazno
   - NE MIJENJAJ ništa drugo
6. Klikni **"Deploy"**
7. Čekaj 1-2 minuta...
8. **🎉 SAJT JE ŽIVI!** Dobijaš link: `grasak-website.vercel.app`

### Provjera na telefonu

1. Otvori link na telefonu
2. Provjeri:
   - ✅ Zeleni bar na dnu "WhatsApp | Zakaži"
   - ✅ WhatsApp i Viber lebdeća dugmad
   - ✅ Hamburger meni (☰) gore desno
   - ✅ Slike se učitavaju
   - ✅ Jezici rade

---

## KORAK 6: LJEPŠI LINK (opcionalno ali preporučeno)

Na Vercel-u možeš promijeniti default subdomen:

1. Idi na https://vercel.com/dashboard
2. Klikni na projekat `grasak-website`
3. Idi na **Settings** → **Domains**
4. Pod "Edit" poddomenu, promijeni u: `grasak.vercel.app`
5. Ako je zauzeto, probaj: `grasaksalon.vercel.app` ili `salon-grasak.vercel.app`

### Kupovina pravog domena (kad budeš spreman)

**Preporuka:** Kupi na https://www.namecheap.com ili https://domain.me

Provjeri dostupnost ovih domena:
- `grasak.me` (~10€/god) — IDEALNO
- `grasaksalon.me` — alternativa
- `grasak.co.me` — alternativa
- `djecijisalon.me` — deskriptivno

Kad kupiš domen:
1. Na Vercel → Settings → Domains → "Add"
2. Ukucaj kupljeni domen
3. Vercel ti pokaže DNS zapise
4. Na Namecheap → Domain List → Manage → Advanced DNS
5. Dodaj zapise koje Vercel traži (A record i CNAME)
6. Čekaj 10-30 min → domen radi ✅

---

## KORAK 7: GOOGLE BUSINESS PROFIL

1. Idi na https://business.google.com
2. Uloguj se (isti nalog kao grasaksalon@gmail.com)
3. Nađi svoj profil "GRAŠAK"
4. Klikni **"Edit profile"** → **"Website"**
5. Ukucaj: `https://grasak.vercel.app` (ili tvoj domen)
6. Sačuvaj

Ovo je NAJBITNIJI korak za SEO — Google odmah počinje da rangira sajt.

---

## KORAK 8: GOOGLE ANALYTICS (praćenje posjeta)

1. Idi na https://analytics.google.com
2. Klikni "Start measuring"
3. Account name: `Grašak`
4. Property name: `Grašak Website`
5. Timezone: Montenegro (UTC+1)
6. Klikni kroz setup
7. Dobijaš **Measurement ID** (izgleda: G-XXXXXXXXXX)
8. Ovaj ID staviš u sajt (reci mi ID, ja ću ti pokazati tačno gdje)

---

## KORAK 9: GOOGLE SEARCH CONSOLE (SEO)

1. Idi na https://search.google.com/search-console
2. Klikni "Add property"
3. Izaberi "URL prefix"
4. Ukucaj: `https://grasak.vercel.app`
5. Verificiraj preko "HTML tag" metode (dobijaš meta tag — javi mi ga)
6. Kad verificuješ, klikni **Sitemaps** u meniju
7. Dodaj: `sitemap.xml`
8. Sačekaj 1-2 dana — Google počinje indeksiranje

---

## KAKO MIJENJATI SADRŽAJ

### Promjena teksta (cijena, opis, radno vrijeme...)

1. Otvori VS Code
2. Otvori folder `grasak-website`
3. Otvori fajl: `src/app/page.js`
4. Koristi **Ctrl+F** (pretraga) da nađeš tekst koji hoćeš da promijeniš
5. Npr. traži `8€` da nađeš cijenu kratkog šišanja
6. Promijeni → Sačuvaj (Ctrl+S)

### Promjena u SVIM jezicima

U `page.js` imaš objekte za svaki jezik:
- `ME` = Crnogorski (latinica) — red ~52
- `EN` = English — red ~113
- `RU` = Русский — red ~159
- `ES` = Español — red ~207
- `TR` = Türkçe — red ~250
- Ćirilica se generiše automatski od `ME`

**Kad mijenjaš cijenu ili uslugu, promijeni u SVIM jezicima!**

### Dodavanje nove slike

1. Smanji sliku na ~400px širine (koristi https://squoosh.app — besplatno)
2. Sačuvaj kao .jpg, quality 75%
3. Stavi u `public/images/`
4. U `page.js` referencuj kao: `src="/images/nova-slika.jpg"`

### Upload promjena na sajt

Poslije svake izmjene, pokreni ove komande:
```
cd Desktop\Projekti\grasak-website
git add .
git commit -m "Opis promjene"
git push
```

Vercel automatski prepozna promjenu i update-uje sajt za ~1 minut! ✅

---

## PRIORITETNI REDOSLED DANAS

| # | Zadatak | Vrijeme | Trošak |
|---|---------|---------|--------|
| 1 | Instaliraj Node.js + Git | 10 min | 0€ |
| 2 | Raspakuj projekat | 2 min | 0€ |
| 3 | `npm install` | 2 min | 0€ |
| 4 | Testiraj lokalno `npm run dev` | 5 min | 0€ |
| 5 | Napravi GitHub repo + push | 10 min | 0€ |
| 6 | Deploy na Vercel | 5 min | 0€ |
| 7 | Dodaj URL u Google Business | 2 min | 0€ |
| 8 | Setup Google Analytics | 10 min | 0€ |
| 9 | Setup Search Console | 5 min | 0€ |
| **UKUPNO** | | **~50 min** | **0€** |

---

## BUDUĆA PROŠIRENJA (kad budeš spreman)

| Funkcija | Alat | Cijena |
|----------|------|--------|
| Pravi domen (.me) | Namecheap | ~10€/god |
| Online kalendar | Cal.com | 0€ (besplatan plan) |
| Admin panel za sadržaj | Decap CMS ili Notion | 0€ |
| E-mail sa domenom | Google Workspace | ~6€/mj |
| Instagram feed na sajtu | SnapWidget | 0€ |
| Elektronska loyalty kartica | QR kod sistem | 0€ |

---

## AKO NEŠTO NE RADI

**Problem: `npm install` javlja grešku**
→ Provjeri da li si u pravom folderu: `cd Desktop\Projekti\grasak-website`
→ Provjeri da Node.js radi: `node --version`

**Problem: `npm run dev` ne radi**
→ Obriši `node_modules` folder i ponovo pokreni `npm install`

**Problem: Slike se ne vide**
→ Provjeri da slike postoje u `public/images/` folderu
→ Imena moraju biti TAČNA (salon.jpg, ne Salon.jpg)

**Problem: Git push traži password**
→ Idi na https://github.com/settings/tokens
→ Napravi Personal Access Token
→ Koristi taj token umjesto passworda

**Problem: Vercel deploy failuje**
→ Pošalji mi screenshot greške — riješićemo

---

## NAPOMENA

Ovaj sajt je izgrađen sa **Next.js** — industrijskim standardom koji koriste:
Netflix, TikTok, Nike, Uber, Twitch...

Hostovan je na **Vercel** — platformi kreatora Next.js-a.
Besplatno, brzo, pouzdano, sa automatskim SSL certifikatom (https).

Sve je profesionalno. Ništa nije "amaterski" ili "jeftino" — samo PAMETNO. 💚
