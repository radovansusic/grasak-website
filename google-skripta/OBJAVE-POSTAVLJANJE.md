# Objave na grasaksalon.me - postavljanje (Radovan i Kristina)

Šta se dobija: u panelu (grasaksalon.me/panel) nova kartica **Objave**. Kristina napiše objavu ili traži nacrt iz linka ili bilješke, model prevede na engleski, ruski i turski, ona sve pročita i ispravi, provjera zaustavi sporno, pa Objavi. Objava se čuva u Google tabeli (list "Objave") i na sajtu je kao prava strana koju vidi Google: `/objave`, `/objave/<slug>`, `/en/objave/<slug>`, `/ru/...`, `/tr/...`, plus `/objave/rss.xml` i `/sitemap.xml`.

Grana je `p14-objave`. Ništa nije u `main` i ništa nije objavljeno dok se grana ne spoji. Koraci 1 do 5 su u Google nalogu salona i mogu prije spajanja grane; panel će do spajanja koristiti staru verziju koja kartice nema.

## 1. Zalijepiti novu skriptu (nalog grasaksalon@gmail.com)

1. Otvoriti tabelu "Grašak - termini", pa Extensions > Apps Script.
2. U fajlu `Grasak.gs` označiti sve (Ctrl+A) i zalijepiti cijeli sadržaj fajla `google-skripta/Grasak.gs` iz ove grane. Sačuvati (Ctrl+S).
3. Nova verzija skripte nosi oznaku `2026-11-11a` (vidi se na vrhu fajla, `VERZIJA_SKRIPTE`).

## 2. Napraviti list "Objave"

U tabeli: meni **Grasak > 1. Postavi (i poslije svake nove verzije koda)**. To je ista komanda kao poslije svake nove verzije; dodatno pravi list "Objave". Ako Google traži ovlašćenje, odobriti (skripta već koristi UrlFetchApp, nema novih dozvola).

## 3. Nova verzija deploya (adresa ostaje ista)

1. U Apps Script: Deploy > **Manage deployments**.
2. Olovka (Edit) na postojećem web appu, polje Version: **New version**, pa Deploy.
3. Ne praviti "New deployment": to daje novu adresu, a sajt i panel koriste staru.
4. Provjeriti u istom dijalogu: Execute as = Me (grasaksalon@gmail.com), Who has access = **Anyone**. Bez "Anyone" sajt ne bi mogao da čita ni zakazivanje, a ni objave.

## 4. Upisati dva ključa u Script Properties

Apps Script > Project Settings (zupčanik) > Script properties > Add script property. Imena tačno ovako:

| Ime | Šta je |
|---|---|
| `ANTHROPIC_API_KEY` | glavni ključ (nacrt i prevod) |
| `DEEPSEEK_API_KEY` | rezerva, koristi se kad glavni ne odgovori |

Opciono, samo ako se mijenja model: `OBJAVE_MODEL_ANTHROPIC` (zadano `claude-haiku-5-5`), `OBJAVE_MODEL_DEEPSEEK` (zadano `deepseek-flash`). Ključevi se ne šalju mejlom ni porukom i ne upisuju u kod ni u repo. Bez ijednog ključa panel to kaže jasnom porukom, a ručno pisanje, čuvanje i objava rade.

## 5. Kristinin red u listu Osoblje

U tabeli, list "Osoblje": Ime (npr. Kristina), Uloga `vlasnik`, Šifra (najmanje 8 znakova; najlakše kroz meni Grasak > Postavi sifru za panel), Aktivan `DA`.

Kartica Objave je vidljiva ulozi `vlasnik` i ulozi `admin` (u kodu postoje samo `vlasnik`, `admin`, `frizer`; frizer je ne vidi). Šablon liste Osoblje navodi Kristinu kao `vlasnik`, ali stvarni sadržaj liste nije bio dostupan, pa je to pretpostavka: ako je Kristina u listu upisana kao `admin`, kartica radi i tako. Radovanu pristup ne treba; ako ga neko upiše kao `admin`, vidjeće karticu.

## 6. Provjeriti poslije (redom)

1. Panel: prijava, kartica **Objave** se otvara, lista je prazna i bez crvene poruke. Ako piše "traže novu verziju Google skripte", korak 3 nije prošao (New version).
2. Nacrt iz bilješke (jedna rečenica bez brojki). Bez ključa: poruka o ključu. Sa ključem: naslov i tekst na crnogorskom.
3. Prevedi: pune se engleski, ruski i turski. Pročitati, ispraviti.
4. Probni slučaj za blokadu: u tekst upisati "preko 5000 djece" bez izvora, pa Provjera. Mora pisati **Zaustavlja objavu**.
5. Objaviti probnu objavu. U pregledniku otvoriti adresu web appa (ona iz `src/lib/zakazivanje.ts`, konstanta `GRASAK_APPS_SCRIPT`) sa dodatkom `?akcija=objave`: mora vratiti JSON sa objavom.
6. Poslije spajanja grane i Vercel deploya otvoriti: `https://grasaksalon.me/objave`, `/objave/<slug>`, `/en/objave/<slug>`, `/objave/rss.xml`, `/sitemap.xml` (u sitemap-u mora pisati host `grasaksalon.me`, ne `vercel.app`).
7. Na strani objave "View source": `canonical` je `https://grasaksalon.me/...`, ima `hreflang` linkova i `application/ld+json` sa `BlogPosting`.
8. Google Search Console: Sitemaps > dodati `https://grasaksalon.me/sitemap.xml` (staru sitemap adresu, ako je bila dodata, ukloniti). URL Inspection na prvoj objavi > Request indexing. Rich Results Test na adresi objave.
9. Skloni probnu objavu: nestaje sa `/objave` za nekoliko minuta, a direktna adresa vraća 410.
10. Sljedeće jutro: u Drive folderu "Grašak - bekap tabele" xlsx bekap sadrži list "Objave".

## Šta provjera zaustavlja (i na srpskom i na ostalim jezicima)

- Brojka bez izvora (osim vremena, datuma, cijena u eurima, uzrasta, godine i broja salona 069 371 111) i riječi poput "hiljade", "procenat".
- Zdravstvena tvrdnja bez izvora (zdravlje, alergije, infekcije, "kosa raste brže" i slično, na sva četiri jezika).
- Ime ili uzrast djeteta ili roditelja, tuđi broj telefona, email adresa.
- Objava koja prenosi vijest bez naziva i https linka izvora; nepotpun prevod (naslov bez teksta ili obrnuto); tekst koji je još prazan okvir (STUB).
- Duga crta se sama zamjenjuje običnom ("-"). Upozorenja (npr. "najbolji", "garantujemo") ne zaustavljaju, ali traže potvrdu.
- Izvor otključava samo brojke i zdravstvene tvrdnje, nikad lične podatke.

## Šta je NEPROVJERENO (nije se moglo pokrenuti iz ove sesije)

- Pravi Apps Script: UrlFetchApp, tabela, keš, zaključavanje, ovlašćenja i V8 izvršenje regularnih izraza. Provjereno je samo na lažnim servisima (`node scripts/objave-gs-smoke.mjs`) i čiste funkcije (`node scripts/objave-test.mjs`).
- Pravi poziv modela: nazivi modela (`claude-haiku-5-5`, `deepseek-flash`) i polje `output_config` su preuzeti iz huba (provjereno tamo 11.11.2026). Ako Anthropic odbije zahtjev, nacrt padne na DeepSeek, a poruka kaže da model nije odgovorio; naziv se mijenja u Script Properties bez novog koda.
- Vercel: da `rewrites` iz `vercel.json` stižu prije `index.html` pravila i da `req.url` u funkciji nosi upit `?jez=...&slug=...`. Funkcija ima rezervu koja čita jezik i slug i iz putanje.
- Google indeksiranje: `hreflang` za crnogorski je `sr-ME` (kod `cnr` nema u ISO 639-1); da li ga Google prihvata se vidi tek u Search Console.
- Keš: objava je na sajtu za najviše 5 minuta u skripti plus do 5 minuta na Vercel-u (`s-maxage=300`), dakle do oko 10 minuta.
- Prvi poziv skripte poslije mirovanja može trajati nekoliko sekundi; Vercel keš to sakriva od Google-a, a ako skripta ne odgovori, strana vraća 503 (Google ponovi), a sitemap izlazi bez objava na 30 sekundi.

## Vercel

Nijedna varijabla okruženja nije obavezna: adresa skripte je ista kao u `src/lib/zakazivanje.ts`. Opciono: `OBJAVE_API_URL` (adresa web appa za funkcije u `api/`), a ako nje nema koristi se `VITE_ZAKAZIVANJE_API` kad je postavljena. U Vercel se ne upisuje nijedan ključ.

## Ako nešto pođe po zlu

Apps Script > Deploy > Manage deployments > Edit > izabrati prethodnu verziju. List "Objave" ostaje netaknut. Sajt bez skripte prikazuje praznu stranu objava sa porukom, ostali dijelovi sajta se ne mijenjaju.
