// GET /objave/rss.xml: RSS 2.0 objavljenih objava (crnogorski).
import { iSkripte, renderRss } from './_lib/objave.js'

export default async function handler(req, res) {
  const j = await iSkripte({ akcija: 'objave' }, process.env)
  const ok = !j.greska && Array.isArray(j.objave)
  res.statusCode = ok ? 200 : 503
  res.setHeader('content-type', 'application/rss+xml; charset=utf-8')
  res.setHeader('cache-control', ok ? 'public, s-maxage=600, stale-while-revalidate=86400' : 'public, s-maxage=10')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(renderRss(ok ? j.objave : []))
}
