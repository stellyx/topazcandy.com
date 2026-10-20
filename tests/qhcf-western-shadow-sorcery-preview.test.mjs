import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
const root=resolve(import.meta.dirname,'..');
const q=resolve(root,'qhcf');
const read=p=>readFileSync(resolve(q,p),'utf8');
const ledger=JSON.parse(read('data/western-shadow-sorcery-inventory.json'));
const sources={grove:JSON.parse(read('data/areas/the-shadow-grove.json')),tower:JSON.parse(read('data/areas/the-tower-of-sorcery.json'))};
test('notes quote captured lines exactly, including spacing and markup',()=>{
 for(const entry of ledger.entries){const source=sources[entry.area];const [from,to]=entry.source_lines;assert.equal(entry.source_text,source.lines.slice(from-1,to).join('\n'));assert.equal(entry.source_url,source.source.permalink);assert.equal(entry.revision_id,source.source.revision_id)}
 assert.equal(ledger.entries.filter(x=>x.area==='grove').length,10);
 assert.equal(ledger.entries.filter(x=>x.area==='tower').length,25);
});
test('all local source and related links exist and named exits occur in source chart',()=>{
 for(const area of Object.values(ledger.areas))for(const field of ['original','json','text'])assert.ok(existsSync(resolve(root,'.'+area[field])),area[field]);
 for(const exit of ledger.related_maps){assert.ok(existsSync(resolve(root,'.'+exit.href)),exit.href);assert.ok(sources[exit.from].lines.join(' ').replace(/\s+/g,' ').includes(exit.label),exit.label);assert.match(exit.status,/unverified/)}
});
test('Western Road and command routes remain unasserted',()=>{
 assert.match(ledger.western_road.status,/missing/);assert.match(ledger.routing_status,/No command routes/);
 const html=read('western-shadow-sorcery-preview.html');const js=read('western-shadow-sorcery-preview.mjs');
 for(const name of ['western-shadow-sorcery-preview.css','western-shadow-sorcery-preview.mjs','data/western-shadow-sorcery-inventory.json'])assert.ok(existsSync(resolve(q,name)));
 assert.match(html,/No quests are explicitly listed/);assert.match(js,/area\.lines\.forEach/);
 assert.doesNotMatch(html+js,/;;|Copy commands|route moves/i);
});

test('top tabs filter one shared note list and preserve a search query',()=>{
 const js=read('western-shadow-sorcery-preview.mjs');
 const declaration=js.match(/export const filteredEntries=.*?;\n/)[0].replace('export const ','const ');
 const filtered=runInNewContext(declaration+'filteredEntries',{});
 assert.equal(filtered(ledger.entries,'grove').length,10);
 assert.equal(filtered(ledger.entries,'tower').length,25);
 assert.equal(filtered(ledger.entries,'western').length,0);
 assert.equal(filtered(ledger.entries,'tower','prism').length,1);
 assert.equal(filtered(ledger.entries,'grove','prism').length,0);
 assert.match(js,/active=b\.dataset\.area;render\(\)/);
 assert.match(js,/window\.addEventListener\('hashchange',showHash\)/);
});
test('every note has a stable line target and only verified matching area links',()=>{
 const linked=new Set(['Ashes of Nowhere','HighTowerOfSorcery','E - ElementalTemple ','Eil Shaeria']);
 for(const entry of ledger.entries){
  const [from]=entry.source_lines;assert.ok(from>=1&&from<=sources[entry.area].lines.length);
  const fragment=`source-${entry.area}-L${from}`;assert.match(fragment,/^source-(grove|tower)-L\d+$/);
  if(entry.area_link){assert.ok(existsSync(resolve(root,'.'+entry.area_link)),entry.area_link);assert.match(entry.link_status,/unverified/);assert.ok([...linked].some(name=>entry.source_text.includes(name)),entry.source_text)}
 }
 const fean=ledger.entries.find(e=>e.label==='Feanwyyn');assert.ok(fean);assert.equal(fean.area_link,undefined);
 const js=read('western-shadow-sorcery-preview.mjs');assert.match(js,/row\.id=`source-\$\{active\}-L\$\{index\+1\}`/);assert.match(js,/Source line ↗/);assert.match(js,/Focus chart/);
});
