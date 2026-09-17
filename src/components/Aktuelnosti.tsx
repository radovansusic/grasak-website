import { motion } from 'framer-motion'
import { Megaphone, PartyPopper, CalendarDays, Lightbulb, Pin } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'
import { AKTUELNOSTI, type Aktuelno } from '@/data/aktuelnosti'

const TAG_STYLE: Record<Aktuelno['tag'], { bg: string; fg: string; Icon: typeof Megaphone }> = {
  akcija: { bg: '#FFEDE7', fg: '#FF7A59', Icon: Megaphone },
  najava: { bg: '#FFF4D6', fg: '#B8860B', Icon: PartyPopper },
  dogadjaj: { bg: '#E9F5EA', fg: '#2E7D32', Icon: CalendarDays },
  zanimljivost: { bg: '#E5F6FD', fg: '#0288D1', Icon: Lightbulb },
}

function fmtDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('sr-Latn-ME', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function Tag({ tag }: { tag: Aktuelno['tag'] }) {
  const { tr } = useLang()
  const { bg, fg, Icon } = TAG_STYLE[tag]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide"
      style={{ backgroundColor: bg, color: fg }}
    >
      <Icon className="h-3.5 w-3.5" />
      {tr(`akt.tag.${tag}`)}
    </span>
  )
}

export default function Aktuelnosti() {
  const { tr } = useLang()
  const pinned = AKTUELNOSTI.find((a) => a.pin)
  const rest = AKTUELNOSTI.filter((a) => a !== pinned).slice(0, 3)

  return (
    <section className="bg-cream px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-grass px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-white">
            <Pin className="h-3.5 w-3.5" />
            {tr('akt.eyebrow')}
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-ink md:text-5xl">{tr('akt.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink/70">{tr('akt.sub')}</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-5">
          {pinned && (
            <motion.article
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-ink/10 lg:col-span-2"
            >
              {pinned.image && (
                <img src={pinned.image} alt="" loading="lazy" className="h-52 w-full object-cover" />
              )}
              <div className="p-7">
                <div className="flex items-center justify-between gap-3">
                  <Tag tag={pinned.tag} />
                  <time className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    {fmtDate(pinned.date)}
                  </time>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-ink">{pinned.title}</h3>
                <p className="mt-3 leading-relaxed text-ink/75">{pinned.text}</p>
              </div>
            </motion.article>
          )}

          <div className="flex flex-col gap-6 lg:col-span-3">
            {rest.map((a, i) => (
              <motion.article
                key={a.date + a.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex-1 rounded-3xl bg-white p-6 shadow-md shadow-ink/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <Tag tag={a.tag} />
                  <time className="text-xs font-bold uppercase tracking-wide text-ink/45">
                    {fmtDate(a.date)}
                  </time>
                </div>
                <h3 className="mt-3 font-display text-xl font-bold text-ink">{a.title}</h3>
                <p className="mt-2 leading-relaxed text-ink/75">{a.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
