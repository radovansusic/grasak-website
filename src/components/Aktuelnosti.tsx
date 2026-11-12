import { motion } from 'framer-motion'
import { useLang } from '@/i18n/LanguageContext'
import { kutakPutanja, najnovijaTri, useKutakNajnovije } from '@/lib/kutak'

const DATUM_LOCALE = { cnr: 'sr-Latn-ME', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR' } as const

function fmtKutakDatum(iso: string, lang: keyof typeof DATUM_LOCALE) {
  if (!iso) return ''
  const d = new Date(iso.slice(0, 10) + 'T12:00:00')
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(DATUM_LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' })
}

// Početna: samo najnoviji tekstovi iz Graškovog kutka (panel). Stare statične "Aktuelnosti" uklonjene 12.11.2026.
export default function Aktuelnosti() {
  const { tr, lang } = useLang()
  const kutak = useKutakNajnovije()
  const kutakTri = najnovijaTri(kutak, lang)

  if (!kutak.ima || kutakTri.length === 0) return null

  return (
    <section className="bg-cream px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mb-10 text-center font-display text-4xl font-bold text-ink md:text-5xl"
        >
          {tr('akt.kutakNaslov')}
        </motion.h2>
        <ul className="flex flex-wrap justify-center gap-6">
          {kutakTri.map((t) => (
            <li key={t.slug} className="flex w-full md:w-[calc((100%-3rem)/3)]">
              <a
                href={`${kutakPutanja(lang)}/${t.slug}`}
                className="flex w-full flex-col rounded-3xl bg-white p-6 shadow-md shadow-ink/5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-wide text-grass-deep">{t.rubrika}</span>
                  {fmtKutakDatum(t.objavljeno, lang) && (
                    <time dateTime={t.objavljeno.slice(0, 10)} className="text-xs font-bold uppercase tracking-wide text-ink/45">
                      {fmtKutakDatum(t.objavljeno, lang)}
                    </time>
                  )}
                </div>
                <span className="mt-3 font-display text-xl font-bold text-ink">{t.naslov}</span>
                {t.opis && <span className="mt-2 flex-1 leading-relaxed text-ink/75">{t.opis}</span>}
                <span className="mt-4 font-bold text-grass-deep">{tr('akt.kutakCitaj')} →</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <a href={kutakPutanja(lang)} className="inline-flex items-center rounded-full bg-white px-6 py-3 font-bold text-grass-deep shadow-md shadow-ink/5 hover:bg-grass hover:text-white">
            {tr('akt.kutakAll')} →
          </a>
        </div>
      </div>
    </section>
  )
}
