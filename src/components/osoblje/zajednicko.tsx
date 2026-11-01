import type { ReactNode } from 'react'
import { CreditCard, X } from 'lucide-react'

/** Zajedničke komponente panela: prozor, tab, znak kartice. */
export function Prozor({ naslov, onZatvori, children }: { naslov: string; onZatvori: () => void; children: ReactNode }) {
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

export function Tab({ aktivan, onClick, children }: { aktivan: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ' +
      (aktivan ? 'bg-grass text-white' : 'bg-white text-ink')}>
      {children}
    </button>
  )
}

/** Znak kartice Veseli Grašak (15% popusta) uz ime djeteta. */
export function KarticaZnak({ mala }: { mala?: boolean }) {
  return (
    <span title="Kartica Veseli Grašak, 15% popusta"
      className={'inline-flex shrink-0 items-center gap-1 rounded-full bg-sun font-bold text-ink ' + (mala ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs')}>
      <CreditCard className={mala ? 'h-3 w-3' : 'h-3.5 w-3.5'} /> VG
    </span>
  )
}
