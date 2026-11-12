// Čitanost i "sviđa mi se" za Graškov kutak (P18). Brojevi stoje u Upstash Redis bazi povezanoj sa Vercel projektom
// (Storage > Upstash for Redis); Vercel sam upiše KV_REST_API_URL i KV_REST_API_TOKEN (ili UPSTASH_REDIS_REST_*).
// Bez tih promjenljivih sve ovdje ćuti: nema brojeva, nema dugmeta, sajt radi kao prije.
// Nikad ne baca grešku i ima kratak rok, da brojač nikad ne uspori ni ne obori stranu.
// Privatnost: IP se ne čuva; za sprečavanje duplog brojanja pamti se samo heš (IP + so) sa rokom trajanja.
import { createHash } from 'node:crypto'

export const ROK_MS = 1500
export const CITANJE_RAZMAK_S = 6 * 3600          // isti posjetilac broji se jednom u 6 sati po tekstu
export const SVIDJA_RAZMAK_S = 365 * 24 * 3600    // jedan "sviđa mi se" po posjetiocu i tekstu
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const kljucC = (slug) => 'kutak:c:' + slug
const kljucL = (slug) => 'kutak:l:' + slug

export function veza(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || ''
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || ''
  return /^https:\/\//.test(url) && token ? { url: url.replace(/\/+$/, ''), token } : null
}
export const ukljucen = (env = process.env) => !!veza(env) && env.KUTAK_BROJAC !== 'off'

/** Niz Redis komandi u jednom pozivu (REST /pipeline). Vraća niz rezultata ili null. */
async function pipeline(env, komande, dohvati = fetch) {
  const v = veza(env)
  if (!v || env.KUTAK_BROJAC === 'off') return null
  const kontrola = new AbortController()
  const sat = setTimeout(() => kontrola.abort(), ROK_MS)
  try {
    const r = await dohvati(v.url + '/pipeline', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + v.token, 'content-type': 'application/json' },
      body: JSON.stringify(komande),
      signal: kontrola.signal,
    })
    if (!r.ok) return null
    const j = await r.json()
    return Array.isArray(j) ? j.map((x) => (x && 'result' in x ? x.result : null)) : null
  } catch {
    return null
  } finally {
    clearTimeout(sat)
  }
}

const broj = (x) => { const n = Number(x); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0 }

/** Brojevi za više tekstova: { slug: { c, l } }. Prazan objekat kad brojač nije uključen ili baza ne odgovori. */
export async function uzmiBrojeve(slugovi, env = process.env, dohvati = fetch) {
  const s = [...new Set((slugovi || []).filter((x) => SLUG_RE.test(String(x))))].slice(0, 200)
  if (!s.length) return {}
  const r = await pipeline(env, [['MGET', ...s.map(kljucC)], ['MGET', ...s.map(kljucL)]], dohvati)
  if (!r || !Array.isArray(r[0]) || !Array.isArray(r[1])) return {}
  const out = {}
  s.forEach((slug, i) => { out[slug] = { c: broj(r[0][i]), l: broj(r[1][i]) } })
  return out
}

export const hesPosjetioca = (ip, so) => createHash('sha256').update(String(so || 'grasak') + '|' + String(ip || '')).digest('hex').slice(0, 24)

/**
 * Jedno čitanje ili jedan "sviđa mi se". Isti posjetilac (heš IP-a) se ne broji dvaput u roku.
 * Vraća { ok, c, l, novo } ili { ok:false }.
 */
export async function zabiljezi(slug, vrsta, ip, env = process.env, dohvati = fetch) {
  if (!SLUG_RE.test(String(slug || '')) || (vrsta !== 'citanje' && vrsta !== 'svidja')) return { ok: false }
  const h = hesPosjetioca(ip, env.KUTAK_BROJAC_SO)
  const dedup = 'kutak:d:' + (vrsta === 'citanje' ? 'c' : 'l') + ':' + slug + ':' + h
  const rok = vrsta === 'citanje' ? CITANJE_RAZMAK_S : SVIDJA_RAZMAK_S
  const prvi = await pipeline(env, [['SET', dedup, '1', 'NX', 'EX', String(rok)]], dohvati)
  if (!prvi) return { ok: false }
  const novo = prvi[0] === 'OK'
  const r = await pipeline(env, novo
    ? [[ 'INCR', vrsta === 'citanje' ? kljucC(slug) : kljucL(slug)], ['MGET', kljucC(slug), kljucL(slug)]]
    : [['MGET', kljucC(slug), kljucL(slug)]], dohvati)
  if (!r) return { ok: false }
  const m = r[r.length - 1]
  return { ok: true, novo, c: broj(Array.isArray(m) ? m[0] : 0), l: broj(Array.isArray(m) ? m[1] : 0) }
}
