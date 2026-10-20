import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {anchors,roomKey,route,sourceGraph} from '../warp/maps/archive/cf/bramblefield-route.mjs';

const data=JSON.parse(fs.readFileSync(new URL('../warp/maps/archive/cf/data/areas/bramblefield-road.json',import.meta.url)));
const html=fs.readFileSync(new URL('../warp/maps/archive/cf/bramblefield-preview.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../warp/maps/archive/cf/bramblefield-preview.mjs',import.meta.url),'utf8');
const graph=sourceGraph(data);

test('all 17 plus cells remain distinct stable room IDs',()=>{
 const plus=[];for(let r=3;r<=39;r++)for(let c=24;c<=42;c++)if(data.lines[r-1]?.[c-1]==='+')plus.push(`${r}:${c}`);
 assert.equal(plus.length,17);
 assert.deepEqual(plus.sort(),data.plus_cells.map(({row,column})=>`${row}:${column}`).sort());
 assert.equal(graph.rooms.size,87); // excludes the M in the printed word "Market"
 assert.ok(!graph.rooms.has('3:39'));
 assert.equal(graph.edges.length,134);
});
test('links open real neighboring pages without invented command routing',()=>{
 for(const path of ['/warp/maps/archive/cf/areas/eaststride-road.html','/warp/maps/archive/cf/areas/voralian-city.html','/warp/maps/archive/cf/areas/voralia-s-tears.html','/warp/maps/archive/cf/aldevari-preview.html','/warp/maps/archive/cf/eastern-road-preview.html']){
  assert.ok(html.includes(`href="${path}"`));assert.ok(fs.existsSync(new URL(`..${path}`,import.meta.url)));
 }
 assert.match(html,/Crossing and matching entrance unresolved/);
 assert.doesNotMatch(html,/target="_blank"/);
 assert.match(html,/Crossing and matching entrance unresolved/);
});
test('every major anchor is connected within the captured chart; steps include plus rooms',()=>{
 for(const a of anchors)for(const b of anchors)assert.ok(route(graph,roomKey(a.row,a.col),roomKey(b.row,b.col)));
 const bazaar=roomKey(33,33),lane=roomKey(39,27),path=route(graph,bazaar,lane);
 assert.equal(path.moves,5);assert.equal(path.commands.join(';;'),'w;;w;;s;;s;;s');
 assert.deepEqual(path.grouped,[{direction:'w',count:2},{direction:'s',count:3}]);
 assert.deepEqual(route(graph,lane,bazaar).commands,['n','n','n','e','e']);
 assert.equal(path.rooms.length,path.moves+1);
});
test('routes use only printed connectors and fit responds to viewport',()=>{
 assert.match(fs.readFileSync(new URL('../warp/maps/archive/cf/bramblefield-route.mjs',import.meta.url),'utf8'),/between===printed/);
 assert.match(js,/viewport\.clientHeight-12/);
 assert.match(js,/addEventListener\('resize',fit\)/);
 assert.match(js,/commands\.join\(';;'\)/);
});
