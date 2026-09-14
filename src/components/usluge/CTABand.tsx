import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { CalendarCheck } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

export default function CTABand() {
  const { tr } = useLang()
  return (
    <section className="bg-[#FFF9F0] px-4 py-20 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#4CAF50] px-6 py-16 text-center shadow-xl shadow-[#4CAF50]/25 md:px-16"
      >
        <img
          src="/hero-shapes.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative">
          <h2
            className="text-4xl font-bold tracking-[-0.01em] text-white md:text-5xl"
            style={{ fontFamily: "'Baloo 2', cursive" }}
          >
            {tr('cta.title')}
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-[17px] leading-[1.65] text-white/85"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            {tr('cta.subUsluge')}
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="mt-8 inline-block">
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-[#FFC93C] px-8 py-4 text-lg font-bold text-[#22302A] shadow-lg transition-shadow hover:shadow-xl"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              <CalendarCheck className="h-5 w-5" />
              {tr('nav.book')}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
