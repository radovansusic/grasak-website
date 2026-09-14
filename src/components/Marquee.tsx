import { memo } from 'react'
import { Scissors } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

/**
 * Infinite marquee band, constant velocity CSS keyframes, pauses on hover.
 */
function Marquee() {
  const { tr } = useLang()
  const PHRASES = [tr('marquee.p1'), tr('marquee.p2'), tr('marquee.p3'), tr('marquee.p4')]
  const row = (
    <>
      {Array.from({ length: 4 }).flatMap((_, r) =>
        PHRASES.map((p, i) => (
          <span key={`${r}-${i}`} className="mx-6 inline-flex items-center gap-6 whitespace-nowrap">
            <span className="font-display text-xl font-bold uppercase tracking-[0.06em] text-cream md:text-2xl">
              {p}
            </span>
            <Scissors className="h-5 w-5 shrink-0 text-sun" aria-hidden="true" />
          </span>
        )),
      )}
    </>
  )

  return (
    <div className="group/marquee relative overflow-hidden border-y-4 border-grass-darkest bg-grass py-4">
      <div className="flex w-max animate-marquee group-hover/marquee:[animation-play-state:paused]">
        <div className="flex items-center">{row}</div>
        <div className="flex items-center" aria-hidden="true">
          {row}
        </div>
      </div>
    </div>
  )
}

export default memo(Marquee)
