const CACHE_NAME = "rozliczenia-ui-v11.4";

const STATIC_FILES = [
 "./",
 "./index.html",
 "./style.css?v=111",
 "./core.js?v=114",
 "./reports.js?v=114",
 "./signups.js?v=114",
 "./settings.js?v=114",
 "./payments.js?v=114",
 "./groups.js?v=114",
 "./lists.js?v=114",
 "./dashboard.js?v=114",
 "./attendance.js?v=114",
 "./children.js?v=114",
 "./income.js?v=114",
 "./ui.js?v=114",
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
