import { motion, useScroll, useSpring } from 'framer-motion'

/** Thin grass-green scroll progress bar pinned to the very top. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 })

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[150] h-1 origin-left bg-grass"
    />
  )
}
