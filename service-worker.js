const CACHE_NAME = "rozliczenia-ui-v11.1";

const STATIC_FILES = [
 "./",
 "./index.html",
 "./style.css?v=111",
 "./app.js?v=88",
 "./legacy-workflows.js?v=111",
 "./reports.js?v=110",
 "./signups.js?v=110",
 "./settings.js?v=110",
 "./payments.js?v=102",
 "./dashboard.js?v=101",
 "./groups.js?v=109",
 "./lists.js?v=109",
 "./attendance.js?v=108",
 "./children.js?v=107",
 "./income.js?v=107",
 "./ui.js?v=108",
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
