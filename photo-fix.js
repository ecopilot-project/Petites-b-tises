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
  if(!saveBtn) return;

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
      try{persist()}catch(e){
        alert('Le stockage de l’iPhone est plein pour cette application. Essaie une autre photo ou supprime un ancien profil.');
        throw e;
      }
    }catch(e){
      console.error(e);
      alert('Impossible d’enregistrer cette photo. Essaie une autre photo ou prends-en une nouvelle avec l’appareil photo.');
    }finally{
      saveBtn.disabled=false;saveBtn.textContent=oldText;
    }
  };
})();