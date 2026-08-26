const CACHE_NAME = "rozliczenia-ui-v12.1";

const STATIC_FILES = [
 "./",
 "./index.html",
 "./style.css?v=121",
 "./core.js?v=121",
 "./sync.js?v=121",
 "./reports.js?v=121",
 "./signups.js?v=121",
 "./settings.js?v=121",
 "./payments.js?v=121",
 "./groups.js?v=121",
 "./lists.js?v=121",
 "./dashboard.js?v=121",
 "./attendance.js?v=121",
 "./children.js?v=121",
 "./income.js?v=121",
 "./ui.js?v=121",
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
  const sameOrigin=u.origin===self.location.origin;

  if(sameOrigin && e.request.mode==="navigate"){
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

  if(sameOrigin){
    e.respondWith(
      caches.match(e.request).then(cached=>
        cached || fetch(e.request).then(r=>{
          const x=r.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request,x));
          return r;
        })
      )
    );
    return;
  }

  /*
    Biblioteki z CDN (Tesseract/XLSX) zapisujemy przy pierwszym udanym
    użyciu online. Później mogą zostać wykorzystane bez internetu.
  */
  if(u.hostname==="cdn.jsdelivr.net"){
    e.respondWith(
      caches.match(e.request).then(cached=>{
        if(cached)return cached;
        return fetch(e.request).then(r=>{
          const x=r.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request,x));
          return r;
        });
      })
    );
  }
});
