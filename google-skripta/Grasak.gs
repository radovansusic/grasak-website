// Grašak - zakazivanje, vaučeri, admin panel i CRM. Sve u jednom fajlu: zalijepiti u Apps Script (Extensions > Apps Script).
// Izvor: Kod.gs + Podesavanja.gs + Api.gs + Osoblje.gs + Klijenti.gs

/**
 * Grašak - zakazivanje: Google Calendar + Sheets + SMS podsjetnici.
 *
 * Kako radi:
 * - Roditelji zakazuju na sajtu (grasaksalon.me/zakazi), osoblje u panelu (grasaksalon.me/panel).
 * - Svi termini su događaji u kalendaru salona; frizeri ga vide i u svom Google Calendar-u.
 * - Tabela "Termini" (Drive) je evidencija svih termina: iz nje se prave izvještaji.
 * - SMS potvrda za novi termin i SMS podsjetnik dan ranije.
 *
 * Termin u kalendaru: "Frizer - Usluga (Dijete)". Blokada: "Nikola - Pauza" / "Nikola - Odmor".
 * Lozinke za SMS idu SAMO u Project Settings > Script Properties, nikad u kod.
 */

const CFG = {
  SALON: 'Grasak',             // bez dijakritika - SMS ostaje 160 znakova
  TZ: 'Europe/Podgorica',      // vremenska zona salona, ne zavisi od podešavanja projekta
  TEL_SALONA: '069 371 111',   // rezervni broj; inače se koristi Telefon iz lista Lokacije
  KALENDAR_ID: 'primary',      // kalendar naloga grasaksalon@gmail.com (vlasnik: Kristina)
  DANA_UNAPRIJED: 30,
  SAT_PODSJETNIKA: 18,         // podsjetnik za sjutrašnje termine ide u 18h
  POZIVNI: '+382',
  SAJT: 'https://grasaksalon.me',             // link za otkazivanje u emailu i kalendaru roditelja
  EMAIL_IME: 'Grašak - dječiji frizerski salon',
};

const LIST_TERMINI = 'Termini';
const ZAGLAVLJE = ['ID', 'Datum', 'Vrijeme', 'Kraj', 'Lokacija', 'Frizer', 'Usluga', 'Dijete', 'Uzrast',
                   'Roditelj', 'Telefon', 'Napomena', 'Izvor', 'Status', 'Potvrda SMS', 'Podsjetnik SMS', 'Azurirano', 'Kartica', 'Email'];
const KOL = ZAGLAVLJE.reduce((o, k, i) => { o[k] = i; return o; }, {});   // indeks od 0
const STATUSI = ['zakazan', 'nije_dosao', 'otkazan'];

/* ---------- meni i postavljanje ---------- */

function onOpen() {
  try { tabela_(); } catch (e) { /* zapamti ID ove tabele za sajt i panel */ }
  SpreadsheetApp.getUi().createMenu('Grasak')
    .addItem('1. Postavi (i poslije svake nove verzije koda)', 'postavi')
    .addItem('Postavi sifru za panel', 'postaviSifruDijalog')
    .addItem('Provjeri podesavanja', 'provjeriPodesavanja')
    .addItem('Osvjezi termine sada', 'sinhronizuj')
    .addItem('Osvjezi klijente (CRM)', 'osvjeziKlijente')
    .addItem('Posalji izvjestaj za proslu sedmicu', 'posaljiSedmicniIzvjestaj')
    .addItem('Posalji probni SMS meni', 'probniSms')
    .addToUi();
}

function postavi() {
  kreirajListovePodesavanja_();
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(LIST_TERMINI);
  if (!sh) sh = ss.insertSheet(LIST_TERMINI);
  sh.getRange('A:S').setNumberFormat('@'); // tekst: datumi, vremena i +382 brojevi ostaju kako su upisani
  sh.getRange(1, 1, 1, ZAGLAVLJE.length).setValues([ZAGLAVLJE]).setFontWeight('bold').setBackground('#e7f5e4');
  sh.setFrozenRows(1);
  const ob = ss.getSheetByName(LIST_OBAVJESTENJA);
  if (ob) ob.getRange('A:J').setNumberFormat('@'); // datum i vrijeme ostaju tekst, ne postaju datum
  listKlijenata_();                                 // CRM list "Klijenti"

  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sinhronizuj').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('posaljiPodsjetnike').timeBased().everyDays(1).atHour(CFG.SAT_PODSJETNIKA).inTimezone(CFG.TZ).create();
  ScriptApp.newTrigger('posaljiSedmicniIzvjestaj').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).inTimezone(CFG.TZ).create();
  sinhronizuj();
}

/** Meni: ime + šifra -> upis u list Osoblje (kolona Šifra), uz provjeru da osoba može u panel. */
function postaviSifruDijalog() {
  const ui = SpreadsheetApp.getUi();
  const r1 = ui.prompt('Šifra za panel', 'Ime osobe (kako će se prijavljivati, npr. Kristina):', ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const ime = cistTekst(r1.getResponseText(), 40);
  if (!ime) return;
  const r2 = ui.prompt('Šifra za panel', 'Nova šifra za ' + ime + ' (najmanje 8 znakova):', ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  const sifra = r2.getResponseText().trim();
  const greska = provjeriSifru(sifra);
  if (greska) { ui.alert('Nije sačuvano: ' + greska + '.'); return; }

  const ss = tabela_();
  obrisiKes_();
  if (!ss.getSheetByName(LIST_OSOBLJE)) kreirajListovePodesavanja_();
  const sh = ss.getSheetByName(LIST_OSOBLJE);
  sh.getRange('D:D').setNumberFormat('@');
  const vrijednosti = sh.getDataRange().getValues();
  const i = vrijednosti.findIndex((r, k) => k > 0 && String(r[0]).trim().toLowerCase() === ime.toLowerCase());
  if (i > 0) {
    sh.getRange(i + 1, 4).setValue(sifra);
    sh.getRange(i + 1, 6).setValue('DA');
  } else {
    const r3 = ui.prompt('Nova osoba', ime + ' nije u listu Osoblje. Uloga (vlasnik, admin ili frizer):', ui.ButtonSet.OK_CANCEL);
    if (r3.getSelectedButton() !== ui.Button.OK) return;
    sh.appendRow([ime, r3.getResponseText().trim().toLowerCase() || 'frizer', '', sifra, '', 'DA']);
  }
  obrisiKes_();
  const os = ucitajOsoblje();
  const osoba = os.osoblje.find(x => x.ime.toLowerCase() === ime.toLowerCase());
  ui.alert(osoba
    ? 'Gotovo. ' + osoba.ime + ' (' + osoba.uloga + ') se prijavljuje na grasaksalon.me/panel imenom "' + osoba.ime + '" i ovom šifrom.'
    : 'Šifra je upisana, ali ' + ime + ' još ne može u panel:\n' + os.greske.join('\n'));
}

function kal_() {
  return CalendarApp.getCalendarById(CFG.KALENDAR_ID) || CalendarApp.getDefaultCalendar();
}

function sadaTekst_() {
  return Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd HH:mm');
}

/* ---------- kalendar -> tabela ---------- */

function lokPoFrizeru_() {
  const m = {};
  ucitajPodesavanja().lokacije.forEach(l => l.osobe.forEach(o => { m[o.toLowerCase()] = l; }));
  return m;
}

/** Red tabele za događaj; null ako događaj nije termin (npr. pauza ili privatni događaj). */
function redZaDogadjaj_(ev, lokPoFrizeru, tz) {
  const n = rastaviNaslov(ev.getTitle());
  if (!n || jeBlokada(n.usluga) || ev.isAllDayEvent()) return null;
  const opis = ev.getDescription();
  const lok = lokPoFrizeru[n.frizer.toLowerCase()] || {};
  const r = new Array(ZAGLAVLJE.length).fill('');
  r[KOL['ID']] = ev.getId();
  r[KOL['Datum']] = Utilities.formatDate(ev.getStartTime(), tz, 'yyyy-MM-dd');
  r[KOL['Vrijeme']] = Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm');
  r[KOL['Kraj']] = Utilities.formatDate(ev.getEndTime(), tz, 'HH:mm');
  r[KOL['Lokacija']] = lok.naziv || '';
  r[KOL['Frizer']] = n.frizer;
  r[KOL['Usluga']] = n.usluga;
  r[KOL['Dijete']] = n.klijent;
  r[KOL['Uzrast']] = poljeIzOpisa(opis, 'Uzrast');
  r[KOL['Roditelj']] = poljeIzOpisa(opis, 'Roditelj');
  r[KOL['Telefon']] = telefonZaTabelu(izvuciTelefon(poljeIzOpisa(opis, 'Telefon') || opis));
  r[KOL['Napomena']] = poljeIzOpisa(opis, 'Napomena');
  r[KOL['Izvor']] = poljeIzOpisa(opis, 'Izvor') || 'kalendar';
  r[KOL['Status']] = ev.getTag('status') || 'zakazan';
  r[KOL['Potvrda SMS']] = ev.getTag('potvrda') || '';
  r[KOL['Podsjetnik SMS']] = ev.getTag('podsjetnik') || '';
  r[KOL['Azurirano']] = sadaTekst_();
  r[KOL['Kartica']] = poljeIzOpisa(opis, 'Kartica') ? 'da' : '';   // kartica Veseli Grašak (15% popusta)
  r[KOL['Email']] = poljeIzOpisa(opis, 'Email');
  return r;
}

/** Upisuje ili osvježava jedan red po ID-u (poziva se pod LockService zaključavanjem). */
function upisiRed_(red) {
  const sh = tabela_().getSheetByName(LIST_TERMINI);
  const ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [];
  const i = ids.findIndex(x => x[0] === red[0]);
  if (i >= 0) sh.getRange(i + 2, 1, 1, red.length).setValues([red]);
  else sh.appendRow(red);
}

function upisiTermin_(ev) {
  const red = redZaDogadjaj_(ev, lokPoFrizeru_(), CFG.TZ);
  if (red) upisiRed_(red);
}

/** SMS potvrda za događaj koji je još nema (novi termin sa sajta, iz panela ili ručno iz kalendara). */
function potvrdiAkoTreba_(ev, lokPoFrizeru, tz) {
  if (ev.getTag('potvrda') || ev.getTag('status') === 'otkazan') return;
  const n = rastaviNaslov(ev.getTitle());
  if (!n || jeBlokada(n.usluga) || ev.getStartTime() < new Date()) return;
  const tel = izvuciTelefon(poljeIzOpisa(ev.getDescription(), 'Telefon') || ev.getDescription());
  if (!tel) return;
  const lok = lokPoFrizeru[n.frizer.toLowerCase()] || {};
  const ok = posaljiSms(tel, tekstPotvrde(Utilities.formatDate(ev.getStartTime(), tz, 'yyyy-MM-dd'),
    Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm'), n.frizer, lok.telefon));
  if (ok) ev.setTag('potvrda', 'poslat');
}

function sinhronizuj() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try { sinhronizujBezZakljucavanja_(); } finally { lock.releaseLock(); }
}

/** Kalendar od danas do +30 dana -> tabela, jednim upisom. Termini koji su nestali iz kalendara = otkazani. */
function sinhronizujBezZakljucavanja_() {
  const tz = CFG.TZ;
  const danas = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const od = Utilities.parseDate(danas + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const do_ = new Date(od.getTime() + (CFG.DANA_UNAPRIJED + 1) * 864e5);
  const lokPoFrizeru = lokPoFrizeru_();

  const sh = tabela_().getSheetByName(LIST_TERMINI);
  const sve = sh.getDataRange().getValues();
  const redovi = sve.slice(1).map(r => r.slice(0, ZAGLAVLJE.length).concat(new Array(Math.max(0, ZAGLAVLJE.length - r.length)).fill('')));
  const indeks = {};
  redovi.forEach((r, i) => { indeks[r[0]] = i; });
  const vidjeni = {};

  kal_().getEvents(od, do_).forEach(ev => {
    potvrdiAkoTreba_(ev, lokPoFrizeru, tz);
    const red = redZaDogadjaj_(ev, lokPoFrizeru, tz);
    if (!red) return;
    // termin upisan direktno u Google kalendar: obavještenje samo za svjež (ne za stare termine)
    if (!ev.getTag('obav')) {
      if (ev.getDateCreated() > new Date(Date.now() - 2 * 3600e3) && ev.getStartTime() > new Date()) {
        zapisiObavjestenje_('novi', red[KOL['Frizer']], red[KOL['Datum']], red[KOL['Vrijeme']], red[KOL['Usluga']], red[KOL['Dijete']], 'kalendar', '');
      }
      ev.setTag('obav', 'da');
    }
    vidjeni[red[0]] = true;
    if (red[0] in indeks) redovi[indeks[red[0]]] = red;
    else { indeks[red[0]] = redovi.length; redovi.push(red); }
  });

  redovi.forEach(r => {
    const d = datumTekst(r[KOL['Datum']], tz);
    if (!vidjeni[r[0]] && d >= danas && r[KOL['Status']] !== 'otkazan') {
      r[KOL['Status']] = 'otkazan';
      r[KOL['Azurirano']] = sadaTekst_();
      // obrisan direktno iz kalendara: obavještenje ako termin tek predstoji
      const v = vrijemeTekst(r[KOL['Vrijeme']], tz);
      if (Utilities.parseDate(d + ' ' + v, tz, 'yyyy-MM-dd HH:mm') > new Date()) {
        zapisiObavjestenje_('otkazan', r[KOL['Frizer']], d, v, r[KOL['Usluga']], r[KOL['Dijete']], 'kalendar', '');
      }
    }
  });

  if (redovi.length) sh.getRange(2, 1, redovi.length, ZAGLAVLJE.length).setValues(redovi);
  try { azurirajKlijente_(); } catch (e) { console.log('Klijenti nisu osvježeni: ' + e); }   // CRM iz svježe tabele
}

function datumTekst(v, tz) {
  return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || '');
}

function vrijemeTekst(v, tz) {
  return v instanceof Date ? Utilities.formatDate(v, tz, 'HH:mm') : String(v || '');
}

/* ---------- obavještenja u panelu ---------- */

const LIST_OBAVJESTENJA = 'Obavjestenja';
const ZAGLAVLJE_OBAV = ['Kad', 'Tip', 'Lokacija', 'Frizer', 'Datum', 'Vrijeme', 'Usluga', 'Dijete', 'Izvor', 'Ko'];
const MAX_OBAV = 1000;   // čuva se posljednjih 1000 obavještenja

/** Novi ili otkazan termin -> red u listu "Obavjestenja"; panel ga prikazuje pod zvoncem. */
function zapisiObavjestenje_(tip, frizer, datum, vrijeme, usluga, dijete, izvor, ko) {
  try {
    const ss = tabela_();
    let sh = ss.getSheetByName(LIST_OBAVJESTENJA);
    if (!sh) {
      sh = ss.insertSheet(LIST_OBAVJESTENJA);
      sh.getRange('A:J').setNumberFormat('@');
      sh.appendRow(ZAGLAVLJE_OBAV);
      sh.setFrozenRows(1);
    }
    const lok = lokPoFrizeru_()[String(frizer || '').toLowerCase()] || {};
    const zadnji = sh.getLastRow() > 1 ? Number(sh.getRange(sh.getLastRow(), 1).getValue()) || 0 : 0;
    const kad = Math.max(Date.now(), zadnji + 1); // jedinstveno i rastuće, panel pamti posljednje viđeno
    sh.appendRow([String(kad), tip, lok.naziv || '', frizer || '', datum || '', vrijeme || '', usluga || '', dijete || '', izvor || '', ko || '']);
    if (sh.getLastRow() > MAX_OBAV + 200) sh.deleteRows(2, sh.getLastRow() - 1 - MAX_OBAV);
  } catch (e) {
    console.log('Obavještenje nije zapisano: ' + e);
  }
}

/* ---------- podsjetnici ---------- */

function posaljiPodsjetnike() {
  const tz = CFG.TZ;
  const sjutraIso = dodajDane(Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'), 1);
  const sjutra = Utilities.parseDate(sjutraIso + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const prekosjutra = Utilities.parseDate(dodajDane(sjutraIso, 1) + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const lokPoFrizeru = lokPoFrizeru_();

  kal_().getEvents(sjutra, prekosjutra).forEach(ev => {
    const n = rastaviNaslov(ev.getTitle());
    if (!n || jeBlokada(n.usluga) || ev.getTag('status') === 'otkazan') return;
    const opis = ev.getDescription();
    // email podsjetnik (besplatno) - nezavisno od SMS-a
    if (poljeIzOpisa(opis, 'Email') && !ev.getTag('podsjetnik_email') && posaljiEmailTermina_(ev, 'podsjetnik')) ev.setTag('podsjetnik_email', 'poslat');
    if (ev.getTag('podsjetnik')) return;
    const tel = izvuciTelefon(poljeIzOpisa(opis, 'Telefon') || opis);
    if (!tel) return;
    const vrijeme = Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm');
    const lok = lokPoFrizeru[n.frizer.toLowerCase()] || {};
    if (posaljiSms(tel, tekstPodsjetnika(vrijeme, n.frizer, lok.telefon))) ev.setTag('podsjetnik', 'poslat');
  });
  sinhronizuj();
}

/* ---------- email roditelju: potvrda, podsjetnik, pomjeranje, otkazivanje ---------- */

const DANI_PUNI_ = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];

/** Kod za otkazivanje preko linka: 8 znakova, bez zbunjujućih (0/O, 1/I). */
function napraviKod_() {
  const znaci = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += znaci.charAt(Math.floor(Math.random() * znaci.length));
  return s;
}

function jeEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || ''));
}

/** Link kojim roditelj sam otkazuje termin (sajt > zakazi?otkazi=ID&kod=KOD). */
function linkOtkazivanja_(ev) {
  const kod = poljeIzOpisa(ev.getDescription(), 'Kod');
  return kod ? CFG.SAJT + '/zakazi?otkazi=' + encodeURIComponent(ev.getId()) + '&kod=' + kod : '';
}

function datumRijecima_(d, tz) {
  const dan = Number(Utilities.formatDate(d, tz, 'u')) % 7;
  return DANI_PUNI_[dan] + ', ' + Utilities.formatDate(d, tz, 'dd.MM.yyyy.') + ' u ' + Utilities.formatDate(d, tz, 'HH:mm');
}

function icsTekst_(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
}

function icsDatum_(d) {
  return Utilities.formatDate(d, 'UTC', 'yyyyMMdd') + 'T' + Utilities.formatDate(d, 'UTC', 'HHmmss') + 'Z';
}

/** Termin kao .ics fajl (prilog emaila): roditelj ga otvori i dobije podsjetnik u svom kalendaru. */
function icsZaTermin_(ev, lok) {
  const n = rastaviNaslov(ev.getTitle()) || { frizer: '', usluga: '', klijent: '' };
  const link = linkOtkazivanja_(ev);
  const mjesto = [lok.naziv, lok.adresa].filter(Boolean).join(', ');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grasak//Zakazivanje//SR', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:' + ev.getId(), 'DTSTAMP:' + icsDatum_(new Date()), 'DTSTART:' + icsDatum_(ev.getStartTime()), 'DTEND:' + icsDatum_(ev.getEndTime()),
    'SUMMARY:' + icsTekst_('Grašak: ' + n.usluga + (n.klijent ? ' (' + n.klijent + ')' : '')),
    'LOCATION:' + icsTekst_(mjesto),
    'DESCRIPTION:' + icsTekst_('Frizer: ' + n.frizer + (link ? '\nOtkazivanje: ' + link : '') + '\nSalon: ' + (lok.telefon || CFG.TEL_SALONA)),
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Sjutra termin u Grašku', 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Za 2 sata termin u Grašku', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

/**
 * Email roditelju sa naloga salona. vrsta: potvrda | podsjetnik | pomjeren | otkazan | otkazan_roditelj.
 * Vraća true ako je poslato. Nikad ne ruši upis termina: greška ide samo u log.
 */
function posaljiEmailTermina_(ev, vrsta) {
  try {
    const opis = ev.getDescription();
    const email = poljeIzOpisa(opis, 'Email');
    if (!jeEmail(email)) return false;
    const n = rastaviNaslov(ev.getTitle()) || { frizer: '', usluga: '', klijent: '' };
    const lok = lokPoFrizeru_()[n.frizer.toLowerCase()] || {};
    const tz = CFG.TZ;
    const kad = datumRijecima_(ev.getStartTime(), tz);
    const kratko = Utilities.formatDate(ev.getStartTime(), tz, 'dd.MM.') + ' u ' + Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm');
    const tel = lok.telefon || CFG.TEL_SALONA;
    const roditelj = poljeIzOpisa(opis, 'Roditelj');
    const link = linkOtkazivanja_(ev);
    const pozdrav = 'Poštovani ' + (roditelj || 'roditelju') + ',\n\n';
    const detalji = 'Dijete: ' + n.klijent + '\nUsluga: ' + n.usluga + '\nKad: ' + kad + '\nFrizer: ' + n.frizer +
      '\nGdje: ' + [lok.naziv, lok.adresa].filter(Boolean).join(', ') + '\n\n';
    const otkaz = (link ? 'Ako ne možete doći, otkažite na vrijeme: ' + link + '\nili pozovite ' : 'Ako ne možete doći, pozovite ') + tel + '.\n\n';
    const kraj = 'Vidimo se u Grašku!\n' + CFG.SAJT;
    let naslov, tijelo, prilog = null;
    if (vrsta === 'potvrda') {
      naslov = 'Grašak: termin ' + kratko;
      tijelo = pozdrav + 'termin je zakazan.\n\n' + detalji + otkaz + 'U prilogu je termin za vaš kalendar: otvorite ga i telefon će vas podsjetiti.\n\n' + kraj;
      prilog = icsZaTermin_(ev, lok);
    } else if (vrsta === 'podsjetnik') {
      naslov = 'Grašak: podsjetnik, sjutra u ' + Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm');
      tijelo = pozdrav + 'podsjećamo na sjutrašnji termin.\n\n' + detalji + otkaz + kraj;
    } else if (vrsta === 'pomjeren') {
      naslov = 'Grašak: termin je pomjeren na ' + kratko;
      tijelo = pozdrav + 'termin je pomjeren. Novi termin:\n\n' + detalji + otkaz + 'U prilogu je novi termin za vaš kalendar.\n\n' + kraj;
      prilog = icsZaTermin_(ev, lok);
    } else if (vrsta === 'otkazan') {
      naslov = 'Grašak: termin ' + kratko + ' je otkazan';
      tijelo = pozdrav + 'termin ' + kad + ' (' + n.klijent + ', ' + n.usluga + ') je otkazan.\n\nNovi termin: ' + CFG.SAJT + '/zakazi ili ' + tel + '.\n\n' + kraj;
    } else {
      naslov = 'Grašak: termin ' + kratko + ' je otkazan na vaš zahtjev';
      tijelo = pozdrav + 'otkazali ste termin ' + kad + ' (' + n.klijent + ', ' + n.usluga + ').\n\nNovi termin: ' + CFG.SAJT + '/zakazi ili ' + tel + '.\n\n' + kraj;
    }
    const poruka = { to: email, subject: naslov, body: tijelo, name: CFG.EMAIL_IME };
    if (prilog) poruka.attachments = [Utilities.newBlob(prilog, 'text/calendar', 'grasak-termin.ics')];
    MailApp.sendEmail(poruka);
    return true;
  } catch (e) {
    console.log('Email nije poslat: ' + e);
    return false;
  }
}

/* ---------- SMS ---------- */

/**
 * Šalje SMS preko Android telefona salona (aplikacija "SMS Gateway for Android", sms-gate.app, Cloud server).
 * Script Properties (Project Settings > Script Properties): SMS_USER i SMS_PASS iz aplikacije.
 * SMS_URL nije obavezan. Bez SMS_USER/SMS_PASS radi probni režim (samo log, ništa se ne šalje).
 */
let ZADNJA_SMS_GRESKA = '';

function posaljiSms(tel, tekst) {
  const p = PropertiesService.getScriptProperties();
  const user = p.getProperty('SMS_USER'), pass = p.getProperty('SMS_PASS');
  if (!user || !pass) {
    ZADNJA_SMS_GRESKA = 'SMS nije uključen (nema SMS_USER i SMS_PASS u Script Properties).';
    console.log('PROBNI REZIM, SMS nije poslat: ' + tel + ' | ' + tekst);
    return false;
  }
  const url = (p.getProperty('SMS_URL') || 'https://api.sms-gate.app/3rdparty/v1/messages').trim();
  const stari = url.replace(/\/messages$/, '/message');
  // novi format API-ja, pa stari (starije verzije servera)
  const pokusaji = [[url, { textMessage: { text: tekst }, phoneNumbers: [tel] }], [url, { message: tekst, phoneNumbers: [tel] }]];
  if (stari !== url) pokusaji.push([stari, { message: tekst, phoneNumbers: [tel] }]);
  for (let i = 0; i < pokusaji.length; i++) {
    try {
      const odg = UrlFetchApp.fetch(pokusaji[i][0], {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Basic ' + Utilities.base64Encode(user + ':' + pass) },
        payload: JSON.stringify(pokusaji[i][1]),
        muteHttpExceptions: true,
      });
      const kod = odg.getResponseCode();
      if (kod < 300) { ZADNJA_SMS_GRESKA = ''; return true; }
      ZADNJA_SMS_GRESKA = 'SMS server odgovorio ' + kod + ': ' + odg.getContentText().slice(0, 200);
      console.log(ZADNJA_SMS_GRESKA);
      if (kod === 401 || kod === 403) {
        ZADNJA_SMS_GRESKA = 'Pogrešan SMS_USER ili SMS_PASS (prepišite ih iz aplikacije na telefonu).';
        return false;
      }
    } catch (e) {
      ZADNJA_SMS_GRESKA = 'SMS greška: ' + e;
      console.log(ZADNJA_SMS_GRESKA);
    }
  }
  return false;
}

function probniSms() {
  const ui = SpreadsheetApp.getUi();
  const tel = ui.prompt('Probni SMS', 'Upišite svoj broj telefona (npr. 069 123 456):', ui.ButtonSet.OK_CANCEL);
  if (tel.getSelectedButton() !== ui.Button.OK) return;
  const ok = posaljiSms(normalizujTelefon(tel.getResponseText()), CFG.SALON + ': probna poruka. SMS sistem radi.');
  ui.alert(ok ? 'Poslato. Poruka stiže za par sekundi (telefon salona mora biti uključen i na internetu).'
    : 'Nije poslato. ' + ZADNJA_SMS_GRESKA);
}

/* ---------- čiste funkcije (testirane) ---------- */

function tekstPotvrde(datum, vrijeme, frizer, tel) {
  const [g, m, d] = String(datum).split('-');
  return CFG.SALON + ': termin potvrdjen ' + d + '.' + m + '. u ' + vrijeme + ', frizer ' +
    bezDijakritika(frizer) + '. Otkazivanje: ' + (tel || CFG.TEL_SALONA);
}

function tekstPodsjetnika(vrijeme, frizer, tel) {
  return CFG.SALON + ': podsjetnik - sjutra u ' + vrijeme + ' kod ' + bezDijakritika(frizer) +
    '. Radujemo se! Otkazivanje: ' + (tel || CFG.TEL_SALONA);
}

/**
 * Tekst koji upisuje korisnik: jedan red, bez zagrada (osim ako su dozvoljene),
 * bez znakova na početku koji bi u tabeli postali formula (= + - @).
 */
function cistTekst(v, n, saZagradama) {
  return String(v == null ? '' : v).replace(saZagradama ? /[\r\n\t]/g : /[()\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ').trim().replace(/^[=+\-@\s]+/, '').slice(0, n);
}

/** "Nikola - Šišanje (Ana Petrović)" -> {frizer, usluga, klijent} */
function rastaviNaslov(naslov) {
  const m = String(naslov || '').match(/^\s*([^-()]+?)\s+-\s+([^()]+?)\s*(?:\((.*)\))?\s*$/);
  if (!m) return null;
  return { frizer: m[1], usluga: m[2], klijent: m[3] || '' };
}

/** Događaj koji zauzima vrijeme frizera, ali nije termin: "Nikola - Pauza", "Nikola - Odmor"... */
function jeBlokada(usluga) {
  return /^(pauza|odmor|bolovanje|slobodan|blokirano|zatvoreno|godišnji|godisnji|ne radi)/i.test(String(usluga || '').trim());
}

/** "Roditelj: Ana Petrović" iz opisa događaja -> "Ana Petrović" ("-" -> prazno) */
function poljeIzOpisa(opis, kljuc) {
  const m = String(opis || '').match(new RegExp('^' + kljuc + ':[ \\t]*(.*)$', 'mi'));
  const v = m ? m[1].trim() : '';
  return v === '-' ? '' : v;
}

/** Postavlja (ili dodaje) red "Kljuc: vrijednost" u opisu događaja. */
function postaviPoljeUOpisu(opis, kljuc, vrijednost) {
  const linija = kljuc + ': ' + (vrijednost || '-');
  const re = new RegExp('^' + kljuc + ':.*$', 'mi');
  const s = String(opis || '');
  return re.test(s) ? s.replace(re, linija) : (s ? s.replace(/\s*$/, '') + '\n' : '') + linija;
}

/** Pronalazi prvi broj telefona u tekstu i vraća ga u formatu +382... */
function izvuciTelefon(opis) {
  const m = String(opis || '').match(/(\+|00)?\d[\d\s\/().-]{6,}\d/);
  return m ? normalizujTelefon(m[0]) : '';
}

/** Tabela bi "+382..." pretvorila u broj i skinula "+": apostrof na početku je čuva kao tekst (ne vidi se). */
function telefonZaTabelu(tel) {
  return tel ? "'" + tel : '';
}

/** Broj iz tabele: i stari zapisi bez "+" (38269...) vraćaju se u oblik +38269... */
function telefonIzTabele(v) {
  const s = String(v == null ? '' : v).trim().replace(/^'/, '');
  if (!s) return '';
  if (/^382\d{7,9}$/.test(s)) return '+' + s;
  return normalizujTelefon(s);
}

/** "067 338 777" -> +38267338777 (CG); "+49..." i "0049..." ostaju strani; "38267338777" -> +38267338777. */
function normalizujTelefon(s) {
  let t = String(s || '').replace(/[^\d+]/g, '');
  if (!t) return '';
  if (t.startsWith('00')) t = '+' + t.slice(2);
  else if (t.startsWith('0')) t = CFG.POZIVNI + t.slice(1);
  else if (!t.startsWith('+')) t = (new RegExp('^' + CFG.POZIVNI.slice(1) + '\\d{6,9}$').test(t) ? '+' : CFG.POZIVNI) + t;
  return t;
}

function bezDijakritika(s) {
  const mapa = { 'č': 'c', 'ć': 'c', 'š': 's', 'ž': 'z', 'đ': 'dj',
                 'Č': 'C', 'Ć': 'C', 'Š': 'S', 'Ž': 'Z', 'Đ': 'Dj' };
  return String(s).replace(/[čćšžđČĆŠŽĐ]/g, c => mapa[c]);
}

/**
 * Grašak - podešavanja koja Kristina (vlasnik, grasaksalon@gmail.com) mijenja u tabeli, bez koda.
 *
 * List "Lokacije": Lokacija | Adresa | Telefon | Pon | Uto | Sri | Čet | Pet | Sub | Ned
 *   radno vrijeme se piše kratko: 9-19, 9:30-14, ili "ne radi"
 * List "Frizeri":  Frizer | Lokacija | Aktivan (DA/NE)
 * List "Usluge":   Usluga | Trajanje (min) | Aktivna (DA/NE)
 * List "Praznici": Praznik | Datum (dan.mjesec.) | Dana | Neradni (DA/NE) - svake godine; unaprijed upisani državni praznici CG
 * List "Neradni dani": Datum | Razlog | Lokacija (prazno = sve) - dani koje vlasnik proglasi neradnim
 * List "Osoblje":  Ime | Uloga (vlasnik/admin/frizer) | Lokacija (prazno = sve) | Šifra | Email | Aktivan
 *   Prijava u panel grasaksalon.me/panel: ime + šifra (najmanje 8 znakova, slova i brojevi).
 *
 * Nova lokacija = novi red u "Lokacije". Novi frizer = novi red u "Frizeri".
 * Promjena se vidi u aplikaciji odmah, bez ponovnog objavljivanja.
 */

const LIST_LOK = 'Lokacije', LIST_FRIZ = 'Frizeri', LIST_USL = 'Usluge';
const LIST_VAUCERI = 'Vauceri';
const LIST_OSOBLJE = 'Osoblje';
const LIST_PRAZNICI = 'Praznici', LIST_NERADNI = 'Neradni dani';
// Zakon o državnim i drugim praznicima (CG): državni praznici se praznuju dva dana.
// Ako dan praznika padne u nedjelju, neradan je i prvi naredni dan (prvi dan u nedjelju -> dva naredna dana).
const ZAKONSKI_PRAZNICI = [
  ['Nova godina', '01.01.', 2, 'DA'],
  ['Praznik rada', '01.05.', 2, 'DA'],
  ['Dan nezavisnosti', '21.05.', 2, 'DA'],
  ['Dan državnosti', '13.07.', 2, 'DA'],
  ['Njegošev dan', '13.11.', 2, 'DA'],
];
const ULOGE = ['vlasnik', 'admin', 'frizer'];
const ZAGLAVLJE_VAUCERI = ['Datum', 'Vaucer', 'Dijete', 'Kupac', 'Telefon', 'Napomena', 'Status'];

/**
 * Tabela salona. Iz same tabele (meni, onOpen) važi tabela u kojoj je skripta i njen ID se pamti;
 * web aplikacija (sajt, panel) koristi zapamćeni ID. Tako sajt i meni uvijek čitaju istu tabelu.
 */
function tabela_() {
  const props = PropertiesService.getScriptProperties();
  let aktivna = null;
  try { aktivna = SpreadsheetApp.getActive(); } catch (e) { aktivna = null; }
  if (aktivna) {
    if (props.getProperty('SHEET_ID') !== aktivna.getId()) props.setProperty('SHEET_ID', aktivna.getId());
    return aktivna;
  }
  const id = props.getProperty('SHEET_ID');
  if (!id) throw new Error('Skripta još nije povezana s tabelom: u tabeli pokrenite meni Grasak > 1. Postavi.');
  return SpreadsheetApp.openById(id);
}

function kreirajListovePodesavanja_() {
  obrisiKes_();
  const ss = SpreadsheetApp.getActive();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  const primjeri = {
    [LIST_LOK]: [['Lokacija', 'Adresa', 'Telefon', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'],
                 ['Grašak Podgorica', 'Branka Deletića bb, Lamela A, New City', '069 371 111',
                  'ne radi', '15-21', '15-21', '15-21', '15-21', '11-21', '11-21']],
    [LIST_FRIZ]: [['Frizer', 'Lokacija', 'Aktivan'],
                  ['Nikola', 'Grašak Podgorica', 'DA']],
    [LIST_USL]: [['Usluga', 'Trajanje (min)', 'Aktivna'],
                 ['Šišanje', 30, 'DA'], ['Prvo šišanje + diploma', 30, 'DA'], ['Svečana frizura', 60, 'DA']],
    [LIST_VAUCERI]: [ZAGLAVLJE_VAUCERI],
    [LIST_PRAZNICI]: [['Praznik', 'Datum (dan.mjesec.)', 'Dana', 'Neradni']].concat(ZAKONSKI_PRAZNICI),
    [LIST_NERADNI]: [['Datum', 'Razlog', 'Lokacija']],
    [LIST_OSOBLJE]: [['Ime', 'Uloga', 'Lokacija', 'Šifra', 'Email', 'Aktivan'],
                     ['Kristina', 'vlasnik', '', 'UPISATI ŠIFRU', 'grasaksalon@gmail.com', 'DA'],
                     ['Nikola', 'frizer', 'Grašak Podgorica', 'UPISATI ŠIFRU', '', 'DA']],
  };
  Object.keys(primjeri).forEach(ime => {
    if (ss.getSheetByName(ime)) return; // postojeće podešavanje se ne dira
    const sh = ss.insertSheet(ime);
    const v = primjeri[ime];
    // obični tekst: inače Sheets "9-19" pretvori u datum, a telefonu obriše nulu
    if (ime === LIST_LOK) sh.getRange('C:J').setNumberFormat('@');
    if (ime === LIST_OSOBLJE) sh.getRange('D:D').setNumberFormat('@');
    if (ime === LIST_VAUCERI) sh.getRange('A:G').setNumberFormat('@');
    if (ime === LIST_PRAZNICI) sh.getRange('B:B').setNumberFormat('@');
    if (ime === LIST_NERADNI) sh.getRange('A:A').setNumberFormat('@');
    sh.getRange(1, 1, v.length, v[0].length).setValues(v);
    sh.getRange(1, 1, 1, v[0].length).setFontWeight('bold').setBackground('#e7f5e4');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, v[0].length);
  });
}

/* ---------- keš podešavanja (brži sajt i panel) ---------- */

const KES_KLJUCEVI = ['pod_podesavanja', 'pod_neradni', 'pod_osoblje'];
const KES_SEKUNDI = 600;
let MEMO_ = {};

/** Vrijednost iz memorije ovog poziva ili iz keša (10 min); inače se čita tabela. */
function kesiraj_(kljuc, fn) {
  if (MEMO_[kljuc]) return MEMO_[kljuc];
  const c = CacheService.getScriptCache();
  const s = c.get(kljuc);
  if (s) { try { return (MEMO_[kljuc] = JSON.parse(s)); } catch (e) { /* oštećen keš */ } }
  const v = fn();
  try { c.put(kljuc, JSON.stringify(v), KES_SEKUNDI); } catch (e) { /* prevelik za keš */ }
  return (MEMO_[kljuc] = v);
}

/** Poslije svake izmjene podešavanja (panel, meni ili ručno u tabeli). */
function obrisiKes_() {
  MEMO_ = {};
  try { CacheService.getScriptCache().removeAll(KES_KLJUCEVI); } catch (e) { /* nema keša */ }
}

/** Ručna izmjena listova s podešavanjima briše keš, pa sajt odmah vidi promjenu. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet(), ime = sh.getName();
    if ([LIST_LOK, LIST_FRIZ, LIST_USL, LIST_OSOBLJE, LIST_PRAZNICI, LIST_NERADNI].indexOf(ime) >= 0) obrisiKes_();
    // telefon ukucan rukom: "067 338 777" -> +38267338777 (list Klijenti kolona A, list Termini kolona Telefon)
    const kolona = ime === LIST_KLIJENTI ? 1 : ime === LIST_TERMINI ? KOL['Telefon'] + 1 : 0;
    if (kolona && e.range.getRow() > 1 && e.range.getColumn() <= kolona && e.range.getLastColumn() >= kolona) {
      normalizujTelefoneUKoloni_(sh, kolona, e.range.getRow(), e.range.getNumRows());
    }
  } catch (err) { /* ništa */ }
}

function ucitajPodesavanja() {
  return kesiraj_('pod_podesavanja', () => {
    const ss = tabela_();
    const citaj = ime => { const sh = ss.getSheetByName(ime); return sh ? sh.getDataRange().getValues().slice(1) : []; };
    return sastaviPodesavanja(citaj(LIST_LOK), citaj(LIST_FRIZ), citaj(LIST_USL));
  });
}

/** Praznici i posebni neradni dani; bez lista "Praznici" važe zakonski. */
function ucitajNeradne(lokacije) {
  return kesiraj_('pod_neradni', () => {
    const ss = tabela_();
    const pr = ss.getSheetByName(LIST_PRAZNICI), nr = ss.getSheetByName(LIST_NERADNI);
    return sastaviNeradne(pr ? pr.getDataRange().getValues().slice(1) : ZAKONSKI_PRAZNICI,
      nr ? nr.getDataRange().getValues().slice(1) : [], lokacije || ucitajPodesavanja().lokacije);
  });
}

function ucitajOsoblje(lokacije) {
  return kesiraj_('pod_osoblje', () => {
    const sh = tabela_().getSheetByName(LIST_OSOBLJE);
    return sastaviOsoblje(sh ? sh.getDataRange().getValues().slice(1) : [], lokacije || ucitajPodesavanja().lokacije);
  });
}

/** Meni: Kristina provjeri da li je sve ispravno upisano. */
function provjeriPodesavanja() {
  obrisiKes_();
  const naziv = tabela_().getName();
  const p = ucitajPodesavanja();
  const os = ucitajOsoblje(p.lokacije);
  const nr = ucitajNeradne(p.lokacije);
  p.greske = p.greske.concat(os.greske, nr.greske);
  const dani = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];
  const linije = p.lokacije.map(l => '• ' + l.naziv + ': ' + (l.osobe.join(', ') || 'NEMA FRIZERA') + ' | ' +
    [1, 2, 3, 4, 5, 6, 0].map(d => dani[d] + ' ' + (l.radno[d] ? l.radno[d].join('-') : 'ne radi')).join(', '));
  linije.push('', 'Usluge: ' + p.usluge.map(u => u.naziv + ' ' + u.trajanje + ' min').join(', '));
  linije.push('', 'Osoblje (panel grasaksalon.me/panel): ' + (os.osoblje.map(o => o.ime + ' - ' + o.uloga +
    (o.lokacijaId ? ', ' + o.lokacijaNaziv : ', sve lokacije')).join('; ') || 'NIKO'));
  if (os.bezPina.length) linije.push('Bez šifre (ne mogu u panel): ' + os.bezPina.join(', '));
  const danas = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
  const lok0 = p.lokacije[0] ? p.lokacije[0].naziv : '';
  const sl = neradniUPeriodu(danas, dodajDane(danas, 365), nr.praznici, nr.posebni, lok0);
  linije.push('', 'Neradni dani u narednih godinu dana: ' +
    (Object.keys(sl).sort().map(d => d.slice(8, 10) + '.' + d.slice(5, 7) + '. ' + sl[d]).join(', ') || 'nema'));
  if (p.greske.length) linije.push('', 'ISPRAVITI:', ...p.greske.map(g => '• ' + g));
  linije.unshift('Tabela koju koriste sajt i panel: ' + naziv, '');
  SpreadsheetApp.getUi().alert(p.greske.length ? 'Podešavanja - ima grešaka' : 'Podešavanja su ispravna', linije.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
}

/* ---------- čiste funkcije (testirane) ---------- */

function sastaviPodesavanja(lokRedovi, frizRedovi, uslRedovi) {
  const greske = [];
  const da = v => String(v).trim().toUpperCase() !== 'NE';
  const lokacije = [];
  lokRedovi.forEach((r, i) => {
    const naziv = String(r[0] || '').trim();
    if (!naziv) return;
    const radno = {};
    // kolone D..J = Pon..Ned; getDay(): 0 = nedjelja
    ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].forEach((kol, k) => {
      const v = r[3 + k];
      const rv = parsirajRadno(v);
      if (rv === undefined) greske.push('Lokacije, red ' + (i + 2) + ', ' + kol + ': "' + v + '" - piši npr. 15-21 ili "ne radi"');
      radno[(k + 1) % 7] = rv || null;
    });
    lokacije.push({ id: napraviId(naziv), naziv: naziv, adresa: String(r[1] || '').trim(),
                    telefon: String(r[2] || '').trim(), radno: radno, osobe: [] });
  });
  frizRedovi.forEach((r, i) => {
    const ime = String(r[0] || '').trim();
    if (!ime || !da(r[2])) return;
    const lok = lokacije.find(l => l.id === napraviId(r[1]));
    if (!lok) { greske.push('Frizeri, red ' + (i + 2) + ': lokacija "' + r[1] + '" ne postoji u listu Lokacije'); return; }
    if (lokacije.some(l => l.osobe.indexOf(ime) >= 0)) { greske.push('Frizeri, red ' + (i + 2) + ': ' + ime + ' je već upisan - imena moraju biti različita'); return; }
    lok.osobe.push(ime);
  });
  const usluge = [];
  uslRedovi.forEach((r, i) => {
    const naziv = String(r[0] || '').trim();
    if (!naziv || !da(r[2])) return;
    const t = Number(r[1]);
    if (!(t >= 30 && t % 30 === 0)) { greske.push('Usluge, red ' + (i + 2) + ': trajanje mora biti 30, 60, 90...'); return; }
    usluge.push({ id: napraviId(naziv), naziv: naziv, trajanje: t });
  });
  return { lokacije: lokacije, usluge: usluge, greske: greske };
}

/** Osoblje za panel. Uloge: vlasnik (sve + izvještaji), admin (sve + izvještaji), frizer (dan i upis termina). */
function sastaviOsoblje(redovi, lokacije) {
  const greske = [], osoblje = [], imena = {}, bezPina = [];
  redovi.forEach((r, i) => {
    const ime = String(r[0] || '').trim();
    if (!ime || String(r[5]).trim().toUpperCase() === 'NE') return;
    const red = 'Osoblje, red ' + (i + 2) + ' (' + ime + '): ';
    const uloga = String(r[1] || '').trim().toLowerCase();
    if (ULOGE.indexOf(uloga) < 0) { greske.push(red + 'uloga mora biti vlasnik, admin ili frizer'); return; }
    let lokacijaId = '', lokacijaNaziv = '';
    if (String(r[2] || '').trim() && uloga !== 'vlasnik') {
      const l = lokacije.find(x => x.id === napraviId(r[2]));
      if (!l) { greske.push(red + 'lokacija "' + r[2] + '" ne postoji u listu Lokacije'); return; }
      lokacijaId = l.id; lokacijaNaziv = l.naziv;
    }
    const sifra = String(r[3] == null ? '' : r[3]).trim();
    if (!sifra || /^UPISATI/i.test(sifra)) { bezPina.push(ime); return; } // nema šifru: nema pristup panelu
    const greskaSifre = provjeriSifru(sifra);
    if (greskaSifre) { greske.push(red + greskaSifre); return; }
    const kljuc = ime.toLowerCase();
    if (imena[kljuc]) { greske.push(red + 'isto ime kao u redu ' + imena[kljuc] + ' - za prijavu imena moraju biti različita'); return; }
    imena[kljuc] = i + 2;
    osoblje.push({ ime: ime, uloga: uloga, lokacijaId: lokacijaId, lokacijaNaziv: lokacijaNaziv, sifra: sifra,
                   email: String(r[4] || '').trim() });
  });
  return { osoblje: osoblje, greske: greske, bezPina: bezPina };
}

/** Redovi listova Praznici i Neradni dani -> provjereni podaci. */
function sastaviNeradne(prazniciRedovi, posebniRedovi, lokacije) {
  const greske = [], praznici = [], posebni = [];
  prazniciRedovi.forEach((r, i) => {
    const naziv = String(r[0] || '').trim();
    if (!naziv) return;
    const dm = parsirajDanMjesec(r[1]);
    if (!dm) { greske.push('Praznici, red ' + (i + 2) + ' (' + naziv + '): datum piši kao 13.07.'); return; }
    const dana = Number(r[2]) === 2 ? 2 : 1;
    praznici.push({ naziv: naziv, dan: dm[0], mjesec: dm[1], dana: dana, neradni: String(r[3]).trim().toUpperCase() !== 'NE' });
  });
  posebniRedovi.forEach((r, i) => {
    const v = r[0];
    if (v === '' || v == null) return;
    const datum = parsirajDatum(v);
    if (!datum) { greske.push('Neradni dani, red ' + (i + 2) + ': datum "' + v + '" piši kao 24.12.2026'); return; }
    let lokacija = String(r[2] || '').trim();
    if (lokacija) {
      const l = lokacije.find(x => x.id === napraviId(lokacija));
      if (!l) { greske.push('Neradni dani, red ' + (i + 2) + ': lokacija "' + lokacija + '" ne postoji'); return; }
      lokacija = l.naziv;
    }
    posebni.push({ datum: datum, razlog: String(r[1] || '').trim() || 'Neradni dan', lokacija: lokacija });
  });
  return { praznici: praznici, posebni: posebni, greske: greske };
}

/** "13.07." / "13.7" -> ['13','07'] */
function parsirajDanMjesec(v) {
  if (v instanceof Date) return [Utilities.formatDate(v, CFG.TZ, 'dd'), Utilities.formatDate(v, CFG.TZ, 'MM')];
  const m = String(v == null ? '' : v).trim().match(/^(\d{1,2})\.\s*(\d{1,2})\.?$/);
  if (!m) return null;
  const d = Number(m[1]), mj = Number(m[2]);
  if (mj < 1 || mj > 12 || d < 1 || d > 31) return null;
  return [String(d).padStart(2, '0'), String(mj).padStart(2, '0')];
}

/** "24.12.2026" / "2026-12-24" / Date -> "2026-12-24" */
function parsirajDatum(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CFG.TZ, 'yyyy-MM-dd');
  const s = String(v).trim();
  let g, mj, d, m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) { g = +m[1]; mj = +m[2]; d = +m[3]; } else {
    m = s.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/);
    if (!m) return null;
    g = +m[3]; mj = +m[2]; d = +m[1];
  }
  const x = new Date(Date.UTC(g, mj - 1, d));
  if (x.getUTCFullYear() !== g || x.getUTCMonth() !== mj - 1 || x.getUTCDate() !== d) return null; // npr. 31.02.
  return g + '-' + String(mj).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

/**
 * Neradni dani u periodu za lokaciju: { 'yyyy-MM-dd': 'naziv' }.
 * Praznik u nedjelju: neradan je i prvi dan poslije praznika (zakon CG).
 */
function neradniUPeriodu(od, do_, praznici, posebni, lokNaziv) {
  const rez = {};
  const g1 = Number(od.slice(0, 4)), g2 = Number(do_.slice(0, 4));
  praznici.forEach(p => {
    if (!p.neradni) return;
    for (let g = g1 - 1; g <= g2; g++) {
      const prvi = g + '-' + p.mjesec + '-' + p.dan;
      const dani = [];
      for (let i = 0; i < p.dana; i++) dani.push(dodajDane(prvi, i));
      if (dani.some(d => danUSedmici(d) === 0)) dani.push(dodajDane(dani[dani.length - 1], 1));
      dani.forEach((d, i) => {
        if (d >= od && d <= do_ && !rez[d]) rez[d] = p.naziv + (i >= p.dana ? ' (prenesen)' : '');
      });
    }
  });
  posebni.forEach(x => {
    if ((!x.lokacija || x.lokacija === lokNaziv) && x.datum >= od && x.datum <= do_) rez[x.datum] = x.razlog;
  });
  return rez;
}

/** Pravila za šifru panela; vraća opis greške ili '' kad je ispravna. */
function provjeriSifru(s) {
  if (s.length < 8) return 'šifra mora imati najmanje 8 znakova';
  if (s.length > 40) return 'šifra može imati najviše 40 znakova';
  if (/^[=+\-@]/.test(s)) return 'šifra ne smije počinjati znakom = + - @';
  return '';
}

/** "9-19" -> ['09:00','19:00']; "ne radi"/prazno -> null; neispravno -> undefined */
function parsirajRadno(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  if (!s || s === 'ne radi' || s === 'ne' || s === 'zatvoreno' || s === '-') return null;
  const m = s.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*[-–]\s*(\d{1,2})(?:[:.](\d{2}))?$/);
  if (!m) return undefined;
  const od = Number(m[1]) * 60 + Number(m[2] || 0), do_ = Number(m[3]) * 60 + Number(m[4] || 0);
  if (od >= do_ || do_ > 24 * 60 || (m[2] && Number(m[2]) > 59) || (m[4] && Number(m[4]) > 59)) return undefined;
  const f = x => String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
  return [f(od), f(do_)];
}

function napraviId(naziv) {
  const mapa = { 'č': 'c', 'ć': 'c', 'š': 's', 'ž': 'z', 'đ': 'dj' };
  return String(naziv || '').trim().toLowerCase().replace(/[čćšžđ]/g, c => mapa[c])
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Grašak - API za aplikaciju (Apps Script web app).
 * Radi u ISTOM projektu kao Kod.gs: koristi rastaviNaslov, posaljiSms, tekstPotvrde, normalizujTelefon.
 *
 * GET  ?akcija=konfig                                  -> lokacije, osobe, usluge
 * GET  ?akcija=slotovi&lok=ID&osoba=Ime&usluga=ID&datum=yyyy-MM-dd -> termini dana (slobodno/zauzeto)
 * POST {akcija:'zakazi', lok, osoba, usluga, datum, vrijeme, dijete, uzrast, roditelj, telefon, napomena}
 * POST {akcija:'vaucer', vrsta, dijete, kupac, telefon, napomena}
 * POST {akcija:'osoblje_*', pin, ...} - panel za osoblje (Osoblje.gs)
 *
 * Svaki termin je događaj u kalendaru lokacije, naslov "Osoba - Usluga (Dijete)".
 * Lokacije, frizeri, radno vrijeme i usluge čitaju se iz tabele (Podesavanja.gs).
 * Blokada termina: u kalendar upisati događaj "Nikola - Pauza" ili cjelodnevni "Nikola - Odmor".
 */

const APP = {
  NAZIV: 'Grašak',
  OSOBA: 'Frizer',          // za Dječiji kutak npr. 'Voditeljka' ili 'Prostor'
  KORAK_MIN: 30,            // termini na pola sata
  DANA_UNAPRIJED: 30,
  MIN_UNAPRIJED_MIN: 60,    // ne može se zakazati za manje od sat vremena
  KALENDAR_ID: 'primary',   // kalendar naloga grasaksalon@gmail.com (vlasnik: Kristina)
  // Lokacije, frizeri, radno vrijeme i usluge: tabela, listovi Lokacije / Frizeri / Usluge (Podesavanja.gs)
};

/* ---------- HTTP ---------- */

function doGet(e) {
  MEMO_ = {};
  const p = e.parameter || {};
  try {
    if (p.akcija === 'konfig') return json_(javnaKonfig_());
    if (p.akcija === 'slotovi') return json_({ slotovi: slotoviZaDan_(p.lok, p.osoba, p.usluga, p.datum) });
    if (p.akcija === 'slotovi_period') return json_({ dani: slotoviPeriod_(p.lok, p.osoba, p.usluga, Number(p.dana) || 14) });
    if (p.akcija === 'termin') return json_(terminZaRoditelja_(p.id, p.kod));
    return json_({ greska: 'Nepoznata akcija' });
  } catch (err) {
    return json_({ greska: String(err.message || err) });
  }
}

function doPost(e) {
  MEMO_ = {};
  let z;
  try { z = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, poruka: 'Neispravan zahtjev' }); }
  if (String(z.akcija || '').indexOf('osoblje_') === 0) {
    try { return json_(osobljeAkcija_(z)); } catch (err) { return json_({ ok: false, poruka: String(err.message || err) }); }
  }
  // zaštita od zloupotrebe javnog linka: najviše 30 upisa (termini + vaučeri) u 10 minuta
  if ((z.akcija === 'zakazi' || z.akcija === 'vaucer' || z.akcija === 'otkazi') && !ogranicenje_('javni_upis', 30, 600)) {
    return json_({ ok: false, poruka: 'Previše zahtjeva u kratkom roku. Pokušajte za nekoliko minuta ili pozovite salon.' });
  }
  if (z.akcija === 'vaucer') {
    try { return json_(vaucer_(z)); } catch (err) { return json_({ ok: false, poruka: String(err.message || err) }); }
  }
  if (z.akcija !== 'zakazi' && z.akcija !== 'otkazi') return json_({ ok: false, poruka: 'Nepoznata akcija' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, poruka: 'Sistem je zauzet, pokušajte ponovo.' });
  try {
    return json_(z.akcija === 'otkazi' ? otkaziSaSajta_(z) : zakazi_(z));
  } catch (err) {
    return json_({ ok: false, poruka: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

/** Brojač u kešu: false kad se u periodu pređe max. */
function ogranicenje_(kljuc, max, sekundi) {
  const c = CacheService.getScriptCache();
  const n = Number(c.get(kljuc) || 0);
  if (n >= max) return false;
  c.put(kljuc, String(n + 1), sekundi);
  return true;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- logika ---------- */

function javnaKonfig_() {
  const p = ucitajPodesavanja();
  const nr = ucitajNeradne(p.lokacije);
  const danas = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
  const zadnji = dodajDane(danas, APP.DANA_UNAPRIJED);
  return {
    naziv: APP.NAZIV, osoba: APP.OSOBA, korak: APP.KORAK_MIN, danaUnaprijed: APP.DANA_UNAPRIJED,
    usluge: p.usluge,
    lokacije: p.lokacije.filter(l => l.osobe.length)
      .map(l => ({ id: l.id, naziv: l.naziv, adresa: l.adresa, osobe: l.osobe, radno: l.radno,
                   neradni: neradniUPeriodu(danas, zadnji, nr.praznici, nr.posebni, l.naziv) })),
  };
}

function lokacija_(id) {
  const l = ucitajPodesavanja().lokacije.find(x => x.id === id);
  if (!l) throw new Error('Nepoznata lokacija');
  return l;
}

function usluga_(id) {
  const u = ucitajPodesavanja().usluge.find(x => x.id === id);
  if (!u) throw new Error('Nepoznata usluga');
  return u;
}

/** Zauzeti intervali osobe za dan, u minutama od ponoći. */
function zauzeto_(lok, osoba, datum) {
  const tz = CFG.TZ;
  const od = Utilities.parseDate(datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const do_ = Utilities.parseDate(dodajDane(datum, 1) + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const rez = [];
  kal_().getEvents(od, do_).forEach(ev => {
    const n = rastaviNaslov(ev.getTitle());
    if (!n || n.frizer.toLowerCase() !== osoba.toLowerCase()) return;
    if (ev.isAllDayEvent()) { rez.push([0, 1440]); return; }
    const s = Math.max(0, (ev.getStartTime() - od) / 60000);
    const k = Math.min(1440, (ev.getEndTime() - od) / 60000);
    rez.push([s, k]);
  });
  return rez;
}

function slotoviZaDan_(lokId, osoba, uslugaId, datum) {
  const lok = lokacija_(lokId);
  if (lok.osobe.indexOf(osoba) < 0) throw new Error('Nepoznat ' + APP.OSOBA.toLowerCase());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum || '')) throw new Error('Neispravan datum');
  const u = usluga_(uslugaId);
  const tz = CFG.TZ;
  const dan = Number(Utilities.formatDate(Utilities.parseDate(datum, tz, 'yyyy-MM-dd'), tz, 'u')) % 7;
  const sada = new Date();
  const danas = Utilities.formatDate(sada, tz, 'yyyy-MM-dd');
  const sadaMin = Number(Utilities.formatDate(sada, tz, 'H')) * 60 + Number(Utilities.formatDate(sada, tz, 'm'));
  const zadnji = Utilities.formatDate(new Date(sada.getTime() + APP.DANA_UNAPRIJED * 864e5), tz, 'yyyy-MM-dd');
  if (datum < danas || datum > zadnji) return [];
  const nr = ucitajNeradne();
  if (neradniUPeriodu(datum, datum, nr.praznici, nr.posebni, lok.naziv)[datum]) return [];
  const najranije = datum === danas ? sadaMin + APP.MIN_UNAPRIJED_MIN : -1;
  return generisiSlotove(lok.radno[dan], APP.KORAK_MIN, u.trajanje, zauzeto_(lok, osoba, datum), najranije);
}

/**
 * Slobodni termini za narednih N dana jednim čitanjem kalendara: { 'yyyy-MM-dd': [{vrijeme, slobodno}] }.
 * Sajt ih učita odjednom, pa se dani mijenjaju bez čekanja.
 */
function slotoviPeriod_(lokId, osoba, uslugaId, dana) {
  const lok = lokacija_(lokId);
  if (lok.osobe.indexOf(osoba) < 0) throw new Error('Nepoznat ' + APP.OSOBA.toLowerCase());
  const u = usluga_(uslugaId);
  const tz = CFG.TZ;
  const sada = new Date();
  const danas = Utilities.formatDate(sada, tz, 'yyyy-MM-dd');
  const sadaMin = uMinute(Utilities.formatDate(sada, tz, 'HH:mm'));
  const n = Math.min(Math.max(1, dana), APP.DANA_UNAPRIJED + 1);
  const krajIso = dodajDane(danas, n);
  const nr = ucitajNeradne();
  const neradni = neradniUPeriodu(danas, krajIso, nr.praznici, nr.posebni, lok.naziv);
  const pocetak = Utilities.parseDate(danas + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const kraj = Utilities.parseDate(krajIso + ' 00:00', tz, 'yyyy-MM-dd HH:mm');

  const zauzetoPoDanu = {};
  kal_().getEvents(pocetak, kraj).forEach(ev => {
    const t = rastaviNaslov(ev.getTitle());
    if (!t || t.frizer.toLowerCase() !== osoba.toLowerCase()) return;
    for (let d = Utilities.formatDate(ev.getStartTime() < pocetak ? pocetak : ev.getStartTime(), tz, 'yyyy-MM-dd'); d < krajIso; d = dodajDane(d, 1)) {
      const ponoc = Utilities.parseDate(d + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
      if (ev.getEndTime() <= ponoc) break;
      const s = Math.max(0, Math.round((ev.getStartTime() - ponoc) / 60000));
      const k = Math.min(1440, Math.round((ev.getEndTime() - ponoc) / 60000));
      if (k > s) (zauzetoPoDanu[d] = zauzetoPoDanu[d] || []).push([s, k]);
    }
  });

  const rez = {};
  for (let d = danas; d < krajIso; d = dodajDane(d, 1)) {
    if (neradni[d]) { rez[d] = []; continue; }
    rez[d] = generisiSlotove(lok.radno[danUSedmici(d)], APP.KORAK_MIN, u.trajanje, zauzetoPoDanu[d] || [],
      d === danas ? sadaMin + APP.MIN_UNAPRIJED_MIN : -1);
  }
  return rez;
}

function zakazi_(z) {
  const lok = lokacija_(z.lok);
  const u = usluga_(z.usluga);
  const telefon = normalizujTelefon(z.telefon);
  const dijete = cistTekst(z.dijete, 60);
  const roditelj = cistTekst(z.roditelj, 60);
  const uzrast = cistTekst(z.uzrast, 10);
  const napomena = cistTekst(z.napomena, 300);
  if (!dijete || !roditelj) return { ok: false, poruka: 'Upišite ime i prezime djeteta i roditelja.' };
  if (telefon.replace(/\D/g, '').length < 10) return { ok: false, poruka: 'Upišite ispravan broj telefona.' };
  const email = String(z.email || '').trim().toLowerCase().slice(0, 80);
  if (email && !jeEmail(email)) return { ok: false, poruka: 'Email adresa nije ispravna (ili je ostavite praznu).' };
  const kartica = z.kartica === true || /^(da|true|1)$/i.test(String(z.kartica || ''));
  // jedan broj telefona: najviše 3 buduća termina preko sajta (zaštita od lažnog zauzimanja)
  const danasIso = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
  const aktivnih = citajTermine_(CFG.TZ).filter(r => r.telefon === telefon && r.datum >= danasIso && r.status === 'zakazan').length;
  if (aktivnih >= 3) return { ok: false, poruka: 'Za ovaj broj već postoje 3 zakazana termina. Za više termina pozovite salon.' };

  const slot = slotoviZaDan_(z.lok, z.osoba, z.usluga, z.datum).find(s => s.vrijeme === z.vrijeme);
  if (!slot || !slot.slobodno) return { ok: false, poruka: 'Termin je upravo zauzet. Izaberite drugi.' };

  const tz = CFG.TZ;
  const pocetak = Utilities.parseDate(z.datum + ' ' + z.vrijeme, tz, 'yyyy-MM-dd HH:mm');
  const kraj = new Date(pocetak.getTime() + u.trajanje * 60000);
  const ev = kal_().createEvent(z.osoba + ' - ' + u.naziv + ' (' + dijete + ')', pocetak, kraj, {
    description: 'Roditelj: ' + roditelj + '\nTelefon: ' + telefon + '\nUzrast: ' + (uzrast || '-') +
      '\nNapomena: ' + (napomena || '-') + '\nKartica: ' + (kartica ? 'da' : '-') + '\nEmail: ' + (email || '-') +
      '\nKod: ' + napraviKod_() + '\nIzvor: sajt',
  });
  if (kartica) ev.setColor(CalendarApp.EventColor.YELLOW);   // kartica Veseli Grašak: žuto i u Google kalendaru

  if (posaljiSms(telefon, tekstPotvrde(z.datum, z.vrijeme, z.osoba, lok.telefon))) ev.setTag('potvrda', 'poslat');
  if (email) posaljiEmailTermina_(ev, 'potvrda');
  zapisiObavjestenje_('novi', z.osoba, z.datum, z.vrijeme, u.naziv, dijete, 'sajt', roditelj);
  ev.setTag('obav', 'da');
  upisiTermin_(ev);
  azurirajKlijenta_(telefon);
  return { ok: true, poruka: 'Termin je zakazan.', id: ev.getId(), kod: poljeIzOpisa(ev.getDescription(), 'Kod'), email: !!email };
}

/* ---------- roditelj: pregled i otkazivanje preko linka iz potvrde (id termina + kod) ---------- */

function terminPoKodu_(id, kod) {
  const k = String(kod || '').trim().toUpperCase();
  const ev = k.length >= 6 && id ? kal_().getEventById(String(id)) : null;
  if (!ev || poljeIzOpisa(ev.getDescription(), 'Kod').toUpperCase() !== k) throw new Error('Termin nije pronađen ili je već otkazan.');
  const n = rastaviNaslov(ev.getTitle());
  if (!n || jeBlokada(n.usluga)) throw new Error('Termin nije pronađen.');
  return { ev: ev, n: n };
}

function terminZaRoditelja_(id, kod) {
  const t = terminPoKodu_(id, kod);
  const tz = CFG.TZ;
  const lok = lokPoFrizeru_()[t.n.frizer.toLowerCase()] || {};
  return {
    datum: Utilities.formatDate(t.ev.getStartTime(), tz, 'yyyy-MM-dd'), vrijeme: Utilities.formatDate(t.ev.getStartTime(), tz, 'HH:mm'),
    osoba: t.n.frizer, usluga: t.n.usluga, dijete: t.n.klijent, lokacija: lok.naziv || '', adresa: lok.adresa || '',
    telefonSalona: lok.telefon || CFG.TEL_SALONA, prosao: t.ev.getStartTime() <= new Date(), status: t.ev.getTag('status') || 'zakazan',
  };
}

/** Roditelj otkazuje sam: red u tabeli = otkazan, zvonce frizeru, email potvrda, događaj nestaje iz kalendara. */
function otkaziSaSajta_(z) {
  const t = terminPoKodu_(z.id, z.kod);
  if (t.ev.getStartTime() <= new Date()) return { ok: false, poruka: 'Termin je već prošao, ne može se otkazati.' };
  const red = redZaDogadjaj_(t.ev, lokPoFrizeru_(), CFG.TZ);
  red[KOL['Status']] = 'otkazan';
  red[KOL['Napomena']] = (red[KOL['Napomena']] ? red[KOL['Napomena']] + ' | ' : '') + 'otkazao roditelj preko sajta';
  upisiRed_(red);
  zapisiObavjestenje_('otkazan', red[KOL['Frizer']], red[KOL['Datum']], red[KOL['Vrijeme']], red[KOL['Usluga']], red[KOL['Dijete']], 'sajt', red[KOL['Roditelj']]);
  posaljiEmailTermina_(t.ev, 'otkazan_roditelj');
  t.ev.deleteEvent();
  azurirajKlijenta_(telefonIzTabele(red[KOL['Telefon']]));
  return { ok: true, poruka: 'Termin je otkazan. Hvala što ste javili na vrijeme.' };
}

/** Narudžba poklon vaučera: red u listu "Vaučeri" + SMS kupcu. Kristina se javlja kupcu za preuzimanje. */
function vaucer_(z) {
  const vrsta = cistTekst(z.vrsta, 60, true), dijete = cistTekst(z.dijete, 60, true), kupac = cistTekst(z.kupac, 60, true),
    napomena = cistTekst(z.napomena, 300, true);
  const telefon = normalizujTelefon(z.telefon);
  if (!vrsta || !dijete || !kupac) return { ok: false, poruka: 'Popunite vrstu vaučera, ime djeteta i vaše ime.' };
  if (telefon.replace(/\D/g, '').length < 10) return { ok: false, poruka: 'Upišite ispravan broj telefona.' };
  let sh = tabela_().getSheetByName(LIST_VAUCERI);
  if (!sh) { sh = tabela_().insertSheet(LIST_VAUCERI); sh.getRange('A:G').setNumberFormat('@'); }
  if (sh.getLastRow() === 0) sh.appendRow(ZAGLAVLJE_VAUCERI);
  sh.appendRow([sadaTekst_(), vrsta, dijete, kupac, telefonZaTabelu(telefon), napomena, 'novo']);
  azurirajKlijenta_(telefon);
  posaljiSms(telefon, CFG.SALON + ': primili smo narudzbu poklon vaucera za ' + bezDijakritika(dijete) +
    '. Javljamo se za preuzimanje. ' + CFG.TEL_SALONA);
  return { ok: true, poruka: 'Narudžba je primljena. Javljamo vam se za preuzimanje.' };
}

/* ---------- čiste funkcije (testirane) ---------- */

function uMinute(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

function uVrijeme(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

/**
 * radno: ['09:00','19:00'] ili undefined; korak i trajanje u minutama;
 * zauzeti: [[odMin, doMin], ...]; najranije: minut prije kojeg nema termina (-1 = bez ograničenja).
 * Vraća [{vrijeme:'09:00', slobodno:true}, ...] za svaki početak u radnom vremenu.
 */
function generisiSlotove(radno, korak, trajanje, zauzeti, najranije) {
  if (!radno) return [];
  const od = uMinute(radno[0]), do_ = uMinute(radno[1]);
  const rez = [];
  for (let s = od; s + korak <= do_; s += korak) {
    const k = s + trajanje;
    const slobodno = k <= do_ && s >= najranije &&
      !zauzeti.some(([a, b]) => s < b && k > a);
    rez.push({ vrijeme: uVrijeme(s), slobodno: slobodno });
  }
  return rez;
}

/**
 * Grašak - admin panel (grasaksalon.me/panel). Prijava: ime + šifra iz lista "Osoblje".
 *
 * vlasnik (Kristina): sve lokacije, pregled dana, upis termina, statusi, izvještaji, sedmični email.
 * admin:              isto, za sve lokacije ili samo svoju (kolona Lokacija).
 * frizer:             pregled dana svoje lokacije, upis termina kad neko zove, nije došao / otkazano, napomena.
 *
 * Sve akcije idu preko POST-a (šifra se nikad ne šalje u adresi).
 */

const PIN_MAX_GRESAKA = 10;   // pogrešnih prijava u 15 minuta, za sve zajedno - zaštita od pogađanja

function osobljeAkcija_(z) {
  const p = ucitajPodesavanja();
  const o = prijava_(z.ime, z.sifra, p.lokacije);
  switch (z.akcija) {
    case 'osoblje_prijava':
      return { ok: true, osoba: { ime: o.ime, uloga: o.uloga }, konfig: konfigZaOsoblje_(o, p) };
    case 'osoblje_dan':
      return { ok: true, dan: danPregled_(o, p, z.lok, z.datum) };
    case 'osoblje_zakazi':
      return pisanje_(() => zakaziOsoblje_(o, p, z));
    case 'osoblje_status':
      return pisanje_(() => promijeniStatus_(o, p, z.id, z.status));
    case 'osoblje_napomena':
      return pisanje_(() => dopisiNapomenu_(o, p, z.id, z.tekst));
    case 'osoblje_pomjeri':
      return pisanje_(() => pomjeriTermin_(o, p, z));
    case 'osoblje_blokada':
      return pisanje_(() => upisiBlokadu_(o, p, z));
    case 'osoblje_obrisi_blokadu':
      return pisanje_(() => obrisiBlokadu_(o, p, z.id));
    case 'osoblje_sedmica':
      return { ok: true, sedmica: sedmicaPregled_(o, p, z.lok, z.od) };
    case 'osoblje_klijent':
      return { ok: true, klijent: klijentPregled_(o, p, z.telefon) };
    case 'osoblje_predstojeci':
      return { ok: true, termini: predstojeciTermini_(o, p, Number(z.dana) || 14) };
    case 'osoblje_klijenti':
      return Object.assign({ ok: true }, klijentiZaPanel_(o, z.q, z.filter));
    case 'osoblje_klijent_sacuvaj':
      return pisanje_(() => sacuvajKlijenta_(o, z));
    case 'osoblje_obavjestenja':
      return { ok: true, obavjestenja: obavjestenjaZa_(o, p, z.posle), sada: String(Date.now()) };
    case 'osoblje_izvjestaj':
      if (o.uloga === 'frizer') return { ok: false, poruka: 'Izvještaji su za vlasnika i administratore.' };
      return { ok: true, izvjestaj: izvjestajZaPeriod_(o, p, z.od, z.do, z.lok) };
    case 'osoblje_podesavanja':
      if (o.uloga !== 'vlasnik') return { ok: false, poruka: 'Podešavanja mijenja samo vlasnik.' };
      return { ok: true, podesavanja: citajPodesavanjaZaEkran_() };
    case 'osoblje_sacuvaj_podesavanja':
      if (o.uloga !== 'vlasnik') return { ok: false, poruka: 'Podešavanja mijenja samo vlasnik.' };
      return pisanje_(() => sacuvajPodesavanja_(o, z.podesavanja));
  }
  return { ok: false, poruka: 'Nepoznata akcija' };
}

function pisanje_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, poruka: 'Sistem je zauzet, pokušajte ponovo.' };
  try { return fn(); } finally { lock.releaseLock(); }
}

function prijava_(ime, sifra, lokacije) {
  const cache = CacheService.getScriptCache();
  const greske = Number(cache.get('pin_greske') || 0);
  if (greske >= PIN_MAX_GRESAKA) throw new Error('Previše pogrešnih pokušaja. Sačekajte 15 minuta.');
  const i = String(ime || '').trim().toLowerCase(), s = String(sifra || '').trim();
  const o = i && s ? ucitajOsoblje(lokacije).osoblje.find(x => x.ime.toLowerCase() === i && x.sifra === s) : null;
  if (!o) {
    cache.put('pin_greske', String(greske + 1), 900);
    if (greske + 1 === PIN_MAX_GRESAKA) upozoriVlasnika_(lokacije);
    Utilities.sleep(1000);
    throw new Error('Pogrešno ime ili šifra.');
  }
  return o;
}

/** Email vlasniku kad neko više puta pogriješi šifru (moguće pogađanje). */
function upozoriVlasnika_(lokacije) {
  try {
    ucitajOsoblje(lokacije).osoblje.filter(x => x.uloga === 'vlasnik' && /@/.test(x.email)).forEach(x => {
      MailApp.sendEmail(x.email, 'Grašak: zaključana prijava u panel',
        'U posljednjih 15 minuta bilo je ' + PIN_MAX_GRESAKA + ' pogrešnih prijava u admin panel (grasaksalon.me/panel). ' +
        'Prijava je zaključana 15 minuta. Ako to niste bili vi ili vaše osoblje, promijenite šifre u Podešavanjima.');
    });
  } catch (e) { console.log('Upozorenje nije poslato: ' + e); }
}

function dozvoljeneLokacije_(o, p) {
  return o.uloga === 'vlasnik' || !o.lokacijaId ? p.lokacije : p.lokacije.filter(l => l.id === o.lokacijaId);
}

function dozvoljenaLok_(o, p, lokId) {
  const l = dozvoljeneLokacije_(o, p).find(x => x.id === lokId);
  if (!l) throw new Error('Nemate pristup ovoj lokaciji.');
  return l;
}

function konfigZaOsoblje_(o, p) {
  return {
    korak: APP.KORAK_MIN,
    usluge: p.usluge,
    lokacije: dozvoljeneLokacije_(o, p).map(l => ({ id: l.id, naziv: l.naziv, osobe: l.osobe, radno: l.radno })),
  };
}

function provjeriDatum_(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d || ''))) throw new Error('Neispravan datum');
}

function cist_(v, n) {
  return cistTekst(v, n);
}

/* ---------- pregled dana ---------- */

function danPregled_(o, p, lokId, datum) {
  const lok = dozvoljenaLok_(o, p, lokId);
  provjeriDatum_(datum);
  const tz = CFG.TZ;
  const od = Utilities.parseDate(datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const dogadjaji = kal_().getEvents(od, Utilities.parseDate(dodajDane(datum, 1) + ' 00:00', tz, 'yyyy-MM-dd HH:mm'));
  const nr = ucitajNeradne(p.lokacije);
  return danIzDogadjaja_(lok, datum, dogadjaji, neradniUPeriodu(datum, datum, nr.praznici, nr.posebni, lok.naziv)[datum] || '');
}

/** Raspored jednog dana iz već pročitanih događaja (koristi ga i sedmični pregled, jedno čitanje kalendara). */
function danIzDogadjaja_(lok, datum, dogadjaji, neradni) {
  const tz = CFG.TZ;
  const od = Utilities.parseDate(datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const kraj = new Date(od.getTime() + 864e5);
  const radno = neradni ? null : lok.radno[danUSedmici(datum)] || null;

  const osobe = lok.osobe.map(ime => {
    const termini = [], blokade = [];
    dogadjaji.forEach(ev => {
      if (ev.getEndTime() <= od || ev.getStartTime() >= kraj) return;   // događaj drugog dana
      const n = rastaviNaslov(ev.getTitle());
      if (!n || n.frizer.toLowerCase() !== ime.toLowerCase()) return;
      const cijeli = ev.isAllDayEvent();
      const s = cijeli ? 0 : Math.max(0, Math.round((ev.getStartTime() - od) / 60000));
      const k = cijeli ? 1440 : Math.min(1440, Math.round((ev.getEndTime() - od) / 60000));
      if (cijeli || jeBlokada(n.usluga)) { blokade.push({ id: ev.getId(), od: s, do: k, naziv: n.usluga }); return; }
      const opis = ev.getDescription();
      termini.push({
        id: ev.getId(), od: s, do: k, usluga: n.usluga, dijete: n.klijent,
        uzrast: poljeIzOpisa(opis, 'Uzrast'), roditelj: poljeIzOpisa(opis, 'Roditelj'),
        telefon: izvuciTelefon(poljeIzOpisa(opis, 'Telefon') || opis), napomena: poljeIzOpisa(opis, 'Napomena'),
        izvor: poljeIzOpisa(opis, 'Izvor') || 'kalendar', status: ev.getTag('status') || 'zakazan',
        kartica: !!poljeIzOpisa(opis, 'Kartica'), email: poljeIzOpisa(opis, 'Email'),
      });
    });
    return Object.assign({ ime: ime }, rasporedDana(radno, APP.KORAK_MIN, termini, blokade));
  });
  return { datum: datum, lokacija: lok.id, radno: radno, neradni: neradni, osobe: osobe };
}

/** Sedmica (7 dana od "od") za sve frizere lokacije: broj termina, popunjenost, slobodno. Jedno čitanje kalendara. */
function sedmicaPregled_(o, p, lokId, od) {
  const lok = dozvoljenaLok_(o, p, lokId);
  provjeriDatum_(od);
  const tz = CFG.TZ;
  const kraj = dodajDane(od, 7);
  const dogadjaji = kal_().getEvents(Utilities.parseDate(od + ' 00:00', tz, 'yyyy-MM-dd HH:mm'),
    Utilities.parseDate(kraj + ' 00:00', tz, 'yyyy-MM-dd HH:mm'));
  const nr = ucitajNeradne(p.lokacije);
  const neradni = neradniUPeriodu(od, dodajDane(od, 6), nr.praznici, nr.posebni, lok.naziv);
  const dani = [];
  for (let d = od; d < kraj; d = dodajDane(d, 1)) {
    const dan = danIzDogadjaja_(lok, d, dogadjaji, neradni[d] || '');
    dani.push({
      datum: d, neradni: dan.neradni, radno: dan.radno,
      osobe: dan.osobe.map(x => ({
        ime: x.ime, termini: x.termini.filter(t => t.status !== 'otkazan').length,
        nijeDosao: x.termini.filter(t => t.status === 'nije_dosao').length, kartica: x.termini.filter(t => t.kartica).length,
        popunjeno: x.popunjeno, slobodno: x.slotovi.filter(sl => sl.stanje === 'slobodno').length,
      })),
    });
  }
  return { od: od, do: dodajDane(od, 6), lokacija: lok.id, dani: dani };
}

/** Istorija klijenta po broju telefona (iz tabele Termini): posjete, izostanci, otkazivanja, djeca, kartica. */
function klijentPregled_(o, p, telefon) {
  const tel = normalizujTelefon(telefon);
  if (tel.replace(/\D/g, '').length < 10) return null;
  const tz = CFG.TZ;
  const danas = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const lokacije = dozvoljeneLokacije_(o, p).map(l => l.naziv);
  const redovi = citajTermine_(tz).filter(r => r.telefon === tel && (!r.lokacija || lokacije.indexOf(r.lokacija) >= 0));
  const prosli = redovi.filter(r => r.datum < danas && r.status === 'zakazan');   // prošao i nije označen "nije došao" = bio
  const djeca = {};
  redovi.forEach(r => { if (r.dijete) djeca[r.dijete] = true; });
  return {
    posjete: prosli.length,
    zadnja: prosli.length ? prosli.map(r => r.datum).sort().pop() : '',
    prva: redovi.length ? redovi.map(r => r.datum).sort()[0] : '',
    nijeDosao: redovi.filter(r => r.status === 'nije_dosao').length,
    otkazano: redovi.filter(r => r.status === 'otkazan').length,
    predstoji: redovi.filter(r => r.datum >= danas && r.status === 'zakazan').length,
    kartica: redovi.some(r => r.kartica),
    djeca: Object.keys(djeca),
  };
}

/** Svi predstojeći termini (do 60 dana) za dozvoljene lokacije, iz kalendara, po vremenu. */
function predstojeciTermini_(o, p, dana) {
  const n = Math.min(60, Math.max(1, dana));
  const tz = CFG.TZ;
  const sada = new Date();
  const kraj = Utilities.parseDate(dodajDane(Utilities.formatDate(sada, tz, 'yyyy-MM-dd'), n) + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const lokPoFrizeru = lokPoFrizeru_();
  const dozvoljene = {};
  dozvoljeneLokacije_(o, p).forEach(l => { dozvoljene[l.id] = true; });
  const rez = [];
  kal_().getEvents(sada, kraj).forEach(ev => {
    const t = rastaviNaslov(ev.getTitle());
    if (!t || jeBlokada(t.usluga) || ev.isAllDayEvent()) return;
    const lok = lokPoFrizeru[t.frizer.toLowerCase()];
    if (!lok || !dozvoljene[lok.id]) return;
    const opis = ev.getDescription();
    rez.push({
      id: ev.getId(), datum: Utilities.formatDate(ev.getStartTime(), tz, 'yyyy-MM-dd'),
      vrijeme: Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm'), kraj: Utilities.formatDate(ev.getEndTime(), tz, 'HH:mm'),
      frizer: t.frizer, lokacija: lok.naziv, usluga: t.usluga, dijete: t.klijent,
      roditelj: poljeIzOpisa(opis, 'Roditelj'), telefon: izvuciTelefon(poljeIzOpisa(opis, 'Telefon') || opis),
      kartica: !!poljeIzOpisa(opis, 'Kartica'), napomena: poljeIzOpisa(opis, 'Napomena'),
      status: ev.getTag('status') || 'zakazan', izvor: poljeIzOpisa(opis, 'Izvor') || 'kalendar',
    });
  });
  return rez.sort((a, b) => (a.datum + a.vrijeme).localeCompare(b.datum + b.vrijeme));
}

/* ---------- obavještenja (zvonce u panelu) ---------- */

/**
 * Posljednja obavještenja za prijavljenu osobu (najnovija prva, najviše 40), novija od "posle" (ms).
 * Frizer: samo svoji termini. Admin/vlasnik: dozvoljene lokacije. Bez obavještenja o sopstvenim izmjenama.
 */
function obavjestenjaZa_(o, p, posle) {
  const sh = tabela_().getSheetByName(LIST_OBAVJESTENJA);
  if (!sh || sh.getLastRow() < 2) return [];
  const n = Math.min(400, sh.getLastRow() - 1);
  // ćelija koju je Sheets pretvorio u datum/vrijeme vraća se kao 'yyyy-MM-dd' i 'HH:mm'
  const redovi = sh.getRange(sh.getLastRow() - n + 1, 1, n, ZAGLAVLJE_OBAV.length).getValues()
    .map(r => { r[4] = datumTekst(r[4], CFG.TZ); r[5] = vrijemeTekst(r[5], CFG.TZ); return r; });
  return filtrirajObavjestenja(redovi, o, dozvoljeneLokacije_(o, p).map(l => l.naziv), Number(posle) || 0);
}

/* ---------- upis, status, napomena ---------- */

function zakaziOsoblje_(o, p, z) {
  const lok = dozvoljenaLok_(o, p, z.lok);
  if (lok.osobe.indexOf(z.osoba) < 0) return { ok: false, poruka: 'Nepoznat frizer.' };
  const u = p.usluge.find(x => x.id === z.usluga);
  if (!u) return { ok: false, poruka: 'Izaberite uslugu.' };
  provjeriDatum_(z.datum);
  if (!/^\d{2}:\d{2}$/.test(String(z.vrijeme || ''))) return { ok: false, poruka: 'Neispravno vrijeme.' };
  const dijete = cist_(z.dijete, 60);
  if (!dijete) return { ok: false, poruka: 'Upišite ime djeteta.' };
  const telefon = cist_(z.telefon, 30) ? normalizujTelefon(z.telefon) : '';
  if (telefon && telefon.replace(/\D/g, '').length < 10) return { ok: false, poruka: 'Broj telefona nije ispravan.' };
  const email = String(z.email || '').trim().toLowerCase().slice(0, 80);
  if (email && !jeEmail(email)) return { ok: false, poruka: 'Email adresa nije ispravna.' };
  const kartica = z.kartica === true || /^(da|true|1)$/i.test(String(z.kartica || ''));

  const s = uMinute(z.vrijeme), k = s + u.trajanje;
  if (zauzeto_(lok, z.osoba, z.datum).some(([a, b]) => s < b && k > a)) {
    return { ok: false, poruka: 'Termin je u međuvremenu zauzet. Osvježite pregled.' };
  }
  const tz = CFG.TZ;
  const pocetak = Utilities.parseDate(z.datum + ' ' + z.vrijeme, tz, 'yyyy-MM-dd HH:mm');
  const ev = kal_().createEvent(z.osoba + ' - ' + u.naziv + ' (' + dijete + ')', pocetak,
    new Date(pocetak.getTime() + u.trajanje * 60000), {
      description: 'Roditelj: ' + (cist_(z.roditelj, 60) || '-') + '\nTelefon: ' + (telefon || '-') +
        '\nUzrast: ' + (cist_(z.uzrast, 10) || '-') + '\nNapomena: ' + (cist_(z.napomena, 300) || '-') +
        '\nKartica: ' + (kartica ? 'da' : '-') + '\nEmail: ' + (email || '-') + '\nKod: ' + napraviKod_() +
        '\nIzvor: telefon - ' + o.ime,
    });
  if (kartica) ev.setColor(CalendarApp.EventColor.YELLOW);
  potvrdiAkoTreba_(ev, lokPoFrizeru_(), tz);
  if (email) posaljiEmailTermina_(ev, 'potvrda');
  zapisiObavjestenje_('novi', z.osoba, z.datum, z.vrijeme, u.naziv, dijete, 'panel', o.ime);
  ev.setTag('obav', 'da');
  upisiTermin_(ev);
  azurirajKlijenta_(telefon);
  return { ok: true, poruka: 'Upisano: ' + z.vrijeme + ', ' + z.osoba + ', ' + dijete + '.' };
}

function terminZaIzmjenu_(o, p, id) {
  const ev = kal_().getEventById(String(id || ''));
  if (!ev) throw new Error('Termin nije pronađen (možda je već otkazan). Osvježite pregled.');
  const n = rastaviNaslov(ev.getTitle());
  if (!n || jeBlokada(n.usluga)) throw new Error('Ovo nije termin.');
  const lok = lokPoFrizeru_()[n.frizer.toLowerCase()];
  if (!lok || !dozvoljeneLokacije_(o, p).some(l => l.id === lok.id)) throw new Error('Nemate pristup ovom terminu.');
  return ev;
}

function promijeniStatus_(o, p, id, status) {
  if (STATUSI.indexOf(status) < 0) return { ok: false, poruka: 'Nepoznat status.' };
  const ev = terminZaIzmjenu_(o, p, id);
  const tel = izvuciTelefon(poljeIzOpisa(ev.getDescription(), 'Telefon') || ev.getDescription());
  if (status === 'otkazan') {
    const red = redZaDogadjaj_(ev, lokPoFrizeru_(), CFG.TZ);
    red[KOL['Status']] = 'otkazan';
    red[KOL['Napomena']] = (red[KOL['Napomena']] ? red[KOL['Napomena']] + ' | ' : '') + 'otkazao: ' + o.ime;
    upisiRed_(red);
    if (ev.getStartTime() > new Date()) {
      zapisiObavjestenje_('otkazan', red[KOL['Frizer']], red[KOL['Datum']], red[KOL['Vrijeme']], red[KOL['Usluga']], red[KOL['Dijete']], 'panel', o.ime);
      posaljiEmailTermina_(ev, 'otkazan');
    }
    ev.deleteEvent(); // termin se oslobađa za sajt i za kalendar
    azurirajKlijenta_(tel);
    return { ok: true, poruka: 'Termin je otkazan, vrijeme je ponovo slobodno.' };
  }
  ev.setTag('status', status);
  upisiTermin_(ev);
  azurirajKlijenta_(tel);
  return { ok: true, poruka: status === 'nije_dosao' ? 'Označeno: nije došao.' : 'Termin je ponovo uredan.' };
}

function dopisiNapomenu_(o, p, id, tekst) {
  const t = cist_(tekst, 200);
  if (!t) return { ok: false, poruka: 'Upišite tekst.' };
  const ev = terminZaIzmjenu_(o, p, id);
  const opis = ev.getDescription();
  const stara = poljeIzOpisa(opis, 'Napomena');
  ev.setDescription(postaviPoljeUOpisu(opis, 'Napomena', (stara ? stara + ' | ' : '') + t + ' (' + o.ime + ')'));
  upisiTermin_(ev);
  return { ok: true, poruka: 'Napomena je dopisana.' };
}

/** Pomjeranje termina: novi dan i sat (po potrebi drugi frizer iste lokacije), podaci ostaju, roditelj dobija email. */
function pomjeriTermin_(o, p, z) {
  const ev = terminZaIzmjenu_(o, p, z.id);
  provjeriDatum_(z.datum);
  if (!/^\d{2}:\d{2}$/.test(String(z.vrijeme || ''))) return { ok: false, poruka: 'Neispravno vrijeme.' };
  const n = rastaviNaslov(ev.getTitle());
  const lok = lokPoFrizeru_()[n.frizer.toLowerCase()];
  const osoba = cist_(z.osoba, 40) || n.frizer;
  if (lok.osobe.indexOf(osoba) < 0) return { ok: false, poruka: 'Nepoznat frizer.' };
  const tz = CFG.TZ;
  const trajanje = Math.round((ev.getEndTime() - ev.getStartTime()) / 60000);
  const s = uMinute(z.vrijeme), k = s + trajanje;
  const od = Utilities.parseDate(z.datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const sukob = kal_().getEvents(od, new Date(od.getTime() + 864e5)).some(x => {
    if (x.getId() === ev.getId()) return false;
    const t = rastaviNaslov(x.getTitle());
    if (!t || t.frizer.toLowerCase() !== osoba.toLowerCase()) return false;
    const xs = x.isAllDayEvent() ? 0 : Math.max(0, (x.getStartTime() - od) / 60000);
    const xk = x.isAllDayEvent() ? 1440 : Math.min(1440, (x.getEndTime() - od) / 60000);
    return s < xk && k > xs;
  });
  if (sukob) return { ok: false, poruka: 'To vrijeme je zauzeto. Izaberite drugo.' };
  const staro = Utilities.formatDate(ev.getStartTime(), tz, 'dd.MM.') + ' ' + Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm') +
    (osoba !== n.frizer ? ' (' + n.frizer + ')' : '');
  const pocetak = Utilities.parseDate(z.datum + ' ' + z.vrijeme, tz, 'yyyy-MM-dd HH:mm');
  ev.setTime(pocetak, new Date(pocetak.getTime() + trajanje * 60000));
  if (osoba !== n.frizer) ev.setTitle(osoba + ' - ' + n.usluga + (n.klijent ? ' (' + n.klijent + ')' : ''));
  ev.deleteTag('podsjetnik'); ev.deleteTag('podsjetnik_email');   // novi dan = novi podsjetnik
  const opis = ev.getDescription();
  const stara = poljeIzOpisa(opis, 'Napomena');
  ev.setDescription(postaviPoljeUOpisu(opis, 'Napomena', (stara ? stara + ' | ' : '') + 'pomjeren sa ' + staro + ' (' + o.ime + ')'));
  zapisiObavjestenje_('pomjeren', osoba, z.datum, z.vrijeme, n.usluga, n.klijent, 'panel', o.ime);
  posaljiEmailTermina_(ev, 'pomjeren');
  upisiTermin_(ev);
  azurirajKlijenta_(izvuciTelefon(poljeIzOpisa(ev.getDescription(), 'Telefon') || ev.getDescription()));
  const [g, m, d] = z.datum.split('-');
  return { ok: true, poruka: 'Pomjereno na ' + d + '.' + m + '. u ' + z.vrijeme + (osoba !== n.frizer ? ', ' + osoba : '') + '.' };
}

/** Pauza ili "ne radi" iz panela: događaj "Frizer - Pauza" (sajt odmah prestaje da nudi to vrijeme). */
function upisiBlokadu_(o, p, z) {
  const lok = dozvoljenaLok_(o, p, z.lok);
  const osoba = cist_(z.osoba, 40);
  if (lok.osobe.indexOf(osoba) < 0) return { ok: false, poruka: 'Nepoznat frizer.' };
  provjeriDatum_(z.datum);
  const cijeli = z.cijeliDan === true || /^(da|true|1)$/i.test(String(z.cijeliDan || ''));
  const naziv = cijeli ? 'Ne radi' : /^ne radi/i.test(String(z.naziv || '')) ? 'Ne radi' : 'Pauza';
  const tz = CFG.TZ;
  const od = Utilities.parseDate(z.datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  let s = 0, k = 1440;
  if (!cijeli) {
    if (!/^\d{2}:\d{2}$/.test(String(z.od || '')) || !/^\d{2}:\d{2}$/.test(String(z.do || ''))) return { ok: false, poruka: 'Neispravno vrijeme.' };
    s = uMinute(z.od); k = uMinute(z.do);
    if (k <= s) return { ok: false, poruka: 'Kraj mora biti poslije početka.' };
  }
  const sukob = kal_().getEvents(od, new Date(od.getTime() + 864e5)).find(x => {
    const t = rastaviNaslov(x.getTitle());
    if (!t || jeBlokada(t.usluga) || x.isAllDayEvent() || t.frizer.toLowerCase() !== osoba.toLowerCase()) return false;
    const xs = Math.max(0, (x.getStartTime() - od) / 60000), xk = Math.min(1440, (x.getEndTime() - od) / 60000);
    return s < xk && k > xs;
  });
  if (sukob) {
    return { ok: false, poruka: 'U tom vremenu već ima termin (' + (rastaviNaslov(sukob.getTitle()).klijent || 'bez imena') + '). Prvo ga pomjerite ili otkažite.' };
  }
  const naslov = osoba + ' - ' + naziv;
  const ev = cijeli ? kal_().createAllDayEvent(naslov, od)
    : kal_().createEvent(naslov, new Date(od.getTime() + s * 60000), new Date(od.getTime() + k * 60000));
  ev.setDescription('Upisano u panelu: ' + o.ime);
  return { ok: true, poruka: naslov + ' upisano. Sajt više ne nudi to vrijeme.', id: ev.getId() };
}

function obrisiBlokadu_(o, p, id) {
  const ev = kal_().getEventById(String(id || ''));
  if (!ev) return { ok: false, poruka: 'Pauza nije pronađena (možda je već uklonjena).' };
  const n = rastaviNaslov(ev.getTitle());
  if (!n || !(ev.isAllDayEvent() || jeBlokada(n.usluga))) return { ok: false, poruka: 'Ovo nije pauza.' };
  const lok = lokPoFrizeru_()[n.frizer.toLowerCase()];
  if (!lok || !dozvoljeneLokacije_(o, p).some(l => l.id === lok.id)) return { ok: false, poruka: 'Nemate pristup.' };
  ev.deleteEvent();
  return { ok: true, poruka: 'Uklonjeno, vrijeme je ponovo slobodno.' };
}

/* ---------- podešavanja iz aplikacije (samo vlasnik) ---------- */

function citajList_(ime, kolona) {
  const sh = tabela_().getSheetByName(ime);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, kolona).getValues().filter(r => String(r[0] == null ? '' : r[0]).trim());
}

function upisiList_(ime, redovi, kolona, tekstKolone) {
  const ss = tabela_();
  const sh = ss.getSheetByName(ime) || ss.insertSheet(ime);
  if (tekstKolone) sh.getRange(tekstKolone).setNumberFormat('@');
  const zadnji = sh.getLastRow();
  if (zadnji > 1) sh.getRange(2, 1, zadnji - 1, kolona).clearContent();
  if (redovi.length) sh.getRange(2, 1, redovi.length, kolona).setValues(redovi);
}

/** Podešavanja kako su upisana u tabeli; šifre se ne šalju, samo da li postoje. */
function citajPodesavanjaZaEkran_() {
  const t = v => (v == null ? '' : String(v)).trim();
  const da = v => t(v).toUpperCase() !== 'NE';
  return {
    lokacije: citajList_(LIST_LOK, 10).map(r => ({ naziv: t(r[0]), adresa: t(r[1]), telefon: t(r[2]), dani: r.slice(3, 10).map(t) })),
    frizeri: citajList_(LIST_FRIZ, 3).map(r => ({ ime: t(r[0]), lokacija: t(r[1]), aktivan: da(r[2]) })),
    usluge: citajList_(LIST_USL, 3).map(r => ({ naziv: t(r[0]), trajanje: Number(r[1]) || 30, aktivna: da(r[2]) })),
    praznici: (tabela_().getSheetByName(LIST_PRAZNICI) ? citajList_(LIST_PRAZNICI, 4) : ZAKONSKI_PRAZNICI).map(r => {
      const dm = parsirajDanMjesec(r[1]);
      return { naziv: t(r[0]), datum: dm ? dm[0] + '.' + dm[1] + '.' : t(r[1]), dana: Number(r[2]) === 2 ? 2 : 1, neradni: da(r[3]) };
    }),
    neradniDani: citajList_(LIST_NERADNI, 3).map(r => ({ datum: parsirajDatum(r[0]) || t(r[0]), razlog: t(r[1]), lokacija: t(r[2]) })),
    osoblje: citajList_(LIST_OSOBLJE, 6).map((r, i) => ({
      red: i, ime: t(r[0]), uloga: t(r[1]).toLowerCase(), lokacija: t(r[2]), imaSifru: !!t(r[3]) && !/^UPISATI/i.test(t(r[3])) && !provjeriSifru(t(r[3])),
      email: t(r[4]), aktivan: da(r[5]),
    })),
  };
}

/** Provjeri sve kao "Provjeri podesavanja", pa upiši u tabelu. Prazna šifra = ostaje stara. */
function sacuvajPodesavanja_(o, s) {
  if (!s || typeof s !== 'object') return { ok: false, poruka: 'Neispravni podaci.' };
  const t = (v, n) => cistTekst(v, n, true);                                          // bez formula u tabeli
  const tel = (v, n) => String(v == null ? '' : v).replace(/[^\d+ /-]/g, '').trim().slice(0, n);  // telefon smije početi s +
  const niz = x => (Array.isArray(x) ? x.slice(0, 200) : []);
  const stari = citajList_(LIST_OSOBLJE, 6);
  const lok = niz(s.lokacije).map(l => [t(l.naziv, 60), t(l.adresa, 120), tel(l.telefon, 30)]
    .concat(niz(l.dani).concat(['', '', '', '', '', '', '']).slice(0, 7).map(d => t(d, 20)))).filter(r => r[0]);
  const friz = niz(s.frizeri).map(f => [t(f.ime, 40), t(f.lokacija, 60), f.aktivan === false ? 'NE' : 'DA']).filter(r => r[0]);
  const usl = niz(s.usluge).map(u => [t(u.naziv, 60), Number(u.trajanje) || 0, u.aktivna === false ? 'NE' : 'DA']).filter(r => r[0]);
  const prz = niz(s.praznici).map(x => [t(x.naziv, 60), t(x.datum, 10), Number(x.dana) === 2 ? 2 : 1, x.neradni === false ? 'NE' : 'DA']).filter(r => r[0]);
  const nrd = niz(s.neradniDani).map(x => [t(x.datum, 12), t(x.razlog, 80), t(x.lokacija, 60)]).filter(r => r[0]);
  const osb = niz(s.osoblje).map(x => {
    const staraSifra = Number.isInteger(x.red) && stari[x.red] ? String(stari[x.red][3] == null ? '' : stari[x.red][3]).trim() : '';
    return [t(x.ime, 40), t(x.uloga, 10).toLowerCase(), t(x.lokacija, 60), String(x.sifra || '').trim().slice(0, 40) || staraSifra,
            t(x.email, 80), x.aktivan === false ? 'NE' : 'DA'];
  }).filter(r => r[0]);

  const p = sastaviPodesavanja(lok, friz, usl);
  const os = sastaviOsoblje(osb, p.lokacije);
  const nr = sastaviNeradne(prz, nrd, p.lokacije);
  const greske = p.greske.concat(os.greske, nr.greske);
  if (!p.lokacije.length) greske.push('Mora postojati bar jedna lokacija.');
  if (!p.usluge.length) greske.push('Mora postojati bar jedna aktivna usluga.');
  if (!os.osoblje.some(x => x.uloga === 'vlasnik')) greske.push('Mora ostati bar jedan aktivan vlasnik sa šifrom, inače niko ne može u podešavanja.');
  if (greske.length) return { ok: false, poruka: 'Nije sačuvano. Ispravite:', greske: greske };

  obrisiKes_();
  upisiList_(LIST_LOK, lok, 10, 'C:J');
  upisiList_(LIST_FRIZ, friz, 3);
  upisiList_(LIST_USL, usl, 3);
  upisiList_(LIST_OSOBLJE, osb, 6, 'D:D');
  upisiList_(LIST_PRAZNICI, prz, 4, 'B:B');
  upisiList_(LIST_NERADNI, nrd.map(r => [parsirajDatum(r[0]), r[1], r[2]]), 3, 'A:A');
  obrisiKes_();
  return {
    ok: true,
    poruka: 'Sačuvano. Sajt i panel već rade s novim podešavanjima.' +
      (os.bezPina.length ? ' Bez šifre (ne mogu u panel): ' + os.bezPina.join(', ') + '.' : ''),
    odjava: !os.osoblje.some(x => x.ime === o.ime && x.sifra === o.sifra),
  };
}

/* ---------- izvještaji ---------- */

function izvjestajZaPeriod_(o, p, od, do_, lokId) {
  provjeriDatum_(od); provjeriDatum_(do_);
  if (od > do_) throw new Error('Datum "od" je poslije datuma "do".');
  if (dodajDane(od, 400) < do_) throw new Error('Period može biti najviše 400 dana.');
  let lokacije = dozvoljeneLokacije_(o, p);
  if (lokId) lokacije = [dozvoljenaLok_(o, p, lokId)];
  sinhronizuj();
  const tz = CFG.TZ;
  const sve = lokacije.length === p.lokacije.length;
  const nr = ucitajNeradne(p.lokacije);
  const neradniPoLok = {};
  lokacije.forEach(l => { neradniPoLok[l.naziv] = neradniUPeriodu(od, do_, nr.praznici, nr.posebni, l.naziv); });
  return izracunajIzvjestaj(citajTermine_(tz), lokacije, blokadeZaPeriod_(od, do_, tz), od, do_,
    Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'), uMinute(Utilities.formatDate(new Date(), tz, 'HH:mm')),
    APP.KORAK_MIN, sve, neradniPoLok);
}

function citajTermine_(tz) {
  const sh = tabela_().getSheetByName(LIST_TERMINI);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, ZAGLAVLJE.length).getValues().map(r => ({
    datum: datumTekst(r[KOL['Datum']], tz), vrijeme: vrijemeTekst(r[KOL['Vrijeme']], tz),
    kraj: vrijemeTekst(r[KOL['Kraj']], tz), lokacija: String(r[KOL['Lokacija']] || ''),
    frizer: String(r[KOL['Frizer']] || ''), usluga: String(r[KOL['Usluga']] || ''),
    telefon: telefonIzTabele(r[KOL['Telefon']]), izvor: String(r[KOL['Izvor']] || ''),
    status: String(r[KOL['Status']] || 'zakazan'), dijete: String(r[KOL['Dijete']] || ''),
    roditelj: String(r[KOL['Roditelj']] || ''), kartica: String(r[KOL['Kartica']] || '').toLowerCase() === 'da',
    email: String(r[KOL['Email']] || '').trim().toLowerCase(),
  })).filter(r => r.datum);
}

/** Pauze, odmori i cjelodnevni događaji frizera, po danima: smanjuju kapacitet za popunjenost. */
function blokadeZaPeriod_(od, do_, tz) {
  const pocetak = Utilities.parseDate(od + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const kraj = Utilities.parseDate(dodajDane(do_, 1) + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const rez = [];
  kal_().getEvents(pocetak, kraj).forEach(ev => {
    const n = rastaviNaslov(ev.getTitle());
    if (!n || !(ev.isAllDayEvent() || jeBlokada(n.usluga))) return;
    for (let d = Utilities.formatDate(ev.getStartTime() < pocetak ? pocetak : ev.getStartTime(), tz, 'yyyy-MM-dd');
      d <= do_; d = dodajDane(d, 1)) {
      const ponoc = Utilities.parseDate(d + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
      if (ev.getEndTime() <= ponoc) break;
      const s = Math.max(0, Math.round((ev.getStartTime() - ponoc) / 60000));
      const k = Math.min(1440, Math.round((ev.getEndTime() - ponoc) / 60000));
      if (k > s) rez.push({ datum: d, frizer: n.frizer, od: s, do: k });
    }
  });
  return rez;
}

/** Svakog ponedjeljka u 8h: izvještaj za prošlu sedmicu vlasniku i administratorima (kolona Email). */
function posaljiSedmicniIzvjestaj() {
  const tz = CFG.TZ;
  const danas = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const ovajPon = dodajDane(danas, -((danUSedmici(danas) + 6) % 7));
  const od = dodajDane(ovajPon, -7), do_ = dodajDane(ovajPon, -1);
  const p = ucitajPodesavanja();
  const primaoci = ucitajOsoblje(p.lokacije).osoblje.filter(o => o.uloga !== 'frizer' && /@/.test(o.email));
  if (!primaoci.length) return;
  primaoci.forEach(o => {
    const iz = izvjestajZaPeriod_(o, p, od, do_, '');
    MailApp.sendEmail({
      to: o.email,
      subject: 'Grašak - izvještaj ' + iz.naslov,
      htmlBody: izvjestajHtml(iz),
    });
  });
}

/* ---------- čiste funkcije (testirane) ---------- */

function filtrirajObavjestenja(redovi, o, lokacije, posle) {
  const ja = String(o.ime).toLowerCase();
  return redovi.map(r => ({
    kad: String(r[0]), tip: String(r[1]), lokacija: String(r[2]), frizer: String(r[3]), datum: String(r[4]),
    vrijeme: String(r[5]), usluga: String(r[6]), dijete: String(r[7]), izvor: String(r[8]), ko: String(r[9]),
  })).filter(x => Number(x.kad) > posle && x.ko.toLowerCase() !== ja &&
    (o.uloga === 'frizer' ? x.frizer.toLowerCase() === ja : (!x.lokacija || lokacije.indexOf(x.lokacija) >= 0)))
    .sort((a, b) => Number(b.kad) - Number(a.kad)).slice(0, 40);
}

function danUSedmici(iso) {
  const [g, m, d] = String(iso).split('-').map(Number);
  return new Date(Date.UTC(g, m - 1, d)).getUTCDay(); // 0 = nedjelja
}

function dodajDane(iso, n) {
  const [g, m, d] = String(iso).split('-').map(Number);
  const x = new Date(Date.UTC(g, m - 1, d + n));
  return x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0') + '-' + String(x.getUTCDate()).padStart(2, '0');
}

function preklop_(a, b, c, d) {
  return Math.max(0, Math.min(b, d) - Math.max(a, c));
}

/** Minuti intervala [a,b) koje pokrivaju intervali (spojeni, bez duplog brojanja). */
function pokriveno_(a, b, intervali) {
  const isjeceni = intervali.map(x => [Math.max(a, x[0]), Math.min(b, x[1])]).filter(x => x[1] > x[0])
    .sort((x, y) => x[0] - y[0]);
  let ukupno = 0, kraj = a;
  isjeceni.forEach(([s, k]) => {
    if (k <= kraj) return;
    ukupno += k - Math.max(s, kraj);
    kraj = k;
  });
  return ukupno;
}

/**
 * Raspored jednog frizera za dan, u koracima od pola sata.
 * stanje: slobodno | termin (termin počinje u ovom polju) | nastavak | blokada | van (van radnog vremena)
 */
function rasporedDana(radno, korak, termini, blokade) {
  const rs = radno ? uMinute(radno[0]) : null, rk = radno ? uMinute(radno[1]) : null;
  let start = rs, kraj = rk;
  termini.forEach(t => {
    start = start === null ? t.od : Math.min(start, t.od);
    kraj = kraj === null ? t.do : Math.max(kraj, t.do);
  });
  const slotovi = [];
  if (start !== null) {
    start = Math.floor(start / korak) * korak;
    kraj = Math.ceil(kraj / korak) * korak;
    for (let s = start; s < kraj; s += korak) {
      const pocinju = [];
      termini.forEach((t, i) => { if (t.od >= s && t.od < s + korak) pocinju.push(i); });
      const traje = termini.some(t => t.od < s && t.do > s);
      const blok = blokade.find(b => b.od < s + korak && b.do > s);
      let stanje;
      if (pocinju.length) stanje = 'termin';
      else if (traje) stanje = 'nastavak';
      else if (blok) stanje = 'blokada';
      else if (rs === null || s < rs || s + korak > rk) stanje = 'van';
      else stanje = 'slobodno';
      const slot = { vrijeme: uVrijeme(s), stanje: stanje };
      if (pocinju.length) slot.termini = pocinju;
      if (stanje === 'blokada') { slot.naziv = blok.naziv; if (blok.id) slot.id = blok.id; }
      slotovi.push(slot);
    }
  }
  const kapacitet = radno ? (rk - rs) - pokriveno_(rs, rk, blokade.map(b => [b.od, b.do])) : 0;
  const zauzeto = radno ? Math.min(kapacitet, pokriveno_(rs, rk, termini.map(t => [t.od, t.do]))) : 0;
  return {
    slotovi: slotovi,
    termini: termini.map(t => Object.assign({}, t, { od: uVrijeme(t.od), do: uVrijeme(t.do) })),
    popunjeno: { zauzeto: zauzeto, kapacitet: kapacitet, procenat: kapacitet ? Math.round(100 * zauzeto / kapacitet) : 0 },
  };
}

function grupaIzvora_(izvor) {
  const s = String(izvor || '').toLowerCase();
  if (s.indexOf('sajt') === 0) return 'Sajt';
  if (s.indexOf('telefon') === 0) return 'Osoblje (telefon)';
  return 'Google kalendar';
}

/**
 * redovi: [{datum, vrijeme, kraj, lokacija, frizer, usluga, telefon, izvor, status}] iz lista Termini
 * lokacije: lokacije u izvještaju; blokade: [{datum, frizer, od, do}] u minutama
 */
function izracunajIzvjestaj(redovi, lokacije, blokade, od, do_, danas, sadaMin, korak, sveLokacije, neradniPoLok) {
  const naziviLok = lokacije.map(l => l.naziv);
  const frizerLok = {};
  lokacije.forEach(l => l.osobe.forEach(o => { frizerLok[o.toLowerCase()] = l; }));
  const pripada = r => sveLokacije || naziviLok.indexOf(r.lokacija) >= 0 || (!r.lokacija && frizerLok[r.frizer.toLowerCase()]);
  const prazno = () => ({ termini: 0, dosli: 0, predstoji: 0, nijeDosao: 0, otkazano: 0, zauzeto: 0, kapacitet: 0 });

  const ukupno = prazno(), poFrizeru = {}, poUsluzi = {}, poIzvoru = {}, poDanu = [0, 0, 0, 0, 0, 0, 0];
  const telefoniUPeriodu = {};
  const frizer = ime => { const k = ime || '-'; if (!poFrizeru[k]) poFrizeru[k] = prazno(); return poFrizeru[k]; };

  redovi.filter(r => r.datum >= od && r.datum <= do_ && pripada(r)).forEach(r => {
    const f = frizer(r.frizer);
    ukupno.termini++; f.termini++;
    if (r.status === 'otkazan') { ukupno.otkazano++; f.otkazano++; return; }
    let kljuc;
    if (r.status === 'nije_dosao') kljuc = 'nijeDosao';
    else if (r.datum < danas || (r.datum === danas && uMinute(r.kraj || r.vrijeme) <= sadaMin)) kljuc = 'dosli';
    else kljuc = 'predstoji';
    ukupno[kljuc]++; f[kljuc]++;
    const trajanje = r.kraj ? Math.max(0, uMinute(r.kraj) - uMinute(r.vrijeme)) : korak;
    ukupno.zauzeto += trajanje; f.zauzeto += trajanje;
    poUsluzi[r.usluga] = (poUsluzi[r.usluga] || 0) + 1;
    const g = grupaIzvora_(r.izvor);
    poIzvoru[g] = (poIzvoru[g] || 0) + 1;
    poDanu[danUSedmici(r.datum)]++;
    if (r.telefon) telefoniUPeriodu[r.telefon] = true;
  });

  for (let d = od; d <= do_; d = dodajDane(d, 1)) {
    const dan = danUSedmici(d);
    lokacije.forEach(l => {
      const radno = l.radno[dan];
      if (!radno || (neradniPoLok && neradniPoLok[l.naziv] && neradniPoLok[l.naziv][d])) return;
      const rs = uMinute(radno[0]), rk = uMinute(radno[1]);
      l.osobe.forEach(o => {
        const b = blokade.filter(x => x.datum === d && x.frizer.toLowerCase() === o.toLowerCase()).map(x => [x.od, x.do]);
        const kap = (rk - rs) - pokriveno_(rs, rk, b);
        ukupno.kapacitet += kap; frizer(o).kapacitet += kap;
      });
    });
  }

  // novi klijent = prvi (neotkazani) termin ikad mu je u ovom periodu
  const prvi = {};
  redovi.forEach(r => {
    if (r.status === 'otkazan' || !r.telefon) return;
    if (!prvi[r.telefon] || r.datum < prvi[r.telefon]) prvi[r.telefon] = r.datum;
  });
  const tel = Object.keys(telefoniUPeriodu);
  const novi = tel.filter(t => prvi[t] >= od).length;

  const procenat = x => (x.kapacitet ? Math.round(100 * Math.min(x.zauzeto, x.kapacitet) / x.kapacitet) : 0);
  const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
  const [g1, m1, d1] = od.split('-'), [g2, m2, d2] = do_.split('-');
  return {
    od: od, do: do_,
    naslov: d1 + '.' + m1 + '.' + (g1 !== g2 ? g1 + '.' : '') + ' - ' + d2 + '.' + m2 + '.' + g2 + '.',
    ukupno: Object.assign(ukupno, { popunjenost: procenat(ukupno) }),
    poFrizeru: Object.keys(poFrizeru).sort().map(k => Object.assign({ ime: k }, poFrizeru[k], { popunjenost: procenat(poFrizeru[k]) })),
    poUsluzi: Object.keys(poUsluzi).map(k => ({ naziv: k, broj: poUsluzi[k] })).sort((a, b) => b.broj - a.broj),
    poIzvoru: Object.keys(poIzvoru).map(k => ({ naziv: k, broj: poIzvoru[k] })).sort((a, b) => b.broj - a.broj),
    poDanu: [1, 2, 3, 4, 5, 6, 0].map(i => ({ dan: DANI[i], broj: poDanu[i] })),
    klijenti: { ukupno: tel.length, novi: novi, ponovni: tel.length - novi },
  };
}

function izvjestajHtml(iz) {
  const u = iz.ukupno;
  const td = 'style="padding:6px 10px;border-bottom:1px solid #e3ebe1"';
  const red = cells => '<tr>' + cells.map(c => '<td ' + td + '>' + c + '</td>').join('') + '</tr>';
  return '<div style="font-family:Arial,sans-serif;color:#22302A">' +
    '<h2 style="color:#45813D">Grašak - izvještaj ' + iz.naslov + '</h2>' +
    '<p><b>Dolazaka: ' + u.dosli + '</b> &middot; Nije došlo: ' + u.nijeDosao + ' &middot; Otkazano: ' + u.otkazano +
    ' &middot; Predstoji: ' + u.predstoji + '<br>Popunjenost: <b>' + u.popunjenost + '%</b> &middot; Klijenata: ' +
    iz.klijenti.ukupno + ' (novih ' + iz.klijenti.novi + ')</p>' +
    '<table style="border-collapse:collapse">' +
    red(['<b>Frizer</b>', '<b>Termini</b>', '<b>Došli</b>', '<b>Nije došao</b>', '<b>Otkazano</b>', '<b>Popunjenost</b>']) +
    iz.poFrizeru.map(f => red([f.ime, f.termini, f.dosli, f.nijeDosao, f.otkazano, f.popunjenost + '%'])).join('') +
    '</table>' +
    '<p><b>Usluge:</b> ' + (iz.poUsluzi.map(x => x.naziv + ' ' + x.broj).join(', ') || '-') + '<br>' +
    '<b>Odakle termini:</b> ' + (iz.poIzvoru.map(x => x.naziv + ' ' + x.broj).join(', ') || '-') + '</p>' +
    '<p style="color:#888">Detalji: grasaksalon.me/panel > Izvještaj</p></div>';
}

/**
 * Klijenti (CRM): list "Klijenti", jedan red po broju telefona.
 * Gradi se sam iz termina i vaučera (poslije svakog upisa i svakog sata), a osoblje dopisuje
 * Roditelj, Email, Djeca, Kartica, Marketing (da/ne) i Napomenu: to se čuva pri osvježavanju.
 * Telefon: "067 338 777" -> +38267338777 (CG). "+49..." i "0049..." ostaju strani brojevi.
 */

const LIST_KLIJENTI = 'Klijenti';
const ZAGLAVLJE_KLIJENTI = ['Telefon', 'Roditelj', 'Email', 'Djeca', 'Kartica', 'Posjete', 'Prva posjeta', 'Zadnja posjeta',
  'Zadnja usluga', 'Predstoji', 'Nije došao', 'Otkazano', 'Vaučeri', 'Izvor', 'Marketing', 'Napomena', 'Azurirano'];
const KK = ZAGLAVLJE_KLIJENTI.reduce((o, k, i) => { o[k] = i; return o; }, {});
const MAX_KLIJENATA_PANEL = 300;

function listKlijenata_() {
  const ss = tabela_();
  let sh = ss.getSheetByName(LIST_KLIJENTI);
  if (!sh) {
    sh = ss.insertSheet(LIST_KLIJENTI);
    sh.getRange('A:Q').setNumberFormat('@');   // telefon ostaje +382..., datumi ostaju tekst
    sh.getRange(1, 1, 1, ZAGLAVLJE_KLIJENTI.length).setValues([ZAGLAVLJE_KLIJENTI]).setFontWeight('bold').setBackground('#e7f5e4');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Čista funkcija: termini (iz lista Termini) + vaučeri -> klijenti po telefonu, najskoriji prvi. */
function sastaviKlijente(termini, vauceri, danas) {
  const m = {};
  const uzmi = tel => m[tel] || (m[tel] = {
    telefon: tel, roditelj: '', email: '', djeca: {}, kartica: false, posjete: 0, prva: '', zadnja: '', zadnjaUsluga: '',
    predstoji: 0, nijeDosao: 0, otkazano: 0, vauceri: 0, izvor: '',
  });
  termini.forEach(r => {
    if (!r.telefon) return;
    const k = uzmi(r.telefon);
    if (r.roditelj) k.roditelj = r.roditelj;
    if (r.email) k.email = r.email;
    if (r.dijete) k.djeca[r.dijete] = true;
    if (r.kartica) k.kartica = true;
    if (!k.prva || r.datum < k.prva) { k.prva = r.datum; k.izvor = grupaIzvora_(r.izvor); }
    if (r.status === 'otkazan') k.otkazano++;
    else if (r.status === 'nije_dosao') k.nijeDosao++;
    else if (r.datum < danas) { k.posjete++; if (r.datum >= k.zadnja) { k.zadnja = r.datum; k.zadnjaUsluga = r.usluga; } }
    else k.predstoji++;
  });
  (vauceri || []).forEach(v => {
    if (!v.telefon) return;
    const k = uzmi(v.telefon);
    k.vauceri++;
    if (!k.roditelj && v.kupac) k.roditelj = v.kupac;
    if (v.dijete) k.djeca[v.dijete] = true;
    if (!k.prva && v.datum) { k.prva = v.datum; k.izvor = 'Vaučer'; }
  });
  return Object.keys(m).map(t => m[t]).sort((a, b) => (b.zadnja || b.prva).localeCompare(a.zadnja || a.prva));
}

function citajVaucere_() {
  const sh = tabela_().getSheetByName(LIST_VAUCERI);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, ZAGLAVLJE_VAUCERI.length).getValues().map(r => ({
    datum: datumTekst(r[0], CFG.TZ).slice(0, 10), vrsta: String(r[1] || ''), dijete: String(r[2] || ''),
    kupac: String(r[3] || ''), telefon: telefonIzTabele(r[4]),
  })).filter(v => v.telefon);
}

function citajRedoveKlijenata_(sh) {
  const n = sh.getLastRow();
  return n > 1 ? sh.getRange(2, 1, n - 1, ZAGLAVLJE_KLIJENTI.length).getValues() : [];
}

/** Red za tabelu: izračunato iz termina + ono što je osoblje ručno dopisalo u stari red. */
function redKlijenta_(k, stari) {
  const s = stari || [];
  const t = i => String(s[i] == null ? '' : s[i]).trim();
  const djeca = {};
  Object.keys(k.djeca).forEach(d => { djeca[d] = true; });
  t(KK['Djeca']).split(/\s*,\s*/).forEach(d => { if (d) djeca[d] = true; });
  return [k.telefon, k.roditelj || t(KK['Roditelj']), k.email || t(KK['Email']), Object.keys(djeca).join(', '),
    k.kartica || t(KK['Kartica']).toLowerCase() === 'da' ? 'da' : '', k.posjete, k.prva, k.zadnja, k.zadnjaUsluga,
    k.predstoji, k.nijeDosao, k.otkazano, k.vauceri, k.izvor || t(KK['Izvor']) || 'ručno', t(KK['Marketing']), t(KK['Napomena']), sadaTekst_()];
}

/** Cijeli list iznova (svaki sat, Postavi, meni). Ručno dodati klijenti bez termina ostaju. Vraća broj klijenata. */
function azurirajKlijente_() {
  const sh = listKlijenata_();
  const tz = CFG.TZ;
  const danas = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const stari = {};
  citajRedoveKlijenata_(sh).forEach(r => { const tel = telefonIzTabele(r[0]); if (tel) stari[tel] = r; });
  const klijenti = sastaviKlijente(citajTermine_(tz), citajVaucere_(), danas);
  const redovi = klijenti.map(k => redKlijenta_(k, stari[k.telefon]));
  const ima = {};
  klijenti.forEach(k => { ima[k.telefon] = true; });
  Object.keys(stari).forEach(tel => { if (!ima[tel]) { const r = stari[tel].slice(); r[0] = tel; redovi.push(r); } });
  const n = sh.getLastRow();
  if (n > 1) sh.getRange(2, 1, n - 1, ZAGLAVLJE_KLIJENTI.length).clearContent();
  sh.getRange('A:A').setNumberFormat('@');
  if (redovi.length) sh.getRange(2, 1, redovi.length, ZAGLAVLJE_KLIJENTI.length).setValues(redovi);
  return redovi.length;
}

/** Jedan klijent odmah poslije upisa, pomjeranja ili otkazivanja termina i poslije vaučera. Nikad ne ruši upis. */
function azurirajKlijenta_(tel) {
  try {
    if (!tel) return;
    const sh = listKlijenata_();
    const tz = CFG.TZ;
    const danas = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
    const k = sastaviKlijente(citajTermine_(tz).filter(r => r.telefon === tel), citajVaucere_().filter(v => v.telefon === tel), danas)[0];
    if (!k) return;
    const n = sh.getLastRow();
    const telefoni = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues().map(x => telefonIzTabele(x[0])) : [];
    const i = telefoni.indexOf(tel);
    const red = redKlijenta_(k, i >= 0 ? sh.getRange(i + 2, 1, 1, ZAGLAVLJE_KLIJENTI.length).getValues()[0] : null);
    if (i >= 0) sh.getRange(i + 2, 1, 1, red.length).setValues([red]); else sh.appendRow(red);
  } catch (e) {
    console.log('Klijent nije ažuriran: ' + e);
  }
}

/** Meni: Grasak > Osvjezi klijente (CRM). */
function osvjeziKlijente() {
  const n = azurirajKlijente_();
  SpreadsheetApp.getUi().alert('Klijenti: ' + n + ' brojeva telefona u listu "Klijenti".');
}

/** Telefoni ukucani rukom u tabelu: "067 338 777" -> +38267338777 (onEdit). */
function normalizujTelefoneUKoloni_(sh, kolona, red, n) {
  const r = sh.getRange(red, kolona, n, 1);
  const stare = r.getValues();
  let izmjena = false;
  const nove = stare.map(x => {
    const t = String(x[0] == null ? '' : x[0]).trim().replace(/^'/, '');
    if (!t || /[a-zA-Z]/.test(t)) return [t];            // nije broj (npr. tekst) - ne dira se
    const nt = normalizujTelefon(t);
    const rez = nt.replace(/\D/g, '').length >= 8 ? nt : t;
    if (rez !== String(x[0] == null ? '' : x[0])) izmjena = true;
    return [rez];
  });
  if (izmjena) r.setNumberFormat('@').setValues(nove);
}

/* ---------- panel: baza klijenata (vlasnik i administratori) ---------- */

function klijentIzReda_(r) {
  const t = i => String(r[i] == null ? '' : r[i]).trim();
  return {
    telefon: telefonIzTabele(r[0]), roditelj: t(1), email: t(2), djeca: t(3), kartica: t(4).toLowerCase() === 'da',
    posjete: Number(r[5]) || 0, prva: datumTekst(r[6], CFG.TZ), zadnja: datumTekst(r[7], CFG.TZ), zadnjaUsluga: t(8),
    predstoji: Number(r[9]) || 0, nijeDosao: Number(r[10]) || 0, otkazano: Number(r[11]) || 0, vauceri: Number(r[12]) || 0,
    izvor: t(13), marketing: t(14).toLowerCase(), napomena: t(15), azurirano: t(16),
  };
}

/** Lista za panel: pretraga po telefonu, roditelju, djeci, emailu, napomeni; filter: kartica | predstoji | nije_dosao | bez_emaila | marketing. */
function klijentiZaPanel_(o, q, filter) {
  if (o.uloga === 'frizer') throw new Error('Baza klijenata je za vlasnika i administratore.');
  const sh = tabela_().getSheetByName(LIST_KLIJENTI);
  const upit = String(q || '').trim().toLowerCase();
  const telUpit = upit.replace(/\D/g, '');
  const sve = (sh ? citajRedoveKlijenata_(sh) : []).map(klijentIzReda_).filter(k => k.telefon);
  const rez = sve.filter(k => {
    if (filter === 'kartica' && !k.kartica) return false;
    if (filter === 'predstoji' && !k.predstoji) return false;
    if (filter === 'nije_dosao' && !k.nijeDosao) return false;
    if (filter === 'bez_emaila' && k.email) return false;
    if (filter === 'marketing' && k.marketing !== 'da') return false;
    if (!upit) return true;
    return (telUpit.length >= 3 && k.telefon.replace(/\D/g, '').indexOf(telUpit) >= 0) ||
      [k.roditelj, k.djeca, k.email, k.napomena].join(' ').toLowerCase().indexOf(upit) >= 0;
  });
  return { ukupno: sve.length, nadjeno: rez.length, klijenti: rez.slice(0, MAX_KLIJENATA_PANEL) };
}

/** Upis ili izmjena iz panela: ručna polja. Nepoznat broj = novi klijent (npr. kad neko samo pita za cijenu). */
function sacuvajKlijenta_(o, z) {
  if (o.uloga === 'frizer') return { ok: false, poruka: 'Bazu klijenata mijenjaju vlasnik i administratori.' };
  const tel = normalizujTelefon(z.telefon);
  if (tel.replace(/\D/g, '').length < 10) return { ok: false, poruka: 'Upišite ispravan broj telefona.' };
  const email = String(z.email || '').trim().toLowerCase().slice(0, 80);
  if (email && !jeEmail(email)) return { ok: false, poruka: 'Email adresa nije ispravna.' };
  const sh = listKlijenata_();
  const n = sh.getLastRow();
  const telefoni = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues().map(x => telefonIzTabele(x[0])) : [];
  const i = telefoni.indexOf(tel);
  const red = i >= 0 ? sh.getRange(i + 2, 1, 1, ZAGLAVLJE_KLIJENTI.length).getValues()[0] : ZAGLAVLJE_KLIJENTI.map(() => '');
  red[0] = tel;
  red[KK['Roditelj']] = cist_(z.roditelj, 60);
  red[KK['Email']] = email;
  red[KK['Djeca']] = cist_(z.djeca, 120);
  red[KK['Kartica']] = (z.kartica === true || /^(da|true|1)$/i.test(String(z.kartica || ''))) ? 'da' : '';
  red[KK['Marketing']] = /^(da|ne)$/i.test(String(z.marketing || '')) ? String(z.marketing).toLowerCase() : '';
  red[KK['Napomena']] = cist_(z.napomena, 300);
  if (i < 0) {
    ['Posjete', 'Predstoji', 'Nije došao', 'Otkazano', 'Vaučeri'].forEach(kol => { red[KK[kol]] = 0; });
    red[KK['Izvor']] = 'ručno (' + o.ime + ')';
  }
  red[KK['Azurirano']] = sadaTekst_();
  if (i >= 0) sh.getRange(i + 2, 1, 1, red.length).setValues([red]); else sh.appendRow(red);
  return { ok: true, poruka: i >= 0 ? 'Sačuvano.' : 'Novi klijent upisan.', klijent: klijentIzReda_(red) };
}
