const VERSION = "quant-course-20260812163542779";
const CORE = ["/", "/offline.html", "/manifest.webmanifest", "/app-icon.svg", "/python-worker.mjs"];

self.addEventListener("install", event => event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("quant-course-") && key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim())));

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => { const clone=response.clone();caches.open(VERSION).then(cache=>cache.put("/",clone));return response; }).catch(async()=>await caches.match(request) || await caches.match("/") || await caches.match("/offline.html")));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if(response.ok && (url.pathname.startsWith("/course-assets/") || url.pathname.startsWith("/_next/static/"))){const clone=response.clone();caches.open(VERSION).then(cache=>cache.put(request,clone));}return response; })));
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_OFFLINE") event.waitUntil(caches.delete(VERSION).then(()=>caches.open(VERSION).then(cache=>cache.addAll(CORE))).then(()=>event.source?.postMessage({type:"OFFLINE_CLEARED"})));
  if (event.data?.type === "CACHE_COURSE") event.waitUntil((async()=>{
    const response=await fetch("/offline-assets.json");const assets=await response.json();const cache=await caches.open(VERSION);let done=0;
    for(const asset of assets){try{await cache.add(asset);}catch{}done+=1;if(done%10===0||done===assets.length)event.source?.postMessage({type:"CACHE_PROGRESS",done,total:assets.length});}
    event.source?.postMessage({type:"CACHE_COMPLETE",total:assets.length,version:VERSION});
  })());
});
