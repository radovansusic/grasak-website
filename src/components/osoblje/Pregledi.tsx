import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Phone, Printer } from 'lucide-react'
import { osoblje, type KonfigOsoblje, type PredstojeciTermin, type Pristup, type Sedmica } from '@/lib/osoblje'
import { isoDatum } from '@/lib/zakazivanje'
import { KarticaZnak, Tab } from './zajednicko'
import { kratakDatum, lijepDatum, nazivTermina, pomjeri, ponedjeljak } from './pomocno'

const NEMA_SKRIPTE = 'Ovaj pregled traži novu verziju Google skripte (Grasak.gs). Zalijepite je i napravite New version.'

/** Sedmica za sve frizere lokacije: termini, popunjenost i slobodno po danu. Klik na dan otvara dnevni pregled. */
export function SedmicaPanel({ pristup, konfig, onOtvoriDan }: { pristup: Pristup; konfig: KonfigOsoblje; onOtvoriDan: (datum: string) => void }) {
  const [lokId, setLokId] = useState(konfig.lokacije[0]?.id || '')
  const [od, setOd] = useState(() => ponedjeljak(new Date()))
  const [stanje, setStanje] = useState<{ kljuc: string; sedmica: Sedmica | null; greska: string }>({ kljuc: '', sedmica: null, greska: '' })
  const kljuc = lokId + '|' + od
  useEffect(() => {
    if (!lokId) return
    let aktivno = true
    osoblje<{ sedmica: Sedmica }>('sedmica', pristup, { lok: lokId, od })
      .then((r) => { if (aktivno) setStanje({ kljuc, sedmica: r.ok ? r.sedmica : null, greska: r.ok ? '' : /nepoznata akcija/i.test(r.poruka || '') ? NEMA_SKRIPTE : r.poruka || 'Greška' }) })
      .catch(() => { if (aktivno) setStanje({ kljuc, sedmica: null, greska: 'Nema veze sa serverom.' }) })
    return () => { aktivno = false }
  }, [pristup, lokId, od, kljuc])
  const sed = stanje.kljuc === kljuc ? stanje.sedmica : null
  const greska = stanje.kljuc === kljuc ? stanje.greska : ''
  const danas = isoDatum(new Date())
  const ovaSedmica = ponedjeljak(new Date())
  const osobe = sed ? sed.dani[0].osobe.map((o) => o.ime) : []
  const ukupno = useMemo(() => {
    if (!sed) return {}
    const u: Record<string, { termini: number; zauzeto: number; kapacitet: number }> = {}
    sed.dani.forEach((d) => d.osobe.forEach((o) => {
      const x = u[o.ime] || (u[o.ime] = { termini: 0, zauzeto: 0, kapacitet: 0 })
      x.termini += o.termini; x.zauzeto += o.popunjeno.zauzeto; x.kapacitet += o.popunjeno.kapacitet
    }))
    return u
  }, [sed])

  return (
    <div>
      {konfig.lokacije.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {konfig.lokacije.map((l) => <Tab key={l.id} aktivan={l.id === lokId} onClick={() => setLokId(l.id)}>{l.naziv}</Tab>)}
        </div>
      )}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setOd(pomjeri(od, -7))} className="rounded-full bg-white p-2.5 shadow" aria-label="Prethodna sedmica"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex-1 rounded-2xl bg-white px-3 py-2 text-center shadow">
          <span className="block font-display text-lg font-extrabold text-ink">{kratakDatum(od)} - {kratakDatum(pomjeri(od, 6))}</span>
          <span className="block text-xs text-ink/50">{od === ovaSedmica ? 'ova sedmica' : od > ovaSedmica ? 'sljedeće' : 'prošlo'}</span>
        </div>
        <button onClick={() => setOd(pomjeri(od, 7))} className="rounded-full bg-white p-2.5 shadow" aria-label="Sljedeća sedmica"><ChevronRight className="h-5 w-5" /></button>
      </div>
      {od !== ovaSedmica && <button onClick={() => setOd(ovaSedmica)} className="mb-3 text-sm font-bold text-grass-deep underline">Nazad na ovu sedmicu</button>}
      {greska && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{greska}</p>}
      {!sed && !greska ? (
        <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam...</p>
      ) : sed && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs text-ink/50">Dan</th>
                {osobe.map((o) => <th key={o} className="min-w-[130px] p-2 text-left font-display text-base text-ink">{o}</th>)}
              </tr>
            </thead>
            <tbody>
              {sed.dani.map((d) => (
                <tr key={d.datum} className={'border-t border-grass-tint ' + (d.datum === danas ? 'bg-sun/20' : d.datum < danas ? 'opacity-60' : '')}>
                  <td className="sticky left-0 z-10 bg-white p-2 align-top">
                    <button onClick={() => onOtvoriDan(d.datum)} className="text-left font-bold capitalize text-grass-deep underline">{lijepDatum(d.datum)}</button>
                    {d.neradni && <span className="block text-xs text-ink/50">{d.neradni}</span>}
                  </td>
                  {d.osobe.map((o) => (
                    <td key={o.ime} className="p-1 align-top">
                      {!o.popunjeno.kapacitet && !o.termini ? (
                        <div className="rounded-lg bg-ink/5 px-2 py-2 text-xs text-ink/40">{d.neradni ? 'neradni' : 'ne radi'}</div>
                      ) : (
                        <button onClick={() => onOtvoriDan(d.datum)} className="w-full rounded-lg bg-grass-tint px-2 py-1.5 text-left hover:bg-grass/20">
                          <span className="flex items-center justify-between gap-1">
                            <span className="font-bold text-ink">{o.termini} {o.termini === 1 ? 'termin' : 'termina'}</span>
                            <span className="text-xs font-bold text-grass-deep">{o.popunjeno.kapacitet ? o.popunjeno.procenat + '%' : ''}</span>
                          </span>
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white">
                            <span className="block h-full rounded-full bg-grass" style={{ width: Math.min(100, o.popunjeno.procenat) + '%' }} />
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-ink/60">
                            {o.slobodno > 0 && <span>slobodno {o.slobodno / 2} h</span>}
                            {o.kartica > 0 && <span className="inline-flex items-center gap-0.5"><KarticaZnak mala /> {o.kartica}</span>}
                            {o.nijeDosao > 0 && <span className="text-coral">nije došao {o.nijeDosao}</span>}
                          </span>
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-grass-tint font-bold">
                <td className="sticky left-0 z-10 bg-white p-2 text-xs text-ink/50">Ukupno</td>
                {osobe.map((o) => {
                  const u = ukupno[o]
                  return <td key={o} className="p-2 text-ink">{u ? `${u.termini} termina · ${u.kapacitet ? Math.round(100 * u.zauzeto / u.kapacitet) + '%' : '-'}` : ''}</td>
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Svi predstojeći termini (sve lokacije i frizeri), po danima, sa telefonima. Za provjeru ili štampu. */
export function ListaPanel({ pristup, konfig }: { pristup: Pristup; konfig: KonfigOsoblje }) {
  const [dana, setDana] = useState(7)
  const [stanje, setStanje] = useState<{ dana: number; termini: PredstojeciTermin[] | null; greska: string }>({ dana: 0, termini: null, greska: '' })
  useEffect(() => {
    let aktivno = true
    osoblje<{ termini: PredstojeciTermin[] }>('predstojeci', pristup, { dana })
      .then((r) => { if (aktivno) setStanje({ dana, termini: r.ok ? r.termini : null, greska: r.ok ? '' : /nepoznata akcija/i.test(r.poruka || '') ? NEMA_SKRIPTE : r.poruka || 'Greška' }) })
      .catch(() => { if (aktivno) setStanje({ dana, termini: null, greska: 'Nema veze sa serverom.' }) })
    return () => { aktivno = false }
  }, [pristup, dana])
  const termini = stanje.dana === dana ? stanje.termini : null
  const greska = stanje.dana === dana ? stanje.greska : ''
  const poDanu = useMemo(() => {
    const m = new Map<string, PredstojeciTermin[]>()
    ;(termini || []).forEach((t) => { if (!m.has(t.datum)) m.set(t.datum, []); m.get(t.datum)!.push(t) })
    return [...m.entries()]
  }, [termini])
  const viseLokacija = konfig.lokacije.length > 1

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
        {[7, 14, 30].map((n) => <Tab key={n} aktivan={dana === n} onClick={() => setDana(n)}>{n} dana</Tab>)}
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold shadow"><Printer className="h-4 w-4" /> Štampa / PDF</button>
      </div>
      {greska && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{greska}</p>}
      {!termini && !greska ? (
        <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam...</p>
      ) : termini && !termini.length ? (
        <p className="rounded-2xl bg-white p-6 text-center text-ink/70 shadow">Nema zakazanih termina u narednih {dana} dana.</p>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-ink/60 print:text-ink">Ukupno {termini!.length} termina u narednih {dana} dana.</p>
          {poDanu.map(([datum, lista]) => (
            <div key={datum} className="rounded-2xl bg-white p-3 shadow">
              <h3 className="mb-2 font-display text-base font-extrabold capitalize text-ink">{lijepDatum(datum)} <span className="text-sm font-bold text-ink/50">· {lista.length}</span></h3>
              <ul className="grid gap-1.5">
                {lista.map((t) => (
                  <li key={t.id} className={'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-sm ' + (t.kartica ? 'bg-sun/30' : 'bg-grass-tint') + (t.status === 'nije_dosao' ? ' line-through opacity-60' : '')}>
                    <span className="w-24 font-bold text-ink">{t.vrijeme}-{t.kraj}</span>
                    <span className={'flex items-center gap-1.5 font-bold text-ink ' + (nazivTermina(t).izvor === 'dijete' ? '' : 'italic')}>{nazivTermina(t).tekst}{t.kartica && <KarticaZnak mala />}</span>
                    <span className="text-ink/70">{t.usluga}</span>
                    <span className="text-ink/70">{t.frizer}{viseLokacija && ` · ${t.lokacija}`}</span>
                    {t.roditelj && <span className="text-ink/60">{t.roditelj}</span>}
                    {t.telefon && <a href={'tel:' + t.telefon} className="inline-flex items-center gap-1 font-bold text-grass-deep"><Phone className="h-3.5 w-3.5" /> {t.telefon}</a>}
                    {t.napomena && <span className="w-full text-xs text-ink/60">{t.napomena}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
