import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildEmeraldModel,diagramWidth,legend,markerPositions,relatedAreas,sourceRevision} from '../warp/maps/archive/cf/ancient-emerald-forest-map.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cf=path.join(root,'warp','maps','archive','cf');
const dataPath=path.join(cf,'data','areas','ancient-emerald-forest.json');
const textPath=path.join(cf,'data','areas','ancient-emerald-forest.txt');
const data=JSON.parse(fs.readFileSync(dataPath));
const html=fs.readFileSync(path.join(cf,'areas','ancient-emerald-forest.html'),'utf8');
const css=fs.readFileSync(path.join(cf,'ancient-emerald-forest.css'),'utf8');
const ui=fs.readFileSync(path.join(cf,'ancient-emerald-forest-map.mjs'),'utf8');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();

test('revision 5073 source and credit records remain byte-identical',()=>{
  assert.equal(sourceRevision,5073);
  assert.equal(data.source.revision_id,5073);
  assert.equal(data.source.sha256_content,'587C9CD0FFC271A44D8CE87D25685C3ED39F095539038B2F4DB0C4A49F197BA2');
  assert.match(data.attribution,/QHCF \/ DIKU-WIKI/);
  assert.equal(sha(dataPath),'5F2D01AD79997980B31D75D72D1E66E31B6F1AE9A1E6BFCFF4315E08E333EA76');
  assert.equal(sha(textPath),'38031AA5D64356572A051E73E8FBCEF1092F2CE82C7BDCF32A7D03D99DC2B0E4');
  assert.match(html,/map by Strienat/);
  assert.match(html,/QHCF \/ DIKU-WIKI, credited map author Strienat/);
});

test('graphical crop excludes header and inline prose while retaining every source map row',()=>{
  const model=buildEmeraldModel(data);
  assert.equal(model.header,'| 10 - 51 | Strienat - Ancient Emerald Forest');
  assert.equal(model.diagramLines.length,47);
  assert.ok(model.diagramLines.every(line=>[...line].length<=diagramWidth));
  assert.ok(model.diagramLines.every(line=>!line.includes(' = ')));
  assert.ok(model.diagramLines.every(line=>!line.includes('Ancient Emerald Forest')));
  assert.match(model.diagramLines[13],/Silverwood/);
  assert.match(model.diagramLines[28],/Spiderhaunt/);
  assert.match(model.diagramLines[45],/Aubade/);
});

test('all literal plus cells and only source-positioned legend markers are highlighted',()=>{
  const model=buildEmeraldModel(data);
  assert.equal(model.plusCells.length,14);
  assert.deepEqual(model.plusCells.map(cell=>[cell.sourceRow,cell.column]),data.plus_cells.map(cell=>[cell.row,cell.column]));
  assert.equal(model.markers.length,21);
  assert.equal(new Set(model.markers.map(marker=>`${marker.row}:${marker.column}`)).size,21);
  for(const marker of model.markers){assert.equal(data.lines[marker.row-1][marker.column-1],marker.symbol);assert.ok(marker.note)}
  assert.deepEqual(model.markers.map(({symbol,row,column})=>[symbol,row,column]),markerPositions.map(({symbol,row,column})=>[symbol,row,column]));
  const oldUppercaseHits=data.lines.reduce((count,line)=>count+[...line].filter(character=>/[A-Z]/.test(character)).length,0);
  const intendedUppercase=model.markers.filter(marker=>/[A-Z]/.test(marker.symbol)).length;
  assert.equal(oldUppercaseHits,87);
  assert.equal(intendedUppercase,9);
  assert.equal(oldUppercaseHits-intendedUppercase,78,'the generic renderer created 78 false uppercase marker hits');
});

test('all 18 exact source legend notes are readable beside the map',()=>{
  assert.equal(legend.length,18);
  for(const entry of legend){
    const escaped=entry.note.replaceAll('&','&amp;');
    assert.ok(html.includes(`<dt><code>${entry.symbol}</code></dt><dd>${escaped}</dd>`),entry.symbol);
  }
  assert.match(html,/gibberling \(aggro\)/);
  assert.match(html,/Treehouse at the Heart of the Forest \(marmalade orb\)/);
  assert.match(html,/pixie shopkeeper \(barter 6AM-9PM\)/);
  assert.match(html,/Parenthetical text records the source’s own warning, item, or shop-hours note/);
  assert.match(html,/item reference[\s\S]*does not establish a room coordinate or movement path/);
});

test('source-linked areas remain links only and no movement is invented',()=>{
  for(const area of relatedAreas.filter(area=>area.local))assert.ok(fs.existsSync(path.join(root,area.href.slice(1))),area.label);
  assert.match(html,/Silverwood source map/);
  assert.match(html,/Spiderhaunt Woods source map/);
  assert.match(html,/Aubade — source-linked label, but no captured local Aubade map/);
  assert.match(html,/matching entrance rooms and crossing commands remain unresolved/);
  assert.match(html,/No route or boundary crossing is generated/);
  assert.doesNotMatch(html+ui,/copy-route|copy-output|navigator\.clipboard|execCommand\('copy'\)/);
});

test('page is keyboard-readable and narrow layouts keep overflow inside the map pane',()=>{
  assert.match(html,/id="map-wrap"[^>]*tabindex="0"/);
  assert.match(html,/id="actual"[^>]*aria-pressed="true"/);
  assert.match(html,/id="fit"[^>]*aria-pressed="false"/);
  assert.match(css,/\.emerald-map-wrap\{overflow:auto/);
  assert.match(css,/@media\(max-width:850px\)/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/\.emerald-layout\{display:grid;grid-template-columns:minmax\(0,1\.45fr\)/);
});

test('shared generic pages preserve raw notes but still lack extracted readable legends',()=>{
  const areaDir=path.join(cf,'data','areas');
  const noteBearing=fs.readdirSync(areaDir).filter(file=>file.endsWith('.json')).map(file=>JSON.parse(fs.readFileSync(path.join(areaDir,file)))).filter(area=>area.lines?.some(line=>/\s[A-Za-z0-9]\s*=\s*[A-Za-z]/.test(line)));
  assert.deepEqual(noteBearing.map(area=>area.slug).sort(),['ancient-emerald-forest','mortorn','troglodyte-caverns']);
  for(const slug of ['mortorn','troglodyte-caverns']){
    const page=fs.readFileSync(path.join(cf,'areas',`${slug}.html`),'utf8');
    assert.match(page,/<summary>Source transcription<\/summary>/);
    assert.doesNotMatch(page,/Source legend and map notes/);
  }
});
