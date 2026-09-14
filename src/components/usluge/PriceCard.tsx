import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface PriceCardProps {
  name: string
  price: string
  duration?: string
  description: string
  barColor: string
  badge?: string
  image?: string
  emphasized?: boolean
  index?: number
}

export default function PriceCard({
  name,
  price,
  duration,
  description,
  barColor,
  badge,
  image,
  emphasized,
  index = 0,
}: PriceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.12 }}
      whileHover={{ y: -8 }}
      className={`relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-[#22302A]/5 transition-shadow hover:shadow-xl hover:shadow-[#22302A]/10 ${
        emphasized ? 'md:scale-[1.03] ring-2 ring-[#FF7A59]/40' : ''
      }`}
    >
      <div className="h-2 w-full" style={{ backgroundColor: barColor }} />
      {badge && (
        <span
          className="absolute right-4 top-5 rounded-full bg-[#FFC93C] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#22302A]"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          {badge}
        </span>
      )}
      <div className="flex flex-1 flex-col p-7">
        {image && (
          <div className="mb-5 overflow-hidden rounded-2xl">
            <img
              src={image}
              alt={name}
              className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <h3
          className="text-2xl font-bold text-[#22302A]"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          {name}
        </h3>
        {duration && (
          <span
            className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F0F7EF] px-3 py-1 text-[13px] font-bold text-[#2E7D32]"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            <Clock className="h-3.5 w-3.5" />
            {duration}
          </span>
        )}
        <p
          className="mt-3 flex-1 text-[15px] leading-[1.65] text-[#22302A]/70"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          {description}
        </p>
        <div
          className="mt-5 text-5xl font-bold text-[#2E7D32]"
          style={{ fontFamily: "'Baloo 2', cursive" }}
        >
          {price}
        </div>
      </div>
    </motion.div>
  )
}
