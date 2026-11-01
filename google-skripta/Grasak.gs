// Grašak - zakazivanje, vaučeri i panel za osoblje. Sve u jednom fajlu: zalijepiti u Apps Script (Extensions > Apps Script).
// Izvor: Kod.gs + Podesavanja.gs + Api.gs + Osoblje.gs

/**
 * Grašak - zakazivanje: Google Calendar + Sheets + SMS podsjetnici.
 *
 * Kako radi:
 * - Roditelji zakazuju na sajtu (grasaksalon.me/zakazi), osoblje u panelu (grasaksalon.me/osoblje).
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
};

const LIST_TERMINI = 'Termini';
const ZAGLAVLJE = ['ID', 'Datum', 'Vrijeme', 'Kraj', 'Lokacija', 'Frizer', 'Usluga', 'Dijete', 'Uzrast',
                   'Roditelj', 'Telefon', 'Napomena', 'Izvor', 'Status', 'Potvrda SMS', 'Podsjetnik SMS', 'Azurirano'];
const KOL = ZAGLAVLJE.reduce((o, k, i) => { o[k] = i; return o; }, {});   // indeks od 0
const STATUSI = ['zakazan', 'nije_dosao', 'otkazan'];

/* ---------- meni i postavljanje ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Grasak')
    .addItem('1. Postavi (i poslije svake nove verzije koda)', 'postavi')
    .addItem('Provjeri podesavanja', 'provjeriPodesavanja')
    .addItem('Osvjezi termine sada', 'sinhronizuj')
    .addItem('Posalji izvjestaj za proslu sedmicu', 'posaljiSedmicniIzvjestaj')
    .addItem('Posalji probni SMS meni', 'probniSms')
    .addToUi();
}

function postavi() {
  kreirajListovePodesavanja_();
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(LIST_TERMINI);
  if (!sh) sh = ss.insertSheet(LIST_TERMINI);
  sh.getRange('A:Q').setNumberFormat('@'); // tekst: datumi, vremena i +382 brojevi ostaju kako su upisani
  sh.getRange(1, 1, 1, ZAGLAVLJE.length).setValues([ZAGLAVLJE]).setFontWeight('bold').setBackground('#e7f5e4');
  sh.setFrozenRows(1);

  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sinhronizuj').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('posaljiPodsjetnike').timeBased().everyDays(1).atHour(CFG.SAT_PODSJETNIKA).inTimezone(CFG.TZ).create();
  ScriptApp.newTrigger('posaljiSedmicniIzvjestaj').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).inTimezone(CFG.TZ).create();
  sinhronizuj();
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
  r[KOL['Telefon']] = izvuciTelefon(poljeIzOpisa(opis, 'Telefon') || opis);
  r[KOL['Napomena']] = poljeIzOpisa(opis, 'Napomena');
  r[KOL['Izvor']] = poljeIzOpisa(opis, 'Izvor') || 'kalendar';
  r[KOL['Status']] = ev.getTag('status') || 'zakazan';
  r[KOL['Potvrda SMS']] = ev.getTag('potvrda') || '';
  r[KOL['Podsjetnik SMS']] = ev.getTag('podsjetnik') || '';
  r[KOL['Azurirano']] = sadaTekst_();
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
    vidjeni[red[0]] = true;
    if (red[0] in indeks) redovi[indeks[red[0]]] = red;
    else { indeks[red[0]] = redovi.length; redovi.push(red); }
  });

  redovi.forEach(r => {
    const d = datumTekst(r[KOL['Datum']], tz);
    if (!vidjeni[r[0]] && d >= danas && r[KOL['Status']] !== 'otkazan') {
      r[KOL['Status']] = 'otkazan';
      r[KOL['Azurirano']] = sadaTekst_();
    }
  });

  if (redovi.length) sh.getRange(2, 1, redovi.length, ZAGLAVLJE.length).setValues(redovi);
}

function datumTekst(v, tz) {
  return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || '');
}

function vrijemeTekst(v, tz) {
  return v instanceof Date ? Utilities.formatDate(v, tz, 'HH:mm') : String(v || '');
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
    if (!n || jeBlokada(n.usluga) || ev.getTag('podsjetnik') || ev.getTag('status') === 'otkazan') return;
    const tel = izvuciTelefon(poljeIzOpisa(ev.getDescription(), 'Telefon') || ev.getDescription());
    if (!tel) return;
    const vrijeme = Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm');
    const lok = lokPoFrizeru[n.frizer.toLowerCase()] || {};
    if (posaljiSms(tel, tekstPodsjetnika(vrijeme, n.frizer, lok.telefon))) ev.setTag('podsjetnik', 'poslat');
  });
  sinhronizuj();
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

/** "Nikola - Šišanje (Ana Petrović)" -> {frizer, usluga, klijent} */
function rastaviNaslov(naslov) {
  const m = String(naslov || '').match(/^\s*([^-()]+?)\s+-\s+([^()]+?)\s*(?:\((.*)\))?\s*$/);
  if (!m) return null;
  return { frizer: m[1], usluga: m[2], klijent: m[3] || '' };
}

/** Događaj koji zauzima vrijeme frizera, ali nije termin: "Nikola - Pauza", "Nikola - Odmor"... */
function jeBlokada(usluga) {
  return /^(pauza|odmor|bolovanje|slobodan|blokirano|zatvoreno|godišnji|godisnji)/i.test(String(usluga || '').trim());
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

function normalizujTelefon(s) {
  let t = String(s || '').replace(/[^\d+]/g, '');
  if (!t) return '';
  if (t.startsWith('00')) t = '+' + t.slice(2);
  if (t.startsWith('0')) t = CFG.POZIVNI + t.slice(1);
  if (!t.startsWith('+')) t = CFG.POZIVNI + t;
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
 * List "Osoblje":  Ime | Uloga (vlasnik/admin/frizer) | Lokacija (prazno = sve) | PIN | Email | Aktivan
 *   PIN je lična šifra za panel grasaksalon.me/osoblje (najmanje 4 cifre, svako svoju).
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

function tabela_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

function kreirajListovePodesavanja_() {
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
    [LIST_OSOBLJE]: [['Ime', 'Uloga', 'Lokacija', 'PIN', 'Email', 'Aktivan'],
                     ['Kristina', 'vlasnik', '', 'UPISATI PIN', 'grasaksalon@gmail.com', 'DA'],
                     ['Nikola', 'frizer', 'Grašak Podgorica', 'UPISATI PIN', '', 'DA']],
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

function ucitajPodesavanja() {
  const ss = tabela_();
  const citaj = ime => { const sh = ss.getSheetByName(ime); return sh ? sh.getDataRange().getValues().slice(1) : []; };
  return sastaviPodesavanja(citaj(LIST_LOK), citaj(LIST_FRIZ), citaj(LIST_USL));
}

/** Praznici i posebni neradni dani; bez lista "Praznici" važe zakonski. */
function ucitajNeradne(lokacije) {
  const ss = tabela_();
  const pr = ss.getSheetByName(LIST_PRAZNICI), nr = ss.getSheetByName(LIST_NERADNI);
  return sastaviNeradne(pr ? pr.getDataRange().getValues().slice(1) : ZAKONSKI_PRAZNICI,
    nr ? nr.getDataRange().getValues().slice(1) : [], lokacije || ucitajPodesavanja().lokacije);
}

function ucitajOsoblje(lokacije) {
  const sh = tabela_().getSheetByName(LIST_OSOBLJE);
  return sastaviOsoblje(sh ? sh.getDataRange().getValues().slice(1) : [], lokacije || ucitajPodesavanja().lokacije);
}

/** Meni: Kristina provjeri da li je sve ispravno upisano. */
function provjeriPodesavanja() {
  const p = ucitajPodesavanja();
  const os = ucitajOsoblje(p.lokacije);
  const nr = ucitajNeradne(p.lokacije);
  p.greske = p.greske.concat(os.greske, nr.greske);
  const dani = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];
  const linije = p.lokacije.map(l => '• ' + l.naziv + ': ' + (l.osobe.join(', ') || 'NEMA FRIZERA') + ' | ' +
    [1, 2, 3, 4, 5, 6, 0].map(d => dani[d] + ' ' + (l.radno[d] ? l.radno[d].join('-') : 'ne radi')).join(', '));
  linije.push('', 'Usluge: ' + p.usluge.map(u => u.naziv + ' ' + u.trajanje + ' min').join(', '));
  linije.push('', 'Osoblje (panel grasaksalon.me/osoblje): ' + (os.osoblje.map(o => o.ime + ' - ' + o.uloga +
    (o.lokacijaId ? ', ' + o.lokacijaNaziv : ', sve lokacije')).join('; ') || 'NIKO'));
  if (os.bezPina.length) linije.push('Bez PIN-a (ne mogu u panel): ' + os.bezPina.join(', '));
  const danas = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd');
  const lok0 = p.lokacije[0] ? p.lokacije[0].naziv : '';
  const sl = neradniUPeriodu(danas, dodajDane(danas, 365), nr.praznici, nr.posebni, lok0);
  linije.push('', 'Neradni dani u narednih godinu dana: ' +
    (Object.keys(sl).sort().map(d => d.slice(8, 10) + '.' + d.slice(5, 7) + '. ' + sl[d]).join(', ') || 'nema'));
  if (p.greske.length) linije.push('', 'ISPRAVITI:', ...p.greske.map(g => '• ' + g));
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
  const greske = [], osoblje = [], pinovi = {}, bezPina = [];
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
    const pin = String(r[3] == null ? '' : r[3]).trim();
    if (!/\d/.test(pin)) { bezPina.push(ime); return; } // prazno ili "UPISATI PIN": nema pristup panelu
    if (!/^\d{4,8}$/.test(pin)) { greske.push(red + 'PIN mora imati 4 do 8 cifara'); return; }
    if (pinovi[pin]) { greske.push(red + 'isti PIN kao ' + pinovi[pin] + ' - svako mora imati svoj'); return; }
    pinovi[pin] = ime;
    osoblje.push({ ime: ime, uloga: uloga, lokacijaId: lokacijaId, lokacijaNaziv: lokacijaNaziv, pin: pin,
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
  const p = e.parameter || {};
  try {
    if (p.akcija === 'konfig') return json_(javnaKonfig_());
    if (p.akcija === 'slotovi') return json_({ slotovi: slotoviZaDan_(p.lok, p.osoba, p.usluga, p.datum) });
    return json_({ greska: 'Nepoznata akcija' });
  } catch (err) {
    return json_({ greska: String(err.message || err) });
  }
}

function doPost(e) {
  let z;
  try { z = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, poruka: 'Neispravan zahtjev' }); }
  if (String(z.akcija || '').indexOf('osoblje_') === 0) {
    try { return json_(osobljeAkcija_(z)); } catch (err) { return json_({ ok: false, poruka: String(err.message || err) }); }
  }
  if (z.akcija === 'vaucer') {
    try { return json_(vaucer_(z)); } catch (err) { return json_({ ok: false, poruka: String(err.message || err) }); }
  }
  if (z.akcija !== 'zakazi') return json_({ ok: false, poruka: 'Nepoznata akcija' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, poruka: 'Sistem je zauzet, pokušajte ponovo.' });
  try {
    return json_(zakazi_(z));
  } catch (err) {
    return json_({ ok: false, poruka: String(err.message || err) });
  } finally {
    lock.releaseLock();
  }
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

function zakazi_(z) {
  const lok = lokacija_(z.lok);
  const u = usluga_(z.usluga);
  const telefon = normalizujTelefon(z.telefon);
  const cist = (v, n) => String(v || '').replace(/[()\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  const dijete = cist(z.dijete, 60);
  const roditelj = cist(z.roditelj, 60);
  const uzrast = cist(z.uzrast, 10);
  const napomena = cist(z.napomena, 300);
  if (!dijete || !roditelj) return { ok: false, poruka: 'Upišite ime i prezime djeteta i roditelja.' };
  if (telefon.replace(/\D/g, '').length < 10) return { ok: false, poruka: 'Upišite ispravan broj telefona.' };

  const slot = slotoviZaDan_(z.lok, z.osoba, z.usluga, z.datum).find(s => s.vrijeme === z.vrijeme);
  if (!slot || !slot.slobodno) return { ok: false, poruka: 'Termin je upravo zauzet. Izaberite drugi.' };

  const tz = CFG.TZ;
  const pocetak = Utilities.parseDate(z.datum + ' ' + z.vrijeme, tz, 'yyyy-MM-dd HH:mm');
  const kraj = new Date(pocetak.getTime() + u.trajanje * 60000);
  const ev = kal_().createEvent(z.osoba + ' - ' + u.naziv + ' (' + dijete + ')', pocetak, kraj, {
    description: 'Roditelj: ' + roditelj + '\nTelefon: ' + telefon + '\nUzrast: ' + (uzrast || '-') +
      '\nNapomena: ' + (napomena || '-') + '\nIzvor: sajt',
  });

  if (posaljiSms(telefon, tekstPotvrde(z.datum, z.vrijeme, z.osoba, lok.telefon))) ev.setTag('potvrda', 'poslat');
  upisiTermin_(ev);
  return { ok: true, poruka: 'Termin je zakazan. Potvrda stiže SMS-om.' };
}

/** Narudžba poklon vaučera: red u listu "Vaučeri" + SMS kupcu. Kristina se javlja kupcu za preuzimanje. */
function vaucer_(z) {
  const cist = (v, n) => String(v || '').replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  const vrsta = cist(z.vrsta, 60), dijete = cist(z.dijete, 60), kupac = cist(z.kupac, 60), napomena = cist(z.napomena, 300);
  const telefon = normalizujTelefon(z.telefon);
  if (!vrsta || !dijete || !kupac) return { ok: false, poruka: 'Popunite vrstu vaučera, ime djeteta i vaše ime.' };
  if (telefon.replace(/\D/g, '').length < 10) return { ok: false, poruka: 'Upišite ispravan broj telefona.' };
  const sh = tabela_().getSheetByName(LIST_VAUCERI) || tabela_().insertSheet(LIST_VAUCERI);
  if (sh.getLastRow() === 0) sh.appendRow(ZAGLAVLJE_VAUCERI);
  sh.appendRow([sadaTekst_(), vrsta, dijete, kupac, telefon, napomena, 'novo']);
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
 * Grašak - panel za osoblje (grasaksalon.me/osoblje). Prijava ličnim PIN-om iz lista "Osoblje".
 *
 * vlasnik (Kristina): sve lokacije, pregled dana, upis termina, statusi, izvještaji, sedmični email.
 * admin:              isto, za sve lokacije ili samo svoju (kolona Lokacija).
 * frizer:             pregled dana svoje lokacije, upis termina kad neko zove, nije došao / otkazano, napomena.
 *
 * Sve akcije idu preko POST-a (PIN se nikad ne šalje u adresi).
 */

const PIN_MAX_GRESAKA = 20;   // pogrešnih PIN-ova u 15 minuta, za sve zajedno - zaštita od pogađanja

function osobljeAkcija_(z) {
  const p = ucitajPodesavanja();
  const o = prijava_(z.pin, p.lokacije);
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

function prijava_(pin, lokacije) {
  const cache = CacheService.getScriptCache();
  const greske = Number(cache.get('pin_greske') || 0);
  if (greske >= PIN_MAX_GRESAKA) throw new Error('Previše pogrešnih pokušaja. Sačekajte 15 minuta.');
  const o = ucitajOsoblje(lokacije).osoblje.find(x => x.pin === String(pin || '').trim());
  if (!o) {
    cache.put('pin_greske', String(greske + 1), 900);
    Utilities.sleep(800);
    throw new Error('Pogrešan PIN.');
  }
  return o;
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
  return String(v || '').replace(/[()\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
}

/* ---------- pregled dana ---------- */

function danPregled_(o, p, lokId, datum) {
  const lok = dozvoljenaLok_(o, p, lokId);
  provjeriDatum_(datum);
  const tz = CFG.TZ;
  const od = Utilities.parseDate(datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const dogadjaji = kal_().getEvents(od, Utilities.parseDate(dodajDane(datum, 1) + ' 00:00', tz, 'yyyy-MM-dd HH:mm'));
  const nr = ucitajNeradne(p.lokacije);
  const neradni = neradniUPeriodu(datum, datum, nr.praznici, nr.posebni, lok.naziv)[datum] || '';
  const radno = neradni ? null : lok.radno[danUSedmici(datum)] || null;

  const osobe = lok.osobe.map(ime => {
    const termini = [], blokade = [];
    dogadjaji.forEach(ev => {
      const n = rastaviNaslov(ev.getTitle());
      if (!n || n.frizer.toLowerCase() !== ime.toLowerCase()) return;
      const cijeli = ev.isAllDayEvent();
      const s = cijeli ? 0 : Math.max(0, Math.round((ev.getStartTime() - od) / 60000));
      const k = cijeli ? 1440 : Math.min(1440, Math.round((ev.getEndTime() - od) / 60000));
      if (cijeli || jeBlokada(n.usluga)) { blokade.push({ od: s, do: k, naziv: n.usluga }); return; }
      const opis = ev.getDescription();
      termini.push({
        id: ev.getId(), od: s, do: k, usluga: n.usluga, dijete: n.klijent,
        uzrast: poljeIzOpisa(opis, 'Uzrast'), roditelj: poljeIzOpisa(opis, 'Roditelj'),
        telefon: izvuciTelefon(poljeIzOpisa(opis, 'Telefon') || opis), napomena: poljeIzOpisa(opis, 'Napomena'),
        izvor: poljeIzOpisa(opis, 'Izvor') || 'kalendar', status: ev.getTag('status') || 'zakazan',
      });
    });
    return Object.assign({ ime: ime }, rasporedDana(radno, APP.KORAK_MIN, termini, blokade));
  });
  return { datum: datum, lokacija: lok.id, radno: radno, neradni: neradni, osobe: osobe };
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
        '\nIzvor: telefon - ' + o.ime,
    });
  potvrdiAkoTreba_(ev, lokPoFrizeru_(), tz);
  upisiTermin_(ev);
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
  if (status === 'otkazan') {
    const red = redZaDogadjaj_(ev, lokPoFrizeru_(), CFG.TZ);
    red[KOL['Status']] = 'otkazan';
    red[KOL['Napomena']] = (red[KOL['Napomena']] ? red[KOL['Napomena']] + ' | ' : '') + 'otkazao: ' + o.ime;
    upisiRed_(red);
    ev.deleteEvent(); // termin se oslobađa za sajt i za kalendar
    return { ok: true, poruka: 'Termin je otkazan, vrijeme je ponovo slobodno.' };
  }
  ev.setTag('status', status);
  upisiTermin_(ev);
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

/** Podešavanja kako su upisana u tabeli; PIN-ovi se ne šalju, samo da li postoje. */
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
      red: i, ime: t(r[0]), uloga: t(r[1]).toLowerCase(), lokacija: t(r[2]), imaPin: /^\d{4,8}$/.test(t(r[3])),
      email: t(r[4]), aktivan: da(r[5]),
    })),
  };
}

/** Provjeri sve kao "Provjeri podesavanja", pa upiši u tabelu. Prazan PIN = ostaje stari. */
function sacuvajPodesavanja_(o, s) {
  if (!s || typeof s !== 'object') return { ok: false, poruka: 'Neispravni podaci.' };
  const t = (v, n) => String(v == null ? '' : v).replace(/[\r\n]/g, ' ').trim().slice(0, n);
  const niz = x => (Array.isArray(x) ? x.slice(0, 200) : []);
  const stari = citajList_(LIST_OSOBLJE, 6);
  const lok = niz(s.lokacije).map(l => [t(l.naziv, 60), t(l.adresa, 120), t(l.telefon, 30)]
    .concat(niz(l.dani).concat(['', '', '', '', '', '', '']).slice(0, 7).map(d => t(d, 20)))).filter(r => r[0]);
  const friz = niz(s.frizeri).map(f => [t(f.ime, 40), t(f.lokacija, 60), f.aktivan === false ? 'NE' : 'DA']).filter(r => r[0]);
  const usl = niz(s.usluge).map(u => [t(u.naziv, 60), Number(u.trajanje) || 0, u.aktivna === false ? 'NE' : 'DA']).filter(r => r[0]);
  const prz = niz(s.praznici).map(x => [t(x.naziv, 60), t(x.datum, 10), Number(x.dana) === 2 ? 2 : 1, x.neradni === false ? 'NE' : 'DA']).filter(r => r[0]);
  const nrd = niz(s.neradniDani).map(x => [t(x.datum, 12), t(x.razlog, 80), t(x.lokacija, 60)]).filter(r => r[0]);
  const osb = niz(s.osoblje).map(x => {
    const stariPin = Number.isInteger(x.red) && stari[x.red] ? t(stari[x.red][3], 8) : '';
    return [t(x.ime, 40), t(x.uloga, 10).toLowerCase(), t(x.lokacija, 60), t(x.pin, 8) || stariPin,
            t(x.email, 80), x.aktivan === false ? 'NE' : 'DA'];
  }).filter(r => r[0]);

  const p = sastaviPodesavanja(lok, friz, usl);
  const os = sastaviOsoblje(osb, p.lokacije);
  const nr = sastaviNeradne(prz, nrd, p.lokacije);
  const greske = p.greske.concat(os.greske, nr.greske);
  if (!p.lokacije.length) greske.push('Mora postojati bar jedna lokacija.');
  if (!p.usluge.length) greske.push('Mora postojati bar jedna aktivna usluga.');
  if (!os.osoblje.some(x => x.uloga === 'vlasnik')) greske.push('Mora ostati bar jedan aktivan vlasnik s PIN-om, inače niko ne može u podešavanja.');
  if (greske.length) return { ok: false, poruka: 'Nije sačuvano. Ispravite:', greske: greske };

  upisiList_(LIST_LOK, lok, 10, 'C:J');
  upisiList_(LIST_FRIZ, friz, 3);
  upisiList_(LIST_USL, usl, 3);
  upisiList_(LIST_OSOBLJE, osb, 6, 'D:D');
  upisiList_(LIST_PRAZNICI, prz, 4, 'B:B');
  upisiList_(LIST_NERADNI, nrd.map(r => [parsirajDatum(r[0]), r[1], r[2]]), 3, 'A:A');
  return {
    ok: true,
    poruka: 'Sačuvano. Sajt i panel već rade s novim podešavanjima.' +
      (os.bezPina.length ? ' Bez PIN-a (ne mogu u panel): ' + os.bezPina.join(', ') + '.' : ''),
    odjava: !os.osoblje.some(x => x.pin === o.pin),
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
    telefon: String(r[KOL['Telefon']] || ''), izvor: String(r[KOL['Izvor']] || ''),
    status: String(r[KOL['Status']] || 'zakazan'),
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
      if (stanje === 'blokada') slot.naziv = blok.naziv;
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
    '<p style="color:#888">Detalji: grasaksalon.me/osoblje > Izvještaj</p></div>';
}

