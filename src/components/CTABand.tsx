import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Phone } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

interface Props {
  title?: string
  sub?: string
}

export default function CTABand({ title, sub }: Props) {
  const { tr } = useLang()
  const titleText = title ?? tr('cta.title')
  const subText = sub ?? tr('cta.sub')
  return (
    <section className="px-4 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-grass px-6 py-16 text-center text-white md:py-20"
      >
        <img
          src="/hero-shapes.svg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold md:text-5xl">{titleText}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">{subText}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <motion.a
              href="tel:+38269371111"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-grass-deep shadow-lg hover:shadow-xl"
            >
              <Phone className="h-5 w-5" /> 069 371 111
            </motion.a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/kontakt"
                className="block rounded-full bg-sun px-7 py-3.5 font-bold text-ink shadow-lg hover:shadow-xl"
              >
                {tr('nav.book')}
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
