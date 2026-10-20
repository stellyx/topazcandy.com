import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const qhcf=path.join(root,'qhcf');
const archive=path.join(root,'warp','maps','archive','cf');
const outputManifest=path.join(root,'warp','maps','legacy-redirect-manifest.json');
const sha256=body=>crypto.createHash('sha256').update(body).digest('hex').toUpperCase();

const targets=[];
for(const entry of fs.readdirSync(path.join(qhcf,'areas'),{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.html'))targets.push(path.join('areas',entry.name));
for(const entry of fs.readdirSync(qhcf,{withFileTypes:true}))if(entry.isFile()&&entry.name.endsWith('.html')&&entry.name!=='academy-temple-coverage.html')targets.push(entry.name);
targets.push(path.join('navigation','index.html'));
targets.sort((a,b)=>a.localeCompare(b));

const records=[];
for(const relative of targets){
 const legacy=path.join(qhcf,relative),counterpart=path.join(archive,relative);
 if(!fs.existsSync(counterpart))throw Error(`Missing reviewed archive counterpart: ${relative}`);
 const destination=relative==='index.html'?'/warp/maps/archive/cf/':'/warp/maps/archive/cf/'+relative.split(path.sep).join('/');
 const canonical='https://topazcandy.com'+destination;
 const title=relative==='index.html'?'Historical Carrion Fields Atlas':'Historical map moved';
 const shell=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta http-equiv="refresh" content="0; url=${destination}"><link rel="canonical" href="${canonical}"><script>location.replace(${JSON.stringify(destination)}+location.search+location.hash)</script></head><body><main><h1>This historical map has moved</h1><p><a href="${destination}">Continue to its preserved address</a>.</p></main></body></html>\n`;
 fs.writeFileSync(legacy,shell);
 records.push({legacy_path:'/qhcf/'+relative.split(path.sep).join('/'),destination,canonical,sha256:sha256(shell)});
}

const manifest={schema_version:'1.0.0',installed_at_utc:'2026-10-20T00:00:00Z',purpose:'Legacy map-facing HTML compatibility redirects after verified additive WARP deployment',redirect_count:records.length,protected_unchanged_prefixes:['/qhcf/references/','/qhcf/data/'],protected_unchanged_paths:['/qhcf/academy-temple-coverage.html','/qhcf/maps.json','/qhcf/manifest.json','/qhcf/reference.txt'],redirects:records};
fs.writeFileSync(outputManifest,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({redirects:records.length,areas:records.filter(record=>record.legacy_path.startsWith('/qhcf/areas/')).length},null,2));
