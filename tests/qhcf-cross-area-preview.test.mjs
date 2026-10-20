import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildAsciiMapGraph, planMapRoute } from '../qhcf/navigation/route-engine.mjs';
import { EAST_GATE, EASTERN_ANCHORS, UNKNOWN_BOUNDARY, guildThresholds, planTwoAreaRoute } from '../qhcf/cross-area-route.mjs';

const graph = JSON.parse(readFileSync(new URL('../qhcf/navigation/galadon-v1.json', import.meta.url)));
const source = JSON.parse(readFileSync(new URL('../qhcf/data/areas/the-eastern-road.json', import.meta.url)));
const html = readFileSync(new URL('../qhcf/cross-area-preview.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../qhcf/cross-area-preview.mjs', import.meta.url), 'utf8');

test('Galadon leg reaches East Gate in five source-map east steps, then stops', () => {
  const result = planTwoAreaRoute(graph, 'galadon.map.marker.m', 'eastern.map.c');
  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.known_moves, 5);
  assert.equal(result.legs.length, 1);
  assert.equal(result.legs[0].to, EAST_GATE);
  assert.equal(result.legs[0].copy_commands, 'e;;e;;e;;e;;e');
  assert.equal(result.legs[0].commands.length, result.legs[0].moves);
  assert.equal(result.legs[0].live_verified, false);
  assert.equal(result.copy_all, null);
  assert.equal(result.stop.reason, UNKNOWN_BOUNDARY.reason);
  assert.ok(!JSON.stringify(result.legs).includes('eastern.map.c'));
});

test('flip recalculates directed route; unknown reverse crossing contributes no commands', () => {
  const back = planTwoAreaRoute(graph, 'eastern.map.c', 'galadon.map.marker.m');
  assert.equal(back.status, 'PARTIAL');
  assert.equal(back.known_moves, 0);
  assert.deepEqual(back.legs, []);
  assert.equal(back.copy_all, null);
  assert.match(back.stop.reason, /Return crossing/);
  const sameArea = planTwoAreaRoute(graph, EAST_GATE, 'galadon.map.marker.m');
  assert.equal(sameArea.status, 'MAP_ROUTE');
  assert.equal(sameArea.copy_all, 'w;;w;;w;;w;;w');
});

test('guild choice ends outside; Anti-Paladin correction remains west then optional north', () => {
  const ap = planTwoAreaRoute(graph, 'galadon.map.r51c36', 'galadon.map.guild.anti-paladin');
  assert.equal(ap.status, 'MAP_ROUTE');
  assert.equal(ap.copy_all, 'w');
  assert.equal(ap.known_moves, 1);
  assert.equal(ap.threshold.outside, 'galadon.map.r51c32');
  assert.equal(ap.threshold.optional_entry, 'n');
  assert.equal(planMapRoute(graph, 'galadon.map.r51c36', 'galadon.map.guild.anti-paladin').copy_commands, 'w;;n');
  const paladin = planTwoAreaRoute(graph, 'galadon.map.marker.m', 'galadon.map.guild.paladin');
  assert.equal(paladin.threshold.guild, 'galadon.map.guild.paladin');
  assert.equal(paladin.legs[0].to, paladin.threshold.outside);
  assert.notEqual(paladin.threshold.guild, ap.threshold.guild);
  assert.equal(guildThresholds(buildAsciiMapGraph(graph)).get('galadon.map.guild.anti-paladin').entry, 'n');
});

test('source inventories and destination links remain source-backed', () => {
  assert.equal(source.plus_cells.length, 9);
  assert.equal(buildAsciiMapGraph(graph).nodes.filter(node => node.kind === 'plus-room').length,
    graph.map_route.lines.join('\n').split('+').length - 1);
  assert.equal(planMapRoute(graph, 'galadon.map.marker.m', EAST_GATE).movement_count, 5);
  assert.equal(EASTERN_ANCHORS.length, 2);
  for (const path of ['/qhcf/galadon-preview.html', '/qhcf/data/areas/the-eastern-road.txt']) {
    assert.ok(existsSync(new URL('..' + path, import.meta.url)), path);
  }
  // The Eastern Road preview belongs to Russell's separate branch until integration.
  assert.equal(UNKNOWN_BOUNDARY.map_url, '/qhcf/eastern-road-preview.html?v=dd5ff06');
  assert.match(html, /href="\/qhcf\/eastern-road-preview.html\?v=dd5ff06"/);
  assert.match(html, /data-anchor="eastern.map.c"/);
  assert.match(html, /id="copy-all"[^>]*disabled/);
  assert.match(ui, /result.status === 'MAP_ROUTE' && result.copy_all/);
});
