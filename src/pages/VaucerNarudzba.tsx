import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Gift, Loader2, PartyPopper } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'
import { sendBookingEmail } from '@/lib/booking'
import { naruciVaucer } from '@/lib/zakazivanje'

const inputCls =
  'w-full rounded-2xl border-2 border-grass-tint bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-grass'

/** Narudžba poklon vaučera: email salonu uvijek, a s podešenim API-jem i red u tabeli + SMS kupcu. */
export default function VaucerNarudzba() {
  const { tr } = useLang()
  const vrste = [tr('vaucer.v1t'), tr('vaucer.v2t')]
  const [vrsta, setVrsta] = useState(vrste[0])
  const [salje, setSalje] = useState(false)
  const [gotovo, setGotovo] = useState(false)
  const [poruka, setPoruka] = useState('')
  useEffect(() => { document.title = tr('vaucerForma.title') + ' | Grašak' }, [tr])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('website')) return // honeypot
    const polje = (k: string) => String(f.get(k) || '').trim()
    const podaci = { vrsta, dijete: polje('dijete'), kupac: polje('kupac'), telefon: polje('telefon'), napomena: polje('napomena') }
    setSalje(true); setPoruka('')
    try {
      const r = await naruciVaucer(podaci)
      if (!r.ok) { setPoruka(r.poruka); return }
      void sendBookingEmail({
        _subject: 'Narudžba poklon vaučera - Grašak',
        Vaucer: vrsta, 'Na ime djeteta': podaci.dijete, Kupac: podaci.kupac,
        Telefon: podaci.telefon, Napomena: podaci.napomena || '-', Izvor: 'Sajt - narudžba vaučera',
      })
      setGotovo(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setPoruka(tr('zakazi.offline'))
    } finally {
      setSalje(false)
    }
  }

  return (
    <div className="bg-grass-tint/40 pb-20 pt-32">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="flex items-center gap-3 font-display text-4xl font-extrabold text-ink sm:text-5xl">
          <Gift className="h-10 w-10 text-coral" /> {tr('vaucerForma.title')}
        </h1>
        <p className="mt-2 text-lg text-ink/70">{tr('vaucer.note')}</p>
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl shadow-ink/10 sm:p-8">
          {gotovo ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <PartyPopper className="mx-auto h-14 w-14 text-coral" />
              <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">{tr('vaucerForma.okTitle')}</h2>
              <p className="mt-2 text-ink/70">{tr('vaucerForma.okText')}</p>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-3">
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="flex flex-wrap gap-2">
                {vrste.map((v) => (
                  <button key={v} type="button" onClick={() => setVrsta(v)}
                    className={'rounded-full border-2 px-5 py-2.5 font-bold transition-colors ' +
                      (vrsta === v ? 'border-grass bg-grass text-white' : 'border-grass-tint bg-white text-ink hover:border-grass')}>
                    {v}
                  </button>
                ))}
              </div>
              <input name="dijete" required maxLength={60} placeholder={tr('vaucerForma.child')} className={inputCls} />
              <input name="kupac" required maxLength={60} placeholder={tr('vaucerForma.buyer')} autoComplete="name" className={inputCls} />
              <input name="telefon" required type="tel" inputMode="tel" placeholder="069 123 456" autoComplete="tel" className={inputCls} />
              <textarea name="napomena" maxLength={300} rows={2} placeholder={tr('vaucerForma.note')} className={inputCls} />
              <p className="text-xs text-ink/50">{tr('zakazi.privacy')}</p>
              {poruka && <p className="rounded-xl bg-coral/10 p-3 text-ink">{poruka}</p>}
              <button disabled={salje} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-coral px-8 py-4 text-lg font-bold text-white shadow-lg shadow-coral/30 disabled:opacity-60">
                {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gift className="h-5 w-5" />}
                {tr('vaucerForma.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
