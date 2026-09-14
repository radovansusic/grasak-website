import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface Props {
  value: number
  suffix?: string
  label: string
  icon: LucideIcon
  decimals?: number
}

export default function StatCounter({ value, suffix = '', label, icon: Icon, decimals = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Number((value * eased).toFixed(decimals)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-md shadow-ink/5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-grass-tint text-grass-deep">
        <Icon className="h-6 w-6" />
      </span>
      <div className="mt-3 font-display text-4xl font-bold text-ink md:text-5xl">
        {display.toLocaleString('sr-Latn', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        {suffix}
      </div>
      <div className="mt-1 text-sm font-bold uppercase tracking-[0.08em] text-ink/60">{label}</div>
    </motion.div>
  )
}
