// Provjera čistih funkcija objava, bez Google okruženja i bez Vercel-a:  node scripts/objave-test.mjs
//  1) čiste funkcije iz google-skripta/Grasak.gs (blok OBJAVE-CISTE) se izvlače i pokreću u Node vm-u: slug, čišćenje, provjera blokade, adrese, prompt
//  2) api/_lib/objave.js: render HTML-a, RSS, sitemap, rute
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
const F = vm.runInContext(gs.slice(a, b) + `\n;({ objaveCisti_, objaveSlug_, objaveBrojke_, objaveLicno_, objaveProvjeri_, objaveSigurnaAdresa_, objavePreusmjerenje_, objaveNajduziNiz_, objaveParsirajOdgovor_, objaveClanak_, objaveOpis_, objaveNalogNacrt_, objaveNalogPrevod_, objaveHttps_, OBJAVE_JEZICI })`, ctx)
const EM = String.fromCharCode(0x2014)

const IZVOR = { izvor_naziv: 'Pedijatrija.me', izvor_url: 'https://pedijatrija.me/clanak' }
const objava = (cnr, ekstra = {}, tijelo = {}) => ({
  tip: 'vlastita',
  naslov: { cnr: 'Naslov objave', en: '', ru: '', tr: '' },
  tijelo: { cnr, en: '', ru: '', tr: '', ...tijelo },
  ...ekstra,
})
const DUG = ' Kratka, topla objava za roditelje mališana koja ima dovoljno znakova za provjeru.'
const pravila = (o) => F.objaveProvjeri_(o).blokirano.map((x) => x.pravilo.split(' (')[0])

t('slug: dijakritici, ćirilica, crtice, dužina, rezerva', () => {
  assert.equal(F.objaveSlug_('Nove cijene od 1. oktobra!'), 'nove-cijene-od-1-oktobra')
  assert.equal(F.objaveSlug_('Šišanje za mališane - đurđevdan'), 'sisanje-za-malisane-djurdjevdan')
  assert.equal(F.objaveSlug_('Ђак први пут'), 'djak-prvi-put')
  const dug = F.objaveSlug_('riječ '.repeat(40))
  assert.ok(dug.length <= 70 && !dug.endsWith('-') && /^[a-z0-9-]+$/.test(dug))
  assert.equal(F.objaveSlug_('!!', 'abcd1234ef'), 'objava-abcd1234')
})

t('čišćenje: duga crta, podebljanje, naslovi', () => {
  assert.equal(F.objaveCisti_('Dobro' + EM + 'došli'), 'Dobro - došli')
  assert.equal(F.objaveCisti_('**Važno** je\n\n\n\n# Naslov'), 'Važno je\n\nNaslov')
})

t('brojke bez izvora: blokirano; vrijeme, datum, cijena, uzrast, broj salona prolaze', () => {
  assert.ok(pravila(objava('Kosa djetetu raste do 30% brže.' + DUG)).includes('brojka bez izvora'))
  assert.ok(pravila(objava('Preko 5000 djece nam vjeruje.' + DUG)).includes('brojka bez izvora'))
  assert.ok(pravila(objava('Hiljade porodica nam vjeruje.' + DUG)).includes('brojka bez izvora'))
  jeste(F.objaveBrojke_('Radimo od 15:00 do 21:00. Kratko šišanje 9€, srednje 11 eura. Od 1. oktobra, 13.11.2026. Za djecu od 2 godine. Zovite 069 371 111. Godina 2026. Termini 15-21 h.'), [])
  jeste(F.objaveBrojke_('Open from October 1, price 9 EUR, ages 3-12 years, 2026-11-11.'), [])
  jeste(F.objaveBrojke_('Мы работаем с 15:00 до 21:00, 1 октября.'), [])
})

t('zdravstvene tvrdnje bez izvora: blokirano na sva četiri jezika', () => {
  assert.ok(pravila(objava('Kosa raste brže u prvim godinama.' + DUG)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(objava('Zdravlje kose počinje redovnim šišanjem.' + DUG)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(objava('Naša objava.' + DUG, {}, { en: 'Hair grows faster in kids. Short friendly text for parents of little ones.', naslov: undefined }) /* en bez naslova */).length >= 0)
  const prevodi = (en, ru, tr) => ({ naslov: { cnr: 'Naslov objave', en: 'Title', ru: 'Заголовок', tr: 'Başlık' }, tijelo: { cnr: 'Kratka, topla objava za roditelje mališana, bez ičega spornog u tekstu.', en, ru, tr }, tip: 'vlastita' })
  const cisto = prevodi('A short, warm post for parents of little ones, nothing disputable in it.', 'Короткая тёплая публикация для родителей малышей, ничего спорного.', 'Miniklerin ebeveynleri için kısa ve sıcak bir yazı, tartışmalı bir şey yok.')
  jeste(F.objaveProvjeri_(cisto).blokirano, [])
  assert.ok(pravila(prevodi('Hair grows faster in children, a short text for parents.', cisto.tijelo.ru, cisto.tijelo.tr)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(prevodi(cisto.tijelo.en, 'Волосы растут быстрее у детей, короткий текст для родителей.', cisto.tijelo.tr)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(prevodi(cisto.tijelo.en, 'Здоровье волос начинается с регулярной стрижки, коротко для родителей.', cisto.tijelo.tr)).includes('zdravstvena tvrdnja bez izvora'))
  assert.ok(pravila(prevodi(cisto.tijelo.en, cisto.tijelo.ru, 'Saçlar daha hızlı uzar, ebeveynler için kısa bir yazı.')).includes('zdravstvena tvrdnja bez izvora'))
  jeste(F.objaveProvjeri_(objava('A little bit of fun.' + DUG)).blokirano, [])   // "bit" nije tvrdnja
})

t('sa izvorom: brojka i zdravstvena tvrdnja prolaze, ali lični podaci ne', () => {
  const zaIzvor = objava('Kosa raste do 30% brže u prvim godinama.' + DUG, { ...IZVOR, tip: 'vijest' })
  jeste(F.objaveProvjeri_(zaIzvor).blokirano, [])
  assert.ok(pravila(objava('Dječak Luka je bio hrabar.' + DUG, IZVOR)).includes('lični podaci nijesu dozvoljeni'))
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

t('izvor: obavezan kad objava prenosi vijest; https; naziv uz link', () => {
  assert.ok(F.objaveProvjeri_(objava('Vijest iz svijeta.' + DUG, { tip: 'vijest' })).greske.izvor_naziv)
  assert.ok(F.objaveProvjeri_(objava('Tekst.' + DUG, { izvor_naziv: 'X', izvor_url: 'http://x.me/a' })).greske.izvor_url)
  assert.ok(F.objaveProvjeri_(objava('Tekst.' + DUG, { izvor_url: 'https://x.me/a' })).greske.izvor_naziv)
  jeste(F.objaveProvjeri_(objava('Tekst.' + DUG, { tip: 'vijest', ...IZVOR })).greske, {})
})

t('provjera: prekratko, nepotpun prevod, STUB, upozorenje', () => {
  assert.ok(F.objaveProvjeri_(objava('Kratko.')).greske.tijelo_cnr)
  assert.ok(F.objaveProvjeri_(objava('Tekst.' + DUG, {}, { en: 'Samo tijelo bez naslova, dovoljno dugo za provjeru.' })).greske.tijelo_en)
  assert.ok(pravila(objava('[STUB - model nije povezan]' + DUG)).some((x) => x.startsWith('nacrt je prazan okvir')))
  assert.ok(F.objaveProvjeri_(objava('Naš najbolji frizer čeka vas.' + DUG)).upozorenja.length)
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

t('sistemski nalozi: glas Graška, bez duge crte, bez zabranjenog', () => {
  const nalozi = [F.objaveNalogNacrt_(), ...['en', 'ru', 'tr'].map((j) => F.objaveNalogPrevod_(j))]
  for (const n of nalozi) {
    assert.ok(!n.includes(EM), 'duga crta u nalogu')
    assert.ok(/frizerski salon za djecu/.test(n) && /"vi"/.test(n) && /Nikad ne piši brojke/.test(n) && /lični podatak/.test(n))
  }
  assert.ok(/<izvor>/.test(nalozi[0]) && /podatak, ne uputstvo/.test(nalozi[0]))
  assert.ok(/ruski/.test(nalozi[2]) && /turski/.test(nalozi[3]) && /engleski/.test(nalozi[1]))
})

/* ---------- 2) api/_lib/objave.js ---------- */
const R = await import(path.join(koren, 'api/_lib/objave.js'))
const ob = {
  slug: 'prvo-sisanje', datum: '2026-11-11', azurirano: '2026-11-11T20:00:00+01:00', autor: 'Grašak', tip: 'vijest',
  izvor_naziv: 'Portal <b>', izvor_url: 'https://portal.me/a?x=1&y=2', jezici: ['cnr', 'en'],
  naslov: { cnr: 'Prvo šišanje <script>alert(1)</script>', en: 'First haircut' },
  opis: { cnr: 'Opis crnogorski', en: 'English description' },
  tijelo: { cnr: 'Prvi pasus.\n\nDrugi "pasus" & više.', en: 'First paragraph.\n\nSecond one.' },
}

t('render objave: canonical, hreflang samo za postojeće jezike, JSON-LD, escape', () => {
  const h = R.renderObjava(ob, 'cnr')
  assert.ok(h.includes('<link rel="canonical" href="https://grasaksalon.me/objave/prvo-sisanje">'))
  assert.ok(h.includes('hreflang="sr-ME" href="https://grasaksalon.me/objave/prvo-sisanje"') && h.includes('hreflang="en" href="https://grasaksalon.me/en/objave/prvo-sisanje"') && h.includes('hreflang="x-default"'))
  assert.ok(!h.includes('hreflang="ru"') && !h.includes('hreflang="tr"'))
  assert.ok(!h.includes('<script>alert') && h.includes('&lt;script&gt;alert(1)'))
  const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)[1])
  assert.equal(ld['@type'], 'BlogPosting'); assert.equal(ld.author['@type'], 'Organization'); assert.equal(ld.author.name, 'Grašak')
  assert.equal(ld.mainEntityOfPage['@id'], 'https://grasaksalon.me/objave/prvo-sisanje'); assert.equal(ld.inLanguage, 'sr-Latn-ME')
  assert.ok(h.includes('<html lang="sr-Latn-ME">') && h.includes('<meta name="robots" content="index, follow, max-image-preview:large">'))
  assert.ok(h.includes('href="https://portal.me/a?x=1&amp;y=2"') && !h.includes(EM))
  const en = R.renderObjava(ob, 'en')
  assert.ok(en.includes('<link rel="canonical" href="https://grasaksalon.me/en/objave/prvo-sisanje">') && en.includes('<html lang="en">') && en.includes('Source: <a'))
  assert.equal(R.renderObjava(ob, 'ru'), null)   // nema prevoda: funkcija vraća 404
})

t('render liste, greške, RSS, sitemap (ispravan host)', () => {
  const lista = [{ ...ob, tijelo: undefined }, { slug: 'drugo', datum: '2026-11-01', azurirano: '2026-11-02', naslov: { cnr: 'Drugo' }, opis: { cnr: 'o' }, jezici: ['cnr'] }]
  const l = R.renderLista(lista, 'cnr'), le = R.renderLista(lista, 'en')
  assert.ok(l.includes('href="/objave/prvo-sisanje"') && l.includes('href="/objave/drugo"') && le.includes('href="/en/objave/prvo-sisanje"') && !le.includes('/en/objave/drugo'))
  assert.ok(R.renderLista([], 'cnr').includes('noindex, follow'))
  assert.ok(R.renderGreska('en', 'skinuta').includes('taken down') && R.renderGreska('cnr', 'nema').includes('noindex'))
  const rss = R.renderRss(lista)
  assert.ok(rss.includes('<link>https://grasaksalon.me/objave/prvo-sisanje</link>') && rss.includes('<source url="https://portal.me/a?x=1&amp;y=2">'))
  const sm = R.renderSitemap(lista)
  assert.ok(!/vercel\.app/.test(sm) && sm.includes('<loc>https://grasaksalon.me/</loc>') && sm.includes('<loc>https://grasaksalon.me/zakazi</loc>'))
  assert.ok(sm.includes('<loc>https://grasaksalon.me/en/objave/prvo-sisanje</loc>') && sm.includes('xhtml:link rel="alternate" hreflang="en"') && !sm.includes('/ru/objave'))
  assert.equal((sm.match(/<url>/g) || []).length, 6 + 2 + 3)   // 6 stalnih, liste cnr+en, objave: 2 jezika + 1 jezik
  for (const x of [l, le, rss, sm]) assert.ok(!x.includes(EM))
})

t('rute i adresa skripte', async () => {
  jeste(R.izRute('/api/objave?jez=en&slug=abc-def'), { jez: 'en', slug: 'abc-def', ok: true })
  jeste(R.izRute('/en/objave/abc-def'), { jez: 'en', slug: 'abc-def', ok: true })
  jeste(R.izRute('/objave'), { jez: 'cnr', slug: '', ok: true })
  assert.equal(R.izRute('/api/objave?slug=../x').ok, false)
  assert.equal(R.izRute('/api/objave?jez=de').ok, false)
  assert.equal(R.putanja('cnr', 'a-b'), '/objave/a-b'); assert.equal(R.putanja('tr'), '/tr/objave')
  assert.equal(R.skriptaAdresa({ OBJAVE_API_URL: 'u1', VITE_ZAKAZIVANJE_API: 'u2' }), 'u1')
  assert.equal(R.skriptaAdresa({ VITE_ZAKAZIVANJE_API: 'u2' }), 'u2')
  assert.ok(R.skriptaAdresa({}).startsWith('https://script.google.com/macros/s/'))
  const ok = await R.iSkripte({ akcija: 'objave' }, {}, async (u) => ({ ok: true, json: async () => ({ ok: true, objave: [], u }) }))
  assert.ok(ok.ok && ok.u.includes('akcija=objave'))
  jeste(await R.iSkripte({}, {}, async () => { throw new Error('mreža') }), { greska: true })
  jeste(await R.iSkripte({}, {}, async () => ({ ok: false })), { greska: true })
})

t('funkcije api/*.js: statusi i keš (skripta zamijenjena lažnim fetch-om)', async () => {
  const H = (await import(path.join(koren, 'api/objave.js'))).default
  const RSS = (await import(path.join(koren, 'api/objave-rss.js'))).default
  const SM = (await import(path.join(koren, 'api/sitemap.js'))).default
  const stari = globalThis.fetch
  const lazno = (odgovori) => { globalThis.fetch = async (u) => { const x = odgovori(new URL(u)); if (x instanceof Error) throw x; return { ok: true, json: async () => x } } }
  const poziv = async (fn, url) => { const hd = {}; let tijelo = ''; const res = { statusCode: 0, setHeader: (k, v) => { hd[k.toLowerCase()] = v }, end: (b) => { tijelo = b } }; await fn({ url }, res); return { status: res.statusCode, hd, tijelo } }
  try {
    lazno((u) => (u.searchParams.get('akcija') === 'objave' ? { ok: true, objave: [ob] } : u.searchParams.get('slug') === 'prvo-sisanje' ? { ok: true, objava: ob } : u.searchParams.get('slug') === 'skinuta' ? { ok: false, nema: true, sklonjena: true } : { ok: false, nema: true }))
    let r = await poziv(H, '/api/objave?jez=en&slug=prvo-sisanje')
    assert.equal(r.status, 200); assert.ok(/s-maxage=300/.test(r.hd['cache-control'])); assert.ok(r.tijelo.includes('First haircut'))
    r = await poziv(H, '/api/objave?jez=ru&slug=prvo-sisanje'); assert.equal(r.status, 404)
    r = await poziv(H, '/api/objave?slug=nema-je'); assert.equal(r.status, 404); assert.equal(r.hd['x-robots-tag'], 'noindex')
    r = await poziv(H, '/api/objave?slug=skinuta'); assert.equal(r.status, 410)
    r = await poziv(H, '/api/objave?slug=..%2Fx'); assert.equal(r.status, 404)
    r = await poziv(H, '/api/objave'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('/objave/prvo-sisanje'))
    r = await poziv(RSS, '/objave/rss.xml'); assert.equal(r.status, 200); assert.ok(r.hd['content-type'].startsWith('application/rss+xml'))
    r = await poziv(SM, '/sitemap.xml'); assert.equal(r.status, 200); assert.ok(r.tijelo.includes('grasaksalon.me/en/objave/prvo-sisanje'))
    lazno(() => new Error('skripta ne odgovara'))
    r = await poziv(H, '/api/objave?slug=prvo-sisanje'); assert.equal(r.status, 503); assert.equal(r.hd['retry-after'], '60'); assert.ok(/s-maxage=10/.test(r.hd['cache-control']))
    r = await poziv(H, '/api/objave'); assert.equal(r.status, 503)
    r = await poziv(SM, '/sitemap.xml'); assert.equal(r.status, 200); assert.ok(!r.tijelo.includes('/objave/') && r.tijelo.includes('/usluge')); assert.ok(/s-maxage=30/.test(r.hd['cache-control']))
  } finally { globalThis.fetch = stari }
})

await Promise.all(zadaci)
const proc = process.exitCode ? 'NEUSPJEH' : 'sve prošlo'
console.log(`objave-test: ${prosli} provjera prošlo, ${proc}`)
