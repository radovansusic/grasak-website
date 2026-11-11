/** Objave: javno čitanje iz Google skripte (GET akcija=objave i akcija=objava) i putanje po jezicima. Pisanje je u panelu (components/osoblje/ObjavePanel.tsx). */
import { API_URL } from './zakazivanje'
import type { Lang } from '@/i18n/translations'

export interface ObjavaJavno {
  slug: string
  datum: string
  azurirano: string
  autor: string
  tip: 'vijest' | 'vlastita'
  izvor_naziv: string
  izvor_url: string
  jezici: Lang[]
  naslov: Partial<Record<Lang, string>>
  opis: Partial<Record<Lang, string>>
  tijelo?: Partial<Record<Lang, string>>
}

async function get<T>(params: Record<string, string>): Promise<T> {
  const r = await fetch(API_URL + '?' + new URLSearchParams(params))
  return (await r.json()) as T
}

export async function ucitajObjave(): Promise<ObjavaJavno[]> {
  const j = await get<{ ok?: boolean; objave?: ObjavaJavno[]; greska?: string }>({ akcija: 'objave' })
  if (!j.ok || !j.objave) throw new Error(j.greska || 'objave')
  return j.objave
}

/** null = objava ne postoji (ili je skinuta); greška mreže baca izuzetak. */
export async function ucitajObjavu(slug: string): Promise<ObjavaJavno | null> {
  const j = await get<{ ok?: boolean; nema?: boolean; objava?: ObjavaJavno; greska?: string }>({ akcija: 'objava', slug })
  if (j.ok && j.objava) return j.objava
  if (j.nema) return null
  throw new Error(j.greska || 'objava')
}

/** Ista pravila kao api/_lib/objave.js: crnogorski bez prefiksa, ostali jezici /en, /ru, /tr. */
export const objavePutanja = (lang: Lang, slug?: string) => (lang === 'cnr' ? '' : '/' + lang) + '/objave' + (slug ? '/' + slug : '')

export function jezikIzPutanje(pathname: string): Lang {
  const m = /^\/(en|ru|tr)\//.exec(pathname)
  return (m ? m[1] : 'cnr') as Lang
}

export function lijepDatumObjave(iso: string, lang: Lang): string {
  const lokal = { cnr: 'sr-Latn-ME', en: 'en', ru: 'ru', tr: 'tr' }[lang]
  try {
    return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString(lokal, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

/* ---- panel (Objave): tipovi odgovora skripte, akcije osoblje_objave_* ---- */
export type StatusObjave = 'nacrt' | 'objavljeno' | 'sklonjeno'
export const JEZICI_OBJAVA: Lang[] = ['cnr', 'en', 'ru', 'tr']
export const JEZIK_NAZIV: Record<Lang, string> = { cnr: 'Crnogorski', en: 'English', ru: 'Русский', tr: 'Türkçe' }
export type PoJeziku = Record<Lang, string>
export interface ObjavaUredjaj {
  slug: string
  status: StatusObjave
  tip: 'vijest' | 'vlastita'
  izvor_naziv: string
  izvor_url: string
  naslov: PoJeziku
  tijelo: PoJeziku
}
export const praznaObjava = (): ObjavaUredjaj => ({
  slug: '', status: 'nacrt', tip: 'vlastita', izvor_naziv: '', izvor_url: '',
  naslov: { cnr: '', en: '', ru: '', tr: '' }, tijelo: { cnr: '', en: '', ru: '', tr: '' },
})
export interface ObjavaStavka { slug: string; naslov: string; status: StatusObjave; datum: string; azurirano: string; tip: string; jezici: Lang[] }
export interface Nalaz { jezik: Lang; pravilo: string; nadjeno: string }
export interface ProvjeraObjave { blokirano: Nalaz[]; upozorenja: string[]; greske?: Record<string, string> }
