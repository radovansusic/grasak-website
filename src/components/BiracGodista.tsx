import { useEffect, useMemo, useRef, useState } from 'react'
import { izborGodista } from '@/lib/godiste'

const VISINA = 44   // visina jednog reda točkića (px)
const VIDLJIVO = 5  // redova vidljivo; srednji je izabran

/**
 * Točkić sa godištima: prva je tekuća godina (1.1. sljedeće godine sama postaje prva), pa unazad do tinejdžera.
 * Vrti se prstom, mišem ili strelicama; godina u sredini je izabrana. Dodir na godinu je dovede u sredinu.
 */
export default function BiracGodista({ naslov, vrijednost, onIzbor, ponisti, className = '' }: {
  naslov: string; vrijednost: string; onIzbor: (g: string) => void; ponisti?: string; className?: string
}) {
  const godine = useMemo(() => izborGodista(), [])
  const ref = useRef<HTMLDivElement>(null)
  const tajmer = useRef(0)
  const korisnik = useRef(false)   // izbor samo kad vrti čovjek, ne kad kod vraća točkić
  const poslato = useRef<string | null>(null)   // zadnje godište koje je točkić sam javio
  const [sredina, setSredina] = useState(() => Math.max(0, godine.indexOf(vrijednost)))

  // spolja promijenjena vrijednost (npr. poništeno poslije zakazivanja): točkić ide na nju ili na vrh
  useEffect(() => {
    const el = ref.current
    if (!el || vrijednost === poslato.current) return
    poslato.current = null
    const i = Math.max(0, godine.indexOf(vrijednost))
    if (Math.round(el.scrollTop / VISINA) !== i) { korisnik.current = false; el.scrollTo({ top: i * VISINA }) }
  }, [vrijednost, godine])
  useEffect(() => () => window.clearTimeout(tajmer.current), [])

  const izaberi = (g: string) => { poslato.current = g; onIzbor(g) }
  const naSkrol = () => {
    const el = ref.current
    if (!el) return
    const i = Math.max(0, Math.min(godine.length - 1, Math.round(el.scrollTop / VISINA)))
    setSredina(i)
    window.clearTimeout(tajmer.current)
    tajmer.current = window.setTimeout(() => {
      if (korisnik.current && godine[i] !== vrijednost) izaberi(godine[i])
    }, 140)
  }
  const idiNa = (i: number) => {
    const j = Math.max(0, Math.min(godine.length - 1, i))
    korisnik.current = true
    ref.current?.scrollTo({ top: j * VISINA, behavior: 'smooth' })
    if (godine[j] !== vrijednost) izaberi(godine[j])
  }
  const dira = () => { korisnik.current = true }
  const izabrano = vrijednost !== ''

  return (
    <div className={'min-w-0 ' + className}>
      <div className="mb-1 flex items-center gap-3 text-sm font-bold text-ink/70">
        <span>{naslov}{izabrano && <span className="text-grass-deep">: {vrijednost}</span>}</span>
        {izabrano && ponisti && <button type="button" onClick={() => onIzbor('')} className="text-xs font-bold text-ink/50 underline">{ponisti}</button>}
      </div>
      <div className="relative w-44 select-none">
        <div aria-hidden="true" className={'pointer-events-none absolute inset-x-0 rounded-xl border-2 ' + (izabrano ? 'border-grass bg-grass-tint' : 'border-dashed border-grass/50 bg-white')}
          style={{ top: VISINA * 2, height: VISINA }} />
        <div ref={ref} role="listbox" aria-label={naslov} tabIndex={0} onScroll={naSkrol} data-lenis-prevent
          onPointerDown={dira} onWheel={dira} onTouchStart={dira}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); idiNa(sredina + 1) }
            if (e.key === 'ArrowUp') { e.preventDefault(); idiNa(sredina - 1) }
          }}
          className="relative snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-grass [&::-webkit-scrollbar]:hidden"
          style={{
            height: VISINA * VIDLJIVO, paddingTop: VISINA * 2, paddingBottom: VISINA * 2,
            maskImage: 'linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)',
          }}>
          {godine.map((g, i) => (
            <button key={g} type="button" role="option" aria-selected={vrijednost === g} tabIndex={-1} onClick={() => idiNa(i)}
              className={'block w-full snap-center text-center font-display font-extrabold transition-colors ' +
                (i === sredina ? (izabrano ? 'text-xl text-grass-deep' : 'text-xl text-ink/60') : 'text-base text-ink/35')}
              style={{ height: VISINA }}>
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
