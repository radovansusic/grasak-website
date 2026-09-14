import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import Lenis from 'lenis'
import Navbar from './Navbar'
import Footer from './Footer'
import PageLoader from './PageLoader'
import ScrollProgress from './ScrollProgress'
import BackToTop from './BackToTop'
import MobileBar from './MobileBar'
import FloatingChat from './FloatingChat'

export default function Layout() {
  const { pathname, hash } = useLocation()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return
    const lenis = new Lenis({ lerp: 0.1 })
    lenisRef.current = lenis
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // smooth anchor scrolling for same-page #links (and cross-page hashes)
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) lenisRef.current?.scrollTo(el as HTMLElement, { offset: -90 })
      }, 60)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <PageLoader />
      <ScrollProgress />
      <Navbar />
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-grass focus:px-5 focus:py-2 focus:font-bold focus:text-white"
      >
        Idi na sadržaj
      </a>
      <main id="sadrzaj" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileBar />
      <BackToTop />
      <FloatingChat />
    </div>
  )
}
