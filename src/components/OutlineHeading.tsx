import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/**
 * Hollow outline display typography, stroke-only SVG text that draws in
 * via stroke-dashoffset when scrolled into view.
 */
interface Props {
  text: string
  stroke?: string
  className?: string
}

export default function OutlineHeading({ text, stroke = '#45813D', className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    if (inView) setDrawn(true)
  }, [inView])

  return (
    <div ref={ref} aria-label={text} role="heading" aria-level={2} className={className}>
      <svg viewBox="0 0 1000 190" className="h-auto w-full overflow-visible" aria-hidden="true">
        <text
          x="50%"
          y="72%"
          textAnchor="middle"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeDasharray="1400"
          strokeDashoffset={drawn ? 0 : 1400}
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontWeight: 800,
            fontSize: '150px',
            letterSpacing: '-0.02em',
            transition: 'stroke-dashoffset 2.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {text}
        </text>
      </svg>
    </div>
  )
}
