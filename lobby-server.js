'use strict';
const crypto=require('node:crypto'),{walkable,spawnCells}=require('./collision');
const campaign=require('./campaign');
const rooms=new Map(),TTL=6*60*60*1000,OFFLINE=90*1000;
const key=()=>crypto.randomBytes(24).toString('hex');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
const safeName=(v,max=80)=>typeof v==='string'?v.trim().slice(0,max):'';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code(){let c;do{c=Array.from({length:8},()=>alphabet[crypto.randomInt(alphabet.length)]).join('')}while(rooms.has(c));return c}
function sweep(){let now=Date.now();for(const [c,r] of rooms){if(now-r.touched>TTL){rooms.delete(c);continue}if(!r.started)for(const [k,p] of r.players)if(now-p.seen>OFFLINE)r.players.delete(k)}}
setInterval(sweep,15000).unref();
function view(r,actor){let dm=actor.role==='dm';return {code:r.code,name:r.name,started:r.started,role:actor.role,number:actor.number??null,campaignReady:!!r.campaign,maps:r.campaign?(dm?[...r.campaign.maps.values()].map(campaign.publicMap):r.started?[campaign.publicMap(r.campaign.maps.get(actor.mapId))]:[]):[],players:[...r.players.values()].sort((a,b)=>a.number-b.number).map(({number,name,image,x,y,ready,seen,mapId})=>{let visible=!r.started||dm||mapId===actor.mapId;return {number,name,image:visible?image:'',x:visible?x:null,y:visible?y:null,mapId:visible?mapId:null,ready,online:Date.now()-seen<OFFLINE}}),hostOnline:Date.now()-r.hostSeen<OFFLINE}}
function actor(r,req){let t=req.headers.authorization?.replace(/^Bearer /,'');if(t===r.secret)return {role:'dm'};let p=r.players.get(t);if(!p)fail(403,'Ungültiger Sitzungsschlüssel. Bitte erneut beitreten.');return p}
async function read(req,max=400000){let n=0,chunks=[];for await(let c of req){n+=c.length;if(n>max)fail(413,'Datei zu groß.');chunks.push(c)}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}')}catch{fail(400,'Ungültige Anfrage.')}}
function send(res,obj){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj))}
async function handle(req,res,p){if(!p.startsWith('/api/lobby'))return false;
 if(req.method==='POST'&&p==='/api/lobby'){sweep();if(rooms.size>=20)fail(503,'Zu viele aktive Lobbys.');let d=await read(req,12*1024*1024),name=safeName(d.name);if(!name)fail(400,'Kampagnenname fehlt.');let c=code(),secret=key(),r={code:c,name,secret,players:new Map(),hostSeen:Date.now(),touched:Date.now(),started:false,campaign:d.campaign?campaign.parseCampaign(d.campaign):null};if(r.campaign&&[...rooms.values()].filter(r=>r.campaign).length>=5)fail(503,'Zu viele aktive Kampagnen.');rooms.set(c,r);send(res,{token:secret,state:view(r,{role:'dm'})});return true}
 let m=/^\/api\/lobby\/([A-Z2-9]{8})(?:\/(join|action|map))?$/.exec(p);if(!m)fail(404,'Lobby nicht gefunden.');sweep();let r=rooms.get(m[1]);if(!r)fail(404,'Lobby nicht gefunden oder beendet.');
 if(req.method==='POST'&&m[2]==='join'){if(r.started)fail(409,'Spiel wurde bereits gestartet.');let d=await read(req),name=safeName(d.name),image=d.image||'';if(!name)fail(400,'Charaktername fehlt.');if(typeof image!=='string'||image.length>350000||image&&!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image))fail(400,'Ungültiges Profilbild.');if(r.players.size>=32)fail(409,'Lobby ist voll.');let number=1;while([...r.players.values()].some(p=>p.number===number))number++;let pos=spawnCells.find(([x,y])=>![...r.players.values()].some(p=>p.x===x&&p.y===y));if(!pos)fail(409,'Kein freier Platz.');let t=key(),a={role:'player',number,name,image,x:pos[0],y:pos[1],ready:false,seen:Date.now(),lastMove:0};r.players.set(t,a);r.touched=Date.now();send(res,{token:t,state:view(r,a)});return true}
 let a=actor(r,req);r.touched=Date.now();if(a.role==='dm')r.hostSeen=Date.now();else a.seen=Date.now();
 if(req.method==='GET'&&m[2]==='map'){let id=new URL(req.url,'http://localhost').searchParams.get('id');let map=r.campaign?.maps.get(id);if(!map||a.role!=='dm'&&(!r.started||a.mapId!==id))fail(403,'Diese Karte ist nicht freigegeben.');send(res,{...campaign.publicMap(map),image:map.image});return true}
 if(req.method==='GET'&&!m[2]){send(res,view(r,a));return true}
 if(req.method!=='POST'||m[2]!=='action')fail(405,'Nicht unterstützt.');let d=await read(req);
 if(d.type==='transfer'){if(a.role!=='dm')fail(403,'Nur der DM darf versetzen.');campaign.transfer(r,d)}
 else if(d.type==='start'||d.type==='reset'||d.type==='close'){if(a.role!=='dm')fail(403,'Nur der DM darf das.');if(d.type==='close'){rooms.delete(r.code);send(res,{closed:true});return true}if(d.type==='start'){if(r.started||!r.players.size||[...r.players.values()].some(p=>!p.ready||Date.now()-p.seen>=OFFLINE))fail(409,'Alle Spieler müssen online und bereit sein.');campaign.allocate(r);r.started=true}else{r.started=false;let i=0;for(const p of r.players.values()){p.ready=false;p.mapId=null;[p.x,p.y]=spawnCells[i++];}}}
 else {if(a.role!=='player')fail(403,'Nur Spieler können diese Aktion ausführen.');if(d.type==='leave'){for(const [t,p] of r.players)if(p===a)r.players.delete(t);send(res,{left:true});return true}if(d.type==='ready'){if(r.started)fail(409,'Spiel läuft bereits.');a.ready=!!d.ready;}else if(d.type==='move'){let dx=d.dx,dy=d.dy;if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)!==1)fail(400,'Ungültige Bewegung.');let now=Date.now(),x=a.x+dx,y=a.y+dy;if(now-a.lastMove>=95&&(r.started?campaign.step(r,a,dx,dy):walkable(x,y)&&![...r.players.values()].some(p=>p!==a&&p.x===x&&p.y===y))){a.x=x;a.y=y;a.lastMove=now}}else fail(400,'Unbekannte Aktion.')}
 send(res,view(r,a));return true
}
module.exports={handle};
