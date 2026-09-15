import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Gift, Phone, Scissors, Camera, Sparkles } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

const TEAL = '#0E4B44'
const GOLD = '#F5C518'
const CREAM = '#FFF5E5'

/** Perforirana ivica vaučera (kružići duž ivice) */
function Perforation({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-between self-stretch py-3" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      ))}
    </div>
  )
}

function VoucherCard({
  variant,
  title,
  lines,
  badge,
  delay,
}: {
  variant: 'teal' | 'gold'
  title: string
  lines: string[]
  badge: string
  delay: number
}) {
  const isTeal = variant === 'teal'
  const bg = isTeal ? TEAL : GOLD
  const fg = isTeal ? CREAM : '#22302A'
  const accent = isTeal ? GOLD : TEAL
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotate: isTeal ? -3 : 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: isTeal ? -1.5 : 1.5 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ rotate: 0, y: -8, transition: { duration: 0.3 } }}
      className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
      style={{ backgroundColor: bg, color: fg }}
    >
      {/* watermark logo */}
      <img
        src="/logo-footer.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-15"
      />
      <div className="flex">
        <div className="flex-1 p-7 md:p-8">
          <span
            className="inline-block rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ borderColor: accent, color: accent }}
          >
            Poklon vaučer
          </span>
          <h3 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">{title}</h3>
          <ul className="mt-4 space-y-1.5 text-[15px] font-semibold opacity-90">
            {lines.map((l) => (
              <li key={l} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                {l}
              </li>
            ))}
          </ul>
          <div
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black uppercase tracking-wide"
            style={{ backgroundColor: accent, color: isTeal ? '#22302A' : CREAM }}
          >
            <Sparkles className="h-4 w-4" />
            {badge}
          </div>
        </div>
        <Perforation color={isTeal ? '#0a3a35' : '#d9a800'} />
        <div
          className="flex w-16 flex-col items-center justify-center gap-2 md:w-20"
          style={{ backgroundColor: isTeal ? '#0a3a35' : '#e6b400' }}
        >
          <Scissors className="h-6 w-6" style={{ color: isTeal ? GOLD : TEAL }} />
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: isTeal ? GOLD : TEAL, writingMode: 'vertical-rl' }}
          >
            Grašak
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function Vaucer() {
  const { tr } = useLang()
  return (
    <section className="relative overflow-hidden px-6 py-20 md:py-28" style={{ backgroundColor: TEAL }}>
      {/* watermark */}
      <img
        src="/logo-footer.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      />
      <div className="relative mx-auto max-w-[1100px] text-center">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-bold uppercase tracking-[0.1em]"
          style={{ backgroundColor: GOLD, color: '#22302A' }}
        >
          <Gift className="h-4 w-4" />
          {tr('vaucer.eyebrow')}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-5 font-display text-4xl font-bold md:text-6xl"
          style={{ color: CREAM }}
        >
          {tr('vaucer.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-4 max-w-2xl text-lg"
          style={{ color: `${CREAM}CC` }}
        >
          {tr('vaucer.sub')}
        </motion.p>

        <div className="mt-12 flex flex-col items-center justify-center gap-8 lg:flex-row">
          <VoucherCard
            variant="teal"
            title={tr('vaucer.v1t')}
            lines={[tr('vaucer.v1l1'), tr('vaucer.v1l2')]}
            badge={tr('vaucer.v1b')}
            delay={0.2}
          />
          <VoucherCard
            variant="gold"
            title={tr('vaucer.v2t')}
            lines={[tr('vaucer.v2l1'), tr('vaucer.v2l2'), tr('vaucer.v2l3')]}
            badge={tr('vaucer.v2b')}
            delay={0.35}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/kontakt?vaucer=1"
            className="flex items-center gap-2 rounded-full px-8 py-4 text-lg font-bold shadow-xl transition-transform hover:scale-105"
            style={{ backgroundColor: GOLD, color: '#22302A' }}
          >
            <Gift className="h-5 w-5" />
            {tr('vaucer.cta')}
          </Link>
          <a
            href="tel:+38269371111"
            className="flex items-center gap-2 rounded-full border-2 px-8 py-4 text-lg font-bold transition-transform hover:scale-105"
            style={{ borderColor: `${CREAM}66`, color: CREAM }}
          >
            <Phone className="h-5 w-5" /> 069 371 111
          </a>
        </motion.div>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: `${CREAM}99` }}>
          <Camera className="h-4 w-4" /> {tr('vaucer.note')}
        </p>
      </div>
    </section>
  )
}
