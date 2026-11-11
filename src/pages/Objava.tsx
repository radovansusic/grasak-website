import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CalendarCheck } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'
import { lijepDatumObjave, objavePutanja, ucitajObjavu, type ObjavaJavno } from '@/lib/objave'
import { useJezikRute } from '@/lib/useJezikRute'

export default function Objava() {
  const { slug = '' } = useParams()
  const { tr } = useLang()
  const lang = useJezikRute(slug)
  const [stanje, setStanje] = useState<{ slug: string; objava: ObjavaJavno | null; greska: boolean } | null>(null)

  useEffect(() => {
    let aktivno = true
    ucitajObjavu(slug)
      .then((objava) => { if (aktivno) setStanje({ slug, objava, greska: false }) })
      .catch(() => { if (aktivno) setStanje({ slug, objava: null, greska: true }) })
    return () => { aktivno = false }
  }, [slug])

  const sada = stanje && stanje.slug === slug ? stanje : null
  const objava = sada?.objava || null
  // objava bez prevoda na izabranom jeziku prikazuje se na crnogorskom
  const jez = objava && objava.naslov[lang] ? lang : 'cnr'
  const naslov = objava?.naslov[jez]
  useEffect(() => { document.title = `${naslov || tr('objave.title')} | Grašak` }, [naslov, tr])

  const pasusi = (objava?.tijelo?.[jez] || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return (
    <div className="bg-cream px-6 py-16 md:py-24">
      <article className="mx-auto max-w-[760px]">
        <nav className="mb-6 text-sm font-semibold text-ink/50">
          <Link to="/" className="text-grass-deep hover:underline">{tr('nav.home')}</Link>
          <span className="mx-2">/</span>
          <Link to={objavePutanja(lang)} className="text-grass-deep hover:underline">{tr('objave.title')}</Link>
        </nav>
        {!sada ? (
          <p className="text-ink/50">{tr('objave.loading')}</p>
        ) : sada.greska ? (
          <p className="rounded-3xl bg-white p-6 text-ink/70 shadow-md shadow-ink/5">{tr('objave.error')}</p>
        ) : !objava ? (
          <p className="rounded-3xl bg-white p-6 text-ink/70 shadow-md shadow-ink/5">{tr('objave.notFound')}</p>
        ) : (
          <>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{naslov}</h1>
            <time className="mt-3 block text-xs font-bold uppercase tracking-wide text-ink/45">{lijepDatumObjave(objava.datum, lang)}</time>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink/80">
              {pasusi.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {objava.izvor_url && (
              <p className="mt-8 border-t-2 border-sun pt-4 text-sm text-ink/70">
                {tr('objave.source')}: <a href={objava.izvor_url} target="_blank" rel="noopener nofollow" className="font-bold text-grass-deep hover:underline">{objava.izvor_naziv || objava.izvor_url}</a>
              </p>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/zakazi" className="inline-flex items-center gap-2 rounded-full bg-grass px-6 py-3 font-bold text-white shadow"><CalendarCheck className="h-5 w-5" /> {tr('objave.book')}</Link>
              <Link to={objavePutanja(lang)} className="inline-flex items-center rounded-full bg-white px-6 py-3 font-bold text-ink shadow">{tr('objave.back')}</Link>
            </div>
          </>
        )}
      </article>
    </div>
  )
}
