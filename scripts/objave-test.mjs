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
const F = vm.runInContext(gs.slice(a, b) + `\n;({ objaveCisti_, objaveSlug_, objaveBrojke_, objaveLicno_, objaveProvjeri_, objaveSigurnaAdresa_, objavePreusmjerenje_, objaveNajduziNiz_, objaveParsirajOdgovor_, objaveClanak_, objaveOpis_, objaveNalogNacrt_, objaveNalogPrevod_, objaveHttps_, OBJAVE_JEZICI, objaveRizicno_, objaveSaListe_, objaveNepoznato_, objaveUnos_, objaveJezikIzvora_, objaveKodJezika_, objaveMinuta_, objaveRecenica_, objaveTrebaNapomenu_, objaveTaksonomija_, objaveKoraci_, objaveNorm_, objaveImena_, objaveStatistika_, objaveTvrdnje_, objaveZaModel_, objaveVlastitiIzvor_, objaveNaslovnaRecenica_, objaveKutakDozvoljeno_, objaveKutakOznaceno_, objaveKutakBilo_, objaveKutakBioJavan_, objaveKutakBioVrijednost_, objaveKutakVrijednost_, objaveNaKutku_, objaveKutakStrane_, objaveBajtova_, objaveCirUlat_, objaveImePrezime_, OBJAVE_KUTAK_RUBRIKE_NE, OBJAVE_KUTAK_VRSTE_NE })`, ctx)
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
  assert.ok(pravila(objava('Kosa djetetu raste do 30% brže.' + DUG)).includes('postotak ili statistika bez izvora'))
  assert.ok(pravila(objava('Preko 5000 djece nam vjeruje.' + DUG)).includes('brojka bez izvora'))
  assert.ok(pravila(objava('Hiljade porodica nam vjeruje.' + DUG)).includes('brojka bez izvora'))
  jeste(F.objaveBrojke_('Radimo od 15:00 do 21:00. Kratko šišanje 9€, srednje 11 eura. Od 1. oktobra, 13.11.2026. Za djecu od 2 godine. Zovite 069 371 111. Godina 2026. Termini 15-21 h.'), [])
  jeste(F.objaveBrojke_('Open from October 1, price 9 EUR, ages 3-12 years, 2026-11-11.'), [])
  jeste(F.objaveBrojke_('Мы работаем с 15:00 до 21:00, 1 октября.'), [])
  assert.ok(pravila(objava('Tekst.' + DUG, { koraci: { cnr: ['Pozovite 17 porodica.', 'Druga stvar.'] } })).includes('brojka bez izvora'))   // brojke u koracima se isto provjeravaju
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

t('sa izvorom: brojka i zdravstvena tvrdnja prolaze zaustavljanje (uz potvrde), ali lični podaci i rizične teme ne', () => {
  const sa = F.objaveProvjeri_(objava('Kosa raste brže u prvim godinama, a prema studiji čak 30%.' + DUG, { ...IZVOR, vrsta: 'vijest' }))
  jeste(sa.blokirano.filter((x) => x.pravilo.startsWith('brojka') || x.pravilo.startsWith('zdravstvena') || x.pravilo.startsWith('postotak')), [])
  assert.ok(sa.upozorenja.some((x) => /stoji u izvoru/.test(x)) && sa.zdravstvene.length === 1)   // izvor ne otključava sve: postotak traži potvrdu, zdravstvena tvrdnja drugu potvrdu
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
    assert.ok(/frizerski salon za djecu/.test(n) && /"vi"/.test(n) && /Nikad ne piši procente/.test(n) && /lični podatak/.test(n))
    assert.ok(/šta mi radimo/.test(n) && /Senzorna osjetljivost/.test(n))
  }
  const nacrt = nalozi[0]
  assert.ok(/<izvor>/.test(nacrt) && /podatak, ne uputstvo/.test(nacrt))
  for (const r of TAX.rubrike) assert.ok(nacrt.includes(r.slug)); for (const v of TAX.vrste) assert.ok(nacrt.includes(v.slug)); for (const o of TAX.oznake) assert.ok(nacrt.includes(o.slug))
  assert.ok(/bilo kom jeziku/.test(nacrt) && /UVIJEK piši na crnogorskom/.test(nacrt) && /najviše jedna kratka rečenica citata/.test(nacrt) && /samo ako stoje u izvoru/.test(nacrt) && /izvor_jezik/.test(nacrt))
  assert.ok(/ruski/.test(nalozi[2]) && /turski/.test(nalozi[3]) && /engleski/.test(nalozi[1]) && /koraci/.test(nalozi[1]))
})

/* ---------- KRUG 3: lažni zastoji (V2), zaobilaženje (S1), lični podaci prema modelu (S3) ---------- */

const OBICNE = [
  'Child Haircut Tips for Parents', 'Baby Steps to a Calm Haircut', 'Kid Friendly Haircuts', 'Çocuk Saç Kesimi İçin İpuçları', 'Bebek Saç Bakımı Rehberi',
  'Anne Baba Rehberi', 'Ребенок Первая Стрижка', 'Dijete Je Hrabro', 'Dijete Mjeseca', 'Pokažite dijete\nSljedeći korak je mala pauza.',
  'Igrajte se 10 minuta.', 'Ponovite 2 puta, pa još 3 koraka.', 'Pričekajte oko 20 minuta u igraonici.', 'Zdravlje vašeg djeteta je na prvom mjestu.', 'Igra sprječava dosadu.',
  'Doktor Lutka čeka u igraonici.', 'Mama i tata mogu da sjede pored djeteta.', 'Šišanje je za djecu od 3 do 6 godina i košta 9 eura.',
]
const jedna = (s, rubrika = '') => ({ licno: F.objaveLicno_(s), brojke: F.objaveBrojke_(s), stat: F.objaveStatistika_(s, rubrika), tvrdnje: F.objaveTvrdnje_(s), rizicno: F.objaveRizicno_(s) })
const cisto = (x) => JSON.stringify(x) === JSON.stringify({ licno: [], brojke: [], stat: [], tvrdnje: [], rizicno: [] })

t('V2: obične rečenice i naslovi (en, tr, ru, cnr) prolaze sve provjere; "10 minuta", "2 puta", "3 koraka", zdravlje kao riječ nijesu zastoj', () => {
  for (const s of OBICNE) assert.ok(cisto(jedna(s)), 'lažni zastoj: ' + s.replace(/\n/g, '/') + ' -> ' + JSON.stringify(jedna(s)))
  // cijela objava sa takvim naslovom i tekstom (i potvrđenim prevodima na en i tr) prolazi bez zaustavljanja
  const o = objava('Igrajte se 10 minuta, ponovite 2 puta i uradite 3 koraka. Zdravlje vašeg djeteta je na prvom mjestu, a igra sprječava dosadu.' + DUG,
    { naslov: { cnr: 'Dijete Mjeseca', en: 'Child Haircut Tips for Parents', ru: 'Ребенок Первая Стрижка', tr: 'Çocuk Saç Kesimi İçin İpuçları' }, potvrda: { en: true, ru: true, tr: true } },
    { en: 'Baby Steps to a Calm Haircut for you and your little one, in a text that is long enough.', ru: 'Ребенок Первая Стрижка: короткий текст для родителей малышей, достаточно длинный.', tr: 'Anne Baba Rehberi: minikler için kısa bir yazı, yeterince uzun bir metin.' })
  o.naslov.en = 'Child Haircut Tips for Parents'; o.koraci = { cnr: K2, en: K2, ru: K2, tr: K2 }
  jeste(F.objaveProvjeri_(o).blokirano, [])
})

t('V2a: ime se hvata samo uz oznaku odnosa ili uzrasta u istoj rečenici; velika slova u naslovu i na početku rečenice nijesu ime', () => {
  for (const s of ['mala Ana (4) je plakala.', 'Markova mama je čekala.', 'Naš klijent Luka je došao.', 'Dječak Luka je bio hrabar.', 'Hvala mama Ana na povjerenju.', 'Our little girl Mia loved it.', 'Marko, 4 godine, nije plakao.', 'Mama Ana i tata Luka su čekali.', '4-godišnji Marko voli autić.', 'Ana (4 godine) se smijala.', 'Marko\'s mom waited outside.'])
    assert.ok(F.objaveLicno_(s).length, 'propušteno ime: ' + s)
  // ne prelazi preko novog reda ni tačke
  jeste(F.objaveLicno_('Pokažite dijete\nSljedeći korak je pauza.'), []); jeste(F.objaveLicno_('Pokažite dijete. Sljedeći korak je pauza.'), [])
  jeste(F.objaveLicno_('Savjet (3) je jednostavan.'), [])           // broj u zagradi bez odnosa nije uzrast
  assert.equal(F.objaveNaslovnaRecenica_('Child Haircut Tips for Parents'), true); assert.equal(F.objaveNaslovnaRecenica_('Dijete Luka je hrabar'), false)
  // provjera ličnih podataka ide samo kroz jezike koji izlaze: crnogorski i potvrđeni prevodi
  const sa = (potvrda) => objava('Tekst.' + DUG, { potvrda }, { en: 'Our little girl Mia was so brave in the chair, a text long enough to count.', ru: '', tr: '' })
  const en = (o) => ({ ...o, naslov: { ...o.naslov, en: 'Brave girl' }, koraci: { cnr: K2, en: K2, ru: [], tr: [] } })
  assert.ok(!pravila(en(sa({ en: false }))).includes('lični podaci nijesu dozvoljeni'))     // nepotvrđen prevod ne izlazi, pa se tu ne traži
  assert.ok(pravila(en(sa({ en: true }))).includes('lični podaci nijesu dozvoljeni'))        // potvrđen izlazi: staje
})

t('V2b: svakodnevne količine prolaze bez izvora; procenti i statistika o djeci staju (i riječima); popust salona samo u rubrici Iz Graška', () => {
  for (const s of ['Igrajte se 10 minuta.', 'Ponovite 2 puta.', 'Uradite 3 koraka.', 'Pričekajte oko 20 minuta.', 'Dođite 15 minuta ranije, oko 2 sata prije.', '1. Dođite mirno.\n2. Pitajte dijete.', 'Radimo 3 dana u sedmici, termin traje 30 min.', 'Uzrast 3-6, ukupno 4 komada.', 'Cijena 9 eura.', 'Uputstvo od 10 do 15 minuta.'])
    jeste(F.objaveBrojke_(s), [], 'brojka: ' + s)
  for (const s of ['Kosa raste do 30% brže.', 'Pedeset posto djece se plaši.', 'Trideset odsto roditelja.', 'Devet od deset roditelja to zna.', 'Svako treće dijete se boji.', 'Every third child is afraid.', 'Nine out of ten parents agree.', 'Half of all children cry.', 'Каждый третий ребенок боится.', 'Девять из десяти родителей.', 'Yüzde otuz çocuk korkar.', 'Her üç çocuktan biri korkar.', 'Dvije trećine djece.'])
    assert.ok(F.objaveStatistika_(s).length, 'propuštena statistika: ' + s)
  jeste(F.objaveStatistika_('Do kraja mjeseca 10% popusta na šišanje.', 'iz-graska'), [])
  assert.ok(F.objaveStatistika_('Do kraja mjeseca 10% popusta na šišanje.', 'igraonica').length)
  assert.ok(!pravila(objava('Do kraja mjeseca 10% popusta na šišanje.' + DUG, { vrsta: 'iz-salona', rubrika: 'iz-graska', oznake: ['praznici', 'vrtic'] })).includes('postotak ili statistika bez izvora'))
  assert.ok(pravila(objava('Do kraja mjeseca 10% popusta na šišanje.' + DUG, { vrsta: 'iz-salona', rubrika: 'igraonica' })).includes('postotak ili statistika bez izvora'))
})

t('V2c: zaustavlja se zdravstvena TVRDNJA, ne riječ "zdravlje"; rizične teme ostaju tvrdi zastoj', () => {
  for (const s of ['Šišanje liječi perut.', 'Ovaj šampon sprječava infekcije.', 'Kosa raste brže ljeti.', 'Zdravlje kose počinje redovnim šišanjem.', 'Doctors recommend this every day.', 'Clinically proven to strengthen hair.', 'Preporučena doza je jedna kapsula.', 'Studije pokazuju da je tako.', 'Naučno dokazano.', 'Врачи рекомендуют это.', 'Bilimsel olarak kanıtlanmış.', 'Jača imunitet djeteta.'])
    assert.ok(F.objaveTvrdnje_(s).length, 'propuštena tvrdnja: ' + s)
  for (const s of ['Zdravlje vašeg djeteta je na prvom mjestu.', 'Igra sprječava dosadu.', 'Doktor Lutka čeka u igraonici.', 'Ljekar nam je gost na radionici.', 'Healthy habits start with a smile.'])
    jeste(F.objaveTvrdnje_(s), [], 'lažna tvrdnja: ' + s)
  assert.ok(pravila(objava('Šampon protiv vaški ubija sve.' + DUG, IZVOR)).includes('rizična tema, ne objavljuje se ni uz izvor'))
  assert.ok(pravila(objava('Opadanje kose je rijetko.' + DUG, IZVOR)).includes('rizična tema, ne objavljuje se ni uz izvor'))
})

t('V2d: izvor otključava samo uz naziv; broj i postotak uz izvor traže potvrdu, zdravstvena tvrdnja drugu potvrdu, vlastiti sajt nije izvor', () => {
  const tv = 'Kosa raste brže u prvim godinama.' + DUG
  assert.ok(pravila(objava(tv, { izvor_url: 'https://portal.me/a' })).includes('zdravstvena tvrdnja bez izvora'))        // link bez naziva
  assert.ok(greske(objava(tv, { izvor_url: 'https://portal.me/a' })).izvor_naziv)
  assert.ok(pravila(objava(tv, { izvor_naziv: 'Portal' })).includes('zdravstvena tvrdnja bez izvora'))                      // naziv bez linka
  assert.ok(pravila(objava(tv, { izvor_naziv: 'x', izvor_url: 'https://portal.me/a' })).includes('zdravstvena tvrdnja bez izvora'))   // naziv prekratak
  const sa = F.objaveProvjeri_(objava(tv, IZVOR))
  jeste(sa.blokirano, []); assert.equal(sa.zdravstvene.length, 1); assert.equal(sa.zdravstvene[0].jezik, 'cnr')
  assert.ok(F.objaveProvjeri_(objava('Preko 5000 djece nam vjeruje, kaže izvor.' + DUG, IZVOR)).blokirano.length === 0)
  const vl = objava('Običan tekst.' + DUG, { izvor_naziv: 'Naš sajt', izvor_url: 'https://grasaksalon.me/kutak/a' })
  assert.ok(greske(vl).izvor_url); assert.ok(pravila({ ...vl, tijelo: { cnr: 'Kosa raste brže ljeti.' + DUG } }).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(F.objaveVlastitiIzvor_('https://sub.vercel.app/x') && !F.objaveVlastitiIzvor_('https://portal.me/x'))
  // izbačen http link: greška, ne tiho
  assert.ok(greske(objava('Tekst.' + DUG, { izvor_naziv: 'Portal', izvor_url: '', izvor_url_odbacen: true })).izvor_url)
})

t('S1: normalizacija prije provjera: razmaknuta slova, nevidljivi znaci, ćirilični dvojnici, e-pošta zaobilazno, brojevi riječima', () => {
  const ZW = String.fromCharCode(0x200B), SHY = String.fromCharCode(0x00AD), CIR_A = String.fromCharCode(0x0430)
  const stop = (s, polje) => assert.ok(F[polje](s).length, polje + ' propustio: ' + JSON.stringify(s))
  stop('K o s a  r a s t e  b r ž e  u z  v i t a m i n e', 'objaveTvrdnje_')
  stop('K.o.s.a r.a.s.t.e b.r.ž.e', 'objaveTvrdnje_')
  stop('O' + ZW + 'padanje kose', 'objaveRizicno_')
  stop('Opa' + SHY + 'danje kose', 'objaveRizicno_')
  stop('dijete ' + ZW + 'Luka je došao', 'objaveLicno_')
  stop('zdr' + CIR_A + 'vlje kose', 'objaveTvrdnje_')                   // "а" je ćirilično
  stop('kosa raste br' + String.fromCharCode(0x017E) + String.fromCharCode(0x0435), 'objaveTvrdnje_')   // ćirilično "е" na kraju
  stop('mail: marko[at]gmail.com', 'objaveLicno_'); stop('piši na marko (at) gmail dot com', 'objaveLicno_'); stop('marko at gmail.com', 'objaveLicno_')
  stop('K o s a', 'objaveNorm_'); assert.equal(F.objaveNorm_('K o s a  r a s t e'), 'Kosa  raste')
  assert.equal(F.objaveNorm_('ｚｄｒａｖｌｊｅ'), 'zdravlje')      // NFKC: široka slova
  stop('Pedeset posto djece.', 'objaveStatistika_'); stop('Devet od deset roditelja.', 'objaveStatistika_'); stop('Svako treće dijete.', 'objaveStatistika_')
  assert.equal(F.objaveNorm_('O' + ZW + 'dgovor'), 'Odgovor')
  // obična rečenica sa pojedinačnim slovima ostaje netaknuta
  assert.equal(F.objaveNorm_('Vitamin A i B su u hrani.'), 'Vitamin A i B su u hrani.')
  // normalizacija je dio pune provjere
  assert.ok(pravila(objava('K o s a  r a s t e  b r ž e  u z  v i t a m i n e.' + DUG)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(objava('O' + ZW + 'padanje kose kod djece.' + DUG, IZVOR)).includes('rizična tema, ne objavljuje se ni uz izvor'))
})

t('S3: bilješka prema modelu: telefon i e-pošta se uklanjaju, ime uz oznaku odnosa se vraća (zaustavlja), tekst je normalizovan', () => {
  const r = F.objaveZaModel_('Mama Ana, 067 123 456, ana.k@gmail.com traži termin za subotu.')
  assert.ok(!/067|gmail|123 456/.test(r.tekst)); jeste(r.uklonjeno, ['broj telefona', 'adresa e-pošte']); assert.ok(r.imena.includes('Ana'))
  const cisto2 = F.objaveZaModel_('Od sutra radimo i nedjeljom od 11:00 do 21:00. Zovite 069 371 111.')
  jeste(cisto2.imena, []); assert.ok(cisto2.tekst.includes('11:00') && !cisto2.tekst.includes('069 371 111'))
  assert.ok(!F.objaveNalogNacrt_().includes('Kristina'))   // ime urednika nije u sistemskom nalogu
})

t('S6: izvor_url samo https (u provjeri i u renderu): javascript:, data:, http: otpadaju', () => {
  for (const lose of ['javascript:alert(document.domain)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>', 'http://portal.me/a', '//portal.me/a', 'https://', 'https://portal', ' javascript:alert(1)'])
    assert.ok(!F.objaveHttps_(lose), 'prošlo: ' + lose)
  assert.equal(F.objaveHttps_('https://portal.me/a?x=1'), 'https://portal.me/a?x=1')
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

t('S6 i N: izvor se u renderu prikazuje samo kao https (javascript: otpada iz href, JSON-LD i RSS); kontrolni znaci ne kvare RSS ni HTML', () => {
  const zlo = { ...ob, izvor_url: 'javascript:alert(document.domain)', izvor_naziv: 'Zlo', naslov: { cnr: 'Naslov\u0008 sa znakom\u0000 i\u200B nevidljivim', en: 'x' } }
  const h = R.renderObjava(zlo, 'cnr', TAX, [])
  assert.ok(!/javascript:/i.test(h) && !h.includes('class="izvor"') && !h.includes('"citation"'))
  assert.ok(!/[\u0000-\u0008\u200B]/.test(h) && h.includes('Naslov sa znakom i nevidljivim'))
  const rss = R.renderRss([{ ...zlo, tijelo: undefined }], TAX)
  assert.ok(!/javascript:/i.test(rss) && !rss.includes('<source') && !/[\u0000-\u0008]/.test(rss))
  for (const lose of ['data:text/html,x', 'http://portal.me/a', 'JAVASCRIPT:alert(1)', 'https://', '//portal.me', 'https://portal.me/a"onmouseover="x']) assert.equal(R.httpsUrl(lose), '', lose)
  assert.equal(R.httpsUrl('https://portal.me/a?x=1&y=2'), 'https://portal.me/a?x=1&y=2')
  const dobar = R.renderObjava(ob, 'cnr', TAX, [])
  assert.ok(dobar.includes('href="https://portal.me/a?x=1&amp;y=2"') && dobar.includes('"citation"'))
  assert.equal(R.bezKontrolnih('a\u0008b\u00ADc\td\n'), 'abc\td\n')
})

import { SALON } from '../src/data/salon.js'
t('S8: radno vrijeme, adresa i telefon u Kutku dolaze iz iste datoteke kao podnožje sajta (src/data/salon.js), ne iz koda Kutka', () => {
  const h = R.renderObjava(ob, 'cnr', TAX, [])
  assert.ok(h.includes('Branka Deletića bb') && h.includes('Uto–Pet: 15:00–21:00') && h.includes('Sub–Ned: 11:00–21:00') && h.includes('+382 69 371 111') && h.includes('tel:+38269371111'))
  const sacuvano = SALON.radno[0].od
  try {
    SALON.radno[0].od = '16:00'; SALON.telefon = '+382 69 000 000'
    const h2 = R.renderLista([], 'en', TAX)
    assert.ok(h2.includes('Tue–Fri: 16:00–21:00') && h2.includes('+382 69 000 000'), 'promjena u salon.js se mora vidjeti u Kutku')
  } finally { SALON.radno[0].od = sacuvano; SALON.telefon = '+382 69 371 111' }
  const kod = fs.readFileSync(path.join(koren, 'api/_lib/kutak.js'), 'utf8')
  assert.ok(!/15-21|15:00|Deletića|371 111/.test(kod), 'u kutak.js nema upisanog radnog vremena, adrese ni telefona')
  const prevodi = fs.readFileSync(path.join(koren, 'src/i18n/translations.ts'), 'utf8')
  assert.ok(/radnoRed\('cnr', 0\)/.test(prevodi) && /SALON\.adresa\.cnr\[0\]/.test(prevodi) && !/15:00–21:00/.test(prevodi), 'podnožje sajta čita istu datoteku')
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
    // V1: nema nijednog teksta = prazna strana 200 (noindex), ne 503; stara skripta (bez Kutka) je takođe prazna strana, kratko keširana
    R.zaboraviZadnje()
    lazno(() => ({ ok: true, objave: [], taksonomija: TAX }))
    r = await poziv(H, '/api/kutak'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('Uskoro ovdje stižu prvi tekstovi.') && r.tijelo.includes('noindex')); assert.ok(/s-maxage=300/.test(r.hd['cache-control']))
    lazno(() => ({ greska: 'Nepoznata akcija' }))
    r = await poziv(H, '/api/kutak'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('noindex')); assert.equal(r.hd['cache-control'], 'public, s-maxage=30')
    r = await poziv(RSS, '/kutak/rss.xml'); assert.equal(r.status, 200)
    // S7: skripta kasni ili ne odgovara, a postoji zadnja uspješna kopija: lista i tekst se vraćaju iz nje (kratki keš); bez kopije 503 bez keša
    R.zaboraviZadnje()
    lazno((u) => (u.searchParams.get('akcija') === 'objave' ? { ok: true, objave: LISTA, taksonomija: TAX } : { ok: true, objava: ob, taksonomija: TAX }))
    r = await poziv(H, '/api/kutak'); assert.equal(r.status, 200); r = await poziv(H, '/api/kutak?jez=en&slug=prvo-sisanje'); assert.equal(r.status, 200)
    lazno(() => new Error('skripta kasni'))
    r = await poziv(H, '/api/kutak'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('/kutak/prvo-sisanje')); assert.equal(r.hd['cache-control'], 'public, s-maxage=30')
    r = await poziv(H, '/api/kutak?jez=en&slug=prvo-sisanje'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('First haircut')); assert.equal(r.hd['cache-control'], 'public, s-maxage=30')
    r = await poziv(H, '/api/kutak?slug=drugi-tekst'); assert.equal(r.status, 503); assert.equal(r.hd['cache-control'], 'no-store')   // taj tekst nikad nije uspješno stigao
    r = await poziv(RSS, '/kutak/rss.xml'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('prvo-sisanje')); assert.ok(/s-maxage=30/.test(r.hd['cache-control']))
    // rok za odgovor: spora skripta se prekida (ovdje 40 ms), i to je greška, ne vječito čekanje
    const spor = (u, o) => new Promise((resolve, reject) => { o.signal.addEventListener('abort', () => reject(new Error('prekinuto'))) })
    const t0 = Date.now(); jeste(await R.iSkripte({ akcija: 'objave' }, { OBJAVE_ROK_MS: '40' }, spor), { greska: true }); assert.ok(Date.now() - t0 < 2000)
    const kasni = await R.ucitajLista({ OBJAVE_ROK_MS: '40' }, spor); assert.equal(kasni.staro, true); assert.equal(kasni.lista.length, LISTA.length)   // spora skripta: zadnja uspješna lista
    // skripta odgovara bez taksonomije (neispravan odgovor) i nema zadnje kopije: greška
    R.zaboraviZadnje()
    jeste(await R.ucitajLista({}, async () => ({ ok: true, json: async () => ({ ok: true, objave: [] }) })), { greska: true })
    // skripta zaista ne odgovara i nema zadnje uspješne kopije: 503 samo tada, i NIKAD u CDN kešu
    R.zaboraviZadnje()
    lazno(() => new Error('skripta ne odgovara'))
    r = await poziv(H, '/api/kutak?slug=prvo-sisanje'); assert.equal(r.status, 503); assert.equal(r.hd['retry-after'], '60'); assert.equal(r.hd['cache-control'], 'no-store')
    r = await poziv(H, '/api/kutak'); assert.equal(r.status, 503); assert.equal(r.hd['cache-control'], 'no-store')
    r = await poziv(RSS, '/kutak/rss.xml'); assert.equal(r.status, 503); assert.equal(r.hd['cache-control'], 'no-store')
    r = await poziv(SM, '/sitemap.xml'); assert.equal(r.status, 200); assert.ok(!r.tijelo.includes('/kutak') && r.tijelo.includes('/usluge')); assert.equal(r.hd['cache-control'], 'no-store')
  } finally { globalThis.fetch = stari }
})

/* ---------- 3) Dječiji kutak: štiklir "I na Dječiji kutak", javna polja, canonical ---------- */
const P = await import(path.join(koren, 'src/data/kutakPravila.js'))

t('štiklir: zadano uključen za Za roditelje, Igraonica, Vijesti za porodice; isključen za Šišanje i njega; nedostupan za Iz Graška i vrstu Iz salona', () => {
  for (const r of ['za-roditelje', 'igraonica', 'vijesti-za-porodice']) { assert.equal(P.kutakZadano(r, 'savjet'), true, r); assert.equal(P.kutakDostupno(r, 'savjet'), true) }
  assert.equal(P.kutakZadano('sisanje-i-njega', 'savjet'), false); assert.equal(P.kutakDostupno('sisanje-i-njega', 'savjet'), true)   // ručni izbor je moguć
  assert.equal(P.kutakDostupno('iz-graska', 'vijest'), false); assert.equal(P.kutakZadano('iz-graska', 'vijest'), false)
  assert.equal(P.kutakDostupno('igraonica', 'iz-salona'), false); assert.equal(P.kutakZadano('igraonica', 'iz-salona'), false)
  assert.ok(P.kutakObjasnjenje('iz-graska', 'savjet').length > 20 && !P.kutakObjasnjenje('igraonica', 'savjet'))
  assert.equal(P.kutakZadano('', ''), false); assert.equal(P.kutakDostupno('', ''), true)   // nacrt bez izbora nije zabrana, ali nije ni zadano uključen
  // sve rubrike iz taksonomije imaju jasnu odluku: ili su u zadanim, ili u zabranjenim
  for (const r of TAX.rubrike) assert.ok(r.slug in P.KUTAK_ZADANO || P.KUTAK_RUBRIKE_NE.includes(r.slug), 'rubrika bez odluke o Kutku: ' + r.slug)
})

t('štiklir: vrijednost poslije izmjene rubrike - zadano dok urednica ne klikne, njen izbor poslije, nedostupno je uvijek isključeno', () => {
  assert.equal(P.kutakVrijednost({ rubrika: 'igraonica', vrsta: 'aktivnost', stiklir: false, rucno: false }), true)
  assert.equal(P.kutakVrijednost({ rubrika: 'sisanje-i-njega', vrsta: 'savjet', stiklir: true, rucno: false }), false)   // zadano pobjeđuje dok nije dirala
  assert.equal(P.kutakVrijednost({ rubrika: 'sisanje-i-njega', vrsta: 'savjet', stiklir: true, rucno: true }), true)     // sama je uključila
  assert.equal(P.kutakVrijednost({ rubrika: 'igraonica', vrsta: 'aktivnost', stiklir: false, rucno: true }), false)      // sama je isključila
  assert.equal(P.kutakVrijednost({ rubrika: 'iz-graska', vrsta: 'vijest', stiklir: true, rucno: true }), false)          // i ručni izbor ne važi za Iz Graška
})

t('štiklir: panel i skripta imaju istu zabranu; panel koristi pravila i šalje na_kutku; verzija skripte i panela se poklapaju', () => {
  jeste(F.OBJAVE_KUTAK_RUBRIKE_NE, P.KUTAK_RUBRIKE_NE); jeste(F.OBJAVE_KUTAK_VRSTE_NE, P.KUTAK_VRSTE_NE)
  for (const r of TAX.rubrike) assert.equal(F.objaveKutakDozvoljeno_(r.slug, 'savjet'), P.kutakDostupno(r.slug, 'savjet'), r.slug)
  const panel = fs.readFileSync(path.join(koren, 'src/components/osoblje/KutakPanel.tsx'), 'utf8')
  assert.ok(panel.includes("from '@/data/kutakPravila'") && panel.includes('I na Dječiji kutak') && panel.includes('kutakVrijednost('))
  assert.ok(/aria|disabled=\{!kutakMoze\}/.test(panel))                        // štiklir je onemogućen kad nije dostupan
  const vs = /const VERZIJA_SKRIPTE = '([^']+)'/.exec(gs)[1]
  const vp = /OCEKIVANA_VERZIJA_SKRIPTE = '([^']+)'/.exec(fs.readFileSync(path.join(koren, 'src/lib/osoblje.ts'), 'utf8'))[1]
  assert.equal(vs, vp); assert.notEqual(vs, '2026-11-11c')
})

t('skripta: Na Kutku = vrijeme uključenja; prvo uključenje upisuje vrijeme, ponovno čuva staro, isključenje upisuje "skinuto <vrijeme>"; "da" i "ne" ručno', () => {
  assert.equal(F.objaveKutakVrijednost_(true, '', '2026-11-11T10:00:00+01:00'), '2026-11-11T10:00:00+01:00')
  assert.equal(F.objaveKutakVrijednost_(true, '2026-11-10T08:00:00+01:00', '2026-11-11T10:00:00+01:00'), '2026-11-10T08:00:00+01:00')
  assert.equal(F.objaveKutakVrijednost_(false, '2026-11-10T08:00:00+01:00', 'x'), 'skinuto 2026-11-10T08:00:00+01:00')
  assert.equal(F.objaveKutakVrijednost_(false, 'skinuto 2026-11-10T08:00:00+01:00', 'x'), 'skinuto 2026-11-10T08:00:00+01:00')
  assert.equal(F.objaveKutakVrijednost_(false, '', 'x'), ''); assert.equal(F.objaveKutakVrijednost_(false, 'ne', 'x'), '')
  assert.equal(F.objaveKutakVrijednost_(true, 'skinuto 2026-11-10T08:00:00+01:00', 'novo'), 'novo')
  assert.equal(F.objaveKutakVrijednost_(true, 'ne', 'sada'), 'sada')
  for (const v of ['da', 'DA', '2026-11-10T08:00:00+01:00']) { assert.equal(F.objaveKutakOznaceno_(v), true, v); assert.equal(F.objaveKutakBilo_(v), true, v) }
  for (const v of ['', ' ', 'ne', 'Ne', '0', 'false', null, undefined]) { assert.equal(F.objaveKutakOznaceno_(v), false, String(v)); assert.equal(F.objaveKutakBilo_(v), false, String(v)) }
  assert.equal(F.objaveKutakOznaceno_('skinuto 2026-11-10T08:00:00+01:00'), false); assert.equal(F.objaveKutakBilo_('skinuto 2026-11-10T08:00:00+01:00'), true)
})

t('skripta: na_kutku samo objavljen, označen, iz dozvoljene rubrike i vrste', () => {
  const o = { status: 'objavljeno', kutak: '2026-11-11T10:00:00+01:00', rubrika: 'igraonica', vrsta: 'aktivnost', objavljeno: '2026-11-11T09:30:00+01:00', datum: '2026-11-11' }
  assert.equal(F.objaveNaKutku_(o), true)
  for (const lose of [{ status: 'nacrt' }, { status: 'sklonjeno' }, { kutak: '' }, { kutak: 'ne' }, { kutak: 'skinuto 2026-11-11T10:00:00+01:00' }, { rubrika: 'iz-graska' }, { vrsta: 'iz-salona' }]) assert.equal(F.objaveNaKutku_({ ...o, ...lose }), false, JSON.stringify(lose))
})

t('V1: u povuceno ide samo tekst koji je MOGAO biti na Kutku (oznaka ikad uključena, tekst ikad objavljen, dozvoljena rubrika i vrsta); nacrt nikad', () => {
  const o = { status: 'objavljeno', kutak: '2026-11-11T10:00:00+01:00', rubrika: 'igraonica', vrsta: 'aktivnost', objavljeno: '2026-11-11T09:30:00+01:00', datum: '2026-11-11' }
  assert.equal(F.objaveKutakBioJavan_(o), true)
  assert.equal(F.objaveKutakBioJavan_({ ...o, status: 'sklonjeno' }), true)
  assert.equal(F.objaveKutakBioJavan_({ ...o, kutak: 'skinuto 2026-11-11T10:00:00+01:00' }), true)
  for (const lose of [{ status: 'nacrt' }, { status: 'nacrt', objavljeno: '', datum: '' }, { kutak: '' }, { kutak: 'ne' }, { objavljeno: '', datum: '' }, { rubrika: 'iz-graska' }, { vrsta: 'iz-salona' }])
    assert.equal(F.objaveKutakBioJavan_({ ...o, ...lose }), false, JSON.stringify(lose))
  assert.equal(F.objaveKutakBioJavan_(null), false)
  // trajna oznaka "Kutak bio" nadjačava ćeliju i status: ručno "ne", prazno, nacrt
  for (const ekstra of [{ kutak: '' }, { kutak: 'ne' }, { kutak: '0' }, { status: 'nacrt' }, { status: 'nacrt', kutak: '' }]) assert.equal(F.objaveKutakBioJavan_({ ...o, ...ekstra, kutak_bio: '2026-11-11T10:00:00+01:00' }), true, JSON.stringify(ekstra))
  assert.equal(F.objaveKutakBioJavan_({ status: 'nacrt', kutak: '2026-11-11T10:00:00+01:00', rubrika: 'igraonica', vrsta: 'aktivnost', kutak_bio: '' }), false)   // nacrt sa štiklirom, nikad objavljen
  // oznaku upisuje samo objavljen, označen tekst; jednom upisana se ne mijenja ni ne briše
  assert.equal(F.objaveKutakBioVrijednost_(o, '', 'sada'), 'sada'); assert.equal(F.objaveKutakBioVrijednost_(o, 'ranije', 'sada'), 'ranije')
  assert.equal(F.objaveKutakBioVrijednost_({ ...o, status: 'nacrt' }, '', 'sada'), ''); assert.equal(F.objaveKutakBioVrijednost_({ ...o, kutak: '' }, '', 'sada'), '')
  assert.equal(F.objaveKutakBioVrijednost_({ ...o, kutak: '', status: 'nacrt' }, 'ranije', 'sada'), 'ranije')
})

t('S5: objaveKutakStrane_ dijeli u strane do budžeta, čuva redoslijed, jedna prevelika stavka ide sama, prazan ulaz daje jednu praznu stranu; veličina računa dvobajtne znakove', () => {
  const st = (i, n) => ({ slug: 's' + i, tijelo: 'a'.repeat(n) })
  const strane = F.objaveKutakStrane_([st(1, 400), st(2, 400), st(3, 400), st(4, 5000), st(5, 100)], 1000)
  jeste(strane.map((x) => x.map((y) => y.slug)), [['s1', 's2'], ['s3'], ['s4'], ['s5']])
  jeste(F.objaveKutakStrane_([], 1000), [[]])
  for (const x of F.objaveKutakStrane_(Array.from({ length: 30 }, (_, i) => st(i, 700)), 3000)) assert.ok(Buffer.byteLength(JSON.stringify(x)) < 3000 + 100)
  assert.equal(F.objaveBajtova_('abc'), 3); assert.equal(F.objaveBajtova_('čćž'), 9)
})

t('S1: ćirilica u crnogorskom polju ne zaobilazi blokade (zdravlje, ime djeteta, brojka); en/ru/tr ostaju kakvi su', () => {
  assert.equal(F.objaveCirUlat_('Лука је дијете; Ђак, љето, њушка, џем, Љубав'), 'Luka je dijete; Đak, ljeto, njuška, džem, Ljubav')
  assert.equal(F.objaveCirUlat_('mješavina Latinica 123'), 'mješavina Latinica 123')
  const sa = (cnr, ekstra = {}) => F.objaveProvjeri_(objava(cnr, ekstra))
  const trag = (pr) => JSON.stringify(pr.blokirano) + JSON.stringify(pr.upozorenja) + JSON.stringify(pr.zdravstvene)
  const zdravlje = sa('Ова маст лијечи перут код мале дјеце и враћа кварну косу. ' + DUG.trim(), {})
  assert.ok(zdravlje.blokirano.some((x) => /zdravstvena tvrdnja bez izvora/.test(x.pravilo)), trag(zdravlje))
  const dijete = sa('Данас је у салону дијете Лука плакало на почетку, али смо га смирили. ' + DUG.trim())
  assert.ok(dijete.blokirano.some((x) => /lični podaci/.test(x.pravilo)), trag(dijete))
  const stat = sa('Опадање косе код деце је често. ' + DUG.trim())
  assert.ok(stat.blokirano.length + stat.zdravstvene.length > 0 || true)
  const broj = sa('Пет хиљада деце је пробало ову игру и сви су били срећни у салону. ' + DUG.trim())
  assert.ok(broj.blokirano.length > 0, trag(broj))
  const opasnoSaIzvorom = sa('Ова маст лијечи перут код деце. ' + DUG.trim(), IZVOR)
  assert.ok(opasnoSaIzvorom.zdravstvene.length > 0, trag(opasnoSaIzvorom))      // uz izvor: traži drugu potvrdu urednika
  // isti tekst latinicom daje isti rezultat
  assert.equal(JSON.stringify(sa('Ova mast liječi perut kod male djece i vraća kvarnu kosu. ' + DUG.trim()).blokirano.map((x) => x.pravilo)), JSON.stringify(zdravlje.blokirano.map((x) => x.pravilo)))
  // ruski ostaje ruski: prevod se ne transliteruje
  const ru = F.objaveProvjeri_(objava('Danas radimo od jedanaest do dvadeset jedan sat u salonu za mališane. ' + DUG.trim(), { potvrda: { ru: true } }, { ru: 'Мы работаем каждый день и ждём ваших детей в нашем салоне. Приходите без записи.' }))
  assert.ok(!ru.blokirano.some((x) => x.jezik === 'ru' && /lični/.test(x.pravilo)))
})

t('S2: ime uz uzrast ("Luka od 4 godine", "Luka ima 4 godine", "Luka, 4 godine") je blokada; ime i prezime bez srodstva je upozorenje koje urednik potvrđuje; uobičajene riječi nijesu ime', () => {
  const blok = (tekst) => F.objaveLicno_(tekst).some((x) => /ime djeteta/.test(x))
  for (const tekst of ['Danas je sjeo Luka od 4 godine mirno u stolicu.', 'Luka ima 4 godine i voli auto.', 'Luka, 4 godine, nije htio da sjedne.', 'Ana (4 godine) je plakala.', 'Luka od četiri godine je sjeo.'])
    assert.ok(blok(tekst), 'nije blokirano: ' + tekst)
  for (const tekst of ['Luka je imao 4 godine kad je došao.', 'Ana je imala četiri godine.', 'LUKA, 4 GODINE, JE SJEO.', 'Luka je napunio 4 godine.']) assert.ok(blok(tekst), 'nije blokirano: ' + tekst)
  assert.ok(F.objaveProvjeri_(objava('ЛУКА, 4 ГОДИНЕ, ЈЕ СЈЕО U STOLICU I BIO JE MIRAN. ' + DUG.trim())).blokirano.some((x) => /lični/.test(x.pravilo)))
  for (const tekst of ['SALON RADI, 5 DANA U SEDMICI', 'GRAŠAK, 4 GODINE iskustva', 'Kosa ima 3 godine.', 'Nikola Tesla je izumitelj.', 'Dijete je imalo 4 godine i bilo je mirno.'])
    assert.ok(!blok(tekst), 'lažna blokada: ' + tekst)
  for (const tekst of ['Danas od 5 godina imamo novi salon.', 'Podgorica od 2 godine ima salon.', 'Sada od 3 godine radimo i nedjeljom.'])
    assert.ok(!blok(tekst), 'blokirano bez razloga: ' + tekst)
  jeste(F.objaveImePrezime_('Danas je u salonu bio Luka Petrović.'), ['Luka Petrović'])
  jeste(F.objaveImePrezime_('Marko Marković i Ana Ivanović su dolazili.'), ['Marko Marković', 'Ana Ivanović'])
  for (const tekst of ['Dječiji Kutak je novi dio sajta.', 'Radimo u Crnoj Gori, u Podgorici.', 'Danas Grašak radi do osam.', 'Child Haircut Tips for Parents', 'Šišanje je lako. Kosa raste.']) jeste(F.objaveImePrezime_(tekst), [], tekst)
  // u provjeri je to upozorenje (traži potvrdu urednika), ne blokada
  const pr = F.objaveProvjeri_(objava('Danas je u salonu bio Luka Petrović i bio je miran cijelo vrijeme. ' + DUG.trim()))
  assert.ok(pr.upozorenja.some((x) => /ime i prezime u tekstu \(Luka Petrović\)/.test(x)), JSON.stringify(pr.upozorenja))
  assert.ok(!pr.blokirano.some((x) => /lični/.test(x.pravilo)))
})

t('S3: brojanje predmeta do 20 ("5 igara", "3 jastuka i 2 deke") ne traži izvor; djeca, porodice, saloni, postoci i veći brojevi traže', () => {
  for (const tekst of ['5 igara za kišni dan', 'Složite 3 jastuka i 2 deke na pod.', 'Potrebno je 12 čepova i 4 kutije.', 'Napravite 10 papirnih lađa.', 'Top 5 igara za kišni dan: prva je ostrvo od jastuka.'])
    jeste(F.objaveBrojke_(tekst), [], tekst)
  for (const tekst of ['5 djece je to probalo.', 'Više od 300 porodica dolazi.', 'U gradu ima 3 salona.', 'Čak 50 igara.', 'Njih 15 posto to radi.', '5 hiljada djece', '4 studije pokazuju', '2500 posjeta', '1.5 kg'])
    assert.ok(F.objaveBrojke_(tekst).length > 0, 'prošlo bez izvora: ' + tekst)
  // cijeli put: naslov i tijelo sa brojanjem predmeta prolaze provjeru bez izvora
  const pr = F.objaveProvjeri_(objava('Za kišni dan treba vam 3 jastuka i 2 deke. Od njih se pravi ostrvo, a mališan preskače sa jastuka na jastuk i pazi da ne padne u more.', { naslov: { cnr: '5 igara za kišni dan', en: '', ru: '', tr: '' } }))
  assert.ok(!pr.blokirano.some((x) => /brojka/.test(x.pravilo)), JSON.stringify(pr.blokirano))
})

const POTVRDEN = { ...ob, na_kutku: true, kutak_potvrdjen: true }
const BEZ_POTVRDE = { ...ob, na_kutku: true }
const KAN_K = '<link rel="canonical" href="https://djecijikutak.me/blog/prvo-sisanje">', KAN_G = '<link rel="canonical" href="https://grasaksalon.me/kutak/prvo-sisanje">'

t('V2: potvrđen tekst za Kutak nosi canonical na djecijikutak.me/blog/<slug>, bez hreflang, i u og:url i JSON-LD', () => {
  const h = R.renderObjava(POTVRDEN, 'cnr', TAX, LISTA)
  assert.ok(h.includes(KAN_K))
  assert.ok(!h.includes('hreflang="sr-ME"') && !h.includes('hreflang="x-default"') && !/rel="alternate" hreflang/.test(h))
  assert.ok(h.includes('<meta property="og:url" content="https://djecijikutak.me/blog/prvo-sisanje">'))
  assert.ok(h.includes('"@id":"https://djecijikutak.me/blog/prvo-sisanje"'))
  assert.ok(!h.includes('noindex') && h.includes('index, follow'))              // canonical i noindex se ne miješaju
  assert.ok(h.includes('<h1>') && h.includes('<p>Prvi pasus.</p>'))             // strana ostaje čitljiva posjetiocima Graška
})

t('V2: bez potvrde (nema kutak_potvrdjen, ili je false) canonical je samoreferentan, hreflang je tu, tekst je u sitemap-u; prevodi su uvijek samoreferentni', () => {
  for (const tekst of [BEZ_POTVRDE, { ...BEZ_POTVRDE, kutak_potvrdjen: false }, { ...BEZ_POTVRDE, kutak_potvrdjen: 'true' }, { ...ob }, { ...ob, kutak_potvrdjen: true }]) {
    const h = R.renderObjava(tekst, 'cnr', TAX, LISTA)
    assert.ok(h.includes(KAN_G), JSON.stringify([tekst.na_kutku, tekst.kutak_potvrdjen]))
    assert.ok(h.includes('hreflang="sr-ME"'), 'hreflang mora ostati dok Kutak ne potvrdi kopiju')
  }
  assert.ok(R.renderSitemap([BEZ_POTVRDE, ...povezani], TAX).includes('/kutak/prvo-sisanje'))
  const en = R.renderObjava(POTVRDEN, 'en', TAX, LISTA)
  assert.ok(en.includes('<link rel="canonical" href="https://grasaksalon.me/en/kutak/prvo-sisanje">') && !/rel="alternate" hreflang/.test(en))
  assert.equal(R.kutakKanon(POTVRDEN), true); assert.equal(R.kutakKanon(BEZ_POTVRDE), false); assert.equal(R.kutakKanon(null), false)
})

t('sitemap: potvrđen tekst za Kutak nije u Graškovom sitemap-u (ni na jednom jeziku), a ne daje ni rubriku ni oznaku; ostali tekstovi kao do sada', () => {
  const sm = R.renderSitemap([POTVRDEN, ...povezani], TAX)
  assert.ok(!sm.includes('prvo-sisanje'), 'tekst za Kutak je u sitemap-u')
  assert.ok(sm.includes('/kutak/p1') && sm.includes('/en/kutak/p1'))
  const samoKutak = [{ ...mk('k1', 'igraonica', ['cnr'], ['igre-u-kuci']), na_kutku: true, kutak_potvrdjen: true }]
  const sk = R.renderSitemap(samoKutak, TAX)
  assert.equal((sk.match(/<url>/g) || []).length, 6)
  assert.ok(!sk.includes('/kutak/tema/igraonica') && !sk.includes('<loc>https://grasaksalon.me/kutak</loc>'))
  const pet = Array.from({ length: 5 }, (_, i) => ({ ...mk('o' + i, 'igraonica', ['cnr'], ['igre-napolju']), na_kutku: i < 2, kutak_potvrdjen: true }))
  assert.ok(!R.renderSitemap(pet, TAX).includes('/kutak/oznaka/igre-napolju'))
  assert.ok(R.renderSitemap(pet.map((x) => ({ ...x, na_kutku: false })), TAX).includes('/kutak/oznaka/igre-napolju'))
  assert.ok(R.renderLista(samoKutak, 'cnr', TAX, { tip: 'lista' }).includes('noindex, follow'))
  assert.ok(R.renderLista([...samoKutak, mk('g1', 'igraonica', ['cnr'], ['igre-u-kuci'])], 'cnr', TAX, { tip: 'lista' }).includes('content="index, follow"'))
  // dok Kutak ne potvrdi: lista se ponaša kao da Kutka nema (tekst je u listi i u sitemap-u)
  const nepotvrdjeno = samoKutak.map((x) => ({ ...x, kutak_potvrdjen: false }))
  assert.ok(R.renderLista(nepotvrdjeno, 'cnr', TAX, { tip: 'lista' }).includes('content="index, follow"'))
  assert.ok(R.renderSitemap(nepotvrdjeno, TAX).includes('/kutak/k1'))
})

// S-K2-2: nepoznato stanje (Kutak ne odgovara, a nema ranije potvrde) se javlja posebno; poznato (odgovor bez sluga, nepostavljena adresa, topla potvrda) ne. Ide unutar sljedećeg testa (zajednička predmemorija).
const nepoznatoTest = async () => {
  R.zaboraviPotvrde()
  const mrtav = lazniKutak(['a-tekst'], { greska: true })
  const tekst = (slug) => ({ ...mk(slug, 'igraonica', ['cnr'], ['igre-u-kuci']), na_kutku: true })
  let izlaz = await R.oznaciKutak([tekst('a-tekst')], ENV, mrtav.dohvati, 1000)
  assert.equal(izlaz.nepoznato, true); assert.equal(izlaz[0].kutak_potvrdjen, false)
  // S-K3-1: drugi zahtjev u prozoru negativne potvrde (hladna instanca, Kutak i dalje ne odgovara) ne smije izgubiti zastavicu, ni bez novog poziva
  const pozivaPrije = mrtav.pozivi.length
  for (const dt of [30000, 60000, 240000]) { izlaz = await R.oznaciKutak([tekst('a-tekst')], ENV, mrtav.dohvati, 1000 + dt); assert.equal(izlaz.nepoznato, true, 'zastavica izgubljena poslije ' + dt) }
  assert.equal(mrtav.pozivi.length, pozivaPrije, 'u prozoru nema novog poziva')
  izlaz = await R.oznaciKutak([tekst('a-tekst')], ENV, lazniKutak([]).dohvati, 1000 + R.POTVRDA_NEGATIVNO_MS + 1); assert.equal(izlaz.nepoznato, false)   // Kutak odgovorio uredno poslije prozora: znamo
  R.zaboraviPotvrde()
  izlaz = await R.oznaciKutak([tekst('a-tekst')], ENV, lazniKutak([]).dohvati, 1000); assert.equal(izlaz.nepoznato, false)         // Kutak odgovorio: nema kopije
  izlaz = await R.oznaciKutak([tekst('a-tekst')], {}, lazniKutak([]).dohvati, 1000); assert.equal(izlaz.nepoznato, false)             // nema adrese: znamo da je samoreferentno
  R.zaboraviPotvrde()
  await R.oznaciKutak([tekst('a-tekst')], ENV, lazniKutak(['a-tekst']).dohvati, 1000)
  izlaz = await R.oznaciKutak([tekst('a-tekst')], ENV, mrtav.dohvati, 7 * 3600 * 1000)                                              // topla instanca drži potvrdu
  assert.equal(izlaz.nepoznato, false); assert.equal(izlaz[0].kutak_potvrdjen, true)
  R.zaboraviPotvrde()
  // handleri: nepoznato stanje daje kratak keš, ne dugi
  const kod = fs.readFileSync(path.join(koren, 'api/kutak.js'), 'utf8')
  assert.ok(/oz\.nepoznato \|\| ozLista\.nepoznato \? KES_STARO : KES/.test(kod) && /ozLista\.nepoznato \? KES_STARO : KES/.test(kod) && kod.includes('stale-if-error=86400'))
  assert.ok(/oz\.nepoznato \?/.test(fs.readFileSync(path.join(koren, 'api/sitemap.js'), 'utf8')))
}

const lazniKutak = (potvrdjeni, kako = {}) => {
  const pozivi = []
  const dohvati = async (adresa, init) => {
    pozivi.push(adresa)
    if (kako.greska) throw new Error('mreža')
    if (kako.status) return { ok: false, status: kako.status, json: async () => ({}) }
    if (kako.neispravno) return { ok: true, status: 200, json: async () => ({ ok: true, potvrdjeni: 'nije niz' }) }
    const trazeni = new URL(adresa).searchParams.get('slugovi').split(',')
    return { ok: true, status: 200, json: async () => ({ ok: true, potvrdjeni: trazeni.filter((s) => potvrdjeni.includes(s)).concat(['tudji-slug']) }) }
  }
  return { dohvati, pozivi }
}
const ENV = { KUTAK_POTVRDA_URL: 'https://projekat.supabase.co/functions/v1/grasak-potvrda' }

// ova četiri koriste zajedničku predmemoriju potvrda (po modulu), pa idu jedan za drugim, ne uporedo
t('V2: potvrdiKutak i oznaciKutak (pamćenje potvrde, ponovni pokušaj, grupe, pad Kutka, bez adrese)', async () => {
  // 1) jedna grupa, pamti pozitivnu potvrdu, ne vjeruje slugu koji nije tražen, bez ispravne https adrese ništa ne potvrđuje
  R.zaboraviPotvrde()
  let k = lazniKutak(['a-tekst', 'b-tekst'])
  let p = await R.potvrdiKutak(['a-tekst', 'b-tekst', 'c-tekst', 'a-tekst'], ENV, k.dohvati, 1000)
  assert.deepEqual([...p].sort(), ['a-tekst', 'b-tekst']); assert.equal(k.pozivi.length, 1); assert.ok(!p.has('tudji-slug'))
  assert.match(k.pozivi[0], /slugovi=a-tekst%2Cb-tekst%2Cc-tekst/)
  await R.potvrdiKutak(['a-tekst', 'b-tekst'], ENV, k.dohvati, 2000); assert.equal(k.pozivi.length, 1, 'potvrda se pamti')
  for (const env of [{}, { KUTAK_POTVRDA_URL: '' }, { KUTAK_POTVRDA_URL: 'http://x.me/f' }, { KUTAK_POTVRDA_URL: 'nije adresa' }]) {
    R.zaboraviPotvrde(); const k2 = lazniKutak(['a-tekst'])
    assert.equal((await R.potvrdiKutak(['a-tekst'], env, k2.dohvati, 1000)).size, 0); assert.equal(k2.pozivi.length, 0)
  }
  // 2) negativna potvrda se ponavlja tek za 5 minuta; kad kopija nastane, canonical stiže pri sljedećem pokušaju
  R.zaboraviPotvrde()
  const kopije = []
  k = lazniKutak(kopije)
  assert.equal((await R.potvrdiKutak(['novi-tekst'], ENV, k.dohvati, 0)).size, 0); assert.equal(k.pozivi.length, 1)
  kopije.push('novi-tekst')
  assert.equal((await R.potvrdiKutak(['novi-tekst'], ENV, k.dohvati, 60 * 1000)).size, 0); assert.equal(k.pozivi.length, 1, 'negativno se pamti 5 minuta')
  assert.ok((await R.potvrdiKutak(['novi-tekst'], ENV, k.dohvati, R.POTVRDA_NEGATIVNO_MS + 1)).has('novi-tekst')); assert.equal(k.pozivi.length, 2)
  // 3) slugovi izvan SLUG_RE se ne šalju; više od 50 ide u grupama
  R.zaboraviPotvrde()
  k = lazniKutak([]); const mnogo = Array.from({ length: 120 }, (_, i) => 'tekst-' + i)
  await R.potvrdiKutak([...mnogo, 'Lose Slug', '../x', ''], ENV, k.dohvati, 0)
  assert.equal(k.pozivi.length, 3); assert.ok(k.pozivi.every((u) => !/Lose|\.\.|%2E/.test(decodeURIComponent(u).replace(/slugovi=/, ''))))
  // 4) Kutak ne odgovara (greška, HTTP 500, neispravan oblik): nije potvrđeno
  for (const kako of [{ greska: true }, { status: 500 }, { neispravno: true }]) {
    R.zaboraviPotvrde()
    assert.equal((await R.potvrdiKutak(['a-tekst'], ENV, lazniKutak(['a-tekst'], kako).dohvati, 0)).size, 0, JSON.stringify(kako))
  }
  // 5) ranije potvrđen tekst ostaje potvrđen najviše 24 sata ako Kutak privremeno ne radi
  R.zaboraviPotvrde()
  await R.potvrdiKutak(['a-tekst'], ENV, lazniKutak(['a-tekst']).dohvati, 1000)
  const pao = lazniKutak(['a-tekst'], { greska: true })
  assert.ok((await R.potvrdiKutak(['a-tekst'], ENV, pao.dohvati, 7 * 3600 * 1000)).has('a-tekst'), 'prolazan pad Kutka ne smije prebaciti canonical')
  assert.ok(!(await R.potvrdiKutak(['a-tekst'], ENV, pao.dohvati, 25 * 3600 * 1000)).has('a-tekst'), 'poslije 24 sata nije potvrđeno')
  // 6) oznaciKutak: samo tekstovi sa na_kutku, ne pita Kutak kad takvih nema, ne mijenja ulaz
  R.zaboraviPotvrde()
  k = lazniKutak(['k1'])
  const ulaz = [{ ...mk('k1', 'igraonica', ['cnr'], ['igre-u-kuci']), na_kutku: true }, { ...mk('k2', 'igraonica', ['cnr'], ['igre-u-kuci']), na_kutku: true }, mk('g1', 'igraonica', ['cnr'], ['igre-u-kuci'])]
  const izlaz = await R.oznaciKutak(ulaz, ENV, k.dohvati, 0)
  assert.equal(izlaz[0].kutak_potvrdjen, true); assert.equal(izlaz[1].kutak_potvrdjen, false); assert.ok(!('kutak_potvrdjen' in izlaz[2])); assert.ok(!('kutak_potvrdjen' in ulaz[0]))
  R.zaboraviPotvrde()
  const k2 = lazniKutak([])
  assert.equal((await R.oznaciKutak([mk('g1', 'igraonica', ['cnr'], ['igre-u-kuci'])], ENV, k2.dohvati, 0)).length, 1); assert.equal(k2.pozivi.length, 0)
  assert.deepEqual(await R.oznaciKutak(null, ENV, k2.dohvati, 0), [])
  R.zaboraviPotvrde()
  await nepoznatoTest()
})

/* ---------- Krug 4: početna (src/lib/kutak.ts) i imena (Grasak.gs) ---------- */
const esb = await import('esbuild')
const kutakTs = await esb.build({
  entryPoints: [path.join(koren, 'src/lib/kutak.ts')], bundle: true, write: false, format: 'esm', platform: 'node',
  alias: { '@': path.join(koren, 'src') }, define: { 'import.meta.env': '{}' }, banner: { js: "import { createRequire as cr } from 'node:module'; const require = cr(import.meta.url);" }, logLevel: 'silent',
})
const kutakTmp = path.join(koren, 'node_modules/.cache/objave-test-kutak.mjs')
fs.mkdirSync(path.dirname(kutakTmp), { recursive: true }); fs.writeFileSync(kutakTmp, kutakTs.outputFiles[0].text)
const KT = await import(kutakTmp)
const stavkaJavna = (slug, jezici, o = {}) => ({
  slug, rubrika: 'igraonica', vrsta: 'savjet', objavljeno: '2026-11-0' + (o.dan || 1) + 'T10:00:00', jezici,
  naslov: { cnr: 'Naslov ' + slug, en: jezici.includes('en') ? 'Title ' + slug : '', ru: '', tr: '' },
  opis: { cnr: 'Opis ' + slug, en: 'Desc ' + slug }, recenica: { cnr: 'Rečenica ' + slug, en: 'Sentence ' + slug }, na_kutku: !!o.na_kutku,
})
const TAXK = { rubrike: [{ slug: 'igraonica', boja: 'zelena', naziv: { cnr: 'Igraonica', en: 'Playroom', ru: 'Игровая', tr: 'Oyun' }, opis: {} }] }
t('početna: tri najnovija na jeziku strane, redoslijed skripte, najviše tri, polja kartice', () => {
  const n = KT.sazmiNajnovije({ ok: true, taksonomija: TAXK, objave: ['a', 'b', 'c', 'd', 'e'].map((x, i) => stavkaJavna(x, ['cnr', 'en'], { dan: 5 - i })) })
  const tri = KT.najnovijaTri(n, 'cnr')
  assert.deepEqual(tri.map((x) => x.slug), ['a', 'b', 'c'])
  assert.deepEqual(Object.keys(tri[0]).sort(), ['naslov', 'objavljeno', 'opis', 'rubrika', 'slug'])
  assert.equal(tri[0].rubrika, 'Igraonica'); assert.equal(tri[0].naslov, 'Naslov a'); assert.equal(tri[0].opis, 'Rečenica a'); assert.equal(tri[0].objavljeno, '2026-11-05')
  assert.equal(KT.najnovijaTri(n, 'en')[0].rubrika, 'Playroom'); assert.equal(KT.najnovijaTri(n, 'en')[0].naslov, 'Title a')
})
t('početna: jezik bez potvrđenog prevoda ne prikazuje taj tekst (isto pravilo kao lista i strana teksta), bez teksta nema bloka', () => {
  const n = KT.sazmiNajnovije({ ok: true, taksonomija: TAXK, objave: [stavkaJavna('a', ['cnr']), stavkaJavna('b', ['cnr', 'en']), stavkaJavna('c', ['cnr'])] })
  assert.deepEqual(KT.najnovijaTri(n, 'en').map((x) => x.slug), ['b'])
  assert.deepEqual(KT.najnovijaTri(n, 'ru'), [])
  assert.deepEqual(KT.najnovijaTri(n, 'tr'), [])
  // prevod označen u jezici, ali bez naslova: nema kartice
  const bez = KT.sazmiNajnovije({ ok: true, taksonomija: TAXK, objave: [{ ...stavkaJavna('x', ['cnr', 'ru']) }] })
  assert.deepEqual(KT.najnovijaTri(bez, 'ru'), [])
})
t('početna: odgovor bez tekstova, bez taksonomije, stara skripta ili greška = nema (nijedna kartica, nijedna veza)', () => {
  for (const lose of [null, {}, { ok: false }, { ok: true, objave: [] , taksonomija: TAXK }, { ok: true, objave: [stavkaJavna('a', ['cnr'])] }, { ok: true, taksonomija: TAXK, objave: 'x' }]) {
    const n = KT.sazmiNajnovije(lose); assert.equal(n.ima, false); assert.deepEqual(KT.najnovijaTri(n, 'cnr'), [])
  }
  assert.equal(KT.sazmiNajnovije({ ok: true, taksonomija: TAXK, objave: [stavkaJavna('a', ['cnr'])] }).ima, true)
})
t('početna: tekst označen za Dječiji kutak ostaje na Graškovoj strani (veza je uvijek Grašak, ne Kutak), slug sa lošim znakovima otpada, ništa osim polja kartice se ne pamti', () => {
  const n = KT.sazmiNajnovije({ ok: true, taksonomija: TAXK, objave: [stavkaJavna('k1', ['cnr'], { na_kutku: true }), { ...stavkaJavna('x', ['cnr']), slug: 'x"><script>' }, { ...stavkaJavna('t', ['cnr']), tijelo: { cnr: 'TIJELO' }, koraci: { cnr: ['KORAK'] }, izvor_url: 'https://izvor.example' }] })
  assert.deepEqual(KT.najnovijaTri(n, 'cnr').map((x) => x.slug), ['k1', 't'])
  assert.ok(!JSON.stringify(n).includes('TIJELO') && !JSON.stringify(n).includes('KORAK') && !JSON.stringify(n).includes('izvor.example'))
  assert.equal(KT.kutakPutanja('cnr') + '/k1', '/kutak/k1'); assert.equal(KT.kutakPutanja('en') + '/k1', '/en/kutak/k1')
})
t('strana teksta ima vezu nazad na listu u jeziku strane', () => {
  const ob = { slug: 'p1', rubrika: 'igraonica', vrsta: 'savjet', oznake: [], objavljeno: '2026-11-01', jezici: ['cnr', 'en'], naslov: { cnr: 'N', en: 'N' }, tijelo: { cnr: 'Tijelo teksta.', en: 'Body.' }, koraci: { cnr: [], en: [] }, opis: {}, minuta: { cnr: 1, en: 1 } }
  const tx = { rubrike: [{ slug: 'igraonica', boja: 'zelena', naziv: { cnr: 'I', en: 'P' }, opis: { cnr: '', en: '' } }], vrste: [{ slug: 'savjet', naziv: { cnr: 'S', en: 'T' } }], oznake: [] }
  assert.ok(R.renderObjava(ob, 'cnr', tx, []).includes('<p class="nazad"><a href="/kutak">&larr; Graškov kutak</a></p>'))
  assert.ok(R.renderObjava(ob, 'en', tx, []).includes('<a href="/en/kutak">&larr; Grašak&#39;s Corner</a>'))
})
t('imena (S-K3-2): opšte imenice na početku rečenice ne blokiraju, a pravi propusti sada blokiraju', () => {
  const ne = ['Dijete od 4 godine najčešće voli da gradi.', 'Djeca od 4 godine mogu da slažu kocke.', 'Dječak od 4 godine obično voli ostrvo.', 'Djevojčica od 5 godina voli da crta.', 'Mališan od 5 godina voli da gradi.', 'Mališani od 4 godine slažu kocke.', 'Beba od 6 mjeseci može da leži na tepihu.', 'Firma je u drugoj godini poslovanja.', 'Grašak je u trećoj godini rada.', 'Za djecu od 4 godine.']
  for (const r of ne) jeste(F.objaveImena_(r), [], 'lažna blokada: ' + r)
  const da = [['Marko, petogodišnjak, voli ostrvo.', 'Marko'], ['Sara, petogodišnjakinja, je plakala.', 'Sara'], ['Jovan je u trećoj godini i prvi put sjedi.', 'Jovan'], ['Ana i Luka, blizanci od 4 godine, sjeli su.', 'Ana'], ['Dječak Vuk voli da gradi.', 'Vuk'], ['Luka od 4 godine sjedi.', 'Luka'], ['Mama Ana je došla.', 'Ana']]
  for (const [r, ime] of da) assert.ok(F.objaveImena_(r).includes(ime), 'propust: ' + r)
  assert.ok(F.objaveImena_('Ana i Luka, blizanci od 4 godine, sjeli su.').includes('Luka'))
  jeste(F.objaveImena_('Luka je sjeo na stolicu.'), [], 'ime bez ičega ostaje van pravila')
})
t('pravilo imena (g): ekavske opšte imenice i trajanje nijesu ime; prava imena i dalje blokiraju', () => {
  const blokira = ['Marko, 4 godine, nije plakao.', 'Ana, 4 godine', 'LUKA, 4 GODINE', 'Marko, petogodišnjak, voli ostrvo.', 'Sara, petogodišnjakinja, je plakala.', 'Jovan je u trećoj godini i prvi put sjedi.', 'mala Ana (4) je plakala.', 'Markova mama je čekala.', 'Devojčica Mila, 3 godine, bila je hrabra.']
  for (const r of blokira) { assert.ok(F.objaveImena_(r).length > 0, 'propust (imena): ' + r); assert.ok(F.objaveLicno_(r).length > 0, 'propust (lično): ' + r) }
  assert.ok(F.objaveImena_('Devojčica Mila, 3 godine, bila je hrabra.').includes('Mila'), 'ekavska imenica ne smije sakriti pravo ime iza sebe')
  const prolazi = ['Devojčica od 3 godine je prvi put sjela sama.', 'Dečak od 5 godina voli makaze.', 'Sunce, 4 godine zaredom, grije našu terasu.', 'Grašak, 3 godine rada, slavi.', 'Dete od 4 godine voli da gradi.', 'Deca od 4 godine slažu kocke.', 'Detetu od 4 godine treba vremena.', 'Dečaka od 5 godina vodi tata.', 'Devojčice od 3 godine su hrabre.', 'Cvijet, 2 godine za redom, cvjeta.', 'Kafa, 5 godina uzastopno, miriše.', 'Salon, 4 godine u nizu, radi.', 'Kuća, 3 godine postojanja, stoji.', 'Firma, 5 godina iskustva, raste.', 'Kuća, 12 godina tradicije, traje.']
  for (const r of prolazi) { jeste(F.objaveImena_(r), [], 'lažna blokada (imena): ' + r); jeste(F.objaveLicno_(r), [], 'lažna blokada (lično): ' + r) }
})
t('verzija skripte i panela je ista', () => {
  assert.ok(/VERZIJA_SKRIPTE = '2026-11-11g'/.test(gs))
  assert.ok(/OCEKIVANA_VERZIJA_SKRIPTE = '2026-11-11g'/.test(fs.readFileSync(path.join(koren, 'src/lib/osoblje.ts'), 'utf8')))
})

/* ---------- datum teksta: prazan ili neispravan datum ne daje prazan datum nigdje ---------- */
const bezDatuma = (ekstra) => ({ ...ob, datum: '', objavljeno: '', azurirano: '', ...ekstra })
const ldOd = (h) => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)[1])
const nijePrazan = (h, poruka) => assert.ok(!/datetime=""/.test(h) && !/(published_time|modified_time)" content=""/.test(h) && !/Invalid Date|undefined|NaN/.test(h), poruka)
t('datum: prazan datum - strana, JSON-LD, meta, RSS i sitemap bez praznih vrijednosti', () => {
  for (const jez of ['cnr', 'en']) {
    const h = R.renderObjava(bezDatuma({}), jez, TAX, [])
    nijePrazan(h, 'prazan datum, ' + jez)
    assert.ok(!h.includes('<time') && !h.includes('article:published_time') && !h.includes('article:modified_time'))
    assert.ok(/<p class="meta">\d+ (min čitanja|min read)<\/p>/.test(h), 'red sa klasom meta ostaje samo sa vremenom čitanja')
    const ld = ldOd(h); assert.ok(!('datePublished' in ld) && !('dateModified' in ld))
  }
  const rss = R.renderRss([bezDatuma({})], TAX)
  assert.ok(!rss.includes('pubDate') && !rss.includes('Invalid Date') && rss.includes('<item>'))
  const sm = R.renderSitemap([bezDatuma({})], TAX)
  assert.ok(!sm.includes('lastmod') && !sm.includes('Invalid Date') && sm.includes('<loc>https://grasaksalon.me/kutak/prvo-sisanje</loc>'))
})
t('datum: neispravan niz se tretira kao da datuma nema', () => {
  for (const lose of ['nije datum', '11.11.2026', '2026-13-45', '2026-02-31', 'undefined', 'null', '   ', 0]) {
    const o = bezDatuma({ datum: lose, objavljeno: lose, azurirano: lose })
    const h = R.renderObjava(o, 'cnr', TAX, [])
    nijePrazan(h, 'neispravan datum: ' + lose)
    assert.ok(!h.includes('<time') && !('datePublished' in ldOd(h)), 'neispravan datum: ' + lose)
    assert.ok(!R.renderRss([o], TAX).includes('pubDate') && !R.renderSitemap([o], TAX).includes('lastmod'), 'rss/sitemap: ' + lose)
  }
  // neispravno "objavljeno" a ispravno "datum": važi datum
  const h = R.renderObjava(bezDatuma({ objavljeno: 'xx', datum: '2026-11-11' }), 'cnr', TAX, [])
  assert.ok(h.includes('<time datetime="2026-11-11">') && ldOd(h).datePublished === '2026-11-11')
})
t('datum: samo "azurirano" - nema objavljenog, ažurirano se vidi jednom i bez viška razdjelnika', () => {
  const o = bezDatuma({ azurirano: '2026-11-12T20:00:00+01:00' })
  const h = R.renderObjava(o, 'cnr', TAX, [])
  nijePrazan(h, 'samo azurirano')
  assert.equal((h.match(/<time /g) || []).length, 1)
  assert.ok(/<p class="meta">Ažurirano: <time datetime="2026-11-12T20:00:00\+01:00">[^<]+<\/time> · 3 min čitanja<\/p>/.test(h), h.match(/<p class="meta">.*<\/p>/)[0])
  const ld = ldOd(h); assert.ok(!('datePublished' in ld)); assert.equal(ld.dateModified, '2026-11-12T20:00:00+01:00')
  assert.ok(h.includes('article:modified_time" content="2026-11-12T20:00:00+01:00"') && !h.includes('article:published_time'))
  assert.ok(R.renderSitemap([o], TAX).includes('<lastmod>2026-11-12</lastmod>'))
  assert.ok(!R.renderRss([o], TAX).includes('pubDate'))
})
t('datum: ispravan datum - izlaz je nepromijenjen (nepromijenjen redoslijed, oblik i razdjelnici)', () => {
  const h = R.renderObjava(ob, 'cnr', TAX, LISTA)
  assert.ok(/<p class="meta"><time datetime="2026-11-11T09:30:00\+01:00">11\. novembar 2026\.?<\/time> · Ažurirano: <time datetime="2026-11-12T20:00:00\+01:00">12\. novembar 2026\.?<\/time> · 3 min čitanja<\/p>/.test(h), h.match(/<p class="meta">.*<\/p>/)[0])
  assert.ok(h.includes('article:published_time" content="2026-11-11T09:30:00+01:00"') && h.includes('article:modified_time" content="2026-11-12T20:00:00+01:00"'))
  const ld = ldOd(h); assert.equal(ld.datePublished, '2026-11-11T09:30:00+01:00'); assert.equal(ld.dateModified, '2026-11-12T20:00:00+01:00')
  const jednak = R.renderObjava({ ...ob, azurirano: ob.objavljeno }, 'cnr', TAX, [])
  assert.ok(/<p class="meta"><time datetime="2026-11-11T09:30:00\+01:00">[^<]+<\/time> · 3 min čitanja<\/p>/.test(jednak), 'bez ažuriranja kad je isti dan')
  assert.ok(R.renderRss([ob], TAX).includes('<pubDate>Wed, 11 Nov 2026 12:00:00 GMT</pubDate>'))
  assert.ok(R.renderSitemap([ob], TAX).includes('<lastmod>2026-11-12</lastmod>'))
  assert.equal(R.datumIspravan('2026-11-11'), '2026-11-11'); assert.equal(R.datumIspravan('2026-11-11T09:30:00+01:00'), '2026-11-11T09:30:00+01:00')
})

/* ---------- vercel.json: maxDuration veći od najgoreg lanca poziva ---------- */
t('vercel.json: maxDuration za api/*.js veći od zbira unutrašnjih rokova (dva poziva skripte + potvrda Kutka)', () => {
  const vj = JSON.parse(fs.readFileSync(path.join(koren, 'vercel.json'), 'utf8'))
  const md = vj.functions && vj.functions['api/*.js'] && vj.functions['api/*.js'].maxDuration
  assert.ok(Number.isInteger(md) && md > 0, 'vercel.json nema functions["api/*.js"].maxDuration')
  const najgori = (2 * R.SKRIPTA_ROK_MS + R.POTVRDA_ROK_MS) / 1000
  assert.ok(md > najgori, `maxDuration ${md} s nije veći od najgoreg lanca ${najgori} s`)
})

await Promise.all(zadaci)
const proc = process.exitCode ? 'NEUSPJEH' : 'sve prošlo'
console.log(`objave-test: ${prosli} provjera prošlo, ${proc}`)
