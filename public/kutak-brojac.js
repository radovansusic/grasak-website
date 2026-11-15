// Graškov kutak (P18): čitanje se broji jednom u 6 sati po tekstu, "sviđa mi se" jednom po tekstu.
// Bez baze na serveru (ukljucen:false) dugme ostaje skriveno i ništa se ne šalje. Greška nikad ne dira stranu.
(function () {
  var dugme = document.querySelector('.svidja[data-slug]')
  if (!dugme || !window.fetch) return
  var slug = dugme.getAttribute('data-slug')
  var cit = document.querySelector('.citanja')
  var nEl = dugme.querySelector('.n')
  var lang = document.documentElement.lang || ''
  var oblici = []
  try { oblici = JSON.parse(cit && cit.getAttribute('data-oblici') || '[]') } catch (e) { oblici = [] }
  // oblici za 1, 2, 5, 11, 21 (iz servera, po jeziku strane)
  function rijec(n) {
    if (oblici.length < 5) return ''
    if (/^ru/.test(lang) || /^sr/.test(lang)) {
      var d = n % 10, s = n % 100
      if (d === 1 && s !== 11) return oblici[0]
      if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return oblici[1]
      return oblici[2]
    }
    return n === 1 ? oblici[0] : oblici[1]
  }
  function prikazi(j) {
    if (!j || !j.ok || !j.ukljucen) return
    dugme.hidden = false
    nEl.textContent = j.l > 0 ? String(j.l) : ''
    if (cit && j.c > 0) { cit.textContent = j.c + ' ' + rijec(j.c); cit.hidden = false }
  }
  function mem(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v) } catch (e) { return null } }
  function posalji(vrsta) {
    return fetch('/api/brojac', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: slug, vrsta: vrsta }), keepalive: true })
      .then(function (r) { return r.json() }).catch(function () { return null })
  }
  if (mem('kutak:l:' + slug)) dugme.setAttribute('aria-pressed', 'true')
  var kc = 'kutak:c:' + slug, sad = Date.now(), bilo = Number(mem(kc) || 0)
  var poziv = sad - bilo > 6 * 3600 * 1000
    ? posalji('citanje').then(function (j) { if (j && j.ok) mem(kc, String(sad)); return j })
    : fetch('/api/brojac?slug=' + encodeURIComponent(slug)).then(function (r) { return r.json() }).catch(function () { return null })
  poziv.then(prikazi)
  dugme.addEventListener('click', function () {
    if (dugme.getAttribute('aria-pressed') === 'true') return
    dugme.setAttribute('aria-pressed', 'true')
    mem('kutak:l:' + slug, '1')
    posalji('svidja').then(prikazi)
  })
})()
