import { isoDatum } from '@/lib/zakazivanje'

/** Pomoćne funkcije panela: datumi, stil polja. */
export const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota']
export const inputCls = 'w-full rounded-xl border-2 border-grass-tint bg-white px-3 py-2.5 text-ink outline-none focus:border-grass'

export function pomjeri(iso: string, n: number): string {
  const [g, m, d] = iso.split('-').map(Number)
  return isoDatum(new Date(g, m - 1, d + n))
}

export function lijepDatum(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number)
  const dt = new Date(g, m - 1, d)
  return `${DANI[dt.getDay()]}, ${d}.${m}.`
}

export function kratakDatum(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d}.${m}.`
}

/** Ponedjeljak sedmice u kojoj je datum. */
export function ponedjeljak(d: Date): string {
  return isoDatum(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)))
}

/** Polje od pola sata je prošlo kad mu je kraj prije trenutnog vremena. */
export function proslo(vrijeme: string): boolean {
  const [h, m] = vrijeme.split(':').map(Number)
  const sada = new Date()
  return h * 60 + m + 30 <= sada.getHours() * 60 + sada.getMinutes()
}

/* ---------- ime termina: kad ime djeteta fali, termin se zove po dominantnoj ključnoj riječi ---------- */

const bezKvacica = (s: string) => s.toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

/** "Sisanje", "Dijete", "Kratko šišanje", "-" i slično nisu ime (upisivano je jer je polje bilo obavezno). */
const GENERICKO = /^(-|\?|x|dijete|djete|dete|klijent|bez imena|nema|n\/a|termin|(kratko |srednje |dugo |prvo |svecano )?sisanje( dijete)?|mini spa( tretman)?|feniranje|mali tim|veseli paket|mini drustvo)$/
const STOP = new Set(['preko', 'pred', 'posle', 'poslije', 'prije', 'zbog', 'za', 'na', 'od', 'do', 'sa', 'iz', 'kod', 'je', 'se', 'da', 'pa', 'ili', 'i', 'u', 'a',
  'juce', 'jucer', 'danas', 'sutra', 'sjutra', 'zakazano', 'zakazan', 'zakazala', 'zakazao', 'dogovoreno', 'dogovor', 'dogovorili', 'termin', 'termina',
  'pozvao', 'pozvala', 'zvao', 'zvala', 'javio', 'javila', 'rekao', 'rekla', 'mama', 'tata', 'dijete', 'djeca', 'sisanje', 'kratko', 'dugo', 'srednje', 'prvo',
  'otkazao', 'otkazala', 'pomjeren', 'duplikat', 'ponovo', 'upisan', 'nikola', 'kristina'])

export function jeIme(s: string | undefined, usluga = ''): boolean {
  const n = bezKvacica(s || '')
  return !!n && !GENERICKO.test(n) && n !== bezKvacica(usluga)
}

/** Najjača riječ iz napomene: prvo vlastita imenica (velikim slovom), inače najduža smislena riječ. */
export function kljucnaRijec(napomena: string | undefined): string {
  const rijeci = String(napomena || '').split(/[\s,.;:!?|()"'/]+/).filter((w) => w.length > 2 && !STOP.has(bezKvacica(w)) && !/^\d+$/.test(w))
  if (!rijeci.length) return ''
  const w = rijeci.find((x) => /^\p{Lu}/u.test(x)) || [...rijeci].sort((a, b) => b.length - a.length)[0]
  return w.charAt(0).toUpperCase() + w.slice(1)
}

export type IzvorImena = 'dijete' | 'roditelj' | 'napomena' | 'telefon' | 'usluga'

/** Ime termina za prikaz: dijete > roditelj > ključna riječ iz napomene > telefon > usluga. */
export function nazivTermina(t: { dijete?: string; roditelj?: string; napomena?: string; telefon?: string; usluga?: string }): { tekst: string; izvor: IzvorImena } {
  const usluga = t.usluga || ''
  if (jeIme(t.dijete, usluga)) return { tekst: t.dijete!.trim(), izvor: 'dijete' }
  if (jeIme(t.roditelj, usluga)) return { tekst: t.roditelj!.trim(), izvor: 'roditelj' }
  const k = kljucnaRijec(t.napomena)
  if (k) return { tekst: k, izvor: 'napomena' }
  const tel = String(t.telefon || '').replace(/\D/g, '')
  if (tel.length >= 6) return { tekst: 'tel. ' + tel.slice(-6, -3) + ' ' + tel.slice(-3), izvor: 'telefon' }
  return { tekst: usluga || 'Termin', izvor: 'usluga' }
}

export const OZNAKA_IZVORA: Record<IzvorImena, string> = { dijete: '', roditelj: 'roditelj', napomena: 'iz napomene', telefon: 'telefon', usluga: 'bez imena' }
