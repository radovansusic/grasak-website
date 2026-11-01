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
