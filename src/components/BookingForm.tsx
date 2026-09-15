import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PartyPopper } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

const inputCls =
  'w-full rounded-2xl border-2 border-grass-tint bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-grass'

export default function BookingForm() {
  const { tr } = useLang()
  const services = [tr('booking.s1'), tr('booking.s2'), tr('booking.s3'), tr('booking.s4'), tr('booking.s5'), tr('booking.s6')]
  const [sent, setSent] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // honeypot: ako je nevidljivo polje popunjeno, bot je — tiho odbaci
    const data = new FormData(e.currentTarget)
    if (data.get('website')) return
    setSent(true)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-ink/10">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex min-h-[380px] flex-col items-center justify-center text-center"
          >
            {/* confetti burst */}
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 24) * Math.PI * 2) * (120 + (i % 5) * 30),
                  y: Math.sin((i / 24) * Math.PI * 2) * (120 + (i % 5) * 30),
                  opacity: 0,
                  rotate: i * 45,
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-sm"
                style={{ background: ['#4CAF50', '#FFC93C', '#FF7A59', '#7ED6F2'][i % 4] }}
              />
            ))}
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-grass-tint text-grass-deep">
              <PartyPopper className="h-8 w-8" />
            </span>
            <h3 className="mt-4 font-display text-3xl font-bold text-ink">{tr('booking.thanks')}</h3>
            <p className="mt-2 text-ink/70">{tr('booking.thanksSub')}</p>
          </motion.div>
        ) : (
          <motion.form key="form" exit={{ opacity: 0 }} onSubmit={onSubmit} className="space-y-4">
            {/* honeypot anti-spam polje — nevidljivo ljudima */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <h3 className="font-display text-2xl font-bold text-ink">{tr('booking.title')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder={tr('booking.namePlaceholder')} className={inputCls} aria-label={tr('booking.namePlaceholder')} />
              <input
                required
                type="tel"
                pattern="[0-9+\s\-()]{6,17}"
                title={tr('booking.phoneTitle')}
                placeholder={tr('booking.phonePlaceholder')}
                className={inputCls}
                aria-label={tr('booking.phoneLabel')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder={tr('booking.childName')}
                className={inputCls}
                aria-label={tr('booking.childName')}
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                placeholder={tr('booking.childAge')}
                className={inputCls}
                aria-label={tr('booking.childAge')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <select required defaultValue="" className={inputCls} aria-label={tr('booking.serviceLabel')}>
                <option value="" disabled>
                  {tr('booking.selectService')}
                </option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                required
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className={inputCls}
                aria-label={tr('booking.dateLabel')}
              />
            </div>
            <textarea placeholder={tr('booking.notePlaceholder')} rows={3} className={inputCls} aria-label={tr('booking.noteLabel')} />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="w-full rounded-full bg-grass py-3.5 font-bold text-white shadow-lg shadow-grass/30 hover:bg-grass-deep"
            >
              {tr('booking.submit')}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
