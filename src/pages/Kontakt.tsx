import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Mail,
  Instagram,
  CheckCircle2,
  Car,
  Clock,
  ExternalLink,
  Send,
  MessageCircle,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useLang } from '@/i18n/LanguageContext'

const GRASS = '#4CAF50'
const GRASS_DEEP = '#2E7D32'
const SUN = '#FFC93C'
const CORAL = '#FF7A59'
const SKY = '#7ED6F2'
const CREAM = '#FFF9F0'
const INK = '#22302A'
const TINT = '#F0F7EF'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: EASE },
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-full px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em]"
      style={{ backgroundColor: SUN, color: INK, fontFamily: "'Nunito', sans-serif" }}
    >
      {children}
    </span>
  )
}

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 420,
        y: -(Math.random() * 260 + 60),
        rotate: Math.random() * 720 - 360,
        size: Math.random() * 8 + 6,
        color: [GRASS, SUN, CORAL, SKY][i % 4],
        round: i % 3 === 0,
        delay: Math.random() * 0.15,
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, 220], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: 1.6, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function BookingFormCard() {
  const { tr } = useLang()
  const SERVICES = [
    tr('kontakt.s1'),
    tr('kontakt.s2'),
    tr('kontakt.s3'),
    tr('kontakt.s4'),
    tr('kontakt.s5'),
    tr('kontakt.s6'),
    tr('kontakt.s7'),
    tr('kontakt.s8'),
    tr('kontakt.s9'),
  ]
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputCls =
    'w-full rounded-xl border border-[#E3EDE3] bg-white px-4 py-3 text-[15px] outline-none transition focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] placeholder:text-[#22302A]/40'

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative overflow-hidden rounded-3xl bg-white shadow-xl"
      style={{ borderTop: `6px solid ${GRASS}` }}
    >
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="relative flex min-h-[480px] flex-col items-center justify-center gap-4 p-10 text-center"
          >
            <ConfettiBurst />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            >
              <CheckCircle2 size={72} style={{ color: GRASS }} strokeWidth={1.6} />
            </motion.div>
            <h3
              className="text-3xl font-bold"
              style={{ fontFamily: "'Baloo 2', cursive", color: INK }}
            >
              {tr('kontakt.thanks')}
            </h3>
            <p className="max-w-sm text-[17px] leading-relaxed" style={{ color: `${INK}B3` }}>
              {tr('kontakt.thanksSub')}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: GRASS }}
            >
              {tr('kontakt.newInquiry')}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5 p-8 md:p-10"
          >
            <h3
              className="text-2xl font-bold md:text-[28px]"
              style={{ fontFamily: "'Baloo 2', cursive", color: INK }}
            >
              {tr('kontakt.formTitle')}
            </h3>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: `${INK}99` }}>
                  {tr('kontakt.nameLabel')}
                </span>
                <input required type="text" className={inputCls} placeholder={tr('kontakt.namePlaceholder')} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: `${INK}99` }}>
                  Broj telefona *
                </span>
                <input
                  required
                  type="tel"
                  pattern="[0-9+\s\-()]{6,17}"
                  title="Unesite ispravan broj telefona (npr. 069 371 111)"
                  className={inputCls}
                  placeholder="069 000 000"
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: `${INK}99` }}>
                  {tr('kontakt.childName')}
                </span>
                <input type="text" className={inputCls} placeholder={tr('kontakt.childNamePh')} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: `${INK}99` }}>
                  {tr('kontakt.childAge')}
                </span>
                <input type="text" inputMode="numeric" className={inputCls} placeholder={tr('kontakt.childAgePh')} />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: `${INK}99` }}>
                  {tr('kontakt.serviceLabel')}
                </span>
                <select className={inputCls} defaultValue={SERVICES[0]}>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: `${INK}99` }}>
                  {tr('kontakt.dateLabel')}
                </span>
                <input type="date" min={new Date().toISOString().split('T')[0]} className={inputCls} />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: `${INK}99` }}>
                Napomena
              </span>
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder={tr('kontakt.notePlaceholder')}
              />
            </label>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg font-bold text-white shadow-lg"
              style={{ backgroundColor: GRASS, fontFamily: "'Baloo 2', cursive" }}
            >
              <Send size={20} />
              {tr('kontakt.submit')}
            </motion.button>

            <p className="text-center text-sm" style={{ color: `${INK}80` }}>
              {tr('kontakt.submitNote')}
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function InfoCards() {
  const { tr } = useLang()
  const [copied, setCopied] = useState(false)
  const onCopy = (text: string) => {
    try {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }
  const INFO_CARDS = [
    {
      icon: Phone,
      title: tr('kontakt.phone'),
      value: '+382 69 371 111',
      href: 'tel:+38269371111',
      bg: '#FFEDE7',
      accent: CORAL,
    },
    {
      icon: Mail,
      title: tr('kontakt.email'),
      value: 'grasaksalon@gmail.com',
      href: 'mailto:grasaksalon@gmail.com?subject=Upit%20-%20Gra%C5%A1ak%20salon',
      copy: 'grasaksalon@gmail.com',
      bg: '#E5F6FD',
      accent: SKY,
    },
    {
      icon: null, // map-pin.svg image
      title: tr('kontakt.address'),
      value: tr('kontakt.addressValue'),
      extra: tr('kontakt.parking'),
      href: 'https://www.google.com/maps/place/GRAŠAK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95',
      bg: '#E9F5EA',
      accent: GRASS,
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: tr('kontakt.waValue'),
      href: 'https://wa.me/38269371111?text=' + encodeURIComponent(tr('kontakt.waMsg')),
      bg: '#E5F8EC',
      accent: '#25D366',
    },
    {
      icon: MessageCircle,
      title: 'Viber',
      value: tr('kontakt.viberValue'),
      href: 'viber://chat?number=%2B38269371111',
      bg: '#EFE9FF',
      accent: '#7360F2',
    },
    {
      icon: Instagram,
      title: 'Instagram',
      value: '@djecijisalon',
      href: 'https://instagram.com/djecijisalon',
      bg: '#FFF4D6',
      accent: SUN,
    },
  ]
  return (
    <div className="flex flex-col gap-5">
      {INFO_CARDS.map((card, i) => (
        <motion.a
          key={card.title}
          href={card.href}
          onClick={'copy' in card && card.copy ? () => onCopy(card.copy as string) : undefined}
          target={card.href.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
          whileHover={{ y: -4 }}
          className="flex items-start gap-4 rounded-3xl p-6 shadow-md transition-shadow hover:shadow-lg"
          style={{ backgroundColor: card.bg }}
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm"
          >
            {card.icon ? (
              <card.icon size={24} style={{ color: card.accent }} />
            ) : (
              <img src="/map-pin.svg" alt="" className="h-7 w-7" />
            )}
          </span>
          <span className="min-w-0">
            <span
              className="block text-[13px] font-bold uppercase tracking-[0.08em]"
              style={{ color: `${INK}80` }}
            >
              {card.title}
            </span>
            <span className="mt-1 block break-words text-[17px] font-bold" style={{ color: INK }}>
              {card.value}
            </span>
            {card.extra && (
              <span className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: GRASS_DEEP }}>
                <Car size={16} />
                {card.extra}
              </span>
            )}
            {'copy' in card && card.copy && (
              <span
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm"
                style={{ color: copied ? GRASS_DEEP : `${INK}99` }}
              >
                {copied ? <CheckCircle2 size={14} /> : <Mail size={14} />}
                {copied ? tr('kontakt.copied') : tr('kontakt.emailHint')}
              </span>
            )}
          </span>
        </motion.a>
      ))}
    </div>
  )
}

type DayRow = { days: string; hours: string; closed?: boolean; match: (d: number) => boolean }

function WorkingHours() {
  const { tr } = useLang()
  const WEEK: DayRow[] = [
    { days: tr('kontakt.mon'), hours: tr('kontakt.closed'), closed: true, match: (d) => d === 1 },
    { days: tr('kontakt.tueFri'), hours: '15:00 – 21:00', match: (d) => d >= 2 && d <= 5 },
    { days: tr('kontakt.satSun'), hours: '11:00 – 21:00', match: (d) => d === 0 || d === 6 },
  ]
  const today = new Date().getDay()
  return (
    <section className="relative py-20 md:py-24" style={{ backgroundColor: TINT }}>
      <div className="mx-auto max-w-[560px] px-6">
        <motion.div {...fadeUp} className="rounded-3xl bg-white p-8 shadow-xl md:p-10">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Clock size={28} style={{ color: GRASS }} />
            <h2
              className="text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "'Baloo 2', cursive", color: INK }}
            >
              {tr('kontakt.hoursTitle')}
            </h2>
          </div>
          <div className="flex flex-col divide-y divide-[#EAF2EA]">
            {WEEK.map((row, i) => {
              const isToday = row.match(today)
              return (
                <motion.div
                  key={row.days}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                  className="flex items-center justify-between gap-3 py-4"
                >
                  <span className="flex items-center gap-2.5 text-[17px] font-bold" style={{ color: INK }}>
                    {row.days}
                    {isToday && (
                      <motion.span
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                        className="rounded-full px-3 py-0.5 text-[12px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: GRASS }}
                      >
                        {tr('kontakt.today')}
                      </motion.span>
                    )}
                  </span>
                  <span
                    className="text-[17px] font-bold"
                    style={{
                      color: row.closed ? CORAL : GRASS_DEEP,
                      fontFamily: "'Baloo 2', cursive",
                    }}
                  >
                    {row.hours}
                  </span>
                </motion.div>
              )
            })}
          </div>
          <p className="mt-6 text-center text-[15px] leading-relaxed" style={{ color: `${INK}99` }}>
            Za hitne slučajeve i posebne prilike, pozovite nas, naći ćemo rješenje. 😊
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function MapSection() {
  const { tr } = useLang()
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-[1376px] px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-3xl shadow-xl"
        >
          <iframe
            title={tr('kontakt.mapTitle')}
            src="https://www.google.com/maps?q=Gra%C5%A1ak%20dje%C4%8Diji%20frizerski%20salon%2C%20Branka%20Deleti%C4%87a%20bb%2C%20Podgorica&output=embed"
            className="h-[340px] w-full border-0 md:h-[460px] md:grayscale md:transition-all md:duration-500 md:hover:grayscale-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
            className="mx-4 -mt-10 max-w-[320px] rounded-2xl bg-white p-5 shadow-xl md:absolute md:left-6 md:top-6 md:mx-0 md:mt-0"
          >
            <div className="flex items-center gap-3">
              <img src="/map-pin.svg" alt="" className="h-10 w-10" />
              <div>
                <p className="text-lg font-bold" style={{ fontFamily: "'Baloo 2', cursive", color: INK }}>
                  {tr('kontakt.mapName')}
                </p>
                <p className="text-sm" style={{ color: `${INK}99` }}>
                  {tr('kontakt.mapSub')}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="https://www.google.com/maps/place/GRAŠAK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
                style={{ color: GRASS_DEEP }}
              >
                {tr('kontakt.mapBusiness')}
                <ExternalLink size={14} />
              </a>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Grašak+dječiji+frizerski+salon,+Branka+Deletića+bb,+Podgorica"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
                style={{ color: CORAL }}
              >
                {tr('kontakt.mapDir')}
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function MiniFaq() {
  const { tr } = useLang()
  const FAQ = [
    { q: tr('kontakt.f1q'), a: tr('kontakt.f1a') },
    { q: tr('kontakt.f2q'), a: tr('kontakt.f2a') },
    { q: tr('kontakt.f3q'), a: tr('kontakt.f3a') },
  ]
  return (
    <section className="py-20 md:py-24" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-[760px] px-6">
        <motion.div {...fadeUp} className="mb-10 text-center">
          <Eyebrow>{tr('kontakt.faqEyebrow')}</Eyebrow>
          <h2
            className="mt-4 text-3xl font-bold md:text-[42px]"
            style={{ fontFamily: "'Baloo 2', cursive", color: INK }}
          >
            {tr('kontakt.faqTitle')}
          </h2>
        </motion.div>
        <motion.div {...fadeUp}>
          <Accordion type="single" collapsible className="flex flex-col gap-4">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border-none bg-white px-6 shadow-md"
              >
                <AccordionTrigger
                  className="py-5 text-left text-[17px] font-bold hover:no-underline"
                  style={{ color: INK, fontFamily: "'Baloo 2', cursive" }}
                >
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[16px] leading-relaxed" style={{ color: `${INK}B3` }}>
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}

function CtaBand() {
  const { tr } = useLang()
  return (
    <section className="px-4 pb-20 pt-4 md:px-8" style={{ backgroundColor: CREAM }}>
      <motion.div
        {...fadeUp}
        className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl px-6 py-16 text-center md:py-20"
        style={{ backgroundColor: GRASS }}
      >
        <img
          src="/hero-shapes.svg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <img
          src="/grass-tuft.svg"
          alt=""
          className="pointer-events-none absolute -bottom-4 left-6 w-28 opacity-40"
        />
        <div className="relative">
          <h2
            className="text-4xl font-bold text-white md:text-5xl"
            style={{ fontFamily: "'Baloo 2', cursive" }}
          >
            {tr('kontakt.ctaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
            {tr('kontakt.ctaSub')}
          </p>
          <motion.a
            href="tel:+38269371111"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold shadow-lg"
            style={{ color: GRASS_DEEP, fontFamily: "'Baloo 2', cursive" }}
          >
            <Phone size={20} />
            069 371 111
          </motion.a>
        </div>
      </motion.div>
    </section>
  )
}

export default function Kontakt() {
  const { tr } = useLang()
  const titleWords = tr('kontakt.heroTitle').split(' ')
  return (
    <main style={{ fontFamily: "'Nunito', sans-serif", color: INK }}>
      {/* 1. Hero */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ backgroundColor: CREAM }}>
        <img
          src="/hero-shapes.svg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative mx-auto max-w-[760px] px-6 text-center">
          <nav className="mb-6 text-sm font-semibold" style={{ color: `${INK}80` }}>
            <Link to="/" className="hover:underline" style={{ color: GRASS_DEEP }}>
              {tr('nav.home')}
            </Link>
            <span className="mx-2">/</span>
            <span>{tr('kontakt.crumb')}</span>
          </nav>
          <Eyebrow>{tr('kontakt.eyebrow')}</Eyebrow>
          <h1
            className="mt-5 text-[40px] font-bold leading-tight md:text-6xl"
            style={{ fontFamily: "'Baloo 2', cursive", letterSpacing: '-0.01em' }}
          >
            {titleWords.map((w, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
              >
                {w}
                {i < titleWords.length - 1 ? ' ' : ''}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed"
            style={{ color: `${INK}B3` }}
          >
            {tr('kontakt.heroSub')}
          </motion.p>
        </div>
      </section>

      {/* 2. Booking form + info cards */}
      <section className="bg-white py-20 md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <BookingFormCard />
          </div>
          <div className="lg:col-span-2">
            <InfoCards />
          </div>
        </div>
      </section>

      {/* 3. Radno vrijeme */}
      <WorkingHours />

      {/* 3b. Foto traka salona */}
      <section className="bg-white pb-20">
        <div className="mx-auto grid max-w-[1200px] gap-5 px-6 sm:grid-cols-3">
          {[
            { src: '/real-salon.jpg', alt: 'Enterijer salona Grašak' },
            { src: '/mural.jpg', alt: 'Mural graška sa malim gostom' },
            { src: '/real-nikola.jpg', alt: 'Frizer Nikola u akciji' },
          ].map((img, i) => (
            <motion.img
              key={img.src}
              src={img.src}
              alt={img.alt}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="h-56 w-full rounded-3xl object-cover shadow-md"
            />
          ))}
        </div>
      </section>

      {/* 4. Mapa */}
      <MapSection />

      {/* 5. Mini FAQ */}
      <MiniFaq />

      {/* 6. CTA band */}
      <CtaBand />
    </main>
  )
}
