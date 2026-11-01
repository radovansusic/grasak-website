import { useEffect, useRef, useState } from 'react'
import { Bell, BellRing, CalendarPlus, CalendarX, X } from 'lucide-react'
import { osoblje, type Obavjestenje, type Pristup } from '@/lib/osoblje'

const DANI = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub']
const PERIOD_MS = 30000

function kljucVidjeno(ime: string) { return 'grasak-obav-' + ime.toLowerCase() }
function citaj(k: string): string | null { try { return localStorage.getItem(k) } catch { return null } }
function pisi(k: string, v: string) { try { localStorage.setItem(k, v) } catch { /* privatni režim */ } }

const jeDatum = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

function kadaTermin(o: Obavjestenje): string {
  if (!jeDatum(o.datum)) return ''
  const [g, m, d] = o.datum.split('-').map(Number)
  return `${DANI[new Date(g, m - 1, d).getDay()]} ${d}.${m}. u ${o.vrijeme}`
}
function prije(kad: string): string {
  const min = Math.round((Date.now() - Number(kad)) / 60000)
  if (min < 1) return 'upravo'
  if (min < 60) return `prije ${min} min`
  if (min < 24 * 60) return `prije ${Math.round(min / 60)} h`
  const d = new Date(Number(kad))
  return `${d.getDate()}.${d.getMonth() + 1}.`
}
function ko(o: Obavjestenje): string {
  if (o.izvor === 'sajt') return 'zakazao roditelj na sajtu'
  if (o.izvor === 'kalendar') return 'Google kalendar'
  return (o.tip === 'otkazan' ? 'otkazao/la: ' : 'upisao/la: ') + o.ko
}
function naslovObavjestenja(o: Obavjestenje): string {
  return (o.tip === 'otkazan' ? 'Otkazan termin' : 'Novi termin') + ' · ' + o.frizer
}
function tekstObavjestenja(o: Obavjestenje): string {
  return [kadaTermin(o), o.dijete || 'bez imena', o.usluga].filter(Boolean).join(' · ')
}

async function sistemsko(o: Obavjestenje) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const naslov = 'Grašak: ' + naslovObavjestenja(o), opcije = { body: tekstObavjestenja(o), icon: '/icon-192.png', tag: 'grasak-' + o.kad }
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined
    if (reg) await reg.showNotification(naslov, opcije)
    else new Notification(naslov, opcije)
  } catch { /* uređaj ne podržava */ }
}

/**
 * Zvonce u zaglavlju panela: svakih 30 s provjerava nove i otkazane termine (za frizera samo njegove).
 * Novo: brojač na zvoncu, traka na vrhu i obavještenje na telefonu (ako je dozvoljeno, dok je panel otvoren).
 */
export default function Zvono({ pristup, onNovo, onOtvoriDan }: {
  pristup: Pristup; onNovo: () => void; onOtvoriDan: (datum: string) => void
}) {
  const kljuc = kljucVidjeno(pristup.ime)
  const [lista, setLista] = useState<Obavjestenje[]>([])
  const [vidjeno, setVidjeno] = useState<string>(() => citaj(kljuc) || '')
  const [otvoreno, setOtvoreno] = useState(false)
  const [traka, setTraka] = useState<Obavjestenje | null>(null)
  const [dozvola, setDozvola] = useState<string>(() => ('Notification' in window ? Notification.permission : 'nema'))
  const zadnjeJavljeno = useRef<number>(Number(citaj(kljuc) || 0))
  const naNovo = useRef(onNovo)
  useEffect(() => { naNovo.current = onNovo }, [onNovo])

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/panel-sw.js').catch(() => {})
  }, [])

  useEffect(() => {
    let aktivno = true
    const provjeri = () => {
      osoblje<{ obavjestenja: Obavjestenje[]; sada: string }>('obavjestenja', pristup, { posle: 0 })
        .then((r) => {
          if (!aktivno || !r.ok) return
          setLista(r.obavjestenja)
          if (!zadnjeJavljeno.current) {
            // prvi put na ovom telefonu: sve postojeće je već viđeno
            zadnjeJavljeno.current = Number(r.sada)
            pisi(kljuc, r.sada); setVidjeno(r.sada)
            return
          }
          const nova = r.obavjestenja.filter((o) => Number(o.kad) > zadnjeJavljeno.current)
          if (nova.length) {
            zadnjeJavljeno.current = Math.max(...nova.map((o) => Number(o.kad)))
            setTraka(nova[0])
            void sistemsko(nova[0])
            naNovo.current()
          }
        })
        .catch(() => {})
    }
    provjeri()
    const t = setInterval(() => { if (document.visibilityState === 'visible') provjeri() }, PERIOD_MS)
    const vidljivo = () => { if (document.visibilityState === 'visible') provjeri() }
    document.addEventListener('visibilitychange', vidljivo)
    return () => { aktivno = false; clearInterval(t); document.removeEventListener('visibilitychange', vidljivo) }
  }, [pristup, kljuc])

  useEffect(() => {
    if (!traka) return
    const t = setTimeout(() => setTraka(null), 8000)
    return () => clearTimeout(t)
  }, [traka])

  const neprocitano = lista.filter((o) => Number(o.kad) > Number(vidjeno || 0)).length
  const otvori = () => {
    setOtvoreno(true); setTraka(null)
    const max = lista.reduce((m, o) => Math.max(m, Number(o.kad)), Number(vidjeno || 0))
    if (max) { pisi(kljuc, String(max)); setVidjeno(String(max)) }
  }
  const ukljuci = async () => {
    try {
      const d = await Notification.requestPermission()
      setDozvola(d)
      if (d === 'granted' && 'serviceWorker' in navigator) await navigator.serviceWorker.register('/panel-sw.js')
    } catch { setDozvola('nema') }
  }

  return (
    <>
      <button onClick={otvori} className="relative rounded-full bg-white/15 p-2" aria-label={`Obavještenja${neprocitano ? ': ' + neprocitano + ' novih' : ''}`}>
        {neprocitano ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {neprocitano > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-white">
            {neprocitano > 9 ? '9+' : neprocitano}
          </span>
        )}
      </button>

      {traka && (
        <button onClick={otvori} className="fixed inset-x-3 top-20 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-white p-3 text-left text-ink shadow-2xl">
          {traka.tip === 'otkazan' ? <CalendarX className="mt-0.5 h-6 w-6 shrink-0 text-coral" /> : <CalendarPlus className="mt-0.5 h-6 w-6 shrink-0 text-grass" />}
          <span className="min-w-0">
            <span className="block font-bold">{naslovObavjestenja(traka)}</span>
            <span className="block text-sm text-ink/70">{tekstObavjestenja(traka)}</span>
          </span>
        </button>
      )}

      {otvoreno && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={() => setOtvoreno(false)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 text-ink shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Obavještenja</h2>
              <button onClick={() => setOtvoreno(false)} className="rounded-full bg-grass-tint p-1.5" aria-label="Zatvori"><X className="h-5 w-5" /></button>
            </div>
            {dozvola !== 'granted' && dozvola !== 'nema' && dozvola !== 'denied' && (
              <button onClick={ukljuci} className="mb-3 flex w-full items-center justify-center gap-2 rounded-full bg-sun py-2.5 text-sm font-bold">
                <BellRing className="h-4 w-4" /> Uključi obavještenja na telefonu
              </button>
            )}
            {dozvola === 'denied' && <p className="mb-3 text-xs text-ink/60">Obavještenja na telefonu su isključena u pretraživaču. Uključite ih u podešavanjima sajta.</p>}
            {!lista.length && <p className="py-6 text-center text-ink/50">Nema novih ni otkazanih termina.</p>}
            <ul className="grid gap-2">
              {lista.map((o) => (
                <li key={o.kad}>
                  <button onClick={() => { setOtvoreno(false); if (jeDatum(o.datum)) onOtvoriDan(o.datum) }}
                    className={'flex w-full items-start gap-3 rounded-2xl p-3 text-left ' + (o.tip === 'otkazan' ? 'bg-coral/10' : 'bg-grass-tint')}>
                    {o.tip === 'otkazan' ? <CalendarX className="mt-0.5 h-5 w-5 shrink-0 text-coral" /> : <CalendarPlus className="mt-0.5 h-5 w-5 shrink-0 text-grass" />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{naslovObavjestenja(o)}</span>
                      <span className="block text-sm">{tekstObavjestenja(o)}</span>
                      <span className="block text-xs text-ink/50">{ko(o)} · {prije(o.kad)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink/50">Provjera svakih 30 sekundi dok je panel otvoren. Tap na obavještenje otvara taj dan.</p>
          </div>
        </div>
      )}
    </>
  )
}
