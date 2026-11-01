import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { isoDatum } from '@/lib/zakazivanje'
import type { Lang } from '@/i18n/translations'

/** slobodno = ima termina, nepoznato = radni dan (slobodni termini još nisu učitani), popunjeno, zatvoreno = ne radi / praznik / van opsega */
export type StanjeDana = 'slobodno' | 'nepoznato' | 'popunjeno' | 'zatvoreno'

const MJESECI: Record<Lang, string[]> = {
  cnr: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
}
const DANI: Record<Lang, string[]> = {
  cnr: ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
}
const LOKAL: Record<Lang, string> = { cnr: 'sr-Latn-ME', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR' }

/** "4. novembar" / "4 November" / "4 ноября" / "4 Kasım" - za čitače ekrana */
function punDatum(d: Date, jezik: Lang): string {
  if (jezik === 'cnr') return `${d.getDate()}. ${MJESECI.cnr[d.getMonth()]}`
  try { return new Intl.DateTimeFormat(LOKAL[jezik], { day: 'numeric', month: 'long' }).format(d) } catch { return `${d.getDate()}. ${MJESECI[jezik][d.getMonth()]}` }
}

interface Props {
  /** dani u kojima se može zakazivati, od danas redom */
  dani: Date[]
  izabran: string
  stanje: (d: Date) => { s: StanjeDana; opis?: string }
  onIzbor: (iso: string) => void
  jezik: Lang
  tekst: { prev: string; next: string; free: string; busy: string; today: string }
}

/** Mjesečni kalendar: slobodni dani zeleni, popunjeni i neradni sivi; klik na dan bira datum. */
export default function MjesecniKalendar({ dani, izabran, stanje, onIzbor, jezik, tekst }: Props) {
  const prvi = dani[0]
  const zadnji = dani[dani.length - 1]
  const mjeseci: [number, number][] = []
  for (let y = prvi.getFullYear(), m = prvi.getMonth(); y * 12 + m <= zadnji.getFullYear() * 12 + zadnji.getMonth(); m++) {
    if (m > 11) { m = 0; y++ }
    mjeseci.push([y, m])
  }
  const [indeks, setIndeks] = useState(0)
  const [y, m] = mjeseci[Math.min(indeks, mjeseci.length - 1)]
  const uOpsegu = new Set(dani.map(isoDatum))
  const danas = isoDatum(prvi)
  const pomak = (new Date(y, m, 1).getDay() + 6) % 7 // sedmica počinje ponedjeljkom
  const brojDana = new Date(y, m + 1, 0).getDate()
  const nazivMjeseca = MJESECI[jezik][m]

  return (
    <div className="max-w-md">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label={tekst.prev} disabled={indeks === 0} onClick={() => setIndeks((i) => i - 1)}
          className="rounded-full p-2 text-ink transition-colors hover:bg-grass-tint disabled:opacity-20">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <p className="font-display text-lg font-extrabold capitalize text-ink">{nazivMjeseca} {y}</p>
        <button type="button" aria-label={tekst.next} disabled={indeks >= mjeseci.length - 1} onClick={() => setIndeks((i) => i + 1)}
          className="rounded-full p-2 text-ink transition-colors hover:bg-grass-tint disabled:opacity-20">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase text-ink/50">
        {DANI[jezik].map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {Array.from({ length: pomak }, (_, i) => <span key={'p' + i} />)}
        {Array.from({ length: brojDana }, (_, i) => {
          const d = new Date(y, m, i + 1)
          const iso = isoDatum(d)
          const { s, opis } = uOpsegu.has(iso) ? stanje(d) : { s: 'zatvoreno' as StanjeDana, opis: undefined }
          const moze = s === 'slobodno' || s === 'nepoznato'
          const izab = izabran === iso
          const oznaka = `${punDatum(d, jezik)}${iso === danas ? ', ' + tekst.today : ''}${opis ? ' - ' + opis : ''}`
          return (
            <button key={iso} type="button" disabled={!moze} onClick={() => onIzbor(iso)} title={opis} aria-label={oznaka} aria-pressed={izab}
              className={'relative flex aspect-square items-center justify-center rounded-xl border-2 font-display text-lg font-extrabold transition-colors ' +
                (izab ? 'border-grass bg-grass text-white'
                  : s === 'slobodno' ? 'border-grass-light bg-grass-tint text-grass-deep hover:border-grass'
                  : s === 'nepoznato' ? 'border-grass-tint bg-white text-ink hover:border-grass'
                  : s === 'popunjeno' ? 'border-transparent bg-ink/5 text-ink/30 line-through'
                  : 'border-transparent text-ink/20')}>
              {i + 1}
              {iso === danas && <span className={'absolute bottom-1 h-1.5 w-1.5 rounded-full ' + (izab ? 'bg-white' : 'bg-coral')} />}
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/60">
        <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded border-2 border-grass-light bg-grass-tint" />{tekst.free}</span>
        <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-ink/10" />{tekst.busy}</span>
      </div>
    </div>
  )
}
