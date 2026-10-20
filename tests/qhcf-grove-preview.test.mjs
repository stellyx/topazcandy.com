import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {anchors,roomKey,sourceGraph,route} from '../qhcf/grove-route.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../qhcf/data/areas/the-grove.json',import.meta.url)));
const page=fs.readFileSync(new URL('../qhcf/grove-preview.html',import.meta.url),'utf8');
const graph=sourceGraph(data);
test('central Grove graph counts only source rooms and straight printed connectors',()=>{
 assert.equal(graph.rooms.size,59);assert.equal(graph.edges.length,85);
 assert.equal([...graph.rooms.values()].filter(n=>n.ch==='+').length,16);
 assert.equal(data.plus_cells.length,21);
 assert.ok(!graph.rooms.has('20:53')); // T of Tool Maker's Wagon is a label
 for(const e of graph.edges){const [a,b]=[graph.rooms.get(e.from),graph.rooms.get(e.to)];assert.ok(a&&b);assert.ok(e.command==='e'?b.col>a.col&&b.row===a.row:b.row>a.row&&b.col===a.col)}
});
test('all ten central anchors connect; each command represents one edge',()=>{
 for(const a of anchors)for(const b of anchors){const p=route(graph,roomKey(a.row,a.col),roomKey(b.row,b.col));assert.ok(p,`${a.id} to ${b.id}`);assert.equal(p.moves,p.commands.length);assert.equal(p.rooms.length,p.moves+1)}
 const south=route(graph,'30:33','18:33');assert.equal(south.moves,6);assert.equal(south.commands.join(';;'),'n;;n;;n;;n;;n;;n');
 assert.equal(route(graph,'18:33','30:33').commands.join(';;'),'s;;s;;s;;s;;s;;s');
});
test('special crossings stay outside command graph; all area links resolve locally',()=>{
 for(const slug of ['aldevari-preview','eastern-road-preview'])assert.ok(fs.existsSync(new URL(`../qhcf/${slug}.html`,import.meta.url)));
 for(const slug of ['the-past-grove','keep-of-the-righteous'])assert.ok(fs.existsSync(new URL(`../qhcf/areas/${slug}.html`,import.meta.url)));
 assert.match(page,/Five other plus rooms/);assert.match(page,/passage unresolved/);
 assert.doesNotMatch(page,/target="_blank"/);
});
