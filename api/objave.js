// GET /objave, /objave/<slug>, /en|ru|tr/objave[/<slug>]: stvarni HTML iz javnog GET-a Google skripte (vercel.json rewrite-ovi).
import { SLUG_RE, iSkripte, izRute, renderGreska, renderLista, renderObjava } from './_lib/objave.js'

const KES = 'public, s-maxage=300, stale-while-revalidate=86400'
const KES_KRATKO = 'public, s-maxage=60'

function posalji(res, status, html, kes) {
  res.statusCode = status
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.setHeader('cache-control', kes)
  res.setHeader('x-content-type-options', 'nosniff')
  if (status !== 200) res.setHeader('x-robots-tag', 'noindex')
  if (status === 503) res.setHeader('retry-after', '60')
  res.end(html)
}

export default async function handler(req, res) {
  const { jez, slug, ok } = izRute(req.url || '/objave')
  if (!ok) return posalji(res, 404, renderGreska('cnr', 'nema'), KES_KRATKO)
  if (!slug) {
    const j = await iSkripte({ akcija: 'objave' }, process.env)
    if (j.greska || !Array.isArray(j.objave)) return posalji(res, 503, renderGreska(jez, 'greska'), 'public, s-maxage=10')
    return posalji(res, 200, renderLista(j.objave, jez), KES)
  }
  if (!SLUG_RE.test(slug)) return posalji(res, 404, renderGreska(jez, 'nema'), KES_KRATKO)
  const j = await iSkripte({ akcija: 'objava', slug }, process.env)
  if (j.greska) return posalji(res, 503, renderGreska(jez, 'greska'), 'public, s-maxage=10')
  if (!j.ok || !j.objava) return posalji(res, j.sklonjena ? 410 : 404, renderGreska(jez, j.sklonjena ? 'skinuta' : 'nema'), KES_KRATKO)
  const html = renderObjava(j.objava, jez)
  if (!html) return posalji(res, 404, renderGreska(jez, 'nema'), KES_KRATKO)   // objava nema prevod na ovom jeziku
  return posalji(res, 200, html, KES)
}
