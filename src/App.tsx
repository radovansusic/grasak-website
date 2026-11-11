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
          {/* /kutak, /kutak/<slug>, /kutak/tema/<rubrika>, /kutak/oznaka/<oznaka> (i /en, /ru, /tr) isporučuje Vercel funkcija api/kutak.js, ne ovaj ruter */}
        </Route>
      </Routes>
    </Suspense>
  )
}
