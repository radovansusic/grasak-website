// Pravila štiklira "I na Dječiji kutak" u panelu (components/osoblje/KutakPanel.tsx). Obični JS da ih može pokrenuti i scripts/objave-test.mjs.
// Skripta (google-skripta/Grasak.gs: OBJAVE_KUTAK_RUBRIKE_NE, OBJAVE_KUTAK_VRSTE_NE) ima svoju kopiju zabrane jer se lijepi u Google; test poredi obje liste.

/** Rubrike i vrste koje ostaju samo na Grašku (vezane za salon): štiklir je nedostupan. */
export const KUTAK_RUBRIKE_NE = ['iz-graska']
export const KUTAK_VRSTE_NE = ['iz-salona']

/** Zadana vrijednost štiklira po rubrici kad urednica ništa nije dirala. Rubrika koje nema ovdje: isključeno. */
export const KUTAK_ZADANO = { 'za-roditelje': true, 'igraonica': true, 'vijesti-za-porodice': true, 'sisanje-i-njega': false }

export const KUTAK_NEDOSTUPNO = 'Tekst iz rubrike "Iz Graška" ostaje samo na Grašku: termini, radionice i radno vrijeme se odnose na salon.'
export const KUTAK_NEDOSTUPNO_VRSTA = 'Tekst vrste "Iz salona" ostaje samo na Grašku: odnosi se na salon, ne na porodice uopšte.'

/** Prazan izbor (nacrt bez rubrike i vrste) nije zabrana. */
export function kutakDostupno(rubrika, vrsta) {
  return !KUTAK_RUBRIKE_NE.includes(rubrika || '') && !KUTAK_VRSTE_NE.includes(vrsta || '')
}

/** Jedna rečenica zašto štiklir nije dostupan; prazno kad jeste. */
export function kutakObjasnjenje(rubrika, vrsta) {
  if (KUTAK_RUBRIKE_NE.includes(rubrika || '')) return KUTAK_NEDOSTUPNO
  if (KUTAK_VRSTE_NE.includes(vrsta || '')) return KUTAK_NEDOSTUPNO_VRSTA
  return ''
}

/** Zadana vrijednost za izabranu rubriku i vrstu (nedostupno je uvijek false). */
export function kutakZadano(rubrika, vrsta) {
  return kutakDostupno(rubrika, vrsta) && KUTAK_ZADANO[rubrika || ''] === true
}

/**
 * Vrijednost štiklira poslije izmjene rubrike ili vrste: nedostupno je uvijek false; ako je urednica sama kliknula (`rucno`), ostaje njen izbor; inače važi zadano za rubriku.
 */
export function kutakVrijednost({ rubrika, vrsta, stiklir, rucno }) {
  if (!kutakDostupno(rubrika, vrsta)) return false
  return rucno ? !!stiklir : kutakZadano(rubrika, vrsta)
}
