import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),warp=path.join(root,'warp','maps'),output=path.join(warp,'path-manifest.json');
const sha256=body=>crypto.createHash('sha256').update(body).digest('hex').toUpperCase(),files=[];
const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const target=path.join(directory,entry.name);if(entry.isDirectory())walk(target);else if(target!==output){const body=fs.readFileSync(target);files.push({path:path.relative(root,target).split(path.sep).join('/'),bytes:body.length,sha256:sha256(body)})}}};
walk(warp);files.sort((a,b)=>a.path.localeCompare(b.path));
fs.writeFileSync(output,JSON.stringify({schema_version:'1.0.0',generated_at_utc:'2026-10-20T00:00:00Z',files},null,2)+'\n');
console.log(JSON.stringify({files:files.length,output},null,2));
