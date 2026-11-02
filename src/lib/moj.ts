/** Moj Grašak: nalog roditelja (telefon + PIN). Sajt pamti token, nikad PIN. */
import { API_URL } from './zakazivanje'

export interface ProfilRoditelja {
  telefon: string; roditelj: string; email: string; djeca: string[]; kartica: boolean; marketing: string; registrovan: string
}
export interface MojTermin {
  id: string; datum: string; vrijeme: string; kraj: string; osoba: string; usluga: string; dijete: string
  lokacija: string; adresa: string; kartica: boolean
}
export interface MojaPosjeta { datum: string; vrijeme: string; usluga: string; dijete: string; frizer: string; status: string }
export interface MojNalog { telefon: string; token: string; profil: ProfilRoditelja }

const KLJUC = 'grasak-moj'
const PREFILL = 'grasak-moj-prefill'

export function citajMoj(): MojNalog | null {
  try {
    const n = JSON.parse(localStorage.getItem(KLJUC) || 'null')
    return n && n.telefon && n.token && n.profil ? n : null
  } catch { return null }
}
export function pisiMoj(n: MojNalog | null) {
  try { if (n) localStorage.setItem(KLJUC, JSON.stringify(n)); else localStorage.removeItem(KLJUC) } catch { /* privatni režim */ }
}

/** Podaci iz upravo zakazanog termina za brže otvaranje naloga (sessionStorage, samo ovaj tab). */
export interface Prefill { roditelj: string; telefon: string; email: string; dijete: string; kartica: boolean }
export function pisiPrefill(p: Prefill) { try { sessionStorage.setItem(PREFILL, JSON.stringify(p)) } catch { /* ignore */ } }
export function citajPrefill(): Prefill | null {
  try { return JSON.parse(sessionStorage.getItem(PREFILL) || 'null') } catch { return null }
}

type Odgovor<T> = T & { ok: boolean; poruka?: string }

async function moj<T = object>(akcija: string, podaci: Record<string, unknown>): Promise<Odgovor<T>> {
  const r = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ akcija: 'moj_' + akcija, ...podaci }),
  })
  return r.json()
}

export interface Registracija { telefon: string; pin: string; roditelj: string; email: string; djeca: string[]; kartica: boolean; marketing: 'da' | 'ne' }
export const registracija = (z: Registracija) => moj<{ token: string; profil: ProfilRoditelja }>('registracija', { ...z })
export const prijava = (telefon: string, pin: string) => moj<{ token: string; profil: ProfilRoditelja }>('prijava', { telefon, pin })
export const mojPregled = (n: MojNalog) => moj<{ profil: ProfilRoditelja; termini: MojTermin[]; posjete: MojaPosjeta[] }>('pregled', { telefon: n.telefon, token: n.token })
export const mojSacuvaj = (n: MojNalog, z: { roditelj: string; email: string; djeca: string[]; kartica: boolean; marketing: string; noviPin: string }) =>
  moj<{ token: string; profil: ProfilRoditelja }>('sacuvaj', { telefon: n.telefon, token: n.token, ...z })
export const mojOtkazi = (n: MojNalog, id: string) => moj('otkazi', { telefon: n.telefon, token: n.token, id })
