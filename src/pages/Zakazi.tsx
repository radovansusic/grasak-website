import { useEffect } from 'react'
import { useLang } from '@/i18n/LanguageContext'
import BookingForm from '@/components/BookingForm'
import OnlineZakazivanje from '@/components/OnlineZakazivanje'
import { API_URL } from '@/lib/zakazivanje'

export default function Zakazi() {
  const { tr } = useLang()
  useEffect(() => { document.title = tr('zakazi.title') + ' | Grašak' }, [tr])
  return (
    <div className="bg-grass-tint/40 pb-20 pt-32">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">{tr('zakazi.title')}</h1>
        <p className="mt-2 text-lg text-ink/70">{tr('zakazi.sub')}</p>
        <div className="mt-8">{API_URL ? <OnlineZakazivanje /> : <BookingForm />}</div>
      </div>
    </div>
  )
}
