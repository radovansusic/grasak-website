// Grašak - zakazivanje i vaučeri. Sve u jednom fajlu: zalijepiti u Apps Script (Extensions > Apps Script).
// Izvor: Eksterni Mozak 02-PROJEKTI/grasak-zakazivanje (Kod.gs + Podesavanja.gs + Api.gs)

/**
 * Grašak - zakazivanje: Google Calendar + Sheets + SMS podsjetnici.
 *
 * Kako radi:
 * - Roditelji zakazuju preko Google Calendar stranice za zakazivanje (bez logovanja).
 * - Svi termini padaju u kalendar salona; frizeri ga vide u svom Google Calendar-u.
 * - Skripta svakih sat vremena prepisuje termine u tabelu "Termini" (Drive),
 *   šalje SMS potvrdu za novi termin i SMS podsjetnik dan ranije.
 *
 * Naziv rasporeda za zakazivanje mora biti "Frizer - Usluga", npr. "Nikola - Šišanje".
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
const ZAGLAVLJE = ['ID', 'Datum', 'Vrijeme', 'Lokacija', 'Frizer', 'Usluga', 'Dijete', 'Uzrast',
                   'Roditelj', 'Telefon', 'Napomena', 'Status', 'Potvrda SMS', 'Podsjetnik SMS', 'Azurirano'];
const KOL_STATUS = ZAGLAVLJE.indexOf('Status');      // indeks od 0
const KOL_POTVRDA = ZAGLAVLJE.indexOf('Potvrda SMS');

/* ---------- meni i postavljanje ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Grasak')
    .addItem('1. Postavi (jednom)', 'postavi')
    .addItem('Provjeri podesavanja', 'provjeriPodesavanja')
    .addItem('Osvjezi termine sada', 'sinhronizuj')
    .addItem('Posalji probni SMS meni', 'probniSms')
    .addToUi();
}

function postavi() {
  kreirajListovePodesavanja_();
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(LIST_TERMINI);
  if (!sh) sh = ss.insertSheet(LIST_TERMINI);
  sh.getRange(1, 1, 1, ZAGLAVLJE.length).setValues([ZAGLAVLJE]).setFontWeight('bold');
  sh.setFrozenRows(1);

  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sinhronizuj').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('posaljiPodsjetnike').timeBased().everyDays(1)
    .atHour(CFG.SAT_PODSJETNIKA).create();
  sinhronizuj();
}

/* ---------- sinhronizacija kalendar -> tabela ---------- */

function sinhronizuj() {
  const kal = CalendarApp.getCalendarById(CFG.KALENDAR_ID) || CalendarApp.getDefaultCalendar();
  const sada = new Date();
  const do_ = new Date(sada.getTime() + CFG.DANA_UNAPRIJED * 864e5);
  const dogadjaji = kal.getEvents(sada, do_);

  const sh = tabela_().getSheetByName(LIST_TERMINI);
  const lokPoFrizeru = {};
  ucitajPodesavanja().lokacije.forEach(l => l.osobe.forEach(o => { lokPoFrizeru[o] = l; }));
  const podaci = sh.getDataRange().getValues();
  const redPoId = {};
  for (let i = 1; i < podaci.length; i++) redPoId[podaci[i][0]] = i + 1;

  const vidjeni = {};
  const tz = Session.getScriptTimeZone();

  dogadjaji.forEach(ev => {
    const n = rastaviNaslov(ev.getTitle());
    if (!n) return; // nije termin iz zakazivanja
    const id = ev.getId();
    vidjeni[id] = true;
    const tel = izvuciTelefon(ev.getDescription());
    const lok = lokPoFrizeru[n.frizer] || {};
    const opis = ev.getDescription();
    const red = [
      id,
      Utilities.formatDate(ev.getStartTime(), tz, 'yyyy-MM-dd'),
      Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm'),
      lok.naziv || '', n.frizer, n.usluga, n.klijent,
      poljeIzOpisa(opis, 'Uzrast'), poljeIzOpisa(opis, 'Roditelj'), tel, poljeIzOpisa(opis, 'Napomena'),
      'zakazan', ev.getTag('potvrda') || '', ev.getTag('podsjetnik') || '',
      new Date(),
    ];

    if (!ev.getTag('potvrda') && tel) {
      const ok = posaljiSms(tel, tekstPotvrde(red[1], red[2], n.frizer, lok.telefon));
      if (ok) { ev.setTag('potvrda', 'poslat'); red[KOL_POTVRDA] = 'poslat'; }
    }

    if (redPoId[id]) sh.getRange(redPoId[id], 1, 1, red.length).setValues([red]);
    else { sh.appendRow(red); redPoId[id] = sh.getLastRow(); }
  });

  // budući termini kojih više nema u kalendaru = otkazani
  const danas = Utilities.formatDate(sada, tz, 'yyyy-MM-dd');
  for (let i = 1; i < podaci.length; i++) {
    const id = podaci[i][0], datum = podaci[i][1], status = podaci[i][KOL_STATUS];
    const d = datum instanceof Date ? Utilities.formatDate(datum, tz, 'yyyy-MM-dd') : String(datum);
    if (!vidjeni[id] && d >= danas && status === 'zakazan') {
      sh.getRange(i + 1, KOL_STATUS + 1).setValue('otkazan');
    }
  }
}

/* ---------- podsjetnici ---------- */

function posaljiPodsjetnike() {
  const kal = CalendarApp.getCalendarById(CFG.KALENDAR_ID) || CalendarApp.getDefaultCalendar();
  const tz = Session.getScriptTimeZone();
  const sjutra = new Date(); sjutra.setDate(sjutra.getDate() + 1); sjutra.setHours(0, 0, 0, 0);
  const prekosjutra = new Date(sjutra.getTime() + 864e5);
  const lokPoFrizeru = {};
  ucitajPodesavanja().lokacije.forEach(l => l.osobe.forEach(o => { lokPoFrizeru[o] = l; }));

  kal.getEvents(sjutra, prekosjutra).forEach(ev => {
    const n = rastaviNaslov(ev.getTitle());
    const tel = izvuciTelefon(ev.getDescription());
    if (!n || !tel || ev.getTag('podsjetnik')) return;
    const vrijeme = Utilities.formatDate(ev.getStartTime(), tz, 'HH:mm');
    const lok = lokPoFrizeru[n.frizer] || {};
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

/** "Roditelj: Ana Petrović" iz opisa događaja -> "Ana Petrović" ("-" -> prazno) */
function poljeIzOpisa(opis, kljuc) {
  const m = String(opis || '').match(new RegExp('^' + kljuc + ':\\s*(.*)$', 'mi'));
  const v = m ? m[1].trim() : '';
  return v === '-' ? '' : v;
}

/** Pronalazi prvi broj telefona u opisu događaja i vraća ga u formatu +382... */
function izvuciTelefon(opis) {
  const m = String(opis || '').match(/(\+|00)?\d[\d\s\/().-]{6,}\d/);
  return m ? normalizujTelefon(m[0]) : '';
}

function normalizujTelefon(s) {
  let t = String(s || '').replace(/[^\d+]/g, '');
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
 *
 * Nova lokacija = novi red u "Lokacije". Novi frizer = novi red u "Frizeri".
 * Promjena se vidi u aplikaciji odmah, bez ponovnog objavljivanja.
 */

const LIST_LOK = 'Lokacije', LIST_FRIZ = 'Frizeri', LIST_USL = 'Usluge';
const LIST_VAUCERI = 'Vauceri';
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
    [LIST_VAUCERI]: [ZAGLAVLJE_VAUCERI, ['', '', '', '', '', '', '']],
  };
  Object.keys(primjeri).forEach(ime => {
    if (ss.getSheetByName(ime)) return; // postojeće podešavanje se ne dira
    const sh = ss.insertSheet(ime);
    const v = primjeri[ime];
    // obični tekst: inače Sheets "9-19" pretvori u datum, a telefonu obriše nulu
    if (ime === LIST_LOK) sh.getRange('C:J').setNumberFormat('@');
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

/** Meni: Kristina provjeri da li je sve ispravno upisano. */
function provjeriPodesavanja() {
  const p = ucitajPodesavanja();
  const dani = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];
  const linije = p.lokacije.map(l => '• ' + l.naziv + ': ' + (l.osobe.join(', ') || 'NEMA FRIZERA') + ' | ' +
    [1, 2, 3, 4, 5, 6, 0].map(d => dani[d] + ' ' + (l.radno[d] ? l.radno[d].join('-') : 'ne radi')).join(', '));
  linije.push('', 'Usluge: ' + p.usluge.map(u => u.naziv + ' ' + u.trajanje + ' min').join(', '));
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


function doPost(e) {
  let z;
  try { z = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, poruka: 'Neispravan zahtjev' }); }
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
  const kal = CalendarApp.getCalendarById(APP.KALENDAR_ID) || CalendarApp.getDefaultCalendar();
  const rez = [];
  kal.getEvents(od, do_).forEach(ev => {
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
  const kal = CalendarApp.getCalendarById(APP.KALENDAR_ID) || CalendarApp.getDefaultCalendar();
  const ev = kal.createEvent(z.osoba + ' - ' + u.naziv + ' (' + dijete + ')', pocetak, kraj, {
    description: 'Roditelj: ' + roditelj + '\nTelefon: ' + telefon + '\nUzrast: ' + (uzrast || '-') +
      '\nNapomena: ' + (napomena || '-') + '\nZakazano preko sajta',
  });

  if (posaljiSms(telefon, tekstPotvrde(z.datum, z.vrijeme, z.osoba, lok.telefon))) ev.setTag('potvrda', 'poslat');
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
  sh.appendRow([new Date(), vrsta, dijete, kupac, telefon, napomena, 'novo']);
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

