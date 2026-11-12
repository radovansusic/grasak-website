// IndexNow za grasaksalon.me: kad Kristina u panelu klikne "Objavi" ili "Skloni", Bing, Yandex, Seznam i Naver
// (preko Binga i ChatGPT pretraga) saznaju da su se adrese teksta promijenile. Google IndexNow ne čita.
// Ključ nije tajna: protokol ga objavljuje kao datoteku public/<ključ>.txt (dokaz vlasništva).
// Neuspjela dojava nikad ne dira objavu: dojavi() ne baca grešku i ima svoj rok, a panel je zove tek
// poslije uspješne objave i ne čeka odgovor.
import { JEZICI, SITE, SLUG_RE, adresa, adresaTema } from './kutak.js'

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
export const KLJUC = '831f5f378ed893165e9d14026dc8a227'
export const HOST = new URL(SITE).host
export const ROK_MS = 8000

/** Adrese jednog teksta: tekst i lista Kutka na svakom jeziku na kome tekst postoji, i strana rubrike. */
export function adreseTeksta(slug, objava) {
  if (!SLUG_RE.test(String(slug || ''))) return []
  const jezici = objava && objava.naslov ? JEZICI.filter((j) => objava.naslov[j] && (!objava.tijelo || objava.tijelo[j])) : JEZICI
  const rub = objava && typeof objava.rubrika === 'string' && SLUG_RE.test(objava.rubrika) ? objava.rubrika : ''
  const urls = []
  for (const j of jezici.length ? jezici : JEZICI) {
    urls.push(adresa(j, slug), adresa(j))
    if (rub) urls.push(adresaTema(j, rub))
  }
  return [...new Set(urls)]
}

/** Šalje jednu dojavu. Nikad ne baca; 200 i 202 su prihvaćeno. */
export async function dojavi(urlList, dohvati = fetch, rokMs = ROK_MS) {
  const lista = (urlList || []).filter((u) => { try { return new URL(u).host === HOST } catch { return false } })
  if (!lista.length) return { ok: false, status: null, broj: 0, greska: 'nema_adresa' }
  const kontrola = new AbortController()
  const sat = setTimeout(() => kontrola.abort(), rokMs)
  try {
    const r = await dohvati(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KLJUC, keyLocation: SITE + '/' + KLJUC + '.txt', urlList: lista }),
      signal: kontrola.signal,
    })
    const ok = r.status === 200 || r.status === 202
    return { ok, status: r.status, broj: lista.length, ...(ok ? {} : { greska: 'http_' + r.status }) }
  } catch (e) {
    return { ok: false, status: null, broj: lista.length, greska: e && e.name === 'AbortError' ? 'timeout' : 'mreza' }
  } finally {
    clearTimeout(sat)
  }
}
