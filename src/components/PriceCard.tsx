import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PriceColor = 'grass' | 'sun' | 'coral' | 'sky'

const bar: Record<PriceColor, string> = {
  grass: 'bg-grass',
  sun: 'bg-sun',
  coral: 'bg-coral',
  sky: 'bg-sky',
}

interface Props {
  name: string
  price: string
  duration?: string
  note?: string
  color?: PriceColor
  badge?: string
}

export default function PriceCard({ name, price, duration, note, color = 'grass', badge }: Props) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden rounded-3xl bg-white p-7 shadow-md shadow-ink/5 hover:shadow-xl hover:shadow-ink/10"
    >
      {/* animated dual-path SVG frame */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <rect
          rx="22"
          fill="none"
          stroke="#87BD6D"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          style={{ x: 2, y: 2, width: 'calc(100% - 4px)', height: 'calc(100% - 4px)' }}
        />
        <rect
          className="frame-run"
          rx="22"
          fill="none"
          stroke="#45813D"
          strokeWidth="2.5"
          pathLength={100}
          style={{ x: 2, y: 2, width: 'calc(100% - 4px)', height: 'calc(100% - 4px)' }}
        />
      </svg>
      <div className={cn('absolute inset-x-0 top-0 h-2 transition-all duration-300 group-hover:h-3', bar[color])} />
      {badge && (
        <span className="absolute right-5 top-5 -rotate-6 rounded-full bg-sun px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink shadow">
          {badge}
        </span>
      )}
      <h3 className="mt-2 font-display text-2xl font-bold text-ink">{name}</h3>
      {duration && (
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-grass-tint px-3 py-1 text-xs font-bold text-grass-deep">
          <Clock className="h-3.5 w-3.5" /> {duration}
        </span>
      )}
      <div className="mt-4 font-display text-5xl font-bold text-grass-deep">{price}</div>
      {note && <p className="mt-3 text-sm text-ink/70">{note}</p>}
    </motion.div>
  )
}
