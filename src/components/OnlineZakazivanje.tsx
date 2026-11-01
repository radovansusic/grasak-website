import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CalendarCheck, Loader2, PartyPopper } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'
import { sendBookingEmail } from '@/lib/booking'
import {
  isoDatum, ucitajKonfig, ucitajSlotove, zakazi,
  type Konfig, type Lokacija, type Slot, type Usluga,
} from '@/lib/zakazivanje'

/** Online zakazivanje: lokacija > frizer > usluga > dan > termin (30 min) > podaci.
 *  Termin se upisuje u kalendar salona; roditelj dobija SMS, salon email. */
const DANI = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub']
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
  const { tr } = useLang()
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
  const [uspjeh, setUspjeh] = useState('')
  const [poruka, setPoruka] = useState('')
  const formaRef = useRef<HTMLDivElement>(null)

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

  // termini se učitavaju za izabranu kombinaciju; promjena izbora poništava izabrano vrijeme
  const kljuc = lok && osoba && usluga && datum ? [lok.id, osoba, usluga.id, datum].join('|') : ''
  const slotovi = rez && rez.kljuc === kljuc ? rez.slotovi : null
  const vrijeme = izbor.kljuc === kljuc ? izbor.vrijeme : ''

  useEffect(() => {
    if (!kljuc) return
    let aktivno = true
    const [l, o, u, d] = kljuc.split('|')
    ucitajSlotove(l, o, u, d)
      .then((s) => { if (aktivno) setRez({ kljuc, slotovi: s }) })
      .catch(() => { if (aktivno) setRez({ kljuc, slotovi: [] }) })
    return () => { aktivno = false }
  }, [kljuc, osvjezenje])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!lok || !usluga) return
    const f = new FormData(e.currentTarget)
    if (f.get('website')) return // honeypot protiv botova
    const polje = (k: string) => String(f.get(k) || '').trim()
    setSalje(true); setPoruka('')
    try {
      const r = await zakazi({
        lok: lok.id, osoba, usluga: usluga.id, datum, vrijeme,
        dijete: polje('dijete'), uzrast: polje('uzrast'), roditelj: polje('roditelj'),
        telefon: polje('telefon'), napomena: polje('napomena'),
      })
      if (r.ok) {
        const [, m, d] = datum.split('-')
        // kopija salonu na email (ista veza kao stara forma)
        void sendBookingEmail({
          Termin: `${d}.${m}. u ${vrijeme}`, Lokacija: lok.naziv, Frizer: osoba, Usluga: usluga.naziv,
          Dijete: `${polje('dijete')} (${polje('uzrast') || '-'} god.)`, Roditelj: polje('roditelj'),
          Telefon: polje('telefon'), Napomena: polje('napomena') || '-', Izvor: 'Sajt - online zakazivanje (u kalendaru)',
        })
        setUspjeh(`${d}.${m}. u ${vrijeme}, ${osoba}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
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
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl bg-white p-10 text-center shadow-xl shadow-ink/10">
        <PartyPopper className="mx-auto h-14 w-14 text-coral" />
        <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">{tr('zakazi.okTitle')}</h2>
        <p className="mt-2 text-lg text-ink/80">{uspjeh}</p>
        <p className="mt-1 text-ink/60">{tr('zakazi.okSms')}</p>
        <button onClick={() => { setUspjeh(''); setDatum(''); }} className="mt-6 rounded-full bg-grass px-6 py-3 font-bold text-white">
          {tr('zakazi.again')}
        </button>
      </motion.div>
    )
  }

  if (greska) return <p className="rounded-2xl bg-coral/10 p-5 text-ink">{greska}</p>
  if (!konfig) return <p className="flex items-center gap-2 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> {tr('zakazi.loading')}</p>

  const dani = Array.from({ length: Math.min(konfig.danaUnaprijed, 21) }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d
  })
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
              {u.naziv}{u.trajanje > konfig.korak && ` (${u.trajanje} min)`}
            </button>
          ))}
        </div>
      </Korak>
      <Korak n={++n} naslov={tr('zakazi.day')}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dani.map((d, i) => {
            const iso = isoDatum(d)
            const radi = !!lok?.radno[String(d.getDay())]
            return (
              <button key={iso} type="button" disabled={!radi} onClick={() => setDatum(iso)}
                className={'w-16 shrink-0 rounded-2xl border-2 py-2 text-center transition-colors disabled:opacity-30 ' +
                  (datum === iso ? 'border-grass bg-grass-tint' : 'border-grass-tint bg-white')}>
                <span className="block text-xs text-ink/60">{i === 0 ? tr('zakazi.today') : DANI[d.getDay()]}</span>
                <span className="block font-display text-xl font-extrabold text-ink">{d.getDate()}</span>
                <span className="block text-xs text-ink/60">{d.getMonth() + 1}.</span>
              </button>
            )
          })}
        </div>
      </Korak>
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
      {vrijeme && (
        <div ref={formaRef}>
          <Korak n={++n} naslov={tr('zakazi.details')}>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <input name="dijete" required maxLength={60} placeholder={tr('zakazi.child')} className={inputCls} />
              <input name="uzrast" maxLength={10} inputMode="numeric" placeholder={tr('zakazi.age')} className={inputCls} />
              <input name="roditelj" required maxLength={60} placeholder={tr('zakazi.parent')} autoComplete="name" className={inputCls} />
              <input name="telefon" required type="tel" inputMode="tel" placeholder="069 123 456" autoComplete="tel" className={inputCls} />
              <textarea name="napomena" maxLength={300} rows={2} placeholder={tr('zakazi.note')} className={inputCls + ' sm:col-span-2'} />
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

