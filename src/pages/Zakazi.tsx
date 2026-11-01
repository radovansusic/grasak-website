import { useEffect } from 'react'
import { useLang } from '@/i18n/LanguageContext'
import OnlineZakazivanje from '@/components/OnlineZakazivanje'

export default function Zakazi() {
  const { tr } = useLang()
  useEffect(() => { document.title = tr('zakazi.title') + ' | Grašak' }, [tr])
  return (
    <div className="bg-grass-tint/40 pb-20 pt-32">
      <div className="mx-auto max-w-3xl px-4">
        <img src="/brand/grasak-logo-zuta.svg" alt="Grašak - dječiji frizerski salon" className="mb-4 h-28 w-28" />
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">{tr('zakazi.title')}</h1>
        <p className="mt-2 text-lg text-ink/70">{tr('zakazi.sub')}</p>
        <div className="mt-8"><OnlineZakazivanje /></div>
      </div>
    </div>
  )
}
