(()=>{
  const W=320,H=320;
  let landmarkerPromise=null;

  async function getLandmarker(){
    if(landmarkerPromise) return landmarkerPromise;
    landmarkerPromise=(async()=>{
      const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');
      const fileset=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
      return vision.FaceLandmarker.createFromOptions(fileset,{
        baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',delegate:'CPU'},
        runningMode:'IMAGE',numFaces:1,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false
      });
    })();
    return landmarkerPromise;
  }

  function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
  function center(points){return points.reduce((a,p)=>({x:a.x+p.x,y:a.y+p.y}),{x:0,y:0}) && {x:points.reduce((s,p)=>s+p.x,0)/points.length,y:points.reduce((s,p)=>s+p.y,0)/points.length}}
  function px(p){return {x:p.x*W,y:p.y*H}}
  function avg(ls,ids){return px(center(ids.map(i=>ls[i])))}

  async function detect(img){
    try{
      const lm=await getLandmarker();
      const r=lm.detect(img);
      return r.faceLandmarks?.[0]||null;
    }catch(e){console.warn('FaceLandmarker indisponible',e);return null}
  }

  function overlay(){
    let o=document.querySelector('#v8FaceOverlay');
    if(o) return o;
    o=document.createElement('div');o.id='v8FaceOverlay';
    o.innerHTML=`<style>
    #v8FaceOverlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(20,38,62,.36);z-index:9999;backdrop-filter:blur(3px)}
    #v8FaceOverlay.show{display:flex}.v8box{background:#fff;border-radius:34px;padding:18px;text-align:center;box-shadow:0 28px 80px rgba(0,0,0,.28);width:min(88vw,380px)}
    #v8canvas{width:min(78vw,320px);aspect-ratio:1;border-radius:28px;box-shadow:0 12px 28px rgba(0,0,0,.16);background:#edf2f7}
    .v8title{font-size:30px;font-weight:950;margin-top:10px;color:#17365d}.v8sub{font-size:15px;color:#728097;margin-top:3px}
    .v8loading{font-size:14px;color:#728097;margin:8px 0 2px}.v8spark{position:fixed;font-size:28px;pointer-events:none;animation:v8fly 1s ease-out forwards}
    @keyframes v8fly{0%{transform:translate(0,0) scale(.4);opacity:0}15%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) rotate(var(--rot)) scale(1.3);opacity:0}}
    </style><div class="v8box"><canvas id="v8canvas" width="320" height="320"></canvas><div class="v8loading" id="v8loading"></div><div class="v8title" id="v8title"></div><div class="v8sub" id="v8sub"></div></div>`;
    document.body.appendChild(o);return o;
  }

  function drawPatch(ctx,img,cx,cy,rx,ry,sx,sy,dy=0){
    ctx.save();ctx.beginPath();ctx.ellipse(cx,cy+dy,rx*sx,ry*sy,0,0,Math.PI*2);ctx.clip();
    const sw=rx*2,sh=ry*2;
    ctx.translate(cx,cy+dy);ctx.scale(sx,sy);ctx.drawImage(img,cx-rx,cy-ry,sw,sh,-rx,-ry,sw,sh);ctx.restore();
  }
  function horn(ctx,x,y,flip=1,grow=1){ctx.save();ctx.translate(x,y);ctx.scale(flip*grow,grow);ctx.fillStyle='#b92f4c';ctx.beginPath();ctx.moveTo(0,18);ctx.quadraticCurveTo(7,-14,19,-30);ctx.quadraticCurveTo(22,-6,14,17);ctx.closePath();ctx.fill();ctx.restore()}
  function cheeks(ctx,l,r,a){ctx.save();ctx.globalAlpha=.18*a;ctx.fillStyle='#ff4f7b';[l,r].forEach(p=>{ctx.beginPath();ctx.ellipse(p.x,p.y,20,12,0,0,Math.PI*2);ctx.fill()});ctx.restore()}
  function sparkles(kind){const chars=kind==='good'?['⭐','✨','💛']:kind==='bad'?['💥','😵‍💫','⚡']:['✨','💫'];for(let i=0;i<10;i++){const s=document.createElement('div');s.className='v8spark';s.textContent=chars[i%chars.length];s.style.left=(50+Math.random()*8-4)+'vw';s.style.top=(42+Math.random()*8-4)+'vh';s.style.setProperty('--dx',(Math.random()*220-110)+'px');s.style.setProperty('--dy',(Math.random()*-180-30)+'px');s.style.setProperty('--rot',(Math.random()*180-90)+'deg');document.body.appendChild(s);setTimeout(()=>s.remove(),1100)}}

  async function animateFace(child,type,amount,total,period){
    const o=overlay(),canvas=o.querySelector('#v8canvas'),ctx=canvas.getContext('2d'),title=o.querySelector('#v8title'),sub=o.querySelector('#v8sub'),loading=o.querySelector('#v8loading');
    o.classList.add('show');title.textContent='';sub.textContent='';loading.textContent='Analyse du visage…';
    const img=await loadImg(child.photo||avatar(child.name));
    const ls=child.photo?await detect(img):null;
    loading.textContent=ls?'Portrait animé localement':'Animation simplifiée';
    const leftEye=ls?avg(ls,[33,133,159,145]):{x:105,y:130},rightEye=ls?avg(ls,[362,263,386,374]):{x:215,y:130},mouth=ls?avg(ls,[61,291,13,14]):{x:160,y:210};
    const cheekL={x:(leftEye.x+mouth.x)/2-14,y:(leftEye.y+mouth.y)/2+18},cheekR={x:(rightEye.x+mouth.x)/2+14,y:(rightEye.y+mouth.y)/2+18};
    const forehead={y:Math.min(leftEye.y,rightEye.y)-62};
    const dur=type==='good'?1200:1450,start=performance.now();
    function frame(now){
      const t=Math.min(1,(now-start)/dur),p=Math.sin(Math.PI*t),blocked=type==='bad'&&total>=state.settings.threshold;
      ctx.clearRect(0,0,W,H);ctx.save();
      let scale=1,rot=0;
      if(type==='bad'){scale=1-.025*p;rot=(amount===.5?-.015:.025*Math.sin(t*8*Math.PI))*p}else scale=1+.035*p;
      ctx.translate(W/2,H/2);ctx.rotate(rot);ctx.scale(scale,scale);ctx.drawImage(img,-W/2,-H/2,W,H);ctx.restore();
      if(ls){
        if(type==='bad'){
          const eyeGrow=(amount===.5?.12:.22)*p+(blocked?.12*p:0);drawPatch(ctx,img,leftEye.x,leftEye.y,31,20,1+eyeGrow,1+eyeGrow*.7,-2*p);drawPatch(ctx,img,rightEye.x,rightEye.y,31,20,1+eyeGrow,1+eyeGrow*.7,-2*p);
          const mouthY=amount===.5?1-.12*p:1+.35*p;drawPatch(ctx,img,mouth.x,mouth.y,48,26,1+.08*p,mouthY,5*p);
          cheeks(ctx,cheekL,cheekR,blocked?1:p*.7);
        }else{
          drawPatch(ctx,img,leftEye.x,leftEye.y,30,19,1+.08*p,1-.14*p,0);drawPatch(ctx,img,rightEye.x,rightEye.y,30,19,1+.08*p,1-.14*p,0);drawPatch(ctx,img,mouth.x,mouth.y,52,28,1+.18*p,1-.23*p,-2*p);cheeks(ctx,cheekL,cheekR,p);
        }
      }
      if(type==='bad'&&blocked){const g=Math.min(1,t*2.5);horn(ctx,leftEye.x-35,forehead.y+28,-1,g);horn(ctx,rightEye.x+35,forehead.y+28,1,g)}
      if(type==='good'){ctx.save();ctx.font='44px system-ui';ctx.textAlign='center';ctx.globalAlpha=p;ctx.fillText('👑',160,58-12*p);ctx.restore()}
      if(t<1)requestAnimationFrame(frame);else setTimeout(()=>o.classList.remove('show'),280);
    }
    if(type==='good'){title.textContent='Bravo ! ⭐';sub.textContent=`${child.name} gagne une bonne action`;sparkles('good')} else if(total>=state.settings.threshold){title.textContent='Oh oh… 😈';sub.textContent=`${child.name} atteint ${fmt(total)} / ${state.settings.threshold}`;sparkles('bad')} else if(total>=state.settings.threshold-.5){title.textContent='Attention… 😬';sub.textContent=`${fmt(total)} / ${state.settings.threshold}`;sparkles('warn')} else {title.textContent=amount===.5?'Petit oups !':'Oups !';sub.textContent=`${child.name} : +${amount===.5?'½':'1'} (${period==='midi'?'midi':'soir'})`;sparkles('warn')}
    requestAnimationFrame(frame);
  }

  const oldBad=window.bad,oldGood=window.good;
  window.bad=(id,p,amount=1)=>{const c=state.children.find(x=>x.id===id);if(!c)return;c.last.push(snapshot(c));c[p]=Math.min(state.settings.threshold,c[p]+amount);addHistory(`${c.name} : +${amount===.5?'½':'1'} bêtise (${p})`);persist();animateFace(c,'bad',amount,c[p],p).catch(()=>oldBad?.(id,p,amount))};
  window.good=id=>{const c=state.children.find(x=>x.id===id);if(!c)return;c.last.push(snapshot(c));c.stars++;addHistory(`${c.name} : ⭐ bonne action`);persist();animateFace(c,'good',0,0,'').catch(()=>oldGood?.(id))};
})();