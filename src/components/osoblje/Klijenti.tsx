import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Download, Loader2, Mail, Phone, Search, UserPlus } from 'lucide-react'
import { osoblje, type KlijentRed, type Pristup } from '@/lib/osoblje'
import { KarticaZnak, Prozor, Tab } from './zajednicko'
import { inputCls, kratakDatum } from './pomocno'

const NEMA_SKRIPTE = 'Baza klijenata traži novu verziju Google skripte (Grasak.gs). Zalijepite je i napravite New version.'
const FILTERI: { v: string; oznaka: string }[] = [
  { v: '', oznaka: 'Svi' }, { v: 'kartica', oznaka: 'Kartica VG' }, { v: 'predstoji', oznaka: 'Ima termin' },
  { v: 'nije_dosao', oznaka: 'Izostajali' }, { v: 'bez_emaila', oznaka: 'Bez emaila' }, { v: 'marketing', oznaka: 'Marketing da' },
]

/** Baza klijenata (CRM): pretraga, kartica klijenta, ručni upis, CSV. Vlasnik i administratori. */
export default function KlijentiPanel({ pristup }: { pristup: Pristup }) {
  const [q, setQ] = useState('')
  const [upit, setUpit] = useState('')
  const [filter, setFilter] = useState('')
  const [osvjezi, setOsvjezi] = useState(0)
  const [stanje, setStanje] = useState<{ kljuc: string; ukupno: number; nadjeno: number; klijenti: KlijentRed[] | null; greska: string }>({ kljuc: '', ukupno: 0, nadjeno: 0, klijenti: null, greska: '' })
  const [otvoren, setOtvoren] = useState<KlijentRed | 'novi' | null>(null)
  const [info, setInfo] = useState('')

  useEffect(() => { const t = setTimeout(() => setUpit(q.trim()), 300); return () => clearTimeout(t) }, [q])
  const kljuc = [upit, filter, osvjezi].join('|')
  useEffect(() => {
    let aktivno = true
    osoblje<{ ukupno: number; nadjeno: number; klijenti: KlijentRed[] }>('klijenti', pristup, { q: upit, filter })
      .then((r) => {
        if (!aktivno) return
        setStanje({ kljuc, ukupno: r.ukupno || 0, nadjeno: r.nadjeno || 0, klijenti: r.ok ? r.klijenti : null,
          greska: r.ok ? '' : /nepoznata akcija/i.test(r.poruka || '') ? NEMA_SKRIPTE : r.poruka || 'Greška' })
      })
      .catch(() => { if (aktivno) setStanje({ kljuc, ukupno: 0, nadjeno: 0, klijenti: null, greska: 'Nema veze sa serverom.' }) })
    return () => { aktivno = false }
  }, [pristup, upit, filter, osvjezi, kljuc])
  const svjeze = stanje.kljuc === kljuc
  const lista = svjeze ? stanje.klijenti : null
  const greska = svjeze ? stanje.greska : ''

  const sacuvano = (tekst: string) => {
    setOtvoren(null); setInfo(tekst); setOsvjezi((x) => x + 1)
    window.setTimeout(() => setInfo((x) => (x === tekst ? '' : x)), 5000)
  }
  const csv = () => {
    if (!lista) return
    const kolone = ['Telefon', 'Roditelj', 'Email', 'Djeca', 'Kartica', 'Posjete', 'Prva posjeta', 'Zadnja posjeta', 'Zadnja usluga', 'Predstoji', 'Nije došao', 'Otkazano', 'Vaučeri', 'Izvor', 'Marketing', 'Napomena']
    const redovi = lista.map((k) => [k.telefon, k.roditelj, k.email, k.djeca, k.kartica ? 'da' : '', k.posjete, k.prva, k.zadnja, k.zadnjaUsluga, k.predstoji, k.nijeDosao, k.otkazano, k.vauceri, k.izvor, k.marketing, k.napomena])
    const tekst = '﻿' + [kolone, ...redovi].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([tekst], { type: 'text/csv;charset=utf-8' }))
    a.download = `grasak-klijenti${filter ? '-' + filter : ''}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative flex-1 basis-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Telefon, roditelj, dijete, email..." className={inputCls + ' pl-9'} aria-label="Pretraga klijenata" />
        </label>
        <button onClick={() => setOtvoren('novi')} className="flex items-center gap-1.5 rounded-full bg-grass px-3 py-2 text-sm font-bold text-white shadow"><UserPlus className="h-4 w-4" /> Novi klijent</button>
        <button onClick={csv} disabled={!lista || !lista.length} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold shadow disabled:opacity-50"><Download className="h-4 w-4" /> CSV</button>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERI.map((f) => <Tab key={f.v} aktivan={filter === f.v} onClick={() => setFilter(f.v)}>{f.oznaka}</Tab>)}
      </div>
      {info && <p className="mb-3 flex items-center gap-2 rounded-xl bg-grass p-3 text-sm font-bold text-white shadow"><Check className="h-4 w-4" /> {info}</p>}
      {greska && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{greska}</p>}
      {!lista && !greska ? (
        <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam...</p>
      ) : lista && (
        <>
          <p className="mb-2 text-sm text-ink/60">
            {stanje.nadjeno === stanje.ukupno ? `${stanje.ukupno} klijenata` : `${stanje.nadjeno} od ${stanje.ukupno} klijenata`}
            {stanje.nadjeno > lista.length && ` (prikazano prvih ${lista.length}, suzite pretragu)`}
          </p>
          {!lista.length ? (
            <p className="rounded-2xl bg-white p-6 text-center text-ink/70 shadow">{stanje.ukupno ? 'Nema klijenata za ovu pretragu.' : 'Baza je još prazna: puni se sama sa svakim terminom i vaučerom.'}</p>
          ) : (
            <ul className="grid gap-2">
              {lista.map((k) => (
                <li key={k.telefon}>
                  <button onClick={() => setOtvoren(k)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-white p-3 text-left shadow hover:bg-grass-tint">
                    <span className="flex items-center gap-1.5 font-bold text-ink">{k.roditelj || 'bez imena'}{k.kartica && <KarticaZnak mala />}</span>
                    <span className="text-sm font-bold text-grass-deep">{k.telefon}</span>
                    {k.djeca && <span className="text-sm text-ink/70">{k.djeca}</span>}
                    <span className="ml-auto flex flex-wrap items-center gap-x-2 text-xs text-ink/60">
                      {k.posjete > 0 && <span>{k.posjete} {k.posjete === 1 ? 'posjeta' : 'posjeta'}</span>}
                      {k.zadnja && <span>zadnja {kratakDatum(k.zadnja)}</span>}
                      {k.predstoji > 0 && <span className="font-bold text-grass-deep">ima termin</span>}
                      {k.nijeDosao > 0 && <span className="font-bold text-coral">izostao {k.nijeDosao}x</span>}
                      {k.vauceri > 0 && <span>vaučer {k.vauceri}</span>}
                      {k.marketing === 'ne' && <span>bez poruka</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {otvoren && <KlijentKartica pristup={pristup} k={otvoren === 'novi' ? null : otvoren} onZatvori={() => setOtvoren(null)} onSacuvano={sacuvano} />}
    </div>
  )
}

function KlijentKartica({ pristup, k, onZatvori, onSacuvano }: { pristup: Pristup; k: KlijentRed | null; onZatvori: () => void; onSacuvano: (t: string) => void }) {
  const [salje, setSalje] = useState(false)
  const [greska, setGreska] = useState('')
  const posalji = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setSalje(true); setGreska('')
    try {
      const r = await osoblje('klijent_sacuvaj', pristup, {
        telefon: k ? k.telefon : f.get('telefon'), roditelj: f.get('roditelj'), email: f.get('email'), djeca: f.get('djeca'),
        kartica: f.get('kartica') === 'on', marketing: f.get('marketing'), napomena: f.get('napomena'),
      })
      if (r.ok) onSacuvano(r.poruka || 'Sačuvano.')
      else setGreska(r.poruka || 'Nije sačuvano.')
    } catch {
      setGreska('Nema veze sa serverom.')
    } finally {
      setSalje(false)
    }
  }
  const brojka = (naziv: string, v: string | number) => (
    <div className="rounded-xl bg-grass-tint px-3 py-2"><span className="block text-[11px] uppercase tracking-wide text-ink/50">{naziv}</span><span className="block font-bold text-ink">{v || '-'}</span></div>
  )
  return (
    <Prozor naslov={k ? k.roditelj || k.telefon : 'Novi klijent'} onZatvori={onZatvori}>
      {k && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <a href={'tel:' + k.telefon} className="inline-flex items-center gap-1.5 rounded-full bg-grass px-3 py-1.5 text-sm font-bold text-white"><Phone className="h-4 w-4" /> {k.telefon}</a>
            {k.email && <a href={'mailto:' + k.email} className="inline-flex items-center gap-1.5 rounded-full bg-grass-tint px-3 py-1.5 text-sm font-bold text-ink"><Mail className="h-4 w-4" /> {k.email}</a>}
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
            {brojka('Posjete', k.posjete)}
            {brojka('Zadnja', k.zadnja ? `${kratakDatum(k.zadnja)}${k.zadnjaUsluga ? ' · ' + k.zadnjaUsluga : ''}` : '')}
            {brojka('Prva', k.prva ? kratakDatum(k.prva) : '')}
            {brojka('Predstoji', k.predstoji)}
            {brojka('Nije došao', k.nijeDosao)}
            {brojka('Otkazano', k.otkazano)}
            {brojka('Vaučeri', k.vauceri)}
            {brojka('Izvor', k.izvor)}
            {brojka('Ažurirano', k.azurirano.slice(0, 10))}
          </div>
        </>
      )}
      <form onSubmit={posalji} className="grid gap-3">
        {!k && <input name="telefon" required type="tel" inputMode="tel" placeholder="Telefon * (npr. 067 338 777)" className={inputCls} autoFocus />}
        <input name="roditelj" defaultValue={k?.roditelj || ''} maxLength={60} placeholder="Ime i prezime roditelja" className={inputCls} />
        <input name="email" defaultValue={k?.email || ''} type="email" inputMode="email" maxLength={80} placeholder="Email" className={inputCls} />
        <input name="djeca" defaultValue={k?.djeca || ''} maxLength={120} placeholder="Djeca (npr. Luka, Mia)" className={inputCls} />
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-sun bg-sun/30 px-3 py-2.5 text-sm font-bold text-ink">
          <input name="kartica" type="checkbox" defaultChecked={!!k?.kartica} className="h-5 w-5 accent-grass" /> Ima karticu Veseli Grašak (15%)
        </label>
        <label className="text-sm font-bold text-ink">Poruke o akcijama (marketing)
          <select name="marketing" defaultValue={k?.marketing || ''} className={inputCls + ' mt-1'}>
            <option value="">nije pitan/a</option>
            <option value="da">da, pristaje</option>
            <option value="ne">ne želi</option>
          </select>
        </label>
        <textarea name="napomena" defaultValue={k?.napomena || ''} maxLength={300} rows={3} placeholder="Napomena (npr. strah od mašinice, alergija, omiljeni crtać)" className={inputCls} />
        {greska && <p className="rounded-xl bg-coral/10 p-2 text-sm text-ink">{greska}</p>}
        <button disabled={salje} className="flex items-center justify-center gap-2 rounded-full bg-grass py-3 font-bold text-white disabled:opacity-50">
          {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} {k ? 'Sačuvaj' : 'Upiši klijenta'}
        </button>
      </form>
    </Prozor>
  )
}
