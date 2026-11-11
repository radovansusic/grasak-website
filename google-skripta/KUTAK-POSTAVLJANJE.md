# Graškov kutak na grasaksalon.me - postavljanje (Radovan)

Šta se dobija: u panelu (grasaksalon.me/panel) kartica **Kutak**. Kristina nalijepi link ili tekst u jedno polje i pritisne **Pripremi**: sistem pročita izvor, napiše nacrt na crnogorskom, predloži rubriku, vrstu, oznake i okvir "Šta možete uraditi danas", provjeri tekst i pripremi prevode na engleski, ruski i turski. Ona pročita označena mjesta, potvrdi prevode koje hoće (štiklir po jeziku) i pritisne Objavi. Ništa se ne objavljuje bez njenog klika. Ako model ne odgovori, ostaje ručno pisanje.

Javne adrese (strane pravi Vercel funkcija, stvarni HTML za Google): `/kutak` (lista), `/kutak/<slug>`, `/kutak/tema/<rubrika>`, `/kutak/oznaka/<oznaka>`, iste pod `/en`, `/ru`, `/tr` (slug `kutak` je isti na svim jezicima), `/kutak/rss.xml` i `/sitemap.xml`. Filter po vrsti: `?vrsta=savjet` (nije indeksiran).

Grana je `p14-objave`. Ništa nije u `main` i ništa nije objavljeno dok se grana ne spoji.

**Grana se spaja tek poslije koraka sa skriptom (koraci 1 do 5) i jednog probnog teksta (korak 6, tačke 1 do 4).** Razlog: spojena grana bez nove skripte ima panel koji traži verziju `2026-11-11d`, a sajt ne zna da li ima tekstova. Link "Graškov kutak" u meniju, podnožju i na početnoj strani pojavljuje se tek kad javni odgovor skripte vrati bar jedan objavljen tekst (provjera pri učitavanju, pamti se 10 minuta; ako skripta ne odgovara ili je stara, link se ne prikazuje). Strana `/kutak` bez tekstova daje 200 sa mirnom praznom stranom, a 503 samo kad skripta zaista ne odgovara (taj odgovor se ne kešira).

## I na Dječiji kutak (djecijikutak.me)

Šta radi: u kartici Kutak, u dijelu "3. Rubrika, vrsta i oznake", štiklir **I na Dječiji kutak (djecijikutak.me)**. Kad je uključen, objavljeni crnogorski tekst stiže i na Dječiji kutak (blog), jednom na sat, bez ikakvog drugog koraka. Prevodi (EN, RU, TR) ne idu na Kutak: Kutak je jednojezičan. Kristina piše samo ovdje, nikad na Kutku.

Zadane vrijednosti (po rubrici, dok ne klikne sama): uključeno za **Za roditelje, Igraonica, Vijesti za porodice**; isključeno za **Šišanje i njega** (može ručno); **nedostupno** za **Iz Graška** i za vrstu **Iz salona** (termini, radionice i radno vrijeme se odnose na salon), uz objašnjenje u panelu. Skripta to odbija i ako zahtjev stigne mimo panela. Pravila u kodu: `src/data/kutakPravila.js` (panel) i `OBJAVE_KUTAK_RUBRIKE_NE`, `OBJAVE_KUTAK_VRSTE_NE` u `Grasak.gs` (test ih poredi).

Blokade se ne zaobilaze: zdravlje, ime djeteta, brojka ili statistika bez izvora, rizične teme i zdravstvena tvrdnja bez druge potvrde važe prije objave, a skripta ih ponavlja i pri pravljenju odgovora za Kutak (tekst koji danas ne prolazi se ne šalje i vodi se kao povučen).

Šta se mijenja u tabeli: list "Objave" dobija kolonu **Na Kutku** (kolona 30, na kraju; dopisuje se sama pri koraku 2, meni Grasak > Postavi). U njoj je vrijeme kad je štiklir uključen; prazno znači isključeno. Ručno se može upisati "da" ili "ne", ali tekst iz Iz Graška ili Iz salona se ne šalje ni tada.

Kad se tekst pojavljuje:
- Skripta daje tekst na novoj javnoj adresi `?akcija=kutak` (keš do 5 minuta). Kutak ga preuzima jednom na sat. Dakle na Kutku u aplikaciji je najkasnije za oko sat vremena (do ~65 minuta) od klika na Objavi.
- Gotov HTML za pretraživače i statički sitemap Kutka nastaju tek pri sljedećem deployu Kutka (vidi `docs/GRASAK-SYNC-POSTAVLJANJE.md` u repou Kutka). Do tada ga vide aplikacija i dinamički sitemap.
- Javni odgovori skripte (`?akcija=objave` i `?akcija=objava&slug=`) dobijaju dva polja: `na_kutku` (true samo za objavljen, označen tekst iz dozvoljene rubrike) i `kutak_od` (kasnije od uključenja štiklira i objave, plus 2 sata).

Šta se mijenja na Grašku za takav tekst: crnogorska strana `/kutak/<slug>` ostaje čitljiva, ali tek od `kutak_od` nosi `canonical` na `https://djecijikutak.me/blog/<slug>` (isti slug), nema `hreflang` i nije u Graškovom `sitemap.xml`; njegov doprinos ne računa rubrici ni oznaci za indeksiranje. Strane prevoda ostaju samoreferentne, bez `hreflang`. Do `kutak_od` canonical je Graškov, jer Kutkova kopija možda još ne postoji. RSS Graška i dalje ima taj tekst (nije mijenjano).

Kako se povlači (bilo koje od ova dva):
1. **Odštiklirati** na već objavljenom tekstu pa **Objavi izmjene**: tekst nestaje sa Kutka pri sljedećem uvozu (najkasnije za oko sat vremena), a Grašak opet nosi svoj canonical.
2. **Skloni sa sajta**: nestaje sa Graška i sa Kutka (na Kutku postaje neobjavljen, ne briše se). Ponovna objava poslije Skloni otvara novi prozor od 2 sata.
Brisanje reda u tabeli NE povlači tekst sa Kutka: koristite Skloni.

Provjera poslije (uz korake iznad): u pregledniku `<adresa web appa>?akcija=kutak` daje JSON sa `ok: true`, `jezik: "me"`, nizom `objave` (samo označeni tekstovi, polja kao u `docs/GRASAK-SYNC-POSTAVLJANJE.md` u repou Kutka) i nizom `povuceno`; `?akcija=objave` ima `na_kutku` i `kutak_od` uz svaku objavu.

## Taksonomija: gdje se mijenja

Rubrike, vrste teksta i oznake su u jednom mjestu: `google-skripta/Grasak.gs`, blok `OBJAVE-CISTE`, tri tabele `OBJAVE_RUBRIKE`, `OBJAVE_VRSTE`, `OBJAVE_OZNAKE` (svaki red nosi naziv na cnr, en, ru, tr). **Novu rubriku, vrstu ili oznaku dodaje samo urednik**, dodavanjem reda u tabelu (slug: mala slova, bez dijakritika, crtice) i novom verzijom skripte (korak 1 i 3). Panel, sajt i sitemap čitaju tabele iz javnog odgovora skripte, pa se ništa drugo ne mijenja. Skripta odbija svaku vrijednost koje nema u tabeli, i kad stigne od modela i kad stigne ručno.

Pravila: tačno jedna rubrika, jedna vrsta, 2 do 4 oznake (najviše jedna oznaka uzrasta). Savjet i Aktivnost nose okvir "Šta možete uraditi danas" (2 do 3 koraka), Vijest nosi izvor (naziv i https link). Ruski i turski nazivi i opisi su prevodna procjena: prije prve objave ih treba da pročita neko ko govori jezik.

## 1. Zalijepiti novu skriptu (nalog grasaksalon@gmail.com)

1. Otvoriti tabelu "Grašak - termini", pa Extensions > Apps Script.
2. U fajlu `Grasak.gs` označiti sve (Ctrl+A) i zalijepiti cijeli sadržaj fajla `google-skripta/Grasak.gs` iz ove grane. Sačuvati (Ctrl+S).
3. Nova verzija skripte nosi oznaku `2026-11-11d` (`VERZIJA_SKRIPTE`); panel je traži (`OCEKIVANA_VERZIJA_SKRIPTE` u `src/lib/osoblje.ts`).

## 2. List "Objave"

U tabeli: meni **Grasak > 1. Postavi (i poslije svake nove verzije koda)**. Pravi list "Objave" (ime lista ostaje zbog dnevnog bekapa) sa novim kolonama; ako list već postoji sa starim zaglavljem, zaglavlje se dopunjava, podaci ostaju. Ako Google traži ovlašćenje, odobriti (nema novih dozvola).

## 3. Nova verzija deploya (adresa ostaje ista)

1. Apps Script: Deploy > **Manage deployments**.
2. Olovka (Edit) na postojećem web appu, polje Version: **New version**, pa Deploy.
3. Ne praviti "New deployment": to daje novu adresu, a sajt i panel koriste staru.
4. Provjeriti: Execute as = Me (grasaksalon@gmail.com), Who has access = **Anyone**.

## 4. Upisati dva ključa u Script Properties

Apps Script > Project Settings (zupčanik) > Script properties > Add script property:

| Ime | Šta je |
|---|---|
| `ANTHROPIC_API_KEY` | glavni ključ (priprema, nacrt i prevod) |
| `DEEPSEEK_API_KEY` | rezerva, koristi se kad glavni ne odgovori |

Opciono, samo ako se mijenja model: `OBJAVE_MODEL_ANTHROPIC` (zadano `claude-haiku-5-5`), `OBJAVE_MODEL_DEEPSEEK` (zadano `deepseek-flash`). Ključevi se ne šalju mejlom ni porukom i ne upisuju u kod ni u repo. Bez ključa panel to kaže jasnom porukom, a ručno pisanje, čuvanje i objava rade. Pripremi traži 4 poziva modela (nacrt + 3 prevoda); granica je 40 poziva na sat. Pripremi su dva poziva panela: prvi (nacrt, rubrika, oznake, koraci, provjera), drugi (tri prevoda istovremeno). Svaki ima budžet 4 minuta u skripti; ako prevodi ne stignu, crnogorski nacrt se čuva kao nacrt i poruka to kaže, a panel prikazuje tačnu poruku skripte.

## 5. Kristinin red u listu Osoblje

List "Osoblje": Ime (npr. Kristina), Uloga `vlasnik`, Šifra (najmanje 8 znakova; najlakše kroz meni Grasak > Postavi sifru za panel), Aktivan `DA`. Kartica Kutak je vidljiva ulozi `vlasnik` i ulozi `admin` (frizer je ne vidi). Stvarni sadržaj liste Osoblje nije bio dostupan: ako je Kristina upisana kao `admin`, kartica radi i tako.

## 6. Provjeriti poslije (redom)

1. Panel: prijava, kartica **Kutak** se otvara, lista je prazna i bez crvene poruke. Ako piše "traže novu verziju Google skripte", korak 3 nije prošao (New version).
2. Pripremi iz jedne rečenice (bez brojki; mogu se pominjati minuti, sati, dani i cijene u eurima): bez ključa poruka o ključu; sa ključem pregled sa rubrikom, vrstom, oznakama, koracima i prevodima, i žutim okvirom "Traže vašu pažnju".
3. Probni slučaj za blokadu: u tekst upisati "preko 5000 djece" bez izvora, pa Provjera: **Zaustavlja objavu**. Isto za "šampon protiv vaški" (zaustavlja i uz izvor).
4. Potvrditi samo EN, objaviti. U pregledniku otvoriti adresu web appa (`GRASAK_APPS_SCRIPT` iz `src/lib/zakazivanje.ts`) sa `?akcija=objave`: JSON ima samo cnr i en, i `taksonomija`. RU i TR nijesu javni.
5. Poslije spajanja grane i Vercel deploya otvoriti: `/kutak`, `/kutak/<slug>`, `/en/kutak/<slug>`, `/ru/kutak/<slug>` (mora dati 404 dok RU nije potvrđen), `/kutak/tema/<rubrika>`, `/kutak/oznaka/<oznaka>` (noindex dok oznaka nema 5 tekstova), `/kutak/rss.xml`, `/sitemap.xml` (host `grasaksalon.me`).
6. Na strani teksta "View source": `canonical` je `https://grasaksalon.me/...`, `hreflang` samo za jezike koji postoje, `application/ld+json` sa `BlogPosting` (`articleSection`, `keywords`, `datePublished`, `dateModified`).
7. Google Search Console: Sitemaps > `https://grasaksalon.me/sitemap.xml`; URL Inspection na prvom tekstu > Request indexing; Rich Results Test.
8. Skloni probni tekst: nestaje sa liste za nekoliko minuta, direktna adresa vraća 410.
9. Sljedeće jutro: xlsx bekap u Drive folderu "Grašak - bekap tabele" sadrži list "Objave".

## Šta zaustavlja objavu

- Postotak ili statistika (brojka, razlomak ili riječima: "trideset posto", "dvije trećine") bez izvora. Uobičajene količine prolaze bez izvora: minuti, sati, dani, "3 puta", koraci, komadi, uzrast u godinama, cijene u eurima, datum, vrijeme, popust salona u rubrici Iz Graška, broj salona. Tvrdo se zaustavljaju postoci i statistike o djeci, zdravlju i rastu kose.
- Zdravstvena TVRDNJA (liječi, sprječava bolest, ubrzava rast, preporučena doza, dijagnoza) bez izvora, na četiri jezika. Riječ "zdravlje" ili "sprječava dosadu" nije tvrdnja.
- Link otključava brojku ili tvrdnju samo ako je upisan naziv izvora. Zdravstvena tvrdnja ni uz izvor ne izlazi bez druge, izričite potvrde istog urednika: panel traži poseban štiklir ("Ovaj tekst sadrži zdravstvenu tvrdnju. Provjerila sam izvor."), a skripta upisuje ko i kada je potvrdio u kolonu "Zdravlje potvrda" (kolona 29, dopisuje se sama). Zadano je `OBJAVE_ZDRAVLJE_DRUGA_OSOBA = false`; ako se postavi na `true`, potvrdu mora dati druga osoba (vlasnik ili administrator), ne autor teksta.
- **Rizične teme, i uz izvor**: lijekovi i preparati protiv vaški (dozvoljeno samo "posavjetujte se sa pedijatrom", uz izvor), opadanje kose, promjene na koži glave, ishrana "za jaču kosu", tvrdnja da šišanje ubrzava rast kose, dijagnoze i stanja (autizam, ekcem, perut i slično).
- Lično ime samo kad stoji uz oznaku srodstva ili uzrasta u istoj rečenici ("mala Ana (4)", "Markova mama", "naš klijent Luka"); veliko slovo u naslovu ili na početku rečenice nije dovoljno. Provjera ide samo nad jezicima koji idu u objavu (crnogorski i potvrđeni prevodi). Tuđi telefon i email.
- Nepoznata ili nedostajuća rubrika i vrsta, oznaka koje nema na listi ili broj oznaka van 2 do 4, više od jedne oznake uzrasta.
- Savjet ili Aktivnost bez 2 do 3 koraka; Vijest bez naziva i https linka izvora; nepotpun prevod; potvrđen prevod bez koraka; tekst koji je prazan okvir (STUB).
- Upozorenja traže potvrdu: superlativi i garancije, dužina izvan raspona vrste (Savjet 150-400 riječi, Aktivnost 150-300, Vijest 150-300, Članak 600+, Iz salona 100-250), prepisan niz iz izvora, Aktivnost bez oznake uzrasta.
- Prevod bez potvrde ne izlazi (nije greška, samo ostaje nejavan). Izmjena crnogorskog teksta objavljene objave koja ima objavljen prevod: panel pita "Zadrži objavljene prevode" ili "Povuci prevode dok ih ne potvrdim"; nikad se ne odlučuje tiho.
- Provjera prvo normalizuje tekst (NFKC, skriveni znakovi, razmaknuta slova, ćirilična slova u latiničnim riječima), pa se varanje razmacima ili skrivenim znakovima ne propušta.

## Šta ide modelu

Telefon i adresa e-pošte u bilješci se uklanjaju prije slanja modelu, a ime uz oznaku srodstva (npr. "Markova mama") zaustavlja poziv uz poruku da ga treba izbrisati. Lično ime urednika nije u uputstvu modelu. Link izvora (`izvor_url`) čuva se i prikazuje samo ako je https; `javascript:` i `http:` se odbacuju u skripti i pri prikazu.

Stalni red "Ovaj tekst nije medicinski savjet. Za zdravstvena pitanja obratite se pedijatru." (i prevodi) dodaje sajt na dno svakog teksta iz rubrika Šišanje i njega i Za roditelje, svakog teksta u kojem se pominje zdravlje i svakog sa oznakom "vaške". Ne upisuje se u tekst.

## Indeksiranje

- Lista `/kutak` i strana rubrike su indeksirane i u sitemap-u samo ako imaju bar jedan tekst na tom jeziku; prazna rubrika je `noindex,follow`.
- Strana oznake postoji uvijek, ali je `noindex,follow` i van sitemap-a dok oznaka nema 5 tekstova na tom jeziku.
- `?vrsta=` nije indeksiran (canonical na osnovnu stranu).
- Prevod koji Kristina nije potvrdila nema stranu ni hreflang. Hreflang (sr-ME, en, ru, tr, x-default na crnogorski) samo među stvarnim prevodima istog teksta; lista, rubrika i oznaka nemaju hreflang.

## Šta je NEPROVJERENO (nije se moglo pokrenuti iz ove sesije)

- Pravi Apps Script: UrlFetchApp, tabela, keš, zaključavanje, ovlašćenja i V8 izvršenje regularnih izraza sa ćirilicom i dijakriticima. Provjereno samo na lažnim servisima (`node scripts/objave-gs-smoke.mjs`) i čiste funkcije (`node scripts/objave-test.mjs`).
- Pravi poziv modela: nazivi (`claude-haiku-5-5`, `deepseek-flash`) i `output_config` su preuzeti iz huba. Kvalitet crnogorskog nacrta, prepoznavanje rubrike i oznaka, prevoda na ru i tr, i ponašanje sa dugim stranim člancima nijesu viđeni.
- Vercel: da `rewrites` stižu prije `index.html` pravila, da `req.url` nosi upit (funkcija ima rezervu iz putanje), da funkcije u `api/` rade uz `"type": "module"`, da CSP ne smeta stranama iz funkcije.
- Izgled u pregledniku: strane iz funkcije (dugmad u boji rubrike, kartice, okvir "Šta možete uraditi danas") i kartica Kutak u panelu nijesu otvarane u browseru; boje su provjerene računom kontrasta, ne okom.
- Google: prihvatanje `hreflang` `sr-ME`, indeksiranje, Search Console.
- Keš: do oko 10 minuta od objave do sajta (5 min skripta + 5 min Vercel).
- Uvoz na Dječiji kutak (štiklir, `?akcija=kutak`, `na_kutku`, `kutak_od`, canonical): provjereno samo na lažnim servisima (`node scripts/objave-gs-smoke.mjs`) i čistim funkcijama; nije viđeno na pravom Apps Scriptu ni na pravoj Kutkovoj bazi. Canonical preko domena je za Google nagovještaj, ne naredba.
- Javno čitanje (`?akcija=objave`) nikad ne pravi ni ne mijenja list "Objave"; samo korak 2 (meni Grasak > Postavi) i panel ga prave. Ako lista nema, javni odgovor je prazna lista.
- Vremenski budžet 240 s i paralelni prevodi (`UrlFetchApp.fetchAll`) provjereni samo na lažnom servisu, ne na pravom Apps Scriptu.

## Vercel

Nijedna varijabla okruženja nije obavezna: adresa skripte je ista kao u `src/lib/zakazivanje.ts`. Opciono `OBJAVE_API_URL`, a ako nje nema koristi se `VITE_ZAKAZIVANJE_API` kad je postavljena. U Vercel se ne upisuje nijedan ključ. Stare adrese `/objave` ne postoje (grana nije bila objavljena).

## Ako nešto pođe po zlu

Apps Script > Deploy > Manage deployments > Edit > prethodna verzija. List "Objave" ostaje netaknut. Ako skripta ne odgovara (rok 8 sekundi), strane Kutka prikazuju zadnju uspješnu listu iz keša instance (do 24 sata, sa kratkim kešom od 30 sekundi); bez nje vraćaju 503 sa `no-store`. Sitemap izlazi bez Kutka. Ostali dijelovi sajta se ne mijenjaju. Radno vrijeme i adresa u Kutku čitaju se iz `src/data/salon.js`, istog izvora kao ostatak sajta.
