const CACHE='petites-betises-v26';
const SCRIPTS=['photo-fix.js','face-v8.js','romane-pack.js','nora-pack.js','baptiste-pack.js','sloan-pack.js','raphael-pack.js','birthday.js'];
const ASSETS=['./','./index.html','./manifest.webmanifest','./nora-photo-originale.webp',...SCRIPTS.map(f=>'./'+f+'?v=26'),...['zero','half','one','two','three','good','birthday'].flatMap(kind=>['./Asset/Nora/nora-'+kind+'-hq.webp','./Asset/Baptiste/baptiste-'+kind+'-hq.webp','./Asset/Sloan/sloan-'+kind+'-hq.webp','./Asset/Raphael/raphael-'+kind+'-hq.webp'])];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('petites-betises-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function injectFix(response){
  let body=await response.text();
  for(const f of SCRIPTS)if(!body.includes(f))body=body.replace('</body>',`<script src="./${f}?v=26"></script></body>`);
  return new Response(body,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, max-age=0'}});
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')){
    event.respondWith(fetch(event.request,{cache:'reload'}).then(response=>response.ok?injectFix(response):Promise.reject(new Error('Navigation failed'))).catch(async()=>{
      const cached=await caches.match('./index.html');
      return cached?injectFix(cached):Response.error();
    }));return;
  }
  const response=fetch(event.request,{cache:'reload'});
  event.waitUntil(response.then(async result=>{if(result.ok){const cache=await caches.open(CACHE);await cache.put(event.request,result.clone());}}).catch(()=>{}));
  event.respondWith(response.catch(async()=>await caches.match(event.request)||Response.error()));
});
