// POST /api/indexnow  { slug }  - zove ga panel (kartica Kutak) poslije uspješnog "Objavi" ili "Skloni".
// Ne objavljuje ništa i ne čita tajne: samo javlja IndexNow-u adrese jednog teksta na grasaksalon.me.
// Zaštita: samo isti sajt (Origin), samo POST, slug po obrascu, adrese se grade na serveru (nikad iz zahtjeva).
// Odgovor je uvijek 200 ili 4xx bez detalja mreže; panel ga ionako ne čeka.
import { SITE, SLUG_RE, ucitajObjavu } from './_lib/kutak.js'
import { adreseTeksta, dojavi } from './_lib/indexnow.js'

const procitajTijelo = (req) => new Promise((resolve) => {
  if (req.body && typeof req.body === 'object') return resolve(req.body)
  let s = ''
  req.on('data', (c) => { s += c; if (s.length > 1024) req.destroy() })
  req.on('end', () => { try { resolve(JSON.parse(s || '{}')) } catch { resolve(null) } })
  req.on('error', () => resolve(null))
})

const odgovori = (res, status, tijelo) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(JSON.stringify(tijelo))
}

export default async function handler(req, res, zavisnosti = {}) {
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return odgovori(res, 405, { ok: false }) }
  if ((req.headers && req.headers.origin) !== SITE) return odgovori(res, 403, { ok: false })
  if (process.env.INDEXNOW === 'off') return odgovori(res, 200, { ok: true, poslato: false })
  const b = await procitajTijelo(req)
  const slug = b && typeof b.slug === 'string' ? b.slug : ''
  if (!SLUG_RE.test(slug) || slug.length > 120) return odgovori(res, 400, { ok: false })
  const dohvati = zavisnosti.dohvati || fetch
  let objava = null
  try {
    const j = await ucitajObjavu(slug, process.env, dohvati)
    if (j && j.ok && j.objava) objava = j.objava
  } catch { objava = null }
  // Tekst koji nije javan (upravo sklonjen ili nepostojeći): javljaju se adrese na sva četiri jezika, da ih tražilice ponovo pročitaju.
  const ishod = await dojavi(adreseTeksta(slug, objava), dohvati)
  console.log('indexnow ' + slug + ' ' + (ishod.ok ? 'ok' : 'neuspjeh') + ' ' + (ishod.status || '-') + ' ' + ishod.broj + (ishod.greska ? ' ' + ishod.greska : ''))
  return odgovori(res, 200, { ok: true, poslato: ishod.ok })
}
