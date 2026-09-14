import { motion } from 'framer-motion'
import { Star, ExternalLink } from 'lucide-react'
import { GOOGLE_MAPS_URL, type Review } from '@/data/reviews'
import { useLang } from '@/i18n/LanguageContext'

export default function ReviewCard({ name, role, quote, rating }: Review) {
  const { tr } = useLang()
  return (
    <motion.a
      href={GOOGLE_MAPS_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ rotate: 2, y: -4 }}
      transition={{ type: 'spring', stiffness: 250, damping: 18 }}
      className="group flex h-full w-[320px] shrink-0 snap-start flex-col rounded-3xl bg-white p-7 shadow-md shadow-ink/5 sm:w-[360px]"
      aria-label={tr('misc.reviewAria', { name })}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-1" aria-label={tr('misc.starsAria', { rating })}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < rating ? 'h-5 w-5 fill-sun text-sun' : 'h-5 w-5 text-ink/15'
              }
            />
          ))}
        </div>
        <ExternalLink className="h-4 w-4 text-ink/30 transition-colors group-hover:text-grass" />
      </div>
      <blockquote className="mt-4 flex-1 text-ink/80">„{quote}“</blockquote>
      <figcaption className="mt-5 flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate font-display text-lg font-bold text-ink">{name}</span>
          <span className="block text-xs font-semibold uppercase tracking-wide text-ink/45">{role}</span>
        </span>
        <span className="shrink-0 rounded-full bg-grass-tint px-3 py-1 text-xs font-bold text-grass-deep">
          Google
        </span>
      </figcaption>
    </motion.a>
  )
}
