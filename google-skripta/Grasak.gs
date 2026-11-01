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
  ScriptApp.newTrigger('posaljiPodsjetnike').timeBased().everyDays(1).atHour(CFG.SAT_PODSJETNIKA).create();
  ScriptApp.newTrigger('posaljiSedmicniIzvjestaj').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  sinhronizuj();
}

function kal_() {
  return CalendarApp.getCalendarById(CFG.KALENDAR_ID) || CalendarApp.getDefaultCalendar();
}

function sadaTekst_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
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
  const red = redZaDogadjaj_(ev, lokPoFrizeru_(), Session.getScriptTimeZone());
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
  const tz = Session.getScriptTimeZone();
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
  const tz = Session.getScriptTimeZone();
  const sjutra = new Date(); sjutra.setDate(sjutra.getDate() + 1); sjutra.setHours(0, 0, 0, 0);
  const prekosjutra = new Date(sjutra.getTime() + 864e5);
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
 * Šalje SMS preko Android telefona salona (aplikacija "SMS Gateway for Android", sms-gate.app).
 * Script Properties: SMS_URL, SMS_USER, SMS_PASS. Bez SMS_URL radi probni režim (samo log).
 */
function posaljiSms(tel, tekst) {
  const p = PropertiesService.getScriptProperties();
  const url = p.getProperty('SMS_URL');
  if (!url) { console.log('PROBNI REZIM, SMS nije poslat: ' + tel + ' | ' + tekst); return false; }
  try {
    const odg = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Basic ' +
        Utilities.base64Encode(p.getProperty('SMS_USER') + ':' + p.getProperty('SMS_PASS')) },
      payload: JSON.stringify({ message: tekst, phoneNumbers: [tel] }),
      muteHttpExceptions: true,
    });
    const ok = odg.getResponseCode() < 300;
    if (!ok) console.log('SMS greska ' + odg.getResponseCode() + ': ' + odg.getContentText());
    return ok;
  } catch (e) {
    console.log('SMS greska: ' + e);
    return false;
  }
}

function probniSms() {
  const tel = SpreadsheetApp.getUi().prompt('Tvoj broj telefona:').getResponseText();
  const ok = posaljiSms(normalizujTelefon(tel), CFG.SALON + ': probna poruka. Sistem radi.');
  SpreadsheetApp.getUi().alert(ok ? 'Poslato.' : 'Nije poslato - vidi Executions log.');
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
 * List "Osoblje":  Ime | Uloga (vlasnik/admin/frizer) | Lokacija (prazno = sve) | PIN | Email | Aktivan
 *   PIN je lična šifra za panel grasaksalon.me/osoblje (najmanje 4 cifre, svako svoju).
 *
 * Nova lokacija = novi red u "Lokacije". Novi frizer = novi red u "Frizeri".
 * Promjena se vidi u aplikaciji odmah, bez ponovnog objavljivanja.
 */

const LIST_LOK = 'Lokacije', LIST_FRIZ = 'Frizeri', LIST_USL = 'Usluge';
const LIST_VAUCERI = 'Vauceri';
const LIST_OSOBLJE = 'Osoblje';
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

function ucitajOsoblje(lokacije) {
  const sh = tabela_().getSheetByName(LIST_OSOBLJE);
  return sastaviOsoblje(sh ? sh.getDataRange().getValues().slice(1) : [], lokacije || ucitajPodesavanja().lokacije);
}

/** Meni: Kristina provjeri da li je sve ispravno upisano. */
function provjeriPodesavanja() {
  const p = ucitajPodesavanja();
  const os = ucitajOsoblje(p.lokacije);
  p.greske = p.greske.concat(os.greske);
  const dani = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];
  const linije = p.lokacije.map(l => '• ' + l.naziv + ': ' + (l.osobe.join(', ') || 'NEMA FRIZERA') + ' | ' +
    [1, 2, 3, 4, 5, 6, 0].map(d => dani[d] + ' ' + (l.radno[d] ? l.radno[d].join('-') : 'ne radi')).join(', '));
  linije.push('', 'Usluge: ' + p.usluge.map(u => u.naziv + ' ' + u.trajanje + ' min').join(', '));
  linije.push('', 'Osoblje (panel grasaksalon.me/osoblje): ' + (os.osoblje.map(o => o.ime + ' - ' + o.uloga +
    (o.lokacijaId ? ', ' + o.lokacijaNaziv : ', sve lokacije')).join('; ') || 'NIKO'));
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
  const greske = [], osoblje = [], pinovi = {};
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
    if (!/^\d{4,8}$/.test(pin)) { greske.push(red + 'PIN mora imati 4 do 8 cifara'); return; }
    if (pinovi[pin]) { greske.push(red + 'isti PIN kao ' + pinovi[pin] + ' - svako mora imati svoj'); return; }
    pinovi[pin] = ime;
    osoblje.push({ ime: ime, uloga: uloga, lokacijaId: lokacijaId, lokacijaNaziv: lokacijaNaziv, pin: pin,
                   email: String(r[4] || '').trim() });
  });
  return { osoblje: osoblje, greske: greske };
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
  return {
    naziv: APP.NAZIV, osoba: APP.OSOBA, korak: APP.KORAK_MIN, danaUnaprijed: APP.DANA_UNAPRIJED,
    usluge: p.usluge,
    lokacije: p.lokacije.filter(l => l.osobe.length)
      .map(l => ({ id: l.id, naziv: l.naziv, adresa: l.adresa, osobe: l.osobe, radno: l.radno })),
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
  const tz = Session.getScriptTimeZone();
  const od = Utilities.parseDate(datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const do_ = new Date(od.getTime() + 864e5);
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
  const tz = Session.getScriptTimeZone();
  const dan = Number(Utilities.formatDate(Utilities.parseDate(datum, tz, 'yyyy-MM-dd'), tz, 'u')) % 7;
  const sada = new Date();
  const danas = Utilities.formatDate(sada, tz, 'yyyy-MM-dd');
  const sadaMin = Number(Utilities.formatDate(sada, tz, 'H')) * 60 + Number(Utilities.formatDate(sada, tz, 'm'));
  const zadnji = Utilities.formatDate(new Date(sada.getTime() + APP.DANA_UNAPRIJED * 864e5), tz, 'yyyy-MM-dd');
  if (datum < danas || datum > zadnji) return [];
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

  const tz = Session.getScriptTimeZone();
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
  const tz = Session.getScriptTimeZone();
  const od = Utilities.parseDate(datum + ' 00:00', tz, 'yyyy-MM-dd HH:mm');
  const dogadjaji = kal_().getEvents(od, new Date(od.getTime() + 864e5));
  const radno = lok.radno[danUSedmici(datum)] || null;

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
  return { datum: datum, lokacija: lok.id, radno: radno, osobe: osobe };
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
  const tz = Session.getScriptTimeZone();
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
    const red = redZaDogadjaj_(ev, lokPoFrizeru_(), Session.getScriptTimeZone());
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

/* ---------- izvještaji ---------- */

function izvjestajZaPeriod_(o, p, od, do_, lokId) {
  provjeriDatum_(od); provjeriDatum_(do_);
  if (od > do_) throw new Error('Datum "od" je poslije datuma "do".');
  if (dodajDane(od, 400) < do_) throw new Error('Period može biti najviše 400 dana.');
  let lokacije = dozvoljeneLokacije_(o, p);
  if (lokId) lokacije = [dozvoljenaLok_(o, p, lokId)];
  sinhronizuj();
  const tz = Session.getScriptTimeZone();
  const sve = lokacije.length === p.lokacije.length;
  return izracunajIzvjestaj(citajTermine_(tz), lokacije, blokadeZaPeriod_(od, do_, tz), od, do_,
    Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'), uMinute(Utilities.formatDate(new Date(), tz, 'HH:mm')),
    APP.KORAK_MIN, sve);
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
  const tz = Session.getScriptTimeZone();
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
function izracunajIzvjestaj(redovi, lokacije, blokade, od, do_, danas, sadaMin, korak, sveLokacije) {
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
      if (!radno) return;
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

