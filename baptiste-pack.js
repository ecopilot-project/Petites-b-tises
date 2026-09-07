(()=>{
  const BASE='./Asset/Baptiste/';
  const files={zero:'baptiste-zero-hq.webp',half:'baptiste-half-hq.webp',one:'baptiste-one-hq.webp',two:'baptiste-two-hq.webp',three:'baptiste-three-hq.webp',good:'baptiste-good-hq.webp',birthday:'baptiste-birthday-hq.webp'};
  const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let overlay;
  function ui(){
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='baptisteAnim';
    overlay.style='position:fixed;inset:0;z-index:29000;background:#18304a66;backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:18px';
    overlay.innerHTML='<div style="background:white;border-radius:34px;padding:16px;width:min(92vw,430px);text-align:center;box-shadow:0 30px 90px #0004"><div style="aspect-ratio:1;border-radius:26px;overflow:hidden;background:#eef2f7"><img id="baptisteAnimImg" style="width:100%;height:100%;object-fit:cover"></div><div id="baptisteAnimTitle" style="font:950 31px/1.05 system-ui;color:#17365d;margin-top:12px"></div><div id="baptisteAnimSub" style="font:16px system-ui;color:#718096;margin-top:5px"></div></div>';
    document.body.appendChild(overlay);return overlay;
  }
  function stateFor(n){if(n>=3)return'three';if(n>=2)return'two';if(n>=1)return'one';if(n>=.5)return'half';return'zero'}
  async function play(kind,title,sub){
    const o=ui(),img=o.querySelector('#baptisteAnimImg');
    o.querySelector('#baptisteAnimTitle').textContent=title;o.querySelector('#baptisteAnimSub').textContent=sub||'';
    img.src=BASE+files[kind];o.style.display='flex';
    try{o.firstElementChild.animate([{opacity:0,transform:'scale(.9)'},{opacity:1,transform:'scale(1)'}],{duration:260,easing:'ease-out'})}catch{}
    await new Promise(r=>setTimeout(r,kind==='birthday'?3600:2600));o.style.display='none';
  }
  window.BaptistePack={playBirthday:()=>play('birthday','Joyeux anniversaire Baptiste ! 🎂','Aujourd’hui, c’est ta journée 🎉')};
  const bad0=window.bad,good0=window.good;
  window.bad=(id,p,amount=1)=>{
    const c=state.children.find(x=>x.id===id);if(!c||norm(c.name)!=='baptiste')return bad0?.(id,p,amount);
    c.last.push(snapshot(c));c[p]=Math.min(state.settings.threshold,c[p]+amount);addHistory(`${c.name} : +${amount===.5?'½':'1'} bêtise (${p})`);persist();
    const total=c[p],st=stateFor(total);let title=amount===.5?'Petit oups ! 😯':'Oups ! 😬',sub=`Baptiste : ${fmt(total)} / ${state.settings.threshold} (${p==='midi'?'midi':'soir'})`;
    if(total>=3){title='Oh oh… 😈';sub=`3 bêtises : pas de ${state.settings.reward}`}else if(total>=2){title='Attention… 😠';sub=`${fmt(total)} / ${state.settings.threshold} — plus qu’une !`}
    play(st,title,sub).catch(()=>{});
  };
  window.good=id=>{
    const c=state.children.find(x=>x.id===id);if(!c||norm(c.name)!=='baptiste')return good0?.(id);
    c.last.push(snapshot(c));c.stars++;addHistory(`${c.name} : ⭐ bonne action`);persist();play('good','Bravo Baptiste ! ⭐','Super bonne action').catch(()=>{});
  };
})();
