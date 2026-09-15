import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/i18n/LanguageContext'
import type { Lang } from '@/i18n/translations'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'cnr', label: 'ME' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'tr', label: 'TR' },
]

function LangSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <div className={cn('flex items-center gap-1 rounded-full bg-grass-tint p-1', className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-bold transition-colors',
            lang === l.code ? 'bg-grass text-white' : 'text-grass-deep hover:bg-grass/15',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { tr } = useLang()
  const links = [
    { to: '/', label: tr('nav.home') },
    { to: '/usluge', label: tr('nav.usluge') },
    { to: '/o-nama', label: tr('nav.onama') },
    { to: '/galerija', label: tr('nav.galerija') },
    { to: '/kontakt', label: tr('nav.kontakt') },
  ]
  const [scrolled, setScrolled] = useState(false)
  const [compact, setCompact] = useState(false)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      // compress on scroll down, expand on scroll up
      if (y > 160 && y > lastY.current + 4) setCompact(true)
      else if (y < lastY.current - 4 || y <= 160) setCompact(false)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('sticky top-0 z-50 px-4 transition-all duration-300', compact ? 'pt-2' : 'pt-4')}>
      <nav
        className={cn(
          'mx-auto flex items-center justify-between gap-4 rounded-full bg-white/90 backdrop-blur-md transition-all duration-300',
          compact ? 'max-w-[1100px] gap-2 px-4 py-1.5 shadow-lg shadow-grass-deep/10' : 'max-w-[1200px] px-5',
          !compact && (scrolled ? 'py-2 shadow-lg shadow-grass-deep/10' : 'py-4 shadow-sm'),
        )}
      >
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src="/logo.png"
            alt="Grašak logo"
            className={cn(
              'w-auto rounded-xl ring-2 ring-grass/15 transition-all duration-300',
              compact ? 'h-9' : 'h-12',
            )}
          />
          <span className={cn('hidden flex-col leading-tight transition-opacity duration-300 sm:flex', compact && 'opacity-0')}>
            <span className="font-display text-lg font-bold text-ink">GRAŠAK</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-grass-deep">
              {tr('nav.tagline')}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold transition-colors',
                    isActive ? 'bg-grass text-white' : 'text-ink hover:bg-grass-tint hover:text-grass-deep',
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <LangSwitcher />
          <a
            href="tel:+38269371111"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-coral px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            <Phone className="h-4 w-4" /> 069 371 111
          </a>
          <Link
            to="/kontakt"
            className="shrink-0 whitespace-nowrap rounded-full bg-grass px-5 py-2 text-sm font-bold text-white shadow-md shadow-grass/30 transition-transform hover:scale-105 hover:bg-grass-deep"
          >
            {tr('nav.book')}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LangSwitcher />
          <button
            className="rounded-full p-2 text-ink"
            onClick={() => setOpen((v) => !v)}
            aria-label={tr('nav.menu')}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 z-40 flex flex-col bg-cream pt-28 lg:hidden"
          >
            <ul className="flex flex-col items-center gap-4 px-8">
              {links.map((l, i) => (
                <motion.li
                  key={l.to}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.35 }}
                  className="w-full max-w-xs"
                >
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-full px-6 py-4 text-center font-display text-2xl font-bold shadow-md',
                        isActive ? 'bg-grass text-white' : 'bg-white text-ink',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * links.length, duration: 0.35 }}
                className="mt-4"
              >
                <LangSwitcher />
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * (links.length + 1), duration: 0.35 }}
              >
                <a
                  href="tel:+38269371111"
                  className="mt-4 flex items-center gap-2 rounded-full bg-coral px-6 py-3 font-bold text-white"
                >
                  <Phone className="h-5 w-5" /> 069 371 111
                </a>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
