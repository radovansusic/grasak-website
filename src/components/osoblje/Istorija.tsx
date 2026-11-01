import { useEffect, useState } from 'react'
import { History, Loader2 } from 'lucide-react'
import { osoblje, type Klijent, type Pristup } from '@/lib/osoblje'
import { KarticaZnak } from './zajednicko'
import { kratakDatum } from './pomocno'

/** Istorija klijenta po broju telefona: posjete, izostanci, otkazivanja, djeca. */
export default function Istorija({ pristup, telefon }: { pristup: Pristup; telefon: string }) {
  const [k, setK] = useState<{ telefon: string; klijent: Klijent | null; greska: boolean } | null>(null)
  useEffect(() => {
    if (!telefon) return
    let aktivno = true
    osoblje<{ klijent: Klijent | null }>('klijent', pristup, { telefon })
      .then((r) => { if (aktivno) setK({ telefon, klijent: r.ok ? r.klijent : null, greska: !r.ok }) })
      .catch(() => { if (aktivno) setK({ telefon, klijent: null, greska: true }) })
    return () => { aktivno = false }
  }, [pristup, telefon])

  if (!telefon) return null
  const okvir = 'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-grass-tint px-3 py-2 text-sm text-ink'
  if (!k || k.telefon !== telefon) return <p className={okvir}><Loader2 className="h-4 w-4 animate-spin" /> Istorija klijenta...</p>
  if (k.greska) return <p className={okvir}><History className="h-4 w-4" /> Istorija nije dostupna (skripta nije ažurirana).</p>
  const kl = k.klijent
  if (!kl) return null
  const prviPut = kl.posjete === 0 && kl.nijeDosao === 0 && kl.otkazano === 0
  return (
    <div className={okvir}>
      <History className="h-4 w-4 shrink-0 text-grass-deep" />
      {prviPut ? <span className="font-bold">Prvi put kod nas</span> : (
        <>
          <span><b>{kl.posjete}</b> {kl.posjete === 1 ? 'posjeta' : 'posjeta'}{kl.zadnja && <span className="text-ink/60"> · zadnja {kratakDatum(kl.zadnja)}</span>}</span>
          {kl.nijeDosao > 0 && <span className="font-bold text-coral">nije došao: {kl.nijeDosao}</span>}
          {kl.otkazano > 0 && <span className="text-ink/60">otkazano: {kl.otkazano}</span>}
        </>
      )}
      {kl.kartica && <KarticaZnak mala />}
      {kl.djeca.length > 1 && <span className="text-ink/60">djeca: {kl.djeca.join(', ')}</span>}
    </div>
  )
}
