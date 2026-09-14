import { Link } from 'react-router'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Scissors, Smile, Star, Instagram, MapPin, Heart, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { reviews, GOOGLE_MAPS_URL, GOOGLE_RATING } from '@/data/reviews'
import { useRef } from 'react'
import SectionHeading from '@/components/SectionHeading'
import PriceCard from '@/components/PriceCard'
import ReviewCard from '@/components/ReviewCard'
import FaqAccordion from '@/components/FaqAccordion'
import StatCounter from '@/components/StatCounter'
import CTABand from '@/components/CTABand'
import VisitStory from '@/components/VisitStory'
import Marquee from '@/components/Marquee'
import GrassDivider from '@/components/GrassDivider'
import OutlineHeading from '@/components/OutlineHeading'
import BrandStrip from '@/components/BrandStrip'
import FloatDecor from '@/components/FloatDecor'
import { useLang } from '@/i18n/LanguageContext'

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const rise: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
}

function Wave({ className, flip = false }: { className: string; flip?: boolean }) {
  return (
    <div className={`pointer-events-none relative -mb-px h-[70px] w-full overflow-hidden md:h-[100px] ${className}`}>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`h-full w-full ${flip ? 'rotate-180' : ''}`}
      >
        <path
          fill="currentColor"
          d="M0 64 C120 20 240 20 360 56 C480 92 600 100 720 72 C840 44 960 16 1080 40 C1200 64 1320 92 1440 56 L1440 120 L0 120 Z"
        />
      </svg>
    </div>
  )
}

export default function Home() {
  const { tr } = useLang()
  const heroWords1 = tr('home.hero1').split(' ')
  const heroWords2 = tr('home.hero2').split(' ')
  const prices = [
    { name: tr('home.p1name'), price: '8€', duration: '~15 min', color: 'grass' as const },
    { name: tr('home.p2name'), price: '10€', duration: '~20 min', color: 'sun' as const },
    { name: tr('home.p3name'), price: '12€', duration: '~30 min', color: 'coral' as const },
    {
      name: tr('home.p4name'),
      price: '14€',
      duration: '~30 min',
      note: tr('home.p4note'),
      color: 'sky' as const,
      badge: tr('home.p4badge'),
    },
  ]
  const faqs = [
    { q: tr('home.faq1q'), a: tr('home.faq1a') },
    { q: tr('home.faq2q'), a: tr('home.faq2a') },
    { q: tr('home.faq3q'), a: tr('home.faq3a') },
    { q: tr('home.faq4q'), a: tr('home.faq4a') },
  ]
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: number) => carouselRef.current?.scrollBy({ left: dir * 380, behavior: 'smooth' })

  return (
    <>
      {/* 1. HERO */}
      <section className="relative overflow-hidden bg-cream">
        <img
          src="/hero-shapes.svg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <FloatDecor />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-24 pt-10 md:pt-16 lg:grid-cols-[55%_45%]">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-sun px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-ink"
            >
              <img src="/scissors-icon.svg" alt="" className="h-4 w-4" />
              {tr('home.badge')}
            </motion.span>

            <h1 className="mt-6 font-display text-[40px] font-extrabold leading-[1.08] text-ink md:text-6xl lg:text-[64px]">
              {heroWords1.map((w, i) => (
                <motion.span
                  key={i}
                  className="inline-block whitespace-pre"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: easeOut }}
                >
                  {w}{' '}
                </motion.span>
              ))}
              <br />
              {heroWords2.map((w, i) => (
                <motion.span
                  key={i}
                  className="text-gradient-grass-sky inline-block whitespace-pre"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.6, ease: easeOut }}
                >
                  {w}{' '}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-6 max-w-xl text-lg text-ink/75"
            >
              {tr('home.heroSub')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/kontakt"
                  className="block rounded-full bg-grass px-8 py-4 font-bold text-white shadow-lg shadow-grass/30 hover:bg-grass-deep"
                >
                  {tr('home.book')}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/usluge"
                  className="block rounded-full border-2 border-grass px-8 py-4 font-bold text-grass-deep hover:bg-grass-tint"
                >
                  {tr('home.prices')}
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-4 text-sm font-bold text-ink/70"
            >
              <span className="flex items-center gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-sun text-sun" />
                ))}
                <span className="relative inline-block h-4 w-4">
                  <Star className="absolute inset-0 h-4 w-4 text-sun" />
                  <span className="absolute inset-0 w-1/2 overflow-hidden">
                    <Star className="h-4 w-4 fill-sun text-sun" />
                  </span>
                </span>
                <span className="ml-1">{tr('home.ratingText')}</span>
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
                <MapPin className="h-4 w-4 text-coral" /> {tr('home.location')}
              </span>
            </motion.div>
          </div>

          {/* right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="relative mx-auto w-full max-w-[440px]"
          >
            <div className="absolute -inset-2 translate-x-4 translate-y-4 rounded-[32px] bg-coral/80" />
            <img
              src="/hero-kid.jpg"
              alt={tr('home.heroImgAlt')}
              className="relative aspect-[6/7] w-full rounded-[32px] object-cover shadow-xl"
            />
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 -top-4 rounded-full bg-sun px-4 py-2 font-display text-lg font-bold text-ink shadow-lg"
            >
              {tr('home.chip1')}
            </motion.span>
            <motion.span
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="absolute -bottom-4 -right-4 rounded-full bg-sky px-4 py-2 font-display text-lg font-bold text-ink shadow-lg"
            >
              {tr('home.chip2')}
            </motion.span>
          </motion.div>
        </div>
        <Wave className="text-white" />
      </section>

      {/* MARQUEE */}
      <Marquee />

      {/* 2. STATS */}
      <section className="bg-white px-6 py-16 md:py-24">
        <OutlineHeading text={tr('home.outline')} className="mx-auto mb-12 max-w-4xl" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto grid max-w-[1200px] grid-cols-2 gap-5 lg:grid-cols-4"
        >
          <motion.div variants={rise}>
            <StatCounter value={3} label={tr('home.stat1')} icon={Scissors} />
          </motion.div>
          <motion.div variants={rise}>
            <StatCounter value={5000} suffix="+" label={tr('home.stat2')} icon={Smile} />
          </motion.div>
          <motion.div variants={rise}>
            <StatCounter value={4.5} suffix="★" label={tr('home.stat3')} icon={Star} decimals={1} />
          </motion.div>
          <motion.div variants={rise}>
            <StatCounter value={3500} suffix="+" label={tr('home.stat4')} icon={Instagram} />
          </motion.div>
        </motion.div>
      </section>

      {/* 3. USLUGE TEASER */}
      <section className="bg-white">
        <Wave className="text-grass-tint" flip />
        <div className="bg-grass-tint px-6 py-16 md:py-24">
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading eyebrow={tr('home.pricesEyebrow')} title={tr('home.pricesTitle')} sub={tr('home.pricesSub')} />
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {prices.map((p) => (
                <motion.div key={p.name} variants={rise}>
                  <PriceCard {...p} />
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-10 text-center">
              <Link to="/usluge" className="font-display text-lg font-bold text-grass-deep underline-offset-4 hover:underline">
                {tr('home.fullPriceList')}
              </Link>
            </div>
          </div>
        </div>
        <Wave className="text-grass-tint" />
      </section>

      {/* 4. SCROLL STORY */}
      <VisitStory />

      {/* 4b. SALON UŽIVO */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto grid max-w-[1200px] gap-5 sm:grid-cols-3">
          {[
            { src: '/real-salon.jpg', alt: 'Salon Grašak uživo' },
            { src: '/real-zadovoljni.jpg', alt: 'Zadovoljni mališani u salonu' },
            { src: '/real-tri_za_ustedu.jpg', alt: 'Prije i poslije šišanja' },
          ].map((img, i) => (
            <motion.div
              key={img.src}
              variants={rise}
              className={i === 1 ? 'sm:translate-y-6' : ''}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-64 w-full rounded-3xl object-cover shadow-md"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. RECENZIJE */}
      <div className="bg-white">
        <GrassDivider />
      </div>
      <section className="bg-cream px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionHeading
            eyebrow={tr('home.revEyebrow')}
            title={tr('home.revTitle')}
            sub={tr('home.revSub')}
          />
          <div className="relative">
            <motion.div
              ref={carouselRef}
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
            >
              {reviews.map((r) => (
                <motion.div key={r.name} variants={rise} className="snap-start">
                  <ReviewCard {...r} />
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-6 hidden justify-center gap-3 md:flex">
              <button
                onClick={() => scrollBy(-1)}
                aria-label={tr('home.prev')}
                className="rounded-full bg-white p-3 text-grass-deep shadow-md transition-transform hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label={tr('home.next')}
                className="rounded-full bg-white p-3 text-grass-deep shadow-md transition-transform hover:scale-110"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-ink shadow-md transition-transform hover:scale-105"
            >
              <Heart className="h-5 w-5 fill-coral text-coral" /> {GOOGLE_RATING} ★ {tr('home.googleRating')}
            </a>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-grass px-6 py-2.5 font-bold text-white shadow-md shadow-grass/30 transition-transform hover:scale-105"
            >
              {tr('home.allReviews')} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 6. VESELI GRAŠAK KARTICA */}
      <section className="bg-sky/20 px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, rotate: -10, y: 30 }}
            whileInView={{ opacity: 1, rotate: -4, y: 0 }}
            whileHover={{ rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="relative mx-auto w-full max-w-[520px]"
          >
            <img src="/card-veseli.jpg" alt={tr('home.cardAlt')} className="w-full rounded-3xl shadow-2xl" />
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-4 -top-4 flex h-20 w-20 items-center justify-center rounded-full bg-coral font-display text-2xl font-bold text-white shadow-xl"
            >
              15%
            </motion.span>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h3 variants={rise} className="font-display text-3xl font-bold text-ink md:text-4xl">
              {tr('home.cardTitle')}
            </motion.h3>
            <motion.p variants={rise} className="mt-4 max-w-md text-lg text-ink/75">
              {tr('home.cardText')}
            </motion.p>
            <motion.div variants={rise} className="mt-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="inline-block">
                <Link
                  to="/usluge#kartica"
                  className="block rounded-full bg-grass px-8 py-3.5 font-bold text-white shadow-lg shadow-grass/30 hover:bg-grass-deep"
                >
                  {tr('home.cardMore')}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BRAND INTERLUDE */}
      <BrandStrip className="bg-white" />

      {/* 7. FAQ TEASER */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[800px]">
          <SectionHeading title={tr('home.faqTitle')} />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <FaqAccordion items={faqs} />
          </motion.div>
          <div className="mt-8 text-center">
            <Link to="/usluge#faq" className="font-display text-lg font-bold text-grass-deep underline-offset-4 hover:underline">
              {tr('home.allQuestions')}
            </Link>
          </div>
        </div>
      </section>

      {/* 8. CTA BAND */}
      <div className="bg-white">
        <GrassDivider flip />
        <CTABand />
      </div>
    </>
  )
}
