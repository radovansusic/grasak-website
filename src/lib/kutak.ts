/** Graškov kutak: javne adrese (strane isporučuje Vercel funkcija api/kutak.js) i tipovi odgovora skripte za karticu "Kutak" u panelu (components/osoblje/KutakPanel.tsx). */
import type { Lang } from '@/i18n/translations'

/** Crnogorski bez prefiksa, ostali jezici /en, /ru, /tr (slug "kutak" je isti). Vezuje se običnim <a>, ne ruterom: stranu pravi Vercel funkcija. */
export const kutakPutanja = (lang: Lang) => (lang === 'cnr' ? '' : '/' + lang) + '/kutak'

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
}
export const praznaObjava = (): ObjavaUredjaj => ({
  slug: '', status: 'nacrt', vrsta: '', rubrika: '', oznake: [], izvor_naziv: '', izvor_url: '', izvor_jezik: '',
  naslov: { cnr: '', en: '', ru: '', tr: '' }, tijelo: { cnr: '', en: '', ru: '', tr: '' },
  koraci: { cnr: [], en: [], ru: [], tr: [] }, potvrda: { en: false, ru: false, tr: false },
})
export interface ObjavaStavka { slug: string; naslov: string; status: StatusObjave; datum: string; azurirano: string; vrsta: string; rubrika: string; jezici: Lang[]; javni_jezici: Lang[] }
export interface Nalaz { jezik: Lang; pravilo: string; nadjeno: string }
export interface ProvjeraObjave { blokirano: Nalaz[]; upozorenja: string[]; greske?: Record<string, string> }
export interface Paznja { mjesto: string; poruka: string }
