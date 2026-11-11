import { useEffect, useState } from 'react'
import { AlertTriangle, Check, EyeOff, Languages, Link2, Loader2, Plus, Save, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { osoblje, type Pristup } from '@/lib/osoblje'
import {
  JEZICI_OBJAVA, JEZIK_NAZIV, praznaObjava,
  type ObjavaStavka, type ObjavaUredjaj, type ProvjeraObjave,
} from '@/lib/objave'
import { inputCls } from './pomocno'

const NEMA_SKRIPTE = 'Objave traže novu verziju Google skripte (Grasak.gs). Zalijepite je i napravite New version (vidi OBJAVE-POSTAVLJANJE.md).'
const STATUS_OZNAKA = { nacrt: 'Nacrt', objavljeno: 'Objavljeno', sklonjeno: 'Sklonjeno' } as const
const STATUS_BOJA = { nacrt: 'bg-sun text-ink', objavljeno: 'bg-grass text-white', sklonjeno: 'bg-ink/10 text-ink/60' } as const

type Odg = { ok: boolean; poruka?: string; [k: string]: unknown }

/** Objave (samo vlasnik i administratori): lista, pa obrazac link/bilješka -> Nacrt -> uredi -> Prevedi -> uredi -> Provjera -> Objavi. */
export default function ObjavePanel({ pristup }: { pristup: Pristup }) {
  const [lista, setLista] = useState<{ objave: ObjavaStavka[]; model: boolean } | null>(null)
  const [greskaListe, setGreskaListe] = useState('')
  const [osvjezi, setOsvjezi] = useState(0)
  const [obj, setObj] = useState<ObjavaUredjaj | null>(null)
  const [link, setLink] = useState('')
  const [biljeska, setBiljeska] = useState('')
  const [radi, setRadi] = useState('')
  const [info, setInfo] = useState('')
  const [greska, setGreska] = useState('')
  const [provjera, setProvjera] = useState<ProvjeraObjave | null>(null)
  const [potvrda, setPotvrda] = useState(false)

  useEffect(() => {
    let aktivno = true
    osoblje<{ objave: ObjavaStavka[]; model: boolean }>('objave_lista', pristup)
      .then((r) => {
        if (!aktivno) return
        if (r.ok) { setLista({ objave: r.objave, model: r.model }); setGreskaListe('') }
        else setGreskaListe(/nepoznata akcija/i.test(r.poruka || '') ? NEMA_SKRIPTE : r.poruka || 'Greška')
      })
      .catch(() => { if (aktivno) setGreskaListe('Nema veze sa serverom.') })
    return () => { aktivno = false }
  }, [pristup, osvjezi])

  const poziv = async (akcija: string, podaci: Record<string, unknown> = {}): Promise<Odg> => {
    try {
      const r = (await osoblje(akcija, pristup, podaci)) as Odg
      if (!r.ok && /nepoznata akcija/i.test(r.poruka || '')) return { ok: false, poruka: NEMA_SKRIPTE }
      return r
    } catch { return { ok: false, poruka: 'Nema veze sa serverom.' } }
  }
  const sviPodaci = () => (obj ? { objava: obj } : {})
  const javi = (tekst: string) => { setInfo(tekst); setGreska(''); window.setTimeout(() => setInfo((x) => (x === tekst ? '' : x)), 6000) }
  const nova = () => { setObj(praznaObjava()); setLink(''); setBiljeska(''); setProvjera(null); setPotvrda(false); setInfo(''); setGreska('') }
  const zatvori = () => { setObj(null); setProvjera(null); setOsvjezi((x) => x + 1) }
  const izmjeni = (f: (o: ObjavaUredjaj) => ObjavaUredjaj) => { setObj((o) => (o ? f(o) : o)); setProvjera(null) }

  const otvori = async (slug: string) => {
    setRadi('otvori'); setInfo(''); setGreska('')
    const r = await poziv('objave_jedna', { slug })
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Objava nije otvorena.'); return }
    setObj(r.objava as ObjavaUredjaj); setProvjera(null); setPotvrda(false); setLink(''); setBiljeska('')
  }

  const nacrt = async () => {
    setRadi('nacrt'); setGreska(''); setInfo('')
    const r = await poziv('objave_nacrt', { link: link.trim(), biljeska })
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Nacrt nije napravljen.'); return }
    const n = r.objava as ObjavaUredjaj
    setObj((o) => ({ ...(o || praznaObjava()), tip: n.tip, izvor_naziv: n.izvor_naziv, izvor_url: n.izvor_url, naslov: { ...(o || praznaObjava()).naslov, cnr: n.naslov.cnr }, tijelo: { ...(o || praznaObjava()).tijelo, cnr: n.tijelo.cnr } }))
    setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [] })
    javi('Nacrt je spreman. Pročitajte ga i prepravite kako vama pristaje.')
  }

  const prevedi = async () => {
    setRadi('prevod'); setGreska(''); setInfo('')
    const r = await poziv('objave_prevedi', sviPodaci())
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Prevod nije napravljen.'); return }
    const p = r.prevodi as { naslov: Record<string, string>; tijelo: Record<string, string> }
    const g = r.greske as Record<string, string>
    setObj((o) => {
      if (!o) return o
      const n = { ...o, naslov: { ...o.naslov }, tijelo: { ...o.tijelo } }
      for (const j of ['en', 'ru', 'tr'] as const) if (p.naslov[j] && p.tijelo[j]) { n.naslov[j] = p.naslov[j]; n.tijelo[j] = p.tijelo[j] }
      return n
    })
    setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [] })
    const nije = Object.keys(g || {})
    if (nije.length) setGreska('Nije preveden: ' + nije.map((j) => JEZIK_NAZIV[j as keyof typeof JEZIK_NAZIV]).join(', ') + '. ' + Object.values(g).join(' '))
    else javi('Prevodi su spremni. Pročitajte ih i ispravite šta treba.')
  }

  const provjeri = async () => {
    setRadi('provjera'); setGreska(''); setInfo('')
    const r = await poziv('objave_provjera', sviPodaci())
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Provjera nije uspjela.'); return }
    const p: ProvjeraObjave = { blokirano: r.blokirano as ProvjeraObjave['blokirano'], upozorenja: r.upozorenja as string[], greske: r.greske as Record<string, string> }
    setProvjera(p)
    if (!p.blokirano.length && !p.upozorenja.length && !Object.keys(p.greske || {}).length) javi('Provjera je čista. Može se objaviti.')
  }

  const sacuvaj = async (): Promise<boolean> => {
    setRadi('cuvanje'); setGreska(''); setInfo('')
    const r = await poziv('objave_sacuvaj', { ...sviPodaci(), potvrda_upozorenja: potvrda })
    setRadi('')
    if (!r.ok) {
      setGreska(r.poruka || 'Nije sačuvano.')
      setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [], greske: r.greske as Record<string, string> })
      return false
    }
    setObj((o) => (o ? { ...o, slug: r.slug as string, status: r.status as ObjavaUredjaj['status'] } : o))
    javi(r.poruka || 'Sačuvano.')
    return true
  }

  const objavi = async () => {
    if (!obj) return
    if (!window.confirm('Objaviti na sajtu? Postaje javno za sve, i za Google.')) return
    setRadi('objava'); setGreska(''); setInfo('')
    const s = await poziv('objave_sacuvaj', { ...sviPodaci(), potvrda_upozorenja: potvrda })
    if (!s.ok) {
      setRadi(''); setGreska(s.poruka || 'Nije sačuvano.')
      setProvjera({ blokirano: (s.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (s.upozorenja as string[]) || [], greske: s.greske as Record<string, string> })
      return
    }
    const r = await poziv('objave_objavi', { slug: s.slug, potvrda_upozorenja: potvrda })
    setRadi('')
    setObj((o) => (o ? { ...o, slug: s.slug as string } : o))
    if (!r.ok) {
      setGreska(r.poruka || 'Nije objavljeno.')
      setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [], greske: r.greske as Record<string, string> })
      return
    }
    setObj((o) => (o ? { ...o, status: 'objavljeno' } : o))
    javi(r.poruka || 'Objavljeno.')
  }

  const skloni = async (slug: string) => {
    if (!window.confirm('Skloniti objavu sa sajta? Ostaje u tabeli i može se ponovo objaviti.')) return
    setRadi('skloni'); setGreska('')
    const r = await poziv('objave_skloni', { slug })
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Nije sklonjeno.'); return }
    if (obj && obj.slug === slug) setObj({ ...obj, status: 'sklonjeno' })
    javi(r.poruka || 'Sklonjeno.')
    setOsvjezi((x) => x + 1)
  }

  const blokirano = !!provjera && provjera.blokirano.length > 0
  const trebaPotvrda = !!provjera && provjera.upozorenja.length > 0

  /* ---------------- lista ---------------- */
  if (!obj) {
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button onClick={nova} className="flex items-center gap-1.5 rounded-full bg-grass px-4 py-2 text-sm font-bold text-white shadow"><Plus className="h-4 w-4" /> Nova objava</button>
          <span className="text-xs text-ink/50">Na sajtu su objave na crnogorskom, engleskom, ruskom i turskom. Piše samo vlasnica salona.</span>
        </div>
        {info && <p className="mb-3 flex items-center gap-2 rounded-xl bg-grass p-3 text-sm font-bold text-white shadow"><Check className="h-4 w-4" /> {info}</p>}
        {(greska || greskaListe) && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{greska || greskaListe}</p>}
        {lista && !lista.model && <p className="mb-3 rounded-xl bg-sun p-3 text-sm text-ink shadow">Model nije povezan (nema ključa u Script Properties). Nacrt i prevod ne rade dok se ključ ne upiše; ručno pisanje i objava rade.</p>}
        {!lista && !greskaListe ? (
          <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam...</p>
        ) : lista && !lista.objave.length ? (
          <p className="rounded-2xl bg-white p-4 text-ink/60 shadow">Još nema objava. Pritisnite "Nova objava".</p>
        ) : lista && (
          <ul className="space-y-2">
            {lista.objave.map((o) => (
              <li key={o.slug} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow">
                <button onClick={() => void otvori(o.slug)} disabled={radi === 'otvori'} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-bold text-ink">{o.naslov || o.slug}</span>
                  <span className="block text-xs text-ink/50">{o.datum ? o.datum.slice(8, 10) + '.' + o.datum.slice(5, 7) + '. · ' : ''}{o.jezici.map((j) => j.toUpperCase()).join(' ')}{o.tip === 'vijest' ? ' · vijest sa izvorom' : ''}</span>
                </button>
                <span className={'rounded-full px-2.5 py-0.5 text-xs font-bold ' + STATUS_BOJA[o.status]}>{STATUS_OZNAKA[o.status]}</span>
                {o.status === 'objavljeno' && (
                  <button onClick={() => void skloni(o.slug)} disabled={radi === 'skloni'} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-coral shadow-sm ring-1 ring-coral/40 disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" /> Skloni</button>
                )}
              </li>
            ))}
          </ul>
        )}
        {lista && lista.objave.length > 0 && <p className="mt-3 text-xs text-ink/50">Objava i skidanje postaju vidljivi na sajtu za nekoliko minuta (keš).</p>}
      </div>
    )
  }

  /* ---------------- obrazac ---------------- */
  const zauzet = radi !== ''
  const dugme = 'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold shadow disabled:opacity-50'
  const kartica = 'mb-4 rounded-2xl bg-white p-4 shadow'
  const imaCnr = obj.naslov.cnr.trim().length >= 5 && obj.tijelo.cnr.trim().length >= 60
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={zatvori} className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow">← Sve objave</button>
        <span className={'rounded-full px-2.5 py-0.5 text-xs font-bold ' + STATUS_BOJA[obj.status]}>{STATUS_OZNAKA[obj.status]}</span>
        {obj.status === 'objavljeno' && <button onClick={() => void skloni(obj.slug)} disabled={zauzet} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-coral shadow-sm ring-1 ring-coral/40 disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" /> Skloni sa sajta</button>}
      </div>
      {info && <p className="mb-3 flex items-center gap-2 rounded-xl bg-grass p-3 text-sm font-bold text-white shadow"><Check className="h-4 w-4" /> {info}</p>}
      {greska && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{greska}</p>}

      <section className={kartica}>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink"><Sparkles className="h-5 w-5 text-grass" /> 1. Odakle polazite</h2>
        <p className="mb-3 text-sm text-ink/60">Nalijepite link članka ili upišite bilješku, pa pritisnite Nacrt. Ili samo napišite sami u koraku 2.</p>
        <label className="block text-sm font-bold text-ink">Link članka (nije obavezno)
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className={inputCls + ' mt-1 font-normal'} inputMode="url" />
        </label>
        <label className="mt-3 block text-sm font-bold text-ink">Bilješka (šta želite da objava kaže)
          <textarea value={biljeska} onChange={(e) => setBiljeska(e.target.value)} rows={3} className={inputCls + ' mt-1 font-normal'} placeholder="Npr. od sutra radimo i nedjeljom od 11 do 21 sat." />
        </label>
        <button onClick={() => void nacrt()} disabled={zauzet || (!link.trim() && biljeska.trim().length < 15)} className={dugme + ' mt-3 bg-grass text-white'}>
          {radi === 'nacrt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Nacrt
        </button>
      </section>

      <section className={kartica}>
        <h2 className="mb-2 font-display text-lg font-extrabold text-ink">2. Crnogorski tekst</h2>
        <label className="block text-sm font-bold text-ink">Naslov
          <input value={obj.naslov.cnr} onChange={(e) => izmjeni((o) => ({ ...o, naslov: { ...o.naslov, cnr: e.target.value } }))} maxLength={160} className={inputCls + ' mt-1 font-normal'} />
        </label>
        <label className="mt-3 block text-sm font-bold text-ink">Tekst (kratko, 2 do 3 pasusa, prazan red između pasusa)
          <textarea value={obj.tijelo.cnr} onChange={(e) => izmjeni((o) => ({ ...o, tijelo: { ...o.tijelo, cnr: e.target.value } }))} rows={9} className={inputCls + ' mt-1 font-normal'} />
        </label>
        <div className="mt-3 rounded-xl bg-grass-tint p-3 text-sm">
          <label className="flex items-start gap-2 font-bold text-ink">
            <input type="checkbox" checked={obj.tip === 'vijest'} onChange={(e) => izmjeni((o) => ({ ...o, tip: e.target.checked ? 'vijest' : 'vlastita' }))} className="mt-1 h-4 w-4" />
            <span>Objava prenosi vijest ili tuđu informaciju (izvor je obavezan)</span>
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-bold text-ink/70">Naziv izvora
              <input value={obj.izvor_naziv} onChange={(e) => izmjeni((o) => ({ ...o, izvor_naziv: e.target.value }))} className={inputCls + ' mt-1 font-normal'} />
            </label>
            <label className="block text-xs font-bold text-ink/70">Link izvora (https)
              <input value={obj.izvor_url} onChange={(e) => izmjeni((o) => ({ ...o, izvor_url: e.target.value }))} className={inputCls + ' mt-1 font-normal'} inputMode="url" />
            </label>
          </div>
          <p className="mt-2 text-xs text-ink/60">Brojke i zdravstvene tvrdnje bez izvora provjera zaustavlja. Imena i podaci djece i roditelja ne smiju u objavu.</p>
        </div>
      </section>

      <section className={kartica}>
        <h2 className="mb-2 font-display text-lg font-extrabold text-ink">3. Prevodi</h2>
        <p className="mb-3 text-sm text-ink/60">Prevod pravi model, a vi ga čitate i ispravljate. Ako mijenjate crnogorski tekst poslije prevoda, pritisnite Prevedi ponovo. Prazan prevod znači da objava na tom jeziku ne postoji (sajt je prikazuje na crnogorskom).</p>
        <button onClick={() => void prevedi()} disabled={zauzet || !imaCnr} className={dugme + ' mb-3 bg-grass text-white'}>
          {radi === 'prevod' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />} Prevedi (en, ru, tr)
        </button>
        {JEZICI_OBJAVA.filter((j) => j !== 'cnr').map((j) => (
          <details key={j} open={!!obj.tijelo[j]} className="mb-2 rounded-xl border-2 border-grass-tint p-3">
            <summary className="cursor-pointer font-bold text-ink">{JEZIK_NAZIV[j]} {obj.tijelo[j] ? <span className="ml-1 text-xs font-bold text-grass">· ima prevod</span> : <span className="ml-1 text-xs text-ink/40">· nema</span>}</summary>
            <input value={obj.naslov[j]} onChange={(e) => izmjeni((o) => ({ ...o, naslov: { ...o.naslov, [j]: e.target.value } }))} placeholder="Naslov" maxLength={160} className={inputCls + ' mt-2'} />
            <textarea value={obj.tijelo[j]} onChange={(e) => izmjeni((o) => ({ ...o, tijelo: { ...o.tijelo, [j]: e.target.value } }))} rows={7} placeholder="Tekst" className={inputCls + ' mt-2'} />
          </details>
        ))}
      </section>

      <section className={kartica}>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink"><ShieldCheck className="h-5 w-5 text-grass" /> 4. Provjera i objava</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void provjeri()} disabled={zauzet} className={dugme + ' bg-white text-ink ring-2 ring-grass-tint'}>{radi === 'provjera' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Provjera</button>
          <button onClick={() => void sacuvaj()} disabled={zauzet} className={dugme + ' bg-white text-ink ring-2 ring-grass-tint'}>{radi === 'cuvanje' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Sačuvaj nacrt</button>
          <button onClick={() => void objavi()} disabled={zauzet || blokirano || (trebaPotvrda && !potvrda)} className={dugme + ' bg-grass text-white'}>{radi === 'objava' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {obj.status === 'objavljeno' ? 'Objavi izmjene' : 'Objavi'}</button>
        </div>
        {provjera && (provjera.blokirano.length > 0 || provjera.upozorenja.length > 0 || Object.keys(provjera.greske || {}).length > 0) && (
          <div className="mt-3 space-y-2 text-sm">
            {Object.values(provjera.greske || {}).map((g) => <p key={g} className="rounded-xl bg-coral/10 p-2 text-ink">{g}</p>)}
            {provjera.blokirano.map((b, i) => (
              <p key={i} className="flex items-start gap-2 rounded-xl bg-coral/15 p-2 text-ink"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral" /><span><b>Zaustavlja objavu</b> ({JEZIK_NAZIV[b.jezik]}): {b.pravilo}{b.nadjeno ? ` - "${b.nadjeno}"` : ''}</span></p>
            ))}
            {provjera.upozorenja.map((u) => <p key={u} className="rounded-xl bg-sun p-2 text-ink"><b>Upozorenje:</b> {u}</p>)}
            {trebaPotvrda && !blokirano && (
              <label className="flex items-center gap-2 font-bold text-ink"><input type="checkbox" checked={potvrda} onChange={(e) => setPotvrda(e.target.checked)} className="h-4 w-4" /> Pročitala sam upozorenja i objavljujem svejedno</label>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-ink/50">Objava se čuva u Google tabeli, list "Objave" (uključena u dnevni bekap). Na sajtu i u Google-u se pojavljuje u roku od nekoliko minuta.</p>
      </section>
    </div>
  )
}
