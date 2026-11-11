// GET /sitemap.xml: stalne strane + Graškov kutak (host grasaksalon.me). Zamjenjuje statički public/sitemap.xml (imao je pogrešan host).
import { renderSitemap, ucitajLista } from './_lib/kutak.js'

export default async function handler(req, res) {
  const l = await ucitajLista(process.env)
  const ok = !l.greska
  // Ako skripta ne odgovori, sitemap ipak izlazi (6 stalnih strana), ali se kešira kratko da se tekstovi brzo vrate.
  res.statusCode = 200
  res.setHeader('content-type', 'application/xml; charset=utf-8')
  res.setHeader('cache-control', ok ? 'public, s-maxage=900, stale-while-revalidate=86400' : 'public, s-maxage=30')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(renderSitemap(ok ? l.lista : [], ok ? l.tax : {}))
}
