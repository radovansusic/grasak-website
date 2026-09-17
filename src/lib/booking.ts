
/** Šalje rezervaciju emailom salonu preko besplatnog FormSubmit servisa.
 *  NAPOMENA: prva poruka ikada traži jednokratnu aktivaciju (klik na link u mailu). */
export async function sendBookingEmail(fields: Record<string, string>): Promise<void> {
  try {
    await fetch('https://formsubmit.co/ajax/grasaksalon@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: '🌱 Rezervacija sa sajta - Grašak',
        _template: 'table',
        _captcha: 'false',
        _replyto: fields['Telefon'] || '',
        ...fields,
      }),
    })
  } catch {
    /* mreža nije dostupna - WhatsApp dugme ostaje kao rezervni kanal */
  }
}
