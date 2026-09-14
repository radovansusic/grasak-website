import { motion } from 'framer-motion'
import { Link } from 'react-router'
import {
  Phone,
  Blocks,
  Scissors,
  Camera,
  Sparkles,
  BadgePercent,
  ChevronRight,
} from 'lucide-react'
import SectionHeading from '@/components/usluge/SectionHeading'
import PriceCard from '@/components/usluge/PriceCard'
import FaqAccordion from '@/components/usluge/FaqAccordion'
import CTABand from '@/components/usluge/CTABand'
import '@/components/usluge/fonts.css'
import { useLang } from '@/i18n/LanguageContext'

function HeroTitle() {
  const { tr } = useLang()
  const words = tr('usluge.heroTitle').split(' ')
  return (
    <h1
      className="text-5xl font-bold tracking-[-0.01em] text-[#22302A] md:text-7xl"
      style={{ fontFamily: "'Baloo 2', cursive" }}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 + i * 0.05 }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

export default function Usluge() {
  const { tr } = useLang()
  const osnovneUsluge = [
    { name: tr('usluge.b1name'), price: '8€', duration: '~15 min', description: tr('usluge.b1desc') },
    { name: tr('usluge.b2name'), price: '10€', duration: '~20 min', description: tr('usluge.b2desc') },
    { name: tr('usluge.b3name'), price: '12€', duration: '~30 min', description: tr('usluge.b3desc') },
  ]
  const paketi = [
    { name: tr('usluge.pk1name'), price: '14€', description: tr('usluge.pk1desc') },
    { name: tr('usluge.pk2name'), price: '19€', description: tr('usluge.pk2desc'), badge: tr('usluge.pk2badge') },
    { name: tr('usluge.pk3name'), price: '24€', description: tr('usluge.pk3desc') },
  ]
  const dodatneUsluge = [
    { name: tr('usluge.e1name'), price: '6€', description: tr('usluge.e1desc'), image: '/spa-treatment.jpg' },
    { name: tr('usluge.e2name'), price: '7€', description: tr('usluge.e2desc'), image: '/feniranje.jpg' },
    { name: tr('usluge.e3name'), price: '3–6€', description: tr('usluge.e3desc'), image: '/pribor.jpg' },
  ]
  const prvoSisanjeBullets = [tr('usluge.fb1'), tr('usluge.fb2'), tr('usluge.fb3'), tr('usluge.fb4')]
  const karticaBullets = [tr('usluge.cb1'), tr('usluge.cb2'), tr('usluge.cb3')]
  const koraci = [
    { icon: Phone, title: tr('usluge.k1t'), text: tr('usluge.k1x'), color: '#4CAF50' },
    { icon: Blocks, title: tr('usluge.k2t'), text: tr('usluge.k2x'), color: '#FFC93C' },
    { icon: Scissors, title: tr('usluge.k3t'), text: tr('usluge.k3x'), color: '#FF7A59' },
    { icon: Camera, title: tr('usluge.k4t'), text: tr('usluge.k4x'), color: '#7ED6F2' },
  ]
  const faqItems = [
    { q: tr('usluge.f1q'), a: tr('usluge.f1a') },
    { q: tr('usluge.f2q'), a: tr('usluge.f2a') },
    { q: tr('usluge.f3q'), a: tr('usluge.f3a') },
    { q: tr('usluge.f4q'), a: tr('usluge.f4a') },
    { q: tr('usluge.f5q'), a: tr('usluge.f5a') },
    { q: tr('usluge.f6q'), a: tr('usluge.f6a') },
  ]
  return (
    <div className="bg-[#FFF9F0]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* 1. Page hero */}
      <section className="relative flex min-h-[60dvh] items-center justify-center overflow-hidden px-4 py-24">
        <motion.img
          src="/hero-shapes.svg"
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1 }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="relative text-center">
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center justify-center gap-1 text-sm font-bold text-[#22302A]/60"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="transition-colors hover:text-[#2E7D32]">
              {tr('nav.home')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#2E7D32]">{tr('usluge.crumb')}</span>
          </motion.nav>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-4 inline-block rounded-full bg-[#FFC93C] px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#22302A]"
          >
            {tr('usluge.eyebrow')}
          </motion.span>
          <HeroTitle />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mx-auto mt-5 max-w-xl text-lg leading-[1.65] text-[#22302A]/70"
          >
            {tr('usluge.heroSub')}
          </motion.p>
        </div>
      </section>

      {/* 2. Osnovne usluge */}
      <section className="bg-white px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={tr('usluge.basicEyebrow')} title={tr('usluge.basicTitle')} />
          <div className="grid gap-6 md:grid-cols-3">
            {osnovneUsluge.map((u, i) => (
              <PriceCard key={u.name} {...u} barColor="#4CAF50" index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Prvo šišanje */}
      <section className="bg-[#F0F7EF] px-4 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -60, rotate: -3 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -bottom-3 -right-3 h-full w-full rounded-[32px] bg-[#FFC93C]" aria-hidden />
            <img
              src="/first-haircut.jpg"
              alt={tr('usluge.firstImgAlt')}
              className="relative w-full rounded-[32px] object-cover shadow-lg"
              loading="lazy"
            />
            <motion.span
              whileHover={{ rotate: [0, -6, 6, -3, 0] }}
              transition={{ duration: 0.5 }}
              className="absolute -top-4 left-6 inline-block rounded-full bg-[#FFC93C] px-4 py-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[#22302A] shadow-md"
            >
              {tr('usluge.firstBadge')}
            </motion.span>
          </motion.div>
          <div>
            <h3
              className="text-3xl font-bold tracking-[-0.01em] text-[#22302A] md:text-4xl"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              {tr('usluge.firstTitle')}, <span className="text-[#2E7D32]">14€</span>
            </h3>
            <p className="mt-4 text-[17px] leading-[1.65] text-[#22302A]/70">
              {tr('usluge.firstText')}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {prvoSisanjeBullets.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-3 text-[16px] font-semibold text-[#22302A]"
                >
                  <img src="/scissors-icon.svg" alt="" aria-hidden className="h-6 w-6" />
                  {b}
                </motion.li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="mt-8 inline-block">
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 rounded-full bg-[#4CAF50] px-7 py-3.5 text-[16px] font-bold text-white shadow-lg shadow-[#4CAF50]/30 transition-colors hover:bg-[#2E7D32]"
              >
                <Sparkles className="h-5 w-5" />
                {tr('usluge.firstCta')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Paketi za društvo */}
      <section className="bg-white px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow={tr('usluge.packEyebrow')}
            title={tr('usluge.packTitle')}
            sub={tr('usluge.packSub')}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {paketi.map((p, i) => (
              <PriceCard
                key={p.name}
                {...p}
                barColor="#FF7A59"
                index={i}
                emphasized={i === 1}
              />
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 text-center text-[15px] font-semibold text-[#22302A]/60"
          >
            {tr('usluge.packNote')}
          </motion.p>
        </div>
      </section>

      {/* 5. Dodatne usluge */}
      <section className="relative bg-[#E8F6FC] px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={tr('usluge.extraEyebrow')} title={tr('usluge.extraTitle')} />
          <div className="grid gap-6 md:grid-cols-3">
            {dodatneUsluge.map((u, i) => (
              <PriceCard key={u.name} {...u} barColor="#7ED6F2" index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Kartica Veseli Grašak */}
      <section id="kartica" className="bg-[#2E7D32] px-4 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, rotate: -10, y: 40 }}
            whileInView={{ opacity: 1, rotate: -4, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <img
              src="/card-veseli.jpg"
              alt={tr('usluge.cardAlt')}
              className="w-full rounded-3xl shadow-2xl shadow-black/30"
              loading="lazy"
            />
          </motion.div>
          <div className="text-white">
            <div className="flex items-center gap-4">
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                className="rounded-2xl bg-[#FFC93C] px-5 py-3 text-4xl font-bold text-[#22302A] md:text-5xl"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                15%
              </motion.span>
              <h2
                className="text-3xl font-bold tracking-[-0.01em] md:text-4xl"
                style={{ fontFamily: "'Baloo 2', cursive" }}
              >
                {tr('usluge.cardTitle')}
              </h2>
            </div>
            <p className="mt-5 text-[17px] leading-[1.65] text-white/85">
              {tr('usluge.cardText')}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {karticaBullets.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-3 text-[16px] font-semibold"
                >
                  <BadgePercent className="h-5 w-5 shrink-0 text-[#FFC93C]" />
                  {b}
                </motion.li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="mt-8 inline-block">
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[16px] font-bold text-[#2E7D32] shadow-lg transition-shadow hover:shadow-xl"
              >
                {tr('usluge.cardCta')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Proces */}
      <section className="bg-white px-4 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={tr('usluge.howEyebrow')} title={tr('usluge.howTitle')} />
          <div className="relative">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-10 hidden origin-left border-t-2 border-dashed border-[#4CAF50]/50 md:block"
              aria-hidden
            />
            <div className="grid gap-10 md:grid-cols-4">
              {koraci.map((k, i) => (
                <motion.div
                  key={k.title}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.6, delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div
                    className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
                    style={{ backgroundColor: k.color }}
                  >
                    <k.icon className="h-9 w-9 text-white" />
                    <span
                      className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#22302A] text-sm font-bold text-white"
                      style={{ fontFamily: "'Baloo 2', cursive" }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3
                    className="mt-4 text-xl font-bold text-[#22302A]"
                    style={{ fontFamily: "'Baloo 2', cursive" }}
                  >
                    {k.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-[#22302A]/70">{k.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="bg-[#FFF9F0] px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow={tr('usluge.faqEyebrow')} title={tr('usluge.faqTitle')} />
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      {/* 9. CTA band */}
      <CTABand />
    </div>
  )
}
