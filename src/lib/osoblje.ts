/** Panel za osoblje - klijent za Apps Script (akcije osoblje_*). PIN ide samo u tijelu POST zahtjeva. */
import { API_URL, type Usluga } from './zakazivanje'

export type Uloga = 'vlasnik' | 'admin' | 'frizer'
export interface Profil { ime: string; uloga: Uloga }
export interface LokacijaOsoblje { id: string; naziv: string; osobe: string[]; radno: Record<string, [string, string] | null> }
export interface KonfigOsoblje { korak: number; usluge: Usluga[]; lokacije: LokacijaOsoblje[] }
export interface TerminOsoblje {
  id: string; od: string; do: string; usluga: string; dijete: string; uzrast: string; roditelj: string
  telefon: string; napomena: string; izvor: string; status: 'zakazan' | 'nije_dosao' | 'otkazan'
}
export interface SlotOsoblje {
  vrijeme: string
  stanje: 'slobodno' | 'termin' | 'nastavak' | 'blokada' | 'van'
  termini?: number[]
  naziv?: string
}
export interface OsobaDan {
  ime: string
  slotovi: SlotOsoblje[]
  termini: TerminOsoblje[]
  popunjeno: { zauzeto: number; kapacitet: number; procenat: number }
}
export interface DanOsoblje { datum: string; lokacija: string; radno: [string, string] | null; neradni?: string; osobe: OsobaDan[] }
export interface Brojke { termini: number; dosli: number; predstoji: number; nijeDosao: number; otkazano: number; zauzeto: number; kapacitet: number; popunjenost: number }
export interface Izvjestaj {
  od: string; do: string; naslov: string
  ukupno: Brojke
  poFrizeru: (Brojke & { ime: string })[]
  poUsluzi: { naziv: string; broj: number }[]
  poIzvoru: { naziv: string; broj: number }[]
  poDanu: { dan: string; broj: number }[]
  klijenti: { ukupno: number; novi: number; ponovni: number }
}

type Odgovor<T> = T & { ok: boolean; poruka?: string }

export async function osoblje<T = object>(akcija: string, pin: string, podaci: Record<string, unknown> = {}): Promise<Odgovor<T>> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ akcija: 'osoblje_' + akcija, pin, ...podaci }),
  })
  return r.json()
}

/* ---- podešavanja (samo vlasnik) ---- */
export interface LokacijaPod { naziv: string; adresa: string; telefon: string; dani: string[]; postojeca?: boolean }
export interface FrizerPod { ime: string; lokacija: string; aktivan: boolean; postojeci?: boolean }
export interface UslugaPod { naziv: string; trajanje: number; aktivna: boolean; postojeca?: boolean }
export interface OsobaPod {
  red: number | null; ime: string; uloga: Uloga; lokacija: string; imaPin: boolean; pin?: string; email: string; aktivan: boolean
}
export interface PraznikPod { naziv: string; datum: string; dana: number; neradni: boolean; postojeci?: boolean }
export interface NeradniDanPod { datum: string; razlog: string; lokacija: string }
export interface Podesavanja {
  lokacije: LokacijaPod[]; frizeri: FrizerPod[]; usluge: UslugaPod[]; osoblje: OsobaPod[]
  praznici: PraznikPod[]; neradniDani: NeradniDanPod[]
}
