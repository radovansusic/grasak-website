// Graškov kutak za Google: stvarni HTML, RSS i sitemap iz javnog GET-a Google skripte (Grasak.gs: akcija=objave, akcija=objava).
// Čiste funkcije (bez mreže, bez Vercel okruženja): scripts/objave-test.mjs ih pokreće u Node-u.
// Folder _lib se ne pretvara u funkciju (prefiks _). Nema tajni: skripta javno vraća samo objavljene tekstove i samo potvrđene prevode.
// Rubrike, vrste i oznake NIJESU ovdje: dolaze iz odgovora skripte (taksonomija), jedna lista u Grasak.gs.

import { SALON, radnoRed } from '../../src/data/salon.js'

export const SITE = 'https://grasaksalon.me'
export const NAZIV = 'Grašak'
export const JEZICI = ['cnr', 'en', 'ru', 'tr']
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// html lang: "cnr" sajt koristi u <html>, ali pretraživači znaju sr-Latn-ME; hreflang: jezik + država (en/ru/tr bez države)
export const HTML_LANG = { cnr: 'sr-Latn-ME', en: 'en', ru: 'ru', tr: 'tr' }
export const HREFLANG = { cnr: 'sr-ME', en: 'en', ru: 'ru', tr: 'tr' }
export const OG_LOCALE = { cnr: 'sr_Latn_ME', en: 'en_US', ru: 'ru_RU', tr: 'tr_TR' }
export const JEZIK_OZNAKA = { cnr: 'CG', en: 'EN', ru: 'RU', tr: 'TR' }
/** Strana oznake je indeksirana i u sitemap-u tek kad oznaka ima bar toliko tekstova na tom jeziku; do tada je noindex,follow. */
export const OZNAKA_MIN_TEKSTOVA = 5
export const KUTAK = 'kutak'   // isti slug na svim jezicima
// Tekst sa na_kutku=true JE OZNAČEN za Kutak, ali dom na Kutku ima tek kad Kutak potvrdi da kopija postoji (kutak_potvrdjen, vidi potvrdiKutak niže).
// Tek tada Grašak ostavlja strani canonical na Kutak (isti slug), bez hreflang i bez adrese u sitemap-u. Do potvrde je tekst običan Graškov tekst:
// samoreferentni canonical, hreflang, sitemap. Razlog: uvoz na Kutku radi jednom na sat, može biti isključen, može preskočiti tekst (sudar slug-a sa ručnim člankom).
export const KUTAK_SAJT = 'https://djecijikutak.me'
export const kutakAdresa = (slug) => KUTAK_SAJT + '/blog/' + slug
export const naKutku = (o) => !!o && o.na_kutku === true && o.kutak_potvrdjen === true
/** canonical ide na Kutak samo uz potvrdu da kopija tamo postoji; inače ostaje na Grašku. */
export const kutakKanon = (o) => naKutku(o)

const TEKST = {
  cnr: {
    naslov: 'Graškov kutak', kratko: 'Kutak', sub: 'Savjeti, igre i novosti za roditelje mališana iz dječijeg frizerskog salona Grašak.',
    prazno: 'Uskoro ovdje stižu prvi tekstovi.', izvor: 'Izvor', sve: 'Sve', vrsta: 'Vrsta teksta', rubrike: 'Rubrike',
    zakazi: 'Zakažite termin', pocetna: 'Početna', usluge: 'Usluge i cijene', onama: 'O nama', galerija: 'Galerija', kontakt: 'Kontakt',
    salon: 'dječiji frizerski salon', slogan: 'Bez straha. Kroz igru.', nema: 'Ovaj tekst ne postoji.', skinuta: 'Ovaj tekst je skinut.',
    greska: 'Kutak trenutno nije dostupan. Pokušajte za koji minut.', azurirano: 'Ažurirano', danas: 'Šta možete uraditi danas', oznake: 'Oznake',
    povezano: 'Još iz rubrike', oznakaNaslov: 'Oznaka', oznakaOpis: 'Tekstovi iz Graškovog kutka sa oznakom', rubrikaPrazna: 'U ovoj rubrici još nema tekstova.',
    oznakaPrazna: 'Sa ovom oznakom još nema tekstova.', jezik: 'Jezik', nazad: 'Graškov kutak',
    minuta: (n) => `${n} min čitanja`,
  },
  en: {
    naslov: 'Grašak\'s Corner', kratko: 'Corner', sub: 'Tips, games and news for parents of little ones from Grašak, the children\'s hair salon.',
    prazno: 'The first posts are coming soon.', izvor: 'Source', sve: 'All', vrsta: 'Type', rubrike: 'Topics',
    zakazi: 'Book an appointment', pocetna: 'Home', usluge: 'Services & Prices', onama: 'About us', galerija: 'Gallery', kontakt: 'Contact',
    salon: 'children\'s hair salon', slogan: 'No fear. Just play.', nema: 'This post does not exist.', skinuta: 'This post has been taken down.',
    greska: 'The Corner is temporarily unavailable. Please try again in a few minutes.', azurirano: 'Updated', danas: 'What you can do today', oznake: 'Tags',
    povezano: 'More from', oznakaNaslov: 'Tag', oznakaOpis: 'Posts from Grašak\'s Corner tagged', rubrikaPrazna: 'There are no posts in this topic yet.',
    oznakaPrazna: 'There are no posts with this tag yet.', jezik: 'Language', nazad: 'Grašak\'s Corner',
    minuta: (n) => `${n} min read`,
  },
  ru: {
    naslov: 'Уголок Grašak', kratko: 'Уголок', sub: 'Советы, игры и новости для родителей малышей от детской парикмахерской Grašak.',
    prazno: 'Первые тексты скоро появятся.', izvor: 'Источник', sve: 'Все', vrsta: 'Тип текста', rubrike: 'Рубрики',
    zakazi: 'Записаться', pocetna: 'Главная', usluge: 'Услуги и цены', onama: 'О нас', galerija: 'Галерея', kontakt: 'Контакты',
    salon: 'детская парикмахерская', slogan: 'Без страха. Играя.', nema: 'Этот текст не найден.', skinuta: 'Этот текст снят.',
    greska: 'Уголок временно недоступен. Попробуйте через несколько минут.', azurirano: 'Обновлено', danas: 'Что можно сделать сегодня', oznake: 'Метки',
    povezano: 'Ещё из рубрики', oznakaNaslov: 'Метка', oznakaOpis: 'Тексты из Уголка Grašak с меткой', rubrikaPrazna: 'В этой рубрике пока нет текстов.',
    oznakaPrazna: 'С этой меткой пока нет текстов.', jezik: 'Язык', nazad: 'Уголок Grašak',
    minuta: (n) => `${n} мин чтения`,
  },
  tr: {
    naslov: 'Grašak Köşesi', kratko: 'Köşe', sub: 'Çocuk kuaförü Grašak\'tan minikler için ipuçları, oyunlar ve haberler.',
    prazno: 'İlk yazılar çok yakında burada.', izvor: 'Kaynak', sve: 'Tümü', vrsta: 'Yazı türü', rubrike: 'Konular',
    zakazi: 'Randevu alın', pocetna: 'Ana sayfa', usluge: 'Hizmetler ve Fiyatlar', onama: 'Hakkımızda', galerija: 'Galeri', kontakt: 'İletişim',
    salon: 'çocuk kuaförü', slogan: 'Korkusuz. Oyunla.', nema: 'Yazı bulunamadı.', skinuta: 'Bu yazı kaldırıldı.',
    greska: 'Köşe şu anda kullanılamıyor. Birkaç dakika sonra tekrar deneyin.', azurirano: 'Güncellendi', danas: 'Bugün neler yapabilirsiniz', oznake: 'Etiketler',
    povezano: 'Konudan daha fazlası', oznakaNaslov: 'Etiket', oznakaOpis: 'Grašak Köşesi\'nden şu etiketli yazılar', rubrikaPrazna: 'Bu konuda henüz yazı yok.',
    oznakaPrazna: 'Bu etiketle henüz yazı yok.', jezik: 'Dil', nazad: 'Grašak Köşesi',
    minuta: (n) => `${n} dk okuma`,
  },
}
export const tekst = (jez) => TEKST[jez] || TEKST.cnr

// boje iz palete sajta (tailwind.config.js): grass, sun, sky, coral, grass-darkest; tekst je odabran za kontrast najmanje 4.5:1
export const BOJE = {
  zelena: ['#45813D', '#FFFFFF'],
  sunce: ['#F2E578', '#22302A'],
  nebo: ['#7ED6F2', '#22302A'],
  koral: ['#FF7A59', '#22302A'],
  tamna: ['#094421', '#FFFFFF'],
}
const bojaKlasa = (boja) => (BOJE[boja] ? boja : 'zelena')

/** Kontrolni i nevidljivi znaci (npr. U+0008, meki spojnik, nulti razmak) kvare XML feeda i ne nose smisao: skidaju se prije prikaza. Novi red i tabulator ostaju. */
export const bezKontrolnih = (s) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\uFFFE\uFFFF]/g, '')
export const esc = (s) => bezKontrolnih(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
/** Samo https adresa sa imenom domene; sve ostalo (javascript:, data:, http:) daje prazno. CSP sajta dozvoljava inline skripte, pa se shema provjerava i ovdje, ne samo u skripti. */
export function httpsUrl(u) {
  const s = bezKontrolnih(u).trim()
  const m = /^https:\/\/([a-z0-9.-]+)(?::443)?([\/?#][^\s<>"'`\\]*)?$/i.exec(s)
  return m && m[1].indexOf('.') > 0 && !/^[.-]|[.-]$|\.\./.test(m[1]) && s.length <= 2000 ? s : ''
}
/** JSON za <script type="application/ld+json">: nema izlaza iz elementa. */
export const ldJson = (o) => JSON.stringify(o, (k, v) => (typeof v === 'string' ? bezKontrolnih(v) : v)).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')

/* ---------- adrese ---------- */

const pref = (jez) => (jez === 'cnr' ? '' : '/' + jez)
/** /kutak, /kutak/<slug>, /kutak/tema/<rubrika>, /kutak/oznaka/<oznaka>; crnogorski bez prefiksa, ostali /en, /ru, /tr (slug "kutak" je isti). */
export const putanja = (jez, slug) => pref(jez) + '/' + KUTAK + (slug ? '/' + slug : '')
export const putanjaTema = (jez, r) => pref(jez) + '/' + KUTAK + '/tema/' + r
export const putanjaOznaka = (jez, o) => pref(jez) + '/' + KUTAK + '/oznaka/' + o
export const adresa = (jez, slug) => SITE + putanja(jez, slug)
export const adresaTema = (jez, r) => SITE + putanjaTema(jez, r)
export const adresaOznaka = (jez, o) => SITE + putanjaOznaka(jez, o)

/**
 * Iz adrese (ili upita) odredi jezik i koju stranu traže: lista, tema (rubrika), oznaka ili objava.
 * Upit (jez, slug, tema, oznaka) ima prednost, jer ga rewrite upisuje; putanja je rezerva. ?vrsta= je filter po vrsti.
 */
export function izRute(urlString) {
  let u
  try { u = new URL(urlString, SITE) } catch { return { jez: 'cnr', tip: 'lista', kljuc: '', vrsta: '', ok: false } }
  let jez = u.searchParams.get('jez') || ''
  let slug = u.searchParams.get('slug') || ''
  let tema = u.searchParams.get('tema') || ''
  let oznaka = u.searchParams.get('oznaka') || ''
  if (!jez && !slug && !tema && !oznaka) {
    const m = /^\/(?:(en|ru|tr)\/)?kutak(?:\/(?:(tema|oznaka)\/([^/]+)|([^/]+)))?\/?$/.exec(u.pathname)
    if (m) { jez = m[1] || ''; if (m[2] === 'tema') tema = m[3]; else if (m[2] === 'oznaka') oznaka = m[3]; else slug = m[4] || '' }
  }
  jez = jez || 'cnr'
  const vrsta = (u.searchParams.get('vrsta') || '').slice(0, 40)
  const tip = tema ? 'tema' : oznaka ? 'oznaka' : slug ? 'objava' : 'lista'
  const kljuc = tema || oznaka || slug
  const ok = JEZICI.includes(jez) && (!kljuc || SLUG_RE.test(kljuc)) && (!vrsta || SLUG_RE.test(vrsta))
  return { jez, tip, kljuc, vrsta, ok }
}

export function datumLijep(iso, jez) {
  try {
    return new Intl.DateTimeFormat(HTML_LANG[jez] || 'sr-Latn-ME', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Podgorica' }).format(new Date(String(iso).slice(0, 10) + 'T12:00:00Z'))
  } catch { return String(iso).slice(0, 10) }
}

const paragrafi = (t) => String(t || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n')

/* ---------- taksonomija i brojanje (sve iz odgovora skripte) ---------- */

const rubrikaPo = (tax, slug) => (tax.rubrike || []).find((r) => r.slug === slug) || null
const oznakaPo = (tax, slug) => (tax.oznake || []).find((o) => o.slug === slug) || null
const vrstaPo = (tax, slug) => (tax.vrste || []).find((v) => v.slug === slug) || null
const naJeziku = (lista, jez) => (lista || []).filter((o) => o.naslov && o.naslov[jez])
const naGrasku = (lista, jez) => naJeziku(lista, jez).filter((o) => !naKutku(o))   // tekstovi koji na Grašku imaju svoj dom (za indeksiranje i sitemap)
export const brojOznake = (lista, jez, oznaka) => naGrasku(lista, jez).filter((o) => (o.oznake || []).includes(oznaka)).length
export const brojRubrike = (lista, jez, rubrika) => naGrasku(lista, jez).filter((o) => o.rubrika === rubrika).length
/** Oznaka je indeksirana (i u sitemap-u) tek sa 5 tekstova na tom jeziku. */
export const oznakaIndeksirana = (lista, jez, oznaka) => brojOznake(lista, jez, oznaka) >= OZNAKA_MIN_TEKSTOVA

/* ---------- izgled ---------- */

const CSS = `
:root{--zelena:#45813D;--tamna:#094421;--krem:#FFF5E5;--tinta:#22302A;--sunce:#F2E578;--blijedo:#F0F7EF;--nebo:#7ED6F2;--koral:#FF7A59}
*{box-sizing:border-box}
body{margin:0;background:var(--krem);color:var(--tinta);font:18px/1.7 Nunito,system-ui,sans-serif}
.top{background:var(--tamna);color:#fff}
.top-in,.wrap,.foot-in{max-width:1040px;margin:0 auto;padding:0 20px}
.top-in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px;flex-wrap:wrap}
.top a{color:#fff;text-decoration:none}
.logo{display:flex;align-items:center;gap:10px;font:800 24px/1 "Baloo 2",cursive}
.logo img{width:40px;height:40px;border-radius:50%;background:#fff;padding:2px}
.top nav{display:flex;gap:14px;align-items:center;font-size:15px;font-weight:700;flex-wrap:wrap}
.top nav a[aria-current=page]{text-decoration:underline;text-underline-offset:5px;text-decoration-color:var(--sunce);text-decoration-thickness:3px}
.btn{display:inline-block;background:var(--zelena);color:#fff!important;border-radius:999px;padding:8px 18px;font-weight:800;text-decoration:none}
.wrap{padding-top:34px;padding-bottom:56px}
.uzak{max-width:760px;margin:0 auto}
h1{font:800 clamp(30px,6vw,44px)/1.15 "Baloo 2",cursive;color:var(--tamna);margin:0 0 10px;text-wrap:balance}
h2{font:800 24px/1.25 "Baloo 2",cursive;color:var(--tamna);margin:0 0 10px}
.nazad{margin:0 0 14px;font-size:14px;font-weight:700}
.nazad a{color:#2d6a26;text-decoration:none}
.nazad a:hover{text-decoration:underline}
.meta{color:#4f5d55;font-size:14px;font-weight:700;margin:0 0 22px}
.sub{margin:0 0 20px;color:#3e4d44}
article p{margin:0 0 1.1em}
.izvor{border-top:3px solid var(--sunce);margin-top:30px;padding-top:14px;font-size:15px}
.izvor a,article a{color:#2d6a26;font-weight:700}
.napomena{font-size:14px;color:#4f5d55;margin:24px 0 0;padding:10px 14px;border-left:4px solid var(--nebo);background:#fff;border-radius:0 12px 12px 0}
.danas{margin:28px 0 0;padding:20px 22px;border-radius:24px;background:#fff;border:3px solid var(--sunce)}
.danas ol{margin:0;padding-left:1.3em}
.danas li{margin:0 0 .5em}
.jezici{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 0;font-size:14px}
.jezici a,.jezici span{padding:4px 12px;border-radius:999px;background:#fff;color:var(--tamna);text-decoration:none;font-weight:800}
.jezici span{background:var(--zelena);color:#fff}
.filter{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 14px;padding:0;list-style:none}
.filter a{display:inline-block;border-radius:999px;padding:6px 16px;font-weight:800;font-size:15px;text-decoration:none;border:3px solid transparent;color:var(--tinta);background:#fff}
.filter a[aria-current=true]{border-color:var(--tinta)}
.filter.vrste a{font-size:13px;padding:3px 12px;font-weight:700;background:transparent;border:2px solid #b9c4bd}
.filter.vrste a[aria-current=true]{border-color:var(--tinta);background:#fff}
.pill{display:inline-block;border-radius:999px;padding:3px 14px;font-weight:800;font-size:14px;text-decoration:none}
article .pill{color:inherit}
ul.mreza{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(270px,1fr))}
ul.mreza li{background:#fff;border-radius:24px;padding:20px 22px 18px;box-shadow:0 4px 18px rgba(34,48,42,.07);border-top:8px solid var(--zelena)}
ul.mreza li.r-sunce{border-top-color:var(--sunce)}
ul.mreza li.r-nebo{border-top-color:var(--nebo)}
ul.mreza li.r-koral{border-top-color:var(--koral)}
ul.mreza li.r-tamna{border-top-color:var(--tamna)}
.vr{display:block;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#4f5d55}
ul.mreza a.n{font:800 22px/1.2 "Baloo 2",cursive;color:var(--tamna);text-decoration:none}
ul.mreza a.n:hover{text-decoration:underline}
ul.mreza p{margin:8px 0 0;font-size:16px;line-height:1.55}
ul.mreza p.meta{margin:10px 0 0;font-size:13px}
.oznake{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:26px 0 0;padding:0}
.oznake a{display:inline-block;padding:2px 12px;border-radius:999px;background:var(--blijedo);color:var(--tamna);text-decoration:none;font-weight:700;font-size:14px;border:2px solid #cfe1cc}
.cta{margin:34px 0 0;padding:22px 24px;border-radius:24px;background:var(--blijedo)}
.cta p{margin:0 0 12px;font-weight:800;font-family:"Baloo 2",cursive;font-size:22px;color:var(--tamna)}
.povezano{margin:44px 0 0}
footer{background:var(--tamna);color:rgba(255,255,255,.85);font-size:15px;line-height:1.6;margin-top:24px;border-top:6px solid var(--sunce);border-radius:36px 36px 0 0}
footer a{color:#fff;text-decoration:none}
footer a:hover{color:var(--sunce)}
.foot-grid{display:grid;gap:30px;padding:40px 0 26px;grid-template-columns:1fr}
@media(min-width:640px){.foot-grid{grid-template-columns:1fr 1fr}}
@media(min-width:960px){.foot-grid{grid-template-columns:1.3fr 1fr 1.2fr 1fr}}
.foot-brand{display:flex;align-items:center;gap:12px;font:800 24px/1 "Baloo 2",cursive;color:#fff}
.foot-brand img{width:64px;height:64px;border-radius:50%;background:#fff;padding:4px;box-shadow:0 0 0 3px var(--sunce)}
.foot-quote{margin:14px 0 0;font-size:14px}
.drustvene{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 0;padding:0;list-style:none}
.drustvene a{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.1);font-weight:900;font-size:14px}
.drustvene a:hover{background:var(--zelena);color:#fff}
.drustvene svg{width:20px;height:20px}
footer h2{font:800 18px/1.2 "Baloo 2",cursive;color:#fff;margin:0 0 12px}
footer ul.lista{list-style:none;margin:0;padding:0}
footer ul.lista li{margin:0 0 8px}
footer ul.kont li{display:flex;gap:10px;align-items:flex-start}
footer ul.kont svg{width:18px;height:18px;flex:0 0 18px;margin-top:3px;color:var(--sunce)}
.foot-dno{border-top:1px solid rgba(255,255,255,.12);padding:16px 0 22px;font-size:13px;color:rgba(255,255,255,.6);text-align:center}
a:focus-visible{outline:3px solid var(--tinta);outline-offset:3px}
.top a:focus-visible,footer a:focus-visible{outline-color:var(--sunce)}
`
// boje rubrika: klase r-<boja> za dugmad i oznake rubrike
const CSS_BOJE = Object.entries(BOJE).map(([k, [bg, fg]]) => `.b-${k}{background:${bg}!important;color:${fg}!important}`).join('\n')

const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">'

/** Alternativne adrese po jezicima (samo jezici na kojima tekst stvarno postoji, potvrđeni) + x-default na crnogorsku verziju. */
export function hreflangLinkovi(slug, jezici) {
  const imaju = JEZICI.filter((j) => j === 'cnr' || jezici.includes(j))
  const redovi = imaju.map((j) => `<link rel="alternate" hreflang="${HREFLANG[j]}" href="${esc(adresa(j, slug))}">`)
  redovi.push(`<link rel="alternate" hreflang="x-default" href="${esc(adresa('cnr', slug))}">`)
  return redovi.join('\n')
}

/** Prekidač jezika: jezici = putanje po jeziku. */
function prekidac(jez, putanjeZaJezik) {
  const T = tekst(jez)
  return `<div class="jezici" role="navigation" aria-label="${esc(T.jezik)}">${JEZICI.filter((j) => putanjeZaJezik[j] !== undefined).map((j) => (j === jez ? `<span lang="${HTML_LANG[j]}" aria-current="true">${JEZIK_OZNAKA[j]}</span>` : `<a href="${esc(putanjeZaJezik[j])}" lang="${HTML_LANG[j]}">${JEZIK_OZNAKA[j]}</a>`)).join('')}</div>`
}

/** Radno vrijeme iz iste datoteke kao podnožje sajta (src/data/salon.js): dani i sati po redovima, spojeni sa " · ". */
export const radnoVrijeme = (jez) => SALON.radno.map((_, i) => radnoRed(jez, i)).join(' · ')

const IKONA = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3h-3V7a1 1 0 0 1 1-1h2z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 21l1.7-4.6A8.5 8.5 0 1 1 8 19.6z"/></svg>',
  mapa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  telefon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  mejl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  sat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
}
const MAPA_URL = 'https://www.google.com/maps/place/GRA%C5%A0AK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95'
const PODNOZJE = {
  cnr: { citat: '„Bez straha. Kroz igru. Samo osmjesi i super frizure!"', brzo: 'Brzi linkovi', kontakt: 'Kontakt', radno: 'Radno vrijeme', mapa: 'Lokacija', prava: '© 2025 Grašak · Prvi dječiji frizerski salon u Crnoj Gori' },
  en: { citat: '“No fear. Through play. Only smiles and great haircuts!”', brzo: 'Quick links', kontakt: 'Contact', radno: 'Working hours', mapa: 'Location', prava: '© 2025 Grašak · The first kids hair salon in Montenegro' },
  ru: { citat: '«Без страха. Через игру. Только улыбки и отличные стрижки!»', brzo: 'Быстрые ссылки', kontakt: 'Контакты', radno: 'Часы работы', mapa: 'Локация', prava: '© 2025 Grašak · Первая детская парикмахерская в Черногории' },
  tr: { citat: '“Korkusuz. Oyunla. Sadece gülümsemeler ve harika saç kesimleri!”', brzo: 'Hızlı bağlantılar', kontakt: 'İletişim', radno: 'Çalışma saatleri', mapa: 'Konum', prava: '© 2025 Grašak · Karadağ’ın ilk çocuk kuaförü' },
}

/** Podnožje strana Kutka u istom rasporedu kao podnožje sajta (src/components/Footer.tsx): znak i mreže, linkovi, kontakt, radno vrijeme. */
function podnozje(jez) {
  const T = tekst(jez)
  const P = PODNOZJE[jez] || PODNOZJE.cnr
  const dr = (href, oznaka, ikona, novo = true) => `<li><a href="${esc(href)}" aria-label="${esc(oznaka)}"${novo ? ' target="_blank" rel="noreferrer"' : ''}>${ikona}</a></li>`
  const lnk = (href, tx) => `<li><a href="${esc(href)}">${esc(tx)}</a></li>`
  return `<footer><div class="foot-in"><div class="foot-grid">
<div><a class="foot-brand" href="/"><img src="/brand/grasak-logo-zelena.svg" alt="" width="64" height="64"><span>GRAŠAK</span></a><p class="foot-quote">${esc(P.citat)}</p>
<ul class="drustvene">${dr('https://instagram.com/djecijisalon', 'Instagram', IKONA.instagram)}${dr('https://www.facebook.com/p/Dje%C4%8Diji-salon-Gra%C5%A1ak-61559455795290/', 'Facebook', IKONA.facebook)}${dr('https://wa.me/38269371111', 'WhatsApp', IKONA.whatsapp)}<li><a href="viber://chat?number=%2B38269371111" aria-label="Viber">V</a></li>${dr(MAPA_URL, P.mapa, IKONA.mapa)}</ul></div>
<nav aria-label="${esc(P.brzo)}"><h2>${esc(P.brzo)}</h2><ul class="lista">${lnk('/', T.pocetna)}${lnk('/usluge', T.usluge)}${lnk('/o-nama', T.onama)}${lnk('/galerija', T.galerija)}${lnk('/zakazi', T.zakazi)}${lnk('/kontakt', T.kontakt)}${lnk(putanja(jez), T.nazad)}</ul></nav>
<div><h2>${esc(P.kontakt)}</h2><ul class="lista kont"><li>${IKONA.mapa}<a href="${MAPA_URL}" target="_blank" rel="noreferrer">${esc(SALON.adresa[jez][0])}<br>${esc(SALON.adresa[jez][1])}</a></li><li>${IKONA.telefon}<a href="tel:${esc(SALON.telefonTel)}">${esc(SALON.telefon)}</a></li><li>${IKONA.mejl}<a href="mailto:grasaksalon@gmail.com">grasaksalon@gmail.com</a></li></ul></div>
<div><h2>${esc(P.radno)}</h2><ul class="lista kont">${SALON.radno.map((_, i) => `<li>${IKONA.sat}<span>${esc(radnoRed(jez, i))}</span></li>`).join('')}<li>${IKONA.sat}<span>${esc(SALON.neradan[jez])}</span></li></ul></div>
</div></div><div class="foot-dno">${esc(P.prava)}</div></footer>`
}

function okvir({ jez, naslov, opis, canonical, robots, glava, tijelo, jeziciPutanje, trenutno }) {
  const T = tekst(jez)
  const veza = (href, tx, sam) => `<a href="${esc(href)}"${sam ? ' aria-current="page"' : ''}>${esc(tx)}</a>`
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
<link rel="alternate" type="application/rss+xml" title="${NAZIV} | ${esc(TEKST.cnr.naslov)}" href="${SITE}/kutak/rss.xml">
${glava || ''}${FONTS}
<style>${CSS}${CSS_BOJE}</style>
</head>
<body>
<header class="top"><div class="top-in"><a class="logo" href="/"><img src="/brand/grasak-znak.svg" alt="" width="40" height="40"><span>${NAZIV}</span></a><nav aria-label="${NAZIV}">${veza('/', T.pocetna)}${veza('/usluge', T.usluge)}${veza('/o-nama', T.onama)}${veza('/galerija', T.galerija)}${veza(putanja(jez), T.kratko, trenutno)}${veza('/kontakt', T.kontakt)}<a class="btn" href="/zakazi">${esc(T.zakazi)}</a></nav></div></header>
<main class="wrap">
${tijelo}
${jeziciPutanje ? prekidac(jez, jeziciPutanje) : ''}
<div class="cta"><p>${esc(T.slogan)}</p><a class="btn" href="/zakazi">${esc(T.zakazi)}</a></div>
</main>
${podnozje(jez)}
</body>
</html>
`
}

/* ---------- jedan tekst ---------- */

const datum10 = (iso) => String(iso || '').slice(0, 10)

/** Ispravan datum (GGGG-MM-DD, može i sa vremenom iza) ili ''. Ispravan niz se vraća netaknut, da izlaz ostane isti do bajta. */
export function datumIspravan(iso) {
  const s = String(iso || '')
  if (!/^\d{4}-\d{2}-\d{2}(?:$|[T\s])/.test(s)) return ''
  const d = new Date(s.slice(0, 10) + 'T12:00:00Z')
  return !isNaN(d) && d.toISOString().slice(0, 10) === s.slice(0, 10) ? s : ''
}
const prviDatum = (...v) => { for (const x of v) { const d = datumIspravan(x); if (d) return d } return '' }

/** Okvir "Šta možete uraditi danas": 2 do 3 koraka. */
function renderKoraci(koraci, jez) {
  const k = (koraci || []).filter(Boolean)
  if (!k.length) return ''
  return `<section class="danas"><h2>${esc(tekst(jez).danas)}</h2><ol>${k.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>`
}

function karticaTeksta(o, jez, tax) {
  const T = tekst(jez)
  const r = rubrikaPo(tax, o.rubrika)
  const v = vrstaPo(tax, o.vrsta)
  return `<li class="r-${bojaKlasa(r && r.boja)}"><span class="vr">${esc(v ? v.naziv[jez] || v.naziv.cnr : '')}</span><a class="n" href="${esc(putanja(jez, o.slug))}">${esc(o.naslov[jez])}</a><p>${esc((o.recenica && o.recenica[jez]) || (o.opis && o.opis[jez]) || '')}</p><p class="meta">${esc(T.minuta((o.minuta && o.minuta[jez]) || 1))}</p></li>`
}

/**
 * Jedan tekst na jeziku `jez`; null ako tekst nema taj jezik (nepotvrđen prevod se ne objavljuje).
 * ob = odgovor skripte (akcija=objava), tax = taksonomija, lista = sve objave (za tri povezana teksta iz iste rubrike).
 */
export function renderObjava(ob, jez, tax, lista) {
  tax = tax || {}
  if (!ob || !ob.naslov || !ob.naslov[jez] || !ob.tijelo || !ob.tijelo[jez]) return null
  const rub = rubrikaPo(tax, ob.rubrika)
  const vrs = vrstaPo(tax, ob.vrsta)
  if (!rub || !vrs) return null
  const T = tekst(jez)
  const url = adresa(jez, ob.slug)
  // tekst za Kutak (potvrđen): crnogorska strana ima canonical na Kutak; prevodi nemaju Kutkovu kopiju pa ostaju samoreferentni; hreflang nema nijedna
  const naKutkuTekst = naKutku(ob)
  const kanon = jez === 'cnr' && kutakKanon(ob) ? kutakAdresa(ob.slug) : url
  const opis = (ob.opis && ob.opis[jez]) || String(ob.tijelo[jez]).replace(/\s+/g, ' ').slice(0, 155)
  const jezici = (ob.jezici || Object.keys(ob.naslov)).filter((j) => ob.naslov[j] && ob.tijelo[j])
  const slika = SITE + '/images/fb_cover.jpg'
  const oznake = (ob.oznake || []).map((s) => oznakaPo(tax, s)).filter(Boolean)
  const koraci = (ob.koraci && ob.koraci[jez]) || []
  const objavljeno = prviDatum(ob.objavljeno, ob.datum)
  const izmijenjeno = prviDatum(ob.azurirano, objavljeno)
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: ob.naslov[jez].slice(0, 110),
    description: opis,
    inLanguage: HTML_LANG[jez],
    ...(objavljeno ? { datePublished: objavljeno } : {}),
    ...(izmijenjeno ? { dateModified: izmijenjeno } : {}),
    articleSection: rub.naziv[jez] || rub.naziv.cnr,
    keywords: oznake.map((o) => o.naziv[jez] || o.naziv.cnr).join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': kanon },
    image: [slika],
    author: { '@type': 'Organization', name: NAZIV, url: SITE + '/' },
    publisher: { '@type': 'Organization', name: NAZIV, url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png' } },
  }
  const izvorUrl = httpsUrl(ob.izvor_url)
  if (izvorUrl) ld.citation = { '@type': 'CreativeWork', name: bezKontrolnih(ob.izvor_naziv) || izvorUrl, url: izvorUrl }
  const glava =
    (naKutkuTekst ? '' : hreflangLinkovi(ob.slug, jezici) + '\n') +
    `<meta property="og:type" content="article">\n<meta property="og:site_name" content="${NAZIV}">\n<meta property="og:locale" content="${OG_LOCALE[jez]}">\n` +
    `<meta property="og:title" content="${esc(ob.naslov[jez])}">\n<meta property="og:description" content="${esc(opis)}">\n<meta property="og:url" content="${esc(kanon)}">\n<meta property="og:image" content="${esc(slika)}">\n` +
    (objavljeno ? `<meta property="article:published_time" content="${esc(objavljeno)}">\n` : '') + (izmijenjeno ? `<meta property="article:modified_time" content="${esc(izmijenjeno)}">\n` : '') + `<meta property="article:section" content="${esc(ld.articleSection)}">\n` +
    oznake.map((o) => `<meta property="article:tag" content="${esc(o.naziv[jez] || o.naziv.cnr)}">\n`).join('') +
    `<meta name="twitter:card" content="summary_large_image">\n<script type="application/ld+json">${ldJson(ld)}</script>\n`
  const izvor = izvorUrl ? `<p class="izvor">${esc(T.izvor)}: <a href="${esc(izvorUrl)}" rel="noopener nofollow"${/^[a-z]{2,3}$/.test(ob.izvor_jezik || '') ? ` hreflang="${esc(ob.izvor_jezik)}" lang="${esc(ob.izvor_jezik)}"` : ''}>${esc(ob.izvor_naziv || izvorUrl)}</a>${/^[a-z]{2,3}$/.test(ob.izvor_jezik || '') ? ` (${esc(ob.izvor_jezik.toUpperCase())})` : ''}</p>` : ''
  const napomena = ob.zdravlje && tax.zdravlje_napomena ? `<p class="napomena">${esc(tax.zdravlje_napomena[jez] || tax.zdravlje_napomena.cnr)}</p>` : ''
  const pokaziAzur = izmijenjeno && (!objavljeno || datum10(izmijenjeno) > datum10(objavljeno))
  const meta = [
    objavljeno ? `<time datetime="${esc(objavljeno)}">${esc(datumLijep(objavljeno, jez))}</time>` : '',
    pokaziAzur ? `${esc(T.azurirano)}: <time datetime="${esc(izmijenjeno)}">${esc(datumLijep(izmijenjeno, jez))}</time>` : '',
  ].filter(Boolean).concat(esc(T.minuta((ob.minuta && ob.minuta[jez]) || 1))).join(' · ')
  const povezani = naJeziku(lista, jez).filter((o) => o.rubrika === ob.rubrika && o.slug !== ob.slug).slice(0, 3)
  const tijelo = `<div class="uzak">
<p class="nazad"><a href="${esc(putanja(jez))}">&larr; ${esc(T.nazad)}</a></p>
<article>
<p><a class="pill b-${bojaKlasa(rub.boja)}" href="${esc(putanjaTema(jez, rub.slug))}">${esc(rub.naziv[jez] || rub.naziv.cnr)}</a> <span class="vr" style="display:inline;margin-left:6px">${esc(vrs.naziv[jez] || vrs.naziv.cnr)}</span></p>
<h1>${esc(ob.naslov[jez])}</h1>
<p class="meta">${meta}</p>
${paragrafi(ob.tijelo[jez])}
${renderKoraci(koraci, jez)}
${izvor}
${napomena}
${oznake.length ? `<ul class="oznake" aria-label="${esc(T.oznake)}">${oznake.map((o) => `<li><a href="${esc(putanjaOznaka(jez, o.slug))}">${esc(o.naziv[jez] || o.naziv.cnr)}</a></li>`).join('')}</ul>` : ''}
</article>
<p style="margin:30px 0 0"><a class="btn" href="/zakazi">${esc(T.zakazi)}</a></p>
${povezani.length ? `<aside class="povezano"><h2>${esc(T.povezano)} ${esc(rub.naziv[jez] || rub.naziv.cnr)}</h2><ul class="mreza">${povezani.map((o) => karticaTeksta(o, jez, tax)).join('\n')}</ul></aside>` : ''}
</div>`
  const jeziciPutanje = {}
  JEZICI.filter((j) => jezici.includes(j)).forEach((j) => { jeziciPutanje[j] = putanja(j, ob.slug) })
  return okvir({ jez, naslov: `${ob.naslov[jez]} | ${NAZIV}`, opis, canonical: kanon, robots: 'index, follow, max-image-preview:large', glava, tijelo, jeziciPutanje, trenutno: false })
}

/* ---------- lista, rubrika, oznaka ---------- */

/** Dugmad rubrika (u boji rubrike) i filter po vrsti. `bazaPutanja` je adresa bez ?vrsta=. */
function filteri(jez, tax, lista, trenutnaRubrika, trenutnaVrsta, trenutnaOznaka) {
  const T = tekst(jez)
  const sad = naJeziku(lista, jez)
  const dugmad = [`<li><a href="${esc(putanja(jez))}"${!trenutnaRubrika && !trenutnaOznaka ? ' aria-current="true"' : ''}>${esc(T.sve)}</a></li>`]
  ;(tax.rubrike || []).forEach((r) => {
    dugmad.push(`<li><a class="b-${bojaKlasa(r.boja)}" href="${esc(putanjaTema(jez, r.slug))}"${trenutnaRubrika === r.slug ? ' aria-current="true"' : ''}>${esc(r.naziv[jez] || r.naziv.cnr)}</a></li>`)
  })
  const baza = trenutnaRubrika ? putanjaTema(jez, trenutnaRubrika) : trenutnaOznaka ? putanjaOznaka(jez, trenutnaOznaka) : putanja(jez)
  const uOpsegu = sad.filter((o) => (!trenutnaRubrika || o.rubrika === trenutnaRubrika) && (!trenutnaOznaka || (o.oznake || []).includes(trenutnaOznaka)))
  const prisutne = (tax.vrste || []).filter((v) => uOpsegu.some((o) => o.vrsta === v.slug))
  const vrste = prisutne.length > 1
    ? `<ul class="filter vrste" aria-label="${esc(T.vrsta)}"><li><a href="${esc(baza)}"${!trenutnaVrsta ? ' aria-current="true"' : ''}>${esc(T.sve)}</a></li>${prisutne.map((v) => `<li><a href="${esc(baza + '?vrsta=' + v.slug)}" rel="nofollow"${trenutnaVrsta === v.slug ? ' aria-current="true"' : ''}>${esc(v.naziv[jez] || v.naziv.cnr)}</a></li>`).join('')}</ul>`
    : ''
  return `<ul class="filter" aria-label="${esc(T.rubrike)}">${dugmad.join('')}</ul>\n${vrste}`
}

/**
 * Strana liste (tip 'lista'), rubrike ('tema') ili oznake ('oznaka') na jeziku `jez`.
 * Indeksiranje: lista i rubrika samo ako imaju bar jedan tekst, oznaka tek sa 5 tekstova; filter ?vrsta= nikad.
 * Vraća null ako rubrika ili oznaka ne postoje u taksonomiji. Hreflang lista nema (to nijesu prevodi istog teksta); samo canonical.
 */
export function renderLista(lista, jez, tax, { tip = 'lista', kljuc = '', vrsta = '' } = {}) {
  tax = tax || {}
  const T = tekst(jez)
  const rub = tip === 'tema' ? rubrikaPo(tax, kljuc) : null
  const ozn = tip === 'oznaka' ? oznakaPo(tax, kljuc) : null
  if ((tip === 'tema' && !rub) || (tip === 'oznaka' && !ozn)) return null
  const vrstaOk = vrsta && vrstaPo(tax, vrsta) ? vrsta : ''
  const svi = naJeziku(lista, jez).filter((o) => (!rub || o.rubrika === rub.slug) && (!ozn || (o.oznake || []).includes(ozn.slug)))
  const sad = vrstaOk ? svi.filter((o) => o.vrsta === vrstaOk) : svi
  const ime = rub ? rub.naziv[jez] || rub.naziv.cnr : ozn ? ozn.naziv[jez] || ozn.naziv.cnr : T.naslov
  const opis = rub ? rub.opis[jez] || rub.opis.cnr : ozn ? `${T.oznakaOpis} "${ime}".` : T.sub
  const baza = tip === 'tema' ? putanjaTema(jez, kljuc) : tip === 'oznaka' ? putanjaOznaka(jez, kljuc) : putanja(jez)
  const canonical = SITE + baza   // filter po vrsti pokazuje na osnovnu stranu
  const nGrasku = svi.filter((o) => !naKutku(o)).length   // tekstovi sa domom na Kutku ne daju Grašku indeksirane liste
  const dovoljno = tip === 'oznaka' ? nGrasku >= OZNAKA_MIN_TEKSTOVA : nGrasku >= 1
  const robots = dovoljno && !vrstaOk ? 'index, follow' : 'noindex, follow'
  const prazno = tip === 'tema' ? T.rubrikaPrazna : tip === 'oznaka' ? T.oznakaPrazna : T.prazno
  const naslovH1 = tip === 'oznaka' ? `${T.oznakaNaslov}: ${ime}` : ime
  const tijelo = `<h1>${esc(naslovH1)}</h1>
<p class="sub">${esc(opis)}</p>
${filteri(jez, tax, lista, rub ? rub.slug : '', vrstaOk, ozn ? ozn.slug : '')}
${sad.length ? `<ul class="mreza">\n${sad.map((o) => karticaTeksta(o, jez, tax)).join('\n')}\n</ul>` : `<p>${esc(prazno)}</p>`}`
  const naslovStrane = tip === 'lista' ? `${T.naslov} | ${NAZIV}` : `${naslovH1} | ${T.naslov} | ${NAZIV}`
  const jeziciPutanje = {}
  JEZICI.forEach((j) => { jeziciPutanje[j] = (tip === 'tema' ? putanjaTema(j, kljuc) : tip === 'oznaka' ? putanjaOznaka(j, kljuc) : putanja(j)) + (vrstaOk ? '?vrsta=' + vrstaOk : '') })
  return okvir({ jez, naslov: naslovStrane, opis, canonical, robots, glava: '', tijelo, jeziciPutanje, trenutno: tip === 'lista' })
}

/** Strana greške (404, 410, 503): kratka, noindex, na jeziku posjetioca. */
export function renderGreska(jez, vrsta) {
  const T = tekst(jez)
  const poruka = vrsta === 'skinuta' ? T.skinuta : vrsta === 'greska' ? T.greska : T.nema
  const tijelo = `<div class="uzak"><h1>${esc(poruka)}</h1>\n<p><a href="${putanja(jez)}">${esc(T.nazad)}</a></p></div>`
  return okvir({ jez, naslov: `${poruka} | ${NAZIV}`, opis: poruka, canonical: adresa(jez), robots: 'noindex', tijelo, jeziciPutanje: null, trenutno: false })
}

const rfc822 = (iso) => new Date(String(iso).slice(0, 10) + 'T12:00:00Z').toUTCString()

/** RSS 2.0 (crnogorski): najviše 50 najnovijih. */
export function renderRss(lista, tax) {
  const T = TEKST.cnr
  const stavke = naJeziku(lista, 'cnr').slice(0, 50).map((o) => {
    const r = rubrikaPo(tax || {}, o.rubrika)
    return `    <item>\n      <title>${esc(o.naslov.cnr)}</title>\n      <link>${esc(adresa('cnr', o.slug))}</link>\n      <guid isPermaLink="true">${esc(adresa('cnr', o.slug))}</guid>\n` +
      (prviDatum(o.objavljeno, o.datum) ? `      <pubDate>${rfc822(prviDatum(o.objavljeno, o.datum))}</pubDate>\n` : '') + (r ? `      <category>${esc(r.naziv.cnr)}</category>\n` : '') +
      `      <description>${esc((o.recenica && o.recenica.cnr) || (o.opis && o.opis.cnr) || '')}</description>\n` +
      (httpsUrl(o.izvor_url) ? `      <source url="${esc(httpsUrl(o.izvor_url))}">${esc(o.izvor_naziv || httpsUrl(o.izvor_url))}</source>\n` : '') + '    </item>'
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${NAZIV} | ${esc(T.naslov)}</title>
    <link>${SITE}/${KUTAK}</link>
    <description>${esc(T.sub)}</description>
    <language>sr-Latn-ME</language>
    <atom:link href="${SITE}/${KUTAK}/rss.xml" rel="self" type="application/rss+xml"/>
${stavke}
  </channel>
</rss>
`
}

const STATICKE = [['/', 'weekly', '1.0'], ['/usluge', 'monthly', '0.9'], ['/o-nama', 'monthly', '0.8'], ['/galerija', 'weekly', '0.8'], ['/kontakt', 'monthly', '0.9'], ['/zakazi', 'weekly', '1.0']]

/**
 * Sitemap sa ispravnim hostom: 6 stalnih strana; po jeziku lista Kutka (ako ima tekstova), rubrike sa bar jednim tekstom,
 * oznake sa bar 5 tekstova; svaki tekst na svakom svom (potvrđenom) jeziku sa xhtml:link alternativama. Prazne rubrike i slabe oznake nijesu u sitemap-u.
 */
export function renderSitemap(lista, tax) {
  const redovi = STATICKE.map(([p, f, pr]) => `  <url><loc>${SITE}${p === '/' ? '/' : p}</loc><changefreq>${f}</changefreq><priority>${pr}</priority></url>`)
  const objave = (lista || []).filter((o) => !naKutku(o))   // tekst za Kutak nije u Graškovom sitemap-u (dom mu je djecijikutak.me)
  const taksonomija = tax || {}
  JEZICI.forEach((j) => {
    const n = naJeziku(objave, j).length
    if (!n) return
    redovi.push(`  <url><loc>${esc(adresa(j))}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`)
    ;(taksonomija.rubrike || []).forEach((r) => {
      if (brojRubrike(objave, j, r.slug) >= 1) redovi.push(`  <url><loc>${esc(adresaTema(j, r.slug))}</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>`)
    })
    ;(taksonomija.oznake || []).forEach((o) => {
      if (oznakaIndeksirana(objave, j, o.slug)) redovi.push(`  <url><loc>${esc(adresaOznaka(j, o.slug))}</loc><changefreq>weekly</changefreq><priority>0.4</priority></url>`)
    })
  })
  objave.forEach((o) => {
    const jezici = JEZICI.filter((j) => o.naslov && o.naslov[j])
    const alt = jezici.map((j) => `    <xhtml:link rel="alternate" hreflang="${HREFLANG[j]}" href="${esc(adresa(j, o.slug))}"/>`).concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(adresa('cnr', o.slug))}"/>`).join('\n')
    jezici.forEach((j) => {
      redovi.push(`  <url>\n    <loc>${esc(adresa(j, o.slug))}</loc>\n${prviDatum(o.azurirano, o.objavljeno, o.datum) ? `    <lastmod>${esc(datum10(prviDatum(o.azurirano, o.objavljeno, o.datum)))}</lastmod>\n` : ''}${alt}\n  </url>`)
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

/** Rok za odgovor skripte: duži čeka hladni start Apps Script-a, ali Vercel funkcija ne smije da visi. */
export const SKRIPTA_ROK_MS = 8000
/** Zadnja uspješna kopija (po instanci funkcije) vrijedi do ovoliko, ako skripta zakasni ili ne odgovori. */
export const STARO_NAJVISE_MS = 24 * 60 * 60 * 1000

const zadnje = { lista: null, objave: new Map() }
/** Za testove: briše zadnje uspješne kopije. */
export function zaboraviZadnje() { zadnje.lista = null; zadnje.objave.clear() }

/**
 * Jedan javni GET prema skripti. Vraća odgovor skripte (JSON), { stara: true } kad skripta odgovara ali ne poznaje Kutak
 * ("Nepoznata akcija": stara verzija) ili { greska: true } kad ne odgovara (mreža, rok, HTTP greška, neispravan JSON, greška unutar skripte).
 */
export async function iSkripte(parametri, env = {}, dohvati = fetch) {
  const kontrola = new AbortController()
  const sat = setTimeout(() => kontrola.abort(), Number(env.OBJAVE_ROK_MS) || SKRIPTA_ROK_MS)   // OBJAVE_ROK_MS samo za probu
  try {
    const r = await dohvati(skriptaAdresa(env) + '?' + new URLSearchParams(parametri), { signal: kontrola.signal, redirect: 'follow', headers: { accept: 'application/json' } })
    if (!r.ok) return { greska: true }
    const j = await r.json()
    if (j && j.greska === 'Nepoznata akcija') return { stara: true }
    if (!j || j.greska) return { greska: true }
    return j
  } catch {
    return { greska: true }
  } finally {
    clearTimeout(sat)
  }
}

const svjeze = (z) => !!z && Date.now() - z.vrijeme < STARO_NAJVISE_MS

/**
 * Lista i taksonomija iz akcije=objave.
 *  - { lista, tax }: skripta je odgovorila (lista može biti prazna: prazna strana je 200, ne greška);
 *  - { lista: [], tax: {}, stara: true }: skripta odgovara, ali je stara (bez Kutka): nema tekstova, ne greška;
 *  - { lista, tax, staro: true }: skripta ne odgovara, a postoji zadnja uspješna lista (do 24 sata): nju vraća;
 *  - { greska: true }: skripta ne odgovara i nema zadnje uspješne liste.
 */
export async function ucitajLista(env, dohvati) {
  const j = await iSkripte({ akcija: 'objave' }, env, dohvati)
  if (j.stara) return { lista: [], tax: {}, stara: true }
  if (!j.greska && Array.isArray(j.objave) && j.taksonomija) {
    zadnje.lista = { lista: j.objave, tax: j.taksonomija, vrijeme: Date.now() }
    return { lista: j.objave, tax: j.taksonomija }
  }
  if (svjeze(zadnje.lista)) return { lista: zadnje.lista.lista, tax: zadnje.lista.tax, staro: true }
  return { greska: true }
}

/**
 * Jedan tekst iz akcije=objava. Isti ugovor kao ucitajLista: odgovor skripte (ok:true sa objavom, ili ok:false "nema" / "sklonjena"),
 * zadnja uspješna kopija tog teksta (staro: true) kad skripta ne odgovara, ili { greska: true }.
 */
export async function ucitajObjavu(slug, env, dohvati) {
  const j = await iSkripte({ akcija: 'objava', slug }, env, dohvati)
  if (j.stara) return { ok: false, nema: true }
  if (!j.greska) {
    if (j.ok && j.objava) {
      if (zadnje.objave.size >= 100) zadnje.objave.delete(zadnje.objave.keys().next().value)
      zadnje.objave.set(slug, { odgovor: j, vrijeme: Date.now() })
    } else zadnje.objave.delete(slug)   // skinut ili nepostojeći tekst se ne vraća iz zadnje kopije
    return j
  }
  const z = zadnje.objave.get(slug)
  if (svjeze(z)) return Object.assign({}, z.odgovor, { staro: true })
  return { greska: true }
}

/* ---------- potvrda da Kutak ima kopiju (jedini poziv prema Kutku) ---------- */

/** Pozitivna potvrda se pamti 6 sati (po instanci funkcije); negativna kratko, da se canonical prebaci brzo čim kopija nastane. */
export const POTVRDA_POZITIVNO_MS = 6 * 60 * 60 * 1000
export const POTVRDA_NEGATIVNO_MS = 5 * 60 * 1000
export const POTVRDA_ROK_MS = 4000
export const POTVRDA_GRUPA = 50
export const POTVRDA_NAJVISE = 200
const potvrde = new Map()   // slug -> { ok, do }
/** Za testove. */
export function zaboraviPotvrde() { potvrde.clear() }

/** KUTAK_POTVRDA_URL: adresa funkcije grasak-potvrda na Kutku (https). Nije tajna. Nepostavljena = nijedna potvrda, canonical svugdje ostaje na Grašku. */
export function potvrdaAdresa(env = {}) {
  const u = String(env.KUTAK_POTVRDA_URL || '').trim()
  if (!u) return ''
  try { return new URL(u).protocol === 'https:' ? u : '' } catch { return '' }
}

async function pitajKutak(adresa, grupa, env, dohvati) {
  const kontrola = new AbortController()
  const sat = setTimeout(() => kontrola.abort(), Number(env.KUTAK_POTVRDA_ROK_MS) || POTVRDA_ROK_MS)
  try {
    const u = new URL(adresa)
    u.searchParams.set('slugovi', grupa.join(','))
    const r = await dohvati(u.toString(), { signal: kontrola.signal, headers: { accept: 'application/json' } })
    if (!r.ok) return null
    const j = await r.json()
    if (!j || j.ok !== true || !Array.isArray(j.potvrdjeni)) return null
    return new Set(j.potvrdjeni.filter((x) => typeof x === 'string' && grupa.includes(x)))
  } catch {
    return null
  } finally {
    clearTimeout(sat)
  }
}

/**
 * Koji od slugova imaju objavljenu kopiju na Kutku (red iz uvoza, izvor "grasak", is_published). Vraća Set potvrđenih.
 * Ručni članak Kutka sa istim slugom nije potvrda (funkcija na Kutku ga ne računa). Greška, rok ili nepostavljena adresa = nije potvrđeno;
 * ranije potvrđen tekst ostaje potvrđen dok traje zadnja pozitivna potvrda (do 24 sata) ako Kutak privremeno ne odgovara.
 */
export async function potvrdiKutak(slugovi, env = {}, dohvati = fetch, sada = Date.now()) {
  const adresa = potvrdaAdresa(env)
  const potvrdjeni = new Set()
  potvrdjeni.nepoznato = false   // true: Kutak nije odgovorio, a za neki tekst nema ni ranije potvrde (hladna instanca): stanje je nepoznato, ne "nije potvrđeno"
  if (!adresa) return potvrdjeni
  const trazeni = [...new Set((slugovi || []).filter((s) => SLUG_RE.test(String(s))))].slice(0, POTVRDA_NAJVISE)
  const treba = []
  for (const s of trazeni) {
    const z = potvrde.get(s)
    if (z && z.do > sada) {
      if (z.ok) potvrdjeni.add(s)
      else if (z.nepoznato) potvrdjeni.nepoznato = true   // zapis iz neuspjeha: neznanje se ne smije učvrstiti u dugom kešu ni kroz memoriju instance
    } else treba.push(s)
  }
  for (let i = 0; i < treba.length; i += POTVRDA_GRUPA) {
    const grupa = treba.slice(i, i + POTVRDA_GRUPA)
    const odg = await pitajKutak(adresa, grupa, env, dohvati)
    for (const s of grupa) {
      const staro = potvrde.get(s)
      if (odg === null) {
        // Kutak ne odgovara: zadnja pozitivna potvrda važi još do 24 sata, inače nije potvrđeno; pokušaj ponovo za par minuta
        const drzi = !!staro && staro.poz !== null && sada - staro.poz < STARO_NAJVISE_MS
        potvrde.set(s, { ok: drzi, do: sada + POTVRDA_NEGATIVNO_MS, poz: drzi ? staro.poz : null, nepoznato: !drzi })
        if (drzi) potvrdjeni.add(s)
        else potvrdjeni.nepoznato = true
      } else if (odg.has(s)) {
        potvrde.set(s, { ok: true, do: sada + POTVRDA_POZITIVNO_MS, poz: sada })
        potvrdjeni.add(s)
      } else {
        potvrde.set(s, { ok: false, do: sada + POTVRDA_NEGATIVNO_MS, poz: null })
      }
    }
  }
  if (potvrde.size > 1000) for (const k of potvrde.keys()) { if (potvrde.size <= 500) break; potvrde.delete(k) }
  return potvrdjeni
}

/** Kopija liste u kojoj svaki tekst sa na_kutku=true nosi kutak_potvrdjen (true samo uz potvrdu Kutka). Bez takvih tekstova nema nijednog poziva. */
export async function oznaciKutak(objave, env = {}, dohvati = fetch, sada = Date.now()) {
  const lista = objave || []
  const slugovi = lista.filter((o) => o && o.na_kutku === true).map((o) => o.slug)
  if (!slugovi.length) return lista
  const p = await potvrdiKutak(slugovi, env, dohvati, sada)
  const izlaz = lista.map((o) => (o && o.na_kutku === true ? { ...o, kutak_potvrdjen: p.has(o.slug) } : o))
  izlaz.nepoznato = p.nepoznato === true   // handler tada šalje kratak keš, da se privremeno samoreferentno stanje ne učvrsti u CDN-u
  return izlaz
}
