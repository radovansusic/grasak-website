// Preuzima slike u public/ prije vite build-a (Vercel build korak).
// Ilustracije: javni URL-ovi; stvarne foto: grasaksalon.me.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PUB = join(process.cwd(), 'public')
mkdirSync(PUB, { recursive: true })

const K = (hash, name) =>
  `https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F${hash}?filename=${name}&sig=SIG&t=o`

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
  'mural.jpg': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F5305c5eef62896ad00e91c46e864a15b1e7a7917c6943d8d6cc62d196231cd68?filename=mural.jpg&sig=m4druEFkJKRVqOeBktEkPfc0kzoo-t-6DzrYLWxOCBg=&t=o',
  'real-zadovoljni.jpg': 'https://grasaksalon.me/images/zadovoljni.jpg',
  'real-tri_za_ustedu.jpg': 'https://grasaksalon.me/images/tri_za_ustedu.jpg',
  'real-prvo_sisanje.jpg': 'https://grasaksalon.me/images/prvo_sisanje.jpg',
  'real-nikola.jpg': 'https://grasaksalon.me/images/nikola.jpg',
  'logo.png': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Feafb28733741d34d7ddb89db008bbf298edb0c6c823df8698e9454f2cfab55c5?filename=logo.png&sig=YDuKkSELuDQb19-cMfz_WOB1ZLLrYK96gYeAWUG-Sms=&t=o',
  'logo-footer.png': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F475588b025f589562bb916386c9fa9bb5715f434554e4f54f2b1d082869de555?filename=logo-footer.png&sig=u9JEXxNRyzADrahfMqo30kFSRF_PVeyQYR5IhW1q_kQ=&t=o',
  'logo-192.png': 'https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2Fee4045d08950c26e53a354fe99be410a9f256c72ffa6e963e98d62784d3cecf3?filename=logo-192.png&sig=4xCiDLiosklOiv7tumLjI9tyxCiFwcGD2FV5Y742pFA=&t=o',
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
if (failed) {
  console.error(`${failed} assets failed`)
  process.exit(1)
}
console.log('all assets fetched')
