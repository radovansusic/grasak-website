import { useEffect, useState } from 'react'
import { AlertTriangle, Check, EyeOff, Languages, Loader2, Plus, Save, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { osoblje, SkriptaPrekinuta, type Pristup } from '@/lib/osoblje'
import {
  JEZIK_NAZIV, javiIndexNow, praznaObjava,
  type ObjavaStavka, type ObjavaUredjaj, type Paznja, type ProvjeraObjave, type Taksonomija,
} from '@/lib/kutak'
import { inputCls } from './pomocno'
import { kutakDostupno, kutakObjasnjenje, kutakVrijednost } from '@/data/kutakPravila'

const NEMA_SKRIPTE = 'Kutak još nije uključen na serveru. Javite Radovanu: Google skripta treba novu verziju (2026-11-11g ili novija).'
const SKRIPTA_PREKINUTA = 'Google skripta je prekinuta prije odgovora (najčešće zbog isteka vremena). Ništa nije objavljeno. Sačekajte nekoliko minuta i pokušajte ponovo; ako se ponovi, pišite ručno ili javite Radovanu.'
const STATUS_OZNAKA = { nacrt: 'Nacrt', objavljeno: 'Objavljeno', sklonjeno: 'Sklonjeno' } as const
const STATUS_BOJA = { nacrt: 'bg-sun text-ink', objavljeno: 'bg-grass text-white', sklonjeno: 'bg-ink/10 text-ink/60' } as const
const PREVODI = ['en', 'ru', 'tr'] as const

type Odg = { ok: boolean; poruka?: string; [k: string]: unknown }
type Lista = { objave: ObjavaStavka[]; model: boolean; taksonomija: Taksonomija }

const trojka = (k: string[]) => [k[0] || '', k[1] || '', k[2] || '']

/** Kutak (samo vlasnik i administratori): lista, pa jedno polje (link ili tekst) -> Pripremi -> pregled sa označenim mjestima -> potvrda prevoda -> Objavi. Ručni tok ostaje. */
export default function KutakPanel({ pristup }: { pristup: Pristup }) {
  const [lista, setLista] = useState<Lista | null>(null)
  const [greskaListe, setGreskaListe] = useState('')
  const [osvjezi, setOsvjezi] = useState(0)
  const [obj, setObj] = useState<ObjavaUredjaj | null>(null)
  const [unos, setUnos] = useState('')
  const [radi, setRadi] = useState('')
  const [info, setInfo] = useState('')
  const [greska, setGreska] = useState('')
  const [provjera, setProvjera] = useState<ProvjeraObjave | null>(null)
  const [paznja, setPaznja] = useState<Paznja[]>([])
  const [potvrda, setPotvrda] = useState(false)
  const [zdravlje, setZdravlje] = useState(false)
  /** Urednica je sama kliknula štiklir "I na Dječiji kutak": zadane vrijednosti po rubrici ga više ne mijenjaju. */
  const [kutakRucno, setKutakRucno] = useState(false)
  /** Izmjena crnogorskog teksta objavljene objave koja ima objavljen prevod: urednik bira, nikad tiho. */
  const [izbor, setIzbor] = useState<{ prevodi: string[]; poruka: string; odluka: (v: 'zadrzi' | 'povuci' | null) => void } | null>(null)

  useEffect(() => {
    let aktivno = true
    osoblje<Lista>('objave_lista', pristup)
      .then((r) => {
        if (!aktivno) return
        if (r.ok) { setLista({ objave: r.objave, model: r.model, taksonomija: r.taksonomija }); setGreskaListe('') }
        else setGreskaListe(/nepoznata akcija/i.test(r.poruka || '') ? NEMA_SKRIPTE : r.poruka || 'Greška')
      })
      .catch(() => { if (aktivno) setGreskaListe('Nema veze sa serverom.') })
    return () => { aktivno = false }
  }, [pristup, osvjezi])

  const tax = lista?.taksonomija
  const poziv = async (akcija: string, podaci: Record<string, unknown> = {}): Promise<Odg> => {
    try {
      const r = (await osoblje(akcija, pristup, podaci)) as Odg
      if (!r.ok && /nepoznata akcija/i.test(r.poruka || '')) return { ok: false, poruka: NEMA_SKRIPTE }
      return r
    } catch (e) { return { ok: false, poruka: e instanceof SkriptaPrekinuta ? SKRIPTA_PREKINUTA : 'Nema veze sa serverom. Provjerite internet.' } }
  }
  const sviPodaci = () => (obj ? { objava: obj } : {})
  const javi = (tekst: string) => { setInfo(tekst); setGreska(''); window.setTimeout(() => setInfo((x) => (x === tekst ? '' : x)), 6000) }
  const nova = () => { setObj(praznaObjava()); setKutakRucno(false); setUnos(''); setProvjera(null); setPaznja([]); setPotvrda(false); setZdravlje(false); setInfo(''); setGreska('') }
  const zatvori = () => { setObj(null); setProvjera(null); setPaznja([]); setOsvjezi((x) => x + 1) }
  const izmjeni = (f: (o: ObjavaUredjaj) => ObjavaUredjaj) => { setObj((o) => (o ? f(o) : o)); setProvjera(null) }
  /** Izmjena prevoda poništava njegovu potvrdu: potvrđuje se ono što je pročitano. */
  const izmjeniPrevod = (j: (typeof PREVODI)[number], f: (o: ObjavaUredjaj) => ObjavaUredjaj) => izmjeni((o) => { const n = f(o); return { ...n, potvrda: { ...n.potvrda, [j]: false } } })

  const otvori = async (slug: string) => {
    setRadi('otvori'); setInfo(''); setGreska('')
    const r = await poziv('objave_jedna', { slug })
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Tekst nije otvoren.'); return }
    const u = r.objava as ObjavaUredjaj
    setObj({ ...u, na_kutku: !!u.na_kutku && kutakDostupno(u.rubrika, u.vrsta) }); setKutakRucno(u.status === 'objavljeno'); setProvjera(null); setPaznja([]); setPotvrda(false); setZdravlje(false); setUnos('')
  }

  /** Pripremi u dva poziva (svaki ima svoj vremenski budžet u skripti): 1) nacrt, rubrika, vrsta, oznake, koraci, provjera; 2) prevodi en, ru, tr. */
  const pripremi = async () => {
    setRadi('pripremi'); setGreska(''); setInfo('')
    const r = await poziv('objave_pripremi', { unos })
    if (!r.ok) { setRadi(''); setGreska((r.poruka || 'Priprema nije uspjela.') + ' Možete pisati ručno u koracima ispod.'); return }
    const n = r.objava as ObjavaUredjaj
    setObj((o) => { const m = { ...(o || praznaObjava()), ...n, slug: o?.slug || '', status: o?.status || 'nacrt' }; return { ...m, na_kutku: kutakVrijednost({ rubrika: m.rubrika, vrsta: m.vrsta, stiklir: !!o?.na_kutku, rucno: kutakRucno }) } })
    setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [], zdravstvene: (r.zdravstvene as ProvjeraObjave['zdravstvene']) || [], greske: r.greske as Record<string, string> })
    const paznja1 = (r.paznja as Paznja[]) || []
    setPaznja(paznja1)
    setPotvrda(false); setZdravlje(false)
    if (r.prevodi_slijede !== true) { setRadi(''); javi('Pregled je spreman. Pročitajte označena mjesta i objavite.'); return }
    setRadi('prevodi')
    const p = await poziv('objave_pripremi_prevodi', { objava: n })
    setRadi('')
    if (!p.ok) {
      // nacrt na crnogorskom ostaje u formi; prevodi se mogu napraviti kasnije dugmetom Prevedi
      setGreska((p.poruka || 'Prevodi nijesu napravljeni.') + ' Crnogorski nacrt je ostao u formi; prevode možete napraviti kasnije dugmetom "Prevedi".')
      return
    }
    const po = p.objava as ObjavaUredjaj
    setObj((o) => {
      if (!o) return o
      const nn = { ...o, naslov: { ...o.naslov }, tijelo: { ...o.tijelo }, koraci: { ...o.koraci }, potvrda: { ...o.potvrda } }
      for (const j of PREVODI) if (po.naslov[j] && po.tijelo[j]) { nn.naslov[j] = po.naslov[j]; nn.tijelo[j] = po.tijelo[j]; nn.koraci[j] = po.koraci?.[j] || []; nn.potvrda[j] = false }
      if (p.sacuvano_slug) nn.slug = p.sacuvano_slug as string
      return nn
    })
    setProvjera({ blokirano: (p.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (p.upozorenja as string[]) || [], zdravstvene: (p.zdravstvene as ProvjeraObjave['zdravstvene']) || [], greske: p.greske as Record<string, string> })
    setPaznja([...paznja1.filter((x) => !x.mjesto.startsWith('prevod_')), ...((p.paznja as Paznja[]) || [])])
    if (p.poruka) setGreska(p.poruka as string)   // npr. prevodi nijesu stigli u roku: tačna poruka skripte
    else javi('Pregled je spreman. Pročitajte označena mjesta, potvrdite prevode koje želite i objavite.')
  }

  const prevedi = async () => {
    setRadi('prevod'); setGreska(''); setInfo('')
    const r = await poziv('objave_prevedi', sviPodaci())
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Prevod nije napravljen.'); return }
    const p = r.prevodi as { naslov: Record<string, string>; tijelo: Record<string, string>; koraci: Record<string, string[]> }
    const g = r.greske as Record<string, string>
    setObj((o) => {
      if (!o) return o
      const n = { ...o, naslov: { ...o.naslov }, tijelo: { ...o.tijelo }, koraci: { ...o.koraci }, potvrda: { ...o.potvrda } }
      for (const j of PREVODI) if (p.naslov[j] && p.tijelo[j]) { n.naslov[j] = p.naslov[j]; n.tijelo[j] = p.tijelo[j]; n.koraci[j] = p.koraci?.[j] || []; n.potvrda[j] = false }
      return n
    })
    setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [], zdravstvene: (r.zdravstvene as ProvjeraObjave['zdravstvene']) || [] })
    const nije = Object.keys(g || {})
    if (nije.length) setGreska('Nije preveden: ' + nije.map((j) => JEZIK_NAZIV[j as keyof typeof JEZIK_NAZIV]).join(', ') + '. ' + Object.values(g).join(' '))
    else javi('Prevodi su spremni. Pročitajte ih, ispravite šta treba i potvrdite.')
  }

  const provjeri = async () => {
    setRadi('provjera'); setGreska(''); setInfo('')
    const r = await poziv('objave_provjera', sviPodaci())
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Provjera nije uspjela.'); return }
    const p: ProvjeraObjave = { blokirano: r.blokirano as ProvjeraObjave['blokirano'], upozorenja: r.upozorenja as string[], zdravstvene: (r.zdravstvene as ProvjeraObjave['zdravstvene']) || [], greske: r.greske as Record<string, string> }
    setProvjera(p)
    setPaznja([])
    if (!p.blokirano.length && !p.upozorenja.length && !p.zdravstvene?.length && !Object.keys(p.greske || {}).length) javi('Provjera je čista. Može se objaviti.')
  }

  const pitajIzbor = (prevodi: string[], poruka: string) => new Promise<'zadrzi' | 'povuci' | null>((resolve) => setIzbor({ prevodi, poruka, odluka: resolve }))
  const sacuvaj = async (): Promise<Odg> => {
    let prevodiIzbor: 'zadrzi' | 'povuci' | undefined
    for (let pokusaj = 0; pokusaj < 3; pokusaj++) {
      const r = await poziv('objave_sacuvaj', { ...sviPodaci(), potvrda_upozorenja: potvrda, potvrda_zdravlje: zdravlje, prevodi_izbor: prevodiIzbor })
      if (r.trebaIzbor === true) {
        // objavljen prevod bi tiho nestao sa sajta ili ostao uz izmijenjen original: pita se urednik
        const v = await pitajIzbor((r.prevodi as string[]) || [], r.poruka || '')
        setIzbor(null)
        if (!v) { setGreska('Čuvanje je otkazano: crnogorski tekst nije sačuvan.'); return { ok: false, poruka: 'otkazano' } }
        prevodiIzbor = v
        continue
      }
      if (!r.ok) {
        setGreska(r.poruka || 'Nije sačuvano.')
        setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [], zdravstvene: (r.zdravstvene as ProvjeraObjave['zdravstvene']) || [], greske: r.greske as Record<string, string> })
        return r
      }
      setObj((o) => (o ? { ...o, slug: r.slug as string, status: r.status as ObjavaUredjaj['status'], potvrda: (r.potvrda as ObjavaUredjaj['potvrda']) || o.potvrda } : o))
      return r
    }
    return { ok: false, poruka: 'Nije sačuvano.' }
  }
  const cuvaj = async () => { setRadi('cuvanje'); setGreska(''); setInfo(''); const r = await sacuvaj(); setRadi(''); if (r.ok) javi(r.poruka || 'Sačuvano.') }

  const objavi = async () => {
    if (!obj) return
    const potvrdjeni = PREVODI.filter((j) => obj.potvrda[j] && obj.tijelo[j])
    const nepotvrdjeni = PREVODI.filter((j) => !obj.potvrda[j] && obj.tijelo[j])
    const pitanje = 'Objaviti na sajtu? Postaje javno za sve, i za Google.\nJezici: CG' + potvrdjeni.map((j) => ', ' + j.toUpperCase()).join('') +
      (nepotvrdjeni.length ? '\nNe izlazi (nije potvrđen): ' + nepotvrdjeni.map((j) => j.toUpperCase()).join(', ') : '')
    if (!window.confirm(pitanje)) return
    setRadi('objava'); setGreska(''); setInfo('')
    const s = await sacuvaj()
    if (!s.ok) { setRadi(''); return }
    const r = await poziv('objave_objavi', { slug: s.slug, potvrda_upozorenja: potvrda, potvrda_zdravlje: zdravlje })
    setRadi('')
    if (!r.ok) {
      setGreska(r.poruka || 'Nije objavljeno.')
      setProvjera({ blokirano: (r.blokirano as ProvjeraObjave['blokirano']) || [], upozorenja: (r.upozorenja as string[]) || [], zdravstvene: (r.zdravstvene as ProvjeraObjave['zdravstvene']) || [], greske: r.greske as Record<string, string> })
      return
    }
    if (typeof s.slug === 'string') javiIndexNow(s.slug)
    setObj((o) => (o ? { ...o, status: 'objavljeno' } : o))
    setPaznja([])
    javi(r.poruka || 'Objavljeno.')
  }

  const skloni = async (slug: string) => {
    if (!window.confirm('Skloniti tekst sa sajta? Ostaje u tabeli i može se ponovo objaviti.')) return
    setRadi('skloni'); setGreska('')
    const r = await poziv('objave_skloni', { slug })
    setRadi('')
    if (!r.ok) { setGreska(r.poruka || 'Nije sklonjeno.'); return }
    javiIndexNow(slug)
    if (obj && obj.slug === slug) setObj({ ...obj, status: 'sklonjeno' })
    javi(r.poruka || 'Sklonjeno.')
    setOsvjezi((x) => x + 1)
  }

  const blokirano = !!provjera && (provjera.blokirano.length > 0 || Object.keys(provjera.greske || {}).length > 0)
  const trebaPotvrda = !!provjera && provjera.upozorenja.length > 0
  const trebaZdravlje = !!provjera && (provjera.zdravstvene?.length || 0) > 0

  /* ---------------- lista ---------------- */
  if (!obj) {
    const nazivRubrike = (s: string) => tax?.rubrike.find((r) => r.slug === s)?.naziv.cnr || ''
    const nazivVrste = (s: string) => tax?.vrste.find((v) => v.slug === s)?.naziv.cnr || ''
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button onClick={nova} className="flex items-center gap-1.5 rounded-full bg-grass px-4 py-2 text-sm font-bold text-white shadow"><Plus className="h-4 w-4" /> Novi tekst</button>
          <span className="text-xs text-ink/50">Graškov kutak: crnogorski, engleski, ruski i turski. Prevod izlazi samo ako ga potvrdite.</span>
        </div>
        {info && <p className="mb-3 flex items-center gap-2 rounded-xl bg-grass p-3 text-sm font-bold text-white shadow"><Check className="h-4 w-4" /> {info}</p>}
        {(greska || greskaListe) && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{greska || greskaListe}</p>}
        {lista && !lista.model && <p className="mb-3 rounded-xl bg-sun p-3 text-sm text-ink shadow">Model nije povezan (nema ključa u Script Properties). Priprema, nacrt i prevod ne rade dok se ključ ne upiše; ručno pisanje i objava rade.</p>}
        {!lista && !greskaListe ? (
          <p className="flex items-center gap-2 p-4 text-ink/60"><Loader2 className="h-5 w-5 animate-spin" /> Učitavam...</p>
        ) : lista && !lista.objave.length ? (
          <p className="rounded-2xl bg-white p-4 text-ink/60 shadow">Još nema tekstova. Pritisnite "Novi tekst".</p>
        ) : lista && (
          <ul className="space-y-2">
            {lista.objave.map((o) => (
              <li key={o.slug} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow">
                <button onClick={() => void otvori(o.slug)} disabled={radi === 'otvori'} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-bold text-ink">{o.naslov || o.slug}</span>
                  <span className="block text-xs text-ink/50">{[nazivRubrike(o.rubrika), nazivVrste(o.vrsta), o.datum ? o.datum.slice(8, 10) + '.' + o.datum.slice(5, 7) + '.' : '', (o.status === 'objavljeno' ? o.javni_jezici : o.jezici).map((j) => j.toUpperCase()).join(' ')].filter(Boolean).join(' · ')}</span>
                </button>
                {o.na_kutku && <span className="rounded-full bg-sky px-2.5 py-0.5 text-xs font-bold text-ink" title="Tekst je i na Dječijem kutku (djecijikutak.me)">I na Kutku</span>}
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
  const oznaceno = (...mjesta: string[]) => (paznja.some((p) => mjesta.includes(p.mjesto)) ? ' ring-2 ring-coral' : '')
  const imaCnr = obj.naslov.cnr.trim().length >= 5 && obj.tijelo.cnr.trim().length >= 60
  const vrstaT = tax?.vrste.find((v) => v.slug === obj.vrsta)
  const kutakMoze = kutakDostupno(obj.rubrika, obj.vrsta)
  const kutakObjasni = kutakObjasnjenje(obj.rubrika, obj.vrsta)
  const uzrastSlugovi = new Set((tax?.oznake || []).filter((o) => o.grupa === 'uzrast').map((o) => o.slug))
  const prebaciOznaku = (slug: string) => izmjeni((o) => {
    if (o.oznake.includes(slug)) return { ...o, oznake: o.oznake.filter((x) => x !== slug) }
    const bezUzrasta = uzrastSlugovi.has(slug) ? o.oznake.filter((x) => !uzrastSlugovi.has(x)) : o.oznake   // najviše jedna oznaka uzrasta
    return bezUzrasta.length >= (tax?.oznaka_max || 4) ? o : { ...o, oznake: [...bezUzrasta, slug] }
  })
  const koraciPolja = (j: 'cnr' | 'en' | 'ru' | 'tr', f: (k: string[]) => ObjavaUredjaj['koraci']) =>
    trojka(obj.koraci[j]).map((k, i) => (
      <input key={i} value={k} maxLength={220} placeholder={`Korak ${i + 1}${i < 2 ? '' : ' (nije obavezan)'}`} className={inputCls + ' mt-2'}
        onChange={(e) => { const n = trojka(obj.koraci[j]); n[i] = e.target.value; (j === 'cnr' ? izmjeni : (fn: (o: ObjavaUredjaj) => ObjavaUredjaj) => izmjeniPrevod(j, fn))((o) => ({ ...o, koraci: { ...o.koraci, ...f(n) } })) }} />
    ))
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={zatvori} className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow">← Svi tekstovi</button>
        <span className={'rounded-full px-2.5 py-0.5 text-xs font-bold ' + STATUS_BOJA[obj.status]}>{STATUS_OZNAKA[obj.status]}</span>
        {obj.status === 'objavljeno' && <button onClick={() => void skloni(obj.slug)} disabled={zauzet} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-coral shadow-sm ring-1 ring-coral/40 disabled:opacity-50"><EyeOff className="h-3.5 w-3.5" /> Skloni sa sajta</button>}
      </div>
      {info && <p className="mb-3 flex items-center gap-2 rounded-xl bg-grass p-3 text-sm font-bold text-white shadow"><Check className="h-4 w-4" /> {info}</p>}
      {greska && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-ink shadow">{greska}</p>}
      {izbor && (
        <section role="alertdialog" aria-label="Izbor za objavljene prevode" className="mb-4 rounded-2xl bg-sun p-4 shadow ring-2 ring-coral">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink"><AlertTriangle className="h-5 w-5" /> Šta s objavljenim prevodima?</h2>
          <p className="mb-3 text-sm text-ink">{izbor.poruka}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => izbor.odluka('zadrzi')} className={dugme + ' bg-white text-ink ring-2 ring-grass-tint'}>Zadrži objavljene prevode ({izbor.prevodi.map((j) => j.toUpperCase()).join(', ')})</button>
            <button onClick={() => izbor.odluka('povuci')} className={dugme + ' bg-grass text-white'}>Povuci prevode dok ih ne potvrdim</button>
            <button onClick={() => izbor.odluka(null)} className={dugme + ' bg-white text-coral ring-1 ring-coral/40'}>Odustani</button>
          </div>
        </section>
      )}

      <section className={kartica}>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink"><Sparkles className="h-5 w-5 text-grass" /> 1. Pripremi</h2>
        <p className="mb-3 text-sm text-ink/60">Nalijepite link članka (na bilo kom jeziku) ili upišite tekst, pa pritisnite Pripremi. Sistem u dva koraka pročita izvor, napiše nacrt na crnogorskom, predloži rubriku, vrstu, oznake i korake, provjeri tekst, pa pripremi prevode (to može trajati nekoliko minuta; ne zatvarajte stranu). Bilješka ne smije sadržati ime djeteta ni roditelja: takva se ne šalje. Ništa se ne objavljuje bez vašeg klika. Ili pišite sami u koracima ispod.</p>
        <textarea value={unos} onChange={(e) => setUnos(e.target.value)} rows={3} className={inputCls + ' font-normal'} placeholder="https://... ili: od sutra radimo i nedjeljom od 11 do 21 sat." />
        <button onClick={() => void pripremi()} disabled={zauzet || unos.trim().length < 15} className={dugme + ' mt-3 bg-grass text-white'}>
          {radi === 'pripremi' || radi === 'prevodi' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {radi === 'pripremi' ? 'Pišem nacrt (do dvije minute)...' : radi === 'prevodi' ? 'Prevodim na en, ru, tr (do četiri minute)...' : 'Pripremi'}
        </button>
      </section>

      {paznja.length > 0 && (
        <section className="mb-4 rounded-2xl bg-sun p-4 shadow">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink"><AlertTriangle className="h-5 w-5" /> Traže vašu pažnju</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">{paznja.map((p, i) => <li key={i}>{p.poruka}</li>)}</ul>
        </section>
      )}

      <section className={kartica + oznaceno('tekst_cnr', 'upozorenje')}>
        <h2 className="mb-2 font-display text-lg font-extrabold text-ink">2. Crnogorski tekst</h2>
        <label className="block text-sm font-bold text-ink">Naslov
          <input value={obj.naslov.cnr} onChange={(e) => izmjeni((o) => ({ ...o, naslov: { ...o.naslov, cnr: e.target.value } }))} maxLength={160} className={inputCls + ' mt-1 font-normal'} />
        </label>
        <label className="mt-3 block text-sm font-bold text-ink">Tekst (prazan red između pasusa)
          <textarea value={obj.tijelo.cnr} onChange={(e) => izmjeni((o) => ({ ...o, tijelo: { ...o.tijelo, cnr: e.target.value } }))} rows={10} className={inputCls + ' mt-1 font-normal'} />
        </label>
        <p className="mt-1 text-xs text-ink/50">{obj.tijelo.cnr.split(/\s+/).filter(Boolean).length} riječi{vrstaT ? ` (${vrstaT.naziv.cnr}: ${vrstaT.max ? vrstaT.min + ' do ' + vrstaT.max : vrstaT.min + ' i više'})` : ''}</p>
      </section>

      <section className={kartica}>
        <h2 className="mb-2 font-display text-lg font-extrabold text-ink">3. Rubrika, vrsta i oznake</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={'block rounded-xl text-sm font-bold text-ink' + oznaceno('rubrika')}>Rubrika
            <select value={obj.rubrika} onChange={(e) => izmjeni((o) => ({ ...o, rubrika: e.target.value, na_kutku: kutakVrijednost({ rubrika: e.target.value, vrsta: o.vrsta, stiklir: o.na_kutku, rucno: kutakRucno }) }))} className={inputCls + ' mt-1 font-normal'}>
              <option value="">Izaberite...</option>
              {tax?.rubrike.map((r) => <option key={r.slug} value={r.slug}>{r.naziv.cnr}</option>)}
            </select>
          </label>
          <label className={'block rounded-xl text-sm font-bold text-ink' + oznaceno('vrsta')}>Vrsta teksta
            <select value={obj.vrsta} onChange={(e) => izmjeni((o) => ({ ...o, vrsta: e.target.value, na_kutku: kutakVrijednost({ rubrika: o.rubrika, vrsta: e.target.value, stiklir: o.na_kutku, rucno: kutakRucno }) }))} className={inputCls + ' mt-1 font-normal'}>
              <option value="">Izaberite...</option>
              {tax?.vrste.map((v) => <option key={v.slug} value={v.slug}>{v.naziv.cnr}</option>)}
            </select>
          </label>
        </div>
        <fieldset className={'mt-3 rounded-xl' + oznaceno('oznake')}>
          <legend className="text-sm font-bold text-ink">Oznake ({tax?.oznaka_min} do {tax?.oznaka_max}, najviše jedna oznaka uzrasta) - izabrano {obj.oznake.length}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {tax?.oznake.map((o) => (
              <button key={o.slug} type="button" aria-pressed={obj.oznake.includes(o.slug)} onClick={() => prebaciOznaku(o.slug)}
                className={'rounded-full px-3 py-1 text-xs font-bold ' + (obj.oznake.includes(o.slug) ? 'bg-grass text-white' : 'bg-grass-tint text-ink')}>{o.naziv.cnr}</button>
            ))}
          </div>
        </fieldset>
        <div className={'mt-3 rounded-xl' + oznaceno('koraci')}>
          <p className="text-sm font-bold text-ink">Šta možete uraditi danas (2 do 3 koraka{vrstaT?.koraci ? ', obavezno za ovu vrstu' : ''})</p>
          {koraciPolja('cnr', (k) => ({ cnr: k } as ObjavaUredjaj['koraci']))}
        </div>
        <div className={'mt-3 rounded-xl border-2 border-grass-tint p-3' + oznaceno('na_kutku')}>
          <label className="flex items-start gap-2 text-sm font-bold text-ink">
            <input type="checkbox" checked={obj.na_kutku && kutakMoze} disabled={!kutakMoze} onChange={(e) => { setKutakRucno(true); izmjeni((o) => ({ ...o, na_kutku: e.target.checked })) }} className="mt-0.5 h-4 w-4" />
            <span>I na Dječiji kutak (djecijikutak.me)</span>
          </label>
          {kutakMoze
            ? <p className="mt-1 text-xs text-ink/60">Objavljeni tekst stiže i na Dječiji kutak, samo na crnogorskom, obično za oko sat vremena. Provjere i blokade (zdravlje, djeca, brojka bez izvora) važe i prije slanja na Kutak. Povlačenje: odštiklirajte pa "Objavi izmjene", ili "Skloni sa sajta". Promjena važi tek poslije čuvanja.</p>
            : <p className="mt-1 text-xs text-ink/60">{kutakObjasni}</p>}
        </div>
        <div className={'mt-3 rounded-xl bg-grass-tint p-3 text-sm' + oznaceno('izvor')}>
          <p className="mb-2 text-xs font-bold text-ink/70">Izvor (obavezan za Vijest; link ostaje original{obj.izvor_jezik ? `, jezik izvora: ${obj.izvor_jezik.toUpperCase()}` : ''})</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-bold text-ink/70">Naziv izvora
              <input value={obj.izvor_naziv} onChange={(e) => izmjeni((o) => ({ ...o, izvor_naziv: e.target.value }))} className={inputCls + ' mt-1 font-normal'} />
            </label>
            <label className="block text-xs font-bold text-ink/70">Link izvora (https)
              <input value={obj.izvor_url} onChange={(e) => izmjeni((o) => ({ ...o, izvor_url: e.target.value }))} className={inputCls + ' mt-1 font-normal'} inputMode="url" />
            </label>
          </div>
          <p className="mt-2 text-xs text-ink/60">Minute, sati, broj puta, koraci, uzrast u godinama, cijene u eurima i datumi prolaze. Procenti, statistika ("svako treće dijete") i zdravstvene tvrdnje traže izvor sa nazivom i linkom; zdravstvenu tvrdnju uz izvor potvrđujete posebnim klikom prije objave (bilježi se ko i kada). Imena i podaci djece i roditelja ne smiju u tekst. Lijekovi protiv vaški, opadanje kose, promjene na koži glave, ishrana za kosu i dijagnoze se ne pišu ni uz izvor.</p>
        </div>
      </section>

      <section className={kartica}>
        <h2 className="mb-2 font-display text-lg font-extrabold text-ink">4. Prevodi i potvrda</h2>
        <p className="mb-3 text-sm text-ink/60">Prevod izlazi na sajt samo ako ga potvrdite (štiklir uz jezik). Prevod koji ne potvrdite ostaje sačuvan, ali nije javan. Ako mijenjate crnogorski tekst poslije potvrde, potvrda se poništava.</p>
        <button onClick={() => void prevedi()} disabled={zauzet || !imaCnr} className={dugme + ' mb-3 bg-grass text-white'}>
          {radi === 'prevod' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />} Prevedi (en, ru, tr)
        </button>
        {PREVODI.map((j) => (
          <details key={j} open={!!obj.tijelo[j]} className={'mb-2 rounded-xl border-2 border-grass-tint p-3' + oznaceno('prevod_' + j, 'tekst_' + j)}>
            <summary className="cursor-pointer font-bold text-ink">{JEZIK_NAZIV[j]} {obj.potvrda[j] ? <span className="ml-1 text-xs font-bold text-grass">· potvrđen, izlazi</span> : obj.tijelo[j] ? <span className="ml-1 text-xs font-bold text-coral">· čeka potvrdu, ne izlazi</span> : <span className="ml-1 text-xs text-ink/40">· nema</span>}</summary>
            <input value={obj.naslov[j]} onChange={(e) => izmjeniPrevod(j, (o) => ({ ...o, naslov: { ...o.naslov, [j]: e.target.value } }))} placeholder="Naslov" maxLength={160} className={inputCls + ' mt-2'} />
            <textarea value={obj.tijelo[j]} onChange={(e) => izmjeniPrevod(j, (o) => ({ ...o, tijelo: { ...o.tijelo, [j]: e.target.value } }))} rows={8} placeholder="Tekst" className={inputCls + ' mt-2'} />
            <p className="mt-2 text-xs font-bold text-ink/60">Šta možete uraditi danas ({JEZIK_NAZIV[j]})</p>
            {koraciPolja(j, (k) => ({ [j]: k } as unknown as ObjavaUredjaj['koraci']))}
            <label className="mt-3 flex items-center gap-2 text-sm font-bold text-ink">
              <input type="checkbox" checked={obj.potvrda[j]} disabled={!obj.naslov[j].trim() || !obj.tijelo[j].trim()} onChange={(e) => izmjeni((o) => ({ ...o, potvrda: { ...o.potvrda, [j]: e.target.checked } }))} className="h-4 w-4" />
              Pročitano i potvrđeno: prevod ({JEZIK_NAZIV[j]})
            </label>
          </details>
        ))}
      </section>

      <section className={kartica}>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink"><ShieldCheck className="h-5 w-5 text-grass" /> 5. Provjera i objava</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void provjeri()} disabled={zauzet} className={dugme + ' bg-white text-ink ring-2 ring-grass-tint'}>{radi === 'provjera' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Provjera</button>
          <button onClick={() => void cuvaj()} disabled={zauzet} className={dugme + ' bg-white text-ink ring-2 ring-grass-tint'}>{radi === 'cuvanje' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Sačuvaj nacrt</button>
          <button onClick={() => void objavi()} disabled={zauzet || blokirano || (trebaPotvrda && !potvrda) || (trebaZdravlje && !zdravlje)} className={dugme + ' bg-grass text-white'}>{radi === 'objava' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {obj.status === 'objavljeno' ? 'Objavi izmjene' : 'Objavi'}</button>
        </div>
        {provjera && (provjera.blokirano.length > 0 || provjera.upozorenja.length > 0 || (provjera.zdravstvene?.length || 0) > 0 || Object.keys(provjera.greske || {}).length > 0) && (
          <div className="mt-3 space-y-2 text-sm">
            {Object.values(provjera.greske || {}).map((g) => <p key={g} className="rounded-xl bg-coral/10 p-2 text-ink">{g}</p>)}
            {provjera.blokirano.map((b, i) => (
              <p key={i} className="flex items-start gap-2 rounded-xl bg-coral/15 p-2 text-ink"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral" /><span><b>Zaustavlja objavu</b> ({JEZIK_NAZIV[b.jezik]}): {b.pravilo}{b.nadjeno ? ` - "${b.nadjeno}"` : ''}</span></p>
            ))}
            {provjera.upozorenja.map((u) => <p key={u} className="rounded-xl bg-sun p-2 text-ink"><b>Upozorenje:</b> {u}</p>)}
            {(provjera.zdravstvene || []).map((x, i) => (
              <p key={'z' + i} className="rounded-xl bg-sun p-2 text-ink"><b>Zdravstvena tvrdnja uz izvor</b> ({JEZIK_NAZIV[x.jezik]}): "{x.nadjeno}". Provjerite da je izvor stvarno navodi.</p>
            ))}
            {trebaZdravlje && !blokirano && (
              <label className="flex items-center gap-2 font-bold text-ink"><input type="checkbox" checked={zdravlje} onChange={(e) => setZdravlje(e.target.checked)} className="h-4 w-4" /> Ovaj tekst sadrži zdravstvenu tvrdnju. Provjerila sam izvor.</label>
            )}
            {trebaPotvrda && !blokirano && (
              <label className="flex items-center gap-2 font-bold text-ink"><input type="checkbox" checked={potvrda} onChange={(e) => setPotvrda(e.target.checked)} className="h-4 w-4" /> Pročitano i potvrđeno: upozorenja su pregledana, objavljujem</label>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-ink/50">Tekst se čuva u Google tabeli, list "Objave" (uključen u dnevni bekap). Na sajtu i u Google-u se pojavljuje u roku od nekoliko minuta.</p>
      </section>
    </div>
  )
}
