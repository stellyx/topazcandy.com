import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'qhcf', 'academy-temple-coverage.html'), 'utf8');
const js = await readFile(path.join(root, 'qhcf', 'assets', 'academy-preview.mjs'), 'utf8');
const overview = await readFile(path.join(root, 'qhcf', 'index.html'), 'utf8');

test('mobile uses cards instead of a shrunken table', () => {
  assert.match(html, /@media\(max-width:820px\).*\.desktop-table\{display:none\}.*\.mobile-list\{display:grid/s);
  assert.match(html, /id="coverage-cards"/);
});

test('touch-oriented controls have 44px minimum targets', () => {
  assert.match(html, /\.nav a\{[^}]*min-height:44px/);
  assert.match(html, /\.filters button\{[^}]*min-height:44px/);
  assert.match(html, /\.source-link\{[^}]*min-height:44px/);
});

test('page prevents page-level horizontal overflow', () => assert.match(html, /body\{[^}]*overflow-x:hidden/));
test('comfortable typography is retained', () => {
  assert.match(html, /font:16px\/1\.55/);
  assert.match(html, /font-size:clamp\(2rem,5vw,3\.65rem\)/);
});
test('search and evidence filters are wired', () => {
  assert.match(html, /id="coverage-search"/);
  for (const filter of ['all','source','official','unresolved']) assert.match(html, new RegExp(`data-filter="${filter}"`));
  assert.match(js, /addEventListener\('input'/);
  assert.match(js, /setAttribute\('aria-pressed'/);
});
test('source anchors keep exact revision row and column', () => {
  assert.match(js, /Revision \$\{esc\(source\.revision\)\} · row \$\{esc\(source\.row\)\} · column \$\{esc\(source\.column\)\}/);
});
test('presentation still rejects invented topology', () => {
  assert.match(html, /No reverse exit or cross-city shortcut is advertised/);
  assert.match(html, /there is no authoritative Academy geometry to draw, shrink, pan, or zoom/i);
});
test('mobile cards distinguish report from verification', () => {
  assert.match(js, /DOWN \(user report\)/);
  assert.match(js, /Not live verified/);
});
test('existing atlas overview keeps the Academy reference discoverable', () => {
  assert.match(overview, /href="\/qhcf\/academy-temple-coverage\.html"/);
});
test('physical-phone claims are explicitly excluded', () => assert.match(html, /do not substitute for a physical-phone test/i));
