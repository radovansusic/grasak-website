// GET /kutak, /kutak/<slug>, /kutak/tema/<rubrika>, /kutak/oznaka/<oznaka> i iste adrese pod /en, /ru, /tr (vercel.json rewrite-ovi):
// stvarni HTML iz javnog GET-a Google skripte. Filter po vrsti: ?vrsta=<vrsta> (noindex).
// Odgovori: 200 i kad nema nijednog teksta (prazna strana, noindex); 503 samo kad skripta zaista ne odgovara, i taj odgovor se NE kešira (no-store).
import { SLUG_RE, izRute, oznaciKutak, renderGreska, renderLista, renderObjava, ucitajLista, ucitajObjavu } from './_lib/kutak.js'

const KES = 'public, s-maxage=300, stale-while-revalidate=86400'
const KES_KRATKO = 'public, s-maxage=60'
const KES_STARO = 'public, s-maxage=30'   // zadnja uspješna kopija dok skripta kasni: kratko, da se brzo vrati svježa
const BEZ_KESA = 'no-store'

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
    const [j, l] = await Promise.all([ucitajObjavu(kljuc, process.env), ucitajLista(process.env)])
    if (j.greska) return posalji(res, 503, renderGreska(jez, 'greska'), BEZ_KESA)
    if (!j.ok || !j.objava) return posalji(res, j.sklonjena ? 410 : 404, renderGreska(jez, j.sklonjena ? 'skinuta' : 'nema'), KES_KRATKO)
    // povezani tekstovi su dodatak: ako lista ne stigne, tekst ipak izlazi (bez njih)
    // canonical na Kutak samo uz potvrdu Kutka da kopija postoji (oznaciKutak; bez KUTAK_POTVRDA_URL nema potvrde)
    const [oznacena] = await oznaciKutak([j.objava], process.env)
    const html = renderObjava(oznacena, jez, j.taksonomija, await oznaciKutak(l.lista || [], process.env))
    if (!html) return posalji(res, 404, renderGreska(jez, 'nema'), KES_KRATKO)   // nema potvrđenog prevoda na ovom jeziku
    return posalji(res, 200, html, j.staro ? KES_STARO : KES)
  }
  const l = await ucitajLista(process.env)
  if (l.greska) return posalji(res, 503, renderGreska(jez, 'greska'), BEZ_KESA)
  const html = renderLista(await oznaciKutak(l.lista, process.env), jez, l.tax, { tip, kljuc, vrsta })
  if (!html) return posalji(res, 404, renderGreska(jez, 'nema'), KES_KRATKO)   // nepoznata rubrika ili oznaka
  return posalji(res, 200, html, l.staro || l.stara ? KES_STARO : KES)
}
