/**
 * Godište djeteta umjesto uzrasta. Novi upis je godina rođenja ("2022").
 * Stari upis uzrasta ("4", "4 god", "18 mj") pretvara se u godište prema datumu termina:
 * 4 godine na terminu 2026. = 2022.
 */

const BROJ_GODINA = 18 // izbor od ove godine unazad

export function izborGodista(danas = new Date()): string[] {
  const g = danas.getFullYear()
  return Array.from({ length: BROJ_GODINA }, (_, i) => String(g - i))
}

function datumTermina(datum?: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(datum || '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date()
}

export function godiste(upis: string | undefined, datum?: string): string {
  const s = String(upis || '').trim()
  if (!s || s === '-') return ''
  const god = /(?:^|\D)((?:19|20)\d{2})(?:\D|$)/.exec(s)
  if (god) return god[1]
  const ref = datumTermina(datum)
  const mj = /^(\d{1,2})\s*(mj|mes|mjes|мес|mon|ay)/i.exec(s)
  if (mj) return String(new Date(ref.getFullYear(), ref.getMonth() - Number(mj[1]), 1).getFullYear())
  const g = /^(\d{1,2})(?:[.,]\d+)?(?!\d)/.exec(s)
  if (g && Number(g[1]) <= 25) return String(ref.getFullYear() - Number(g[1]))
  return s
}

/** "2022 (4 god.)" za panel; nepoznat tekst ostaje kakav je. */
export function godisteSaUzrastom(upis: string | undefined, datum?: string): string {
  const g = godiste(upis, datum)
  if (!/^\d{4}$/.test(g)) return g
  const god = datumTermina(datum).getFullYear() - Number(g)
  return `${g} (${god < 1 ? 'do 1 god.' : god + ' god.'})`
}
