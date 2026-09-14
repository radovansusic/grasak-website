import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Usluge from './pages/Usluge'
import ONama from './pages/ONama'
import Galerija from './pages/Galerija'
import Kontakt from './pages/Kontakt'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="usluge" element={<Usluge />} />
        <Route path="o-nama" element={<ONama />} />
        <Route path="galerija" element={<Galerija />} />
        <Route path="kontakt" element={<Kontakt />} />
      </Route>
    </Routes>
  )
}
