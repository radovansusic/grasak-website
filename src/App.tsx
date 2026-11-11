import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'

// ostale stranice se učitavaju tek kad zatrebaju (brže otvaranje sajta na telefonu)
const Usluge = lazy(() => import('./pages/Usluge'))
const ONama = lazy(() => import('./pages/ONama'))
const Galerija = lazy(() => import('./pages/Galerija'))
const Kontakt = lazy(() => import('./pages/Kontakt'))
const Zakazi = lazy(() => import('./pages/Zakazi'))
const VaucerNarudzba = lazy(() => import('./pages/VaucerNarudzba'))
const Osoblje = lazy(() => import('./pages/Osoblje'))
const MojGrasak = lazy(() => import('./pages/MojGrasak'))
const Objave = lazy(() => import('./pages/Objave'))
const Objava = lazy(() => import('./pages/Objava'))

function Ucitavanje() {
  return <div className="flex min-h-[60vh] items-center justify-center text-ink/50">Učitavam...</div>
}

export default function App() {
  return (
    <Suspense fallback={<Ucitavanje />}>
      <Routes>
        <Route path="panel" element={<Osoblje />} />
        <Route path="admin" element={<Navigate to="/panel" replace />} />
        <Route path="osoblje" element={<Navigate to="/panel" replace />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="usluge" element={<Usluge />} />
          <Route path="o-nama" element={<ONama />} />
          <Route path="galerija" element={<Galerija />} />
          <Route path="kontakt" element={<Kontakt />} />
          <Route path="zakazi" element={<Zakazi />} />
          <Route path="vaucer" element={<VaucerNarudzba />} />
          <Route path="moj" element={<MojGrasak />} />
          {/* objave: crnogorski /objave, ostali jezici /en|ru|tr/objave (iste adrese služi i Vercel funkcija za Google) */}
          {['', 'en/', 'ru/', 'tr/'].map((prefiks) => [
            <Route key={prefiks + 'l'} path={prefiks + 'objave'} element={<Objave />} />,
            <Route key={prefiks + 'p'} path={prefiks + 'objave/:slug'} element={<Objava />} />,
          ])}
        </Route>
      </Routes>
    </Suspense>
  )
}
