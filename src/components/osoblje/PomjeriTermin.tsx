import { useEffect, useState } from 'react'
import { CalendarClock, Loader2 } from 'lucide-react'
import { osoblje, type DanOsoblje, type KonfigOsoblje, type Pristup, type TerminOsoblje } from '@/lib/osoblje'
import { isoDatum } from '@/lib/zakazivanje'
import { Prozor } from './zajednicko'
import { inputCls, lijepDatum, proslo } from './pomocno'

/** Pomjeranje termina: novi dan i sat (i drugi frizer iste lokacije), podaci o djetetu ostaju, roditelj dobija email. */
export default function PomjeriTermin({ pristup, konfig, lokId, osoba, t, datum: pocetni, onZatvori, onGotovo }: {
  pristup: Pristup; konfig: KonfigOsoblje; lokId: string; osoba: string; t: TerminOsoblje; datum: string
  onZatvori: () => void; onGotovo: (tekst: string) => void
}) {
  const [datum, setDatum] = useState(pocetni)
  const [frizer, setFrizer] = useState(osoba)
  const [vrijeme, setVrijeme] = useState('')
  const [dan, setDan] = useState<DanOsoblje | null>(null)
  const [greska, setGreska] = useState('')
  const [salje, setSalje] = useState(false)
  const lok = konfig.lokacije.find((l) => l.id === lokId)
  const danas = isoDatum(new Date())

  useEffect(() => {
    let aktivno = true
    osoblje<{ dan: DanOsoblje }>('dan', pristup, { lok: lokId, datum })
      .then((r) => { if (aktivno && r.ok) setDan(r.dan) })
      .catch(() => {})
    return () => { aktivno = false }
  }, [pristup, lokId, datum])

  const ucitan = dan && dan.datum === datum ? dan : null
  const slobodni = ucitan?.osobe.find((o) => o.ime === frizer)?.slotovi
    .filter((s) => s.stanje === 'slobodno' && (datum !== danas || !proslo(s.vrijeme))).map((s) => s.vrijeme) ?? []
  const izabrano = slobodni.includes(vrijeme) ? vrijeme : ''

  const potvrdi = async () => {
    setSalje(true); setGreska('')
    try {
      const r = await osoblje('pomjeri', pristup, { id: t.id, datum, vrijeme: izabrano, osoba: frizer })
      if (r.ok) onGotovo(r.poruka || 'Pomjereno.')
      else setGreska(r.poruka || 'Nije pomjereno.')
    } catch {
      setGreska('Nema veze sa serverom.')
    } finally {
      setSalje(false)
    }
  }

  return (
    <Prozor naslov={`Pomjeri · ${t.dijete || 'termin'}`} onZatvori={onZatvori}>
      <p className="-mt-2 mb-3 text-sm text-ink/60">Sada: {t.od}, {osoba} · {t.usluga}. Podaci o djetetu ostaju, roditelj dobija email ako ga je ostavio.</p>
      <label className="block text-sm font-bold text-ink">Novi dan
        <input type="date" value={datum} min={danas} onChange={(e) => { if (e.target.value) { setDatum(e.target.value); setVrijeme('') } }} className={inputCls + ' mt-1'} />
      </label>
      {lok && lok.osobe.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {lok.osobe.map((o) => (
            <button key={o} type="button" onClick={() => { setFrizer(o); setVrijeme('') }}
              className={'rounded-full border-2 px-3 py-1.5 text-sm font-bold ' + (frizer === o ? 'border-grass bg-grass text-white' : 'border-grass-tint text-ink')}>{o}</button>
          ))}
        </div>
      )}
      <p className="mt-3 text-sm font-bold capitalize text-ink">{lijepDatum(datum)} · slobodno</p>
      {!ucitan ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-ink/60"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam...</p>
      ) : ucitan.neradni ? (
        <p className="mt-2 rounded-xl bg-sun p-2 text-sm font-bold text-ink">Neradni dan: {ucitan.neradni}.</p>
      ) : !slobodni.length ? (
        <p className="mt-2 text-sm text-ink/60">Nema slobodnih termina tog dana.</p>
      ) : (
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slobodni.map((v) => (
            <button key={v} type="button" onClick={() => setVrijeme(v)}
              className={'rounded-xl border-2 py-2 text-sm font-bold ' + (izabrano === v ? 'border-grass bg-grass text-white' : 'border-grass-tint text-ink')}>{v}</button>
          ))}
        </div>
      )}
      {greska && <p className="mt-3 rounded-xl bg-coral/10 p-2 text-sm text-ink">{greska}</p>}
      <button disabled={!izabrano || salje} onClick={() => void potvrdi()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-grass py-3 font-bold text-white disabled:opacity-50">
        {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarClock className="h-5 w-5" />} Pomjeri na {izabrano || '...'}
      </button>
    </Prozor>
  )
}
