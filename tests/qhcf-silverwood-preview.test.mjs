import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {anchors,boundaries,roomKey,route,sourceGraph} from '../warp/maps/archive/cf/silverwood-route.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const auditRoot=process.env.QHCF_AUDIT_ROOT||path.resolve(here,'..');
const data=JSON.parse(fs.readFileSync(path.join(auditRoot,'qhcf/data/areas/silverwood.json')));
const html=fs.readFileSync(new URL('../warp/maps/archive/cf/silverwood-preview.html',import.meta.url),'utf8');
const preview=fs.readFileSync(new URL('../warp/maps/archive/cf/silverwood-preview.mjs',import.meta.url),'utf8');
const shared=fs.readFileSync(path.join(auditRoot,'qhcf/source-grid-preview.mjs'),'utf8');
const graph=sourceGraph(data);

test('revision 5048 retains all 73 literal plus rooms and exact graph totals',()=>{
 assert.equal(data.source.revision_id,5048);assert.match(data.attribution,/QHCF \/ DIKU-WIKI/);assert.equal(data.lines.length,57);assert.equal(data.plus_cells.length,73);
 assert.equal(graph.rooms.size,89);assert.equal(graph.edges.length,111);assert.equal([...graph.rooms.values()].filter(r=>r.ch==='+').length,73);
});
test('only explicit horizontal and vertical connectors become graph edges',()=>{
 const at=(r,c)=>data.lines[r-1]?.[c-1]||' ';
 for(const edge of graph.edges){const a=graph.rooms.get(edge.from),b=graph.rooms.get(edge.to);assert.ok(a.row===b.row||a.col===b.col);const between=a.row===b.row?data.lines[a.row-1].slice(Math.min(a.col,b.col),Math.max(a.col,b.col)-1):[...Array(Math.abs(a.row-b.row)-1)].map((_,i)=>at(Math.min(a.row,b.row)+i+1,a.col)).join('');assert.ok(/^(-+|\|+)$/.test(between));}
 assert.doesNotMatch(fs.readFileSync(new URL('../warp/maps/archive/cf/silverwood-route.mjs',import.meta.url),'utf8'),/command:'(?:ne|nw|se|sw)'/);
});
test('known route includes every printed plus step and reverses symmetrically',()=>{
 const forward=route(graph,roomKey(7,23),roomKey(9,27));assert.equal(forward.moves,3);assert.equal(forward.commands.join(';;'),'e;;e;;s');assert.equal(forward.rooms.length,4);
 const reverse=route(graph,roomKey(9,27),roomKey(7,23));assert.deepEqual(reverse.commands,['n','w','w']);assert.equal(route(graph,'unknown',roomKey(7,23)),null);
 assert.ok(!forward.commands.join(';;').endsWith(';;'));
});
test('unresolved diagonal components and boundaries never gain commands',()=>{
 assert.equal(route(graph,roomKey(9,27),roomKey(36,33)),null);assert.equal(boundaries.length,6);
 assert.match(html,/Crossing and matching entrance unresolved/);assert.match(html,/Diagonals, cottage\/special-exit prose/);assert.doesNotMatch(html,/target="_blank"/);
});
test('preview preserves keyboard, copy fallback/readback, and narrow viewport behavior',()=>{
 assert.match(shared,/event\.key==='Enter'\|\|event\.key===' '/);assert.match(shared,/commands\.join\(';;'\)/);assert.match(shared,/Paste to confirm/);assert.match(shared,/press Ctrl\+C/);assert.match(shared,/viewport\.clientWidth-12/);assert.match(shared,/viewport\.clientHeight-12/);
 assert.match(html,/width=device-width/);assert.match(html,/class="viewport" tabindex="0"/);assert.match(preview,/expectedRevision:5048/);for(const a of anchors)assert.ok(graph.rooms.has(roomKey(a.row,a.col)));
});
