import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const inventory = JSON.parse(await readFile(path.join(root, 'qhcf/data/academy-source-inventory.json'), 'utf8'));
const graph = JSON.parse(await readFile(path.join(root, 'qhcf/data/navigation/academy-graph.json'), 'utf8'));
const csv = await readFile(path.join(root, 'qhcf/data/references/temple-coverage-matrix.csv'), 'utf8');
const html = await readFile(path.join(root, 'qhcf/academy-temple-coverage.html'), 'utf8');

function parseCsvLine(line) {
  const fields = [];
  let field = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) { fields.push(field); field = ''; }
    else field += ch;
  }
  fields.push(field);
  return fields;
}

test('missing standalone Academy source is explicit', () => {
  assert.equal(inventory.standaloneAcademyCapture.present, false);
  assert.match(inventory.standaloneAcademyCapture.consequence, /must not be reconstructed/i);
});

test('source labels are not promoted to executable commands', () => {
  assert.ok(inventory.academyApproachCharts.every(anchor => anchor.routeEligible === false));
  assert.ok(graph.seams.every(seam => seam.executableCommand === null));
});

test('user report remains distinct from source-confirmed topology', () => {
  assert.equal(graph.userReport.evidenceTier, 'user_report');
  assert.equal(graph.userReport.liveVerified, false);
  assert.match(graph.userReport.unresolvedName, /not normalized/i);
});

test('no automatic reverse edge is allowed', () => {
  assert.equal(graph.routePolicy.allowAutomaticReverseEdges, false);
  assert.ok(graph.seams.every(seam => seam.returnCommand === null));
});

test('no shared Academy node or cross-origin shortest path exists', () => {
  assert.equal(graph.routePolicy.allowSharedAcademyNode, false);
  assert.equal(graph.routePolicy.allowCrossOriginPath, false);
  assert.equal(graph.routePolicy.allowShortestPathThroughAcademy, false);
  assert.equal(new Set(graph.seams.map(s => s.boundaryNode)).size, graph.seams.length);
});

test('global level rule and seam-specific admission uncertainty coexist', () => {
  assert.deepEqual(graph.globalAdmission.levelsAllowed, [1,2,3,4,5]);
  assert.equal(graph.globalAdmission.levelSixBehavior, 'removed and cannot re-enter');
  assert.equal(graph.globalAdmission.seamSpecificEnforcement, 'unknown');
});

test('north and south branches are descriptive only', () => {
  assert.deepEqual(graph.descriptiveBranches.map(b => b.direction).sort(), ['north','south']);
  assert.ok(graph.descriptiveBranches.every(b => b.coordinates === null && b.edge === null));
  assert.ok(graph.descriptiveBranches.every(b => b.properName === null));
});

test('Teth labels are preserved as a conflict, not merged', () => {
  const teth = inventory.academyApproachCharts.find(a => a.id === 'teth-warriors-academy-conflict');
  assert.equal(teth.sourceChart.literal, "Warrior's Academy");
  assert.equal(teth.companionTempleLabel.literal, 'Temple of Lloth');
  assert.equal(teth.routeEligible, false);
});

test('standalone religious areas stay outside the shared Academy graph', () => {
  const excluded = inventory.literalTempleChartInventory.filter(x => /standalone religious area/.test(x.classification));
  assert.ok(excluded.some(x => x.slug === 'elemental-temple'));
  assert.ok(excluded.some(x => x.slug === 'temple-of-loch-grynmear'));
  assert.ok(excluded.every(x => x.academyConnection === 'none'));
});

test('coverage includes every named official hometown plus unresolved wood-elf class', () => {
  const rows = csv.trim().split(/\r?\n/);
  assert.equal(rows.length - 1, 21);
  for (const name of ['Galadon','Hamsah Mu\'tazz','Saurian Village','Grinning Skull Village','Wood-elf unique hometowns']) {
    assert.match(csv, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('unresolved routes are never advertised as verified', () => {
  const lines = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  const routeColumn = headers.indexOf('route_advertised');
  assert.notEqual(routeColumn, -1);
  assert.ok(lines.map(parseCsvLine).every(row => row[routeColumn] === 'no'));
});

test('manual graphical references remain available', () => {
  assert.match(html, /coverage\/reference view/i);
  assert.match(html, /source chart labels are not commands/i);
  assert.match(html, /\/qhcf\/assets\/academy-preview\.mjs/);
});

test('direction command separator convention is preserved', () => {
  assert.equal(graph.routePolicy.commandSeparator, ';;');
  assert.equal(inventory.commandFormat.separator, ';;');
});
