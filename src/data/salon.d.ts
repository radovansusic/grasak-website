type PoJeziku<T> = { cnr: T; en: T; ru: T; tr: T }
export const SALON: {
  telefon: string
  telefonTel: string
  adresa: PoJeziku<string[]>
  radno: { dani: PoJeziku<string>; od: string; do: string }[]
  neradan: PoJeziku<string>
}
export const radnoRed: (jez: 'cnr' | 'en' | 'ru' | 'tr', i: number) => string
export const radnoKratko: (jez: 'cnr' | 'en' | 'ru' | 'tr') => string
