import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceArg=process.argv[2];
if(!sourceArg)throw Error('Usage: node scripts/enrich-warp-public-town.mjs <fakedb.data.CMROOM>');
const source=path.resolve(sourceArg);
const output=path.join(root,'warp','maps','public-town.json');
const bytes=fs.readFileSync(source),text=bytes.toString('utf8');
const recordPattern=/^-\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]+)\r?\n([^\r\n]*)/gm;
const content=new Map();
for(const match of text.matchAll(recordPattern)){
 const [,id,roomClass,area,title,description]=match;
 if(!/^WarpGaladonSeed#\d+$/.test(id))continue;
 if(roomClass!=='StdRoom'||area!=='WarpGaladonSeed')throw Error(`Unexpected public-town room record: ${id}`);
 if(content.has(id))throw Error(`Duplicate public-town room record: ${id}`);
 content.set(id,{title,description});
}
const data=JSON.parse(fs.readFileSync(output,'utf8'));
if(content.size!==data.contract.room_count)throw Error(`Expected ${data.contract.room_count} content records, found ${content.size}`);
for(const room of data.rooms){
 const record=content.get(room.id);
 if(!record)throw Error(`Missing content for ${room.id}`);
 if(/\[CONTENT PENDING\]|story dressing is still pending/i.test(record.title+' '+record.description))throw Error(`Pending content remains in ${room.id}`);
 room.title=record.title;
 room.description=record.description;
}
data.content_contract={
 source_candidate:'WARP Galadon v4.1.4 sealed offline complete-content candidate',
 source_cmroom_sha256:crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),
 sanitized_room_content_sha256:crypto.createHash('sha256').update(JSON.stringify([...content].map(([id,value])=>({id,...value})))).digest('hex').toUpperCase(),
 authored_room_count:content.size,
 content_pending_rooms:0,
 live_gameplay_verified:false,
 protected_rooms_modified:0
};
data.route_previews={available:true,separator:';;',live_gameplay_verified:false,executable:false,note:'Routes are shortest paths inside the sealed offline candidate only. They do not prove the installed game matches this graph.'};
fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({rooms:content.size,source_cmroom_sha256:data.content_contract.source_cmroom_sha256,output},null,2));
