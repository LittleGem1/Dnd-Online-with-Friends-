'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const rooms=new Map(), token=()=>crypto.randomBytes(18).toString('hex');
const MAX=48*1024*1024, TTL=6*60*60*1000;
function reply(res,status,body,type='text/plain; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body)}
const json=(res,data)=>reply(res,200,JSON.stringify(data),'application/json');
const publicFiles={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/game.js':'game.js','/assets/main-menu.webp':'assets/main-menu.webp','/assets/tavern.webp':'assets/tavern.webp'};
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp'};
function file(res,name){reply(res,200,fs.readFileSync(path.join(__dirname,'public',name)),mime[path.extname(name)]||'application/octet-stream')}

async function body(req){let chunks=[],n=0;for await(const c of req){n+=c.length;if(n>MAX){let e=Error('Audiodatei zu groß (max. ca. 35 MB)');e.status=413;throw e}chunks.push(c)}return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
function expired(r){return Date.now()-r.touched>TTL}
setInterval(()=>{for(const [k,r] of rooms)if(expired(r))rooms.delete(k)},60000).unref();
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 if(req.method==='GET'&&p==='/health')return json(res,{ok:true});
 if(req.method==='GET'&&Object.hasOwn(publicFiles,p))return file(res,publicFiles[p]);
 if(req.method==='GET'&&/^\/listen\/[a-f0-9]{36}$/.test(p))return file(res,'listener.html');
 if(p==='/api/music'&&req.method==='POST'){if(rooms.size>=3)return reply(res,503,'Zu viele aktive Musiksessionen.');const room=token(),key=token();rooms.set(room,{key,touched:Date.now(),mode:'stopped',pos:0,loop:false,at:Date.now(),rev:0,track:null});return json(res,{room,key})}
 const m=/^\/api\/music\/([a-f0-9]{36})(?:\/(state|audio))?$/.exec(p);if(!m)return reply(res,404,'Nicht gefunden');const [_,id,action]=m,r=rooms.get(id);if(!r||expired(r))return reply(res,404,'Session beendet');
 if(req.method==='GET'&&action==='state'){const {mode,pos,loop,at,rev,track}=r;return json(res,{mode,pos,loop,at,rev,now:Date.now(),track:track?{id:track.id,name:track.name,url:track.bytes?'/api/music/'+id+'/audio?v='+track.version:track.url}:null})}
 if(req.method==='GET'&&action==='audio'){const t=r.track;if(!t?.bytes||u.searchParams.get('v')!==t.version)return reply(res,404,'Audio nicht mehr verfügbar');const size=t.bytes.length,range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');let start=0,end=size-1;if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):end;if(start>end||start>=size){res.writeHead(416,{'Content-Range':'bytes */'+size});return res.end()}}const headers={'Content-Type':t.mime,'Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(range)headers['Content-Range']=`bytes ${start}-${end}/${size}`;res.writeHead(range?206:200,headers);return res.end(t.bytes.subarray(start,end+1))}
 if(req.headers['x-dm-key']!==r.key)return reply(res,403,'Nur der DM darf die Musik steuern.');
 if(req.method==='DELETE'&&!action){rooms.delete(id);return json(res,{ok:true})}
 if(req.method==='POST'&&action==='state'){const d=await body(req);if(rooms.get(id)!==r)return reply(res,404,'Session beendet');if(!['playing','paused','stopped'].includes(d.mode))return reply(res,400,'Ungültiger Status');if(d.track){const t=d.track;if(typeof t.id!=='string'||typeof t.name!=='string'||typeof t.url!=='string')return reply(res,400,'Ungültiger Track');let a=/^data:(audio\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i.exec(t.url);if(a){r.track={id:t.id,name:t.name.slice(0,100),bytes:Buffer.from(a[2],'base64'),mime:a[1],version:token()}}else{return reply(res,400,'Nur hochgeladene Audiodateien sind erlaubt.')}}if(d.mode!=='stopped'&&(!r.track||r.track.id!==d.trackId))return reply(res,409,'Track fehlt');r.mode=d.mode;r.pos=Math.max(0,Number(d.pos)||0);r.loop=!!d.loop;r.at=r.touched=Date.now();r.rev++;return json(res,{ok:true})}
 return reply(res,405,'Nicht unterstützt');
 }catch(e){if(!res.headersSent)reply(res,e.status||400,e.status?e.message:'Anfrage konnte nicht verarbeitet werden.');else res.end()}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('DnD Musikserver läuft auf Port '+(process.env.PORT||3000)));
