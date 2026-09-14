import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Phone, X } from 'lucide-react'
import { useLang } from '@/i18n/LanguageContext'

const TEL_URL = 'tel:+38269371111'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.2L2 22l4.9-1.6A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.6 0-3-.4-4.3-1.2l-.3-.2-2.9 1 1-2.8-.2-.3a8.2 8.2 0 1 1 6.7 3.5Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z" />
    </svg>
  )
}

function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.5 2 2 5.9 2 10.7c0 2.6 1.4 4.9 3.6 6.4-.1 1-.4 2.9-.5 3.4-.1.6.4 1 .9.7 1.2-.7 2.9-1.7 3.9-2.2.7.1 1.4.2 2.1.2 5.5 0 10-3.9 10-8.7S17.5 2 12 2Zm3.9 10.9c-.2.5-.9 1.1-1.4 1.2-.4.1-.9.2-2.7-.6-2.3-.9-3.8-3.1-3.9-3.2-.1-.2-.9-1.2-.9-2.4 0-.6.3-1.3.7-1.5.2-.1.5-.2.7-.2h.3c.1 0 .3 0 .4.3l.8 1.9c.1.2.1.4 0 .6l-.4.5c-.1.2-.2.4 0 .6.1.2.7 1.1 1.5 1.8 1 .9 1.8 1.1 2 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.7.8c.3.2.4.3.5.4 0 .2 0 .5-.2.9l.2.6Z" />
    </svg>
  )
}

/** Plutajuća dugmad za brzi kontakt, WhatsApp / Viber / poziv. */
export default function FloatingChat() {
  const { tr } = useLang()
  const waMsg = tr('chat.waMsg')
  const ACTIONS = [
    {
      label: 'WhatsApp',
      href: 'https://wa.me/38269371111?text=' + encodeURIComponent(waMsg),
      external: true,
      bg: 'bg-[#25D366]',
      icon: WhatsAppIcon,
    },
    {
      label: 'Viber',
      href: 'viber://chat?number=%2B38269371111&draft=' + encodeURIComponent(`${waMsg} 💇‍♂️`),
      external: false,
      bg: 'bg-[#7360F2]',
      icon: ViberIcon,
    },
    {
      label: tr('chat.call'),
      href: TEL_URL,
      external: false,
      bg: 'bg-coral',
      icon: Phone,
    },
  ]
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed bottom-24 left-4 z-[90] flex flex-col items-start gap-3 lg:bottom-6 lg:left-6">
      <AnimatePresence>
        {visible && open &&
          ACTIONS.map((a, i) => (
            <motion.a
              key={a.label}
              href={a.href}
              {...(a.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              initial={{ opacity: 0, y: 16, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.8 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 24 }}
              className="flex items-center gap-2.5"
              aria-label={a.label}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 ${a.bg}`}
              >
                <a.icon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink shadow-md">
                {a.label}
              </span>
            </motion.a>
          ))}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? tr('chat.close') : tr('chat.open')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-grass text-white shadow-xl shadow-grass/40 transition-transform hover:scale-105"
          >
            <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
