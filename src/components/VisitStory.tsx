import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Car, Palette, Scissors, Smile } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function VisitStory() {
  const { tr, lang } = useLang()
  const steps = [
    { title: tr('visit.s1t'), text: tr('visit.s1x'), icon: Car, color: 'bg-grass', image: '/step1.jpg' },
    { title: tr('visit.s2t'), text: tr('visit.s2x'), icon: Palette, color: 'bg-sun', image: '/step2.jpg' },
    { title: tr('visit.s3t'), text: tr('visit.s3x'), icon: Scissors, color: 'bg-coral', image: '/step3.jpg' },
    { title: tr('visit.s4t'), text: tr('visit.s4x'), icon: Smile, color: 'bg-sky', image: '/first-haircut.jpg' },
  ]
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) return
      const cards = gsap.utils.toArray<HTMLElement>('.story-card')
      const dots = gsap.utils.toArray<HTMLElement>('.story-dot')
      const progress = root.current?.querySelector<HTMLElement>('.story-progress-fill')

      cards.forEach((card, i) => {
        if (i > 0) gsap.set(card, { opacity: 0, x: 60 })
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.5,
        },
      })

      steps.forEach((_, i) => {
        if (i > 0) {
          tl.to(cards[i - 1], { opacity: 0.5, scale: 0.95, x: 0, duration: 1 }, `step${i}`)
          tl.to(cards[i], { opacity: 1, x: 0, scale: 1, duration: 1 }, `step${i}`)
        }
        tl.to(dots[i], { scale: 1.3, backgroundColor: '#4CAF50', duration: 0.4 }, `step${i}`)
        if (i > 0) tl.to(dots[i - 1], { scale: 1, duration: 0.4 }, `step${i}`)
      })
      if (progress) tl.to(progress, { height: '100%', ease: 'none', duration: steps.length }, 0)
    },
    { scope: root, dependencies: [lang] },
  )

  return (
    <section ref={root} className="bg-white py-20">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 md:grid-cols-2">
        {/* left sticky label */}
        <div>
          <span className="inline-block rounded-full bg-sun px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
            {tr('visit.eyebrow')}
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-ink md:text-5xl">
            {tr('visit.title')}
          </h2>
          <div className="mt-10 flex gap-4">
            <div className="relative w-1 rounded-full bg-grass-tint">
              <div className="story-progress-fill absolute left-0 top-0 w-full rounded-full bg-grass" style={{ height: 0 }} />
            </div>
            <ul className="space-y-8">
              {steps.map((s, i) => (
                <li key={s.title} className="flex items-center gap-4">
                  <span className="story-dot h-4 w-4 rounded-full bg-grass-tint ring-2 ring-grass/40" />
                  <span className="font-display text-xl font-bold text-ink">
                    {i + 1}. {s.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* right cards */}
        <div className="relative md:min-h-[420px]">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="story-card relative mb-6 rounded-3xl bg-cream p-8 shadow-xl shadow-ink/10 last:mb-0 md:absolute md:inset-x-0 md:top-1/2 md:mb-0 md:-translate-y-1/2"
              style={{ zIndex: i + 1 }}
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${s.color} text-white`}>
                <s.icon className="h-7 w-7" />
              </span>
              <div className="mt-4 font-display text-6xl font-bold text-grass/20">0{i + 1}</div>
              <h3 className="mt-2 font-display text-2xl font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-ink/70">{s.text}</p>
              <img
                src={s.image}
                alt={s.title}
                loading="lazy"
                className="mt-4 h-44 w-full rounded-2xl object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
