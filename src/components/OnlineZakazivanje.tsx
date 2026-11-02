import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { FormEvent, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, CalendarPlus, Check, Copy, Loader2, PartyPopper, UserPlus } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'
import { t as prevodi } from '@/i18n/translations'
import { sendBookingEmail } from '@/lib/booking'
import MjesecniKalendar, { type StanjeDana } from '@/components/MjesecniKalendar'
import { citajMoj, pisiPrefill } from '@/lib/moj'
import {
  isoDatum, linkOtkazivanja, napraviIcs, preuzmiIcs, ucitajKonfig, ucitajPeriod, ucitajSlotove, zakazi,
  type Konfig, type Lokacija, type Slot, type Usluga,
} from '@/lib/zakazivanje'

/** Poslije zakazivanja: podaci za ekran uspjeha, kalendar roditelja i link za otkazivanje. */
interface Uspjeh { tekst: string; datum: string; vrijeme: string; osoba: string; usluga: Usluga; lok: Lokacija; id?: string; kod?: string; email: string }

/** Online zakazivanje: lokacija > frizer > usluga > dan (mjesečni kalendar) > termin (30 min) > podaci.
 *  Termin se upisuje u kalendar salona; salon dobija email i obavještenje u panelu. */
/** Usluge stižu iz tabele na crnogorskom; poznate se prikazuju prevodom sa stranice cjenovnika, salonu ide original. */
const USLUGE_SA_CJENOVNIKA = ['b1name', 'b2name', 'b3name', 'firstTitle', 'pk1name', 'pk2name', 'pk3name', 'e1name', 'e2name']
const cnrUsluge = prevodi.cnr.usluge as Record<string, string>
const kljucUsluge = (naziv: string) => USLUGE_SA_CJENOVNIKA.find((k) => cnrUsluge[k] === naziv.trim())
const cip = (aktivan: boolean) =>
  'rounded-full border-2 px-5 py-2.5 font-bold transition-colors ' +
  (aktivan ? 'border-grass bg-grass text-white' : 'border-grass-tint bg-white text-ink hover:border-grass')
const inputCls =
  'w-full rounded-2xl border-2 border-grass-tint bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-grass'

function Korak({ n, naslov, children }: { n: number; naslov: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-3 font-display text-xl font-extrabold text-ink">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sun text-base">{n}</span>
        {naslov}
      </h2>
      {children}
    </section>
  )
}

export default function OnlineZakazivanje() {
  const { tr, lang } = useLang()
  const [konfig, setKonfig] = useState<Konfig | null>(null)
  const [greska, setGreska] = useState('')
  const [lok, setLok] = useState<Lokacija | null>(null)
  const [osoba, setOsoba] = useState('')
  const [usluga, setUsluga] = useState<Usluga | null>(null)
  const [datum, setDatum] = useState('')
  const [rez, setRez] = useState<{ kljuc: string; slotovi: Slot[] } | null>(null)
  const [osvjezenje, setOsvjezenje] = useState(0)
  const [izbor, setIzbor] = useState({ kljuc: '', vrijeme: '' })
  const [salje, setSalje] = useState(false)
  const [uspjeh, setUspjeh] = useState<Uspjeh | null>(null)
  const [kopirano, setKopirano] = useState(false)
  const [poruka, setPoruka] = useState('')
  const formaRef = useRef<HTMLDivElement>(null)
  const terminiRef = useRef<HTMLDivElement>(null)
  const [moj] = useState(citajMoj)   // nalog roditelja: podaci se sami popune
  // podaci roditelja žive ovdje, ne u formi: ostaju i kad se promijeni dan, termin ili usluga
  const [podaci, setPodaci] = useState(() => ({
    dijete: moj && moj.profil.djeca.length === 1 ? moj.profil.djeca[0] : '', uzrast: '', roditelj: moj?.profil.roditelj || '',
    telefon: moj?.profil.telefon || '', email: moj?.profil.email || '', napomena: '', kartica: !!moj?.profil.kartica,
  }))
  const upisi = (k: keyof typeof podaci) => (e: { target: { value: string } }) => setPodaci((p) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    ucitajKonfig()
      .then((k) => {
        setKonfig(k)
        if (k.lokacije.length === 1) setLok(k.lokacije[0])
        if (k.lokacije.length === 1 && k.lokacije[0].osobe.length === 1) setOsoba(k.lokacije[0].osobe[0])
        if (k.usluge.length === 1) setUsluga(k.usluge[0])
      })
      .catch(() => setGreska(tr('zakazi.offline')))
  }, [tr])

  // termini za cijeli period (danas + 30 dana) stižu jednim pozivom čim su izabrani frizer i usluga; dani se onda mijenjaju odmah
  const horizont = konfig ? konfig.danaUnaprijed + 1 : 0
  const kljucPeriod = lok && osoba && usluga ? [lok.id, osoba, usluga.id].join('|') : ''
  const [period, setPeriod] = useState<{ kljuc: string; dani: Record<string, Slot[]> } | null>(null)
  const [bezPerioda, setBezPerioda] = useState(false) // starija verzija Google skripte: termini po danu
  const daniPeriod = period && period.kljuc === kljucPeriod ? period.dani : null

  useEffect(() => {
    if (!kljucPeriod || bezPerioda) return
    let aktivno = true
    const [l, o, u] = kljucPeriod.split('|')
    ucitajPeriod(l, o, u, horizont)
      .then((d) => { if (aktivno) setPeriod({ kljuc: kljucPeriod, dani: d }) })
      .catch(() => { if (aktivno) setBezPerioda(true) })
    return () => { aktivno = false }
  }, [kljucPeriod, osvjezenje, bezPerioda, horizont])

  // promjena izbora poništava izabrano vrijeme
  const kljuc = lok && osoba && usluga && datum ? [lok.id, osoba, usluga.id, datum].join('|') : ''
  const slotovi = daniPeriod ? (datum ? daniPeriod[datum] ?? [] : null) : rez && rez.kljuc === kljuc ? rez.slotovi : null
  const vrijeme = izbor.kljuc === kljuc ? izbor.vrijeme : ''

  useEffect(() => {
    if (!kljuc || !bezPerioda) return
    let aktivno = true
    const [l, o, u, d] = kljuc.split('|')
    ucitajSlotove(l, o, u, d)
      .then((s) => { if (aktivno) setRez({ kljuc, slotovi: s }) })
      .catch(() => { if (aktivno) setRez({ kljuc, slotovi: [] }) })
    return () => { aktivno = false }
  }, [kljuc, osvjezenje, bezPerioda])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!lok || !usluga) return
    const f = new FormData(e.currentTarget)
    if (f.get('website')) return // honeypot protiv botova
    const polje = (k: string) => String(podaci[k as keyof typeof podaci] ?? '').trim()
    setSalje(true); setPoruka('')
    try {
      const r = await zakazi({
        lok: lok.id, osoba, usluga: usluga.id, datum, vrijeme,
        dijete: polje('dijete'), uzrast: polje('uzrast'), roditelj: polje('roditelj'),
        telefon: polje('telefon'), napomena: polje('napomena'),
        email: polje('email'), kartica: podaci.kartica,
      })
      if (r.ok) {
        const [, m, d] = datum.split('-')
        // kopija salonu na email (ista veza kao stara forma)
        void sendBookingEmail({
          Termin: `${d}.${m}. u ${vrijeme}`, Lokacija: lok.naziv, Frizer: osoba, Usluga: usluga.naziv,
          Dijete: `${polje('dijete')} (${polje('uzrast') || '-'} god.)`, Roditelj: polje('roditelj'),
          Telefon: polje('telefon'), Napomena: polje('napomena') || '-', Izvor: 'Sajt - online zakazivanje (u kalendaru)',
          Email: polje('email') || '-', Kartica: podaci.kartica ? 'Veseli Grašak' : '-',
        })
        setUspjeh({ tekst: tr('zakazi.when', { datum: `${d}.${m}.`, vrijeme, osoba }), datum, vrijeme, osoba, usluga, lok, id: r.id, kod: r.kod, email: polje('email') })
        if (!moj) pisiPrefill({ roditelj: polje('roditelj'), telefon: polje('telefon'), email: polje('email'), dijete: polje('dijete'), kartica: podaci.kartica })
        setPodaci((p) => ({ ...p, dijete: '', uzrast: '', napomena: '' }))   // za sljedeće zakazivanje ostaju roditelj, telefon, email
        setKopirano(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setOsvjezenje((x) => x + 1) // zauzeti termin nestaje i za sljedeće zakazivanje
      } else {
        setPoruka(r.poruka)
        setIzbor({ kljuc: '', vrijeme: '' })
        setRez(null)
        setOsvjezenje((x) => x + 1)
      }
    } catch {
      setPoruka(tr('zakazi.offline'))
    } finally {
      setSalje(false)
    }
  }

  if (uspjeh) {
    const link = uspjeh.id && uspjeh.kod ? linkOtkazivanja(uspjeh.id, uspjeh.kod) : ''
    const uKalendar = () => preuzmiIcs(napraviIcs({
      id: uspjeh.id, datum: uspjeh.datum, vrijeme: uspjeh.vrijeme, trajanje: uspjeh.usluga.trajanje,
      naslov: `Grašak: ${uspjeh.usluga.naziv}`, mjesto: [uspjeh.lok.naziv, uspjeh.lok.adresa].filter(Boolean).join(', '),
      opis: `${tr('zakazi.stylist')}: ${uspjeh.osoba}` + (link ? `\n${tr('zakazi.cancelLink')}: ${link}` : ''),
    }))
    const kopiraj = () => { navigator.clipboard?.writeText(link).then(() => setKopirano(true)).catch(() => {}) }
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl bg-white p-8 text-center shadow-xl shadow-ink/10 sm:p-10">
        <PartyPopper className="mx-auto h-14 w-14 text-coral" />
        <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">{tr('zakazi.okTitle')}</h2>
        <p className="mt-2 text-lg text-ink/80">{uspjeh.tekst}</p>
        <p className="mt-1 text-ink/60">{tr('zakazi.okText')}</p>
        {uspjeh.email && <p className="mt-2 text-sm font-bold text-grass-deep">{tr('zakazi.okEmail', { email: uspjeh.email })}</p>}
        <button onClick={uKalendar} className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-grass px-5 py-2.5 font-bold text-grass-deep">
          <CalendarPlus className="h-5 w-5" /> {tr('zakazi.addCal')}
        </button>
        <p className="mt-1 text-xs text-ink/50">{tr('zakazi.addCalHint')}</p>
        {link && (
          <div className="mt-5 rounded-2xl bg-grass-tint p-4 text-left">
            <p className="font-bold text-ink">{tr('zakazi.cancelLinkTitle')}</p>
            <p className="mt-1 text-sm text-ink/70">{tr('zakazi.cancelKeep')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a href={link} className="break-all text-sm font-bold text-grass-deep underline">{tr('zakazi.cancelLink')}</a>
              <button type="button" onClick={kopiraj} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink shadow-sm">
                {kopirano ? <Check className="h-3.5 w-3.5 text-grass" /> : <Copy className="h-3.5 w-3.5" />} {kopirano ? tr('zakazi.copied') : tr('zakazi.copyLink')}
              </button>
            </div>
          </div>
        )}
        {!moj && (
          <div className="mt-5 rounded-2xl border-2 border-grass-tint p-4 text-left">
            <p className="text-sm text-ink/70">{tr('moj.createAfter')}</p>
            <Link to="/moj?novi=1" className="mt-2 inline-flex items-center gap-2 rounded-full bg-grass px-4 py-2 text-sm font-bold text-white"><UserPlus className="h-4 w-4" /> {tr('moj.createBtn')}</Link>
          </div>
        )}
        <button onClick={() => { setUspjeh(null); setDatum(''); }} className="mt-6 rounded-full bg-grass px-6 py-3 font-bold text-white">
          {tr('zakazi.again')}
        </button>
      </motion.div>
    )
  }

  if (greska) return <p className="rounded-2xl bg-coral/10 p-5 text-ink">{greska}</p>
  if (!konfig) return <p className="flex items-center gap-2 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> {tr('zakazi.loading')}</p>

  const dani = Array.from({ length: horizont }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d
  })
  const stanjeDana = (d: Date): { s: StanjeDana; opis?: string } => {
    if (!lok) return { s: 'zatvoreno' }
    const iso = isoDatum(d)
    const praznik = lok.neradni?.[iso]
    if (praznik) return { s: 'zatvoreno', opis: praznik }
    if (!lok.radno[String(d.getDay())]) return { s: 'zatvoreno' }
    if (!daniPeriod) return { s: 'nepoznato' }
    return (daniPeriod[iso] || []).some((x) => x.slobodno) ? { s: 'slobodno' } : { s: 'popunjeno', opis: tr('zakazi.full') }
  }
  const izaberiDan = (iso: string) => {
    setDatum(iso)
    if (usluga) setTimeout(() => terminiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  let n = 0

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-ink/10 sm:p-8">
      {konfig.lokacije.length > 1 && (
        <Korak n={++n} naslov={tr('zakazi.location')}>
          <div className="flex flex-wrap gap-2">
            {konfig.lokacije.map((l) => (
              <button key={l.id} type="button" className={cip(lok?.id === l.id)}
                onClick={() => { setLok(l); setOsoba(l.osobe.length === 1 ? l.osobe[0] : '') }}>
                {l.naziv}{l.adresa && <span className="block text-xs font-semibold opacity-75">{l.adresa}</span>}
              </button>
            ))}
          </div>
        </Korak>
      )}
      {lok && lok.osobe.length > 1 && (
        <Korak n={++n} naslov={tr('zakazi.stylist')}>
          <div className="flex flex-wrap gap-2">
            {lok.osobe.map((o) => (
              <button key={o} type="button" className={cip(osoba === o)} onClick={() => setOsoba(o)}>{o}</button>
            ))}
          </div>
        </Korak>
      )}
      <Korak n={++n} naslov={tr('zakazi.service')}>
        <div className="flex flex-wrap gap-2">
          {konfig.usluge.map((u) => (
            <button key={u.id} type="button" className={cip(usluga?.id === u.id)} onClick={() => setUsluga(u)}>
              {kljucUsluge(u.naziv) ? tr('usluge.' + kljucUsluge(u.naziv)) : u.naziv}
              {u.trajanje > konfig.korak && <span className="block text-xs font-semibold opacity-75">{u.trajanje} {tr('zakazi.min')}</span>}
            </button>
          ))}
        </div>
      </Korak>
      <Korak n={++n} naslov={tr('zakazi.day')}>
        <MjesecniKalendar dani={dani} izabran={datum} stanje={stanjeDana} onIzbor={izaberiDan} jezik={lang}
          tekst={{ prev: tr('zakazi.prevMonth'), next: tr('zakazi.nextMonth'), free: tr('zakazi.legendFree'), busy: tr('zakazi.legendBusy'), today: tr('zakazi.today') }} />
        {kljucPeriod && !daniPeriod && !bezPerioda && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink/60"><Loader2 className="h-4 w-4 animate-spin" /> {tr('zakazi.loadingDays')}</p>
        )}
      </Korak>
      <div ref={terminiRef} className="scroll-mt-24">
        <Korak n={++n} naslov={tr('zakazi.time')}>
          {!lok || !osoba || !usluga || !datum ? (
            <p className="text-ink/60">{tr('zakazi.pickFirst')}</p>
          ) : slotovi === null ? (
            <p className="flex items-center gap-2 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> {tr('zakazi.loading')}</p>
          ) : slotovi.length === 0 ? (
            <p className="text-ink/60">{tr('zakazi.noSlots')}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {slotovi.map((s) => (
                  <button key={s.vrijeme} type="button" disabled={!s.slobodno}
                    onClick={() => { setIzbor({ kljuc, vrijeme: s.vrijeme }); setTimeout(() => formaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50) }}
                    className={'rounded-xl border-2 py-3 font-bold transition-colors disabled:border-transparent disabled:bg-ink/5 disabled:text-ink/30 disabled:line-through ' +
                      (vrijeme === s.vrijeme ? 'border-grass bg-grass text-white' : 'border-grass bg-white text-ink')}>
                    {s.vrijeme}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-ink/50">{tr('zakazi.legend')}</p>
              {poruka && !vrijeme && <p className="mt-3 rounded-xl bg-coral/10 p-3 text-ink">{poruka}</p>}
            </>
          )}
        </Korak>
      </div>
      {vrijeme && (
        <div ref={formaRef}>
          <Korak n={++n} naslov={tr('zakazi.details')}>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {moj && (
                <p className="flex flex-wrap items-center gap-2 rounded-2xl bg-grass-tint px-4 py-2 text-sm text-ink sm:col-span-2">
                  <span>{tr('moj.loggedAs', { ime: moj.profil.roditelj })}</span>
                  <Link to="/moj" className="font-bold text-grass-deep underline">{tr('moj.title')}</Link>
                </p>
              )}
              {moj && moj.profil.djeca.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <span className="text-sm text-ink/60">{tr('moj.pickChild')}</span>
                  {moj.profil.djeca.map((d) => (
                    <button key={d} type="button" onClick={() => setPodaci((p) => ({ ...p, dijete: d }))} className={'rounded-full border-2 px-3 py-1 text-sm font-bold ' + (podaci.dijete === d ? 'border-grass bg-grass text-white' : 'border-grass-tint bg-white text-ink hover:border-grass')}>{d}</button>
                  ))}
                </div>
              )}
              <input name="dijete" required maxLength={60} value={podaci.dijete} onChange={upisi('dijete')} placeholder={tr('zakazi.child')} className={inputCls} />
              <input name="uzrast" maxLength={10} inputMode="numeric" value={podaci.uzrast} onChange={upisi('uzrast')} placeholder={tr('zakazi.age')} className={inputCls} />
              <input name="roditelj" required maxLength={60} value={podaci.roditelj} onChange={upisi('roditelj')} placeholder={tr('zakazi.parent')} autoComplete="name" className={inputCls} />
              <input name="telefon" required type="tel" inputMode="tel" value={podaci.telefon} onChange={upisi('telefon')} placeholder="069 123 456" autoComplete="tel" className={inputCls} />
              <input name="email" type="email" inputMode="email" maxLength={80} value={podaci.email} onChange={upisi('email')} placeholder={tr('zakazi.email')} autoComplete="email" className={inputCls + ' sm:col-span-2'} />
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-sun bg-sun/30 px-4 py-3 font-bold text-ink sm:col-span-2">
                <input name="kartica" type="checkbox" checked={podaci.kartica} onChange={(e) => setPodaci((p) => ({ ...p, kartica: e.target.checked }))} className="h-5 w-5 accent-grass" /> {tr('zakazi.loyalty')}
              </label>
              <textarea name="napomena" maxLength={300} rows={2} value={podaci.napomena} onChange={upisi('napomena')} placeholder={tr('zakazi.note')} className={inputCls + ' sm:col-span-2'} />
              <p className="text-xs text-ink/50 sm:col-span-2">{tr('zakazi.privacy')}</p>
              {poruka && <p className="rounded-xl bg-coral/10 p-3 text-ink sm:col-span-2">{poruka}</p>}
              <button disabled={salje} className="flex items-center justify-center gap-2 rounded-full bg-coral px-8 py-4 text-lg font-bold text-white shadow-lg shadow-coral/30 disabled:opacity-60 sm:col-span-2">
                {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarCheck className="h-5 w-5" />}
                {tr('zakazi.submit')} {vrijeme}
              </button>
            </form>
          </Korak>
        </div>
      )}
    </div>
  )
}

