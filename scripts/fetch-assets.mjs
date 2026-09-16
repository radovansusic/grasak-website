// Priprema slike u public/ prije vite build-a.
// Primarno: dekodira deploy-assets/*.b64 (slike su u repou — nema mrežne zavisnosti).
// Rezervno: ako b64 nedostaje, pokušava preuzeti sa URL-a.
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PUB = join(process.cwd(), 'public')
const B64 = join(process.cwd(), 'deploy-assets')
mkdirSync(PUB, { recursive: true })

let decoded = 0
if (existsSync(B64)) {
  for (const f of readdirSync(B64)) {
    if (!f.endsWith('.b64')) continue
    const name = f.replace(/\.b64$/, '')
    try {
      const data = Buffer.from(readFileSync(join(B64, f), 'utf8').trim(), 'base64')
      if (data.length > 100) {
        writeFileSync(join(PUB, name), data)
        decoded++
      }
    } catch (e) {
      console.error(`decode FAIL ${name}: ${e.message}`)
    }
  }
}
console.log(`decoded ${decoded} assets from deploy-assets`)

// Rezervni URL-ovi (ako neki fajl nedostaje u deploy-assets)
const FALLBACK = {
  'real-salon.jpg': 'https://grasaksalon.me/images/salon.jpg',
  'real-oprema.jpg': 'https://grasaksalon.me/images/oprema.jpg',
  'real-zadovoljni.jpg': 'https://grasaksalon.me/images/zadovoljni.jpg',
  'real-tri_za_ustedu.jpg': 'https://grasaksalon.me/images/tri_za_ustedu.jpg',
  'real-prvo_sisanje.jpg': 'https://grasaksalon.me/images/prvo_sisanje.jpg',
  'real-nikola.jpg': 'https://grasaksalon.me/images/nikola.jpg',
}

for (const [name, url] of Object.entries(FALLBACK)) {
  const dest = join(PUB, name)
  if (existsSync(dest)) continue
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    console.log(`fallback ok ${name}`)
  } catch (e) {
    console.error(`fallback FAIL ${name}: ${e.message}`)
  }
}
console.log('assets ready')
