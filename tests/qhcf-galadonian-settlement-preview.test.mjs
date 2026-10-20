import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { BOUNDARY_STUBS, SOURCE_IDENTITY, anchorCatalog, formatCopyCommands, route, sourceGraph } from '../qhcf/galadonian-settlement-route.mjs';

const data = JSON.parse(fs.readFileSync(new URL('../qhcf/data/areas/galadonian-settlement.json', import.meta.url)));
const html = fs.readFileSync(new URL('../qhcf/galadonian-settlement-preview.html', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('../qhcf/galadonian-settlement-preview.mjs', import.meta.url), 'utf8');
const graph = sourceGraph(data);
const reverse = Object.freeze({ n: 's', s: 'n', e: 'w', w: 'e', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw' });

test('revision, QHCF attribution, capture and content hash remain exact', () => {
  assert.equal(data.source_title, 'GaladonianSettlement');
  assert.equal(data.source.revision_id, 4980);
  assert.equal(data.source.permalink, SOURCE_IDENTITY.permalink);
  assert.equal(data.source.captured_at_utc, SOURCE_IDENTITY.captured_at_utc);
  assert.equal(data.source.sha256_content, SOURCE_IDENTITY.sha256_content);
  assert.equal(data.attribution, 'QHCF / DIKU-WIKI, the credited map authors, and contributors; original page notices are retained in the map text');
});

test('all 75 plus cells and 17 meaningful anchors retain stable source-coordinate IDs', () => {
  assert.equal(data.plus_cells.length, 75);
  assert.equal([...graph.rooms.values()].filter(room => room.glyph === '+').length, 75);
  assert.equal(graph.rooms.size, 92);
  assert.equal(graph.edges.length, 106);
  assert.equal(anchorCatalog(graph).length, 17);
  assert.equal(graph.rooms.get('24:21').id, 'qhcf.area.galadonian-settlement.r24c21');
  assert.equal(graph.rooms.get('24:21').label, 'Stee Hoarns (H)');
  assert.ok(!graph.rooms.has('24:54'), 'WagonMarkedRoad W must not become Borgus');
});

test('explicit orthogonal routes reverse exactly and copy with double semicolons', () => {
  const forward = route(graph, '14:25', '24:21');
  const back = route(graph, '24:21', '14:25');
  assert.equal(forward.status, 'MAP_ROUTE');
  assert.equal(forward.copy_commands, 'w;;s;;e');
  assert.equal(forward.movement_count, 3);
  assert.equal(forward.plus_rooms_visited, 2);
  assert.deepEqual(back.commands, [...forward.commands].reverse().map(command => reverse[command]));
  assert.equal(back.copy_commands, 'w;;n;;e');
  assert.ok(!forward.copy_commands.endsWith(';;'));
  assert.equal(formatCopyCommands(['e', 'e']), 'e;;e');
});

test('slash connectors remain diagonal and reverse as the opposite diagonal', () => {
  const southwest = route(graph, '10:20', '12:18');
  const northeast = route(graph, '12:18', '10:20');
  assert.deepEqual(southwest.commands, ['sw']);
  assert.deepEqual(northeast.commands, ['ne']);
  assert.notEqual(southwest.commands[0], 's');
  assert.notEqual(southwest.commands[0], 'w');
});

test('unknown and source-labeled boundary endpoints never invent crossings', () => {
  assert.equal(BOUNDARY_STUBS.length, 2);
  for (const boundary of graph.boundaries) {
    assert.equal(boundary.status, 'source-labeled-boundary-stub');
    assert.equal(boundary.crossing_verified, false);
    assert.equal(boundary.cross_area_command, null);
    const result = route(graph, boundary.id, '24:21');
    assert.equal(result.status, 'UNKNOWN_ENDPOINT');
    assert.deepEqual(result.commands, []);
  }
  assert.equal(route(graph, 'not-a-room', '24:21').status, 'UNKNOWN_ENDPOINT');
  assert.equal(route(graph, 'R', '24:21').status, 'AMBIGUOUS_OR_UNMAPPED_CONNECTION');
  assert.match(graph.ambiguities.find(item => item.id === 'lower-district-gap').reason, /remain disconnected/);
});

test('every stored edge is reversible where the source proves a connector', () => {
  for (const edge of graph.edges) {
    const forward = route(graph, edge.from, edge.to), back = route(graph, edge.to, edge.from);
    assert.equal(forward.status, 'MAP_ROUTE'); assert.equal(back.status, 'MAP_ROUTE');
    assert.deepEqual(forward.commands, [edge.command]);
    assert.deepEqual(back.commands, [reverse[edge.command]]);
  }
});

test('preview preserves source/text links, click/copy behavior, focus and 390px fit guard', () => {
  for (const path of ['/qhcf/areas/galadonian-settlement.html', '/qhcf/data/areas/galadonian-settlement.txt', '/qhcf/data/areas/galadonian-settlement.json']) assert.ok(html.includes(`href="${path}"`));
  assert.match(html, /oldid=4980/);
  assert.match(html, /button:focus-visible/);
  assert.match(html, /@media\(max-width:390px\)/);
  assert.match(html, /max-width:100%/);
  assert.match(ui, /aria-pressed/);
  assert.match(ui, /button\.addEventListener\('click'/);
  assert.match(ui, /navigator\.clipboard\.writeText/);
  assert.match(ui, /document\.execCommand\('copy'\)/);
  assert.match(ui, /clipboard timeout/);
  assert.match(ui, /Copied to clipboard\./);
  assert.doesNotMatch(html + ui, /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
  assert.doesNotMatch(html, /target="_blank"/);
});

