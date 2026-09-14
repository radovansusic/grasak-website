import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Layered grassland divider, 5 stacked organic hill/grass layers in
 * alternating greens, each drifting at a different scroll speed (parallax).
 * Subtle stroke/fill alternation gives a paper-cut depth look.
 */

const LAYERS = [
  // back → front
  { d: 'M0 86 C160 40 320 34 480 62 C640 90 800 96 960 66 C1120 36 1280 30 1440 60 L1440 160 L0 160 Z', fill: '#87BD6D', stroke: 'none', speed: -12 },
  { d: 'M0 100 C180 60 360 56 540 80 C720 104 900 110 1080 84 C1260 58 1350 60 1440 78 L1440 160 L0 160 Z', fill: '#568C2C', stroke: '#87BD6D', speed: -6 },
  { d: 'M0 112 C140 78 300 74 470 96 C640 118 830 124 1010 100 C1190 76 1330 80 1440 96 L1440 160 L0 160 Z', fill: '#45813D', stroke: 'none', speed: 0 },
  { d: 'M0 122 C200 92 380 90 560 108 C740 126 920 132 1100 112 C1280 92 1380 96 1440 108 L1440 160 L0 160 Z', fill: '#0D6230', stroke: '#87BD6D', speed: 6 },
  { d: 'M0 132 C180 108 360 106 540 120 C720 134 900 140 1080 124 C1260 108 1360 112 1440 122 L1440 160 L0 160 Z', fill: '#094421', stroke: 'none', speed: 12 },
]

// little grass tufts poking from the front layer
function Tufts({ color }: { color: string }) {
  return (
    <g fill={color}>
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 70 + i * 165
        const h = 10 + (i % 3) * 5
        return (
          <path
            key={i}
            d={`M${x} 160 q2 -${h} 5 0 M${x + 8} 160 q3 -${h + 6} 6 0 M${x + 17} 160 q2 -${h - 2} 5 0`}
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        )
      })}
    </g>
  )
}

interface Props {
  /** fills from back to front, defaults to the green ladder */
  palette?: string[]
  /** flip vertically (for use at the top of a section) */
  flip?: boolean
  className?: string
}

export default function GrassDivider({ palette, flip = false, className = 'h-[110px] md:h-[160px]' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGPathElement>('.grass-layer').forEach((el, i) => {
        const speed = LAYERS[i]?.speed ?? 0
        if (speed === 0) return
        gsap.fromTo(
          el,
          { yPercent: speed },
          {
            yPercent: -speed,
            ease: 'none',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          },
        )
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`pointer-events-none relative -mb-px w-full overflow-hidden ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute inset-0 h-[130%] w-full -translate-y-[12%]">
        {LAYERS.map((l, i) => (
          <path
            key={i}
            className="grass-layer"
            d={l.d}
            fill={palette?.[i] ?? l.fill}
            stroke={l.stroke === 'none' ? 'none' : l.stroke}
            strokeWidth={l.stroke === 'none' ? 0 : 1.5}
            strokeLinejoin="round"
            opacity={1 - i * 0.02}
          />
        ))}
        <Tufts color={palette?.[4] ?? '#094421'} />
      </svg>
    </div>
  )
}
