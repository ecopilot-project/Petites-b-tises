(()=>{
  let landmarkerPromise=null;
  const MODEL='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';
  function loadLandmarker(){
    if(landmarkerPromise) return landmarkerPromise;
    landmarkerPromise=(async()=>{
      const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');
      const files=await vision.FilesetResolver.forVisionTasks(WASM);
      return vision.FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:MODEL},runningMode:'IMAGE',numFaces:1,outputFaceBlendshapes:true});
    })().catch(e=>{console.warn('FaceLandmarker indisponible',e);return null});
    return landmarkerPromise;
  }
  const css=`
  .v7face{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at center,rgba(255,255,255,.94),rgba(23,54,93,.35));backdrop-filter:blur(8px)}
  .v7face.show{display:flex}.v7stage{position:relative;width:min(88vw,420px);aspect-ratio:1;border-radius:42px;background:white;box-shadow:0 28px 80px rgba(0,0,0,.28);overflow:hidden;transform:scale(.82);animation:v7enter .32s ease forwards}
  .v7stage canvas{width:100%;height:100%;display:block}.v7caption{position:absolute;left:0;right:0;bottom:18px;text-align:center;font-weight:950;font-size:30px;color:#17365d;text-shadow:0 2px 8px white}.v7sub{display:block;font-size:16px;margin-top:3px;color:#66758c}
  @keyframes v7enter{to{transform:scale(1)}}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const wrap=document.createElement('div');wrap.className='v7face';wrap.innerHTML='<div class="v7stage"><canvas width="420" height="420"></canvas><div class="v7caption"></div></div>';document.body.appendChild(wrap);
  const cvs=wrap.querySelector('canvas'),ctx=cvs.getContext('2d'),caption=wrap.querySelector('.v7caption');
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function imgFrom(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
  const P=(lm,i,w,h)=>({x:lm[i].x*w,y:lm[i].y*h});
  function avg(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
  function regionFromPoints(points,pad=1.6){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),cx=(x0+x1)/2,cy=(y0+y1)/2,w=(x1-x0)*pad,h=(y1-y0)*pad;return{x:cx-w/2,y:cy-h/2,w,h,cx,cy}}
  function drawCrop(img,r,scaleX,scaleY,dx=0,dy=0){ctx.save();ctx.beginPath();ctx.ellipse(r.cx+dx,r.cy+dy,r.w*scaleX/2,r.h*scaleY/2,0,0,Math.PI*2);ctx.clip();ctx.drawImage(img,r.x,r.y,r.w,r.h,r.cx-r.w*scaleX/2+dx,r.cy-r.h*scaleY/2+dy,r.w*scaleX,r.h*scaleY);ctx.restore()}
  function emoji(txt,x,y,size,alpha=1,rot=0){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.font=`${size}px Apple Color Emoji, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,0,0);ctx.restore()}
  async function play(child,type,amount=1,period='midi'){
    const src=child.photo||avatar(child.name);let img;try{img=await imgFrom(src)}catch{return}
    wrap.classList.add('show');caption.innerHTML=type==='good'?`Bravo ${child.name} ! ⭐<span class="v7sub">Belle action</span>`:`${child.name} : ${amount===.5?'+½':'+1'}<span class="v7sub">${period==='midi'?'Midi':'Soir'}</span>`;
    const W=cvs.width,H=cvs.height;
    ctx.clearRect(0,0,W,H);ctx.drawImage(img,0,0,W,H);
    const landmarker=await loadLandmarker();let lm=null;
    if(landmarker){try{const r=landmarker.detect(cvs);lm=r.faceLandmarks?.[0]||null}catch(e){console.warn(e)}}
    if(!lm){for(let f=0;f<36;f++){ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(W/2,H/2);const s=1+Math.sin(f/5)*.035;ctx.scale(s,1/s);ctx.drawImage(img,-W/2,-H/2,W,H);ctx.restore();emoji(type==='good'?'⭐':'😮',W*.5,H*.53,72);await sleep(28)}wrap.classList.remove('show');return}
    const leftEye=regionFromPoints([P(lm,33,W,H),P(lm,133,W,H),P(lm,159,W,H),P(lm,145,W,H)],1.9);
    const rightEye=regionFromPoints([P(lm,362,W,H),P(lm,263,W,H),P(lm,386,W,H),P(lm,374,W,H)],1.9);
    const mouth=regionFromPoints([P(lm,61,W,H),P(lm,291,W,H),P(lm,13,W,H),P(lm,14,W,H)],2.0);
    const forehead=avg(P(lm,10,W,H),P(lm,168,W,H));
    const total=child[period]||0,threshold=state.settings.threshold;
    const frames=type==='good'?44:total>=threshold?58:46;
    for(let f=0;f<frames;f++){
      const t=f/(frames-1),pulse=Math.sin(Math.PI*t),bounce=Math.sin(t*Math.PI*4)*(1-t)*5;
      ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(W/2,H/2+bounce);const faceScale=1+(type==='good'?0.025:0.045)*pulse;ctx.scale(faceScale,1+(type==='good'?.01:-.025)*pulse);ctx.drawImage(img,-W/2,-H/2,W,H);ctx.restore();
      if(type==='good'){
        drawCrop(img,leftEye,1.05,0.78,0,-2*pulse);drawCrop(img,rightEye,1.05,0.78,0,-2*pulse);drawCrop(img,mouth,1.12,1.23,0,4*pulse);
        for(let i=0;i<7;i++){const a=t*6.28+i*.9,r=75+80*t;emoji('⭐',forehead.x+Math.cos(a)*r,forehead.y+Math.sin(a)*r,18+12*pulse,1-t*.35,a)}
        if(t>.58)emoji('👑',forehead.x,forehead.y-58-(t-.58)*22,56,Math.min(1,(t-.58)*5));
      }else{
        const eyeBoost=amount===.5?1.10:1.22;drawCrop(img,leftEye,1+(eyeBoost-1)*pulse,1+(eyeBoost-1)*pulse);drawCrop(img,rightEye,1+(eyeBoost-1)*pulse,1+(eyeBoost-1)*pulse);
        const mouthY=amount===.5?1.18:1.48;drawCrop(img,mouth,1.04,1+(mouthY-1)*pulse,0,3*pulse);
        if(total>=threshold){const grow=Math.max(0,(t-.18)/.5);emoji('😈',forehead.x,forehead.y-55,72,Math.min(1,grow),Math.sin(t*7)*.06);if(t>.55){ctx.save();ctx.globalAlpha=Math.min(.20,(t-.55)*.45);ctx.fillStyle='#ff3355';ctx.fillRect(0,0,W,H);ctx.restore()}}
        else if(total>=threshold-.5){emoji('⚠️',forehead.x,forehead.y-55,48,Math.min(1,t*3));}
        else if(t>.55){emoji('💫',forehead.x+78,forehead.y-50,28,1-t*.5,t*4)}
      }
      await sleep(24);
    }
    await sleep(260);wrap.classList.remove('show');
  }
  // Précharge le moteur sans bloquer l'interface.
  setTimeout(()=>loadLandmarker(),800);
  const oldBad=window.bad,oldGood=window.good;
  window.bad=(id,p,amount=1)=>{const c=state.children.find(x=>x.id===id);if(!c)return oldBad?.(id,p,amount);oldBad?.(id,p,amount);setTimeout(()=>play(c,'bad',amount,p),30)};
  window.good=id=>{const c=state.children.find(x=>x.id===id);if(!c)return oldGood?.(id);oldGood?.(id);setTimeout(()=>play(c,'good',0,'midi'),30)};
})();