// Jedini unos adrese, telefona i radnog vremena salona za javni sajt: čitaju ga podnožje sajta (src/i18n/translations.ts)
// i strane Graškovog kutka (api/_lib/kutak.js). Mijenja se samo ovdje. (Radno vrijeme za zakazivanje je zaseban unos u tabeli skripte: Podešavanja.)
export const SALON = {
  telefon: '+382 69 371 111',
  telefonTel: '+38269371111',
  adresa: {
    cnr: ['Branka Deletića bb, Lamela „A", New City', '(iza Volija), Podgorica'],
    en: ['Branka Deletića bb, Lamela „A", New City', '(iza Volija), Podgorica'],
    ru: ['Branka Deletića bb, Lamela „A", New City', '(за Voli), Подгорица'],
    tr: ['Branka Deletića bb, Lamela „A", New City', '(Voli’nin arkasında), Podgoritsa'],
  },
  radno: [
    { dani: { cnr: 'Uto–Pet', en: 'Tue–Fri', ru: 'Вт–Пт', tr: 'Sal–Cum' }, od: '15:00', do: '21:00' },
    { dani: { cnr: 'Sub–Ned', en: 'Sat–Sun', ru: 'Сб–Вс', tr: 'Cmt–Paz' }, od: '11:00', do: '21:00' },
  ],
  neradan: { cnr: 'Ponedjeljak: neradan dan', en: 'Monday: closed', ru: 'Понедельник: выходной', tr: 'Pazartesi: kapalı' },
}

/** "Uto–Pet: 15:00–21:00" za red `i` radnog vremena na jeziku `jez`. */
export const radnoRed = (jez, i) => SALON.radno[i].dani[jez] + ': ' + SALON.radno[i].od + '–' + SALON.radno[i].do

/** "Uto–Pet 15:00–21:00, Sub–Ned 11:00–21:00": za rečenice u tekstovima sajta (npr. FAQ). */
export const radnoKratko = (jez) => SALON.radno.map((r) => r.dani[jez] + ' ' + r.od + '–' + r.do).join(', ')
