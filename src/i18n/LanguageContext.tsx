import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { t, type Dict, type Lang } from './translations'

const STORAGE_KEY = 'grasak-lang'

function lookup(dict: Dict, path: string): string | undefined {
  let cur: string | Dict | undefined = dict
  for (const part of path.split('.')) {
    if (cur == null || typeof cur === 'string') return undefined
    cur = (cur as Dict)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

interface LanguageCtx {
  lang: Lang
  setLang: (l: Lang) => void
  /** Dot-path lookup with fallback to cnr; supports {placeholder} interpolation. */
  tr: (path: string, vars?: Record<string, string | number>) => string
}

const Ctx = createContext<LanguageCtx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'cnr' || saved === 'en' || saved === 'ru') return saved
    } catch {
      /* ignore */
    }
    return 'cnr'
  })

  useEffect(() => {
    document.documentElement.lang = lang === 'cnr' ? 'cnr' : lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  const tr = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      let s = lookup(t[lang], path) ?? lookup(t.cnr, path) ?? path
      if (vars) {
        for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
      }
      return s
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, tr }), [lang, setLang, tr])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang(): LanguageCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
