// Light Dial offline support. Change the version name whenever you upload a new copy.
const CACHE = "light-left-v5";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192-v2.png", "icon-512-v2.png", "icon-maskable-512-v2.png", "apple-touch-icon-v2.png", "favicon-v2.png", "privacy.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Show the saved copy straight away, and quietly fetch a fresh one for next time.
// Only this site and its fonts are saved; live data such as the weather always comes fresh.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const host = new URL(e.request.url).hostname;
  if (host !== self.location.hostname && !host.endsWith("fonts.googleapis.com") && !host.endsWith("fonts.gstatic.com")) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const saved = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(e.request, res.clone());
      return res;
    }).catch(() => saved);
    return saved || fresh;
  }));
});
