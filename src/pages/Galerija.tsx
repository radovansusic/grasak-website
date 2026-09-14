import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  X,
  Instagram,
  CalendarCheck,
  Sparkles,
  Scissors,
} from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]
const displayFont = "'Baloo 2', 'Nunito', system-ui, sans-serif"
const bodyFont = "'Nunito', system-ui, sans-serif"

type CategoryKey = 'all' | 'hair' | 'salon' | 'first' | 'fun'

interface GalleryItem {
  src: string
  categoryKey: Exclude<CategoryKey, 'all'>
  category: string
  caption: string
}

const FILTERS: { key: CategoryKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'galerija.fAll' },
  { key: 'hair', labelKey: 'galerija.fHair' },
  { key: 'salon', labelKey: 'galerija.fSalon' },
  { key: 'first', labelKey: 'galerija.fFirst' },
  { key: 'fun', labelKey: 'galerija.fFun' },
]

const ITEMS: { src: string; categoryKey: Exclude<CategoryKey, 'all'>; captionKey: string }[] = [
  { src: '/real-salon.jpg', categoryKey: 'salon', captionKey: 'galerija.cap1' },
  { src: '/real-oprema.jpg', categoryKey: 'salon', captionKey: 'galerija.cap2' },
  { src: '/mural.jpg', categoryKey: 'fun', captionKey: 'galerija.cap3' },
  { src: '/real-zadovoljni.jpg', categoryKey: 'hair', captionKey: 'galerija.cap4' },
  { src: '/real-tri_za_ustedu.jpg', categoryKey: 'hair', captionKey: 'galerija.cap5' },
  { src: '/real-prvo_sisanje.jpg', categoryKey: 'first', captionKey: 'galerija.cap6' },
  { src: '/real-nikola.jpg', categoryKey: 'salon', captionKey: 'galerija.cap7' },
  { src: '/gallery-1.jpg', categoryKey: 'hair', captionKey: 'galerija.cap8' },
  { src: '/gallery-2.jpg', categoryKey: 'hair', captionKey: 'galerija.cap9' },
  { src: '/gallery-3.jpg', categoryKey: 'salon', captionKey: 'galerija.cap10' },
  { src: '/gallery-4.jpg', categoryKey: 'salon', captionKey: 'galerija.cap11' },
  { src: '/gallery-5.jpg', categoryKey: 'first', captionKey: 'galerija.cap12' },
  { src: '/gallery-6.jpg', categoryKey: 'fun', captionKey: 'galerija.cap13' },
  { src: '/gallery-7.jpg', categoryKey: 'fun', captionKey: 'galerija.cap14' },
  { src: '/gallery-8.jpg', categoryKey: 'hair', captionKey: 'galerija.cap15' },
]

const CATEGORY_LABEL: Record<Exclude<CategoryKey, 'all'>, string> = {
  hair: 'galerija.fHair',
  salon: 'galerija.fSalon',
  first: 'galerija.fFirst',
  fun: 'galerija.fFun',
}

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
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

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
            Početna
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#2E7D32]">Galerija</span>
        </motion.nav>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
        >
          <Eyebrow>{tr('galerija.eyebrow')}</Eyebrow>
        </motion.div>
        <WordSplitHeading
          text={tr('galerija.heroTitle')}
          className="mt-6 text-[40px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[#22302A] md:text-6xl"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.5 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#22302A]/70"
          style={{ fontFamily: bodyFont }}
        >
          Zavirite u naš salon, prave frizure, prava djeca, pravi smijeh.
        </motion.p>
      </div>
    </section>
  )
}

function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[]
  index: number
  onClose: () => void
  onNavigate: (next: number) => void
}) {
  const { tr } = useLang()
  const item = items[index]

  const prev = useCallback(
    () => onNavigate((index - 1 + items.length) % items.length),
    [index, items.length, onNavigate]
  )
  const next = useCallback(
    () => onNavigate((index + 1) % items.length),
    [index, items.length, onNavigate]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#22302A]/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
    >
      <button
        onClick={onClose}
        aria-label={tr('galerija.close')}
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          prev()
        }}
        aria-label="Prethodna slika"
        className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 md:left-6"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          next()
        }}
        aria-label={tr('galerija.nextImg')}
        className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 md:right-6"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
      <motion.figure
        key={item.src}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
        className="max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.src}
          alt={item.caption}
          className="max-h-[75dvh] w-auto rounded-3xl object-contain shadow-2xl"
        />
        <figcaption
          className="mt-4 text-center text-lg font-semibold text-white"
          style={{ fontFamily: bodyFont }}
        >
          {item.caption}
          <span className="mt-1 block text-sm font-bold uppercase tracking-[0.08em] text-[#FFC93C]">
            {item.category}
          </span>
          <span className="mt-2 inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-bold tracking-[0.15em] text-white/80">
            {index + 1} / {items.length}
          </span>
        </figcaption>
      </motion.figure>
    </motion.div>
  )
}

function GalleryGrid() {
  const { tr } = useLang()
  const [filter, setFilter] = useState<CategoryKey>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const all: GalleryItem[] = ITEMS.map((it) => ({
    src: it.src,
    categoryKey: it.categoryKey,
    category: tr(CATEGORY_LABEL[it.categoryKey]),
    caption: tr(it.captionKey),
  }))
  const visible = filter === 'all' ? all : all.filter((it) => it.categoryKey === filter)

  return (
    <section className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-12 flex flex-wrap items-center justify-center gap-3"
          role="tablist"
          aria-label={tr('galerija.filterAria')}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <motion.button
                key={f.key}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-colors ${
                  active
                    ? 'bg-[#4CAF50] text-white shadow-lg'
                    : 'bg-[#F0F7EF] text-[#2E7D32] hover:bg-[#4CAF50]/15'
                }`}
                style={{ fontFamily: bodyFont }}
              >
                {tr(f.labelKey)}
              </motion.button>
            )
          })}
        </motion.div>

        <motion.div layout className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {visible.map((item, i) => (
              <motion.button
                layout
                key={item.src}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  layout: { type: 'spring', bounce: 0.2, duration: 0.4 },
                  opacity: { duration: 0.35, delay: i * 0.08 },
                  y: { duration: 0.5, ease: EASE, delay: i * 0.08 },
                }}
                onClick={() => setLightboxIndex(i)}
                className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-3xl text-left shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4CAF50]/50"
                aria-label={tr('galerija.enlarge', { caption: item.caption })}
              >
                <img
                  src={item.src}
                  alt={item.caption}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                />
                <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden="true">
                  <rect
                    rx="22"
                    fill="none"
                    stroke="#87BD6D"
                    strokeOpacity="0.4"
                    strokeWidth="1.5"
                    style={{ x: 2, y: 2, width: 'calc(100% - 4px)', height: 'calc(100% - 4px)' }}
                  />
                  <rect
                    className="frame-run"
                    rx="22"
                    fill="none"
                    stroke="#45813D"
                    strokeWidth="2.5"
                    pathLength={100}
                    style={{ x: 2, y: 2, width: 'calc(100% - 4px)', height: 'calc(100% - 4px)' }}
                  />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-[#22302A]/80 via-[#22302A]/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="translate-y-4 p-5 transition-transform duration-300 group-hover:translate-y-0">
                    <span className="mb-1 inline-block rounded-full bg-[#FFC93C] px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#22302A]">
                      {item.category}
                    </span>
                    <p className="font-semibold text-white" style={{ fontFamily: bodyFont }}>
                      {item.caption}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && visible[lightboxIndex] && (
          <Lightbox
            items={visible}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

function InstagramCTA() {
  const { tr } = useLang()
  return (
    <section className="bg-[#2E7D32] px-4 py-20 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2
          className="text-4xl font-extrabold tracking-[-0.01em] text-white md:text-5xl"
          style={{ fontFamily: displayFont }}
        >
          {tr('galerija.igTitle')}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/80" style={{ fontFamily: bodyFont }}>
          {tr('galerija.igText')}
        </p>
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          href="https://instagram.com/djecijisalon"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#2E7D32] shadow-lg transition-shadow hover:shadow-xl"
          style={{ fontFamily: bodyFont }}
        >
          <Instagram className="h-5 w-5" />
          {tr('galerija.igBtn')}
        </motion.a>
      </motion.div>
    </section>
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
            {tr('galerija.ctaTitle')}
          </h2>
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
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/usluge"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#2E7D32] shadow-lg transition-shadow hover:shadow-xl"
                style={{ fontFamily: bodyFont }}
              >
                <Scissors className="h-5 w-5" />
                {tr('galerija.ctaPrices')}
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default function Galerija() {
  return (
    <main className="bg-[#FFF9F0]" style={{ fontFamily: bodyFont }}>
      <PageHero />
      <GalleryGrid />
      <InstagramCTA />
      <CTABand />
    </main>
  )
}
