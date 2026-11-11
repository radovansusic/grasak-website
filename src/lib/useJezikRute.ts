import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLang } from '@/i18n/LanguageContext'
import { jezikIzPutanje, objavePutanja } from '@/lib/objave'

/** Jezik objave: URL određuje jezik pri ulasku (/en/objave), a promjena jezika u meniju vodi na adresu tog jezika. */
export function useJezikRute(slug?: string) {
  const { lang, setLang } = useLang()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const urlJezik = jezikIzPutanje(pathname)
  const poceo = useRef(false)
  useEffect(() => {
    if (!poceo.current) {
      poceo.current = true
      if (urlJezik !== lang) setLang(urlJezik)
      return
    }
    if (lang !== urlJezik) navigate(objavePutanja(lang, slug), { replace: true })
  }, [lang, urlJezik, slug, setLang, navigate])
  return lang
}
