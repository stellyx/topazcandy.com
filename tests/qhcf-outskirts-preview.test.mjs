import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { BOUNDARY_STUBS, SOURCE_IDENTITY, formatCopyCommands, inspectPath, sourceGraph } from '../qhcf/outskirts-route.mjs';

const data = JSON.parse(fs.readFileSync(new URL('../qhcf/data/areas/outskirts-of-galadon.json', import.meta.url)));
const html = fs.readFileSync(new URL('../qhcf/outskirts-preview.html', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('../qhcf/outskirts-preview.mjs', import.meta.url), 'utf8');
const graph = sourceGraph(data);

test('revision, credit, capture and content hash remain exact', () => {
  assert.equal(data.source_title, 'GaladonOutskirts');
  assert.equal(data.source.revision_id, 5047);
  assert.equal(data.source.permalink, SOURCE_IDENTITY.permalink);
  assert.equal(data.source.captured_at_utc, SOURCE_IDENTITY.captured_at_utc);
  assert.equal(data.source.sha256_content, SOURCE_IDENTITY.sha256_content);
  assert.match(data.lines.join('\n'), /by Vassagon/);
  assert.match(data.lines.join('\n'), /Copyright 1997, H\. Beres/);
  assert.equal(data.attribution, 'QHCF / DIKU-WIKI, the credited map authors, and contributors; original page notices are retained in the map text');
});

test('all source direction glyphs and printed topology edges have stable coordinates', () => {
  assert.equal(data.plus_cells.length, 0);
  assert.equal(graph.nodes.size, 60);
  assert.equal(graph.edges.length, 60);
  assert.deepEqual(Object.fromEntries([...graph.nodes.values()].reduce((counts, node) => counts.set(node.glyph, (counts.get(node.glyph) || 0) + 1), new Map())),
    { NW: 6, N: 7, NE: 6, W: 13, E: 12, SW: 5, SE: 4, S: 7 });
  assert.equal(graph.nodes.get('12:3').id, 'qhcf.area.outskirts-of-galadon.r12c3');
  for (const edge of graph.edges) assert.match(edge.command_status, /^unverified-/);
});

test('connected source topology is inspectable but ambiguous commands stay disconnected', () => {
  const path = inspectPath(graph, '12:3', '50:3');
  assert.equal(path.status, 'UNVERIFIED_DIRECTION_SEMANTICS');
  assert.equal(path.node_keys.length, 20);
  assert.ok(path.source_glyphs.includes('NW'));
  assert.ok(path.source_glyphs.includes('SW'));
  assert.deepEqual(path.commands, []);
  assert.equal(path.copy_commands, '');
  assert.equal(path.movement_count, null);
  assert.match(path.reason, /no legend/i);
  assert.equal(inspectPath(graph, 'NW', '50:3').status, 'AMBIGUOUS_ENDPOINT');
  assert.equal(inspectPath(graph, 'not-a-node', '50:3').status, 'UNKNOWN_ENDPOINT');
  assert.equal(formatCopyCommands(['nw', 'n', 'ne']), 'nw;;n;;ne');
  assert.ok(!formatCopyCommands(['nw', 'n', 'ne']).endsWith(';;'));
});

test('boundary labels remain explicit unverified stubs, never cross-area edges', () => {
  assert.equal(BOUNDARY_STUBS.length, 12);
  for (const stub of graph.stubs) {
    assert.equal(stub.status, 'source-labeled-boundary-stub');
    assert.equal(stub.crossing_verified, false);
    assert.equal(stub.cross_area_command, null);
  }
  assert.deepEqual(graph.edges.filter(edge => edge.to.includes('boundary') || edge.from.includes('boundary')), []);
});

test('preview preserves source and text links, focus markup and 390px fit guard', () => {
  for (const path of ['/qhcf/areas/outskirts-of-galadon.html', '/qhcf/data/areas/outskirts-of-galadon.txt', '/qhcf/data/areas/outskirts-of-galadon.json']) assert.ok(html.includes(`href="${path}"`));
  assert.match(html, /oldid=5047/);
  assert.match(html, /button:focus-visible/);
  assert.match(html, /@media\(max-width:390px\)/);
  assert.match(html, /max-width:100%/);
  assert.match(html, /id="copy" disabled/);
  assert.match(ui, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(html + ui, /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
  assert.doesNotMatch(html, /target="_blank"/);
});

