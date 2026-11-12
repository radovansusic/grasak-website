// /api/brojac - čitanost i "sviđa mi se" za Graškov kutak (P18).
// GET  ?slug=<slug>              -> { ok, ukljucen, c, l }   (brojevi za dugme na strani teksta)
// POST { slug, vrsta }           -> { ok, novo, c, l }       vrsta: "citanje" | "svidja"
// POST prima samo isti sajt (Origin) i JSON, i samo slug koji je javno objavljen (lista iz skripte).
// Bez Redis baze (veza u api/_lib/brojac.js) odgovara { ok: true, ukljucen: false } i ništa ne broji.
import { SITE, SLUG_RE, ucitajLista } from './_lib/kutak.js'
import { ukljucen, uzmiBrojeve, zabiljezi } from './_lib/brojac.js'

const odgovori = (res, status, tijelo, kes = 'no-store') => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', kes)
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(JSON.stringify(tijelo))
}

const tijeloZahtjeva = (req) => {
  try {
    const b = req.body
    if (b && typeof b === 'object') return b
    if (typeof b === 'string') return JSON.parse(b)
  } catch { /* neispravno tijelo */ }
  return null
}

const ipOd = (req) => {
  const h = req.headers || {}
  const x = String(h['x-vercel-forwarded-for'] || h['x-real-ip'] || h['x-forwarded-for'] || '').split(',')[0].trim()
  return x || (req.socket && req.socket.remoteAddress) || ''
}

export default async function handler(req, res, zavisnosti = {}) {
  const env = zavisnosti.env || process.env
  const dohvati = zavisnosti.dohvati || fetch
  if (req.method === 'GET') {
    let slug = ''
    try { slug = new URL(req.url || '/', SITE).searchParams.get('slug') || '' } catch { slug = '' }
    if (!SLUG_RE.test(slug)) return odgovori(res, 400, { ok: false })
    if (!ukljucen(env)) return odgovori(res, 200, { ok: true, ukljucen: false })
    const b = (await uzmiBrojeve([slug], env, dohvati))[slug] || { c: 0, l: 0 }
    return odgovori(res, 200, { ok: true, ukljucen: true, c: b.c, l: b.l }, 'public, s-maxage=30')
  }
  if (req.method !== 'POST') { res.setHeader('allow', 'GET, POST'); return odgovori(res, 405, { ok: false }) }
  const h = req.headers || {}
  if (h.origin !== SITE) return odgovori(res, 403, { ok: false })
  if (!String(h['content-type'] || '').toLowerCase().startsWith('application/json')) return odgovori(res, 415, { ok: false })
  const b = tijeloZahtjeva(req)
  const slug = b && typeof b.slug === 'string' ? b.slug : ''
  const vrsta = b && typeof b.vrsta === 'string' ? b.vrsta : ''
  if (!SLUG_RE.test(slug) || slug.length > 120 || (vrsta !== 'citanje' && vrsta !== 'svidja')) return odgovori(res, 400, { ok: false })
  if (!ukljucen(env)) return odgovori(res, 200, { ok: true, ukljucen: false })
  // broji se samo tekst koji je javno objavljen: izmišljen slug ne puni bazu
  let l = null
  try { l = await ucitajLista(env, dohvati) } catch { l = null }
  if (!l || l.greska || !Array.isArray(l.lista) || !l.lista.some((o) => o && o.slug === slug)) return odgovori(res, 404, { ok: false })
  const r = await zabiljezi(slug, vrsta, ipOd(req), env, dohvati)
  if (!r.ok) return odgovori(res, 200, { ok: false })
  return odgovori(res, 200, { ok: true, ukljucen: true, novo: r.novo, c: r.c, l: r.l })
}
