export const KUTAK_RUBRIKE_NE: string[]
export const KUTAK_VRSTE_NE: string[]
export const KUTAK_ZADANO: Record<string, boolean>
export const KUTAK_NEDOSTUPNO: string
export const KUTAK_NEDOSTUPNO_VRSTA: string
export function kutakDostupno(rubrika: string, vrsta: string): boolean
export function kutakObjasnjenje(rubrika: string, vrsta: string): string
export function kutakZadano(rubrika: string, vrsta: string): boolean
export function kutakVrijednost(p: { rubrika: string; vrsta: string; stiklir: boolean; rucno: boolean }): boolean
