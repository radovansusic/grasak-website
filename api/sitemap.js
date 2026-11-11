// GET /sitemap.xml: stalne strane + objave (host grasaksalon.me). Zamjenjuje statički public/sitemap.xml (imao je pogrešan host).
import { iSkripte, renderSitemap } from './_lib/objave.js'

export default async function handler(req, res) {
  const j = await iSkripte({ akcija: 'objave' }, process.env)
  const ok = !j.greska && Array.isArray(j.objave)
  // Ako skripta ne odgovori, sitemap ipak izlazi (6 stalnih strana), ali se kešira kratko da se objave brzo vrate.
  res.statusCode = 200
  res.setHeader('content-type', 'application/xml; charset=utf-8')
  res.setHeader('cache-control', ok ? 'public, s-maxage=900, stale-while-revalidate=86400' : 'public, s-maxage=30')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(renderSitemap(ok ? j.objave : []))
}
