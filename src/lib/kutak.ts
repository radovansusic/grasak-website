/** Graškov kutak: javne adrese (strane isporučuje Vercel funkcija api/kutak.js) i tipovi odgovora skripte za karticu "Kutak" u panelu (components/osoblje/KutakPanel.tsx). */
import { useEffect, useState } from 'react'
import type { Lang } from '@/i18n/translations'
import { API_URL } from '@/lib/zakazivanje'

/** Crnogorski bez prefiksa, ostali jezici /en, /ru, /tr (slug "kutak" je isti). Vezuje se običnim <a>, ne ruterom: stranu pravi Vercel funkcija. */
export const kutakPutanja = (lang: Lang) => (lang === 'cnr' ? '' : '/' + lang) + '/kutak'

const KES_KLJUC = 'grasak_kutak_ima'
const KES_TRAJANJE_MS = 10 * 60 * 1000
let uToku: Promise<boolean> | null = null

/**
 * Da li javni odgovor Google skripte ima bar jedan objavljen tekst. Veza "Kutak" se prikazuje tek tada:
 * dok skripta ne odgovori, dok je stara (bez Kutka) ili dok nema nijednog teksta, vrijednost je false i veze nema.
 * Odgovor se kešira u sessionStorage (10 minuta), a neuspjeh se ne kešira (sljedeće učitavanje pokušava ponovo).
 */
export function kutakIma(): Promise<boolean> {
  try {
    const k = sessionStorage.getItem(KES_KLJUC)
    if (k) {
      const { ima, t } = JSON.parse(k) as { ima: boolean; t: number }
      if (Date.now() - t < KES_TRAJANJE_MS) return Promise.resolve(!!ima)
    }
  } catch { /* nema sessionStorage ili je oštećen */ }
  if (!uToku) {
    uToku = (async () => {
      const kontrola = new AbortController()
      const sat = setTimeout(() => kontrola.abort(), 8000)
      try {
        const r = await fetch(API_URL + '?akcija=objave', { signal: kontrola.signal })
        const j = await r.json()
        const ima = !!j && j.ok === true && !!j.taksonomija && Array.isArray(j.objave) && j.objave.length > 0
        try { sessionStorage.setItem(KES_KLJUC, JSON.stringify({ ima, t: Date.now() })) } catch { /* ignore */ }
        return ima
      } catch {
        return false
      } finally {
        clearTimeout(sat)
        uToku = null
      }
    })()
  }
  return uToku
}

/** React kuka za kutakIma(): false dok se provjera ne završi, i ostaje false ako skripta ne odgovori. */
export function useKutakIma(): boolean {
  const [ima, setIma] = useState(false)
  useEffect(() => {
    let ziv = true
    kutakIma().then((v) => { if (ziv) setIma(v) })
    return () => { ziv = false }
  }, [])
  return ima
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
