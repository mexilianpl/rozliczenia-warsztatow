const CACHE_NAME = "rozliczenia-ui-v11.8";

const STATIC_FILES = [
 "./",
 "./index.html",
 "./style.css?v=118",
 "./core.js?v=118",
 "./sync.js?v=118",
 "./reports.js?v=118",
 "./signups.js?v=118",
 "./settings.js?v=118",
 "./payments.js?v=118",
 "./groups.js?v=118",
 "./lists.js?v=118",
 "./dashboard.js?v=118",
 "./attendance.js?v=118",
 "./children.js?v=118",
 "./income.js?v=118",
 "./ui.js?v=118",
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
