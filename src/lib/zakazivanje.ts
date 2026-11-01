/** Online zakazivanje - klijent za Google Apps Script API (kalendar salona grasaksalon@gmail.com).
 *  Adresa API-ja: Vercel env varijabla VITE_ZAKAZIVANJE_API. Bez nje stranica /zakazi
 *  prikazuje staru formu (WhatsApp + email), pa sajt radi i prije nego što se API postavi. */

export const API_URL: string = import.meta.env.VITE_ZAKAZIVANJE_API ?? ''

export interface Usluga { id: string; naziv: string; trajanje: number }
export interface Lokacija {
  id: string
  naziv: string
  adresa: string
  osobe: string[]
  radno: Record<string, [string, string] | null>
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
