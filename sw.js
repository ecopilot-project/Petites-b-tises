const CACHE='petites-betises-v5';
const ASSETS=['./','./index.html','./manifest.webmanifest','./photo-fix.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function injectFix(response){
  const text=await response.text();
  const body=text.includes('photo-fix.js')?text:text.replace('</body>','<script src="./photo-fix.js?v=5"></script></body>');
  return new Response(body,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'||url.pathname.endsWith('/index.html')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(injectFix).catch(async()=>{
      const cached=await caches.match('./index.html');
      return cached?injectFix(cached):Response.error();
    }));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response}).catch(()=>caches.match(event.request)));
});