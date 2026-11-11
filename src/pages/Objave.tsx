import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useLang } from '@/i18n/LanguageContext'
import { lijepDatumObjave, objavePutanja, ucitajObjave, type ObjavaJavno } from '@/lib/objave'
import { useJezikRute } from '@/lib/useJezikRute'

export default function Objave() {
  const { tr } = useLang()
  const lang = useJezikRute()
  const [lista, setLista] = useState<ObjavaJavno[] | null>(null)
  const [greska, setGreska] = useState(false)

  useEffect(() => {
    let aktivno = true
    ucitajObjave().then((l) => { if (aktivno) setLista(l) }).catch(() => { if (aktivno) setGreska(true) })
    return () => { aktivno = false }
  }, [])
  useEffect(() => { document.title = `${tr('objave.title')} | Grašak` }, [tr])

  const vidljive = (lista || []).filter((o) => o.naslov[lang])
  return (
    <div className="bg-cream">
      <section className="relative overflow-hidden py-16 md:py-24">
        <img src="/hero-shapes.svg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto max-w-[760px] px-6">
          <nav className="mb-6 text-sm font-semibold text-ink/50">
            <Link to="/" className="text-grass-deep hover:underline">{tr('nav.home')}</Link>
            <span className="mx-2">/</span>
            <span>{tr('objave.title')}</span>
          </nav>
          <h1 className="font-display text-[40px] font-bold leading-tight text-ink md:text-6xl">{tr('objave.title')}</h1>
          <p className="mt-3 text-lg text-ink/70">{tr('objave.sub')}</p>
        </div>
      </section>
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[760px]">
          {greska ? (
            <p className="rounded-3xl bg-white p-6 text-ink/70 shadow-md shadow-ink/5">{tr('objave.error')}</p>
          ) : !lista ? (
            <p className="text-ink/50">{tr('objave.loading')}</p>
          ) : !vidljive.length ? (
            <p className="rounded-3xl bg-white p-6 text-ink/70 shadow-md shadow-ink/5">{tr('objave.empty')}</p>
          ) : (
            <ul className="grid gap-6">
              {vidljive.map((o) => (
                <li key={o.slug} className="rounded-3xl bg-white p-6 shadow-md shadow-ink/5">
                  <time className="text-xs font-bold uppercase tracking-wide text-ink/45">{lijepDatumObjave(o.datum, lang)}</time>
                  <h2 className="mt-2 font-display text-2xl font-bold text-ink">
                    <Link to={objavePutanja(lang, o.slug)} className="hover:text-grass-deep">{o.naslov[lang]}</Link>
                  </h2>
                  <p className="mt-2 leading-relaxed text-ink/75">{o.opis[lang]}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
