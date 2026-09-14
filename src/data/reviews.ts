// Centralni izvor Google recenzija, stvarne recenzije s javnog Google profila salona.
// Ažuriranje: dopišite novu recenziju u niz ispod (ime, tekst, ocjenu), sajt je prikaže automatski.
// Zbirna ocjena i broj recenzija uživo: GOOGLE_MAPS_URL.

export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/GRAŠAK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95'

export const GOOGLE_RATING = 4.5

export interface Review {
  name: string
  role: string
  quote: string
  rating: number // 1–5, stvarna ocjena recenzije
}

export const reviews: Review[] = [
  {
    name: 'Mira Radovic',
    role: 'Local Guide',
    quote: 'Divno, pažljivi prema djeci i veoma brzi. Razne aktivnosti koje privlače pažnju djece.',
    rating: 5,
  },
  {
    name: 'Miljana Bajcetic',
    role: 'mama',
    quote: 'Svaka čast frizeru, na strpljenju, stručnosti i ljubaznosti! Toplo preporučujem.',
    rating: 5,
  },
  {
    name: 'Estefania Pia S.C.',
    role: 'mama',
    quote: 'Prvo šišanje za sina. Sve prilagođeno djeci. Definitivno se vraćamo.',
    rating: 5,
  },
  {
    name: 'Anastasiya P',
    role: 'mama',
    quote: 'Dječiji salon sa muzičkim autićem, crtaćima i igračkama. Dijete oduševljeno.',
    rating: 5,
  },
]
