import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildRoomIndex,planCandidateRoute} from '../warp/maps/route-engine.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const warp=path.join(root,'warp','maps');
const data=JSON.parse(fs.readFileSync(path.join(warp,'public-town.json'),'utf8'));

test('sanitized room content is complete, unique, and provenance-bound',()=>{
 assert.equal(data.content_contract.source_cmroom_sha256,'247DAF4E203BD6697CCA57EE7C8A3B819398C6EDAFDF515B0AD2C2F6F3E3FA25');
 assert.equal(data.content_contract.sanitized_room_content_sha256,'4252B422BE78F6364B5B77AA2E343BE0DE9B1F48E2F0790D9C867F050737C097');
 assert.equal(data.content_contract.authored_room_count,204);
 assert.equal(data.content_contract.content_pending_rooms,0);
 assert.equal(new Set(data.rooms.map(room=>room.title)).size,204);
 assert.equal(new Set(data.rooms.map(room=>room.description)).size,204);
 for(const room of data.rooms){assert.ok(room.title.trim(),room.id);assert.ok(room.description.trim(),room.id);assert.doesNotMatch(room.title+room.description,/CONTENT PENDING/i)}
 const sanitized=data.rooms.map(({id,title,description})=>({id,title,description}));
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(sanitized)).digest('hex').toUpperCase(),data.content_contract.sanitized_room_content_sha256);
});

test('route previews preserve exact step counts and double-semicolon output',()=>{
 const south=planCandidateRoute(data,'WarpGaladonSeed#0','WarpGaladonSeed#3');
 assert.equal(south.status,'SNAPSHOT_ROUTE');assert.equal(south.movement_count,3);assert.equal(south.copy_commands,'south;;south;;south');assert.equal(south.commands.length,south.steps.length-1);
 const north=planCandidateRoute(data,'WarpGaladonSeed#3','WarpGaladonSeed#0');
 assert.equal(north.copy_commands,'north;;north;;north');assert.equal(north.movement_count,3);
 for(const route of [south,north]){assert.equal(route.executable,false);assert.equal(route.live_gameplay_verified,false);assert.ok(!route.copy_commands.endsWith(';;'))}
});

test('installed release uses the reconciled west/east pair and no diagonal commands',()=>{
 const forward=planCandidateRoute(data,'WarpGaladonSeed#39','WarpGaladonSeed#62'),reverse=planCandidateRoute(data,'WarpGaladonSeed#62','WarpGaladonSeed#39');
 assert.equal(forward.copy_commands,'west');assert.equal(reverse.copy_commands,'east');
 assert.equal(forward.installed_snapshot_verified,true);assert.equal(reverse.installed_snapshot_verified,true);
 assert.equal('requires_directions_11' in forward,false);assert.equal('requires_directions_11' in reverse,false);
 const ui=fs.readFileSync(path.join(warp,'map.mjs'),'utf8');assert.doesNotMatch(ui,/11-direction|southwest|northeast/);
});

test('disconnected source components remain unreachable and unknown rooms stay inert',()=>{
 const disconnected=planCandidateRoute(data,'WarpGaladonSeed#0','WarpGaladonSeed#4');
 assert.equal(disconnected.status,'UNREACHABLE_COMPONENT');assert.equal(disconnected.movement_count,0);assert.equal(disconnected.copy_commands,'');
 assert.equal(planCandidateRoute(data,'missing','WarpGaladonSeed#0').status,'UNKNOWN_ROOM');
 assert.equal(planCandidateRoute(data,'WarpGaladonSeed#0','WarpGaladonSeed#0').status,'SAME_ROOM');
});

test('every stored edge is a valid one-step preview and the graph stays reciprocal',()=>{
 const rooms=buildRoomIndex(data);let count=0;
 for(const room of data.rooms)for(const [direction,target] of Object.entries(room.exits)){
  count++;const route=planCandidateRoute(data,room.id,target);assert.equal(route.movement_count,1,`${room.id} ${direction}`);assert.equal(route.commands[0],direction);assert.ok(Object.values(rooms.get(target).exits).includes(room.id),`${room.id} -> ${target}`);
 }
 assert.equal(count,440);
});

test('graphical and readable views share data and expose accessible controls',()=>{
 const html=fs.readFileSync(path.join(warp,'index.html'),'utf8'),js=fs.readFileSync(path.join(warp,'map.mjs'),'utf8'),css=fs.readFileSync(path.join(warp,'maps.css'),'utf8');
 for(const id of ['search','room-detail','route-from','route-to','route-output','copy-route','zoom-out','zoom-fit','zoom-in','room-list'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(js,/role','button'/);assert.match(js,/keydown/);assert.match(js,/room\.title/);assert.match(js,/room\.description/);assert.match(js,/navigator\.clipboard/);assert.match(js,/document\.execCommand\('copy'\)/);assert.match(js,/paste to confirm if the browser blocks clipboard access/);
 assert.match(css,/@media\(max-width:820px\)/);assert.match(css,/min-height:44px/);assert.match(css,/\.map-shell>\*\{min-width:0\}/);
 assert.doesNotMatch(html+js,/\/warp\/maps\/outside|WarpOutside#50/);
});

test('phone Fit all can show the full graph without illegibly tiny labels',()=>{
 const js=fs.readFileSync(path.join(warp,'map.mjs'),'utf8'),css=fs.readFileSync(path.join(warp,'maps.css'),'utf8');
 assert.match(js,/Math\.max\(\.2,next\)/);
 assert.match(js,/labelsHidden=zoom<\.38/);
 assert.match(css,/\.compact-labels \.map-label\{display:none\}/);
});

test('sanitized public prose excludes private and credential-bearing records',()=>{
 const prose=data.rooms.map(room=>room.title+'\n'+room.description).join('\n').toLowerCase();
 for(const forbidden of ['palace','private home','player record','family tree','timeline event','auth token','password','credential','secret key','williswarpritual'])assert.equal(prose.includes(forbidden),false,forbidden);
});
