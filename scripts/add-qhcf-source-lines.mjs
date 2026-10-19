import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname),q=path.join(root,'qhcf');
const maps=JSON.parse(fs.readFileSync(path.join(q,'maps.json'),'utf8')).maps;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slug=v=>v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'area';
const seen=new Map();
for(const map of maps){const base=slug(map.title),n=(seen.get(base)||0)+1;seen.set(base,n);const name=n===1?base:`${base}-${n}`;const source=map.lines.map((line,row)=>[...line].map((ch,col)=>ch===' '?'':`<text x="${12+col*18}" y="${26+row*18}" fill="#4a7776" font-family="ui-monospace,monospace" font-size="11" text-anchor="middle">${esc(ch)}</text>`).join('')).join('');const file=path.join(q,'areas',name+'.html');let html=fs.readFileSync(file,'utf8');html=html.replace('<rect width="100%" height="100%" fill="#0a1518"/>','<rect width="100%" height="100%" fill="#0a1518"/>'+source);fs.writeFileSync(file,html);}
