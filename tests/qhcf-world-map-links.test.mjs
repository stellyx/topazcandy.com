import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {academyReferenceAreaPaths,enhancedAreaLinks,enhancedAreaHref} from '../qhcf/enhanced-area-links.mjs';

const index=JSON.parse(fs.readFileSync(new URL('../qhcf/data/index.json',import.meta.url)));
const manifest=JSON.parse(fs.readFileSync(new URL('../qhcf/data/world-map-links.json',import.meta.url)));
const world=fs.readFileSync(new URL('../qhcf/world-map.html',import.meta.url),'utf8');
const overview=fs.readFileSync(new URL('../qhcf/index.html',import.meta.url),'utf8');

test('historical chart manifest exhaustively classifies its area links',()=>{
 assert.equal(manifest.summary.indexed_areas,170);
 assert.equal(manifest.summary.mapped_occurrences,355);
 assert.equal(manifest.summary.unresolved_occurrences,6);
 assert.equal(manifest.summary.represented_index_areas,168);
 assert.deepEqual(manifest.summary.unrepresented_index_areas.map(a=>a.slug),['worldmap','the-drogran-hills']);
 assert.deepEqual(manifest.summary.unresolved_preserved_targets,['DragonTowerRuins','SandsOfSorrow','SirineIsland']);
 assert.equal(manifest.occurrences.length,361);
});

test('every manifest label matches the preserved chart at its exact position',()=>{
 const lines=fs.readFileSync(new URL('../qhcf/data/areas/worldmap.txt',import.meta.url),'utf8').split('\n');
 for(const item of manifest.occurrences){
  const row=lines[item.row+manifest.source.first_chart_row];
  assert.equal([...row].slice(item.column,item.column+item.length).join(''),item.label,`${item.source_title} at ${item.row}:${item.column}`);
 }
});

test('mapped destinations are indexed, exact-case local files',()=>{
 const indexed=new Set(index.areas.map(a=>`/qhcf/areas/${a.slug}.html`));
 for(const item of manifest.occurrences.filter(item=>item.destination)){
  assert.ok(indexed.has(item.destination),item.destination);
  assert.ok(fs.existsSync(new URL(`..${item.destination}`,import.meta.url)),item.destination);
 }
});

test('overview and world chart use canonical enhanced destinations',()=>{
 assert.match(overview,/import \{enhancedAreaHref\}/);
 assert.match(world,/world-map-links\.json/);
 assert.match(world,/enhancedAreaHref\(item\.destination\)/);
 assert.doesNotMatch(world,/const markers\s*=/);
 assert.equal(enhancedAreaLinks.size,16);
 for(const [source,destination] of enhancedAreaLinks)assert.equal(enhancedAreaHref(source,'https://example.test'),destination);
});

test('Academy reference hook appears globally and only on evidence-listed subpages',()=>{
 for(const html of [overview,world])assert.match(html,/<a href="\/qhcf\/academy-temple-coverage\.html">Academy entrances<\/a>/);
 assert.equal(academyReferenceAreaPaths.size,16);
 for(const path of academyReferenceAreaPaths){
  assert.ok(fs.existsSync(new URL(`..${path}`,import.meta.url)),path);
  assert.match(fs.readFileSync(new URL(`..${path}`,import.meta.url),'utf8'),/enhanced-area-links\.mjs/);
 }
 assert.match(fs.readFileSync(new URL('../qhcf/enhanced-area-links.mjs',import.meta.url),'utf8'),/not a verified travel route/);
});
