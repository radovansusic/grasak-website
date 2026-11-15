// P18: čitanost i "sviđa mi se" za Graškov kutak, bez mreže:  node scripts/brojac-test.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { uzmiBrojeve, zabiljezi, ukljucen, veza } from '../api/_lib/brojac.js'
import handler from '../api/brojac.js'
import { poredaj, renderLista, renderObjava, izRute } from '../api/_lib/kutak.js'

let prosli = 0
const t = async (naziv, fn) => { try { await fn(); prosli++ } catch (e) { console.error('PAO: ' + naziv + '\n  ' + (e.stack || e)); process.exitCode = 1 } }

// lažni Upstash REST (/pipeline) sa pravom semantikom SET NX, INCR, MGET
function lazniRedis() {
  const db = new Map()
  const pozivi = []
  const f = async (url, init) => {
    if (String(url).endsWith('/pipeline')) {
      const kom = JSON.parse(init.body); pozivi.push(kom)
      return new Response(JSON.stringify(kom.map(([c, ...a]) => {
        if (c === 'SET') { if (a.includes('NX') && db.has(a[0])) return { result: null }; db.set(a[0], a[1]); return { result: 'OK' } }
        if (c === 'INCR') { const n = Number(db.get(a[0]) || 0) + 1; db.set(a[0], String(n)); return { result: n } }
        if (c === 'MGET') return { result: a.map((k) => (db.has(k) ? db.get(k) : null)) }
        return { error: 'nepoznato' }
      })), { status: 200 })
    }
    if (String(url).includes('akcija=objave')) return new Response(JSON.stringify({ ok: true, objave: [{ slug: 'prvo-sisanje', naslov: { cnr: 'A' } }], taksonomija: { rubrike: [], vrste: [] } }), { status: 200 })
    throw new Error('neočekivan fetch ' + url)
  }
  return { f, db, pozivi }
}
const ENV = { KV_REST_API_URL: 'https://primjer.upstash.io', KV_REST_API_TOKEN: 'x', GRASAK_APPS_SCRIPT: 'https://script.google.com/macros/s/x/exec' }
const res = () => { const r = { statusCode: 0, z: {}, b: '' }; r.setHeader = (k, v) => { r.z[k.toLowerCase()] = v }; r.end = (s) => { r.b = s || '' }; return r }
const req = (method, body, extra = {}) => ({ method, url: extra.url || '/api/brojac', headers: { origin: 'https://grasaksalon.me', 'content-type': 'application/json', 'x-real-ip': extra.ip || '1.2.3.4', ...(extra.h || {}) }, body })

await t('bez baze: isključeno, ništa se ne zove', async () => {
  assert.equal(ukljucen({}), false); assert.equal(veza({}), null)
  const r = res(); await handler(req('POST', { slug: 'prvo-sisanje', vrsta: 'citanje' }), r, { env: {}, dohvati: () => { throw new Error('ne smije') } })
  assert.equal(JSON.parse(r.b).ukljucen, false)
})
await t('čitanje: isti posjetilac jednom u roku, drugi posjetilac se broji', async () => {
  const R = lazniRedis()
  const a = await zabiljezi('prvo-sisanje', 'citanje', '1.1.1.1', ENV, R.f)
  const b = await zabiljezi('prvo-sisanje', 'citanje', '1.1.1.1', ENV, R.f)
  const c = await zabiljezi('prvo-sisanje', 'citanje', '2.2.2.2', ENV, R.f)
  assert.deepEqual([a.novo, b.novo, c.novo], [true, false, true]); assert.equal(c.c, 2); assert.equal(c.l, 0)
  assert.ok(![...R.db.keys()].some((k) => k.includes('1.1.1.1')), 'IP ne smije biti u bazi')
})
await t('sviđa mi se: jednom po posjetiocu', async () => {
  const R = lazniRedis()
  await zabiljezi('x', 'svidja', '9.9.9.9', ENV, R.f); const b = await zabiljezi('x', 'svidja', '9.9.9.9', ENV, R.f)
  assert.equal(b.l, 1)
})
await t('baza pada ili kasni: bez izuzetka', async () => {
  assert.deepEqual(await uzmiBrojeve(['a'], ENV, async () => { throw new TypeError('mreza') }), {})
  assert.equal((await zabiljezi('a', 'citanje', 'ip', ENV, async () => new Response('', { status: 500 }))).ok, false)
})
await t('ruta POST: samo isti sajt, JSON, poznata vrsta, objavljen slug', async () => {
  const R = lazniRedis(); const z = { env: ENV, dohvati: R.f }
  let r = res(); await handler(req('POST', { slug: 'prvo-sisanje', vrsta: 'citanje' }, { h: { origin: 'https://zli.me' } }), r, z); assert.equal(r.statusCode, 403)
  r = res(); await handler(req('POST', 'x', { h: { 'content-type': 'text/plain' } }), r, z); assert.equal(r.statusCode, 415)
  r = res(); await handler(req('POST', { slug: 'prvo-sisanje', vrsta: 'hakuj' }), r, z); assert.equal(r.statusCode, 400)
  r = res(); await handler(req('POST', { slug: 'ne-postoji', vrsta: 'citanje' }), r, z); assert.equal(r.statusCode, 404)
  r = res(); await handler(req('POST', { slug: 'prvo-sisanje', vrsta: 'svidja' }), r, z); assert.equal(r.statusCode, 200); assert.equal(JSON.parse(r.b).l, 1)
})
await t('ruta GET: brojevi jednog teksta', async () => {
  const R = lazniRedis(); R.db.set('kutak:c:prvo-sisanje', '7')
  const r = res(); await handler(req('GET', undefined, { url: '/api/brojac?slug=prvo-sisanje' }), r, { env: ENV, dohvati: R.f })
  assert.deepEqual(JSON.parse(r.b), { ok: true, ukljucen: true, c: 7, l: 0 })
})
await t('poredak: najčitanije, jednaki zadržavaju redoslijed; bez brojeva nepromijenjeno', () => {
  const L = [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }]
  assert.deepEqual(poredaj(L, 'citano', { a: { c: 1, l: 5 }, b: { c: 9, l: 0 }, c: { c: 1, l: 0 } }).map((o) => o.slug), ['b', 'a', 'c'])
  assert.deepEqual(poredaj(L, 'svidja', { a: { c: 1, l: 5 }, b: { c: 9, l: 0 }, c: { c: 1, l: 0 } }).map((o) => o.slug), ['a', 'b', 'c'])
  assert.deepEqual(poredaj(L, 'citano', null).map((o) => o.slug), ['a', 'b', 'c'])
  assert.equal(izRute('https://grasaksalon.me/kutak?poredak=citano').poredak, 'citano')
  assert.equal(izRute('https://grasaksalon.me/kutak?poredak=zlo').poredak, '')
})
await t('strana teksta nosi skriveno dugme i skriptu; javna datoteka skripte postoji', () => {
  const src = fs.readFileSync('api/_lib/kutak.js', 'utf8')
  assert.match(src, /class="svidja" data-slug="\$\{esc\(ob\.slug\)\}" aria-pressed="false" hidden/)
  assert.match(src, /<script src="\/kutak-brojac\.js" defer><\/script>/)
  const js = fs.readFileSync('public/kutak-brojac.js', 'utf8')
  assert.match(js, /if \(!j \|\| !j\.ok \|\| !j\.ukljucen\) return/)
})
console.log('brojac: ' + prosli + ' prošlo' + (process.exitCode ? ', ima palih' : ''))
