import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {anchors,roomKey,sourceGraph,route} from '../qhcf/past-grove-route.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../qhcf/data/areas/the-past-grove.json',import.meta.url)));
const page=fs.readFileSync(new URL('../qhcf/past-grove-preview.html',import.meta.url),'utf8');
const graph=sourceGraph(data);
test('Past Grove retains distinct chart rooms and only printed straight edges',()=>{
 assert.equal(graph.rooms.size,106);assert.equal(graph.edges.length,130);
 assert.equal(data.plus_cells.length,0);
 assert.equal(graph.rooms.get('17:30').ch,'V');assert.equal(graph.rooms.get('19:33').ch,'V');
 assert.ok(!graph.rooms.has('5:22')); // T from decorative area title
 for(const e of graph.edges){const a=graph.rooms.get(e.from),b=graph.rooms.get(e.to);assert.ok(a&&b);assert.ok(e.command==='e'?a.row===b.row&&b.col>a.col:a.col===b.col&&b.row>a.row)}
});
test('all major anchors route internally with one command per traversed room edge',()=>{
 for(const a of anchors)for(const b of anchors){const p=route(graph,roomKey(a.row,a.col),roomKey(b.row,b.col));assert.ok(p,`${a.id} → ${b.id}`);assert.equal(p.moves,p.commands.length);assert.equal(p.rooms.length,p.moves+1)}
 assert.equal(route(graph,'19:33','15:15').commands.join(';;'),'w;;w;;w;;w;;w;;w;;n;;n');
 assert.equal(route(graph,'15:15','19:33').commands.join(';;'),'s;;s;;e;;e;;e;;e;;e;;e');
});
test('neighbor links exist, with unknown boundary crossing explicitly stated',()=>{
 for(const path of ['/qhcf/grove-preview.html','/qhcf/areas/the-plains-of-arendyl.html','/qhcf/areas/a-wagon-marked-road.html']){
  assert.ok(page.includes(`href="${path}"`));assert.ok(fs.existsSync(new URL(`..${path}`,import.meta.url)));
 }
 assert.match(page,/matching arrival room are unresolved/);assert.doesNotMatch(page,/target="_blank"/);
});
