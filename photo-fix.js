(()=>{
  const q=s=>document.querySelector(s);

  async function compressPhoto(file){
    if(!file) return '';
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('Lecture de la photo impossible'));
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{
          try{
            const size=Math.min(img.naturalWidth||img.width,img.naturalHeight||img.height);
            const sx=Math.max(0,((img.naturalWidth||img.width)-size)/2);
            const sy=Math.max(0,((img.naturalHeight||img.height)-size)/2);
            const canvas=document.createElement('canvas');
            canvas.width=320;canvas.height=320;
            const ctx=canvas.getContext('2d');
            ctx.drawImage(img,sx,sy,size,size,0,0,320,320);
            resolve(canvas.toDataURL('image/jpeg',0.72));
          }catch(e){reject(e)}
        };
        img.onerror=()=>reject(new Error('Format de photo non pris en charge'));
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const saveBtn=q('#saveChild');
  if(saveBtn){
    saveBtn.onclick=async()=>{
      const name=q('#nameInput').value.trim();
      if(!name) return alert('Entre un prénom.');
      const kind=q('#kindInput').value;
      const file=q('#photoInput').files[0];
      const oldText=saveBtn.textContent;
      saveBtn.disabled=true;
      saveBtn.textContent=file?'Préparation de la photo…':'Enregistrement…';
      try{
        let photo='';
        if(file) photo=await compressPhoto(file);
        if(editId){
          const c=state.children.find(x=>x.id===editId);
          if(!c) throw new Error('Profil introuvable');
          c.name=name;c.kind=kind;if(photo)c.photo=photo;
          addHistory(`${name} : profil modifié`);
        }else{
          state.children.push({id:uid(),name,kind,photo:photo||'',present:true,midi:0,soir:0,stars:0,last:[]});
          addHistory(`${name} ajouté`);
        }
        q('#childModal').classList.remove('open');
        persist();
      }catch(e){
        console.error(e);
        alert('Impossible d’enregistrer cette photo. Essaie une autre photo ou prends-en une nouvelle avec l’appareil photo.');
      }finally{
        saveBtn.disabled=false;saveBtn.textContent=oldText;
      }
    };
  }

  const style=document.createElement('style');
  style.textContent=`
    .faceFX{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;background:rgba(20,35,55,.22);pointer-events:none;opacity:0;transition:opacity .15s ease}
    .faceFX.show{opacity:1}.fxStage{position:relative;width:260px;height:330px;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .fxHead{position:relative;width:190px;height:190px;filter:drop-shadow(0 18px 28px rgba(0,0,0,.18));transform-origin:center}
    .fxPhoto{width:190px;height:190px;border-radius:50%;object-fit:cover;border:7px solid white;background:#e7eef7;display:block}
    .fxEyes,.fxMouth,.fxBlush,.fxHorns,.fxCrown,.fxStars{position:absolute;left:50%;transform:translateX(-50%);z-index:3;user-select:none}
    .fxEyes{top:58px;width:116px;display:flex;justify-content:space-between;font-size:30px;text-shadow:0 2px 4px rgba(255,255,255,.9)}
    .fxMouth{top:110px;font-size:34px}.fxBlush{top:106px;width:138px;display:flex;justify-content:space-between;font-size:24px;opacity:.9}
    .fxHorns{top:-20px;font-size:58px;opacity:0;transform:translateX(-50%) scale(.2)}
    .fxCrown{top:-46px;font-size:60px}.fxStars{top:-42px;width:250px;text-align:center;font-size:30px;letter-spacing:10px;opacity:0}
    .fxCaption{margin-top:22px;background:white;border-radius:22px;padding:11px 18px;font-weight:950;font-size:24px;color:#17365d;box-shadow:0 12px 30px rgba(0,0,0,.15)}
    .fxSub{margin-top:7px;color:white;font-weight:850;text-shadow:0 2px 8px rgba(0,0,0,.35)}
    .faceFX.half .fxHead{animation:fxHalf 1.15s ease}.faceFX.half .fxEyes{animation:blinkBig .9s ease}.faceFX.half .fxMouth{animation:mouthPop .8s ease}
    .faceFX.full .fxHead{animation:fxSquish 1.15s ease}.faceFX.full .fxEyes{animation:eyesWide .9s ease}.faceFX.full .fxMouth{animation:mouthPop .75s ease}
    .faceFX.suspense .fxHead{animation:fxNervous 1.2s ease}.faceFX.suspense .fxEyes{animation:eyesWide 1s ease}.faceFX.suspense .fxBlush{animation:blushIn 1s ease}
    .faceFX.devil .fxHead{animation:fxDevil 1.35s cubic-bezier(.2,.8,.2,1)}.faceFX.devil .fxHorns{animation:hornGrow .75s .28s ease forwards}.faceFX.devil .fxEyes{animation:evilEyes 1.2s ease}.faceFX.devil .fxMouth{animation:devilMouth 1.1s ease}
    .faceFX.good .fxHead{animation:fxHappy 1.2s ease}.faceFX.good .fxStars{animation:starBurst 1.1s ease forwards}.faceFX.good .fxBlush{animation:blushIn 1s ease}.faceFX.good .fxCrown{animation:crownBounce 1s ease}
    @keyframes fxHalf{0%,100%{transform:rotate(0) scale(1)}35%{transform:rotate(-7deg) scaleX(1.04) scaleY(.98)}65%{transform:rotate(5deg) scaleX(.98) scaleY(1.03)}}
    @keyframes fxSquish{0%,100%{transform:scale(1)}28%{transform:scaleX(1.12) scaleY(.88)}55%{transform:scaleX(.94) scaleY(1.09)}78%{transform:scale(1.03)}}
    @keyframes fxNervous{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-7px) rotate(-2deg)}40%{transform:translateX(7px) rotate(2deg)}60%{transform:translateX(-5px) rotate(-1deg)}80%{transform:translateX(5px) rotate(1deg)}}
    @keyframes fxDevil{0%{transform:scale(1);filter:none}30%{transform:scaleX(1.13) scaleY(.88) rotate(-3deg)}55%{transform:scaleX(.92) scaleY(1.12) rotate(3deg)}100%{transform:scale(1);filter:saturate(1.12) contrast(1.04)}}
    @keyframes fxHappy{0%,100%{transform:scale(1) rotate(0)}30%{transform:scale(1.08) rotate(-4deg)}58%{transform:scale(1.12) rotate(4deg)}80%{transform:scale(1.04) rotate(-2deg)}}
    @keyframes blinkBig{0%,100%{transform:scaleY(1)}45%{transform:scaleY(.18)}60%{transform:scaleY(1.35)}}
    @keyframes eyesWide{0%{transform:scale(.7);opacity:.2}45%{transform:scale(1.35);opacity:1}100%{transform:scale(1)}}
    @keyframes evilEyes{0%{transform:rotate(0) scale(.8)}50%{transform:rotate(-7deg) scale(1.15)}100%{transform:rotate(0) scale(1)}}
    @keyframes mouthPop{0%{transform:translateX(-50%) scale(.25)}55%{transform:translateX(-50%) scale(1.35)}100%{transform:translateX(-50%) scale(1)}}
    @keyframes devilMouth{0%{transform:translateX(-50%) scale(.5)}55%{transform:translateX(-50%) scale(1.3) rotate(8deg)}100%{transform:translateX(-50%) scale(1)}}
    @keyframes blushIn{0%{opacity:0;transform:translateX(-50%) scale(.5)}50%{opacity:1;transform:translateX(-50%) scale(1.25)}100%{opacity:.9;transform:translateX(-50%) scale(1)}}
    @keyframes hornGrow{0%{opacity:0;transform:translateX(-50%) scale(.15) translateY(30px)}70%{opacity:1;transform:translateX(-50%) scale(1.2) translateY(-4px)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
    @keyframes starBurst{0%{opacity:0;transform:translateX(-50%) scale(.3) rotate(-15deg)}45%{opacity:1;transform:translateX(-50%) scale(1.25) rotate(8deg)}100%{opacity:.2;transform:translateX(-50%) scale(1.6) rotate(18deg)}}
    @keyframes crownBounce{0%,100%{transform:translateX(-50%) translateY(0) rotate(0)}35%{transform:translateX(-50%) translateY(-18px) rotate(-8deg)}60%{transform:translateX(-50%) translateY(2px) rotate(7deg)}}
  `;
  document.head.appendChild(style);

  const fx=document.createElement('div');
  fx.className='faceFX';
  fx.innerHTML=`<div class="fxStage"><div class="fxHead"><div class="fxCrown"></div><div class="fxHorns"></div><img class="fxPhoto"><div class="fxEyes"></div><div class="fxBlush"></div><div class="fxMouth"></div><div class="fxStars"></div></div><div class="fxCaption"></div><div class="fxSub"></div></div>`;
  document.body.appendChild(fx);

  function animateFace(c,type,sub=''){
    const photo=fx.querySelector('.fxPhoto');
    photo.src=c.photo||avatar(c.name);
    fx.className='faceFX show '+type;
    const eyes=fx.querySelector('.fxEyes'),mouth=fx.querySelector('.fxMouth'),blush=fx.querySelector('.fxBlush'),horns=fx.querySelector('.fxHorns'),crown=fx.querySelector('.fxCrown'),stars=fx.querySelector('.fxStars');
    eyes.innerHTML='';mouth.textContent='';blush.innerHTML='';horns.textContent='';crown.textContent='';stars.textContent='';
    let caption='Oups !';
    if(type==='half'){eyes.innerHTML='<span>👀</span><span>👀</span>';mouth.textContent='😮';caption='Petit oups !';crown.textContent='👑'}
    if(type==='full'){eyes.innerHTML='<span>😳</span><span>😳</span>';mouth.textContent='😬';caption='Oups !';crown.textContent='👑'}
    if(type==='suspense'){eyes.innerHTML='<span>👀</span><span>👀</span>';mouth.textContent='😟';blush.innerHTML='<span>🩷</span><span>🩷</span>';caption='Oh oh…'}
    if(type==='devil'){eyes.innerHTML='<span>😈</span><span>😈</span>';mouth.textContent='😼';horns.textContent='😈';caption='Seuil atteint !'}
    if(type==='good'){eyes.innerHTML='<span>😊</span><span>😊</span>';mouth.textContent='😁';blush.innerHTML='<span>🩷</span><span>🩷</span>';stars.textContent='✨⭐✨';crown.textContent=(c.midi===0&&c.soir===0)?'👑':'';caption='Bravo ! ⭐'}
    fx.querySelector('.fxCaption').textContent=caption;
    fx.querySelector('.fxSub').textContent=sub;
    clearTimeout(animateFace.t);animateFace.t=setTimeout(()=>{fx.className='faceFX'},1450);
  }

  const oldBad=window.bad;
  if(typeof oldBad==='function'){
    window.bad=(id,p,amount=1)=>{
      const c=state.children.find(x=>x.id===id); if(!c)return;
      oldBad(id,p,amount);
      const total=c[p],th=state.settings.threshold;
      let type=amount===.5?'half':'full';
      if(total>=th) type='devil'; else if(total>=th-.5) type='suspense';
      setTimeout(()=>animateFace(c,type,`${c.name} • ${fmt(total)} / ${th}`),40);
    };
  }
  const oldGood=window.good;
  if(typeof oldGood==='function'){
    window.good=id=>{
      const c=state.children.find(x=>x.id===id); if(!c)return;
      oldGood(id);
      setTimeout(()=>animateFace(c,'good',`${c.name} • bonne action`),40);
    };
  }
})();