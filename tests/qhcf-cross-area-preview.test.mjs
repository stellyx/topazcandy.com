import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildAsciiMapGraph, planMapRoute } from '../qhcf/navigation/route-engine.mjs';
import { EAST_GATE, OUTSIDE_EAST_GATE, EASTERN_ANCHORS, UNKNOWN_BOUNDARY, guildThresholds, planTwoAreaRoute } from '../qhcf/cross-area-route.mjs';
import { withEastGateAction } from '../qhcf/gate-commands.mjs';

const graph = JSON.parse(readFileSync(new URL('../qhcf/navigation/galadon-v1.json', import.meta.url)));
const source = JSON.parse(readFileSync(new URL('../qhcf/data/areas/the-eastern-road.json', import.meta.url)));
const html = readFileSync(new URL('../qhcf/cross-area-preview.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../qhcf/cross-area-preview.mjs', import.meta.url), 'utf8');

test('Market Square opens East Gate after five east, then 34 reported east from outside', () => {
  const result = planTwoAreaRoute(graph, 'galadon.map.marker.m', 'eastern.map.c');
  assert.equal(result.status, 'REPORTED_ROUTE');
  assert.equal(result.known_moves, 40);
  assert.equal(result.mapped_moves, 6);
  assert.equal(result.reported_moves, 34);
  assert.equal(result.legs.length, 2);
  assert.equal(result.legs[0].to, OUTSIDE_EAST_GATE);
  assert.equal(result.legs[0].copy_commands, 'e;;e;;e;;e;;e;;open east;;e');
  assert.equal(result.legs[0].commands.length, result.legs[0].moves);
  assert.equal(result.legs[0].live_verified, false);
  assert.equal(result.legs[1].moves, 34);
  assert.equal(result.legs[1].node_ids.length, 0);
  assert.equal(result.copy_all, [...Array(5).fill('e'),'open east',...Array(35).fill('e')].join(';;'));
  assert.equal(result.copy_all.split(';;').length, 41);
  const outside = planTwoAreaRoute(graph, OUTSIDE_EAST_GATE, 'eastern.map.c');
  assert.equal(outside.copy_all, Array(34).fill('e').join(';;'));
  assert.equal(outside.known_moves, 34);
  const inside = planTwoAreaRoute(graph, EAST_GATE, 'eastern.map.c');
  assert.equal(inside.copy_all, ['open east',...Array(35).fill('e')].join(';;'));
  assert.equal(inside.known_moves, 35);
  const partial = planTwoAreaRoute(graph, 'galadon.map.marker.m', 'eastern.map.east-one');
  assert.equal(partial.status, 'PARTIAL');
  assert.equal(partial.known_moves, 6);
  assert.equal(partial.copy_all, null);
  assert.equal(partial.stop.reason, UNKNOWN_BOUNDARY.reason);
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
  assert.equal(planMapRoute(graph, 'galadon.map.marker.m', OUTSIDE_EAST_GATE).movement_count, 6);
  assert.deepEqual(withEastGateAction([EAST_GATE,OUTSIDE_EAST_GATE],['e']),['open east','e']);
  assert.deepEqual(withEastGateAction([OUTSIDE_EAST_GATE,EAST_GATE],['w']),['w']);
  assert.equal(EASTERN_ANCHORS.length, 2);
  for (const path of ['/qhcf/galadon-preview.html', '/qhcf/data/areas/the-eastern-road.txt']) {
    assert.ok(existsSync(new URL('..' + path, import.meta.url)), path);
  }
  assert.equal(UNKNOWN_BOUNDARY.map_url, '/qhcf/eastern-road-preview.html?v=bbbdc14');
  assert.match(html, /href="\/qhcf\/eastern-road-preview.html\?v=bbbdc14"/);
  assert.match(html, /data-anchor="eastern.map.c"/);
  assert.match(html, /data-anchor="galadon.map.r40c67"/);
  assert.match(readFileSync(new URL('../qhcf/galadon-preview.html', import.meta.url), 'utf8'), /withEastGateAction\(p.node_ids,p.commands\)/);
  assert.match(html, /id="copy-all"[^>]*disabled/);
  assert.match(ui, /result.status === 'REPORTED_ROUTE'/);
  assert.match(html, /inside East Gate is five east from Market Square/);
  assert.match(html, /Galadon Large Crossroads/);
  assert.match(html, /Eastern Road Large Crossroads \(C\)/);
  assert.match(ui, /includes\('open east'\)/);
});
