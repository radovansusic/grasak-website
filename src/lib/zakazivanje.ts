/** Online zakazivanje - klijent za Google Apps Script API (kalendar salona grasaksalon@gmail.com).
 *  Adresa je javna (poziva je svaki posjetilac sajta). Ostaje ista i poslije "New version" u Apps Script-u.
 *  Može se pregaziti Vercel env varijablom VITE_ZAKAZIVANJE_API (npr. za probnu kopiju skripte). */

const GRASAK_APPS_SCRIPT =
  'https://script.google.com/macros/s/AKfycbxsSbajtO0KiVGGFliIT9x9Q4dRqXtodsfGjNQuR9Pq_H610MMICByJzVyeT1vjv1I1/exec'

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
  email: string      // nije obavezno: potvrda i podsjetnik emailom
  kartica: boolean   // kartica Veseli Grašak (15% popusta): termin druge boje u panelu
}
/** Odgovor na zakazivanje: id i kod služe za otkazivanje preko linka (starija skripta ih ne vraća). */
export interface Zakazano { ok: boolean; poruka: string; id?: string; kod?: string; email?: boolean }
export interface TerminRoditelja {
  datum: string; vrijeme: string; osoba: string; usluga: string; dijete: string
  lokacija: string; adresa: string; telefonSalona: string; prosao: boolean; status: string
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

/** Termini za narednih N dana jednim pozivom: { 'yyyy-MM-dd': Slot[] } (brže od poziva po danu). */
export const ucitajPeriod = (lok: string, osoba: string, usluga: string, dana: number) =>
  get<{ dani: Record<string, Slot[]> }>({ akcija: 'slotovi_period', lok, osoba, usluga, dana: String(dana) }).then((r) => {
    if (!r.dani) throw new Error('bez perioda')
    return r.dani
  })

export async function zakazi(z: Zahtjev): Promise<Zakazano> {
  // text/plain izbjegava CORS preflight prema Apps Script-u
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ akcija: 'zakazi', ...z }),
  })
  return r.json()
}

/** Termin roditelja po linku iz potvrde (id + kod). */
export const ucitajTermin = (id: string, kod: string) => get<TerminRoditelja>({ akcija: 'termin', id, kod })

export async function otkaziTermin(id: string, kod: string): Promise<{ ok: boolean; poruka: string }> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ akcija: 'otkazi', id, kod }),
  })
  return r.json()
}

export function linkOtkazivanja(id: string, kod: string): string {
  return `${window.location.origin}/zakazi?otkazi=${encodeURIComponent(id)}&kod=${encodeURIComponent(kod)}`
}

const dvocifreno = (n: number) => String(n).padStart(2, '0')

/** Termin kao .ics fajl za kalendar roditelja (podsjetnik dan ranije i 2 sata prije), u vremenu salona. */
export function napraviIcs(t: { id?: string; datum: string; vrijeme: string; trajanje: number; naslov: string; mjesto: string; opis: string }): string {
  const [g, m, d] = t.datum.split('-').map(Number)
  const [h, mi] = t.vrijeme.split(':').map(Number)
  const pocetak = new Date(g, m - 1, d, h, mi)
  const kraj = new Date(pocetak.getTime() + t.trajanje * 60000)
  const lokalno = (x: Date) => `${x.getFullYear()}${dvocifreno(x.getMonth() + 1)}${dvocifreno(x.getDate())}T${dvocifreno(x.getHours())}${dvocifreno(x.getMinutes())}00`
  const sada = new Date()
  const utc = `${sada.getUTCFullYear()}${dvocifreno(sada.getUTCMonth() + 1)}${dvocifreno(sada.getUTCDate())}T${dvocifreno(sada.getUTCHours())}${dvocifreno(sada.getUTCMinutes())}00Z`
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grasak//Zakazivanje//SR', 'BEGIN:VEVENT',
    `UID:${t.id || 'grasak-' + Date.now() + '@grasaksalon.me'}`, `DTSTAMP:${utc}`,
    `DTSTART;TZID=Europe/Podgorica:${lokalno(pocetak)}`, `DTEND;TZID=Europe/Podgorica:${lokalno(kraj)}`,
    `SUMMARY:${esc(t.naslov)}`, `LOCATION:${esc(t.mjesto)}`, `DESCRIPTION:${esc(t.opis)}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Grašak', 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Grašak', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

export function preuzmiIcs(ics: string, ime = 'grasak-termin.ics') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  a.download = ime
  a.click()
  URL.revokeObjectURL(a.href)
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
