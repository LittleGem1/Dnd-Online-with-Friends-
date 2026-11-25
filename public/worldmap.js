'use strict';
(()=>{
const D=$('atlasDialog'), C=$('atlasCanvas'), c=C.getContext('2d'), W=72,H=48,S=15, X=60,Y=40;
const colors={land:'#b8bc82',water:'#8faeb1',forest:'#91a277',mountain:'#b3a68f',desert:'#ddbd82',snow:'#e5e0ce'}, names={city:'Stadt',village:'Dorf',castle:'Burg',forest:'Wald',mountain:'Gebirge',ruin:'Ruine',port:'Hafen',region:'Region',landmark:'Besonderer Ort'};
let sel=null, tool='select', drag=null, history=[], owner=null, terrainCanvas=document.createElement('canvas'), terrainDirty=true; terrainCanvas.width=C.width;terrainCanvas.height=C.height;
const valid=(x,y)=>x>=0&&y>=0&&x<W&&y<H, idx=(x,y)=>y*W+x, clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), rnd=(n)=>Math.floor(Math.random()*n), xy=p=>[X+(p.x+.5)*S,Y+(p.y+.5)*S], say=t=>$('atlasStatus').textContent=t;

const WORLD_ASSET_DATA={"see": "/assets/world/see.png", "laubwald": "/assets/world/laubwald.png", "felsnadeln": "/assets/world/felsnadeln.png", "kristallhoehle": "/assets/world/kristallhoehle.png", "waldinsel": "/assets/world/waldinsel.png", "sumpfboden_textur": "/assets/world/sumpfboden_textur.png", "magischer_baum": "/assets/world/magischer_baum.png", "felsinsel": "/assets/world/felsinsel.png", "nadelwald": "/assets/world/nadelwald.png", "stadt": "/assets/world/stadt.png", "herbstwald": "/assets/world/herbstwald.png", "sumpf": "/assets/world/sumpf.png", "wiese_textur": "/assets/world/wiese_textur.png", "steinpflaster_textur": "/assets/world/steinpflaster_textur.png", "eisschollen": "/assets/world/eisschollen.png", "burgruine": "/assets/world/burgruine.png", "hafen": "/assets/world/hafen.png", "bluetenwald": "/assets/world/bluetenwald.png", "felsbogeninsel": "/assets/world/felsbogeninsel.png", "geroell_textur": "/assets/world/geroell_textur.png", "wegweiser": "/assets/world/wegweiser.png", "lava_textur": "/assets/world/lava_textur.png", "eisfels_textur": "/assets/world/eisfels_textur.png", "wasserfall": "/assets/world/wasserfall.png", "sand_textur": "/assets/world/sand_textur.png", "wuestenmesa": "/assets/world/wuestenmesa.png", "trockenland_textur": "/assets/world/trockenland_textur.png", "schaedelberg": "/assets/world/schaedelberg.png", "burg": "/assets/world/burg.png", "wasserstrudel": "/assets/world/wasserstrudel.png", "kompass": "/assets/world/kompass.png", "windmuehle": "/assets/world/windmuehle.png", "tropeninsel": "/assets/world/tropeninsel.png", "tempel": "/assets/world/tempel.png", "toter_baum": "/assets/world/toter_baum.png", "trockener_boden_textur": "/assets/world/trockener_boden_textur.png", "gras_textur": "/assets/world/gras_textur.png", "palmen": "/assets/world/palmen.png", "ruinenbogen": "/assets/world/ruinenbogen.png", "dunkler_turm": "/assets/world/dunkler_turm.png", "portal": "/assets/world/portal.png", "vulkan": "/assets/world/vulkan.png", "flussbogen": "/assets/world/flussbogen.png", "gebirge": "/assets/world/gebirge.png", "schnee_textur": "/assets/world/schnee_textur.png", "lager": "/assets/world/lager.png", "flusskurve": "/assets/world/flusskurve.png", "erde_textur": "/assets/world/erde_textur.png", "huegel": "/assets/world/huegel.png", "schneegebirge": "/assets/world/schneegebirge.png", "marktstand": "/assets/world/marktstand.png", "dorf": "/assets/world/dorf.png", "schneefels_textur": "/assets/world/schneefels_textur.png", "einzelbaum": "/assets/world/einzelbaum.png", "felswiese_textur": "/assets/world/felswiese_textur.png", "bruecke_stein": "/assets/world/bruecke_stein.png", "bruecke_holz": "/assets/world/bruecke_holz.png", "huette": "/assets/world/huette.png", "lagerfeuer": "/assets/world/lagerfeuer.png", "moor_textur": "/assets/world/moor_textur.png", "plateau": "/assets/world/plateau.png"};
const worldAssetImgs={}, worldPatterns={};
function initWorldAssetPack(){
  for(const [key,src] of Object.entries(WORLD_ASSET_DATA)){
    if(worldAssetImgs[key]) continue;
    const im=new Image(); im.onload=()=>{delete worldPatterns[key]; dirtyTerrain(); if(D.open&&project)draw()}; im.src=src; worldAssetImgs[key]=im;
  }
}
initWorldAssetPack();
function worldImg(name){return worldAssetImgs[name]||null}
function drawWorldImage(g,name,x,y,w,h,alpha=1){let im=worldImg(name); if(!im?.complete||!im.naturalWidth) return false; g.save(); g.globalAlpha=alpha; g.drawImage(im,x,y,w,h); g.restore(); return true;}
function patternFor(name){ if(worldPatterns[name]) return worldPatterns[name]; let im=worldImg(name); if(!im?.complete||!im.naturalWidth) return null; try{ worldPatterns[name]=c.createPattern(im,'repeat'); }catch{ worldPatterns[name]=null; } return worldPatterns[name]; }
function terrainTextureName(t){ return ({land:'gras_textur',water:null,forest:'wiese_textur',mountain:'felswiese_textur',desert:'sand_textur',snow:'schnee_textur'})[t]||'gras_textur'; }
function assetChoicesForTile(t,x,y,a){
  const n=noise(x*1.17,y*1.31,a.seed);
  if(t==='forest') return n>.72?['herbstwald',1.9,1.45]:n>.5?['nadelwald',1.9,1.55]:['laubwald',2.1,1.55];
  if(t==='mountain') return y<10?['schneegebirge',2.2,1.5]:n>.6?['plateau',1.8,1.25]:['gebirge',2.3,1.45];
  if(t==='desert') return n>.65?['wuestenmesa',2.1,1.35]:['huegel',2.0,1.1];
  if(t==='snow') return ['schneegebirge',2.1,1.4];
  if(t==='land'&&n>.83) return ['huegel',1.8,1.05];
  return null;
}
function placeAssetName(kind,p){
  return ({city:'stadt', village:'dorf', castle:'burg', forest:'laubwald', mountain:'gebirge', ruin:'burgruine', port:'hafen', region:'wegweiser', landmark:'tempel'})[kind] || 'tempel';
}

function noise(x,y,seed){let v=Math.sin(x*127.1+y*311.7+seed*0.023)*43758.5453;return v-Math.floor(v)}
function smooth(x,y,seed){let ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);return (1-b)*((1-a)*noise(ix,iy,seed)+a*noise(ix+1,iy,seed))+b*((1-a)*noise(ix,iy+1,seed)+a*noise(ix+1,iy+1,seed))}
function createTerrain(shape,seed){let tiles=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){let nx=(x-W/2)/(W*.45),ny=(y-H/2)/(H*.43),n=smooth(x/9,y/8,seed),dist=nx*nx+ny*ny+(n-.5)*.95;let land=shape==='inland'||(shape==='islands'?dist<.85&&smooth(x/12,y/10,seed+880)>.39:dist<1);let f=smooth(x/8,y/8,seed+17), m=smooth(x/8,y/7,seed+89);tiles.push(!land?'water':y<9&&f>.48?'snow':m>.66?'mountain':y>30&&f<.34?'desert':f>.56?'forest':'land')}
 let points=[];let mid=W/2+(smooth(0,0,seed)-.5)*12;for(let y=3;y<H-2;y+=2){let x=clamp(Math.round(mid+Math.sin(y*.17+seed%13)*6+Math.sin(y*.38)*2),2,W-3);points.push({x,y})}return {tiles,lines:[{kind:'river',points}]}}
function getAtlas(){let a=project.atlas;if(!a||!Array.isArray(a.tiles)||a.tiles.length!==W*H||a.tiles.some(t=>!Object.hasOwn(colors,t))||!Array.isArray(a.places)||!Array.isArray(a.lines)){let seed=rnd(1000000);a=project.atlas={name:'Meine Welt',shape:'continent',seed,...createTerrain('continent',seed),places:[]}}return a}
function checkpoint(){history.push(clone(getAtlas()));if(history.length>25)history.shift();$('atlasUndo').disabled=false;setDirty()}
function dirtyTerrain(){terrainDirty=true}
const at=(a,x,y)=>valid(x,y)?a.tiles[idx(x,y)]:'water';
function dseg(x,y,p,q){let dx=q.x-p.x,dy=q.y-p.y,t=clamp(((x-p.x)*dx+(y-p.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-p.x-t*dx,y-p.y-t*dy)}
function riverDist(a,x,y){let d=999;for(let line of a.lines.filter(l=>l.kind==='river'))for(let i=1;i<line.points.length;i++)d=Math.min(d,dseg(x,y,line.points[i-1],line.points[i]));return d}
function nearCoast(a,x,y){for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)if(at(a,x+i,y+j)==='water')return true;return false}
function requirements(p){let s=p.description.toLowerCase(),rel=s.match(/(nördlich|südlich|östlich|westlich)\s+von\s+([^.,;\n]+)/u);let t=rel?s.replace(rel[0],''):s;return {north:/nord|nörd/.test(t),south:/süd/.test(t),east:/ost|öst/.test(t),west:/west/.test(t),river:/fluss|fluß|ufer|strom/.test(t),coast:/küste|meer|hafen|strand/.test(t)||p.kind==='port',forest:/wald|wäld/.test(t)||p.kind==='forest',mountain:/gebirge|berg/.test(t)||p.kind==='mountain',desert:/wüste/.test(t),snow:/schnee|eisland/.test(t),rel:rel&&[rel[1],rel[2].trim()]}}
function arrange(a){let used=[],warnings=[];let ordered=[...a.places].sort((p,q)=>Number(!!requirements(p).rel)-Number(!!requirements(q).rel));for(let p of ordered){let r=requirements(p),target=r.rel&&a.places.find(q=>q.id!==p.id&&q.name.toLowerCase()===r.rel[1].toLowerCase()),best=null,score=Infinity;for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++){let terrain=at(a,x,y);if(terrain==='water'||used.some(q=>Math.hypot(q.x-x,q.y-y)<3))continue;let bad=(r.north&&y>H*.43?1:0)+(r.south&&y<H*.57?1:0)+(r.east&&x<W*.57?1:0)+(r.west&&x>W*.43?1:0)+(r.river&&riverDist(a,x,y)>2?1:0)+(r.coast&&!nearCoast(a,x,y)?1:0)+(r.forest&&terrain!=='forest'?1:0)+(r.mountain&&terrain!=='mountain'?1:0)+(r.desert&&terrain!=='desert'?1:0)+(r.snow&&terrain!=='snow'?1:0);if(target){let dir=r.rel[0],v=dir==='nördlich'?target.y-y:dir==='südlich'?y-target.y:dir==='östlich'?x-target.x:target.x-x;if(v<3)bad++}let v=bad*1000+(r.river?Math.min(20,riverDist(a,x,y)):0)+noise(x,y,a.seed+p.name.length*19)*8;if(v<score){score=v;best={x,y}}}if(best){Object.assign(p,best);used.push(best)}else warnings.push(p.name+': kein freier Landplatz');if(score>=1000&&best)warnings.push(p.name+': nicht alle Lagewünsche erfüllbar');if(r.rel&&!target)warnings.push(p.name+': Bezugsort nicht gefunden')}return warnings}
function linePath(g,points){if(!points.length)return;g.beginPath();g.moveTo(...xy(points[0]));for(let i=1;i<points.length;i++)g.lineTo(...xy(points[i]))}
function tree(g,x,y,k){g.strokeStyle='#56644b';g.fillStyle='#75885d';g.lineWidth=.7;g.beginPath();g.moveTo(x,y-8*k);g.lineTo(x-4*k,y-1*k);g.lineTo(x-2*k,y-1*k);g.lineTo(x-5*k,y+4*k);g.lineTo(x+5*k,y+4*k);g.lineTo(x+2*k,y-1*k);g.lineTo(x+4*k,y-1*k);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(x,y+4*k);g.lineTo(x,y+7*k);g.stroke()}
function mountain(g,x,y,k){g.fillStyle='#cbbfa6';g.strokeStyle='#736654';g.lineWidth=1;g.beginPath();g.moveTo(x-8*k,y+5*k);g.lineTo(x,y-9*k);g.lineTo(x+9*k,y+5*k);g.closePath();g.fill();g.stroke();g.fillStyle='#8d806e';g.beginPath();g.moveTo(x,y-9*k);g.lineTo(x+9*k,y+5*k);g.lineTo(x+2*k,y+4*k);g.closePath();g.fill();g.fillStyle='#eee6d0';g.beginPath();g.moveTo(x,y-9*k);g.lineTo(x-3*k,y-3*k);g.lineTo(x+1*k,y-4*k);g.lineTo(x+4*k,y-2*k);g.closePath();g.fill()}

function drawTerrain(a){
 let g=terrainCanvas.getContext('2d');
 g.clearRect(0,0,1200,800);
 g.fillStyle='#e1cba3'; g.fillRect(0,0,1200,800);
 g.fillStyle='#d7c09a'; g.fillRect(X-6,Y-6,W*S+12,H*S+12);
 // base sea
 g.save();
 g.beginPath(); g.rect(X,Y,W*S,H*S); g.clip();
 let waterGrad=g.createLinearGradient(X,Y,X,Y+H*S); waterGrad.addColorStop(0,'#7cc0ca'); waterGrad.addColorStop(.5,'#4e98a8'); waterGrad.addColorStop(1,'#2e6f7b');
 g.fillStyle=waterGrad; g.fillRect(X,Y,W*S,H*S);
 let wp=patternFor('see'); if(wp){ g.globalAlpha=.18; g.fillStyle=wp; g.fillRect(X,Y,W*S,H*S); g.globalAlpha=1; }
 // terrain textures cell by cell
 for(let y=0;y<H;y++) for(let x=0;x<W;x++){
   let t=at(a,x,y); if(t==='water') continue;
   let px=X+x*S, py=Y+y*S;
   let tex=terrainTextureName(t), pat=patternFor(tex);
   if(pat){ g.fillStyle=pat; g.globalAlpha=t==='snow'?.92:.98; g.fillRect(px,py,S+1,S+1); g.globalAlpha=1; }
   else { g.fillStyle=colors[t]||'#b8bc82'; g.fillRect(px,py,S+1,S+1); }
   // soften edges against different neighboring terrain
   let left=at(a,x-1,y), up=at(a,x,y-1);
   if(left!==t && left!=='water'){ g.fillStyle='rgba(255,248,230,.10)'; g.fillRect(px-1,py,2,S); }
   if(up!==t && up!=='water'){ g.fillStyle='rgba(255,248,230,.10)'; g.fillRect(px,py-1,S,2); }
 }
 // coastlines and cliffs
 for(let y=0;y<H;y++) for(let x=0;x<W;x++){
   let t=at(a,x,y), px=X+x*S, py=Y+y*S;
   if(t!=='water' && nearCoast(a,x,y)){
     g.strokeStyle='rgba(242,233,205,.85)'; g.lineWidth=1.3;
     if(at(a,x+1,y)==='water'){ g.beginPath(); g.moveTo(px+S,py); g.lineTo(px+S,py+S); g.stroke(); }
     if(at(a,x-1,y)==='water'){ g.beginPath(); g.moveTo(px,py); g.lineTo(px,py+S); g.stroke(); }
     if(at(a,x,y+1)==='water'){ g.beginPath(); g.moveTo(px,py+S); g.lineTo(px+S,py+S); g.stroke(); }
     if(at(a,x,y-1)==='water'){ g.beginPath(); g.moveTo(px,py); g.lineTo(px+S,py); g.stroke(); }
   }
 }
 // large decorative terrain assets
 for(let y=0;y<H;y++) for(let x=0;x<W;x++){
   let t=at(a,x,y), choose=assetChoicesForTile(t,x,y,a); if(!choose) continue;
   let n=noise(x*2.4,y*2.1,a.seed+44); if((t==='forest'||t==='mountain'||t==='snow'||t==='desert') ? n<.54 : n<.80) continue;
   let [name,sx,sy]=choose, w=S*sx, h=S*sy;
   let px=X+x*S + (noise(x,y,a.seed+31)-.5)*6 - w*.5 + S*.5;
   let py=Y+y*S + (noise(y,x,a.seed+32)-.5)*4 - h*.72 + S*.5;
   drawWorldImage(g,name,px,py,w,h,.96);
 }
 // lines: rivers and roads
 for(let l of a.lines){ if(!l.points?.length) continue; linePath(g,l.points); g.lineCap='round'; g.lineJoin='round';
   if(l.kind==='river'){ g.strokeStyle='#2a6f87'; g.lineWidth=7; g.stroke(); g.strokeStyle='#95d8dd'; g.lineWidth=3.5; g.stroke(); }
   else { g.strokeStyle='#8d6a43'; g.lineWidth=2.6; g.setLineDash([5,4]); g.stroke(); g.setLineDash([]); }
 }
 // place a few bridges where roads cross rivers
 for(let road of a.lines.filter(l=>l.kind==='road')) for(let river of a.lines.filter(l=>l.kind==='river')){
   for(let rp of road.points||[]){
     let d=riverDist(a,rp.x,rp.y);
     if(d<1.05){ let [px,py]=xy(rp); drawWorldImage(g, noise(rp.x,rp.y,a.seed)>.5?'bruecke_stein':'bruecke_holz', px-12, py-9, 24, 18, .95); break; }
   }
 }
 g.restore();
 // frame and cartography decorations
 g.strokeStyle='#69553d'; g.lineWidth=2; g.strokeRect(X,Y,W*S,H*S); g.strokeRect(13,13,1174,774); g.lineWidth=.8; g.strokeRect(19,19,1162,762);
 drawWorldImage(g,'kompass',1020,34,135,135,.98);
 g.fillStyle='#4a3a2a'; g.font='12px Georgia'; g.textAlign='left'; g.fillText('HD-Asset-Pack aktiv', X, 782);
 terrainDirty=false;
}
function marker(g,p){
 let [x,y]=xy(p); g.save(); g.translate(x,y);
 if(p.id===sel){ g.beginPath(); g.arc(0,0,18,0,Math.PI*2); g.strokeStyle='#fff1bd'; g.lineWidth=4; g.stroke(); }
 let name=placeAssetName(p.kind,p), size={city:[48,34], village:[36,26], castle:[50,42], forest:[44,30], mountain:[48,28], ruin:[36,26], port:[48,38], region:[24,30], landmark:[34,30]}[p.kind]||[34,30];
 if(p.kind==='region'){
   drawWorldImage(g,'wegweiser',-size[0]/2,-size[1]/2,size[0],size[1],.96);
 } else {
   drawWorldImage(g,name,-size[0]/2,-size[1]*0.75,size[0],size[1],.98);
 }
 g.font=(p.kind==='region'?'italic ':'bold ')+'16px Georgia'; g.textAlign='center'; g.textBaseline='top'; g.lineJoin='round'; g.strokeStyle='rgba(244,229,189,.95)'; g.lineWidth=5; g.strokeText(p.name,0,14,235); g.fillStyle='#3e3025'; g.fillText(p.name,0,14,235);
 g.restore();
}

function draw(){let a=getAtlas();if(terrainDirty)drawTerrain(a);c.drawImage(terrainCanvas,0,0);c.fillStyle='#483624';c.textAlign='center';c.font='bold 22px Georgia';c.fillText(a.name,600,33,880);c.font='12px Georgia';c.fillText('✦  ATLAS DER KAMPAGNE  ✦',600,782);for(let p of a.places)marker(c,p)}
function selected(){return getAtlas().places.find(p=>p.id===sel)}
function form(p){sel=p?.id||null;$('atlasPlaceName').value=p?.name||'';$('atlasKind').value=p?.kind||'city';$('atlasDescription').value=p?.description||'';$('atlasLink').replaceChildren(new Option('Keine Verknüpfung',''),...project.maps.map(m=>new Option(m.name,m.id)));$('atlasLink').value=p?.mapId||'';renderList();draw()}
function renderList(){let a=getAtlas(),l=$('atlasList');l.replaceChildren();for(let p of a.places){let b=document.createElement('button');b.type='button';b.textContent=p.name+' · '+(names[p.kind]||'Ort');b.className=p.id===sel?'atlasActive':'';b.onclick=()=>form(p);l.append(b)}if(!a.places.length)l.textContent='Noch keine Orte';let p=selected();$('atlasEdit').disabled=$('atlasDelete').disabled=!p;$('atlasGoto').disabled=!p||!project.maps.some(m=>m.id===p.mapId);$('atlasUndo').disabled=!history.length}
function open(){if(!project||testing)return;if(owner!==project){owner=project;history=[];sel=null}let a=getAtlas();$('atlasName').value=a.name;$('atlasShape').value=a.shape;dirtyTerrain();form(selected());say('Orte hinzufügen und generieren oder die Landkarte frei bearbeiten. Das gemalte Weltkarten-Asset-Pack ist aktiv.');D.showModal()}
$('atlasOpen').onclick=open;$('atlasClose').onclick=()=>D.close();D.addEventListener('keydown',e=>e.stopPropagation());D.addEventListener('close',()=>{drag=null;canvas.focus()});
$('atlasName').onchange=()=>{let a=getAtlas(),n=$('atlasName').value.trim()||'Meine Welt';if(n!==a.name){checkpoint();a.name=n;draw()}};$('atlasShape').onchange=()=>{checkpoint();getAtlas().shape=$('atlasShape').value;say('Grundform gewählt. Neu generieren übernimmt sie.')};
function values(){return {name:$('atlasPlaceName').value.trim(),kind:$('atlasKind').value,description:$('atlasDescription').value.trim(),mapId:$('atlasLink').value}}
$('atlasAdd').onclick=()=>{let a=getAtlas(),p=values();if(!p.name){say('Bitte einen Ortsnamen eingeben.');return}if(a.places.length>=100){say('Maximal 100 Orte pro Landkarte.');return}checkpoint();let free=[];for(let y=3;y<H-3;y++)for(let x=3;x<W-3;x++)if(at(a,x,y)!=='water'&&!a.places.some(q=>q.x===x&&q.y===y))free.push({x,y});if(!free.length){history.pop();say('Kein freier Landplatz. Zuerst Land zeichnen.');return}let pos=free[rnd(free.length)];p={...p,...pos,id:idgen()};a.places.push(p);form(p);say('Ort hinzugefügt. „Orte nach Lage anordnen“ übernimmt die Beschreibung.')};
$('atlasEdit').onclick=()=>{let p=selected(),v=values();if(!p||!v.name){say('Bitte einen Ortsnamen eingeben.');return}checkpoint();Object.assign(p,v);form(p);say('Ort aktualisiert.')};$('atlasNew').onclick=()=>form(null);$('atlasDelete').onclick=()=>{if(!selected())return;checkpoint();let a=getAtlas();a.places=a.places.filter(p=>p.id!==sel);form(null);say('Ort entfernt.')};$('atlasGoto').onclick=()=>{let p=selected(),m=project.maps.find(m=>m.id===p?.mapId);if(!m)return;mapId=m.id;layerId=m.layers[0].id;D.close();refresh();fit()};
function arrangeUI(regen){checkpoint();let a=getAtlas();if(regen){a.seed=rnd(1000000);Object.assign(a,createTerrain(a.shape,a.seed));dirtyTerrain()}let warnings=arrange(a);renderList();draw();say(warnings.length?warnings.join('\n'):'Orte angeordnet. Du kannst sie nun frei verschieben.')}
$('atlasGenerate').onclick=()=>arrangeUI(true);$('atlasArrange').onclick=()=>arrangeUI(false);$('atlasUndo').onclick=()=>{if(!history.length)return;project.atlas=history.pop();setDirty();dirtyTerrain();$('atlasName').value=getAtlas().name;$('atlasShape').value=getAtlas().shape;form(selected());say('Letzte Änderung rückgängig gemacht.')};
$('atlasPNG').onclick=()=>{let old=sel;sel=null;draw();C.toBlob(b=>{if(!b)return;let u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=getAtlas().name.replace(/[^\p{L}\p{N} _-]/gu,'_')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)},'image/png');sel=old;draw()};
for(let b of D.querySelectorAll('[data-atlas-tool]'))b.onclick=()=>{tool=b.dataset.atlasTool;for(let q of D.querySelectorAll('[data-atlas-tool]'))q.classList.toggle('atlasActive',q===b)};

let zoom=1, panMode=false, panDrag=null;
const wrap=C.parentElement;
function zoomTo(v,cx=wrap.clientWidth/2,cy=wrap.clientHeight/2){const oldW=C.offsetWidth||1,oldH=C.offsetHeight||1,fx=(wrap.scrollLeft+cx)/oldW,fy=(wrap.scrollTop+cy)/oldH;zoom=clamp(v,1,4);C.style.width=(zoom*100)+'%';$('atlasZoomLabel').textContent=Math.round(zoom*100)+' %';wrap.scrollLeft=fx*C.offsetWidth-cx;wrap.scrollTop=fy*C.offsetHeight-cy;}
$('atlasZoomIn').onclick=()=>zoomTo(zoom*1.25);$('atlasZoomOut').onclick=()=>zoomTo(zoom/1.25);$('atlasZoomFit').onclick=()=>{zoomTo(1);wrap.scrollLeft=wrap.scrollTop=0};
$('atlasPan').onclick=()=>{panMode=!panMode; $('atlasPan').classList.toggle('atlasActive',panMode); C.classList.toggle('pan',panMode);};
wrap.addEventListener('wheel',e=>{e.preventDefault();let r=wrap.getBoundingClientRect();zoomTo(zoom*(e.deltaY<0?1.15:1/1.15),e.clientX-r.left,e.clientY-r.top)},{passive:false});
C.addEventListener('pointerdown',e=>{if(!panMode&&e.button!==1)return;e.preventDefault();e.stopImmediatePropagation();panDrag={id:e.pointerId,x:e.clientX,y:e.clientY,sx:wrap.scrollLeft,sy:wrap.scrollTop};C.setPointerCapture(e.pointerId)},true);
C.addEventListener('pointermove',e=>{if(panDrag?.id!==e.pointerId)return;e.stopImmediatePropagation();wrap.scrollLeft=panDrag.sx+panDrag.x-e.clientX;wrap.scrollTop=panDrag.sy+panDrag.y-e.clientY},true);
for(const type of ['pointerup','pointercancel','lostpointercapture'])C.addEventListener(type,e=>{if(panDrag?.id===e.pointerId){panDrag=null;e.stopImmediatePropagation()}},true);
D.addEventListener('close',()=>{panDrag=null;panMode=false;C.classList.remove('pan');$('atlasPan').classList.remove('atlasActive')});

function point(e){let r=C.getBoundingClientRect(),scale=Math.min(r.width/C.width,r.height/C.height),left=r.left+(r.width-C.width*scale)/2,top=r.top+(r.height-C.height*scale)/2;return {x:Math.floor(((e.clientX-left)/scale-X)/S),y:Math.floor(((e.clientY-top)/scale-Y)/S)}}
function brush(p){let a=getAtlas();if(tool==='erase'){a.lines=a.lines.filter(l=>!l.points.some((q,i)=>i&&dseg(p.x,p.y,l.points[i-1],q)<=1.5));dirtyTerrain();return}if(tool==='river'||tool==='road'){let l=drag.line,last=l.points.at(-1);if(!last||last.x!==p.x||last.y!==p.y)l.points.push(p);dirtyTerrain();return}let r=+$('atlasBrush').value-1;for(let y=p.y-r;y<=p.y+r;y++)for(let x=p.x-r;x<=p.x+r;x++)if(valid(x,y)&&Math.hypot(x-p.x,y-p.y)<=r+.4)a.tiles[idx(x,y)]=tool;dirtyTerrain()}
C.onpointerdown=e=>{if(e.button!==0)return;let p=point(e);if(!valid(p.x,p.y))return;C.setPointerCapture(e.pointerId);if(tool==='select'){let q=getAtlas().places.reduce((best,t)=>Math.hypot(t.x-p.x,t.y-p.y)<Math.hypot((best?.x??999)-p.x,(best?.y??999)-p.y)?t:best,null);if(q&&Math.hypot(q.x-p.x,q.y-p.y)<=1.6){form(q);drag={id:e.pointerId,place:q,changed:false}}else if(selected()){drag={id:e.pointerId,place:selected(),changed:false};movePlace(p)}return}checkpoint();drag={id:e.pointerId,last:p};if(tool==='river'||tool==='road'){drag.line={kind:tool,points:[]};getAtlas().lines.push(drag.line)}brush(p);draw()};
function movePlace(p){if(!valid(p.x,p.y)||!drag?.place)return;let q=drag.place;if(q.x===p.x&&q.y===p.y)return;if(getAtlas().places.some(t=>t.id!==q.id&&t.x===p.x&&t.y===p.y))return;if(!drag.changed){checkpoint();drag.changed=true}Object.assign(q,p);draw()}
C.onpointermove=e=>{if(drag?.id!==e.pointerId)return;let p=point(e);if(!valid(p.x,p.y))return;if(drag.place){movePlace(p);return}let prev=drag.last||p,n=Math.max(Math.abs(p.x-prev.x),Math.abs(p.y-prev.y),1);for(let i=1;i<=n;i++)brush({x:Math.round(prev.x+(p.x-prev.x)*i/n),y:Math.round(prev.y+(p.y-prev.y)*i/n)});drag.last=p;draw()};C.onpointerup=C.onpointercancel=C.onlostpointercapture=()=>{if(drag?.line&&drag.line.points.length<2){let a=getAtlas();a.lines=a.lines.filter(l=>l!==drag.line);dirtyTerrain();draw()}drag=null};
})();
