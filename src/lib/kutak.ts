/** Graškov kutak: javne adrese (strane isporučuje Vercel funkcija api/kutak.js) i tipovi odgovora skripte za karticu "Kutak" u panelu (components/osoblje/KutakPanel.tsx). */
import { useEffect, useState } from 'react'
import type { Lang } from '@/i18n/translations'
import { API_URL } from '@/lib/zakazivanje'

/** Crnogorski bez prefiksa, ostali jezici /en, /ru, /tr (slug "kutak" je isti). Vezuje se običnim <a>, ne ruterom: stranu pravi Vercel funkcija. */
export const kutakPutanja = (lang: Lang) => (lang === 'cnr' ? '' : '/' + lang) + '/kutak'

const KES_KLJUC = 'grasak_kutak_najnovije'
const KES_TRAJANJE_MS = 10 * 60 * 1000
const KES_NAJVISE = 12   // koliko najnovijih tekstova se pamti: po jeziku se iz njih bira tri

/** Najmanje što kartica na početnoj treba; sve to javna strana teksta prikazuje i sama (rubrika, naslov, opis, datum). Ništa više se ne pamti. */
export interface KutakStavka {
  slug: string
  rubrika: string
  objavljeno: string
  jezici: Lang[]
  naslov: Partial<PoJeziku>
  opis: Partial<PoJeziku>
}
export interface KutakNajnovije { ima: boolean; stavke: KutakStavka[]; rubrike: Record<string, Partial<PoJeziku>> }
const PRAZNO: KutakNajnovije = { ima: false, stavke: [], rubrike: {} }

const tekstPoJeziku = (x: unknown): Partial<PoJeziku> => {
  const izlaz: Partial<PoJeziku> = {}
  if (x && typeof x === 'object') for (const j of JEZICI_OBJAVA) { const v = (x as Record<string, unknown>)[j]; if (typeof v === 'string' && v) izlaz[j] = v }
  return izlaz
}

/** Iz javnog odgovora ?akcija=objave pravi sažetak za početnu. Odgovor bez taksonomije ili bez liste nije "ima". Čista funkcija (testira se bez mreže). */
export function sazmiNajnovije(j: unknown): KutakNajnovije {
  const o = j as { ok?: boolean; objave?: unknown; taksonomija?: { rubrike?: unknown } } | null
  if (!o || o.ok !== true || !o.taksonomija || !Array.isArray(o.objave) || o.objave.length === 0) return PRAZNO
  const rubrike: Record<string, Partial<PoJeziku>> = {}
  if (Array.isArray(o.taksonomija.rubrike)) for (const r of o.taksonomija.rubrike as { slug?: unknown; naziv?: unknown }[]) { if (r && typeof r.slug === 'string') rubrike[r.slug] = tekstPoJeziku(r.naziv) }
  const stavke: KutakStavka[] = []
  for (const x of o.objave as Record<string, unknown>[]) {
    if (!x || typeof x.slug !== 'string' || !/^[a-z0-9-]+$/.test(x.slug)) continue
    const jezici = (Array.isArray(x.jezici) ? x.jezici : []).filter((l): l is Lang => JEZICI_OBJAVA.includes(l as Lang))
    const opis = tekstPoJeziku(x.recenica)
    const opis2 = tekstPoJeziku(x.opis)
    for (const l of JEZICI_OBJAVA) if (!opis[l] && opis2[l]) opis[l] = opis2[l]
    stavke.push({ slug: x.slug, rubrika: String(x.rubrika || ''), objavljeno: String(x.objavljeno || x.datum || '').slice(0, 10), jezici, naslov: tekstPoJeziku(x.naslov), opis })
    if (stavke.length >= KES_NAJVISE) break
  }
  return { ima: true, stavke, rubrike }
}

/**
 * Tri najnovija teksta na jeziku strane. Isto pravilo kao lista i strana teksta (api/_lib/kutak.js): tekst ima stranu samo na jeziku sa potvrđenim prevodom
 * (`jezici`) i naslovom, pa tekst bez prevoda na tom jeziku se ne prikazuje (veza bi vodila na 404). Redoslijed odgovora skripte je od najnovijeg.
 * Čista funkcija.
 */
export function najnovijaTri(n: KutakNajnovije, lang: Lang): { slug: string; rubrika: string; naslov: string; opis: string; objavljeno: string }[] {
  return n.stavke
    .filter((s) => s.jezici.includes(lang) && !!s.naslov[lang])
    .slice(0, 3)
    .map((s) => ({ slug: s.slug, rubrika: (n.rubrike[s.rubrika] && (n.rubrike[s.rubrika][lang] || n.rubrike[s.rubrika].cnr)) || '', naslov: s.naslov[lang] as string, opis: s.opis[lang] || '', objavljeno: s.objavljeno }))
}

let uToku: Promise<KutakNajnovije> | null = null

function izKesa(): KutakNajnovije | null {
  try {
    const k = sessionStorage.getItem(KES_KLJUC)
    if (k) {
      const { n, t } = JSON.parse(k) as { n: KutakNajnovije; t: number }
      if (n && Array.isArray(n.stavke) && Date.now() - t < KES_TRAJANJE_MS) return n
    }
  } catch { /* nema sessionStorage ili je oštećen */ }
  return null
}

/**
 * Jedan javni poziv (?akcija=objave) za sve što početna treba: da li ima tekstova (veza "Kutak") i tri najnovija (blok "Iz Graškovog kutka").
 * Dok skripta ne odgovori, dok je stara (bez Kutka) ili dok nema nijednog teksta, vrijednost je prazna i ni veze ni bloka nema.
 * Odgovor se kešira u sessionStorage (10 minuta), a neuspjeh se ne kešira (sljedeće učitavanje pokušava ponovo).
 */
export function kutakNajnovije(): Promise<KutakNajnovije> {
  const k = izKesa()
  if (k) return Promise.resolve(k)
  if (!uToku) {
    uToku = (async () => {
      const kontrola = new AbortController()
      const sat = setTimeout(() => kontrola.abort(), 8000)
      try {
        const r = await fetch(API_URL + '?akcija=objave', { signal: kontrola.signal })
        const n = sazmiNajnovije(await r.json())
        try { sessionStorage.setItem(KES_KLJUC, JSON.stringify({ n, t: Date.now() })) } catch { /* ignore */ }
        return n
      } catch {
        return PRAZNO
      } finally {
        clearTimeout(sat)
        uToku = null
      }
    })()
  }
  return uToku
}

/** Da li javni odgovor Google skripte ima bar jedan objavljen tekst. */
export function kutakIma(): Promise<boolean> {
  return kutakNajnovije().then((n) => n.ima)
}

/** React kuka za kutakIma(): false dok se provjera ne završi, i ostaje false ako skripta ne odgovori. */
export function useKutakIma(): boolean {
  return useKutakNajnovije().ima
}

/**
 * React kuka za početnu: prazno dok odgovor ne stigne (blok se ne crta, pa nema praznog prostora ni skoka), a ako je odgovor već u kešu sesije
 * vrijednost je tu od prvog crtanja (bez treptanja pri povratku na početnu).
 */
export function useKutakNajnovije(): KutakNajnovije {
  const [n, setN] = useState<KutakNajnovije>(() => izKesa() || PRAZNO)
  useEffect(() => {
    let ziv = true
    kutakNajnovije().then((v) => { if (ziv) setN(v) })
    return () => { ziv = false }
  }, [])
  return n
}

export type StatusObjave = 'nacrt' | 'objavljeno' | 'sklonjeno'
export const JEZICI_OBJAVA: Lang[] = ['cnr', 'en', 'ru', 'tr']
export const JEZIK_NAZIV: Record<Lang, string> = { cnr: 'Crnogorski', en: 'English', ru: 'Русский', tr: 'Türkçe' }
export type PoJeziku = Record<Lang, string>
export type PoJezikuNiz = Record<Lang, string[]>

/** Taksonomija stiže iz skripte (Grasak.gs: OBJAVE_RUBRIKE, OBJAVE_VRSTE, OBJAVE_OZNAKE): panel nema svoju kopiju. */
export interface Taksonomija {
  rubrike: { slug: string; boja: string; naziv: PoJeziku; opis: PoJeziku }[]
  vrste: { slug: string; naziv: PoJeziku; min: number; max: number; koraci: boolean; izvor: boolean }[]
  oznake: { slug: string; grupa: string; naziv: PoJeziku }[]
  zdravlje_napomena: PoJeziku
  oznaka_min: number
  oznaka_max: number
  koraka_min: number
  koraka_max: number
}

export interface ObjavaUredjaj {
  slug: string
  status: StatusObjave
  vrsta: string
  rubrika: string
  oznake: string[]
  izvor_naziv: string
  izvor_url: string
  izvor_jezik: string
  naslov: PoJeziku
  tijelo: PoJeziku
  koraci: PoJezikuNiz
  potvrda: { en: boolean; ru: boolean; tr: boolean }
  /** Štiklir "I na Dječiji kutak": objavljeni crnogorski tekst stiže i na djecijikutak.me (uvoz na Kutku). */
  na_kutku: boolean
}
export const praznaObjava = (): ObjavaUredjaj => ({
  slug: '', status: 'nacrt', vrsta: '', rubrika: '', oznake: [], izvor_naziv: '', izvor_url: '', izvor_jezik: '',
  naslov: { cnr: '', en: '', ru: '', tr: '' }, tijelo: { cnr: '', en: '', ru: '', tr: '' },
  koraci: { cnr: [], en: [], ru: [], tr: [] }, potvrda: { en: false, ru: false, tr: false }, na_kutku: false,
})
export interface ObjavaStavka { slug: string; naslov: string; status: StatusObjave; datum: string; azurirano: string; vrsta: string; rubrika: string; jezici: Lang[]; javni_jezici: Lang[]; na_kutku?: boolean }
export interface Nalaz { jezik: Lang; pravilo: string; nadjeno: string }
export interface Zdravstvena { jezik: Lang; nadjeno: string }
export interface ProvjeraObjave { blokirano: Nalaz[]; upozorenja: string[]; zdravstvene?: Zdravstvena[]; greske?: Record<string, string> }
export interface Paznja { mjesto: string; poruka: string }
