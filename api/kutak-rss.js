// GET /kutak/rss.xml: RSS 2.0 objavljenih tekstova (crnogorski). 503 (bez keša) samo kad skripta ne odgovara.
import { renderRss, ucitajLista } from './_lib/kutak.js'

export default async function handler(req, res) {
  const l = await ucitajLista(process.env)
  const ok = !l.greska
  res.statusCode = ok ? 200 : 503
  res.setHeader('content-type', 'application/rss+xml; charset=utf-8')
  res.setHeader('cache-control', !ok ? 'no-store' : l.staro || l.stara ? 'public, s-maxage=30' : 'public, s-maxage=600, stale-while-revalidate=86400')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(renderRss(ok ? l.lista : [], ok ? l.tax : {}))
}
