// Impavidus Lab – app-shell cache only. Personal/API data is never cached here.
const V='impavidus-shell-v4',FILES=['./','./index.html','./frontend/app.js','./frontend/styles.css','./frontend/repository.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('/api/'))return;
  const shell=FILES.some(f=>new URL(f,self.registration.scope).pathname===u.pathname);
  if(!shell&&e.request.mode!=='navigate')return;
  e.respondWith(fetch(e.request).then(r=>{
    if(r.ok&&shell){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}
    return r;
  }).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html'):undefined))));
});
