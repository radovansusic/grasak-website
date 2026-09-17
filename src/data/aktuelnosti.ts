// AKTUELNOSTI — novosti, akcije, najave, događaji, zanimljivosti.
// Kako dodati novu objavu: dopišite novi objekat NA VRH niza (najnovije prvo).
//   tag: 'akcija' | 'najava' | 'dogadjaj' | 'zanimljivost'
//   pin: true  -> istaknuta objava (velika kartica na vrhu)
//   image: opciono, npr. '/mural.jpg'
// Deploy: git commit + push -> Vercel sam objavi za ~2 minuta.

export interface Aktuelno {
  date: string // ISO: '2026-09-16'
  tag: 'akcija' | 'najava' | 'dogadjaj' | 'zanimljivost'
  title: string
  text: string
  image?: string
  pin?: boolean
}

export const AKTUELNOSTI: Aktuelno[] = [
  {
    date: '2026-09-15',
    tag: 'najava',
    title: 'Novi sajt je tu! 🌱',
    text: 'Nakon mjeseci rada, Grašak ima novi, brži i ljepši sajt — na 4 jezika, sa online zakazivanjem preko WhatsApp-a, poklon vaučerima i galerijom osmjeha. Šetajte, uživajte i javite nam utiske!',
    image: '/mural.jpg',
    pin: true,
  },
  {
    date: '2026-09-10',
    tag: 'akcija',
    title: 'Poklon vaučeri — poklon koji se pamti',
    text: 'Tražite poklon za rođendan, krštenje ili prvi dan u vrtiću? Naš vaučer "Nova frizura, na poklon" dolazi upakovan, na ime djeteta — Šišanje ili Prvo šišanje sa diplomom. Važi 12 mjeseci.',
  },
  {
    date: '2026-09-01',
    tag: 'zanimljivost',
    title: 'Da li ste znali? ✂️',
    text: 'Kosa djetetu raste brže nego odraslome — i do 30% brže u prvim godinama! Zato frizura "drži" kraće, a redovno šišanje svakih 4-6 sedmica održava oblik i zdravlje kose.',
  },
  {
    date: '2026-08-20',
    tag: 'dogadjaj',
    title: 'Preko 5000 srećnih glavica! 🎉',
    text: 'Hvala vam — više od 5000 djece je prošlo kroz naše autiće od otvaranja. Svaki osmjeh je dokaz da šišanje ne mora biti stres. Vidimo se i u narednih 5000!',
  },
]
