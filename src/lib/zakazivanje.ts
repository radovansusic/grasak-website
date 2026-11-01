/** Online zakazivanje - klijent za Google Apps Script API (kalendar salona grasaksalon@gmail.com).
 *  Adresa je javna (poziva je svaki posjetilac sajta). Ostaje ista i poslije "New version" u Apps Script-u.
 *  Može se pregaziti Vercel env varijablom VITE_ZAKAZIVANJE_API (npr. za probnu kopiju skripte). */

const GRASAK_APPS_SCRIPT =
  'https://script.google.com/macros/s/AKfycbwMCZOQN_8af5Ew3k6kWDa9z2s8PRc2zxr1dFUt_KZRap_JinC2B2DyBPlTYqNJTMMX/exec'

export const API_URL: string = import.meta.env.VITE_ZAKAZIVANJE_API || GRASAK_APPS_SCRIPT

export interface Usluga { id: string; naziv: string; trajanje: number }
export interface Lokacija {
  id: string
  naziv: string
  adresa: string
  osobe: string[]
  radno: Record<string, [string, string] | null>
  neradni?: Record<string, string>   // 'yyyy-MM-dd' -> praznik ili razlog
}
export interface Konfig {
  naziv: string
  osoba: string
  korak: number
  danaUnaprijed: number
  usluge: Usluga[]
  lokacije: Lokacija[]
}
export interface Slot { vrijeme: string; slobodno: boolean }
export interface Zahtjev {
  lok: string
  osoba: string
  usluga: string
  datum: string
  vrijeme: string
  dijete: string
  uzrast: string
  roditelj: string
  telefon: string
  napomena: string
}

async function get<T>(params: Record<string, string>): Promise<T> {
  const r = await fetch(API_URL + '?' + new URLSearchParams(params))
  const j = await r.json()
  if (j.greska) throw new Error(j.greska)
  return j as T
}

export const ucitajKonfig = () => get<Konfig>({ akcija: 'konfig' })

export const ucitajSlotove = (lok: string, osoba: string, usluga: string, datum: string) =>
  get<{ slotovi: Slot[] }>({ akcija: 'slotovi', lok, osoba, usluga, datum }).then((r) => r.slotovi)

export async function zakazi(z: Zahtjev): Promise<{ ok: boolean; poruka: string }> {
  // text/plain izbjegava CORS preflight prema Apps Script-u
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ akcija: 'zakazi', ...z }),
  })
  return r.json()
}

export function isoDatum(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface Vaucer { vrsta: string; dijete: string; kupac: string; telefon: string; napomena: string }

/** Bez API-ja narudžba ide samo emailom (FormSubmit), pa se vraća ok. */
export async function naruciVaucer(v: Vaucer): Promise<{ ok: boolean; poruka: string }> {
  if (!API_URL) return { ok: true, poruka: '' }
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ akcija: 'vaucer', ...v }),
  })
  return r.json()
}
