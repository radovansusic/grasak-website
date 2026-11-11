// Objave za Google: stvarni HTML, RSS i sitemap iz javnog GET-a Google skripte (Grasak.gs: akcija=objave, akcija=objava).
// Čiste funkcije (bez mreže, bez Vercel okruženja): scripts/objave-test.mjs ih pokreće u Node-u.
// Folder _lib se ne pretvara u funkciju (prefiks _). Nema tajni: skripta javno vraća samo objavljene objave.

export const SITE = 'https://grasaksalon.me'
export const NAZIV = 'Grašak'
export const JEZICI = ['cnr', 'en', 'ru', 'tr']
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// html lang: "cnr" sajt koristi u <html>, ali pretraživači znaju sr-Latn-ME; hreflang: jezik + država (en/ru/tr bez države)
export const HTML_LANG = { cnr: 'sr-Latn-ME', en: 'en', ru: 'ru', tr: 'tr' }
export const HREFLANG = { cnr: 'sr-ME', en: 'en', ru: 'ru', tr: 'tr' }
export const OG_LOCALE = { cnr: 'sr_Latn_ME', en: 'en_US', ru: 'ru_RU', tr: 'tr_TR' }
export const JEZIK_OZNAKA = { cnr: 'CG', en: 'EN', ru: 'RU', tr: 'TR' }

const TEKST = {
  cnr: { naslov: 'Objave', sub: 'Novosti i savjeti za roditelje mališana iz dječijeg frizerskog salona Grašak.', prazno: 'Uskoro ovdje stižu prve objave.', izvor: 'Izvor', sve: 'Sve objave', zakazi: 'Zakaži termin', pocetna: 'Početna', radno: 'Radno vrijeme: uto-pet 15-21, sub-ned 11-21', slogan: 'Bez straha. Kroz igru.', nema: 'Objava ne postoji.', skinuta: 'Objava je skinuta.', greska: 'Objave trenutno nijesu dostupne. Pokušajte za koji minut.' },
  en: { naslov: 'News', sub: 'News and tips for parents of little ones from Grašak, the children\'s hair salon.', prazno: 'The first posts are coming soon.', izvor: 'Source', sve: 'All posts', zakazi: 'Book an appointment', pocetna: 'Home', radno: 'Open Tue-Fri 15-21, Sat-Sun 11-21', slogan: 'No fear. Just play.', nema: 'This post does not exist.', skinuta: 'This post has been taken down.', greska: 'Posts are temporarily unavailable. Please try again in a few minutes.' },
  ru: { naslov: 'Новости', sub: 'Новости и советы для родителей малышей от детского салона Grašak.', prazno: 'Первые публикации скоро появятся.', izvor: 'Источник', sve: 'Все публикации', zakazi: 'Записаться', pocetna: 'Главная', radno: 'Вт-Пт 15-21, Сб-Вс 11-21', slogan: 'Без страха. Играя.', nema: 'Публикация не найдена.', skinuta: 'Публикация снята.', greska: 'Публикации временно недоступны. Попробуйте через несколько минут.' },
  tr: { naslov: 'Haberler', sub: 'Çocuk kuaförü Grašak\'tan minikler için haberler ve ipuçları.', prazno: 'İlk yazılar çok yakında burada.', izvor: 'Kaynak', sve: 'Tüm yazılar', zakazi: 'Randevu al', pocetna: 'Ana sayfa', radno: 'Sal-Cum 15-21, Cmt-Paz 11-21', slogan: 'Korkusuz. Oyunla.', nema: 'Yazı bulunamadı.', skinuta: 'Bu yazı kaldırıldı.', greska: 'Yazılar şu anda kullanılamıyor. Birkaç dakika sonra tekrar deneyin.' },
}
export const tekst = (jez) => TEKST[jez] || TEKST.cnr

export const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
/** JSON za <script type="application/ld+json">: nema izlaza iz elementa. */
export const ldJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')

/** Putanja: crnogorski bez prefiksa, ostali jezici sa prefiksom /en, /ru, /tr (slug ima najmanje 3 znaka, pa ne može biti "en"). */
export const putanja = (jez, slug) => (jez === 'cnr' ? '' : '/' + jez) + '/objave' + (slug ? '/' + slug : '')
export const adresa = (jez, slug) => SITE + putanja(jez, slug)

/** Iz adrese (ili upita) odredi jezik i slug. Upit (jez, slug) ima prednost, jer ga rewrite upisuje; putanja je rezerva. */
export function izRute(urlString) {
  let u
  try { u = new URL(urlString, SITE) } catch { return { jez: 'cnr', slug: '', ok: false } }
  let jez = u.searchParams.get('jez') || ''
  let slug = u.searchParams.get('slug') || ''
  if (!jez && !slug) {
    const m = /^\/(?:(en|ru|tr)\/)?objave(?:\/([^/]+))?\/?$/.exec(u.pathname)
    if (m) { jez = m[1] || ''; slug = m[2] || '' }
  }
  jez = jez || 'cnr'
  const ok = JEZICI.includes(jez) && (!slug || SLUG_RE.test(slug))
  return { jez, slug, ok }
}

export function datumLijep(iso, jez) {
  try {
    return new Intl.DateTimeFormat(HTML_LANG[jez] || 'sr-Latn-ME', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Podgorica' }).format(new Date(String(iso).slice(0, 10) + 'T12:00:00Z'))
  } catch { return String(iso).slice(0, 10) }
}

const paragrafi = (t) => String(t || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n')

const CSS = `
:root{--zelena:#45813D;--tamna:#094421;--krem:#FFF5E5;--tinta:#22302A;--sunce:#F2E578;--blijedo:#F0F7EF}
*{box-sizing:border-box}
body{margin:0;background:var(--krem);color:var(--tinta);font:18px/1.7 Nunito,system-ui,sans-serif}
.top{background:var(--tamna);color:#fff}
.top-in,.wrap,.foot-in{max-width:760px;margin:0 auto;padding:0 20px}
.top-in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px}
.top a{color:#fff;text-decoration:none}
.logo{display:flex;align-items:center;gap:10px;font:800 24px/1 "Baloo 2",cursive}
.logo img{width:40px;height:40px;border-radius:50%;background:#fff;padding:2px}
.top nav{display:flex;gap:14px;align-items:center;font-size:15px;font-weight:700}
.btn{display:inline-block;background:var(--zelena);color:#fff!important;border-radius:999px;padding:8px 18px;font-weight:800;text-decoration:none}
.wrap{padding-top:36px;padding-bottom:56px}
h1{font:800 clamp(30px,6vw,44px)/1.15 "Baloo 2",cursive;color:var(--tamna);margin:0 0 10px;text-wrap:balance}
.meta{color:#5d6b63;font-size:14px;font-weight:700;margin:0 0 22px;text-transform:uppercase;letter-spacing:.04em}
.sub{margin:0 0 24px;color:#3e4d44}
article p{margin:0 0 1.1em}
.izvor{border-top:3px solid var(--sunce);margin-top:30px;padding-top:14px;font-size:15px}
.izvor a,article a{color:var(--zelena);font-weight:700}
.jezici{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 0;font-size:14px}
.jezici a,.jezici span{padding:4px 12px;border-radius:999px;background:#fff;color:var(--tamna);text-decoration:none;font-weight:800}
.jezici span{background:var(--zelena);color:#fff}
ul.lista{list-style:none;margin:0;padding:0;display:grid;gap:18px}
ul.lista li{background:#fff;border-radius:24px;padding:22px 24px;box-shadow:0 4px 18px rgba(34,48,42,.07)}
ul.lista a.n{font:800 24px/1.2 "Baloo 2",cursive;color:var(--tamna);text-decoration:none}
ul.lista p{margin:8px 0 0}
ul.lista .meta{margin:6px 0 0}
.cta{margin:34px 0 0;padding:22px 24px;border-radius:24px;background:var(--blijedo)}
.cta p{margin:0 0 12px;font-weight:800;font-family:"Baloo 2",cursive;font-size:22px;color:var(--tamna)}
footer{background:var(--tamna);color:rgba(255,255,255,.85);font-size:14px;padding:22px 0}
footer a{color:#fff}
a:focus-visible{outline:3px solid var(--sunce);outline-offset:3px}
`

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">'

/** Alternativne adrese po jezicima (samo jezici koje objava ima) + x-default na crnogorski. */
export function hreflangLinkovi(slug, jezici) {
  const imaju = JEZICI.filter((j) => j === 'cnr' || jezici.includes(j))
  const redovi = imaju.map((j) => `<link rel="alternate" hreflang="${HREFLANG[j]}" href="${esc(adresa(j, slug))}">`)
  redovi.push(`<link rel="alternate" hreflang="x-default" href="${esc(adresa('cnr', slug))}">`)
  return redovi.join('\n')
}

function okvir({ jez, naslov, opis, canonical, robots, glava, tijelo, jezici, slug }) {
  const T = tekst(jez)
  const prekidac = slug !== undefined
    ? `<div class="jezici" aria-label="Jezik">${JEZICI.filter((j) => j === 'cnr' || jezici.includes(j)).map((j) => (j === jez ? `<span lang="${HTML_LANG[j]}">${JEZIK_OZNAKA[j]}</span>` : `<a href="${esc(putanja(j, slug))}" hreflang="${HREFLANG[j]}" lang="${HTML_LANG[j]}">${JEZIK_OZNAKA[j]}</a>`)).join('')}</div>`
    : ''
  return `<!doctype html>
<html lang="${HTML_LANG[jez]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(naslov)}</title>
<meta name="description" content="${esc(opis)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#45813D">
<link rel="icon" type="image/png" href="/icon-192.png">
<link rel="alternate" type="application/rss+xml" title="${NAZIV} | ${esc(TEKST.cnr.naslov)}" href="${SITE}/objave/rss.xml">
${glava || ''}${FONTS}
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="top-in"><a class="logo" href="/"><img src="/brand/grasak-znak.svg" alt="" width="40" height="40"><span>${NAZIV}</span></a><nav><a href="${putanja(jez)}">${esc(T.naslov)}</a><a class="btn" href="/zakazi">${esc(T.zakazi)}</a></nav></div></header>
<main class="wrap">
${tijelo}
${prekidac}
<div class="cta"><p>${esc(T.slogan)}</p><a class="btn" href="/zakazi">${esc(T.zakazi)}</a></div>
</main>
<footer><div class="foot-in">${NAZIV} - dječiji frizerski salon, Branka Deletića bb, Lamela A, New City, Podgorica · <a href="tel:+38269371111">+382 69 371 111</a> · ${esc(T.radno)} · <a href="/">${esc(T.pocetna)}</a></div></footer>
</body>
</html>
`
}

/** Jedna objava na jeziku `jez`; null ako objava nema taj jezik. Ulaz je odgovor skripte (akcija=objava). */
export function renderObjava(ob, jez) {
  if (!ob || !ob.naslov || !ob.naslov[jez] || !ob.tijelo || !ob.tijelo[jez]) return null
  const T = tekst(jez)
  const url = adresa(jez, ob.slug)
  const opis = (ob.opis && ob.opis[jez]) || String(ob.tijelo[jez]).replace(/\s+/g, ' ').slice(0, 155)
  const jezici = ob.jezici || Object.keys(ob.naslov)
  const slika = SITE + '/images/fb_cover.jpg'
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: ob.naslov[jez].slice(0, 110),
    description: opis,
    inLanguage: HTML_LANG[jez],
    datePublished: ob.datum,
    dateModified: ob.azurirano || ob.datum,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: [slika],
    author: { '@type': 'Organization', name: NAZIV, url: SITE + '/' },
    publisher: { '@type': 'Organization', name: NAZIV, url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png' } },
  }
  if (ob.izvor_url) ld.citation = { '@type': 'CreativeWork', name: ob.izvor_naziv || ob.izvor_url, url: ob.izvor_url }
  const glava =
    hreflangLinkovi(ob.slug, jezici) + '\n' +
    `<meta property="og:type" content="article">\n<meta property="og:site_name" content="${NAZIV}">\n<meta property="og:locale" content="${OG_LOCALE[jez]}">\n` +
    `<meta property="og:title" content="${esc(ob.naslov[jez])}">\n<meta property="og:description" content="${esc(opis)}">\n<meta property="og:url" content="${esc(url)}">\n<meta property="og:image" content="${esc(slika)}">\n` +
    `<meta property="article:published_time" content="${esc(ob.datum)}">\n<meta name="twitter:card" content="summary_large_image">\n` +
    `<script type="application/ld+json">${ldJson(ld)}</script>\n`
  const izvor = ob.izvor_url ? `<p class="izvor">${esc(T.izvor)}: <a href="${esc(ob.izvor_url)}" rel="noopener nofollow">${esc(ob.izvor_naziv || ob.izvor_url)}</a></p>` : ''
  const tijelo = `<article>\n<h1>${esc(ob.naslov[jez])}</h1>\n<p class="meta"><time datetime="${esc(ob.datum)}">${esc(datumLijep(ob.datum, jez))}</time></p>\n${paragrafi(ob.tijelo[jez])}\n${izvor}\n</article>`
  return okvir({ jez, naslov: `${ob.naslov[jez]} | ${NAZIV}`, opis, canonical: url, robots: 'index, follow, max-image-preview:large', glava, tijelo, jezici, slug: ob.slug })
}

/** Lista objava na jeziku `jez` (samo one koje imaju taj jezik). Ulaz: objave iz akcije=objave. */
export function renderLista(lista, jez) {
  const T = tekst(jez)
  const sad = (lista || []).filter((o) => o.naslov && o.naslov[jez])
  const stavke = sad.map((o) => `<li><a class="n" href="${esc(putanja(jez, o.slug))}">${esc(o.naslov[jez])}</a><p class="meta"><time datetime="${esc(o.datum)}">${esc(datumLijep(o.datum, jez))}</time></p><p>${esc((o.opis && o.opis[jez]) || '')}</p></li>`).join('\n')
  const tijelo = `<h1>${esc(T.naslov)}</h1>\n<p class="sub">${esc(T.sub)}</p>\n${sad.length ? `<ul class="lista">\n${stavke}\n</ul>` : `<p>${esc(T.prazno)}</p>`}`
  const alt = JEZICI.filter((j) => j === 'cnr' || (lista || []).some((o) => o.naslov && o.naslov[j]))
  const glava = alt.map((j) => `<link rel="alternate" hreflang="${HREFLANG[j]}" href="${esc(adresa(j))}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${esc(adresa('cnr'))}">\n`
  return okvir({ jez, naslov: `${T.naslov} | ${NAZIV}`, opis: T.sub, canonical: adresa(jez), robots: sad.length ? 'index, follow' : 'noindex, follow', glava, tijelo, jezici: [] })
}

/** Strana greške (404, 410, 503): kratka, noindex, na jeziku posjetioca. */
export function renderGreska(jez, vrsta) {
  const T = tekst(jez)
  const poruka = vrsta === 'skinuta' ? T.skinuta : vrsta === 'greska' ? T.greska : T.nema
  const tijelo = `<h1>${esc(poruka)}</h1>\n<p><a href="${putanja(jez)}">${esc(T.sve)}</a></p>`
  return okvir({ jez, naslov: `${poruka} | ${NAZIV}`, opis: poruka, canonical: adresa(jez), robots: 'noindex', tijelo, jezici: [] })
}

const rfc822 = (iso) => new Date(String(iso).slice(0, 10) + 'T12:00:00Z').toUTCString()

/** RSS 2.0 (crnogorski): najviše 50 najnovijih. */
export function renderRss(lista) {
  const stavke = (lista || []).filter((o) => o.naslov && o.naslov.cnr).slice(0, 50).map((o) =>
    `    <item>\n      <title>${esc(o.naslov.cnr)}</title>\n      <link>${esc(adresa('cnr', o.slug))}</link>\n      <guid isPermaLink="true">${esc(adresa('cnr', o.slug))}</guid>\n` +
    `      <pubDate>${rfc822(o.datum)}</pubDate>\n      <description>${esc((o.opis && o.opis.cnr) || '')}</description>\n` +
    (o.izvor_url ? `      <source url="${esc(o.izvor_url)}">${esc(o.izvor_naziv || o.izvor_url)}</source>\n` : '') + '    </item>').join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${NAZIV} | ${esc(TEKST.cnr.naslov)}</title>
    <link>${SITE}/objave</link>
    <description>${esc(TEKST.cnr.sub)}</description>
    <language>sr-Latn-ME</language>
    <atom:link href="${SITE}/objave/rss.xml" rel="self" type="application/rss+xml"/>
${stavke}
  </channel>
</rss>
`
}

const STATICKE = [['/', 'weekly', '1.0'], ['/usluge', 'monthly', '0.9'], ['/o-nama', 'monthly', '0.8'], ['/galerija', 'weekly', '0.8'], ['/kontakt', 'monthly', '0.9'], ['/zakazi', 'weekly', '1.0']]

/** Sitemap sa ispravnim hostom: 6 stalnih strana, liste objava po jezicima i svaka objava na svakom svom jeziku (sa xhtml:link alternativama). */
export function renderSitemap(lista) {
  const redovi = STATICKE.map(([p, f, pr]) => `  <url><loc>${SITE}${p === '/' ? '/' : p}</loc><changefreq>${f}</changefreq><priority>${pr}</priority></url>`)
  const objave = lista || []
  JEZICI.forEach((j) => {
    if (j === 'cnr' || objave.some((o) => o.naslov && o.naslov[j])) redovi.push(`  <url><loc>${esc(adresa(j))}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`)
  })
  objave.forEach((o) => {
    const jezici = JEZICI.filter((j) => o.naslov && o.naslov[j])
    const alt = jezici.map((j) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[j]}" href="${esc(adresa(j, o.slug))}"/>`).concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(adresa('cnr', o.slug))}"/>`).join('\n')
    jezici.forEach((j) => {
      redovi.push(`  <url>\n    <loc>${esc(adresa(j, o.slug))}</loc>\n    <lastmod>${esc(String(o.azurirano || o.datum).slice(0, 10))}</lastmod>\n${alt}\n  </url>`)
    })
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${redovi.join('\n')}
</urlset>
`
}

/* ---------- veza sa skriptom (jedino što koristi mrežu) ---------- */

// Ista adresa web appa kao u src/lib/zakazivanje.ts (GRASAK_APPS_SCRIPT). Rezerva ako nijedna varijabla okruženja nije postavljena.
const SKRIPTA_RAZVOJ = 'https://script.google.com/macros/s/AKfycbxsSbajtO0KiVGGFliIT9x9Q4dRqXtodsfGjNQuR9Pq_H610MMICByJzVyeT1vjv1I1/exec'

/** OBJAVE_API_URL (opciono) > VITE_ZAKAZIVANJE_API (ako je postavljena na Vercelu) > adresa iz koda. */
export const skriptaAdresa = (env = {}) => env.OBJAVE_API_URL || env.VITE_ZAKAZIVANJE_API || SKRIPTA_RAZVOJ

export async function iSkripte(parametri, env = {}, dohvati = fetch) {
  const kontrola = new AbortController()
  const sat = setTimeout(() => kontrola.abort(), 9000)
  try {
    const r = await dohvati(skriptaAdresa(env) + '?' + new URLSearchParams(parametri), { signal: kontrola.signal, redirect: 'follow', headers: { accept: 'application/json' } })
    if (!r.ok) return { greska: true }
    const j = await r.json()
    if (j && j.greska) return { greska: true }
    return j
  } catch {
    return { greska: true }
  } finally {
    clearTimeout(sat)
  }
}
