import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FaqItem {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="rounded-2xl border-none bg-white px-6 shadow-sm shadow-[#22302A]/5"
          >
            <AccordionTrigger
              className="py-5 text-left text-lg font-bold text-[#22302A] hover:no-underline [&[data-state=open]>svg]:rotate-45"
              style={{ fontFamily: "'Baloo 2', cursive" }}
            >
              {item.q}
            </AccordionTrigger>
            <AccordionContent
              className="pb-5 text-[16px] leading-[1.65] text-[#22302A]/70"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  )
}
