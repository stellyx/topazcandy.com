import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildAsciiMapGraph, planMapRoute} from '../warp/maps/archive/cf/navigation/route-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cf = path.join(root, 'warp', 'maps', 'archive', 'cf');
const read = relative => fs.readFileSync(path.join(cf, relative), 'utf8');
const sha = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex').toUpperCase();
const graph = JSON.parse(read('navigation/galadon-v1.json'));

test('route geometry and preserved source records are byte-for-byte unchanged', () => {
  const pinned = {
    'warp/maps/archive/cf/navigation/galadon-v1.json': 'C2A16E025034AECC8991DD770243C56CF03E414D6D79F387023C3151DB939E10',
    'warp/maps/archive/cf/data/areas/galadon.json': '2A19B63B95A8AAB21504032B888C1289CBE4B03D85FDD7EF714E270666344C6D',
    'warp/maps/archive/cf/data/areas/the-eastern-road.json': 'BB81EAE4E33935584550F61CD2E8234B592634A7B93ED3C18B17945DD3792B0C',
    'warp/maps/archive/cf/areas/galadon.html': '7A5FB026C20163314323819425B2DA1A8C1676FA0123139A2F0970E8C74641F3',
    'warp/maps/archive/cf/areas/the-eastern-road.html': '8E5EB0CBD7D8FDA70F8907F5B9B6D0F2D07B8ECE0DA65DEE5C687D2B604F63D5',
    'warp/maps/public-town.json': '1BCFA1F338017A17BC91D18523A6E5C539C4E751D1024CFA764CDE06803E16A0',
  };
  for (const [relative, expected] of Object.entries(pinned)) assert.equal(sha(relative), expected, relative);
});

test('CF and WARP contexts are explicit and switching cannot carry route selection state', () => {
  for (const relative of ['galadon-preview.html', 'eastern-road-preview.html', 'cross-area-preview.html', 'navigation/index.html']) {
    const html = read(relative);
    assert.match(html, /Carrion Fields|CF source/);
    assert.match(html, /not (?:a WARP route|live-game verified|live verified)/);
    assert.match(html, /href="\/warp\/maps\/"[^>]*aria-label="[^"]*(?:separate WARP|Leave the Carrion Fields)/);
    const switchHref = html.match(/href="(\/warp\/maps\/)"[^>]*aria-label="[^"]*(?:separate WARP|Leave the Carrion Fields)/)?.[1];
    assert.equal(switchHref, '/warp/maps/');
    assert.doesNotMatch(switchHref, /[?&](?:from|to)=/);
  }
  assert.doesNotMatch(read('index.html'), /Verified route planner/);
});

test('limitations appear before copy controls and feedback does not alter geometry', () => {
  const pages = [
    ['galadon-preview.html', 'Before copying:', 'id="commands"'],
    ['eastern-road-preview.html', 'Carrion Fields source context:', 'id="commands"'],
    ['cross-area-preview.html', 'Before copying:', 'id="all-commands"'],
    ['navigation/index.html', 'Before copying:', 'id="copy-output"'],
  ];
  for (const [relative, caveat, control] of pages) {
    const html = read(relative);
    assert.ok(html.indexOf(caveat) >= 0, relative);
    assert.ok(html.indexOf(caveat) < html.indexOf(control), `${relative}: caveat must precede copy field`);
  }
  const cross = read('cross-area-preview.html');
  assert.match(cross, /reported 4E[\s\S]*currently counts 5E/);
  assert.match(cross, /no geometry, edge, command, or movement count is changed/);
});

test('room controls use distinct positional labels and retain keyboard access', () => {
  const model = buildAsciiMapGraph(graph);
  const unnamed = model.nodes.filter(node => node.kind === 'plus-room' && node.name_kind === 'unnamed-map-position');
  assert.ok(unnamed.length > 100);
  assert.ok(unnamed.every(node => /^Map room at row \d+, column \d+ \(\+\)$/.test(node.name)));
  assert.equal(new Set(unnamed.map(node => node.name)).size, unnamed.length);
  assert.ok(unnamed.every(node => !node.name.includes('Unnamed map room')));
  const html = read('galadon-preview.html');
  assert.match(html, /role:slug\?'presentation':'button'/);
  assert.match(html, /tabindex:slug\?'-1':'0'/);
  assert.match(html, /e\.key==='Enter'\|\|e\.key===' '/);
  assert.match(html, /document\.execCommand\('copy'\)/);
  assert.match(html, /navigator\.clipboard\.writeText\(field\.value\)/);
});

test('clipboard route remains commands only with double-semicolon separators', () => {
  const butcher = buildAsciiMapGraph(graph).nodes.find(node => node.name.startsWith('Butcher Shop'));
  assert.ok(butcher);
  const route = planMapRoute(graph, 'galadon.map.marker.m', butcher.id);
  assert.equal(route.copy_commands, 'w;;s');
  assert.equal(route.movement_count, 2);
  assert.match(route.copy_commands, /^(?:[nsew]|open (?:north|south|east|west))(?:;;(?:[nsew]|open (?:north|south|east|west)))*$/);
  assert.doesNotMatch(route.copy_commands, /CF|WARP|source|route/i);
  assert.ok(!route.copy_commands.endsWith(';;'));
});
