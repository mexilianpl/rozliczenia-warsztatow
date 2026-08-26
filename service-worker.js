const CACHE_NAME = "rozliczenia-ui-v12.2";

const STATIC_FILES = [
 "./",
 "./index.html",
 "./style.css?v=122",
 "./core.js?v=122",
 "./sync.js?v=122",
 "./reports.js?v=122",
 "./signups.js?v=122",
 "./settings.js?v=122",
 "./payments.js?v=122",
 "./groups.js?v=122",
 "./lists.js?v=122",
 "./dashboard.js?v=122",
 "./attendance.js?v=122",
 "./children.js?v=122",
 "./income.js?v=122",
 "./ui.js?v=122",
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
