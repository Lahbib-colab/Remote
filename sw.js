/* MG Remote : mise en cache de l'interface pour un lancement instantané, même sans réseau (la liaison WebSocket, elle, n'est jamais mise en cache). */
const V = "mg-remote-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (/\/(healthz|diag|proxy)$/.test(u.pathname)) return; // état du serveur local : jamais depuis le cache
  /* réseau d'abord (nouvelle version dès qu'elle existe), cache en secours */
  e.respondWith(fetch(r).then(res => { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || caches.match("./index.html"))));
});
