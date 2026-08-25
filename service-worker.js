const CACHE_NAME = "rozliczenia-ui-v9.2";
const STATIC_FILES = [
 "./","./index.html","./style.css?v=88","./v89.css?v=89","./v90.css?v=90",
 "./app.js?v=88","./attendance-fix.js?v=1","./v89.js?v=89","./v90.js?v=90","./v92.js?v=92",
 "./manifest.webmanifest","./icon-192.png","./icon-512.png"
];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(STATIC_FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;
 if(e.request.mode==="navigate"){
   e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE_NAME).then(c=>c.put("./index.html",x));return r}).catch(()=>caches.match("./index.html")));return;
 }
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE_NAME).then(k=>k.put(e.request,x));return r})));
});
