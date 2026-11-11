// GET /kutak, /kutak/<slug>, /kutak/tema/<rubrika>, /kutak/oznaka/<oznaka> i iste adrese pod /en, /ru, /tr (vercel.json rewrite-ovi):
// stvarni HTML iz javnog GET-a Google skripte. Filter po vrsti: ?vrsta=<vrsta> (noindex).
import { SLUG_RE, iSkripte, izRute, renderGreska, renderLista, renderObjava, ucitajLista } from './_lib/kutak.js'

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
  const { jez, tip, kljuc, vrsta, ok } = izRute(req.url || '/kutak')
  if (!ok) return posalji(res, 404, renderGreska('cnr', 'nema'), KES_KRATKO)
  if (tip === 'objava') {
    if (!SLUG_RE.test(kljuc)) return posalji(res, 404, renderGreska(jez, 'nema'), KES_KRATKO)
    const [j, l] = await Promise.all([iSkripte({ akcija: 'objava', slug: kljuc }, process.env), ucitajLista(process.env)])
    if (j.greska) return posalji(res, 503, renderGreska(jez, 'greska'), 'public, s-maxage=10')
    if (!j.ok || !j.objava) return posalji(res, j.sklonjena ? 410 : 404, renderGreska(jez, j.sklonjena ? 'skinuta' : 'nema'), KES_KRATKO)
    // povezani tekstovi su dodatak: ako lista ne stigne, tekst ipak izlazi (bez njih)
    const html = renderObjava(j.objava, jez, j.taksonomija, l.lista || [])
    if (!html) return posalji(res, 404, renderGreska(jez, 'nema'), KES_KRATKO)   // nema potvrđenog prevoda na ovom jeziku
    return posalji(res, 200, html, KES)
  }
  const l = await ucitajLista(process.env)
  if (l.greska) return posalji(res, 503, renderGreska(jez, 'greska'), 'public, s-maxage=10')
  const html = renderLista(l.lista, jez, l.tax, { tip, kljuc, vrsta })
  if (!html) return posalji(res, 404, renderGreska(jez, 'nema'), KES_KRATKO)   // nepoznata rubrika ili oznaka
  return posalji(res, 200, html, KES)
}
