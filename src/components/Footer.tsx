import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Instagram, Facebook, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import GrassDivider from './GrassDivider'
import { useLang } from '@/i18n/LanguageContext'

export default function Footer() {
  const { tr } = useLang()
  const nav = [
    { to: '/', label: tr('nav.home') },
    { to: '/usluge', label: tr('nav.usluge') },
    { to: '/o-nama', label: tr('nav.onama') },
    { to: '/galerija', label: tr('nav.galerija') },
    { to: '/kontakt', label: tr('nav.kontakt') },
  ]
  return (
    <footer className="relative bg-grass-darkest text-white/85">
      <div className="absolute inset-x-0 -top-[109px] h-[110px] md:-top-[159px] md:h-[160px]">
        <GrassDivider className="h-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <span className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Grašak" className="h-14 w-auto rounded-xl ring-2 ring-white/20" />
            <span className="font-display text-2xl font-bold text-white">GRAŠAK</span>
          </span>
          <p className="mt-4 text-sm leading-relaxed">
            {tr('footer.quote')}
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://instagram.com/djecijisalon"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-grass"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/p/Dječiji-salon-Grašak-61559455795290/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-grass"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/38269371111"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-[#25D366]"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href="viber://chat?number=%2B38269371111"
              aria-label="Viber"
              className="rounded-full bg-white/10 p-2 text-xs font-black leading-none transition-colors hover:bg-[#7360F2]"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}
            >
              V
            </a>
            <a
              href="https://www.google.com/maps/place/GRAŠAK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95"
              target="_blank"
              rel="noreferrer"
              aria-label={tr('footer.location')}
              className="rounded-full bg-white/10 p-2 transition-colors hover:bg-grass"
            >
              <MapPin className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg font-bold text-white">{tr('footer.quickLinks')}</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-sun">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg font-bold text-white">{tr('footer.contact')}</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
              <a
                href="https://www.google.com/maps/place/GRAŠAK/data=!4m2!3m1!1s0x0:0x1ae339b0be9d7c95"
                target="_blank"
                rel="noreferrer"
                className="hover:text-sun"
              >
                {tr('footer.address1')}
                <br />
                {tr('footer.address2')}
              </a>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
              <a href="tel:+38269371111" className="hover:text-sun">
                +382 69 371 111
              </a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sun" />
              <a href="mailto:grasaksalon@gmail.com" className="hover:text-sun">
                grasaksalon@gmail.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg font-bold text-white">{tr('footer.hours')}</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sun" /> {tr('footer.hoursTueFri')}
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sun" /> {tr('footer.hoursSatSun')}
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-coral" /> {tr('footer.hoursMon')}
            </li>
          </ul>
        </div>
      </motion.div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-white/60 sm:flex-row">
          <span>{tr('footer.copyright')}</span>
          <img src="/grass-tuft.svg" alt="" className="h-6 w-auto opacity-70" />
        </div>
      </div>
    </footer>
  )
}
