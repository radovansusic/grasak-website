// POST /api/indexnow  { slug }  - zove ga panel (kartica Kutak) poslije uspješnog "Objavi" ili "Skloni".
// Ne objavljuje ništa i ne čita tajne: samo javlja IndexNow-u adrese jednog teksta na grasaksalon.me.
// Zaštita (provjera P18): samo POST sa istog sajta i JSON tijelom; slug po obrascu; dojava ide samo za tekst koji
// skripta potvrdi kao javan ili sklonjen (izmišljen slug ne šalje ništa); isti slug najviše jednom u minuti po instanci;
// adrese se grade na serveru, nikad iz zahtjeva. Odgovor ne otkriva ništa o mreži; panel ga ionako ne čeka.
import { SITE, SLUG_RE, ucitajObjavu } from './_lib/kutak.js'
import { adreseTeksta, dojavi } from './_lib/indexnow.js'

export const RAZMAK_MS = 60 * 1000
const zadnjeSlato = new Map()

const odgovori = (res, status, tijelo) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(JSON.stringify(tijelo))
}

const tijeloZahtjeva = (req) => {
  try {
    const b = req.body   // Vercel parsira JSON; neispravan JSON ovdje baca
    if (b && typeof b === 'object') return b
    if (typeof b === 'string') return JSON.parse(b)
  } catch { /* neispravno tijelo */ }
  return null
}

export default async function handler(req, res, zavisnosti = {}) {
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return odgovori(res, 405, { ok: false }) }
  const h = req.headers || {}
  if (h.origin !== SITE) return odgovori(res, 403, { ok: false })
  if (!String(h['content-type'] || '').toLowerCase().startsWith('application/json')) return odgovori(res, 415, { ok: false })
  if (process.env.INDEXNOW === 'off') return odgovori(res, 200, { ok: true, poslato: false })
  const b = tijeloZahtjeva(req)
  const slug = b && typeof b.slug === 'string' ? b.slug : ''
  if (!SLUG_RE.test(slug) || slug.length > 120) return odgovori(res, 400, { ok: false })
  const sad = Date.now()
  if (sad - (zadnjeSlato.get(slug) || 0) < RAZMAK_MS) return odgovori(res, 200, { ok: true, poslato: false })
  const dohvati = zavisnosti.dohvati || fetch
  let j = null
  try { j = await ucitajObjavu(slug, process.env, dohvati) } catch { j = null }
  let adrese = []
  if (j && j.ok && j.objava) adrese = adreseTeksta(slug, j.objava)
  else if (j && j.sklonjena === true) adrese = adreseTeksta(slug, null)   // upravo sklonjen: sva četiri jezika, da tražilice vide da ga nema
  if (!adrese.length) return odgovori(res, 200, { ok: true, poslato: false })
  if (zadnjeSlato.size > 500) zadnjeSlato.clear()
  zadnjeSlato.set(slug, sad)
  const ishod = await dojavi(adrese, dohvati)
  console.log('indexnow ' + slug + ' ' + (ishod.ok ? 'ok' : 'neuspjeh') + ' ' + (ishod.status || '-') + ' ' + ishod.broj + (ishod.greska ? ' ' + ishod.greska : ''))
  return odgovori(res, 200, { ok: true, poslato: ishod.ok })
}

/** Samo za test: briše pamćenje razmaka. */
export const _zaboravi = () => zadnjeSlato.clear()
