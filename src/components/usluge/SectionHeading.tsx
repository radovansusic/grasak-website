import { motion } from 'framer-motion'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  sub?: string
  light?: boolean
}

export default function SectionHeading({ eyebrow, title, sub, light }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto mb-12 max-w-2xl text-center"
    >
      <span
        className="inline-block rounded-full bg-[#FFC93C] px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#22302A]"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        {eyebrow}
      </span>
      <h2
        className={`mt-4 text-4xl font-bold tracking-[-0.01em] md:text-5xl ${light ? 'text-white' : 'text-[#22302A]'}`}
        style={{ fontFamily: "'Baloo 2', cursive" }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-4 text-[17px] leading-[1.65] ${light ? 'text-white/80' : 'text-[#22302A]/70'}`}
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          {sub}
        </p>
      )}
    </motion.div>
  )
}
