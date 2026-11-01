import { useState } from 'react'
import { Coffee, Loader2, Trash2 } from 'lucide-react'
import { osoblje, type Pristup } from '@/lib/osoblje'

const uMinute = (v: string) => { const [h, m] = v.split(':').map(Number); return h * 60 + m }
const uVrijeme = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** Pauza ili "ne radi" za frizera od izabranog sata; sajt odmah prestaje da nudi to vrijeme. */
export function PauzaForma({ pristup, lokId, datum, osoba, vrijeme, radno, onGotovo }: {
  pristup: Pristup; lokId: string; datum: string; osoba: string; vrijeme: string; radno: [string, string] | null
  onGotovo: (tekst: string) => void
}) {
  const [trajanje, setTrajanje] = useState<number | 'kraj' | 'dan'>(30)
  const [naziv, setNaziv] = useState<'Pauza' | 'Ne radi'>('Pauza')
  const [salje, setSalje] = useState(false)
  const [greska, setGreska] = useState('')
  const krajDana = radno ? radno[1] : '21:00'
  const opcije: { oznaka: string; v: number | 'kraj' | 'dan' }[] = [
    { oznaka: '30 min', v: 30 }, { oznaka: '1 h', v: 60 }, { oznaka: '2 h', v: 120 },
    { oznaka: 'do kraja dana', v: 'kraj' }, { oznaka: 'cijeli dan', v: 'dan' },
  ]
  const kraj = trajanje === 'dan' ? '' : trajanje === 'kraj' ? krajDana : uVrijeme(uMinute(vrijeme) + trajanje)
  const posalji = async () => {
    setSalje(true); setGreska('')
    try {
      const r = await osoblje('blokada', pristup, {
        lok: lokId, osoba, datum, od: vrijeme, do: kraj, naziv, cijeliDan: trajanje === 'dan',
      })
      if (r.ok) onGotovo(r.poruka || 'Upisano.')
      else setGreska(r.poruka || 'Nije upisano.')
    } catch {
      setGreska('Nema veze sa serverom.')
    } finally {
      setSalje(false)
    }
  }
  const cip = (aktivan: boolean) => 'rounded-full border-2 px-3 py-1.5 text-sm font-bold ' + (aktivan ? 'border-ink bg-ink text-white' : 'border-grass-tint text-ink')
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {opcije.map((o) => <button key={o.oznaka} type="button" onClick={() => setTrajanje(o.v)} className={cip(trajanje === o.v)}>{o.oznaka}</button>)}
      </div>
      {trajanje !== 'dan' && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setNaziv('Pauza')} className={cip(naziv === 'Pauza')}>Pauza</button>
          <button type="button" onClick={() => setNaziv('Ne radi')} className={cip(naziv === 'Ne radi')}>Ne radi</button>
        </div>
      )}
      <p className="text-sm text-ink/60">
        {trajanje === 'dan' ? `${osoba} ne radi cijeli dan.` : `${osoba}: ${naziv.toLowerCase()} ${vrijeme} - ${kraj}.`} Sajt ne nudi to vrijeme, termini u kalendaru ostaju.
      </p>
      {greska && <p className="rounded-xl bg-coral/10 p-2 text-sm text-ink">{greska}</p>}
      <button disabled={salje || (trajanje !== 'dan' && uMinute(kraj) <= uMinute(vrijeme))} onClick={() => void posalji()}
        className="flex items-center justify-center gap-2 rounded-full bg-ink py-3 font-bold text-white disabled:opacity-50">
        {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <Coffee className="h-5 w-5" />} Upiši {trajanje === 'dan' ? 'slobodan dan' : naziv.toLowerCase()}
      </button>
    </div>
  )
}

/** Klik na pauzu u pregledu dana: uklanjanje. */
export function BlokadaDetalji({ pristup, id, naziv, osoba, onGotovo }: {
  pristup: Pristup; id: string; naziv: string; osoba: string; onGotovo: (tekst: string) => void
}) {
  const [salje, setSalje] = useState(false)
  const [greska, setGreska] = useState('')
  const ukloni = async () => {
    if (!window.confirm(`Ukloniti "${naziv}" za ${osoba}? Vrijeme postaje slobodno i na sajtu.`)) return
    setSalje(true); setGreska('')
    try {
      const r = await osoblje('obrisi_blokadu', pristup, { id })
      if (r.ok) onGotovo(r.poruka || 'Uklonjeno.')
      else setGreska(r.poruka || 'Nije uklonjeno.')
    } catch {
      setGreska('Nema veze sa serverom.')
    } finally {
      setSalje(false)
    }
  }
  return (
    <div>
      <p className="text-sm text-ink/70">{osoba} · {naziv}. Upisano u panelu ili u Google kalendaru.</p>
      {greska && <p className="mt-3 rounded-xl bg-coral/10 p-2 text-sm text-ink">{greska}</p>}
      <button disabled={salje} onClick={() => void ukloni()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-coral py-3 font-bold text-white disabled:opacity-50">
        {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />} Ukloni
      </button>
    </div>
  )
}
