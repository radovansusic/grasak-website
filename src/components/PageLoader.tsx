import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const KEY = 'grasak-loader-seen'

/**
 * Brief intro overlay (≤1.2s), scissors/grass logo rotates once and fades.
 * Shown once per session (sessionStorage).
 */
export default function PageLoader() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem(KEY)
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setShow(false), 1100)
    return () => clearTimeout(t)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-cream"
          aria-hidden="true"
        >
          <motion.img
            src="/logo.png"
            alt=""
            initial={{ rotate: 0, scale: 0.85, opacity: 0 }}
            animate={{ rotate: 360, scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="h-32 w-auto rounded-3xl shadow-2xl shadow-grass/25"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
