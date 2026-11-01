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
export interface DanOsoblje { datum: string; lokacija: string; radno: [string, string] | null; osobe: OsobaDan[] }
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
