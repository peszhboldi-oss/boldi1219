// Versioned, immutable app shell. API and personal records stay out of CacheStorage.
const V='impavidus-shell-v15',FILES=['./','./index.html','./frontend/app.js','./frontend/styles.css','./frontend/repository.js','./frontend/modules.js','./frontend/offline.js','./frontend/domain.mjs','./frontend/charts.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)))});
// Every open tab must acknowledge that its forms and outbox are safe to reload.
let updateCheck=null;
self.addEventListener('message',e=>{
  if(e.data?.type==='UPDATE_STATUS'&&updateCheck?.nonce===e.data.nonce&&updateCheck.ids.has(e.source?.id)){
    updateCheck.answers.set(e.source.id,e.data.safe===true);
    if(updateCheck.answers.size===updateCheck.ids.size)updateCheck.finish();
  }
  if(e.data?.type==='APPLY_UPDATE')e.waitUntil((async()=>{
    if(updateCheck)return;
    const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const nonce=crypto.randomUUID(),answers=new Map(),ids=new Set(tabs.map(t=>t.id));
    await new Promise(resolve=>{const timer=setTimeout(resolve,3000);updateCheck={nonce,answers,ids,finish:()=>{clearTimeout(timer);resolve();}};for(const tab of tabs)tab.postMessage({type:'CHECK_UPDATE',nonce});if(!ids.size)updateCheck.finish();});
    const safe=answers.size===ids.size&&[...answers.values()].every(Boolean);updateCheck=null;
    if(safe)await self.skipWaiting();else e.source?.postMessage({type:'UPDATE_BLOCKED'});
  })());
});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('impavidus-shell-')&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;
  const shell=FILES.some(f=>new URL(f,self.registration.scope).pathname===u.pathname);if(!shell&&e.request.mode!=='navigate')return;
  e.respondWith(caches.open(V).then(async c=>(await c.match(e.request))||(e.request.mode==='navigate'?await c.match('./index.html'):null)||fetch(e.request)));
});
