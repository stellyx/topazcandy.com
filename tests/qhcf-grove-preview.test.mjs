import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {anchors,roomKey,sourceConnectorSegments,sourceGraph,route} from '../qhcf/grove-route.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../qhcf/data/areas/the-grove.json',import.meta.url)));
const page=fs.readFileSync(new URL('../qhcf/grove-preview.html',import.meta.url),'utf8');
const graph=sourceGraph(data);
test('complete Grove graph counts source rooms and only straight printed route connectors',()=>{
 assert.equal(graph.rooms.size,97);assert.equal(graph.edges.length,123);
 assert.equal([...graph.rooms.values()].filter(n=>n.ch==='+').length,21);
 assert.equal(data.plus_cells.length,21);
 assert.ok(!graph.rooms.has('20:53')); // T of Tool Maker's Wagon is a label
 assert.equal(graph.rooms.get('29:55').ch,'+');
 const segments=sourceConnectorSegments(data);assert.equal(segments.length,227);
 for(const [row,column,glyph] of [[1,46,'-'],[6,32,'/'],[8,12,'>'],[10,10,'v'],[31,55,'|']])assert.ok(segments.some(s=>s.row===row&&s.column===column&&s.glyph===glyph));
 for(const e of graph.edges){const [a,b]=[graph.rooms.get(e.from),graph.rooms.get(e.to)];assert.ok(a&&b);assert.ok(e.command==='e'?b.col>a.col&&b.row===a.row:b.row>a.row&&b.col===a.col)}
});
test('connected central anchors route; unresolved compact and special branches stay separate',()=>{
 const central=anchors.filter(a=>!['east-road','void-clearing','secret-tunnel'].includes(a.id));
 for(const a of central)for(const b of central){const p=route(graph,roomKey(a.row,a.col),roomKey(b.row,b.col));assert.ok(p,`${a.id} to ${b.id}`);assert.equal(p.moves,p.commands.length);assert.equal(p.rooms.length,p.moves+1)}
 const south=route(graph,'30:33','18:33');assert.equal(south.moves,6);assert.equal(south.commands.join(';;'),'n;;n;;n;;n;;n;;n');
 assert.equal(route(graph,'18:33','30:33').commands.join(';;'),'s;;s;;s;;s;;s;;s');
 assert.equal(route(graph,'30:55','29:55'),null);
});
test('special crossings stay outside command graph; all area links resolve locally',()=>{
 for(const slug of ['aldevari-preview','eastern-road-preview'])assert.ok(fs.existsSync(new URL(`../qhcf/${slug}.html`,import.meta.url)));
 for(const slug of ['the-past-grove','keep-of-the-righteous'])assert.ok(fs.existsSync(new URL(`../qhcf/areas/${slug}.html`,import.meta.url)));
 assert.match(page,/all 21 literal plus rooms/);assert.match(page,/two distinct southern Eastern Road exits/);
 assert.match(page,/eastern-road-preview\.html#grove-west-turnoff/);assert.match(page,/eastern-road-preview\.html#grove-east-turnoff/);
 assert.doesNotMatch(page,/Void side|Rangers Guild side/);
 assert.doesNotMatch(page,/target="_blank"/);
});
