// Provjera čistih funkcija Graškovog kutka, bez Google okruženja i bez Vercel-a:  node scripts/objave-test.mjs
//  1) čiste funkcije iz google-skripta/Grasak.gs (blok OBJAVE-CISTE) se izvlače i pokreću u Node vm-u: taksonomija, provjera, rizične teme, slug, adrese, nalozi
//  2) api/_lib/kutak.js: render HTML-a (sve cjeline strane teksta), indeksiranje, hreflang, RSS, sitemap, rute, funkcije api/*.js sa lažnim fetch-om
// NIJE provjereno ovim skriptom: UrlFetchApp, SpreadsheetApp, CacheService, poziv modela, Vercel rewrite-ovi (traže živu skriptu i Vercel).
import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const koren = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
let prosli = 0
// vm daje nizove i objekte iz drugog "realma": poredi se kroz JSON
const jeste = (a, b, poruka) => assert.equal(JSON.stringify(a), JSON.stringify(b), poruka)
const zadaci = []
const t = (naziv, fn) => { zadaci.push(Promise.resolve().then(fn).then(() => { prosli++ }, (e) => { console.error('PAO: ' + naziv + '\n  ' + (e.message || e)); process.exitCode = 1 })) }

/* ---------- 1) Grasak.gs ---------- */
const gs = fs.readFileSync(path.join(koren, 'google-skripta/Grasak.gs'), 'utf8')
const a = gs.indexOf('// ===== OBJAVE-CISTE-POCETAK')
const b = gs.indexOf('// ===== OBJAVE-CISTE-KRAJ')
assert.ok(a > 0 && b > a, 'markeri bloka OBJAVE-CISTE nijesu nađeni u Grasak.gs')
const ctx = vm.createContext({})
const F = vm.runInContext(gs.slice(a, b) + `\n;({ objaveCisti_, objaveSlug_, objaveBrojke_, objaveLicno_, objaveProvjeri_, objaveSigurnaAdresa_, objavePreusmjerenje_, objaveNajduziNiz_, objaveParsirajOdgovor_, objaveClanak_, objaveOpis_, objaveNalogNacrt_, objaveNalogPrevod_, objaveHttps_, OBJAVE_JEZICI, objaveRizicno_, objaveSaListe_, objaveNepoznato_, objaveUnos_, objaveJezikIzvora_, objaveKodJezika_, objaveMinuta_, objaveRecenica_, objaveTrebaNapomenu_, objaveTaksonomija_, objaveKoraci_ })`, ctx)
const EM = String.fromCharCode(0x2014)
const TAX = JSON.parse(JSON.stringify(F.objaveTaksonomija_()))

const IZVOR = { izvor_naziv: 'Pedijatrija.me', izvor_url: 'https://pedijatrija.me/clanak' }
const K2 = ['Pitajte dijete šta mu treba.', 'Dogovorite mali znak za pauzu.']
// ispravna objava: rubrika, vrsta, 2 oznake, 2 koraka; ekstra i tijelo se preklapaju preko osnove
const objava = (cnr, ekstra = {}, tijelo = {}) => ({
  vrsta: 'savjet', rubrika: 'igraonica', oznake: ['igre-u-kuci', 'uzrast-3-6'],
  naslov: { cnr: 'Naslov objave', en: '', ru: '', tr: '' },
  tijelo: { cnr, en: '', ru: '', tr: '', ...tijelo },
  koraci: { cnr: K2, en: [], ru: [], tr: [] }, potvrda: {},
  ...ekstra,
})
const DUG = ' Kratka, topla objava za roditelje mališana koja ima dovoljno znakova za provjeru.'
const pravila = (o) => F.objaveProvjeri_(o).blokirano.map((x) => x.pravilo.split(' (')[0])
const greske = (o) => JSON.parse(JSON.stringify(F.objaveProvjeri_(o).greske))
const rijeci = (n) => Array.from({ length: n }, (_, i) => 'riječ' + String.fromCharCode(97 + (i % 7))).join(' ') + '.'

t('slug: dijakritici, ćirilica, crtice, dužina, rezerva, rezervisane adrese', () => {
  assert.equal(F.objaveSlug_('Nove cijene od 1. oktobra!'), 'nove-cijene-od-1-oktobra')
  assert.equal(F.objaveSlug_('Šišanje za mališane - đurđevdan'), 'sisanje-za-malisane-djurdjevdan')
  assert.equal(F.objaveSlug_('Ђак први пут'), 'djak-prvi-put')
  const dug = F.objaveSlug_('riječ '.repeat(40))
  assert.ok(dug.length <= 70 && !dug.endsWith('-') && /^[a-z0-9-]+$/.test(dug))
  assert.equal(F.objaveSlug_('!!', 'abcd1234ef'), 'objava-abcd1234')
  assert.equal(F.objaveSlug_('Tema'), 'tema-tekst'); assert.equal(F.objaveSlug_('Oznaka'), 'oznaka-tekst')   // /kutak/tema/... i /kutak/oznaka/...
})

t('čišćenje: duga crta, podebljanje, naslovi', () => {
  assert.equal(F.objaveCisti_('Dobro' + EM + 'došli'), 'Dobro - došli')
  assert.equal(F.objaveCisti_('**Važno** je\n\n\n\n# Naslov'), 'Važno je\n\nNaslov')
})

t('taksonomija: 5 rubrika, 5 vrsta, 20 oznaka, prevodi na 4 jezika, tačno 4 oznake uzrasta', () => {
  assert.equal(TAX.rubrike.length, 5); assert.equal(TAX.vrste.length, 5); assert.equal(TAX.oznake.length, 20)
  jeste(TAX.rubrike.map((r) => r.slug), ['sisanje-i-njega', 'igraonica', 'za-roditelje', 'vijesti-za-porodice', 'iz-graska'])
  jeste(TAX.vrste.map((v) => v.naziv.cnr), ['Savjet', 'Aktivnost', 'Vijest', 'Članak', 'Iz salona'])
  for (const x of [...TAX.rubrike, ...TAX.vrste, ...TAX.oznake]) for (const j of ['cnr', 'en', 'ru', 'tr']) assert.ok(x.naziv[j] && x.naziv[j].length > 1, x.slug + ' ' + j)
  for (const r of TAX.rubrike) for (const j of ['cnr', 'en', 'ru', 'tr']) assert.ok(r.opis[j].length > 20)
  assert.equal(TAX.rubrike[0].naziv.en, 'Haircuts & Hair Care'); assert.equal(TAX.rubrike[4].naziv.ru, 'Из «Грашка»')
  assert.equal(TAX.oznake.filter((o) => o.grupa === 'uzrast').length, 4)
  for (const x of [...TAX.rubrike, ...TAX.vrste, ...TAX.oznake]) assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug))
  jeste(TAX.vrste.map((v) => [v.min, v.max]), [[150, 400], [150, 300], [150, 300], [600, 0], [100, 250]])
  assert.equal(TAX.zdravlje_napomena.cnr, 'Ovaj tekst nije medicinski savjet. Za zdravstvena pitanja obratite se pedijatru.')
  assert.ok(TAX.zdravlje_napomena.en && TAX.zdravlje_napomena.ru && TAX.zdravlje_napomena.tr)
})

t('nepoznata rubrika, vrsta i oznaka se odbijaju (nepoznato i u provjeri), prazno je dozvoljeno u nacrtu', () => {
  jeste(F.objaveNepoznato_({ rubrika: 'kuhinja', vrsta: 'savjet', oznake: ['igre-u-kuci'] }), ['Nepoznata rubrika: kuhinja'])
  jeste(F.objaveNepoznato_({ rubrika: 'igraonica', vrsta: 'reportaza', oznake: [] }), ['Nepoznata vrsta teksta: reportaza'])
  jeste(F.objaveNepoznato_({ rubrika: 'igraonica', vrsta: 'savjet', oznake: ['igre-u-kuci', 'nova-oznaka'] }), ['Nepoznata oznaka: nova-oznaka'])
  jeste(F.objaveNepoznato_({ rubrika: '', vrsta: '', oznake: [] }), [])
  assert.match(greske(objava('Tekst.' + DUG, { rubrika: 'kuhinja' })).rubrika, /Nepoznata rubrika/)
  assert.match(greske(objava('Tekst.' + DUG, { vrsta: 'reportaza' })).vrsta, /Nepoznata vrsta/)
  assert.match(greske(objava('Tekst.' + DUG, { oznake: ['igre-u-kuci', 'nova-oznaka'] })).oznake, /Nepoznata oznaka/)
  jeste(greske(objava('Tekst.' + DUG)), {})
})

t('predlog modela svodi se na listu: nepoznato otpada, najviše jedan uzrast, najviše 4 oznake', () => {
  const r = JSON.parse(JSON.stringify(F.objaveSaListe_('igraonica', 'reportaza', ['igre-u-kuci', 'izmisljena', 'uzrast-1-3', 'uzrast-3-6', 'praznici', 'vrtic', 'skola'])))
  assert.equal(r.rubrika, 'igraonica'); assert.equal(r.vrsta, '')
  jeste(r.oznake, ['igre-u-kuci', 'uzrast-1-3', 'praznici', 'vrtic'])
  assert.ok(r.odbaceno.some((x) => /vrsta/.test(x)) && r.odbaceno.some((x) => /izmisljena/.test(x)) && r.odbaceno.some((x) => /druga oznaka uzrasta/.test(x)) && r.odbaceno.some((x) => /višak/.test(x)))
})

t('oznake: 2 do 4, najviše jedna oznaka uzrasta; rubrika i vrsta obavezne', () => {
  assert.match(greske(objava('Tekst.' + DUG, { oznake: ['igre-u-kuci'] })).oznake, /2 do 4/)
  assert.match(greske(objava('Tekst.' + DUG, { oznake: ['igre-u-kuci', 'praznici', 'vrtic', 'skola', 'rodjendani'] })).oznake, /2 do 4/)
  assert.match(greske(objava('Tekst.' + DUG, { oznake: ['uzrast-0-1', 'uzrast-1-3'] })).oznake, /jedna oznaka uzrasta/)
  jeste(greske(objava('Tekst.' + DUG, { oznake: ['uzrast-0-1', 'praznici', 'vrtic', 'skola'] })), {})
  assert.ok(greske(objava('Tekst.' + DUG, { rubrika: '' })).rubrika && greske(objava('Tekst.' + DUG, { vrsta: '' })).vrsta)
})

t('okvir "Šta možete uraditi danas": obavezan za Savjet i Aktivnost, 2 do 3 koraka, isti broj u potvrđenom prevodu', () => {
  assert.ok(greske(objava('Tekst.' + DUG, { koraci: { cnr: [], en: [], ru: [], tr: [] } })).koraci_cnr)
  assert.ok(greske(objava('Tekst.' + DUG, { vrsta: 'aktivnost', koraci: { cnr: [] } })).koraci_cnr)
  jeste(greske(objava('Tekst.' + DUG, { vrsta: 'iz-salona', koraci: { cnr: [] } })), {})   // nije obavezno
  assert.ok(greske(objava('Tekst.' + DUG, { koraci: { cnr: ['jedan korak'] } })).koraci_cnr)
  assert.ok(greske(objava('Tekst.' + DUG, { koraci: { cnr: ['a1', 'b2', 'c3', 'd4'] } })).koraci_cnr)
  const en = { naslov: { cnr: 'Naslov objave', en: 'Title', ru: '', tr: '' }, tijelo: { cnr: 'Tekst.' + DUG, en: 'A short warm text for parents of little ones.', ru: '', tr: '' } }
  assert.ok(greske(objava('x', { ...en, potvrda: { en: true } })).koraci_en)          // potvrđen prevod bez koraka
  jeste(greske(objava('x', { ...en, potvrda: { en: false } })), {})                    // nepotvrđen: samo se ne objavljuje
  assert.ok(greske(objava('x', { ...en, potvrda: { ru: true } })).potvrda_ru)          // ne može se potvrditi prevod koji ne postoji
})

t('dužina prema vrsti je upozorenje, ne zabrana', () => {
  const u = (n, vrsta) => F.objaveProvjeri_(objava(rijeci(n), { vrsta })).upozorenja.filter((x) => /riječi/.test(x))
  assert.equal(u(200, 'savjet').length, 0); assert.equal(u(100, 'savjet').length, 1); assert.equal(u(450, 'savjet').length, 1)
  assert.equal(u(700, 'clanak').length, 0); assert.equal(u(300, 'clanak').length, 1)
  assert.equal(u(120, 'iz-salona').length, 0); assert.equal(u(80, 'iz-salona').length, 1)
  jeste(F.objaveProvjeri_(objava(rijeci(100), { vrsta: 'savjet' })).blokirano, [])
})

t('brojke bez izvora: blokirano; vrijeme, datum, cijena, uzrast, broj salona prolaze', () => {
  assert.ok(pravila(objava('Kosa djetetu raste do 30% brže.' + DUG)).includes('brojka bez izvora'))
  assert.ok(pravila(objava('Preko 5000 djece nam vjeruje.' + DUG)).includes('brojka bez izvora'))
  assert.ok(pravila(objava('Hiljade porodica nam vjeruje.' + DUG)).includes('brojka bez izvora'))
  jeste(F.objaveBrojke_('Radimo od 15:00 do 21:00. Kratko šišanje 9€, srednje 11 eura. Od 1. oktobra, 13.11.2026. Za djecu od 2 godine. Zovite 069 371 111. Godina 2026. Termini 15-21 h.'), [])
  jeste(F.objaveBrojke_('Open from October 1, price 9 EUR, ages 3-12 years, 2026-11-11.'), [])
  jeste(F.objaveBrojke_('Мы работаем с 15:00 до 21:00, 1 октября.'), [])
  assert.ok(pravila(objava('Tekst.' + DUG, { koraci: { cnr: ['Uradite to 3 puta dnevno.', 'Druga stvar.'] } })).includes('brojka bez izvora'))   // brojke u koracima se isto provjeravaju
})

t('zdravstvene tvrdnje bez izvora: blokirano na sva četiri jezika', () => {
  assert.ok(pravila(objava('Kosa raste brže u prvim godinama.' + DUG)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(objava('Zdravlje kose počinje redovnim šišanjem.' + DUG)).includes('zdravstvena tvrdnja bez izvora'))
  const prevodi = (en, ru, tr) => ({ ...objava('Kratka, topla objava za roditelje mališana, bez ičega spornog u tekstu.'), naslov: { cnr: 'Naslov objave', en: 'Title', ru: 'Заголовок', tr: 'Başlık' }, tijelo: { cnr: 'Kratka, topla objava za roditelje mališana, bez ičega spornog u tekstu.', en, ru, tr } })
  const cisto = prevodi('A short, warm post for parents of little ones, nothing disputable in it.', 'Короткая тёплая публикация для родителей малышей, ничего спорного.', 'Miniklerin ebeveynleri için kısa ve sıcak bir yazı, tartışmalı bir şey yok.')
  jeste(F.objaveProvjeri_(cisto).blokirano, [])
  assert.ok(pravila(prevodi('Hair grows faster in children, a short text for parents.', cisto.tijelo.ru, cisto.tijelo.tr)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(prevodi(cisto.tijelo.en, 'Волосы растут быстрее у детей, короткий текст для родителей.', cisto.tijelo.tr)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(prevodi(cisto.tijelo.en, 'Здоровье волос начинается с регулярной стрижки, коротко для родителей.', cisto.tijelo.tr)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(prevodi(cisto.tijelo.en, cisto.tijelo.ru, 'Saçlar daha hızlı uzar, ebeveynler için kısa bir yazı.')).includes('zdravstvena tvrdnja bez izvora'))
  jeste(F.objaveProvjeri_(objava('A little bit of fun.' + DUG)).blokirano, [])   // "bit" nije tvrdnja
})

t('sa izvorom: brojka i zdravstvena tvrdnja prolaze, ali lični podaci i rizične teme ne', () => {
  jeste(F.objaveProvjeri_(objava('Kosa raste do 30% brže u prvim godinama, kaže studija.' + DUG, { ...IZVOR, vrsta: 'vijest' })).blokirano.filter((x) => x.pravilo.startsWith('brojka') || x.pravilo.startsWith('zdravstvena')), [])
  assert.ok(pravila(objava('Dječak Luka je bio hrabar.' + DUG, IZVOR)).includes('lični podaci nijesu dozvoljeni'))
  assert.ok(pravila(objava('Šampon protiv vaški ubija sve.' + DUG, IZVOR)).includes('rizična tema, ne objavljuje se ni uz izvor'))
})

t('rizične teme (nalog modela i provjera): lijekovi protiv vaški, opadanje kose, koža glave, ishrana za kosu, šišanje ubrzava rast, dijagnoze', () => {
  const R = (s) => JSON.parse(JSON.stringify(F.objaveRizicno_(s)))
  assert.match(R('Preparat protiv vaški kupite u apoteci.')[0], /lijekovi i preparati protiv vaški/)
  assert.match(R('Which shampoo kills head lice best?')[0], /vaški/)
  assert.match(R('Лекарство от вшей нужно купить.')[0], /vaški/)
  assert.match(R('Djeca u vrtiću često imaju vaške. Posavjetujte se sa pedijatrom.').join(), /^$/)           // samo savjet pedijatru: čisto
  assert.ok(R('Opadanje kose kod djece je rijetko.').some((x) => /opadanje kose/.test(x)))
  assert.ok(R('Hair loss in toddlers.').some((x) => /opadanje/.test(x)) && R('Выпадение волос у детей.').some((x) => /opadanje/.test(x)) && R('Saç dökülmesi çocuklarda.').some((x) => /opadanje/.test(x)))
  assert.ok(R('Primijetite li crvenilo na koži glave, javite se.').some((x) => /koži glave/.test(x)))
  assert.ok(R('Itchy scalp and a rash.').some((x) => /koži glave/.test(x)))
  assert.ok(R('Ishrana bogata cinkom daje jaču kosu.').some((x) => /ishrana/.test(x)))
  assert.ok(R('Vitamini za kosu i dobra prehrana.').some((x) => /ishrana/.test(x)))
  assert.ok(R('Šišanje ubrzava rast kose.').some((x) => /šišanje ubrzava rast/.test(x)))
  assert.ok(R('Cutting makes hair grow faster.').some((x) => /šišanje ubrzava/.test(x)))
  assert.ok(R('Dijagnoza je ekcem.').some((x) => /dijagnoze/.test(x)) && R('Dijete ima autizam.').some((x) => /dijagnoze/.test(x)))
  // čisto: tekst o radu salona, tempu, pauzama
  jeste(R('Mi radimo polako. Pravimo pauze, a dijete može da odustane. Šišanje traje kratko, kosa se vidi bolje.'), [])
  jeste(R('Čitajte priču dok dijete sjedi. Doručak je važan. Vaš termin je u 15 sati.'), [])
  // nalog modela ih pominje
  const nalog = F.objaveNalogNacrt_()
  for (const k of ['vaški', 'opadanje kose', 'koži glave', 'ishrana', 'ubrzava rast', 'dijagnoze']) assert.ok(nalog.includes(k), 'nalog bez: ' + k)
})

t('lični podaci: ime djeteta ili roditelja, telefon, email', () => {
  assert.ok(F.objaveLicno_('Dječak Luka je prvi put sjeo u autić.').length)
  assert.ok(F.objaveLicno_('Hvala mama Ana na povjerenju.').length)
  assert.ok(F.objaveLicno_('Our little girl Mia loved it.').length)
  assert.ok(F.objaveLicno_('Marko, 4 godine, nije plakao.').length)
  assert.ok(F.objaveLicno_('Javite se na 067 123 456.').length)
  assert.ok(F.objaveLicno_('Pišite na neko.ime@gmail.com').length)
  jeste(F.objaveLicno_('Mama i tata mogu da sjede pored djeteta. Zovite 069 371 111. Najbolji doček u Grašku. Djeca Crne Gore, dijete Podgorice.'), [])
})

t('izvor: obavezan za vrstu Vijest; https; naziv uz link', () => {
  assert.ok(greske(objava('Vijest iz svijeta.' + DUG, { vrsta: 'vijest', rubrika: 'vijesti-za-porodice' })).izvor_naziv)
  assert.ok(greske(objava('Tekst.' + DUG, { izvor_naziv: 'X', izvor_url: 'http://x.me/a' })).izvor_url)
  assert.ok(greske(objava('Tekst.' + DUG, { izvor_url: 'https://x.me/a' })).izvor_naziv)
  jeste(greske(objava('Tekst.' + DUG, { vrsta: 'vijest', ...IZVOR })), {})
})

t('provjera: prekratko, nepotpun prevod, STUB, upozorenje', () => {
  assert.ok(greske(objava('Kratko.')).tijelo_cnr)
  assert.ok(greske(objava('Tekst.' + DUG, {}, { en: 'Samo tijelo bez naslova, dovoljno dugo za provjeru.' })).tijelo_en)
  assert.ok(pravila(objava('[STUB - model nije povezan]' + DUG)).some((x) => x.startsWith('nacrt je prazan okvir')))
  assert.ok(F.objaveProvjeri_(objava('Naš najbolji frizer čeka vas.' + DUG)).upozorenja.some((x) => /superlativ/.test(x)))
  assert.ok(F.objaveProvjeri_(objava('Tekst.' + DUG, { vrsta: 'aktivnost', oznake: ['igre-u-kuci', 'praznici'] })).upozorenja.some((x) => /oznake uzrasta/.test(x)))
})

t('stalni red "nije medicinski savjet": rubrike Šišanje i njega / Za roditelje, vaške, zdravlje u tekstu', () => {
  const n = (rubrika, tijelo = 'Igra sa balonima za kišni dan.', oznake = ['igre-u-kuci']) => F.objaveTrebaNapomenu_({ rubrika, oznake, naslov: { cnr: 'x' }, tijelo: { cnr: tijelo }, koraci: {} })
  assert.equal(n('sisanje-i-njega'), true); assert.equal(n('za-roditelje'), true)
  assert.equal(n('igraonica'), false); assert.equal(n('iz-graska'), false)
  assert.equal(n('igraonica', 'Igra sa balonima.', ['vaske', 'praznici']), true)
  assert.equal(n('vijesti-za-porodice', 'Pedijatri upozoravaju roditelje na infekcije u vrtićima.'), true)
})

t('vrijeme čitanja i jedna rečenica za karticu', () => {
  assert.equal(F.objaveMinuta_(rijeci(50), []), 1); assert.equal(F.objaveMinuta_(rijeci(200), []), 1); assert.equal(F.objaveMinuta_(rijeci(201), []), 2); assert.equal(F.objaveMinuta_(rijeci(390), ['a b c ' + 'x '.repeat(20)]), 3)
  assert.equal(F.objaveRecenica_('Prva rečenica je dovoljno duga da stane. Druga rečenica ide dalje.'), 'Prva rečenica je dovoljno duga da stane.')
  assert.ok(F.objaveRecenica_('riječ '.repeat(100)).length <= 160)
})

t('jedno polje: link ILI tekst (prepoznavanje)', () => {
  jeste(F.objaveUnos_('https://portal.me/clanak?id=1'), { link: 'https://portal.me/clanak?id=1', biljeska: '' })
  jeste(F.objaveUnos_('  https://portal.me/a \n Naglasi savjet o rutini.'), { link: 'https://portal.me/a', biljeska: 'Naglasi savjet o rutini.' })
  jeste(F.objaveUnos_('Od sutra radimo i nedjeljom, vidi https://portal.me/a'), { link: '', biljeska: 'Od sutra radimo i nedjeljom, vidi https://portal.me/a' })
  jeste(F.objaveUnos_('Samo tekst bilješke.'), { link: '', biljeska: 'Samo tekst bilješke.' })
})

t('jezik izvora: engleski, ruski, turski, crnogorski, kod jezika', () => {
  assert.equal(F.objaveJezikIzvora_('Children and their parents often find the first haircut hard, and the best advice is to go slowly with the child.'), 'en')
  assert.equal(F.objaveJezikIzvora_('Родители часто не знают, как подготовить ребёнка к первой стрижке в парикмахерской.'), 'ru')
  assert.equal(F.objaveJezikIzvora_('Çocuğunuzun ilk saç kesimi için hazırlanırken şunlara dikkat edin.'), 'tr')
  assert.equal(F.objaveJezikIzvora_('Dijete je prvi put u salonu i roditelji se pitaju kako da se pripreme za to.'), 'sr')
  assert.equal(F.objaveKodJezika_('EN'), 'en'); assert.equal(F.objaveKodJezika_('english language'), ''); assert.equal(F.objaveKodJezika_(''), '')
})

t('adresa članka (zaštita od SSRF): samo javni https domen', () => {
  assert.equal(F.objaveSigurnaAdresa_('https://www.example.com/clanak?id=1').host, 'www.example.com')
  for (const lose of ['http://example.com/', 'https://127.0.0.1/', 'https://2130706433/', 'https://localhost/', 'https://user:pw@example.com/', 'https://example.com:8080/', 'https://10-0-0-1.nip.io/', 'https://intranet.corp/', 'https://grasaksalon.me/', 'https://script.google.com/x', 'https://[::1]/', 'ftp://example.com', 'https://jedna/']) {
    assert.equal(F.objaveSigurnaAdresa_(lose), null, lose)
  }
  assert.equal(F.objavePreusmjerenje_('https://example.com/a', '/b'), 'https://example.com/b')
  assert.equal(F.objavePreusmjerenje_('https://example.com/a', '//evil.com/b'), null)
  assert.equal(F.objavePreusmjerenje_('https://example.com/a', 'b'), null)
})

t('izvlačenje članka, parsiranje odgovora modela, opis, preklapanje', () => {
  const c = F.objaveClanak_('<html><head><title>Naslov &amp; više</title><meta property="og:site_name" content="Portal"></head><body><nav>meni meni meni meni meni meni meni</nav><p>Ovo je dovoljno dug red teksta iz članka koji ostaje.</p><script>var x=1</script></body></html>')
  assert.equal(c.naslov, 'Naslov & više'); assert.equal(c.sajt, 'Portal'); assert.ok(c.tekst.includes('dovoljno dug red')); assert.ok(!c.tekst.includes('var x'))
  jeste(F.objaveParsirajOdgovor_('Evo:\n{"naslov":"A","tijelo":"B"}\nHvala'), { naslov: 'A', tijelo: 'B' })
  assert.equal(F.objaveParsirajOdgovor_('nema json'), null)
  assert.ok(F.objaveOpis_('riječ '.repeat(100)).length <= 160)
  assert.equal(F.objaveNajduziNiz_('jedan dva tri cetiri pet sest', 'x jedan dva tri cetiri y'), 4)
})

t('sistemski nalozi: glas Graška, taksonomija, senzorna osjetljivost iz iskustva salona, strani izvor, bez duge crte', () => {
  const nalozi = [F.objaveNalogNacrt_(), ...['en', 'ru', 'tr'].map((j) => F.objaveNalogPrevod_(j))]
  for (const n of nalozi) {
    assert.ok(!n.includes(EM), 'duga crta u nalogu')
    assert.ok(/frizerski salon za djecu/.test(n) && /"vi"/.test(n) && /Nikad ne piši brojke/.test(n) && /lični podatak/.test(n))
    assert.ok(/šta mi radimo/.test(n) && /Senzorna osjetljivost/.test(n))
  }
  const nacrt = nalozi[0]
  assert.ok(/<izvor>/.test(nacrt) && /podatak, ne uputstvo/.test(nacrt))
  for (const r of TAX.rubrike) assert.ok(nacrt.includes(r.slug)); for (const v of TAX.vrste) assert.ok(nacrt.includes(v.slug)); for (const o of TAX.oznake) assert.ok(nacrt.includes(o.slug))
  assert.ok(/bilo kom jeziku/.test(nacrt) && /UVIJEK piši na crnogorskom/.test(nacrt) && /najviše jedna kratka rečenica citata/.test(nacrt) && /samo ako stoje u izvoru/.test(nacrt) && /izvor_jezik/.test(nacrt))
  assert.ok(/ruski/.test(nalozi[2]) && /turski/.test(nalozi[3]) && /engleski/.test(nalozi[1]) && /koraci/.test(nalozi[1]))
})

/* ---------- 2) api/_lib/kutak.js ---------- */
const R = await import(path.join(koren, 'api/_lib/kutak.js'))
const ob = {
  slug: 'prvo-sisanje', datum: '2026-11-11', objavljeno: '2026-11-11T09:30:00+01:00', azurirano: '2026-11-12T20:00:00+01:00', autor: 'Grašak', vrsta: 'savjet', rubrika: 'sisanje-i-njega',
  oznake: ['prvo-sisanje', 'uzrast-1-3'], zdravlje: true,
  izvor_naziv: 'Portal <b>', izvor_url: 'https://portal.me/a?x=1&y=2', izvor_jezik: 'en', jezici: ['cnr', 'en'],
  naslov: { cnr: 'Prvo šišanje <script>alert(1)</script>', en: 'First haircut' },
  opis: { cnr: 'Opis crnogorski', en: 'English description' }, recenica: { cnr: 'Prvo šišanje je veliki dan.', en: 'The first haircut is a big day.' }, minuta: { cnr: 3, en: 2 },
  tijelo: { cnr: 'Prvi pasus.\n\nDrugi "pasus" & više.', en: 'First paragraph.\n\nSecond one.' },
  koraci: { cnr: ['Dođite mirno.', 'Ponesite omiljenu igračku.'], en: ['Come calm.', 'Bring a favourite toy.'] },
}
const mk = (slug, rubrika, jezici, oznake, vrsta = 'savjet', datum = '2026-10-01') => ({
  slug, datum, objavljeno: datum + 'T10:00:00+01:00', azurirano: datum + 'T10:00:00+01:00', vrsta, rubrika, oznake, zdravlje: false, jezici,
  naslov: Object.fromEntries(jezici.map((j) => [j, 'Naslov ' + slug + ' ' + j])), opis: Object.fromEntries(jezici.map((j) => [j, 'o'])),
  recenica: Object.fromEntries(jezici.map((j) => [j, 'Rečenica ' + slug + '.'])), minuta: Object.fromEntries(jezici.map((j) => [j, 1])),
})
const povezani = [mk('p1', 'sisanje-i-njega', ['cnr', 'en'], ['njega-kose']), mk('p2', 'sisanje-i-njega', ['cnr'], ['njega-kose']), mk('p3', 'sisanje-i-njega', ['cnr', 'en'], ['vaske']),
  mk('p4', 'sisanje-i-njega', ['cnr'], ['vaske']), mk('d1', 'igraonica', ['cnr'], ['igre-u-kuci'])]
const LISTA = [{ ...ob, tijelo: undefined, koraci: undefined }, ...povezani]

t('strana teksta: rubrika (veza), naslov, datum i ažurirano, vrijeme čitanja, tekst, okvir, izvor, stalni red, oznake, dugme, tri povezana', () => {
  const h = R.renderObjava(ob, 'cnr', TAX, LISTA)
  const poredak = ['href="/kutak/tema/sisanje-i-njega"', '<h1>', '<time datetime="2026-11-11T09:30:00+01:00">', 'Ažurirano:', '3 min čitanja', '<p>Prvi pasus.</p>', 'Šta možete uraditi danas', '<li>Dođite mirno.</li>', 'class="izvor"', 'Ovaj tekst nije medicinski savjet. Za zdravstvena pitanja obratite se pedijatru.', 'href="/kutak/oznaka/prvo-sisanje"', 'href="/zakazi"', 'Još iz rubrike']
  let od = 0
  for (const dio of poredak) { const i = h.indexOf(dio, od); assert.ok(i >= 0, 'nedostaje ili je van redoslijeda: ' + dio); od = i }
  assert.equal((h.match(/class="n" href="\/kutak\/p\d"/g) || []).length, 3)    // tri povezana, iz iste rubrike (p1..p4; d1 je iz druge rubrike)
  assert.ok(!h.includes('/kutak/d1') && !h.includes('href="/kutak/prvo-sisanje"'))
  assert.ok(h.includes('href="/kutak/oznaka/uzrast-1-3"') && h.includes('>prvo šišanje<'))
  assert.ok(h.includes('hreflang="en" lang="en"') && h.includes('(EN)'))        // izvor ostaje original sa oznakom jezika
  assert.ok(h.includes('<link rel="canonical" href="https://grasaksalon.me/kutak/prvo-sisanje">'))
})

t('strana teksta: bez zdravlja nema stalnog reda; prevod ima svoj red; bez koraka nema okvira; bez izmjene nema "Ažurirano"', () => {
  const bez = R.renderObjava({ ...ob, zdravlje: false, koraci: { cnr: [] }, azurirano: ob.objavljeno }, 'cnr', TAX, [])
  assert.ok(!bez.includes('nije medicinski savjet') && !bez.includes('Šta možete uraditi danas') && !bez.includes('Ažurirano') && !bez.includes('Još iz rubrike'))
  const en = R.renderObjava(ob, 'en', TAX, LISTA)
  assert.ok(en.includes('This text is not medical advice.') && en.includes('What you can do today') && en.includes('2 min read') && en.includes('Updated:') && en.includes('Source: <a') && en.includes('Book an appointment'))
  assert.ok(en.includes('href="/en/kutak/tema/sisanje-i-njega"') && en.includes('>Haircuts &amp; Hair Care<') && en.includes('<html lang="en">'))
  assert.equal((en.match(/class="n" href="\/en\/kutak\/p\d"/g) || []).length, 2)   // samo povezani koji postoje na en
})

t('hreflang samo za stvarne (potvrđene) prevode, x-default na crnogorski; JSON-LD sa rubrikom, oznakama i ISO datumima', () => {
  const h = R.renderObjava(ob, 'cnr', TAX, LISTA)
  assert.ok(h.includes('hreflang="sr-ME" href="https://grasaksalon.me/kutak/prvo-sisanje"') && h.includes('hreflang="en" href="https://grasaksalon.me/en/kutak/prvo-sisanje"') && h.includes('hreflang="x-default" href="https://grasaksalon.me/kutak/prvo-sisanje"'))
  assert.ok(!h.includes('hreflang="ru" href') && !h.includes('hreflang="tr" href'))
  assert.ok(!h.includes('<script>alert') && h.includes('&lt;script&gt;alert(1)'))
  const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)[1])
  assert.equal(ld['@type'], 'BlogPosting'); assert.equal(ld.author['@type'], 'Organization'); assert.equal(ld.author.name, 'Grašak'); assert.equal(ld.author.url, 'https://grasaksalon.me/')
  assert.equal(ld.articleSection, 'Šišanje i njega'); assert.equal(ld.keywords, 'prvo šišanje, uzrast 1-3')
  assert.equal(ld.datePublished, '2026-11-11T09:30:00+01:00'); assert.equal(ld.dateModified, '2026-11-12T20:00:00+01:00')
  assert.ok(!Number.isNaN(Date.parse(ld.datePublished)) && !Number.isNaN(Date.parse(ld.dateModified)))
  assert.equal(ld.mainEntityOfPage['@id'], 'https://grasaksalon.me/kutak/prvo-sisanje'); assert.equal(ld.inLanguage, 'sr-Latn-ME')
  assert.ok(h.includes('<html lang="sr-Latn-ME">') && h.includes('<meta name="robots" content="index, follow, max-image-preview:large">') && !h.includes(EM))
  const enh = R.renderObjava(ob, 'en', TAX, LISTA)
  assert.equal(JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(enh)[1]).articleSection, 'Haircuts & Hair Care')
  assert.equal(R.renderObjava(ob, 'ru', TAX, LISTA), null)   // ruski prevod nije potvrđen: nema strane, nema hreflang
  assert.equal(R.renderObjava({ ...ob, rubrika: 'nepoznata' }, 'cnr', TAX, LISTA), null)
})

t('lista Kutka: kartice (vrsta, naslov, rečenica, vrijeme), dugmad rubrika u boji rubrike, filter po vrsti nije indeksiran', () => {
  const l = R.renderLista(LISTA, 'cnr', TAX)
  assert.ok(l.includes('class="vr">Savjet<') && l.includes('Prvo šišanje &lt;script&gt;') && l.includes('Prvo šišanje je veliki dan.') && l.includes('3 min čitanja'))
  assert.ok(l.includes('href="/kutak/prvo-sisanje"') && l.includes('<meta name="robots" content="index, follow">'))
  for (const r of TAX.rubrike) assert.ok(l.includes(`class="b-${r.boja}" href="/kutak/tema/${r.slug}"`), r.slug)
  assert.equal(new Set(TAX.rubrike.map((r) => r.boja)).size, 5)
  for (const [k, [bg]] of Object.entries(R.BOJE)) assert.ok(l.includes(`.b-${k}{background:${bg}!important`))
  const v = R.renderLista([...LISTA, mk('x1', 'igraonica', ['cnr'], ['igre-u-kuci'], 'aktivnost')], 'cnr', TAX, { vrsta: 'aktivnost' })
  assert.ok(v.includes('noindex, follow') && v.includes('<link rel="canonical" href="https://grasaksalon.me/kutak">') && v.includes('Naslov x1') && !v.includes('/kutak/p1"'))
  assert.ok(!v.includes('hreflang="en" href'))
  const prazna = R.renderLista([], 'cnr', TAX); assert.ok(prazna.includes('noindex, follow') && prazna.includes('Uskoro ovdje'))
  assert.ok(R.renderLista(LISTA, 'en', TAX).includes('href="/en/kutak/prvo-sisanje"') && !R.renderLista(LISTA, 'en', TAX).includes('/en/kutak/p2'))
})

t('strana rubrike: opis rubrike, indeksirana samo ako ima tekst; nepoznata rubrika je 404', () => {
  const s = R.renderLista(LISTA, 'cnr', TAX, { tip: 'tema', kljuc: 'sisanje-i-njega' })
  assert.ok(s.includes('Kako da prvo i svako sljedeće šišanje prođe mirno') && s.includes('<meta name="robots" content="index, follow">') && s.includes('<link rel="canonical" href="https://grasaksalon.me/kutak/tema/sisanje-i-njega">'))
  assert.ok(s.includes('content="Kako da prvo i svako sljedeće šišanje prođe mirno, i kako da se o dječjoj kosi brinete kod kuće."'))   // opis rubrike je i meta opis
  assert.ok(s.includes('aria-current="true">Šišanje i njega<'))
  const prazna = R.renderLista(LISTA, 'cnr', TAX, { tip: 'tema', kljuc: 'iz-graska' })
  assert.ok(prazna.includes('noindex, follow') && prazna.includes('još nema tekstova'))
  assert.ok(R.renderLista(LISTA, 'en', TAX, { tip: 'tema', kljuc: 'igraonica' }).includes('noindex, follow'))   // na en nema tekstova u igraonici
  assert.equal(R.renderLista(LISTA, 'cnr', TAX, { tip: 'tema', kljuc: 'izmisljena' }), null)
  assert.ok(R.renderLista(LISTA, 'ru', TAX, { tip: 'tema', kljuc: 'igraonica' }).includes('Игры и занятия'))
})

t('strana oznake: noindex,follow dok oznaka nema 5 tekstova na tom jeziku; sa 5 je indeksirana', () => {
  const sa = (n, jezici = ['cnr']) => Array.from({ length: n }, (_, i) => mk('o' + i, 'igraonica', jezici, ['igre-napolju']))
  const st = (lista, jez = 'cnr') => R.renderLista(lista, jez, TAX, { tip: 'oznaka', kljuc: 'igre-napolju' })
  assert.equal(R.OZNAKA_MIN_TEKSTOVA, 5)
  assert.ok(st(sa(4)).includes('noindex, follow')); assert.ok(st(sa(4)).includes('Naslov o0'))   // postoji i prikazuje tekstove
  assert.ok(st(sa(5)).includes('<meta name="robots" content="index, follow">'))
  assert.ok(st(sa(5, ['cnr']), 'en').includes('noindex, follow'))                                // 5 na cnr ne računa se za en
  assert.ok(st([...sa(3, ['cnr', 'en']), ...sa(2, ['cnr']).map((o, i) => ({ ...o, slug: 'z' + i }))], 'cnr').includes('index, follow'))
  assert.equal(R.renderLista(LISTA, 'cnr', TAX, { tip: 'oznaka', kljuc: 'izmisljena' }), null)
  assert.ok(st(sa(5)).includes('Oznaka: igre napolju'))
})

t('greške, RSS, sitemap bez praznih rubrika i slabih oznaka, hreflang samo među stvarnim prevodima', () => {
  assert.ok(R.renderGreska('en', 'skinuta').includes('taken down') && R.renderGreska('cnr', 'nema').includes('noindex'))
  const rss = R.renderRss(LISTA, TAX)
  assert.ok(rss.includes('<link>https://grasaksalon.me/kutak/prvo-sisanje</link>') && rss.includes('<source url="https://portal.me/a?x=1&amp;y=2">') && rss.includes('<category>Šišanje i njega</category>') && rss.includes('/kutak/rss.xml'))
  const sm = R.renderSitemap(LISTA, TAX)
  assert.ok(!/vercel\.app/.test(sm) && sm.includes('<loc>https://grasaksalon.me/</loc>') && sm.includes('<loc>https://grasaksalon.me/zakazi</loc>'))
  assert.ok(sm.includes('<loc>https://grasaksalon.me/kutak</loc>') && sm.includes('<loc>https://grasaksalon.me/en/kutak</loc>') && !sm.includes('/ru/kutak') && !sm.includes('/tr/kutak'))
  assert.ok(sm.includes('<loc>https://grasaksalon.me/kutak/tema/sisanje-i-njega</loc>') && sm.includes('<loc>https://grasaksalon.me/kutak/tema/igraonica</loc>'))
  for (const prazna of ['za-roditelje', 'vijesti-za-porodice', 'iz-graska']) assert.ok(!sm.includes('/tema/' + prazna), 'prazna rubrika u sitemap-u: ' + prazna)
  assert.ok(!sm.includes('/en/kutak/tema/igraonica'))        // igraonica nema en tekstova
  assert.ok(!sm.includes('/kutak/oznaka/'))                   // nijedna oznaka nema 5 tekstova
  assert.ok(sm.includes('<loc>https://grasaksalon.me/en/kutak/prvo-sisanje</loc>') && sm.includes('hreflang="en" href="https://grasaksalon.me/en/kutak/prvo-sisanje"') && !sm.includes('hreflang="ru"'))
  const tag = Array.from({ length: 5 }, (_, i) => mk('t' + i, 'igraonica', ['cnr'], ['igre-napolju']))
  const sm2 = R.renderSitemap(tag, TAX)
  assert.ok(sm2.includes('<loc>https://grasaksalon.me/kutak/oznaka/igre-napolju</loc>') && !sm2.includes('/en/kutak/oznaka'))
  assert.equal((R.renderSitemap([], TAX).match(/<url>/g) || []).length, 6)    // bez tekstova samo stalne strane
  assert.equal((sm.match(/<url>/g) || []).length, 6 + 2 + 3 + 9)   // stalne, liste cnr+en, rubrike (sisanje cnr+en, igraonica cnr), tekstovi (ob 2, p1 2, p2 1, p3 2, p4 1, d1 1)
  for (const x of [rss, sm, sm2]) assert.ok(!x.includes(EM))
})

t('rute i adresa skripte', async () => {
  jeste(R.izRute('/api/kutak?jez=en&slug=abc-def'), { jez: 'en', tip: 'objava', kljuc: 'abc-def', vrsta: '', ok: true })
  jeste(R.izRute('/en/kutak/abc-def'), { jez: 'en', tip: 'objava', kljuc: 'abc-def', vrsta: '', ok: true })
  jeste(R.izRute('/kutak'), { jez: 'cnr', tip: 'lista', kljuc: '', vrsta: '', ok: true })
  jeste(R.izRute('/ru/kutak/tema/igraonica?vrsta=savjet'), { jez: 'ru', tip: 'tema', kljuc: 'igraonica', vrsta: 'savjet', ok: true })
  jeste(R.izRute('/api/kutak?jez=tr&oznaka=vrtic'), { jez: 'tr', tip: 'oznaka', kljuc: 'vrtic', vrsta: '', ok: true })
  jeste(R.izRute('/tr/kutak/oznaka/vrtic'), { jez: 'tr', tip: 'oznaka', kljuc: 'vrtic', vrsta: '', ok: true })
  assert.equal(R.izRute('/api/kutak?slug=../x').ok, false); assert.equal(R.izRute('/api/kutak?jez=de').ok, false); assert.equal(R.izRute('/api/kutak?vrsta=../x').ok, false)
  assert.equal(R.putanja('cnr', 'a-b'), '/kutak/a-b'); assert.equal(R.putanja('tr'), '/tr/kutak'); assert.equal(R.putanjaTema('en', 'igraonica'), '/en/kutak/tema/igraonica'); assert.equal(R.putanjaOznaka('ru', 'vrtic'), '/ru/kutak/oznaka/vrtic')
  assert.equal(R.skriptaAdresa({ OBJAVE_API_URL: 'u1', VITE_ZAKAZIVANJE_API: 'u2' }), 'u1')
  assert.equal(R.skriptaAdresa({ VITE_ZAKAZIVANJE_API: 'u2' }), 'u2')
  assert.ok(R.skriptaAdresa({}).startsWith('https://script.google.com/macros/s/'))
  const ok = await R.iSkripte({ akcija: 'objave' }, {}, async (u) => ({ ok: true, json: async () => ({ ok: true, objave: [], u }) }))
  assert.ok(ok.ok && ok.u.includes('akcija=objave'))
  jeste(await R.iSkripte({}, {}, async () => { throw new Error('mreža') }), { greska: true })
  jeste(await R.iSkripte({}, {}, async () => ({ ok: false })), { greska: true })
  jeste(await R.ucitajLista({}, async () => ({ ok: true, json: async () => ({ ok: true, objave: [] }) })), { greska: true })   // stara skripta bez taksonomije
})

t('funkcije api/*.js: statusi, keš, rubrika, oznaka, filter (skripta zamijenjena lažnim fetch-om)', async () => {
  const H = (await import(path.join(koren, 'api/kutak.js'))).default
  const RSS = (await import(path.join(koren, 'api/kutak-rss.js'))).default
  const SM = (await import(path.join(koren, 'api/sitemap.js'))).default
  const stari = globalThis.fetch
  const lazno = (odgovori) => { globalThis.fetch = async (u) => { const x = odgovori(new URL(u)); if (x instanceof Error) throw x; return { ok: true, json: async () => x } } }
  const poziv = async (fn, url) => { const hd = {}; let tijelo = ''; const res = { statusCode: 0, setHeader: (k, v) => { hd[k.toLowerCase()] = v }, end: (b) => { tijelo = b } }; await fn({ url }, res); return { status: res.statusCode, hd, tijelo } }
  try {
    lazno((u) => (u.searchParams.get('akcija') === 'objave' ? { ok: true, objave: LISTA, taksonomija: TAX } : u.searchParams.get('slug') === 'prvo-sisanje' ? { ok: true, objava: ob, taksonomija: TAX } : u.searchParams.get('slug') === 'skinuta' ? { ok: false, nema: true, sklonjena: true } : { ok: false, nema: true }))
    let r = await poziv(H, '/api/kutak?jez=en&slug=prvo-sisanje')
    assert.equal(r.status, 200); assert.ok(/s-maxage=300/.test(r.hd['cache-control'])); assert.ok(r.tijelo.includes('First haircut') && r.tijelo.includes('class="n" href="/en/kutak/p1"'))
    r = await poziv(H, '/api/kutak?jez=ru&slug=prvo-sisanje'); assert.equal(r.status, 404)
    r = await poziv(H, '/api/kutak?slug=nema-je'); assert.equal(r.status, 404); assert.equal(r.hd['x-robots-tag'], 'noindex')
    r = await poziv(H, '/api/kutak?slug=skinuta'); assert.equal(r.status, 410)
    r = await poziv(H, '/api/kutak?slug=..%2Fx'); assert.equal(r.status, 404)
    r = await poziv(H, '/api/kutak'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('/kutak/prvo-sisanje'))
    r = await poziv(H, '/api/kutak?tema=igraonica'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('Naslov d1 cnr'))
    r = await poziv(H, '/api/kutak?tema=izmisljena'); assert.equal(r.status, 404)
    r = await poziv(H, '/api/kutak?oznaka=vaske'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('noindex, follow'))
    r = await poziv(H, '/kutak/tema/igraonica?vrsta=savjet'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('noindex, follow'))   // rezerva: putanja + upit
    r = await poziv(RSS, '/kutak/rss.xml'); assert.equal(r.status, 200); assert.ok(r.hd['content-type'].startsWith('application/rss+xml'))
    r = await poziv(SM, '/sitemap.xml'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('grasaksalon.me/en/kutak/prvo-sisanje'))
    lazno(() => new Error('skripta ne odgovara'))
    r = await poziv(H, '/api/kutak?slug=prvo-sisanje'); assert.equal(r.status, 503); assert.equal(r.hd['retry-after'], '60'); assert.ok(/s-maxage=10/.test(r.hd['cache-control']))
    r = await poziv(H, '/api/kutak'); assert.equal(r.status, 503)
    r = await poziv(SM, '/sitemap.xml'); assert.equal(r.status, 200); assert.ok(!r.tijelo.includes('/kutak') && r.tijelo.includes('/usluge')); assert.ok(/s-maxage=30/.test(r.hd['cache-control']))
  } finally { globalThis.fetch = stari }
})

await Promise.all(zadaci)
const proc = process.exitCode ? 'NEUSPJEH' : 'sve prošlo'
console.log(`objave-test: ${prosli} provjera prošlo, ${proc}`)
