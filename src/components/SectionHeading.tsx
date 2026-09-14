import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Props {
  eyebrow?: string
  title: string
  sub?: string
  align?: 'center' | 'left'
}

export default function SectionHeading({ eyebrow, title, sub, align = 'center' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn('mb-12', align === 'center' ? 'text-center' : 'text-left')}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full bg-sun px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
          <img src="/scissors-icon.svg" alt="" className="h-4 w-4" />
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 font-display text-4xl font-bold text-ink md:text-5xl">{title}</h2>
      {sub && <p className="mx-auto mt-3 max-w-xl text-lg text-ink/70">{sub}</p>}
    </motion.div>
  )
}
