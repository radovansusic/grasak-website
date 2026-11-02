/** Panel za osoblje - klijent za Apps Script (akcije osoblje_*). Ime i šifra idu samo u tijelu POST zahtjeva. */
import { API_URL, type Usluga } from './zakazivanje'

export type Uloga = 'vlasnik' | 'admin' | 'frizer'
export interface Profil { ime: string; uloga: Uloga }
export interface LokacijaOsoblje { id: string; naziv: string; osobe: string[]; radno: Record<string, [string, string] | null> }
export interface KonfigOsoblje { korak: number; usluge: Usluga[]; lokacije: LokacijaOsoblje[]; verzija?: string; kalendar?: string; nalog?: string }
/** Verzija Google skripte koju ovaj panel očekuje (VERZIJA_SKRIPTE u Grasak.gs). */
export const OCEKIVANA_VERZIJA_SKRIPTE = '2026-11-02b'
export interface TerminOsoblje {
  id: string; od: string; do: string; usluga: string; dijete: string; uzrast: string; roditelj: string
  telefon: string; napomena: string; izvor: string; status: 'zakazan' | 'nije_dosao' | 'otkazan'
  kartica?: boolean   // kartica Veseli Grašak (15% popusta)
  email?: string
}
export interface SlotOsoblje {
  vrijeme: string
  stanje: 'slobodno' | 'termin' | 'nastavak' | 'blokada' | 'van'
  termini?: number[]
  naziv?: string
  id?: string         // pauza iz kalendara: id događaja (može se ukloniti iz panela)
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

/** Prijava u panel: ime iz lista Osoblje + lična šifra. */
export interface Pristup { ime: string; sifra: string }

export async function osoblje<T = object>(akcija: string, pristup: Pristup, podaci: Record<string, unknown> = {}): Promise<Odgovor<T>> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ akcija: 'osoblje_' + akcija, ime: pristup.ime, sifra: pristup.sifra, ...podaci }),
  })
  return r.json()
}

/* ---- sedmica, istorija klijenta, lista predstojećih ---- */
export interface SedmicaOsoba {
  ime: string; termini: number; nijeDosao: number; kartica: number; slobodno: number
  popunjeno: { zauzeto: number; kapacitet: number; procenat: number }
}
export interface SedmicaDan { datum: string; neradni?: string; radno: [string, string] | null; osobe: SedmicaOsoba[] }
export interface Sedmica { od: string; do: string; lokacija: string; dani: SedmicaDan[] }
export interface Klijent {
  posjete: number; zadnja: string; prva: string; nijeDosao: number; otkazano: number; predstoji: number; kartica: boolean; djeca: string[]
}
export interface PredstojeciTermin {
  id: string; datum: string; vrijeme: string; kraj: string; frizer: string; lokacija: string; usluga: string; dijete: string
  roditelj: string; telefon: string; kartica: boolean; napomena: string; status: string; izvor: string
}

/* ---- baza klijenata (CRM), list "Klijenti": jedan red po telefonu ---- */
export interface KlijentRed {
  telefon: string; roditelj: string; email: string; djeca: string; kartica: boolean
  posjete: number; prva: string; zadnja: string; zadnjaUsluga: string; predstoji: number; nijeDosao: number; otkazano: number; vauceri: number
  izvor: string; marketing: string; napomena: string; azurirano: string
  registrovan?: string; nalog?: boolean   // nalog roditelja (Moj Grašak)
}

/* ---- podešavanja (samo vlasnik) ---- */
export interface LokacijaPod { naziv: string; adresa: string; telefon: string; dani: string[]; postojeca?: boolean }
export interface FrizerPod { ime: string; lokacija: string; aktivan: boolean; postojeci?: boolean }
export interface UslugaPod { naziv: string; trajanje: number; aktivna: boolean; postojeca?: boolean }
export interface OsobaPod {
  red: number | null; ime: string; uloga: Uloga; lokacija: string; imaSifru: boolean; sifra?: string; email: string; aktivan: boolean
}
export interface PraznikPod { naziv: string; datum: string; dana: number; neradni: boolean; postojeci?: boolean }
export interface NeradniDanPod { datum: string; razlog: string; lokacija: string }
export interface Podesavanja {
  lokacije: LokacijaPod[]; frizeri: FrizerPod[]; usluge: UslugaPod[]; osoblje: OsobaPod[]
  praznici: PraznikPod[]; neradniDani: NeradniDanPod[]
}

/* ---- obavještenja u panelu ---- */
export interface Obavjestenje {
  kad: string            // ms od 1970, jedinstveno i rastuće
  tip: 'novi' | 'otkazan' | 'pomjeren'
  lokacija: string; frizer: string; datum: string; vrijeme: string; usluga: string; dijete: string
  izvor: 'sajt' | 'panel' | 'kalendar' | string
  ko: string
}
