import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import OtkaziTermin from '@/components/OtkaziTermin'
import { useLang } from '@/i18n/LanguageContext'
import OnlineZakazivanje from '@/components/OnlineZakazivanje'

export default function Zakazi() {
  const { tr } = useLang()
  const [params] = useSearchParams()
  const otkazi = params.get('otkazi') || '', kod = params.get('kod') || ''
  const otkazivanje = !!(otkazi && kod)
  useEffect(() => { document.title = tr(otkazivanje ? 'zakazi.cancelTitle' : 'zakazi.title') + ' | Grašak' }, [tr, otkazivanje])
  return (
    <div className="bg-grass-tint/40 pb-20 pt-32">
      <div className="mx-auto max-w-3xl px-4">
        <img src="/brand/grasak-logo-zuta.svg" alt="Grašak - dječiji frizerski salon" className="mb-4 h-28 w-28" />
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">{tr(otkazivanje ? 'zakazi.cancelTitle' : 'zakazi.title')}</h1>
        {!otkazivanje && <p className="mt-2 text-lg text-ink/70">{tr('zakazi.sub')} <Link to="/moj" className="font-bold text-grass-deep underline">{tr('moj.linkFromBooking')}</Link></p>}
        <div className="mt-8">{otkazivanje ? <OtkaziTermin id={otkazi} kod={kod} /> : <OnlineZakazivanje />}</div>
      </div>
    </div>
  )
}
