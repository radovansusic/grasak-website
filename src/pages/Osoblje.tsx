import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  BarChart3, Ban, CalendarDays, Check, ChevronLeft, ChevronRight, Download, Loader2, LogOut,
  MessageSquarePlus, Phone, Plus, Printer, RefreshCw, Settings, UserX, X,
} from 'lucide-react'
import PodesavanjaPanel from '@/components/osoblje/PodesavanjaPanel'
import { API_URL, isoDatum } from '@/lib/zakazivanje'
import {
  osoblje,
  type DanOsoblje, type Izvjestaj, type KonfigOsoblje, type OsobaDan, type Profil, type TerminOsoblje,
} from '@/lib/osoblje'

const PIN_KLJUC = 'grasak-osoblje-pin'
const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota']
const inputCls = 'w-full rounded-xl border-2 border-grass-tint bg-white px-3 py-2.5 text-ink outline-none focus:border-grass'

function citajPin(): string {
  try { return localStorage.getItem(PIN_KLJUC) || '' } catch { return '' }
}
function pisiPin(pin: string) {
  try { if (pin) localStorage.setItem(PIN_KLJUC, pin); else localStorage.removeItem(PIN_KLJUC) } catch { /* privatni režim */ }
}
function pomjeri(iso: string, n: number): string {
  const [g, m, d] = iso.split('-').map(Number)
  return isoDatum(new Date(g, m - 1, d + n))
}
function lijepDatum(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number)
  const dt = new Date(g, m - 1, d)
  return `${DANI[dt.getDay()]}, ${d}.${m}.`
}

/** Stranica za osoblje: grasaksalon.me/osoblje. Instalira se kao posebna aplikacija "Grašak osoblje". */
export default function Osoblje() {
  const [pin, setPin] = useState(citajPin)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [konfig, setKonfig] = useState<KonfigOsoblje | null>(null)
  const [greska, setGreska] = useState('')
  const [tab, setTab] = useState<'dan' | 'izvjestaj' | 'podesavanja'>('dan')

  useEffect(() => {
    document.title = 'Grašak osoblje'
    const link = document.querySelector('link[rel="manifest"]')
    const stari = link?.getAttribute('href')
    link?.setAttribute('href', '/osoblje.webmanifest')
    let robots = document.querySelector('meta[name="robots"]')
    const dodat = !robots
    if (!robots) { robots = document.createElement('meta'); robots.setAttribute('name', 'robots'); document.head.appendChild(robots) }
    robots.setAttribute('content', 'noindex, nofollow')
    return () => { if (stari) link?.setAttribute('href', stari); if (dodat) robots?.remove() }
  }, [])

  const prijavi = useCallback((p: string, jeAktivno: () => boolean = () => true) =>
    osoblje<{ osoba: Profil; konfig: KonfigOsoblje }>('prijava', p)
      .then((r) => {
        if (!jeAktivno()) return
        if (!r.ok) { setGreska(r.poruka || 'Prijava nije uspjela.'); pisiPin(''); setPin(''); return }
        pisiPin(p); setPin(p); setProfil(r.osoba); setKonfig(r.konfig)
      })
      .catch(() => { if (jeAktivno()) setGreska('Nema veze sa serverom. Provjerite internet.') }), [])

  // zapamćen PIN na ovom telefonu: prijava bez kucanja
  useEffect(() => {
    if (!pin || profil || !API_URL) return
    let aktivno = true
    void prijavi(pin, () => aktivno)
    return () => { aktivno = false }
  }, [pin, profil, prijavi])

  const odjava = () => { pisiPin(''); setPin(''); setProfil(null); setKonfig(null); setTab('dan') }

  if (!API_URL) {
    return <Okvir><p className="rounded-2xl bg-white p-6 text-ink">Panel još nije povezan s Google tabelom (nedostaje VITE_ZAKAZIVANJE_API).</p></Okvir>
  }
  if (!profil || !konfig) {
    return <Okvir><Prijava cekam={!!pin && !greska} greska={greska} onPrijava={(p) => { setGreska(''); return prijavi(p) }} /></Okvir>
  }
  const admin = profil.uloga !== 'frizer'
  const vlasnik = profil.uloga === 'vlasnik'
  // poslije izmjene podešavanja: nova lista frizera, usluga i lokacija za pregled dana
  const osvjeziKonfig = () => {
    osoblje<{ konfig: KonfigOsoblje }>('prijava', pin).then((r) => { if (r.ok) setKonfig(r.konfig) }).catch(() => {})
  }
  return (
    <Okvir
      desno={
        <button onClick={odjava} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">
          <LogOut className="h-4 w-4" /> Odjava
        </button>
      }
      podnaslov={`${profil.ime} · ${profil.uloga}`}
    >
      {admin && (
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <Tab aktivan={tab === 'dan'} onClick={() => setTab('dan')}><CalendarDays className="h-4 w-4" /> Dan</Tab>
          <Tab aktivan={tab === 'izvjestaj'} onClick={() => setTab('izvjestaj')}><BarChart3 className="h-4 w-4" /> Izvještaj</Tab>
          {vlasnik && <Tab aktivan={tab === 'podesavanja'} onClick={() => setTab('podesavanja')}><Settings className="h-4 w-4" /> Podešavanja</Tab>}
        </div>
      )}
      {tab === 'dan' || !admin ? <DanPanel pin={pin} konfig={konfig} profil={profil} />
        : tab === 'izvjestaj' ? <IzvjestajPanel pin={pin} konfig={konfig} />
          : vlasnik ? <PodesavanjaPanel pin={pin} onSacuvano={osvjeziKonfig} onOdjava={odjava} /> : null}
    </Okvir>
  )
}

function Okvir({ children, desno, podnaslov }: { children: ReactNode; desno?: ReactNode; podnaslov?: string }) {
  return (
    <div className="min-h-screen bg-grass-tint/50 pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-grass-darkest px-4 py-3 text-white shadow-md print:static print:bg-white print:text-ink print:shadow-none">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <img src="/brand/grasak-znak.svg" alt="" className="h-10 w-10 rounded-full bg-white p-0.5" />
          <div className="flex-1 leading-tight">
            <div className="font-display text-lg font-extrabold">Grašak osoblje</div>
            {podnaslov && <div className="text-xs opacity-80">{podnaslov}</div>}
          </div>
          {desno}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 pt-4 sm:px-4">{children}</main>
    </div>
  )
}

function Tab({ aktivan, onClick, children }: { aktivan: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ' +
      (aktivan ? 'bg-grass text-white' : 'bg-white text-ink')}>
      {children}
    </button>
  )
}

function Prijava({ onPrijava, greska, cekam }: { onPrijava: (pin: string) => Promise<void>; greska: string; cekam: boolean }) {
  const [unos, setUnos] = useState('')
  const [salje, setSalje] = useState(false)
  const posalji = async (e: FormEvent) => {
    e.preventDefault()
    setSalje(true)
    await onPrijava(unos.trim())
    setSalje(false)
  }
  return (
    <form onSubmit={posalji} className="mx-auto mt-10 max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl shadow-ink/10">
      <img src="/brand/grasak-logo-zuta.svg" alt="Grašak" className="mx-auto h-28 w-28" />
      <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">Prijava za osoblje</h1>
      <p className="mt-1 text-sm text-ink/60">Upišite svoj PIN (6 do 8 cifara).</p>
      <input value={unos} onChange={(e) => setUnos(e.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="one-time-code"
        type="password" maxLength={8} placeholder="PIN" autoFocus
        className="mt-4 w-full rounded-2xl border-2 border-grass-tint px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink outline-none focus:border-grass" />
      {greska && <p className="mt-3 rounded-xl bg-coral/10 p-2 text-sm text-ink">{greska}</p>}
      <button disabled={unos.length < 6 || salje || cekam}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-grass py-3 font-bold text-white disabled:opacity-50">
        {(salje || cekam) && <Loader2 className="h-5 w-5 animate-spin" />} Uđi
      </button>
    </form>
  )
}

/* ---------------- DAN ---------------- */

type Izbor = { tip: 'novi'; osoba: string; vrijeme: string } | { tip: 'termin'; osoba: string; termin: TerminOsoblje }

function DanPanel({ pin, konfig, profil }: { pin: string; konfig: KonfigOsoblje; profil: Profil }) {
  const [lokId, setLokId] = useState(konfig.lokacije[0]?.id || '')
  const [datum, setDatum] = useState(() => isoDatum(new Date()))
  const [dan, setDan] = useState<DanOsoblje | null>(null)
  const [ucitava, setUcitava] = useState(false)
  const [poruka, setPoruka] = useState('')   // greška učitavanja
  const [info, setInfo] = useState('')       // potvrda poslije upisa ili izmjene
  const [izbor, setIzbor] = useState<Izbor | null>(null)
  const [osvjezi, setOsvjezi] = useState(0)

  useEffect(() => {
    if (!lokId) return
    let aktivno = true
    const ucitaj = () => {
      setUcitava(true)
      osoblje<{ dan: DanOsoblje }>('dan', pin, { lok: lokId, datum })
        .then((r) => { if (!aktivno) return; if (r.ok) { setDan(r.dan); setPoruka('') } else setPoruka(r.poruka || 'Greška') })
        .catch(() => { if (aktivno) setPoruka('Nema veze sa serverom.') })
        .finally(() => { if (aktivno) setUcitava(false) })
    }
    ucitaj()
    const t = setInterval(() => { if (document.visibilityState === 'visible') ucitaj() }, 60000)
    return () => { aktivno = false; clearInterval(t) }
  }, [pin, lokId, datum, osvjezi])

  const prikaz = dan && dan.datum === datum && dan.lokacija === lokId ? dan : null
  const vremena = useMemo(() => {
    if (!prikaz) return []
    const s = new Set<string>()
    prikaz.osobe.forEach((o) => o.slotovi.forEach((x) => s.add(x.vrijeme)))
    return [...s].sort()
  }, [prikaz])
  // frizer vidi sebe prvog
  const osobe = useMemo(() => {
    if (!prikaz) return []
    return [...prikaz.osobe].sort((a, b) => (a.ime === profil.ime ? -1 : b.ime === profil.ime ? 1 : 0))
  }, [prikaz, profil.ime])

  const gotovo = (tekst: string) => {
    setIzbor(null); setInfo(tekst); setOsvjezi((x) => x + 1)
    window.setTimeout(() => setInfo((x) => (x === tekst ? '' : x)), 6000)
  }
  const danas = isoDatum(new Date())

  return (
    <div>
      {konfig.lokacije.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {konfig.lokacije.map((l) => (
            <Tab key={l.id} aktivan={l.id === lokId} onClick={() => setLokId(l.id)}>{l.naziv}</Tab>
          ))}
        </div>
      )}
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setDatum(pomjeri(datum, -1))} className="rounded-full bg-white p-2.5 shadow" aria-label="Prethodni dan"><ChevronLeft className="h-5 w-5" /></button>
        <label className="relative flex-1 rounded-2xl bg-white px-3 py-2 text-center shadow">
          <span className="block font-display text-lg font-extrabold capitalize text-ink">{lijepDatum(datum)}</span>
          <span className="block text-xs text-ink/50">{datum === danas ? 'danas' : 'promijeni datum'}</span>
          <input type="date" value={datum} onChange={(e) => e.target.value && setDatum(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0" aria-label="Izaberi datum" />
        </label>
        <button onClick={() => setDatum(pomjeri(datum, 1))} className="rounded-full bg-white p-2.5 shadow" aria-label="Sljedeći dan"><ChevronRight className="h-5 w-5" /></button>
        <button onClick={() => setOsvjezi((x) => x + 1)} className="rounded-full bg-white p-2.5 shadow" aria-label="Osvježi">
          <RefreshCw className={'h-5 w-5 ' + (ucitava ? 'animate-spin' : '')} />
        </button>
      </div>
      {datum !== danas && (
        <button onClick={() => setDatum(danas)} className="mb-3 text-sm font-bold text-grass-deep underline">Nazad na danas</button>
      )}
      {info && <p className="mb-3 flex items-center gap-2 rounded-xl bg-grass p-3 text-sm font-bold text-white shadow"><Check className="h-4 w-4" /> {info}</p>}
      {poruka && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{poruka}</p>}

      {prikaz?.neradni && (
        <p className="mb-3 rounded-xl bg-sun p-3 text-sm font-bold text-ink shadow">Neradni dan: {prikaz.neradni}. Sajt ne nudi termine za ovaj dan.</p>
      )}
      {!prikaz ? (
        <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam...</p>
      ) : !vremena.length ? (
        <p className="rounded-2xl bg-white p-6 text-center text-ink/70 shadow">{prikaz.neradni ? `Neradni dan: ${prikaz.neradni}.` : 'Salon ne radi ovog dana.'}</p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {osobe.map((o) => <Popunjenost key={o.ime} o={o} />)}
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white shadow">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-14 bg-white p-2 text-left text-xs text-ink/50">Vrijeme</th>
                  {osobe.map((o) => <th key={o.ime} className="min-w-[140px] p-2 text-left font-display text-base text-ink">{o.ime}</th>)}
                </tr>
              </thead>
              <tbody>
                {vremena.map((v) => (
                  <tr key={v} className="border-t border-grass-tint">
                    <td className="sticky left-0 z-10 bg-white p-2 align-top font-bold text-ink/70">{v}</td>
                    {osobe.map((o) => <Celija key={o.ime} o={o} vrijeme={v} proslo={datum < danas || (datum === danas && proslo(v))} onIzbor={setIzbor} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-ink/50">Klik na "slobodno" upisuje termin (npr. kad neko zove). Klik na termin: telefon, napomena, nije došao, otkaži.</p>
        </>
      )}

      {izbor?.tip === 'novi' && (
        <NoviTermin pin={pin} konfig={konfig} lokId={lokId} datum={datum} osoba={izbor.osoba} vrijeme={izbor.vrijeme}
          onZatvori={() => setIzbor(null)} onGotovo={gotovo} />
      )}
      {izbor?.tip === 'termin' && (
        <DetaljiTermina pin={pin} osoba={izbor.osoba} t={izbor.termin} onZatvori={() => setIzbor(null)} onGotovo={gotovo} />
      )}
    </div>
  )
}

function Popunjenost({ o }: { o: OsobaDan }) {
  const p = o.popunjeno
  const aktivnih = o.termini.length
  return (
    <div className="rounded-2xl bg-white p-3 shadow">
      <div className="flex items-baseline justify-between">
        <span className="font-display font-extrabold text-ink">{o.ime}</span>
        <span className="text-sm font-bold text-grass-deep">{p.kapacitet ? p.procenat + '%' : '-'}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-grass-tint">
        <div className="h-full rounded-full bg-grass" style={{ width: Math.min(100, p.procenat) + '%' }} />
      </div>
      <div className="mt-1 text-xs text-ink/60">{aktivnih} {aktivnih === 1 ? 'termin' : 'termina'} · slobodno {Math.max(0, p.kapacitet - p.zauzeto) / 60} h</div>
    </div>
  )
}

/** Polje od pola sata je prošlo kad mu je kraj prije trenutnog vremena. */
function proslo(vrijeme: string): boolean {
  const [h, m] = vrijeme.split(':').map(Number)
  const sada = new Date()
  return h * 60 + m + 30 <= sada.getHours() * 60 + sada.getMinutes()
}

function Celija({ o, vrijeme, proslo, onIzbor }: { o: OsobaDan; vrijeme: string; proslo: boolean; onIzbor: (i: Izbor) => void }) {
  const s = o.slotovi.find((x) => x.vrijeme === vrijeme)
  if (!s || s.stanje === 'van') return <td className="bg-ink/[0.03] p-1" />
  if (s.stanje === 'blokada') return <td className="p-1"><div className="rounded-lg bg-ink/10 px-2 py-2 text-xs font-bold text-ink/60">{s.naziv || 'Pauza'}</div></td>
  if (s.stanje === 'nastavak') return <td className="p-1"><div className="h-9 rounded-lg bg-grass/15" /></td>
  if (s.stanje === 'slobodno') {
    return (
      <td className="p-1">
        <button onClick={() => onIzbor({ tip: 'novi', osoba: o.ime, vrijeme })}
          className={'flex w-full items-center gap-1 rounded-lg border-2 border-dashed px-2 py-2 text-xs font-bold hover:bg-grass-tint ' +
            (proslo ? 'border-ink/10 text-ink/30' : 'border-grass/40 text-grass-deep')}>
          <Plus className="h-3.5 w-3.5" /> {proslo ? 'prošlo' : 'slobodno'}
        </button>
      </td>
    )
  }
  return (
    <td className="p-1">
      <div className="grid gap-1">
        {(s.termini || []).map((i) => {
          const t = o.termini[i]
          const nijeDosao = t.status === 'nije_dosao'
          return (
            <button key={t.id} onClick={() => onIzbor({ tip: 'termin', osoba: o.ime, termin: t })}
              className={'w-full rounded-lg px-2 py-1.5 text-left ' + (nijeDosao ? 'bg-coral/20 text-ink line-through' : 'bg-grass text-white')}>
              <span className="block truncate text-sm font-bold">{t.dijete || 'bez imena'}</span>
              <span className="block truncate text-[11px] opacity-90">{t.usluga} · {t.od}-{t.do}</span>
            </button>
          )
        })}
      </div>
    </td>
  )
}

function Prozor({ naslov, onZatvori, children }: { naslov: string; onZatvori: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={onZatvori}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold text-ink">{naslov}</h2>
          <button onClick={onZatvori} className="rounded-full bg-grass-tint p-1.5" aria-label="Zatvori"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function NoviTermin({ pin, konfig, lokId, datum, osoba, vrijeme, onZatvori, onGotovo }: {
  pin: string; konfig: KonfigOsoblje; lokId: string; datum: string; osoba: string; vrijeme: string
  onZatvori: () => void; onGotovo: (t: string) => void
}) {
  const [usluga, setUsluga] = useState(konfig.usluge[0]?.id || '')
  const [salje, setSalje] = useState(false)
  const [greska, setGreska] = useState('')
  const posalji = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setSalje(true); setGreska('')
    try {
      const r = await osoblje('zakazi', pin, {
        lok: lokId, osoba, usluga, datum, vrijeme,
        dijete: f.get('dijete'), telefon: f.get('telefon'), roditelj: f.get('roditelj'), napomena: f.get('napomena'),
      })
      if (r.ok) onGotovo(r.poruka || 'Upisano.')
      else setGreska(r.poruka || 'Nije upisano.')
    } catch {
      setGreska('Nema veze sa serverom.')
    } finally {
      setSalje(false)
    }
  }
  return (
    <Prozor naslov={`Novi termin · ${osoba} · ${vrijeme}`} onZatvori={onZatvori}>
      <p className="-mt-2 mb-3 text-sm capitalize text-ink/60">{lijepDatum(datum)}</p>
      <form onSubmit={posalji} className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {konfig.usluge.map((u) => (
            <button key={u.id} type="button" onClick={() => setUsluga(u.id)}
              className={'rounded-full border-2 px-3 py-1.5 text-sm font-bold ' + (usluga === u.id ? 'border-grass bg-grass text-white' : 'border-grass-tint text-ink')}>
              {u.naziv}{u.trajanje > konfig.korak ? ` (${u.trajanje} min)` : ''}
            </button>
          ))}
        </div>
        <input name="dijete" required maxLength={60} placeholder="Ime djeteta *" className={inputCls} autoFocus />
        <input name="telefon" type="tel" inputMode="tel" placeholder="Telefon roditelja (za SMS potvrdu)" className={inputCls} />
        <input name="roditelj" maxLength={60} placeholder="Ime roditelja" className={inputCls} />
        <textarea name="napomena" maxLength={300} rows={2} placeholder="Napomena / dodatak" className={inputCls} />
        {greska && <p className="rounded-xl bg-coral/10 p-2 text-sm text-ink">{greska}</p>}
        <button disabled={salje || !usluga} className="flex items-center justify-center gap-2 rounded-full bg-coral py-3 font-bold text-white disabled:opacity-50">
          {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Upiši termin
        </button>
      </form>
    </Prozor>
  )
}

function DetaljiTermina({ pin, osoba, t, onZatvori, onGotovo }: {
  pin: string; osoba: string; t: TerminOsoblje; onZatvori: () => void; onGotovo: (t: string) => void
}) {
  const [radi, setRadi] = useState('')
  const [greska, setGreska] = useState('')
  const [tekst, setTekst] = useState('')
  const akcija = async (ime: string, podaci: Record<string, unknown>) => {
    setRadi(ime); setGreska('')
    try {
      const r = await osoblje(ime, pin, { id: t.id, ...podaci })
      if (r.ok) onGotovo(r.poruka || 'Sačuvano.')
      else setGreska(r.poruka || 'Nije uspjelo.')
    } catch {
      setGreska('Nema veze sa serverom.')
    } finally {
      setRadi('')
    }
  }
  const red = (k: string, v: ReactNode) => v ? <div className="flex gap-3 border-b border-grass-tint py-1.5 text-sm"><span className="w-24 shrink-0 text-ink/50">{k}</span><span className="text-ink">{v}</span></div> : null
  const izvor = t.izvor === 'sajt' ? 'sajt (roditelj)' : t.izvor.startsWith('telefon') ? 'upisalo osoblje: ' + t.izvor.replace(/^telefon - /, '') : 'Google kalendar'
  return (
    <Prozor naslov={t.dijete || 'Termin'} onZatvori={onZatvori}>
      <div className="mb-4">
        {red('Vrijeme', `${t.od} - ${t.do} · ${osoba}`)}
        {red('Usluga', t.usluga)}
        {red('Uzrast', t.uzrast && t.uzrast + ' god.')}
        {red('Roditelj', t.roditelj)}
        {red('Telefon', t.telefon && <a href={'tel:' + t.telefon} className="inline-flex items-center gap-1 font-bold text-grass-deep"><Phone className="h-4 w-4" /> {t.telefon}</a>)}
        {red('Napomena', t.napomena)}
        {red('Zakazano', izvor)}
        {red('Status', t.status === 'nije_dosao' ? 'nije došao' : 'zakazan')}
      </div>
      <div className="flex gap-2">
        <input value={tekst} onChange={(e) => setTekst(e.target.value)} maxLength={200} placeholder="Dopiši napomenu..." className={inputCls} />
        <button disabled={!tekst.trim() || !!radi} onClick={() => akcija('napomena', { tekst })}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-grass px-3 font-bold text-white disabled:opacity-40" aria-label="Dopiši">
          {radi === 'napomena' ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquarePlus className="h-5 w-5" />}
        </button>
      </div>
      {greska && <p className="mt-3 rounded-xl bg-coral/10 p-2 text-sm text-ink">{greska}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {t.status === 'nije_dosao' ? (
          <button disabled={!!radi} onClick={() => akcija('status', { status: 'zakazan' })}
            className="flex items-center justify-center gap-1.5 rounded-full bg-grass-tint py-3 text-sm font-bold text-ink">
            <Check className="h-4 w-4" /> Ipak je došao
          </button>
        ) : (
          <button disabled={!!radi} onClick={() => akcija('status', { status: 'nije_dosao' })}
            className="flex items-center justify-center gap-1.5 rounded-full bg-sun py-3 text-sm font-bold text-ink">
            <UserX className="h-4 w-4" /> Nije došao
          </button>
        )}
        <button disabled={!!radi}
          onClick={() => { if (window.confirm('Otkazati termin? Vrijeme postaje slobodno za druge.')) void akcija('status', { status: 'otkazan' }) }}
          className="flex items-center justify-center gap-1.5 rounded-full bg-coral py-3 text-sm font-bold text-white">
          {radi === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Otkaži
        </button>
      </div>
    </Prozor>
  )
}

/* ---------------- IZVJEŠTAJ ---------------- */

function periodi() {
  const d = new Date()
  const iso = isoDatum
  const pon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7))
  const dodaj = (x: Date, n: number) => new Date(x.getFullYear(), x.getMonth(), x.getDate() + n)
  return [
    { naziv: 'Danas', od: iso(d), do: iso(d) },
    { naziv: 'Ova sedmica', od: iso(pon), do: iso(dodaj(pon, 6)) },
    { naziv: 'Prošla sedmica', od: iso(dodaj(pon, -7)), do: iso(dodaj(pon, -1)) },
    { naziv: 'Ovaj mjesec', od: iso(new Date(d.getFullYear(), d.getMonth(), 1)), do: iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)) },
    { naziv: 'Prošli mjesec', od: iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), do: iso(new Date(d.getFullYear(), d.getMonth(), 0)) },
  ]
}

function IzvjestajPanel({ pin, konfig }: { pin: string; konfig: KonfigOsoblje }) {
  const p = useMemo(() => periodi(), [])
  const [od, setOd] = useState(p[1].od)
  const [doD, setDoD] = useState(p[1].do)
  const [lok, setLok] = useState('')
  const [iz, setIz] = useState<Izvjestaj | null>(null)
  // stanje zadnjeg odgovora; dok se ne poklopi s izabranim periodom, izvještaj se učitava
  const kljuc = [od, doD, lok].join('|')
  const [stanje, setStanje] = useState({ kljuc: '', greska: '' })
  const ucitava = stanje.kljuc !== kljuc
  const greska = ucitava ? '' : stanje.greska

  useEffect(() => {
    let aktivno = true
    osoblje<{ izvjestaj: Izvjestaj }>('izvjestaj', pin, { od, do: doD, lok })
      .then((r) => {
        if (!aktivno) return
        if (r.ok) setIz(r.izvjestaj)
        setStanje({ kljuc, greska: r.ok ? '' : r.poruka || 'Greška' })
      })
      .catch(() => { if (aktivno) setStanje({ kljuc, greska: 'Nema veze sa serverom.' }) })
    return () => { aktivno = false }
  }, [pin, od, doD, lok, kljuc])

  const csv = () => {
    if (!iz) return
    const redovi: (string | number)[][] = [
      ['Grašak - izvještaj', iz.naslov], [],
      ['Ukupno', 'Termini', 'Došli', 'Nije došao', 'Otkazano', 'Predstoji', 'Popunjenost %', 'Klijenata', 'Novih'],
      ['', iz.ukupno.termini, iz.ukupno.dosli, iz.ukupno.nijeDosao, iz.ukupno.otkazano, iz.ukupno.predstoji, iz.ukupno.popunjenost, iz.klijenti.ukupno, iz.klijenti.novi],
      [], ['Frizer', 'Termini', 'Došli', 'Nije došao', 'Otkazano', 'Predstoji', 'Popunjenost %'],
      ...iz.poFrizeru.map((f) => [f.ime, f.termini, f.dosli, f.nijeDosao, f.otkazano, f.predstoji, f.popunjenost]),
      [], ['Usluga', 'Broj'], ...iz.poUsluzi.map((u) => [u.naziv, u.broj]),
      [], ['Odakle', 'Broj'], ...iz.poIzvoru.map((u) => [u.naziv, u.broj]),
      [], ['Dan', 'Broj'], ...iz.poDanu.map((u) => [u.dan, u.broj]),
    ]
    const tekst = '﻿' + redovi.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([tekst], { type: 'text/csv;charset=utf-8' }))
    a.download = `grasak-izvjestaj-${iz.od}-${iz.do}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const max = (xs: { broj: number }[]) => Math.max(1, ...xs.map((x) => x.broj))
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2 print:hidden">
        {p.map((x) => <Tab key={x.naziv} aktivan={x.od === od && x.do === doD} onClick={() => { setOd(x.od); setDoD(x.do) }}>{x.naziv}</Tab>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <input type="date" value={od} onChange={(e) => e.target.value && setOd(e.target.value)} className="rounded-xl border-2 border-grass-tint bg-white px-2 py-1.5" aria-label="Od" />
        <span>-</span>
        <input type="date" value={doD} onChange={(e) => e.target.value && setDoD(e.target.value)} className="rounded-xl border-2 border-grass-tint bg-white px-2 py-1.5" aria-label="Do" />
        {konfig.lokacije.length > 1 && (
          <select value={lok} onChange={(e) => setLok(e.target.value)} className="rounded-xl border-2 border-grass-tint bg-white px-2 py-1.5">
            <option value="">Sve lokacije</option>
            {konfig.lokacije.map((l) => <option key={l.id} value={l.id}>{l.naziv}</option>)}
          </select>
        )}
        <button onClick={csv} disabled={!iz} className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold shadow"><Download className="h-4 w-4" /> CSV</button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold shadow"><Printer className="h-4 w-4" /> Štampa / PDF</button>
      </div>
      {greska && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-ink">{greska}</p>}
      {!iz ? (
        <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Pravim izvještaj...</p>
      ) : (
        <div className={ucitava ? 'opacity-50' : ''}>
          <h2 className="mb-3 font-display text-2xl font-extrabold text-ink">Izvještaj {iz.naslov}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Kartica naziv="Dolazaka" broj={iz.ukupno.dosli} istaknuto />
            <Kartica naziv="Predstoji" broj={iz.ukupno.predstoji} />
            <Kartica naziv="Nije došlo" broj={iz.ukupno.nijeDosao} />
            <Kartica naziv="Otkazano" broj={iz.ukupno.otkazano} />
            <Kartica naziv="Popunjenost" broj={iz.ukupno.popunjenost + '%'} istaknuto />
            <Kartica naziv="Klijenata (novih)" broj={`${iz.klijenti.ukupno} (${iz.klijenti.novi})`} />
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl bg-white p-3 shadow">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-ink/50">
                <th className="p-2">Frizer</th><th className="p-2">Termini</th><th className="p-2">Došli</th><th className="p-2">Nije došao</th>
                <th className="p-2">Otkazano</th><th className="p-2">Popunjenost</th>
              </tr></thead>
              <tbody>
                {iz.poFrizeru.map((f) => (
                  <tr key={f.ime} className="border-t border-grass-tint">
                    <td className="p-2 font-bold">{f.ime}</td><td className="p-2">{f.termini}</td><td className="p-2">{f.dosli}</td>
                    <td className="p-2">{f.nijeDosao}</td><td className="p-2">{f.otkazano}</td>
                    <td className="p-2"><div className="flex items-center gap-2"><div className="h-2 w-16 rounded-full bg-grass-tint"><div className="h-full rounded-full bg-grass" style={{ width: Math.min(100, f.popunjenost) + '%' }} /></div>{f.popunjenost}%</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Trake naslov="Usluge" stavke={iz.poUsluzi} max={max(iz.poUsluzi)} />
            <Trake naslov="Odakle termini" stavke={iz.poIzvoru} max={max(iz.poIzvoru)} />
            <Trake naslov="Po danima" stavke={iz.poDanu.map((d) => ({ naziv: d.dan, broj: d.broj }))} max={max(iz.poDanu)} />
          </div>
          <p className="mt-3 text-xs text-ink/50">Dolazak = prošao termin koji nije označen kao "nije došao" ni otkazan. Popunjenost = zauzeto vrijeme / radno vrijeme frizera (bez pauza i odmora). Sedmični izvještaj stiže svakog ponedjeljka na email iz lista Osoblje.</p>
        </div>
      )}
    </div>
  )
}

function Kartica({ naziv, broj, istaknuto }: { naziv: string; broj: number | string; istaknuto?: boolean }) {
  return (
    <div className={'rounded-2xl p-3 shadow ' + (istaknuto ? 'bg-grass text-white' : 'bg-white text-ink')}>
      <div className="text-xs opacity-80">{naziv}</div>
      <div className="font-display text-2xl font-extrabold">{broj}</div>
    </div>
  )
}

function Trake({ naslov, stavke, max }: { naslov: string; stavke: { naziv: string; broj: number }[]; max: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow">
      <h3 className="mb-2 font-display font-extrabold text-ink">{naslov}</h3>
      {!stavke.length && <p className="text-sm text-ink/50">Nema podataka.</p>}
      {stavke.map((s) => (
        <div key={s.naziv} className="mb-1.5">
          <div className="flex justify-between text-sm"><span className="capitalize">{s.naziv}</span><span className="font-bold">{s.broj}</span></div>
          <div className="h-2 rounded-full bg-grass-tint"><div className="h-full rounded-full bg-sun" style={{ width: (100 * s.broj) / max + '%' }} /></div>
        </div>
      ))}
    </div>
  )
}
