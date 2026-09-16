// Preuzima slike u public/ prije vite build-a (Vercel build korak).
// Ilustracije: javni URL-ovi; stvarne foto: grasaksalon.me.
// NAPOMENA: ako neka slika ne uspije, build se NE prekida (sajt se deploya bez nje).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PUB = join(process.cwd(), 'public')
mkdirSync(PUB, { recursive: true })

const ASSETS = {
  'hero-kid.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F6a8878f3076ba1d1f146557f109ef57d2890985f6e86a27108ba48a030266fbb?filename=hero-kid.jpg&sig=0N0FMRRqe_XD3zBM5sWRpzO5cnGvthbmyDpflKZxyxM=&t=o',
  'about-salon.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F432df8fc2b0527297d6300a46c22e715ae13db6804be5a4be9ddead811ee7a95?filename=about-salon.jpg&sig=YRXGD-2casigS0KOR2Ro7N59XFsh1TWCjknl-46OrXI=&t=o',
  'first-haircut.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Ff9dd9176e700d0ba7b9f422508a0d99aa9af3a7ee0185cb24608a50704d40610?filename=first-haircut.jpg&sig=9fH-J500yUs3CHRlxNHpEbWlglovIHel9U3zVby7Tns=&t=o',
  'spa-treatment.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Fcffda6cd6f56031bed858e845052e7b07ec5fdf28bacf8da6218eb488046ec98?filename=spa-treatment.jpg&sig=bhBmafBm1SnKy_YErWWwyxEQjh1PtIAIoLUpOgOXfZo=&t=o',
  'gallery-1.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F279f3645b8441d9737de98f84c4e6a06c73a993624131267f3693ed73753b53c?filename=gallery-1.jpg&sig=GDAKlwvVSFoq_V6ngu07sU_lb6L1O8S0GGloVzoLSGU=&t=o',
  'gallery-2.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Ffb58c2dcc35de547a6cb02845fa442f4a15b3b128a5bc6f7bea51d0ab2761853?filename=gallery-2.jpg&sig=-H-1bUVGhLY0V8JdrYf1mTEWt5_kuu8c2eFWHhgWe8w=&t=o',
  'gallery-3.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F586ff49dcfa20d773550b83ea5e53edf08918d1799c0096ad0ff39258a676dcc?filename=gallery-3.jpg&sig=-f-G2dRcoIoZrNENpWZ2lu-4nA_OkrAioe5Xv9GJICI=&t=o',
  'gallery-4.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F09bb4eccb3563b26c623daa7a8d1b24fa3072bdcfaa0b47e7a9e0e1f80ba3e11?filename=gallery-4.jpg&sig=x-K5z2YnF63R_vxE7F41yDPkRIGUb_h-ZoUwqMUXmDg=&t=o',
  'gallery-5.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Ffe669fa5405fef506dec5569617b1279b10e47467075fd6c4f6f75df778dd8fa?filename=gallery-5.jpg&sig=wuEOOs0GI0ahVv1nxUw2p9qah7-7v7CZvuzg49fCugk=&t=o',
  'gallery-6.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Fcc9282631189b27097a09a4f99daa639f6ea7c444d2e0b08315c47248e2c843e?filename=gallery-6.jpg&sig=PfQ03QSb75QzGJTfGiIwi5c6wDfaZui7hQKFqljzBI0=&t=o',
  'gallery-7.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F31b8ea4b2a4a5408be30d9ff9f1bb92a0ab14b61579817734eef12c41ead0788?filename=gallery-7.jpg&sig=Dof8xFa-loRpDAbXZItKgaUY8RiSWEWMB3fCJu4q3Xs=&t=o',
  'gallery-8.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F8c4d72f3b33bb19c660431321181a1ff03ca83b19a37b1d88f37af7b19634561?filename=gallery-8.jpg&sig=NJ6pL9XgO4VLahnEHxNpga9mg5zeEIs3whGz-Mciwoc=&t=o',
  'feniranje.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Fcb4c9038ef15466548fd383fbd144b33d720d6c7205d3ff2cbd1199462f048b7?filename=feniranje.jpg&sig=ocCqUrkPBjj1oetM3_XWknErenhh46lZa6ajrsmhIgM=&t=o',
  'pribor.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F6b2b1a7f6946b2669ba8800863f0d9f1d6b35045279ac4c10a8b8f80540738ed?filename=pribor.jpg&sig=FjOV51AOZ8wdi0QLcFmBkBDTcipLSRVS_gsUu_RLY1c=&t=o',
  'card-veseli.jpg':
    'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F05afacd51c2e63a002870ba83fd835d745680c1513a44fbb1f8989e83a72ae1a?filename=card-veseli.jpg&sig=r5Gri4QXggArBD3kg6rEmP47XdcX7pTQzooaVoHinqY=&t=o',
  // stvarne fotografije salona
  'real-salon.jpg': 'https://grasaksalon.me/images/salon.jpg',
  'real-oprema.jpg': 'https://grasaksalon.me/images/oprema.jpg',
  'step1.jpg': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F50d57f374ca3261f1237fe70f9192bf4d76e19682595f3c4540007cd4e17fe0e?filename=step1.jpg&sig=VchNIsYcmt4CtAJd1XWn9qEQ7W5v-e0U6KWSnZMxLMI=&t=o',
  'step2.jpg': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F03f4f3a9fe88109976b22568b7f04a9533cff7d2680712c2fb7d663fed759f4e?filename=step2.jpg&sig=SeciSq5NIlPaSMdzkXiIguwA5kzZO-32_yBsSt6G7ic=&t=o',
  'step3.jpg': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F1eee6c73768b7d6c4a0c117e622f2b650fc547c86a9641caa1db8610e51b150a?filename=step3.jpg&sig=SOP_2zXSFrWRpvMMy7w27FPWKeKjTdUbaUa0ExXV4X0=&t=o',
  'real-recepcija.jpg': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Faa1e39b6789d232b2568a7c7d4d00c873016f94c764563d205b27f37cd2a9fef?filename=real-recepcija.jpg&sig=PvfZ9TI9Lxqxeylr3EwyR-omRjqz7VrUDxqUS_nbAqM=&t=o',
  'mural.jpg': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F5305c5eef62896ad00e91c46e864a15b1e7a7917c6943d8d6cc62d196231cd68?filename=mural.jpg&sig=m4druEFkJKRVqOeBktEkPfc0kzoo-t-6DzrYLWxOCBg=&t=o',
  'real-zadovoljni.jpg': 'https://grasaksalon.me/images/zadovoljni.jpg',
  'real-tri_za_ustedu.jpg': 'https://grasaksalon.me/images/tri_za_ustedu.jpg',
  'real-prvo_sisanje.jpg': 'https://grasaksalon.me/images/prvo_sisanje.jpg',
  'real-nikola.jpg': 'https://grasaksalon.me/images/nikola.jpg',
  'logo.png': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F9d165796adf9dff8798ea0beba5340307486a85e9df6176db79192a8396d8108?filename=logo.png&sig=y_b0iObsMEi_CcdAb7AxkBbKfxDybM9LeH9O2dHaSg4=&t=o',
  'logo-footer.png': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Ff67acf634309c2c7fb95b3a688860cf26592cdd61931def21f51c17b65b0cdba?filename=logo-footer.png&sig=ajkWXlFmVYoFm3sL1Bf63m_lLu3sHANXd2tqxd-hw8w=&t=o',
  'logo-192.png': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F2789f8a604ff79977819e6dffc3fb08dbfe7a79a7c831a6a1b376ebdd3ee3844?filename=logo-192.png&sig=C5xev9KrSxz4TfAwSBDcbEy4fHFNJHCnJ72Az6hgGHQ=&t=o',
}

let failed = 0
for (const [name, url] of Object.entries(ASSETS)) {
  const dest = join(PUB, name)
  if (existsSync(dest)) continue
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(dest, buf)
    console.log(`ok ${name} ${buf.length}b`)
  } catch (e) {
    failed++
    console.error(`FAIL ${name}: ${e.message}`)
  }
}
if (failed) console.error(`${failed} assets failed — build se nastavlja bez njih`)
console.log('assets ready')
