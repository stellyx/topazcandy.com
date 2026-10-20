import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const warp=path.join(root,'warp','maps');
const archive=path.join(warp,'archive','cf');
const data=JSON.parse(fs.readFileSync(path.join(warp,'public-town.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(warp,'migration-manifest.json'),'utf8'));
const pathManifest=JSON.parse(fs.readFileSync(path.join(warp,'path-manifest.json'),'utf8'));

test('public WARP candidate preserves the sealed topology contract',()=>{
 assert.equal(data.status,'SEALED_OFFLINE_CONTENT_CANDIDATE_AWAITING_DIRECTION_CONFIG_AND_INTEGRATOR_ACCEPTANCE');
 assert.equal(data.live_gameplay_verified,false);
 assert.equal(data.executable_routes,false);
 assert.equal(data.contract.topology_sha256,'0B1A909AF1190F33FD61E0822BE6A57E9ACEC3178E43C3A16A93AD81D5095C53');
 assert.equal(data.rooms.length,204);
 assert.equal(new Set(data.rooms.map(room=>room.id)).size,204);
 assert.deepEqual(data.rooms.map(room=>room.id).sort((a,b)=>+a.split('#')[1]-+b.split('#')[1]),Array.from({length:204},(_,i)=>`WarpGaladonSeed#${i}`));
 assert.equal(data.rooms.reduce((sum,room)=>sum+Object.keys(room.exits).length,0),440);
});

test('public export exposes only reviewed public-town structure fields',()=>{
 const allowed=['description','exits','id','position','source_kind','source_label_for_reference_only','source_node_id','title'];
 for(const room of data.rooms){
  assert.deepEqual(Object.keys(room).sort(),allowed);
  assert.deepEqual(Object.keys(room.position).sort(),['x','y','z']);
  for(const target of Object.values(room.exits))assert.ok(data.rooms.some(candidate=>candidate.id===target),`${room.id} -> ${target}`);
 }
 const text=JSON.stringify(data).toLowerCase();
 for(const forbidden of ['password','auth_token','player_record','family_tree','private_home','timeline_event'])assert.equal(text.includes(forbidden),false,forbidden);
});

test('WARP-facing page separates offline route previews from executable gameplay',()=>{
 const html=fs.readFileSync(path.join(warp,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(warp,'maps.css'),'utf8');
 const module=fs.readFileSync(path.join(warp,'map.mjs'),'utf8');
 const qhcfMentions=[...html.matchAll(/\bQHCF\b/g)];
 assert.equal(qhcfMentions.length,2,'only the intentionally retained reference label and source credit may name QHCF');
 assert.match(html,/>QHCF ranking &amp; items<\/a>/);
 assert.match(html,/QHCF \/ DIKU-WIKI contributors/);
 assert.match(html,/WARP Maps/);
 assert.match(html,/Offline candidate, not installed-game proof/);
 assert.match(html,/id="copy-route"[^>]*disabled/);
 assert.match(html,/Double-semicolon command text/);
 assert.match(module,/planCandidateRoute/);
 assert.match(module,/Not live-game verified or executable/);
 assert.doesNotMatch(module,/send\(|WebSocket|Mudlet/i);
 assert.match(html,/http:\/\/wiki\.qhcf\.net\/index\.php\?title=Galadon/);
 assert.match(css,/\.map-shell>\*\{min-width:0\}/,'wide SVG must stay inside its scroll pane on phones');
});

test('historical archive is complete, credited, and visibly non-current',()=>{
 const areas=fs.readdirSync(path.join(archive,'areas')).filter(name=>name.endsWith('.html'));
 assert.equal(areas.length,170);
 assert.equal(manifest.archive.area_pages,170);
 const landing=fs.readFileSync(path.join(archive,'index.html'),'utf8');
 const galadon=fs.readFileSync(path.join(archive,'areas','galadon.html'),'utf8');
 for(const html of [landing,galadon]){
  assert.match(html,/Historical Carrion Fields archive/);
  assert.match(html,/not verified as current WARP gameplay/);
  assert.match(html,/rel="canonical" href="https:\/\/topazcandy\.com\/warp\/maps\/archive\/cf\//);
 }
 assert.match(galadon,/wiki\.qhcf\.net\/index\.php\?title=Galadon&amp;oldid=5044/);
 assert.match(galadon,/Stable ID: qhcf\.area\.galadon/);
 assert.match(landing,/<link rel="canonical" href="https:\/\/topazcandy\.com\/warp\/maps\/archive\/cf\/">/);
 assert.doesNotMatch(landing,/rel="canonical" href="[^"]*index\.html"/);
});

test('archive root-absolute local links resolve',()=>{
 const files=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const target=path.join(dir,entry.name);if(entry.isDirectory())walk(target);else if(/\.(?:html|mjs|js|css)$/i.test(entry.name))files.push(target)}};walk(archive);
 const missing=new Set();
 for(const file of files){const text=fs.readFileSync(file,'utf8');for(const match of text.matchAll(/(?:href|src|fetch\(|from\s+)[=(]?['"](\/[^'"?#)]+)/g)){const url=match[1];if(url.includes('${'))continue;if(url.startsWith('/warp/maps/archive/cf/')){const target=path.join(root,...url.split('/').filter(Boolean));if(!(fs.existsSync(target)||fs.existsSync(path.join(target,'index.html'))))missing.add(url)}else if(url.startsWith('/qhcf/references/')||url==='/qhcf/academy-temple-coverage.html'){const target=path.join(root,...url.split('/').filter(Boolean));if(!fs.existsSync(target))missing.add(url)}}}
 assert.deepEqual([...missing],[]);
});

test('protected QHCF reference paths remain the declared destinations',()=>{
 assert.equal(manifest.destinations.qhcf_ranking_items,'/qhcf/references/ranking-items.html');
 assert.deepEqual(manifest.protected_paths,[
  '/qhcf/references/ranking-items.html','/qhcf/references/ranking-items.json','/qhcf/references/ranking-items.csv','/qhcf/references/ranking-items-SOURCE-NOTES.md'
 ]);
 for(const item of manifest.protected_paths)assert.ok(fs.existsSync(path.join(root,...item.split('/').filter(Boolean))),item);
});

test('path manifest names and hashes every additive destination file',async()=>{
 const crypto=await import('node:crypto'),sha=body=>crypto.createHash('sha256').update(body).digest('hex').toUpperCase();
 assert.ok(pathManifest.files.length>500);
 for(const item of pathManifest.files){const target=path.join(root,...item.path.split('/'));assert.ok(fs.existsSync(target),item.path);const body=fs.readFileSync(target);assert.equal(body.length,item.bytes,item.path);assert.equal(sha(body),item.sha256,item.path)}
});
