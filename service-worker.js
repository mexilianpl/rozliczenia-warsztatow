const CACHE_NAME = "rozliczenia-ui-v11.5";

const STATIC_FILES = [
 "./",
 "./index.html",
 "./style.css?v=115",
 "./core.js?v=115",
 "./reports.js?v=115",
 "./signups.js?v=115",
 "./settings.js?v=115",
 "./payments.js?v=115",
 "./groups.js?v=115",
 "./lists.js?v=115",
 "./dashboard.js?v=115",
 "./attendance.js?v=115",
 "./children.js?v=115",
 "./income.js?v=115",
 "./ui.js?v=115",
 "./manifest.webmanifest",
 "./icon-192.png",
 "./icon-512.png",
 "./logo-centrum-kreatywnosci.png"
];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(STATIC_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;

  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin)return;

  if(e.request.mode==="navigate"){
    e.respondWith(
      fetch(e.request)
        .then(r=>{
          const x=r.clone();
          caches.open(CACHE_NAME).then(c=>c.put("./index.html",x));
          return r;
        })
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached=>
      cached || fetch(e.request).then(r=>{
        const x=r.clone();
        caches.open(CACHE_NAME).then(c=>c.put(e.request,x));
        return r;
      })
    )
  );
});
