/* Spirit Notes – Service Worker: App läuft auch offline */
const CACHE = 'spirit-notes-1.2.1';
const ASSETS = [
    "./",
    "css/app.css",
    "css/editor.css",
    "css/fonts.css",
    "css/mobile.css",
    "css/views.css",
    "fonts/Lora-Italic-Variable.ttf",
    "fonts/Lora-Variable.ttf",
    "fonts/Poppins-Bold.ttf",
    "fonts/Poppins-Light.ttf",
    "fonts/Poppins-Medium.ttf",
    "fonts/Poppins-Regular.ttf",
    "fonts/SpiritScript.woff",
    "fonts/SpiritSerif-Bold.woff",
    "fonts/SpiritSerif-Regular.woff",
    "icons/favicon-64.png",
    "icons/icon-180.png",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "index.html",
    "js/app.js",
    "js/editor.js",
    "js/graph.js",
    "js/icons.js",
    "js/mobile.js",
    "js/notes.js",
    "js/palette.js",
    "js/rewards.js",
    "js/sidebar.js",
    "js/store.js",
    "js/sync.js",
    "js/themes.js",
    "js/util.js",
    "js/views/anime.js",
    "js/views/gallery.js",
    "js/views/home.js",
    "js/views/overview.js",
    "js/views/planner.js",
    "js/views/settings.js",
    "manifest.webmanifest",
    "vendor/marked.umd.js",
    "vendor/qrcode.js",
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  // Netzwerk zuerst (immer aktuell, am Browser-Cache vorbei), sonst aus dem Cache (offline)
  e.respondWith(fetch(e.request.url, { cache: 'no-cache' }).then(r => {
    if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
