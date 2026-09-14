import { memo } from 'react'
import type { CSSProperties } from 'react'
import { Star, Scissors, Sparkles } from 'lucide-react'

/**
 * Sine-wave floating decor, transform-only gentle oscillation at
 * different phases/durations. Isolated + memoized so parents never
 * restart the infinite loops.
 */
const ITEMS: { Icon: typeof Star; cls: string; style: CSSProperties }[] = [
  { Icon: Star, cls: 'left-[6%] top-[18%] h-8 w-8 text-sun', style: { animationDuration: '5.2s', animationDelay: '0s' } },
  { Icon: Scissors, cls: 'right-[8%] top-[24%] h-9 w-9 text-grass-light', style: { animationDuration: '6.4s', animationDelay: '0.8s' } },
  { Icon: Sparkles, cls: 'left-[12%] bottom-[16%] h-7 w-7 text-coral/80', style: { animationDuration: '5.8s', animationDelay: '1.6s' } },
  { Icon: Star, cls: 'right-[14%] bottom-[22%] h-6 w-6 text-grass-mid', style: { animationDuration: '7s', animationDelay: '2.2s' } },
]

function FloatDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
      {ITEMS.map(({ Icon, cls, style }, i) => (
        <Icon key={i} className={`absolute animate-float-sine ${cls}`} style={style} />
      ))}
      {/* grass tuft shapes */}
      <img src="/grass-tuft.svg" alt="" className="absolute bottom-[8%] left-[40%] h-10 w-auto animate-float-sine opacity-60" style={{ animationDuration: '6.8s', animationDelay: '0.4s' }} />
      <img src="/grass-tuft.svg" alt="" className="absolute right-[34%] top-[12%] h-8 w-auto animate-float-sine opacity-50" style={{ animationDuration: '5.6s', animationDelay: '1.2s' }} />
    </div>
  )
}

export default memo(FloatDecor)
