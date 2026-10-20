import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';

const data=JSON.parse(fs.readFileSync(new URL('../qhcf/data/areas/bramblefield-road.json',import.meta.url)));
const html=fs.readFileSync(new URL('../qhcf/bramblefield-preview.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../qhcf/bramblefield-preview.mjs',import.meta.url),'utf8');

test('all 17 plus cells remain distinct stable room IDs',()=>{
 const plus=[];for(let r=3;r<=39;r++)for(let c=24;c<=42;c++)if(data.lines[r-1]?.[c-1]==='+')plus.push(`${r}:${c}`);
 assert.equal(plus.length,17);
 assert.deepEqual(plus.sort(),data.plus_cells.map(({row,column})=>`${row}:${column}`).sort());
 assert.match(js,/qhcf\.area\.bramblefield-road\.r\$\{r\}c\$\{c\}/);
});
test('links open real neighboring pages without invented command routing',()=>{
 for(const path of ['/qhcf/areas/eaststride-road.html','/qhcf/areas/voralian-city.html','/qhcf/areas/voralia-s-tears.html','/qhcf/aldevari-preview.html','/qhcf/eastern-road-preview.html']){
  assert.ok(html.includes(`href="${path}"`));assert.ok(fs.existsSync(new URL(`..${path}`,import.meta.url)));
 }
 assert.match(html,/Crossing and matching entrance unresolved/);
 assert.doesNotMatch(html,/target="_blank"/);
 assert.doesNotMatch(js,/navigator\.clipboard|routeBetween/);
});
test('room edges use only printed connectors and fit responds to viewport',()=>{
 assert.match(js,/between===glyph/);
 assert.match(js,/\[0,3,'--'\],\[2,0,'\|'\]/);
 assert.match(js,/viewport\.clientHeight-12/);
 assert.match(js,/addEventListener\('resize',fit\)/);
});
