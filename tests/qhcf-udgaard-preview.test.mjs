import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {anchors,boundaries,roomKey,route,sourceGraph} from '../warp/maps/archive/cf/udgaard-route.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const auditRoot=process.env.QHCF_AUDIT_ROOT||path.resolve(here,'..');
const data=JSON.parse(fs.readFileSync(path.join(auditRoot,'qhcf/data/areas/udgaard.json')));
const html=fs.readFileSync(new URL('../warp/maps/archive/cf/udgaard-preview.html',import.meta.url),'utf8');
const preview=fs.readFileSync(new URL('../warp/maps/archive/cf/udgaard-preview.mjs',import.meta.url),'utf8');
const shared=fs.readFileSync(path.join(auditRoot,'qhcf/source-grid-preview.mjs'),'utf8');
const graph=sourceGraph(data);

test('revision 4963 retains all 94 literal plus rooms and exact graph totals',()=>{
 assert.equal(data.source.revision_id,4963);assert.match(data.attribution,/QHCF \/ DIKU-WIKI/);assert.equal(data.lines.length,99);assert.equal(data.plus_cells.length,94);
 assert.equal(graph.rooms.size,180);assert.equal(graph.edges.length,172);assert.equal([...graph.rooms.values()].filter(r=>r.ch==='+').length,94);
});
test('labels and dense plus blocks are not invented as connections',()=>{
 assert.ok(!graph.rooms.has('5:24'));assert.ok(!graph.rooms.has('7:44'));assert.ok(!graph.rooms.has('40:27'));
 assert.ok(graph.rooms.has('10:45')&&graph.rooms.has('10:46'));assert.ok(!graph.edges.some(e=>new Set([e.from,e.to]).has('10:45')&&new Set([e.from,e.to]).has('10:46')));
 for(const edge of graph.edges){const a=graph.rooms.get(edge.from),b=graph.rooms.get(edge.to);assert.ok(a.row===b.row||a.col===b.col);}
});
test('known city route has exact plus-sign step count and symmetric reverse',()=>{
 const forward=route(graph,roomKey(12,36),roomKey(27,36));assert.equal(forward.moves,6);assert.equal(forward.commands.join(';;'),'s;;s;;s;;s;;s;;s');assert.equal(forward.rooms.length,7);
 const reverse=route(graph,roomKey(27,36),roomKey(12,36));assert.deepEqual(reverse.commands,['n','n','n','n','n','n']);assert.equal(route(graph,'unknown',roomKey(12,36)),null);assert.ok(!forward.commands.join(';;').endsWith(';;'));
});
test('boundaries and special references remain links only',()=>{
 assert.equal(boundaries.length,4);assert.match(html,/Crossing and matching entrance unresolved/);assert.match(html,/underground-river prose, special exits/);assert.doesNotMatch(html,/target="_blank"/);
 for(const href of ['/warp/maps/archive/cf/areas/a-northern-trail.html','/warp/maps/archive/cf/areas/the-northern-mountains.html','/warp/maps/archive/cf/areas/udgaardian-plains.html','/warp/maps/archive/cf/areas/traveller.html'])assert.ok(html.includes(`href="${href}"`));
});
test('preview preserves keyboard, copy fallback/readback, and narrow viewport behavior',()=>{
 assert.match(shared,/event\.key==='Enter'\|\|event\.key===' '/);assert.match(shared,/commands\.join\(';;'\)/);assert.match(shared,/Paste to confirm/);assert.match(shared,/press Ctrl\+C/);assert.match(shared,/viewport\.clientWidth-12/);assert.match(shared,/viewport\.clientHeight-12/);
 assert.match(html,/width=device-width/);assert.match(html,/class="viewport" tabindex="0"/);assert.match(preview,/expectedRevision:4963/);for(const a of anchors)assert.ok(graph.rooms.has(roomKey(a.row,a.col)));
});
