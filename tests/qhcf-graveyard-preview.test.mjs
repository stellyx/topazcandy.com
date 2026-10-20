import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {anchors,roomKey,route,sourceGraph} from '../qhcf/graveyard-route.mjs';

const data=JSON.parse(fs.readFileSync(new URL('../qhcf/data/areas/graveyard.json',import.meta.url)));
const html=fs.readFileSync(new URL('../qhcf/graveyard-preview.html',import.meta.url),'utf8');
const graph=sourceGraph(data);

test('revision 5045 retains the exact Graveyard source inventory and topology',()=>{
 assert.equal(data.source.revision_id,5045);assert.match(data.attribution,/QHCF \/ DIKU-WIKI/);assert.equal(data.plus_cells.length,79);
 assert.equal(graph.rooms.size,102);assert.equal([...graph.rooms.values()].filter(room=>room.ch==='+').length,79);
 assert.equal(graph.edges.length,109);assert.equal(graph.edges.filter(edge=>edge.gate).length,2);
 assert.deepEqual(graph.edges.filter(edge=>edge.gate).map(edge=>[edge.from,edge.to]),[['7:17','9:17'],['7:37','9:37']]);
});

test('only printed orthogonal connectors become graph edges',()=>{
 const at=(row,col)=>data.lines[row-1]?.[col-1]||' ';
 for(const edge of graph.edges){
  const a=graph.rooms.get(edge.from),b=graph.rooms.get(edge.to);assert.ok(a.row===b.row||a.col===b.col);
  const between=a.row===b.row?data.lines[a.row-1].slice(a.col,b.col-1):Array.from({length:b.row-a.row-1},(_,i)=>at(a.row+i+1,a.col)).join('');
  assert.ok(/^(-+|[|=]+)$/.test(between),`${edge.from} to ${edge.to}: ${between}`);
 }
 assert.ok(graph.rooms.has('9:10'));assert.equal(graph.rooms.get('9:10').ch,'m');
 assert.ok(!graph.rooms.has('1:1'),'author credit text must not become rooms');
});

test('known routes count each room step and format exact double-semicolon commands',()=>{
 const entrance=roomKey(27,27),fountain=roomKey(17,27),caretaker=roomKey(7,27),foyer=roomKey(9,10);
 const north=route(graph,entrance,fountain);assert.equal(north.moves,5);assert.equal(north.commands.join(';;'),'n;;n;;n;;n;;n');assert.equal(north.rooms.length,6);
 assert.equal(route(graph,entrance,caretaker).commands.join(';;'),'n;;n;;n;;n;;n;;n;;n;;n;;n;;n');
 const back=route(graph,fountain,entrance);assert.equal(back.commands.join(';;'),'s;;s;;s;;s;;s');
 const mausoleum=route(graph,entrance,foyer);assert.equal(mausoleum.moves,21);assert.ok(!mausoleum.commands.join(';;').endsWith(';;'));
});

test('undocumented gates and the Holy Road boundary never emit guessed commands',()=>{
 assert.equal(route(graph,roomKey(9,17),roomKey(7,17)),null);assert.equal(route(graph,roomKey(9,37),roomKey(7,37)),null);
 assert.match(html,/two vertical <code>=<\/code> gates/);assert.match(html,/Matching Holy Road room unresolved/);assert.match(html,/No diagonal or vertical-level command/);
 assert.match(html,/Shaidar Haran/);assert.doesNotMatch(html,/target="_blank"/);for(const anchor of anchors)assert.ok(graph.rooms.has(roomKey(anchor.row,anchor.col)));
});

test('the Graveyard area is upgraded to the dedicated readable preview',()=>{
 const links=fs.readFileSync(new URL('../qhcf/enhanced-area-links.mjs',import.meta.url),'utf8');
 assert.match(links,/areas\/graveyard\.html','\/qhcf\/graveyard-preview\.html/);
 assert.match(html,/width=device-width/);assert.match(html,/all 79 literal plus rooms remain distinct/);assert.match(html,/commands separated by double semicolons/i);
});
