import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { osoblje, type OsobaPod, type Podesavanja, type Uloga } from '@/lib/osoblje'

const DANI = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']
const TRAJANJA = [30, 60, 90, 120]
const ULOGE: { v: Uloga; naziv: string }[] = [
  { v: 'frizer', naziv: 'Frizer' }, { v: 'admin', naziv: 'Admin' }, { v: 'vlasnik', naziv: 'Vlasnik' },
]
const inp = 'w-full rounded-xl border-2 border-grass-tint bg-white px-3 py-2 text-ink outline-none focus:border-grass disabled:bg-ink/5 disabled:text-ink/60'

function oznaci(p: Podesavanja): Podesavanja {
  return {
    lokacije: p.lokacije.map((l) => ({ ...l, dani: [...l.dani, '', '', '', '', '', '', ''].slice(0, 7), postojeca: true })),
    frizeri: p.frizeri.map((f) => ({ ...f, postojeci: true })),
    usluge: p.usluge.map((u) => ({ ...u, postojeca: true })),
    osoblje: p.osoblje.map((o) => ({ ...o, pin: '' })),
    praznici: (p.praznici || []).map((x) => ({ ...x, postojeci: true })),
    neradniDani: p.neradniDani || [],
  }
}

/** Podešavanja salona iz aplikacije, samo za vlasnika. Upisuje se u istu Google tabelu. */
export default function PodesavanjaPanel({ pin, onSacuvano, onOdjava }: {
  pin: string; onSacuvano: () => void; onOdjava: () => void
}) {
  const [s, setS] = useState<Podesavanja | null>(null)
  const [greskaUcitavanja, setGreskaUcitavanja] = useState('')
  const [greske, setGreske] = useState<string[]>([])
  const [info, setInfo] = useState('')
  const [salje, setSalje] = useState(false)
  const [verzija, setVerzija] = useState(0)

  useEffect(() => {
    let aktivno = true
    osoblje<{ podesavanja: Podesavanja }>('podesavanja', pin)
      .then((r) => { if (!aktivno) return; if (r.ok) setS(oznaci(r.podesavanja)); else setGreskaUcitavanja(r.poruka || 'Greška') })
      .catch(() => { if (aktivno) setGreskaUcitavanja('Nema veze sa serverom.') })
    return () => { aktivno = false }
  }, [pin, verzija])

  if (greskaUcitavanja) return <p className="rounded-xl bg-coral/10 p-3 text-ink">{greskaUcitavanja}</p>
  if (!s) return <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam podešavanja...</p>

  const promijeni = (n: Partial<Podesavanja>) => { setS({ ...s, ...n }); setInfo('') }
  const naziviLok = s.lokacije.map((l) => l.naziv).filter(Boolean)

  const sacuvaj = async () => {
    setSalje(true); setGreske([]); setInfo('')
    try {
      const r = await osoblje<{ greske?: string[]; odjava?: boolean }>('sacuvaj_podesavanja', pin, { podesavanja: s })
      if (!r.ok) { setGreske(r.greske?.length ? r.greske : [r.poruka || 'Nije sačuvano.']); return }
      setInfo(r.poruka || 'Sačuvano.')
      if (r.odjava) { window.alert('Vaš PIN je promijenjen. Prijavite se novim PIN-om.'); onOdjava(); return }
      onSacuvano()
      setVerzija((x) => x + 1)
    } catch {
      setGreske(['Nema veze sa serverom.'])
    } finally {
      setSalje(false)
    }
  }

  return (
    <div className="pb-24">
      <p className="mb-3 text-sm text-ink/60">Promjene važe čim kliknete "Sačuvaj": sajt, zakazivanje i panel odmah ih koriste.</p>

      <Sekcija naslov="Lokacije i radno vrijeme" dodaj={() => promijeni({ lokacije: [...s.lokacije, { naziv: '', adresa: '', telefon: '', dani: ['ne radi', '15-21', '15-21', '15-21', '15-21', '11-21', '11-21'] }] })} dodajTekst="Dodaj lokaciju">
        {s.lokacije.map((l, i) => {
          const izmijeni = (n: Partial<typeof l>) => promijeni({ lokacije: s.lokacije.map((x, j) => (j === i ? { ...x, ...n } : x)) })
          const preimenuj = (naziv: string) => promijeni({
            lokacije: s.lokacije.map((x, j) => (j === i ? { ...x, naziv } : x)),
            frizeri: s.frizeri.map((f) => (f.lokacija === l.naziv ? { ...f, lokacija: naziv } : f)),
            osoblje: s.osoblje.map((o) => (o.lokacija === l.naziv ? { ...o, lokacija: naziv } : o)),
          })
          const prviRadni = l.dani.find((d) => d && d !== 'ne radi')
          return (
            <div key={i} className="rounded-2xl border-2 border-grass-tint p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Polje oznaka="Naziv">
                  <input className={inp} value={l.naziv} disabled={l.postojeca} onChange={(e) => preimenuj(e.target.value)} placeholder="npr. Grašak Podgorica" />
                </Polje>
                <Polje oznaka="Adresa"><input className={inp} value={l.adresa} onChange={(e) => izmijeni({ adresa: e.target.value })} /></Polje>
                <Polje oznaka="Telefon (za SMS)"><input className={inp} value={l.telefon} onChange={(e) => izmijeni({ telefon: e.target.value })} inputMode="tel" /></Polje>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {DANI.map((dan, k) => {
                  const neRadi = (l.dani[k] || '').toLowerCase() === 'ne radi'
                  const postavi = (v: string) => izmijeni({ dani: l.dani.map((x, j) => (j === k ? v : x)) })
                  return (
                    <div key={dan} className={'rounded-xl p-2 ' + (neRadi ? 'bg-ink/5' : 'bg-grass-tint')}>
                      <label className="flex items-center justify-between text-xs font-bold text-ink">
                        {dan}
                        <span className="flex items-center gap-1 font-normal">
                          <input type="checkbox" checked={!neRadi} onChange={(e) => postavi(e.target.checked ? (prviRadni || '15-21') : 'ne radi')} /> radi
                        </span>
                      </label>
                      <input className={inp + ' mt-1 py-1.5 text-center'} value={neRadi ? 'ne radi' : l.dani[k]} disabled={neRadi}
                        onChange={(e) => postavi(e.target.value)} placeholder="15-21" />
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {prviRadni && (
                  <button type="button" className="font-bold text-grass-deep underline"
                    onClick={() => izmijeni({ dani: l.dani.map((d) => (d.toLowerCase() === 'ne radi' ? d : prviRadni)) })}>
                    Isto vrijeme ({prviRadni}) za sve radne dane
                  </button>
                )}
                {!l.postojeca && <Ukloni onClick={() => promijeni({ lokacije: s.lokacije.filter((_, j) => j !== i) })} />}
              </div>
            </div>
          )
        })}
        <p className="text-xs text-ink/50">Vrijeme se piše kratko: 15-21 ili 9:30-14. Naziv postojeće lokacije se ne mijenja jer je vezan za termine.</p>
      </Sekcija>

      <Sekcija naslov="Praznici (svake godine)" dodaj={() => promijeni({ praznici: [...s.praznici, { naziv: '', datum: '', dana: 1, neradni: true }] })} dodajTekst="Dodaj praznik">
        {s.praznici.map((x, i) => {
          const izmijeni = (n: Partial<typeof x>) => promijeni({ praznici: s.praznici.map((y, j) => (j === i ? { ...y, ...n } : y)) })
          return (
            <div key={i} className="grid grid-cols-[5.5rem_4.5rem_1fr] items-end gap-2 border-b border-grass-tint pb-3 sm:grid-cols-[1fr_5.5rem_4.5rem_auto] sm:border-0 sm:pb-0">
              <div className="col-span-3 sm:col-span-1">
                <Polje oznaka="Praznik"><input className={inp} value={x.naziv} onChange={(e) => izmijeni({ naziv: e.target.value })} placeholder="npr. Božić" /></Polje>
              </div>
              <Polje oznaka="Datum"><input className={inp + ' text-center'} value={x.datum} onChange={(e) => izmijeni({ datum: e.target.value })} placeholder="07.01." /></Polje>
              <Polje oznaka="Dana">
                <select className={inp} value={x.dana} onChange={(e) => izmijeni({ dana: Number(e.target.value) })}>
                  <option value={1}>1</option><option value={2}>2</option>
                </select>
              </Polje>
              <div className="flex items-center gap-1 pb-2">
                <Prekidac ukljucen={x.neradni} onChange={(v) => izmijeni({ neradni: v })} da="Ne radimo" ne="Radimo" />
                {!x.postojeci && <Ukloni onClick={() => promijeni({ praznici: s.praznici.filter((_, j) => j !== i) })} />}
              </div>
            </div>
          )
        })}
        <p className="text-xs text-ink/50">Unaprijed upisani državni praznici po zakonu Crne Gore (po dva dana). Ako praznik padne u nedjelju, neradan je i prvi naredni dan. Ako salon ipak radi praznikom, prebacite na "Radimo".</p>
      </Sekcija>

      <Sekcija naslov="Neradni dani (vlasnik proglašava)" dodaj={() => promijeni({ neradniDani: [...s.neradniDani, { datum: '', razlog: '', lokacija: '' }] })} dodajTekst="Dodaj neradni dan">
        {!s.neradniDani.length && <p className="text-sm text-ink/50">Nema posebnih neradnih dana.</p>}
        {s.neradniDani.map((x, i) => {
          const izmijeni = (n: Partial<typeof x>) => promijeni({ neradniDani: s.neradniDani.map((y, j) => (j === i ? { ...y, ...n } : y)) })
          return (
            <div key={i} className="grid grid-cols-[9.5rem_1fr] items-end gap-2 sm:grid-cols-[9.5rem_1fr_1fr_auto]">
              <Polje oznaka="Datum"><input type="date" className={inp} value={x.datum} onChange={(e) => izmijeni({ datum: e.target.value })} /></Polje>
              <Polje oznaka="Razlog"><input className={inp} value={x.razlog} onChange={(e) => izmijeni({ razlog: e.target.value })} placeholder="npr. Kolektivni odmor" /></Polje>
              <Polje oznaka="Lokacija"><Izbor vrijednost={x.lokacija} opcije={naziviLok} prazno="Sve lokacije" onChange={(v) => izmijeni({ lokacija: v })} /></Polje>
              <div className="pb-1"><Ukloni onClick={() => promijeni({ neradniDani: s.neradniDani.filter((_, j) => j !== i) })} /></div>
            </div>
          )
        })}
        <p className="text-xs text-ink/50">Tog dana sajt ne nudi termine, a u panelu piše razlog. Već zakazane termine pogledajte u pregledu dana i javite se roditeljima.</p>
      </Sekcija>

      <Sekcija naslov="Frizeri" dodaj={() => promijeni({ frizeri: [...s.frizeri, { ime: '', lokacija: naziviLok[0] || '', aktivan: true }] })} dodajTekst="Dodaj frizera">
        {s.frizeri.map((f, i) => {
          const izmijeni = (n: Partial<typeof f>) => promijeni({ frizeri: s.frizeri.map((x, j) => (j === i ? { ...x, ...n } : x)) })
          return (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <Polje oznaka="Ime"><input className={inp} value={f.ime} disabled={f.postojeci} onChange={(e) => izmijeni({ ime: e.target.value })} /></Polje>
              <Polje oznaka="Lokacija"><Izbor vrijednost={f.lokacija} opcije={naziviLok} onChange={(v) => izmijeni({ lokacija: v })} /></Polje>
              <div className="flex items-center gap-2 pb-2">
                <Prekidac ukljucen={f.aktivan} onChange={(v) => izmijeni({ aktivan: v })} />
                {!f.postojeci && <Ukloni onClick={() => promijeni({ frizeri: s.frizeri.filter((_, j) => j !== i) })} />}
              </div>
            </div>
          )
        })}
        <p className="text-xs text-ink/50">Frizer koji više ne radi: isključite prekidač (termini i izvještaji ostaju). Da bi frizer ulazio u panel, dodajte ga i u Osoblje s PIN-om.</p>
      </Sekcija>

      <Sekcija naslov="Usluge" dodaj={() => promijeni({ usluge: [...s.usluge, { naziv: '', trajanje: 30, aktivna: true }] })} dodajTekst="Dodaj uslugu">
        {s.usluge.map((u, i) => {
          const izmijeni = (n: Partial<typeof u>) => promijeni({ usluge: s.usluge.map((x, j) => (j === i ? { ...x, ...n } : x)) })
          return (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
              <Polje oznaka="Naziv"><input className={inp} value={u.naziv} onChange={(e) => izmijeni({ naziv: e.target.value })} /></Polje>
              <Polje oznaka="Trajanje">
                <select className={inp} value={u.trajanje} onChange={(e) => izmijeni({ trajanje: Number(e.target.value) })}>
                  {TRAJANJA.map((t) => <option key={t} value={t}>{t} min</option>)}
                </select>
              </Polje>
              <div className="flex items-center gap-2 pb-2">
                <Prekidac ukljucen={u.aktivna} onChange={(v) => izmijeni({ aktivna: v })} />
                {!u.postojeca && <Ukloni onClick={() => promijeni({ usluge: s.usluge.filter((_, j) => j !== i) })} />}
              </div>
            </div>
          )
        })}
      </Sekcija>

      <Sekcija naslov="Osoblje i PIN-ovi" dodaj={() => promijeni({ osoblje: [...s.osoblje, { red: null, ime: '', uloga: 'frizer', lokacija: naziviLok[0] || '', imaPin: false, pin: '', email: '', aktivan: true }] })} dodajTekst="Dodaj osobu">
        {s.osoblje.map((o, i) => {
          const izmijeni = (n: Partial<OsobaPod>) => promijeni({ osoblje: s.osoblje.map((x, j) => (j === i ? { ...x, ...n } : x)) })
          const bezPina = !o.imaPin && !o.pin
          return (
            <div key={i} className="rounded-2xl border-2 border-grass-tint p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Polje oznaka="Ime"><input className={inp} value={o.ime} onChange={(e) => izmijeni({ ime: e.target.value })} /></Polje>
                <Polje oznaka="Uloga">
                  <select className={inp} value={o.uloga} onChange={(e) => izmijeni({ uloga: e.target.value as Uloga })}>
                    {ULOGE.map((u) => <option key={u.v} value={u.v}>{u.naziv}</option>)}
                  </select>
                </Polje>
                <Polje oznaka="Lokacija">
                  <Izbor vrijednost={o.lokacija} opcije={naziviLok} prazno="Sve lokacije" onChange={(v) => izmijeni({ lokacija: v })} disabled={o.uloga === 'vlasnik'} />
                </Polje>
                <Polje oznaka={o.imaPin ? 'Novi PIN (prazno = ostaje stari)' : 'PIN (6-8 cifara)'}>
                  <input className={inp} type="password" inputMode="numeric" autoComplete="new-password" maxLength={8} value={o.pin || ''}
                    placeholder={o.imaPin ? '••••••' : '6 cifara'} onChange={(e) => izmijeni({ pin: e.target.value.replace(/\D/g, '') })} />
                </Polje>
                <Polje oznaka="Email (sedmični izvještaj)"><input className={inp} type="email" value={o.email} onChange={(e) => izmijeni({ email: e.target.value })} /></Polje>
                <div className="flex items-end gap-2 pb-2">
                  <Prekidac ukljucen={o.aktivan} onChange={(v) => izmijeni({ aktivan: v })} />
                  {o.red === null && <Ukloni onClick={() => promijeni({ osoblje: s.osoblje.filter((_, j) => j !== i) })} />}
                </div>
              </div>
              {bezPina && o.aktivan && <p className="mt-1 text-xs text-coral">Bez PIN-a: ne može u panel dok ne upišete PIN.</p>}
            </div>
          )
        })}
        <p className="text-xs text-ink/50">Frizer vidi dan i upisuje termine. Admin vidi i izvještaje. Vlasnik vidi sve i mijenja podešavanja. Svako ima svoj PIN od 6 do 8 cifara; posle 10 pogrešnih pokušaja prijava se zaključa na 15 minuta, a vlasnik dobija email.</p>
      </Sekcija>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-grass-tint bg-white/95 p-3 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1 text-sm">
            {info && <p className="flex items-center gap-1.5 font-bold text-grass-deep"><Check className="h-4 w-4 shrink-0" /> {info}</p>}
            {greske.length > 0 && (
              <ul className="max-h-24 list-disc overflow-y-auto pl-5 text-ink">{greske.map((g) => <li key={g}>{g}</li>)}</ul>
            )}
          </div>
          <button onClick={sacuvaj} disabled={salje} className="flex shrink-0 items-center gap-2 rounded-full bg-coral px-6 py-3 font-bold text-white disabled:opacity-50">
            {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Sačuvaj
          </button>
        </div>
      </div>
    </div>
  )
}

function Sekcija({ naslov, children, dodaj, dodajTekst }: { naslov: string; children: ReactNode; dodaj: () => void; dodajTekst: string }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow">
      <h2 className="mb-3 font-display text-xl font-extrabold text-ink">{naslov}</h2>
      <div className="grid gap-3">{children}</div>
      <button type="button" onClick={dodaj} className="mt-3 flex items-center gap-1.5 rounded-full bg-grass-tint px-4 py-2 text-sm font-bold text-grass-deep">
        <Plus className="h-4 w-4" /> {dodajTekst}
      </button>
    </section>
  )
}

function Polje({ oznaka, children }: { oznaka: string; children: ReactNode }) {
  return <label className="grid gap-1 text-xs font-bold text-ink/60">{oznaka}{children}</label>
}

function Izbor({ vrijednost, opcije, onChange, prazno, disabled }: {
  vrijednost: string; opcije: string[]; onChange: (v: string) => void; prazno?: string; disabled?: boolean
}) {
  const sve = vrijednost && !opcije.includes(vrijednost) ? [...opcije, vrijednost] : opcije
  return (
    <select className={inp} value={disabled ? '' : vrijednost} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {(prazno || disabled) && <option value="">{prazno || 'Sve lokacije'}</option>}
      {!prazno && !vrijednost && !disabled && <option value="">Izaberite...</option>}
      {sve.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Prekidac({ ukljucen, onChange, da = 'Aktivan', ne = 'Ne radi' }: {
  ukljucen: boolean; onChange: (v: boolean) => void; da?: string; ne?: string
}) {
  return (
    <button type="button" role="switch" aria-checked={ukljucen} onClick={() => onChange(!ukljucen)}
      className={'flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-bold ' + (ukljucen ? 'bg-grass text-white' : 'bg-ink/10 text-ink/60')}>
      {ukljucen ? da : ne}
    </button>
  )
}

function Ukloni({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full p-2 text-coral hover:bg-coral/10" aria-label="Ukloni">
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
