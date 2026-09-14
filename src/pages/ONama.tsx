import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useInView } from 'framer-motion'
import {
  Heart,
  ShieldCheck,
  Blocks,
  Star,
  Phone,
  CalendarCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const displayFont = "'Baloo 2', 'Nunito', system-ui, sans-serif"
const bodyFont = "'Nunito', system-ui, sans-serif"

/* ---------- small local helpers (page-scoped) ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-[#FFC93C] px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#22302A]"
      style={{ fontFamily: bodyFont }}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}

function SectionHeading({
  eyebrow,
  title,
  sub,
  light = false,
}: {
  eyebrow: string
  title: string
  sub?: string
  light?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto mb-14 max-w-2xl text-center"
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={`mt-5 text-4xl font-extrabold leading-tight tracking-[-0.01em] md:text-5xl ${
          light ? 'text-white' : 'text-[#22302A]'
        }`}
        style={{ fontFamily: displayFont }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-4 text-lg leading-relaxed ${light ? 'text-white/80' : 'text-[#22302A]/70'}`}
          style={{ fontFamily: bodyFont }}
        >
          {sub}
        </p>
      )}
    </motion.div>
  )
}

function WordSplitHeading({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <h1 className={className} style={{ fontFamily: displayFont }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.05 }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

function StatCounter({ value, suffix, label, decimals = 0 }: { value: number; suffix: string; label: string; decimals?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Number((eased * value).toFixed(decimals)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])

  return (
    <div ref={ref} className="text-center">
      <div
        className="text-5xl font-extrabold text-white md:text-6xl"
        style={{ fontFamily: displayFont }}
      >
        {display.toLocaleString('sr-Latn', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        <span className="text-[#FFC93C]">{suffix}</span>
      </div>
      <div className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-white/70" style={{ fontFamily: bodyFont }}>
        {label}
      </div>
    </div>
  )
}

function WaveDivider({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''}`} aria-hidden>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="h-[60px] w-full md:h-[90px]">
        <path
          d="M0,64 C120,96 240,96 360,72 C480,48 600,24 720,32 C840,40 960,88 1080,96 C1200,104 1320,80 1440,56 L1440,120 L0,120 Z"
          fill={fill}
        />
      </svg>
    </div>
  )
}

function CTABand() {
  const { tr } = useLang()
  return (
    <section className="bg-[#FFF9F0] px-4 py-20 md:py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-[#4CAF50] px-6 py-16 text-center shadow-2xl md:px-16"
      >
        <img
          src="/hero-shapes.svg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative">
          <h2
            className="text-4xl font-extrabold tracking-[-0.01em] text-white md:text-5xl"
            style={{ fontFamily: displayFont }}
          >
            Dođite da se upoznamo!
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85" style={{ fontFamily: bodyFont }}>
            Prva posjeta je uvijek posebna, dođite, pogledajte salon i upoznajte naš tim.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 rounded-full bg-[#FFC93C] px-8 py-4 text-base font-bold text-[#22302A] shadow-lg transition-shadow hover:shadow-xl"
                style={{ fontFamily: bodyFont }}
              >
                <CalendarCheck className="h-5 w-5" />
                {tr('nav.book')}
              </Link>
            </motion.div>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              href="tel:+38269371111"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#2E7D32] shadow-lg transition-shadow hover:shadow-xl"
              style={{ fontFamily: bodyFont }}
            >
              <Phone className="h-5 w-5" />
              069 371 111
            </motion.a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ---------- page sections ---------- */

function PageHero() {
  const { tr } = useLang()
  return (
    <section className="relative overflow-hidden bg-[#FFF9F0] px-4 pb-16 pt-20 md:pb-24 md:pt-28">
      <img
        src="/hero-shapes.svg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#22302A]/50"
          style={{ fontFamily: bodyFont }}
        >
          <Link to="/" className="transition-colors hover:text-[#4CAF50]">
            {tr('nav.home')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#2E7D32]">{tr('onama.crumb')}</span>
        </motion.nav>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
        >
          <Eyebrow>{tr('onama.eyebrow')}</Eyebrow>
        </motion.div>
        <WordSplitHeading
          text={tr('onama.heroTitle')}
          className="mt-6 text-[40px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[#22302A] md:text-6xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.5 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#22302A]/70"
          style={{ fontFamily: bodyFont }}
        >
          {tr('onama.heroSub')}
        </motion.p>
      </div>
    </section>
  )
}

function Story() {
  const { tr } = useLang()
  const storyChips = [tr('onama.chip1'), tr('onama.chip2'), tr('onama.chip3')]
  const paragraphs = [tr('onama.sp1'), tr('onama.sp2'), tr('onama.sp3')]
  return (
    <section className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Eyebrow>{tr('onama.storyEyebrow')}</Eyebrow>
            <h2
              className="mt-5 text-4xl font-extrabold tracking-[-0.01em] text-[#22302A] md:text-5xl"
              style={{ fontFamily: displayFont }}
            >
              {tr('onama.storyTitle')}
            </h2>
          </motion.div>
          {paragraphs.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.12 * (i + 1) }}
              className="mt-5 text-lg leading-relaxed text-[#22302A]/75"
              style={{ fontFamily: bodyFont }}
            >
              {p}
            </motion.p>
          ))}
          <div className="mt-8 flex flex-wrap gap-3">
            {storyChips.map((chip, i) => (
              <motion.span
                key={chip}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.4 + i * 0.1 }}
                className="rounded-full bg-[#F0F7EF] px-5 py-2.5 text-sm font-bold text-[#2E7D32]"
                style={{ fontFamily: bodyFont }}
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative"
        >
          <div className="absolute -bottom-4 -right-4 h-full w-full rounded-[32px] bg-[#FF7A59]" aria-hidden />
          <img
            src="/real-salon.jpg"
            alt={tr('onama.storyImgAlt')}
            className="relative w-full rounded-[32px] object-cover shadow-xl"
          />
        </motion.div>
      </div>
    </section>
  )
}

function Values() {
  const { tr } = useLang()
  const values = [
    { icon: Heart, color: '#FF7A59', title: tr('onama.v1t'), text: tr('onama.v1x') },
    { icon: ShieldCheck, color: '#4CAF50', title: tr('onama.v2t'), text: tr('onama.v2x') },
    { icon: Blocks, color: '#7ED6F2', title: tr('onama.v3t'), text: tr('onama.v3x') },
    { icon: Star, color: '#FFC93C', title: tr('onama.v4t'), text: tr('onama.v4x') },
  ]
  return (
    <section className="bg-[#F0F7EF]">
      <WaveDivider fill="#ffffff" flip />
      <div className="px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={tr('onama.valEyebrow')} title={tr('onama.valTitle')} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
                whileHover={{ rotate: 2, y: -6 }}
                className="rounded-3xl bg-white p-8 text-center shadow-sm"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.2 + i * 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${v.color}22` }}
                >
                  <v.icon className="h-8 w-8" style={{ color: v.color }} />
                </motion.div>
                <h3
                  className="mt-5 text-2xl font-bold text-[#22302A]"
                  style={{ fontFamily: displayFont }}
                >
                  {v.title}
                </h3>
                <p className="mt-2 leading-relaxed text-[#22302A]/70" style={{ fontFamily: bodyFont }}>
                  {v.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <WaveDivider fill="#ffffff" />
    </section>
  )
}

function Ambience() {
  const { tr } = useLang()
  const ambienceRows = [
    { image: '/about-salon.jpg', alt: tr('onama.a1alt'), title: tr('onama.a1t'), text: tr('onama.a1x'), accent: '#4CAF50' },
    { image: '/gallery-3.jpg', alt: tr('onama.a2alt'), title: tr('onama.a2t'), text: tr('onama.a2x'), accent: '#FF7A59' },
    { image: '/gallery-4.jpg', alt: tr('onama.a3alt'), title: tr('onama.a3t'), text: tr('onama.a3x'), accent: '#7ED6F2' },
  ]
  return (
    <section className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={tr('onama.ambEyebrow')}
          title={tr('onama.ambTitle')}
          sub={tr('onama.ambSub')}
        />
        <div className="space-y-16 md:space-y-24">
          {ambienceRows.map((row, i) => {
            const imageLeft = i % 2 === 0
            return (
              <div
                key={row.title}
                className="grid items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                <motion.div
                  initial={{ opacity: 0, x: imageLeft ? -60 : 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className={`relative ${imageLeft ? '' : 'md:order-2'}`}
                >
                  <div
                    className={`absolute h-full w-full rounded-[32px] ${
                      imageLeft ? '-bottom-4 -left-4' : '-bottom-4 -right-4'
                    }`}
                    style={{ backgroundColor: row.accent }}
                    aria-hidden
                  />
                  <motion.img
                    src={row.image}
                    alt={row.alt}
                    className="relative aspect-[4/3] w-full rounded-[32px] object-cover shadow-xl"
                    initial={{ y: 0 }}
                    whileInView={{ y: [-8, 8, -8] }}
                    viewport={{ once: false }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: imageLeft ? 60 : -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
                  className={imageLeft ? '' : 'md:order-1'}
                >
                  <span
                    className="inline-block rounded-full px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-white"
                    style={{ backgroundColor: row.accent, fontFamily: bodyFont }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className="mt-4 text-3xl font-bold tracking-[-0.01em] text-[#22302A] md:text-4xl"
                    style={{ fontFamily: displayFont }}
                  >
                    {row.title}
                  </h3>
                  <p
                    className="mt-4 text-lg leading-relaxed text-[#22302A]/70"
                    style={{ fontFamily: bodyFont }}
                  >
                    {row.text}
                  </p>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StatsBand() {
  const { tr } = useLang()
  const stats: { value: number; suffix: string; label: string; decimals?: number }[] = [
    { value: 3, suffix: '', label: tr('onama.stat1') },
    { value: 5000, suffix: '+', label: tr('onama.stat2') },
    { value: 4.5, suffix: '★', label: tr('onama.stat3'), decimals: 1 },
    { value: 3500, suffix: '+', label: tr('onama.stat4') },
  ]
  return (
    <section className="bg-[#2E7D32] px-4 py-16 md:py-20">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCounter key={s.label} value={s.value} suffix={s.suffix} label={s.label} decimals={s.decimals} />
        ))}
      </div>
    </section>
  )
}

function WhyParents() {
  const { tr } = useLang()
  const whyItems = [
    tr('onama.w1'),
    tr('onama.w2'),
    tr('onama.w3'),
    tr('onama.w4'),
    tr('onama.w5'),
    tr('onama.w6'),
  ]
  return (
    <section className="bg-[#FFF9F0] px-4 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow={tr('onama.whyEyebrow')}
          title={tr('onama.whyTitle')}
        />
        <div className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
          {whyItems.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: EASE, delay: i * 0.07 }}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm"
            >
              <img src="/scissors-icon.svg" alt="" className="h-8 w-8 shrink-0" />
              <span className="text-lg font-semibold text-[#22302A]" style={{ fontFamily: bodyFont }}>
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ONama() {
  return (
    <main className="bg-[#FFF9F0]" style={{ fontFamily: bodyFont }}>
      <PageHero />
      <Story />
      <Values />
      <Ambience />
      <StatsBand />
      <WhyParents />
      <CTABand />
    </main>
  )
}
