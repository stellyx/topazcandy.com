import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {turnoffs} from '../warp/maps/archive/cf/eastern-road-preview.mjs';
const area=JSON.parse(fs.readFileSync(new URL('../warp/maps/archive/cf/data/areas/aldevari.json',import.meta.url)));
const page=fs.readFileSync(new URL('../warp/maps/archive/cf/aldevari-preview.html',import.meta.url),'utf8');
const script=fs.readFileSync(new URL('../warp/maps/archive/cf/aldevari-preview.mjs',import.meta.url),'utf8');
test('Aldevari retains all captured plus rooms and stable coordinates',()=>{
 const chart=area.lines.slice(6,39).flatMap((line,i)=>[...line].flatMap((glyph,j)=>glyph==='+'?[`${i+7}:${j+1}`]:[]));
 assert.equal(chart.length,81);
 assert.deepEqual(chart.sort(),area.plus_cells.map(({row,column})=>`${row}:${column}`).sort());
 assert.match(script,/qhcf\.area\.aldevari\.r\$\{row\}c\$\{col\}/);
});
test('edge links are real same-frame links with unresolved crossing status',()=>{
 for(const href of ['/warp/maps/archive/cf/eastern-road-preview.html','/warp/maps/archive/cf/bramblefield-preview.html','/warp/maps/archive/cf/grove-preview.html']){
  assert.ok(page.includes(`href="${href}"`));
  assert.ok(fs.existsSync(new URL(`..${href}`,import.meta.url)));
 }
 assert.match(page,/Crossing and matching entrance unresolved/);
 assert.doesNotMatch(page,/target="_blank"/);
 assert.equal(turnoffs.find(t=>t.name==='Aldevari').href,'/warp/maps/archive/cf/aldevari-preview.html');
});
test('graphical links do not add unverified route commands',()=>{
 assert.doesNotMatch(script,/routeBetween|commands\s*=|navigator\.clipboard/);
 assert.match(script,/actual===pattern/);
 assert.match(page,/revision 5026/);
});
test('tower diagonals and initial fit follow literal glyphs and viewport',()=>{
 assert.equal(area.lines[18][37],'/'); // row 19, column 38: southwest tower
 assert.equal(area.lines[18][49],'/'); // row 19, column 50: southeast tower
 assert.match(script,/\[2,-2,'\/'\]/);
 assert.match(script,/viewport\.clientHeight-12/);
 assert.match(script,/addEventListener\('resize',fit\)/);
});
