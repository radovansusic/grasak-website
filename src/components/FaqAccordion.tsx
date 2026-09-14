import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Plus } from 'lucide-react'

export interface FaqItem {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          value={`item-${i}`}
          className="rounded-2xl border-none bg-white px-6 shadow-md shadow-ink/5 [&[data-state=open]>button_.faq-icon]:rotate-45"
        >
          <AccordionTrigger className="py-5 text-left font-display text-lg font-bold text-ink hover:no-underline [&>svg.lucide-chevron-down]:hidden">
            <span className="flex w-full items-center justify-between gap-4">
              {item.q}
              <span className="faq-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grass-tint text-grass-deep transition-transform duration-300">
                <Plus className="h-4 w-4" />
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-ink/75">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
