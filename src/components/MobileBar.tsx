import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, CalendarCheck } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

/** Sticky mobile bottom bar, appears (< lg) after scrolling past the hero. */
export default function MobileBar() {
  const { tr } = useLang()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-x-3 bottom-3 z-[90] flex gap-2 rounded-full border border-white/40 bg-grass-darkest/95 p-2 shadow-xl shadow-ink/25 backdrop-blur-md lg:hidden"
        >
          <a
            href="tel:+38269371111"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-coral px-4 py-3 text-sm font-bold text-white"
          >
            <Phone className="h-4 w-4" /> 069 371 111
          </a>
          <Link
            to="/kontakt"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-grass px-4 py-3 text-sm font-bold text-white"
          >
            <CalendarCheck className="h-4 w-4" /> {tr('nav.book')}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
