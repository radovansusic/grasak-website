import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Ban, CalendarX, Check, Loader2, Phone } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'
import { otkaziTermin, ucitajTermin, type TerminRoditelja } from '@/lib/zakazivanje'

/** Roditelj otkazuje termin preko linka iz potvrde: /zakazi?otkazi=ID&kod=KOD. */
export default function OtkaziTermin({ id, kod }: { id: string; kod: string }) {
  const { tr } = useLang()
  const [termin, setTermin] = useState<TerminRoditelja | null>(null)
  const [greska, setGreska] = useState('')
  const [salje, setSalje] = useState(false)
  const [gotovo, setGotovo] = useState('')

  useEffect(() => {
    let aktivno = true
    ucitajTermin(id, kod)
      .then((t) => { if (aktivno) setTermin(t) })
      .catch((e: Error) => { if (aktivno) setGreska(/nepoznata akcija/i.test(e.message) ? tr('zakazi.offline') : tr('zakazi.cancelGone')) })
    return () => { aktivno = false }
  }, [id, kod, tr])

  const otkazi = async () => {
    setSalje(true); setGreska('')
    try {
      const r = await otkaziTermin(id, kod)
      if (r.ok) setGotovo(tr('zakazi.cancelDone'))
      else setGreska(r.poruka || tr('zakazi.cancelGone'))
    } catch {
      setGreska(tr('zakazi.offline'))
    } finally {
      setSalje(false)
    }
  }

  const kutija = 'rounded-3xl bg-white p-8 text-center shadow-xl shadow-ink/10'
  if (gotovo) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={kutija}>
        <Check className="mx-auto h-14 w-14 text-grass" />
        <p className="mt-4 text-lg font-bold text-ink">{gotovo}</p>
        <Link to="/zakazi" className="mt-6 inline-block rounded-full bg-grass px-6 py-3 font-bold text-white">{tr('zakazi.bookAgain')}</Link>
      </motion.div>
    )
  }
  if (greska && !termin) {
    return (
      <div className={kutija}>
        <CalendarX className="mx-auto h-14 w-14 text-coral" />
        <p className="mt-4 text-lg font-bold text-ink">{greska}</p>
        <p className="mt-2 text-ink/60">{tr('zakazi.callUs')} <a href="tel:+38269371111" className="font-bold text-grass-deep">069 371 111</a></p>
        <Link to="/zakazi" className="mt-6 inline-block rounded-full bg-grass px-6 py-3 font-bold text-white">{tr('zakazi.bookAgain')}</Link>
      </div>
    )
  }
  if (!termin) return <p className="flex items-center gap-2 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> {tr('zakazi.loading')}</p>

  const [g, m, d] = termin.datum.split('-')
  const red = (k: string, v: string) => v ? (
    <div className="flex gap-3 border-b border-grass-tint py-2 text-left text-sm"><span className="w-24 shrink-0 text-ink/50">{k}</span><span className="font-bold text-ink">{v}</span></div>
  ) : null
  return (
    <div className={kutija}>
      <h2 className="font-display text-2xl font-extrabold text-ink">{tr('zakazi.cancelTitle')}</h2>
      <div className="mx-auto mt-4 max-w-sm">
        {red(tr('zakazi.day'), `${d}.${m}.${g}. ${tr('zakazi.time').toLowerCase()} ${termin.vrijeme}`)}
        {red(tr('zakazi.stylist'), termin.osoba)}
        {red(tr('zakazi.service'), termin.usluga)}
        {red(tr('zakazi.child'), termin.dijete)}
        {red(tr('zakazi.location'), [termin.lokacija, termin.adresa].filter(Boolean).join(', '))}
      </div>
      {termin.prosao ? (
        <p className="mt-5 rounded-xl bg-sun/40 p-3 text-ink">{tr('zakazi.cancelPast')}</p>
      ) : (
        <>
          <p className="mt-5 text-lg text-ink">{tr('zakazi.cancelQuestion')}</p>
          {greska && <p className="mt-3 rounded-xl bg-coral/10 p-3 text-ink">{greska}</p>}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button disabled={salje} onClick={() => void otkazi()}
              className="flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 font-bold text-white shadow-lg shadow-coral/30 disabled:opacity-60">
              {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ban className="h-5 w-5" />} {tr('zakazi.cancelBtn')}
            </button>
            <Link to="/" className="flex items-center justify-center rounded-full border-2 border-grass-tint px-6 py-3 font-bold text-ink">{tr('zakazi.keepBtn')}</Link>
          </div>
        </>
      )}
      <p className="mt-5 text-sm text-ink/60">
        {tr('zakazi.callUs')} <a href={'tel:' + termin.telefonSalona.replace(/\s/g, '')} className="inline-flex items-center gap-1 font-bold text-grass-deep"><Phone className="h-4 w-4" /> {termin.telefonSalona}</a>
      </p>
    </div>
  )
}
