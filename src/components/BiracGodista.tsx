import { izborGodista } from '@/lib/godiste'

/** Klizač sa godištima (ova godina pa unazad): prevuci i dodirni. Drugi dodir na isto godište ga poništava. */
export default function BiracGodista({ naslov, vrijednost, onIzbor, className = '' }: {
  naslov: string; vrijednost: string; onIzbor: (g: string) => void; className?: string
}) {
  return (
    <div className={'min-w-0 ' + className}>
      <span className="mb-1 block text-sm font-bold text-ink/70">{naslov}{vrijednost && <span className="text-grass-deep">: {vrijednost}</span>}</span>
      <div role="radiogroup" aria-label={naslov} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {izborGodista().map((g) => (
          <button key={g} type="button" role="radio" aria-checked={vrijednost === g} onClick={() => onIzbor(vrijednost === g ? '' : g)}
            className={'shrink-0 snap-start rounded-full border-2 px-4 py-2 text-sm font-bold ' + (vrijednost === g ? 'border-grass bg-grass text-white' : 'border-grass-tint bg-white text-ink hover:border-grass')}>
            {g}
          </button>
        ))}
      </div>
    </div>
  )
}
