// P18: IndexNow za grasaksalon.me, bez mreže:  node scripts/indexnow-test.mjs
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { KLJUC, HOST, INDEXNOW_ENDPOINT, adreseTeksta, dojavi } from '../api/_lib/indexnow.js'
import handler, { _zaboravi } from '../api/indexnow.js'

const koren = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
let prosli = 0
const t = async (naziv, fn) => { try { await fn(); prosli++ } catch (e) { console.error('PAO: ' + naziv + '\n  ' + (e.message || e)); process.exitCode = 1 } }

const lazniRes = () => {
  const r = { statusCode: 0, zaglavlja: {}, tijelo: '' }
  r.setHeader = (k, v) => { r.zaglavlja[k.toLowerCase()] = v }
  r.end = (s) => { r.tijelo = s || '' }
  return r
}
const lazniReq = (method, body, origin = 'https://grasaksalon.me', ct = 'application/json') => {
  const q = { method, headers: {} }
  if (origin) q.headers.origin = origin
  if (ct) q.headers['content-type'] = ct
  if (body !== undefined) q.body = body
  return q
}
// lažna skripta + lažni IndexNow
const dohvatiSa = (objava, indexStatus = 202, poziviIndex = []) => async (url, init) => {
  if (url === INDEXNOW_ENDPOINT) { poziviIndex.push(JSON.parse(init.body)); if (indexStatus === 'pad') throw new TypeError('mreza'); return new Response('', { status: indexStatus }) }
  if (String(url).includes('akcija=objava')) return new Response(JSON.stringify(objava === 'sklonjena' ? { ok: false, nema: true, sklonjena: true } : objava ? { ok: true, objava } : { ok: false, nema: true }), { status: 200, headers: { 'content-type': 'application/json' } })
  throw new Error('neočekivan fetch ' + url)
}
const OB = { slug: 'prvo-sisanje', rubrika: 'sisanje-i-njega', naslov: { cnr: 'N', en: 'E', ru: '', tr: '' }, tijelo: { cnr: 't', en: 't', ru: '', tr: '' } }

await t('ključ je datoteka public/<ključ>.txt sa istim sadržajem', () => {
  assert.match(KLJUC, /^[0-9a-f]{32}$/)
  assert.equal(fs.readFileSync(path.join(koren, 'public', KLJUC + '.txt'), 'utf8').trim(), KLJUC)
})
await t('Vercel rewrite ne guta datoteku ključa (catch-all isključuje samo api/, a public ide prije rewrite-a)', () => {
  const v = JSON.parse(fs.readFileSync(path.join(koren, 'vercel.json'), 'utf8'))
  assert.ok(!v.rewrites.some((r) => r.source.includes('.txt')))
})
await t('adrese teksta: samo jezici na kojima tekst postoji, lista i rubrika', () => {
  const a = adreseTeksta('prvo-sisanje', OB)
  assert.deepEqual(a, [
    'https://grasaksalon.me/kutak/prvo-sisanje', 'https://grasaksalon.me/kutak', 'https://grasaksalon.me/kutak/tema/sisanje-i-njega',
    'https://grasaksalon.me/en/kutak/prvo-sisanje', 'https://grasaksalon.me/en/kutak', 'https://grasaksalon.me/en/kutak/tema/sisanje-i-njega',
  ])
})
await t('sklonjen tekst (nema ga u skripti): sva četiri jezika, bez rubrike', () => {
  const a = adreseTeksta('x-y', null)
  assert.equal(a.length, 8)
  assert.ok(a.every((u) => new URL(u).host === HOST))
})
await t('loš slug ne daje adrese', () => { assert.deepEqual(adreseTeksta('../x', OB), []); assert.deepEqual(adreseTeksta('A B', null), []) })
await t('dojavi: tuđi host se izbacuje, 202 je uspjeh', async () => {
  const p = []
  const r = await dojavi(['https://drugi.me/a', 'https://grasaksalon.me/kutak'], dohvatiSa(null, 202, p))
  assert.equal(r.ok, true); assert.equal(r.broj, 1)
  assert.deepEqual(p[0].urlList, ['https://grasaksalon.me/kutak'])
  assert.equal(p[0].keyLocation, 'https://grasaksalon.me/' + KLJUC + '.txt')
})
await t('dojavi: pad mreže, 4xx i rok - bez izuzetka', async () => {
  assert.equal((await dojavi(['https://grasaksalon.me/kutak'], dohvatiSa(null, 'pad'))).greska, 'mreza')
  assert.equal((await dojavi(['https://grasaksalon.me/kutak'], dohvatiSa(null, 403))).greska, 'http_403')
  const spor = (_u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('a'), { name: 'AbortError' }))))
  assert.equal((await dojavi(['https://grasaksalon.me/kutak'], spor, 20)).greska, 'timeout')
})
await t('ruta: samo POST, samo isti sajt, slug po obrascu', async () => {
  let res = lazniRes(); await handler(lazniReq('GET'), res); assert.equal(res.statusCode, 405)
  res = lazniRes(); await handler(lazniReq('POST', { slug: 'a' }, 'https://zli.me'), res, { dohvati: dohvatiSa(OB) }); assert.equal(res.statusCode, 403)
  res = lazniRes(); await handler(lazniReq('POST', { slug: '../a' }), res, { dohvati: dohvatiSa(OB) }); assert.equal(res.statusCode, 400)
  res = lazniRes(); await handler(lazniReq('POST', 'nije json'), res, { dohvati: dohvatiSa(OB) }); assert.equal(res.statusCode, 400)
})
await t('ruta: objavljen tekst -> jedna dojava sa adresama iz skripte', async () => {
  _zaboravi()
  const p = []
  const res = lazniRes(); await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), res, { dohvati: dohvatiSa(OB, 202, p) })
  assert.equal(res.statusCode, 200); assert.equal(JSON.parse(res.tijelo).poslato, true)
  assert.equal(p.length, 1); assert.equal(p[0].urlList.length, 6); assert.equal(p[0].host, 'grasaksalon.me')
})
await t('ruta: IndexNow pada -> i dalje 200, bez izuzetka', async () => {
  _zaboravi()
  const res = lazniRes(); await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), res, { dohvati: dohvatiSa(OB, 'pad') })
  assert.equal(res.statusCode, 200); assert.equal(JSON.parse(res.tijelo).poslato, false)
})
await t('ruta: INDEXNOW=off ne šalje ništa', async () => {
  _zaboravi()
  process.env.INDEXNOW = 'off'
  const p = []
  const res = lazniRes(); await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), res, { dohvati: dohvatiSa(OB, 202, p) })
  delete process.env.INDEXNOW
  assert.equal(res.statusCode, 200); assert.equal(p.length, 0)
})
await t('ruta: izmišljen slug (skripta kaže nema) ne šalje ništa', async () => {
  _zaboravi()
  const p = []
  const res = lazniRes(); await handler(lazniReq('POST', { slug: 'ne-postoji' }), res, { dohvati: dohvatiSa(null, 202, p) })
  assert.equal(res.statusCode, 200); assert.equal(JSON.parse(res.tijelo).poslato, false); assert.equal(p.length, 0)
})
await t('ruta: upravo sklonjen tekst -> adrese na sva četiri jezika', async () => {
  _zaboravi()
  const p = []
  const res = lazniRes(); await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), res, { dohvati: dohvatiSa('sklonjena', 202, p) })
  assert.equal(JSON.parse(res.tijelo).poslato, true); assert.equal(p[0].urlList.length, 8)
})
await t('ruta: isti slug dvaput u minuti -> jedna dojava', async () => {
  _zaboravi()
  const p = []
  await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), lazniRes(), { dohvati: dohvatiSa(OB, 202, p) })
  const res = lazniRes(); await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), res, { dohvati: dohvatiSa(OB, 202, p) })
  assert.equal(p.length, 1); assert.equal(JSON.parse(res.tijelo).poslato, false)
})
await t('ruta: Objavi pa Skloni u istoj minuti -> dvije dojave; pad IndexNow-a ne troši razmak', async () => {
  _zaboravi()
  const p = []
  await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), lazniRes(), { dohvati: dohvatiSa(OB, 202, p) })
  await handler(lazniReq('POST', { slug: 'prvo-sisanje' }), lazniRes(), { dohvati: dohvatiSa('sklonjena', 202, p) })
  assert.equal(p.length, 2)
  _zaboravi()
  const q = []
  await handler(lazniReq('POST', { slug: 'drugi' }), lazniRes(), { dohvati: dohvatiSa(OB, 'pad', q) })
  await handler(lazniReq('POST', { slug: 'drugi' }), lazniRes(), { dohvati: dohvatiSa(OB, 202, q) })
  assert.equal(q.length, 2)
})
await t('ruta: bez JSON zaglavlja 415; neispravno tijelo 400; getter koji baca 400', async () => {
  _zaboravi()
  let res = lazniRes(); await handler(lazniReq('POST', 'x', 'https://grasaksalon.me', 'text/plain'), res, { dohvati: dohvatiSa(OB) }); assert.equal(res.statusCode, 415)
  const q = lazniReq('POST', undefined); Object.defineProperty(q, 'body', { get() { throw new SyntaxError('json') } })
  res = lazniRes(); await handler(q, res, { dohvati: dohvatiSa(OB) }); assert.equal(res.statusCode, 400)
})
await t('panel zove dojavu tek poslije uspješnog Objavi i Skloni', () => {
  const s = fs.readFileSync(path.join(koren, 'src/components/osoblje/KutakPanel.tsx'), 'utf8')
  const objavi = s.slice(s.indexOf('const objavi = async'), s.indexOf('const skloni = async'))
  assert.ok(objavi.indexOf('javiIndexNow(') > objavi.indexOf("if (!r.ok) {"), 'Objavi: dojava prije provjere uspjeha')
  const skloni = s.slice(s.indexOf('const skloni = async'), s.indexOf('const blokirano'))
  assert.ok(skloni.indexOf('javiIndexNow(') > skloni.indexOf('if (!r.ok)'), 'Skloni: dojava prije provjere uspjeha')
  const lib = fs.readFileSync(path.join(koren, 'src/lib/kutak.ts'), 'utf8')
  assert.match(lib, /export function javiIndexNow[\s\S]*?\.catch\(\(\) => undefined\)/)
})

console.log('indexnow: ' + prosli + ' prošlo' + (process.exitCode ? ', ima palih' : ''))
