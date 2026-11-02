import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Ban, CalendarCheck, Check, History, Loader2, LogIn, LogOut, UserPlus } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'
import {
  citajMoj, citajPrefill, mojOtkazi, mojPregled, mojSacuvaj, pisiMoj, prijava, registracija,
  type MojNalog, type MojTermin, type MojaPosjeta, type ProfilRoditelja,
} from '@/lib/moj'

const inputCls = 'w-full rounded-2xl border-2 border-grass-tint bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-grass'
const kutija = 'rounded-3xl bg-white p-6 shadow-xl shadow-ink/10 sm:p-8'

function datumTekst(iso: string, lang: string): string {
  const [g, m, d] = iso.split('-').map(Number)
  const dt = new Date(g, m - 1, d)
  const lokal = lang === 'en' ? 'en-GB' : lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'sr-Latn-ME'
  try { return new Intl.DateTimeFormat(lokal, { weekday: 'long', day: 'numeric', month: 'long' }).format(dt) } catch { return `${d}.${m}.${g}.` }
}

/** Moj Grašak: nalog roditelja. Telefon + PIN, bez lozinki. Termini, otkazivanje, podaci, brže zakazivanje. */
export default function MojGrasak() {
  const { tr } = useLang()
  const [nalog, setNalog] = useState<MojNalog | null>(citajMoj)
  useEffect(() => { document.title = tr('moj.title') + ' | Grašak' }, [tr])
  const ulaz = (n: MojNalog) => { pisiMoj(n); setNalog(n) }
  const odjava = () => { pisiMoj(null); setNalog(null) }
  return (
    <div className="bg-grass-tint/40 pb-20 pt-32">
      <div className="mx-auto max-w-3xl px-4">
        <img src="/brand/grasak-logo-zuta.svg" alt="Grašak" className="mb-4 h-28 w-28" />
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">{tr('moj.title')}</h1>
        <p className="mt-2 text-lg text-ink/70">{tr('moj.sub')}</p>
        <div className="mt-8">
          {nalog ? <Nalog nalog={nalog} onIzmjena={ulaz} onOdjava={odjava} /> : <Ulaz onUlaz={ulaz} />}
        </div>
      </div>
    </div>
  )
}

function Ulaz({ onUlaz }: { onUlaz: (n: MojNalog) => void }) {
  const { tr } = useLang()
  const [params] = useSearchParams()
  const prefill = citajPrefill()
  const [rezim, setRezim] = useState<'prijava' | 'novi'>(params.get('novi') === '1' || prefill ? 'novi' : 'prijava')
  const [salje, setSalje] = useState(false)
  const [greska, setGreska] = useState('')
  const [pin, setPin] = useState('')
  const cistPin = (v: string) => v.replace(/\D/g, '').slice(0, 6)

  const posaljiPrijavu = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setSalje(true); setGreska('')
    try {
      const r = await prijava(String(f.get('telefon') || ''), pin)
      if (r.ok) onUlaz({ telefon: r.profil.telefon, token: r.token, profil: r.profil })
      else setGreska(r.poruka || tr('zakazi.offline'))
    } catch { setGreska(tr('zakazi.offline')) } finally { setSalje(false) }
  }
  const posaljiRegistraciju = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('website')) return
    setSalje(true); setGreska('')
    try {
      const r = await registracija({
        telefon: String(f.get('telefon') || ''), pin, roditelj: String(f.get('roditelj') || ''), email: String(f.get('email') || ''),
        djeca: String(f.get('djeca') || '').split(',').map((x) => x.trim()).filter(Boolean),
        kartica: f.get('kartica') === 'on', marketing: f.get('marketing') === 'on' ? 'da' : 'ne',
      })
      if (r.ok) { try { sessionStorage.removeItem('grasak-moj-prefill') } catch { /* ignore */ } onUlaz({ telefon: r.profil.telefon, token: r.token, profil: r.profil }) }
      else setGreska(r.poruka || tr('zakazi.offline'))
    } catch { setGreska(tr('zakazi.offline')) } finally { setSalje(false) }
  }
  const cip = (aktivan: boolean) => 'flex-1 rounded-full px-4 py-2.5 font-bold ' + (aktivan ? 'bg-grass text-white' : 'bg-grass-tint text-ink')

  return (
    <div className={kutija}>
      <div className="mb-5 flex gap-2">
        <button type="button" onClick={() => { setRezim('prijava'); setGreska('') }} className={cip(rezim === 'prijava')}>{tr('moj.loginTitle')}</button>
        <button type="button" onClick={() => { setRezim('novi'); setGreska('') }} className={cip(rezim === 'novi')}>{tr('moj.registerTitle')}</button>
      </div>
      {rezim === 'prijava' ? (
        <form onSubmit={posaljiPrijavu} className="grid gap-3">
          <input name="telefon" required type="tel" inputMode="tel" placeholder={tr('moj.phone')} autoComplete="tel" className={inputCls} />
          <input value={pin} onChange={(e) => setPin(cistPin(e.target.value))} required type="password" inputMode="numeric" autoComplete="current-password" placeholder={tr('moj.pin')} className={inputCls} />
          {greska && <p className="rounded-xl bg-coral/10 p-3 text-ink">{greska}</p>}
          <button disabled={salje || pin.length < 4} className="flex items-center justify-center gap-2 rounded-full bg-grass px-8 py-3.5 text-lg font-bold text-white disabled:opacity-50">
            {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />} {tr('moj.login')}
          </button>
          <p className="text-sm text-ink/60">{tr('moj.forgot')}</p>
        </form>
      ) : (
        <form onSubmit={posaljiRegistraciju} className="grid gap-3 sm:grid-cols-2">
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <p className="text-ink/70 sm:col-span-2">{tr('moj.registerSub')}</p>
          <input name="roditelj" required maxLength={60} defaultValue={prefill?.roditelj || ''} placeholder={tr('zakazi.parent')} autoComplete="name" className={inputCls} />
          <input name="telefon" required type="tel" inputMode="tel" defaultValue={prefill?.telefon || ''} placeholder={tr('moj.phone')} autoComplete="tel" className={inputCls} />
          <input name="email" type="email" inputMode="email" maxLength={80} defaultValue={prefill?.email || ''} placeholder={tr('moj.email')} autoComplete="email" className={inputCls} />
          <input name="djeca" maxLength={120} defaultValue={prefill?.dijete || ''} placeholder={tr('moj.children')} className={inputCls} />
          <input value={pin} onChange={(e) => setPin(cistPin(e.target.value))} required type="password" inputMode="numeric" autoComplete="new-password" placeholder={tr('moj.pinNew')} className={inputCls + ' sm:col-span-2'} />
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-sun bg-sun/30 px-4 py-3 font-bold text-ink sm:col-span-2">
            <input name="kartica" type="checkbox" defaultChecked={!!prefill?.kartica} className="h-5 w-5 accent-grass" /> {tr('zakazi.loyalty')}
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-grass-tint px-4 py-3 text-ink sm:col-span-2">
            <input name="marketing" type="checkbox" className="h-5 w-5 accent-grass" /> {tr('moj.marketing')}
          </label>
          <p className="text-xs text-ink/50 sm:col-span-2">{tr('zakazi.privacy')}</p>
          {greska && <p className="rounded-xl bg-coral/10 p-3 text-ink sm:col-span-2">{greska}</p>}
          <button disabled={salje || pin.length < 4} className="flex items-center justify-center gap-2 rounded-full bg-coral px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-coral/30 disabled:opacity-50 sm:col-span-2">
            {salje ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />} {tr('moj.register')}
          </button>
        </form>
      )}
    </div>
  )
}

function Nalog({ nalog, onIzmjena, onOdjava }: { nalog: MojNalog; onIzmjena: (n: MojNalog) => void; onOdjava: () => void }) {
  const { tr, lang } = useLang()
  const [podaci, setPodaci] = useState<{ profil: ProfilRoditelja; termini: MojTermin[]; posjete: MojaPosjeta[] } | null>(null)
  const [greska, setGreska] = useState('')
  const [osvjezi, setOsvjezi] = useState(0)
  const [radi, setRadi] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    let aktivno = true
    mojPregled(nalog)
      .then((r) => {
        if (!aktivno) return
        if (r.ok) setPodaci({ profil: r.profil, termini: r.termini, posjete: r.posjete })
        else if (/istekla/i.test(r.poruka || '')) onOdjava()
        else setGreska(r.poruka || tr('zakazi.offline'))
      })
      .catch(() => { if (aktivno) setGreska(tr('zakazi.offline')) })
    return () => { aktivno = false }
  }, [nalog, osvjezi, tr, onOdjava])

  const otkazi = async (t: MojTermin) => {
    if (!window.confirm(tr('moj.cancelConfirm'))) return
    setRadi(t.id); setGreska('')
    try {
      const r = await mojOtkazi(nalog, t.id)
      if (r.ok) { setInfo(tr('zakazi.cancelDone')); setOsvjezi((x) => x + 1) } else setGreska(r.poruka || tr('zakazi.offline'))
    } catch { setGreska(tr('zakazi.offline')) } finally { setRadi('') }
  }
  const sacuvaj = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setRadi('podaci'); setGreska(''); setInfo('')
    try {
      const r = await mojSacuvaj(nalog, {
        roditelj: String(f.get('roditelj') || ''), email: String(f.get('email') || ''),
        djeca: String(f.get('djeca') || '').split(',').map((x) => x.trim()).filter(Boolean),
        kartica: f.get('kartica') === 'on', marketing: f.get('marketing') === 'on' ? 'da' : 'ne', noviPin: String(f.get('noviPin') || '').replace(/\D/g, ''),
      })
      if (r.ok) { onIzmjena({ telefon: nalog.telefon, token: r.token, profil: r.profil }); setInfo(tr('moj.saved')) }
      else setGreska(r.poruka || tr('zakazi.offline'))
    } catch { setGreska(tr('zakazi.offline')) } finally { setRadi('') }
  }
  const p = podaci?.profil || nalog.profil

  return (
    <div className="grid gap-5">
      <div className={kutija + ' flex flex-wrap items-center justify-between gap-3'}>
        <div>
          <p className="font-display text-2xl font-extrabold text-ink">{tr('moj.hello')}, {p.roditelj.split(' ')[0]}!</p>
          <p className="text-sm text-ink/60">{p.telefon}{p.kartica && <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-ink">Veseli Grašak</span>}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/zakazi" className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 font-bold text-white shadow-lg shadow-coral/30"><CalendarCheck className="h-5 w-5" /> {tr('moj.book')}</Link>
          <button onClick={onOdjava} className="inline-flex items-center gap-2 rounded-full border-2 border-grass-tint px-4 py-2.5 font-bold text-ink"><LogOut className="h-5 w-5" /> {tr('moj.logout')}</button>
        </div>
      </div>
      {info && <p className="flex items-center gap-2 rounded-2xl bg-grass p-4 font-bold text-white shadow"><Check className="h-5 w-5" /> {info}</p>}
      {greska && <p className="rounded-2xl bg-coral/10 p-4 text-ink">{greska}</p>}

      <section className={kutija}>
        <h2 className="font-display text-xl font-extrabold text-ink">{tr('moj.myAppointments')}</h2>
        {!podaci ? (
          <p className="mt-3 flex items-center gap-2 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> {tr('zakazi.loading')}</p>
        ) : !podaci.termini.length ? (
          <p className="mt-3 text-ink/60">{tr('moj.none')}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {podaci.termini.map((t) => (
              <li key={t.id} className={'flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl p-4 ' + (t.kartica ? 'bg-sun/30' : 'bg-grass-tint')}>
                <div className="flex-1">
                  <p className="font-bold capitalize text-ink">{datumTekst(t.datum, lang)} · {t.vrijeme}</p>
                  <p className="text-sm text-ink/70">{t.dijete} · {t.usluga} · {t.osoba}{t.lokacija && ` · ${t.lokacija}`}</p>
                </div>
                <button disabled={!!radi} onClick={() => void otkazi(t)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-coral shadow-sm disabled:opacity-50">
                  {radi === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} {tr('moj.cancel')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={kutija}>
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-ink"><History className="h-5 w-5 text-grass-deep" /> {tr('moj.history')}</h2>
        {!podaci ? null : !podaci.posjete.length ? (
          <p className="mt-3 text-ink/60">{tr('moj.noHistory')}</p>
        ) : (
          <ul className="mt-3 grid gap-1.5 text-sm">
            {podaci.posjete.map((x, i) => (
              <li key={i} className="flex flex-wrap gap-x-3 border-b border-grass-tint py-1.5 text-ink/80">
                <span className="w-24 font-bold text-ink">{x.datum.split('-').reverse().slice(0, 2).join('.')}.</span>
                <span>{x.dijete}</span><span>{x.usluga}</span><span className="text-ink/50">{x.frizer}</span>
                {x.status === 'nije_dosao' && <span className="text-coral">{tr('moj.noShow')}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={kutija}>
        <h2 className="font-display text-xl font-extrabold text-ink">{tr('moj.myData')}</h2>
        <form key={p.registrovan + p.roditelj + p.email + p.djeca.join()} onSubmit={sacuvaj} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="roditelj" required maxLength={60} defaultValue={p.roditelj} placeholder={tr('zakazi.parent')} className={inputCls} />
          <input name="email" type="email" maxLength={80} defaultValue={p.email} placeholder={tr('moj.email')} className={inputCls} />
          <input name="djeca" maxLength={120} defaultValue={p.djeca.join(', ')} placeholder={tr('moj.children')} className={inputCls} />
          <input name="noviPin" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" placeholder={tr('moj.newPin')} className={inputCls} />
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-sun bg-sun/30 px-4 py-3 font-bold text-ink sm:col-span-2">
            <input name="kartica" type="checkbox" defaultChecked={p.kartica} className="h-5 w-5 accent-grass" /> {tr('zakazi.loyalty')}
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-grass-tint px-4 py-3 text-ink sm:col-span-2">
            <input name="marketing" type="checkbox" defaultChecked={p.marketing === 'da'} className="h-5 w-5 accent-grass" /> {tr('moj.marketing')}
          </label>
          <button disabled={radi === 'podaci'} className="flex items-center justify-center gap-2 rounded-full bg-grass px-8 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2">
            {radi === 'podaci' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} {tr('moj.save')}
          </button>
        </form>
      </section>
    </div>
  )
}
