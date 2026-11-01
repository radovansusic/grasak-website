// Grašak panel: service worker samo za obavještenja na telefonu (ne kešira ništa).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((prozori) => {
    for (const p of prozori) if (p.url.includes('/panel')) return p.focus();
    return self.clients.openWindow('/panel');
  }));
});
