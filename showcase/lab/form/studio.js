import {PARTS,COLORS,SYSTEMS,GRAPHICS,INK_COLORS,HARDWARE_COLORS,RANDOM_LOCKS,defaultBuild,sanitizeBuild,sanitizeView,optionsFor,optionFor,colorFor,graphicFor,systemFor,totalFor,hardwareFor,connectorCount} from './catalog.js';
import qrcode from './vendor/qrcode.mjs';

export const FAVORITES_LIMIT=8;
export const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cleanName=value=>String(value||'Untitled piece').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,40)||'Untitled piece';
export function sanitizeFavorites(raw){
  if(!Array.isArray(raw))return [];
  const ids=new Set();return raw.filter(f=>f&&typeof f.id==='string'&&f.id!=='current'&&/^[\w-]{1,80}$/.test(f.id)&&!ids.has(f.id)&&ids.add(f.id)&&SYSTEMS.some(s=>s.id===f.configuration?.system)).slice(0,FAVORITES_LIMIT).map(f=>({id:f.id,name:cleanName(f.name),configuration:sanitizeBuild(f.configuration),image:typeof f.image==='string'&&f.image.length<300000&&/^data:image\/png;base64,[\w+/=]+$/.test(f.image)?f.image:null}));
}
export function saveFavorite(favorites,build,name,image=null,id=globalThis.crypto.randomUUID()){
  const clean=sanitizeFavorites(favorites);if(clean.length>=FAVORITES_LIMIT)throw Error('Your shelf is full. Remove a favorite to save another.');
  return sanitizeFavorites([...clean,{id,name,configuration:sanitizeBuild(build),image}]);
}

// A compact, whitelisted configuration travels in the URL fragment. No upload occurs.
export function encodeBuild(build){
  const clean=sanitizeBuild(build),payload={v:1,s:clean.system,p:PARTS.map(p=>[optionsFor(clean,p.id).findIndex(o=>o.id===clean.parts[p.id].shape),COLORS.findIndex(c=>c.id===clean.parts[p.id].color),clean.parts[p.id].enabled?1:0,GRAPHICS.findIndex(g=>g.id===clean.parts[p.id].graphic)]),i:INK_COLORS.findIndex(i=>i.id===clean.ink),h:HARDWARE_COLORS.findIndex(h=>h.id===clean.hardware),b:clean.background==='light'?1:0,x:clean.exploded?1:0,m:clean.smoke?1:0,l:RANDOM_LOCKS.map(l=>clean.locks[l.id]?1:0),c:clean.view?[clean.view.azimuth,clean.view.polar,clean.view.zoom,...clean.view.rotation]:null};
  return btoa(JSON.stringify(payload)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeBuild(code){
  if(typeof code!=='string'||code.length>2000||!/^[\w-]+$/.test(code))throw Error('Invalid build code');
  const raw=JSON.parse(atob(code.replace(/-/g,'+').replace(/_/g,'/'))),index=(list,n)=>Number.isInteger(n)&&n>=0&&n<list.length;
  if(raw.v!==1||!SYSTEMS.some(s=>s.id===raw.s)||!Array.isArray(raw.p)||raw.p.length!==PARTS.length||!index(INK_COLORS,raw.i)||!index(HARDWARE_COLORS,raw.h)||![raw.b,raw.x,raw.m].every(n=>n===0||n===1)||!Array.isArray(raw.l)||raw.l.length!==RANDOM_LOCKS.length||!raw.l.every(n=>n===0||n===1))throw Error('Invalid build choices');
  const build=defaultBuild(raw.s);
  PARTS.forEach((p,i)=>{const row=raw.p[i];if(!Array.isArray(row)||row.length!==4||!index(optionsFor(build,p.id),row[0])||!index(COLORS,row[1])||![0,1].includes(row[2])||!index(GRAPHICS,row[3]))throw Error('Invalid part choices');build.parts[p.id]={shape:optionsFor(build,p.id)[row[0]].id,color:COLORS[row[1]].id,enabled:!!row[2],graphic:GRAPHICS[row[3]].id};});
  build.ink=INK_COLORS[raw.i].id;build.hardware=HARDWARE_COLORS[raw.h].id;build.background=raw.b?'light':'dark';build.exploded=!!raw.x;build.smoke=true;
  RANDOM_LOCKS.forEach((lock,i)=>build.locks[lock.id]=!!raw.l[i]);
  if(raw.c!==null){if(!Array.isArray(raw.c)||raw.c.length!==6||!raw.c.every(n=>typeof n==='number'&&Number.isFinite(n)))throw Error('Invalid saved view');build.view=sanitizeView({azimuth:raw.c[0],polar:raw.c[1],zoom:raw.c[2],rotation:raw.c.slice(3)});}
  return build;
}
export function shareURL(build,baseURL){const url=new URL(baseURL);url.search='';url.hash='build='+encodeBuild(build);return url.href;}
export function qrSVG(url){const qr=qrcode(0,'M');qr.addData(url,'Byte');qr.make();return qr.createSvgTag({cellSize:3,margin:12,scalable:true});}
export function comparisonFor(left,right){
  const rows=PARTS.map(p=>{const summary=build=>build.parts[p.id].enabled?optionFor(build,p.id).name+' · '+colorFor(build,p.id).name+' · '+GRAPHICS.find(g=>g.id===build.parts[p.id].graphic).name:'Not included';return {label:p.name,left:summary(left),right:summary(right),different:JSON.stringify(left.parts[p.id])!==JSON.stringify(right.parts[p.id])||left.system!==right.system};});
  rows.push(...[{label:'System',left:systemFor(left).name,right:systemFor(right).name},{label:'Ink',left:INK_COLORS.find(i=>i.id===left.ink).name,right:INK_COLORS.find(i=>i.id===right.ink).name},{label:'Connector finish',left:HARDWARE_COLORS.find(h=>h.id===left.hardware).name,right:HARDWARE_COLORS.find(h=>h.id===right.hardware).name},{label:'Stack joints',left:String(connectorCount(left)),right:String(connectorCount(right))}].map(r=>({...r,different:r.left!==r.right})));
  return {rows,leftSubtotal:totalFor(left),rightSubtotal:totalFor(right),delta:Math.round((totalFor(right)-totalFor(left))*100)/100,sameFamily:left.system===right.system,unpriced:[left,right].some(b=>hardwareFor(b).some(h=>h.unitPrice===null)),hasArt:[left,right].some(b=>PARTS.some(p=>b.parts[p.id].enabled&&graphicFor(b,p.id)!=='none'))};
}
