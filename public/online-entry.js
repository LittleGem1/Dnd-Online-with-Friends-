(()=>{
const host=document.getElementById('onlineHost'),join=document.getElementById('onlineJoin');
function onlineAvailable(){if(!/^https?:$/.test(location.protocol)||self!==top){alert('Die Online-Lobby benötigt den Node.js-Server aus dem Web-ZIP. Die lokale Testlobby funktioniert weiterhin.');return false}return true}
async function snapshotCampaign(){
 if(!project||testing)throw Error('Bitte den Testmodus beenden.');if(project.maps.length>20)throw Error('Online sind derzeit bis zu 20 Karten pro Kampagne möglich.');
 const previous={mapId,layerId,zoom,ox,oy,dpr,w:canvas.width,h:canvas.height},maps=[],starts=partyList().map(p=>({...partyStart(p),number:p.number})).filter(p=>p.mapId);
 try{
 for(const m of project.maps){mapId=m.id;layerId=m.layers[0].id;
  // Preload only images used on this map before rendering the public snapshot.
  const used=new Set(m.layers.filter(l=>l.visible&&l.kind!=='markers'&&l.kind!=='actors').flatMap(l=>Object.values(l.cells)));
  for(const id of used){hdImage(hdArt(id));drawAsset(hdSC,id,0,0,48)}for(const v of ['wall','door'])hdImage(edgeMaterial(v));if(m.artBackdrop)drawArtBackdrop(m);
  const pending=[...imgCache.values(),...backdropCache.values()].filter(im=>!im.complete);await Promise.all(pending.map(im=>Promise.race([im.decode().catch(()=>{}),new Promise(r=>setTimeout(r,4000))])));
  const scale=Math.min(1,2000/(Math.max(m.w,m.h)*S));canvas.width=Math.round(m.w*S*scale);canvas.height=Math.round(m.h*S*scale);zoom=scale;dpr=1;ctx.setTransform(canvas.width/(m.w*S),0,0,canvas.height/(m.h*S),0,0);ctx.fillStyle='#303534';ctx.fillRect(0,0,m.w*S,m.h*S);drawArtBackdrop(m);ctx.save();ctx.beginPath();ctx.rect(0,0,m.w*S,m.h*S);ctx.clip();for(const l of m.layers)if(l.visible&&l.kind!=='markers'&&l.kind!=='actors')drawHDLayer(l,m,0,m.w,0,m.h);for(const [k,v] of Object.entries(m.blueprint||{}))if(edgeValid(m,k))edgeDraw(k,v);ctx.restore();
  const blockedCells=new Set((m.rooms||[]).filter(r=>r.locked).flatMap(r=>r.cells||[]));for(const l of m.layers)if(l.visible)for(const [k,id] of Object.entries(l.cells))if(genSolid(asset(id)))blockedCells.add(k);for(const p of m.creatures||[])if(p.solid)blockedCells.add(p.x+','+p.y);
  const blocked=[...blockedCells].filter(k=>{let [x,y]=k.split(',').map(Number);return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<m.w&&y>=0&&y<m.h});
  maps.push({id:m.id,name:m.name,w:m.w,h:m.h,blocked,walls:Object.entries(m.blueprint||{}).filter(([k,v])=>v==='wall'&&edgeValid(m,k)).map(([k])=>k),image:canvas.toDataURL('image/webp',.82)});
 }
 return {maps,starts,defaultMap:previous.mapId};
 }finally{({mapId,layerId,zoom,ox,oy,dpr}=previous);canvas.width=previous.w;canvas.height=previous.h;drawMap()}
}
window.buildOnlineCampaign=snapshotCampaign;
host.onclick=async()=>{if(!onlineAvailable()||testing||host.disabled)return;if(!confirm('Eine Kopie der sichtbaren Karten an den Spielserver übertragen? Geheime Marker und Kreaturenbilder werden nicht mitgesendet.'))return;let tab=window.open('about:blank','_blank');if(!tab){alert('Bitte Pop-ups für diese Webseite erlauben.');return}tab.document.body.textContent='Kampagnenkarten werden vorbereitet …';host.disabled=true;$('editor').inert=true;try{let campaign=await snapshotCampaign(),data=JSON.stringify({name:document.getElementById('world').value.trim()||'Meine Kampagne',campaign});if(data.length>12*1024*1024)throw Error('Kampagnenbilder zu groß (maximal 12 MB).');let r=await fetch('/api/lobby',{method:'POST',headers:{'Content-Type':'application/json'},body:data});if(!r.ok)throw Error(await r.text());let result=await r.json();tab.sessionStorage.setItem('dnd-online-session',JSON.stringify({token:result.token,code:result.state.code}));tab.opener=null;tab.location.replace(location.origin+'/online?host=1');}catch(e){tab.close();alert('Online-Lobby konnte nicht erstellt werden: '+e.message)}finally{host.disabled=false;$('editor').inert=false}};
join.onclick=()=>{if(onlineAvailable())window.open('/online','_blank','noopener')};
})();
