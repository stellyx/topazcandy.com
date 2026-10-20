import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = path.resolve(import.meta.dirname, '..');
if(!process.argv[2])throw new Error('Usage: node scripts/build-world-map-links.mjs <preserved-site/pages/WorldMap.html>');
const sourceHtml=path.resolve(process.argv[2]);
const output = path.join(repo, 'qhcf', 'data', 'world-map-links.json');
const chartTextPath = path.join(repo, 'qhcf', 'data', 'areas', 'worldmap.txt');
const indexPath = path.join(repo, 'qhcf', 'data', 'index.json');

const decode = (value) => value
  .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, raw) => String.fromCodePoint(raw[0].toLowerCase() === 'x' ? Number.parseInt(raw.slice(1), 16) : Number(raw)))
  .replace(/&nbsp;/gi, '\u00a0')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&apos;|&#39;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');
const visible = (value) => decode(value.replace(/<[^>]*>/g, ''));
const normalize = (value) => String(value).toLowerCase().replace(/^the\b/, '').replace(/[^a-z0-9]+/g, '');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const bySource = new Map();
const byTitle = new Map();
for (const area of index.areas) {
  const sourceKey = normalize(area.source_title);
  const titleKey = normalize(area.title);
  if (!bySource.has(sourceKey)) bySource.set(sourceKey, area);
  if (!byTitle.has(titleKey)) byTitle.set(titleKey, area);
}
const aliases = new Map([[normalize('PlainsOfUdgaard'), 'udgaardian-plains']]);
const authorTargets = new Set(['RobertDunn', 'Zendrac', 'Yhorian', 'DurNominator'].map(normalize));
const unresolvedAreaTargets = new Map([
  [normalize('DragonTowerRuins'), 'Dragon Tower Ruins is named on the captured chart, but no atlas map record was preserved.'],
  [normalize('SandsOfSorrow'), 'Sands of Sorrow is named on the captured chart, but no atlas map record was preserved.'],
  [normalize('SirineIsland'), 'Sirine Island is named on the captured chart, but no atlas map record was preserved.'],
]);

const html = fs.readFileSync(sourceHtml, 'utf8');
const chartHtml = html.match(/<pre>([\s\S]*?)<\/pre>/i)?.[1];
if (!chartHtml) throw new Error(`No preserved <pre> chart found in ${sourceHtml}`);
const chartLines = chartHtml.replace(/\r/g, '').split('\n');
const renderedLines = [];
const occurrences = [];
const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;

for (let row = 0; row < chartLines.length; row += 1) {
  const htmlLine = chartLines[row];
  let plain = '';
  let cursor = 0;
  anchorPattern.lastIndex = 0;
  for (const match of htmlLine.matchAll(anchorPattern)) {
    plain += visible(htmlLine.slice(cursor, match.index));
    const label = visible(match[2]);
    const attrs = match[1];
    const href = decode(attrs.match(/\bhref="([^"]*)"/i)?.[1] ?? '');
    const sourceTitle = decode(attrs.match(/\btitle="([^"]*)"/i)?.[1] ?? '');
    const key = normalize(sourceTitle);
    const area = bySource.get(key) ?? byTitle.get(key);
    const aliasSlug = aliases.get(key);
    const unresolvedNote = unresolvedAreaTargets.get(key);
    if (area || aliasSlug || unresolvedNote) {
      const slug = area?.slug ?? aliasSlug ?? null;
      const destinationArea = slug ? index.areas.find((item) => item.slug === slug) : null;
      occurrences.push({
        row,
        column: Array.from(plain).length,
        length: Array.from(label).length,
        label,
        source_title: sourceTitle,
        source_href: href,
        destination: slug ? `/qhcf/areas/${slug}.html` : null,
        destination_title: destinationArea?.title ?? null,
        status: slug ? 'mapped-area' : 'unresolved-preserved-target',
        ...(unresolvedNote ? { note: unresolvedNote } : {}),
      });
    } else if (!authorTargets.has(key)) {
      throw new Error(`Unclassified captured WorldMap target: ${sourceTitle} (${href})`);
    }
    plain += label;
    cursor = match.index + match[0].length;
  }
  plain += visible(htmlLine.slice(cursor));
  renderedLines.push(plain);
}

const captured = fs.readFileSync(chartTextPath, 'utf8').replace(/\r/g, '').split('\n');
const firstChartRow = captured.findIndex((line) => line.includes('MAP OF THERA'));
if (firstChartRow < 0) throw new Error('Published WorldMap transcription has no MAP OF THERA row.');
for (let row = 0; row < renderedLines.length; row += 1) {
  if (captured[firstChartRow + row] !== renderedLines[row]) {
    throw new Error(`Archived linked chart diverges from published transcription at row ${row + 1}:\nCAPTURED ${JSON.stringify(captured[firstChartRow + row])}\nARCHIVED ${JSON.stringify(renderedLines[row])}`);
  }
}

const mappedSlugs = [...new Set(occurrences.filter((item) => item.destination).map((item) => item.destination.split('/').at(-1).replace(/\.html$/, '')))].sort();
const represented = index.areas.filter((area) => mappedSlugs.includes(area.slug)).map((area) => area.slug);
const notRepresented = index.areas.filter((area) => !mappedSlugs.includes(area.slug)).map((area) => ({ slug: area.slug, title: area.title }));
const unresolved = [...new Set(occurrences.filter((item) => !item.destination).map((item) => item.source_title))].sort();
const result = {
  schema_version: 1,
  source: {
    title: 'WorldMap',
    archive_timestamp: '20210129143325',
    sha256_html: crypto.createHash('sha256').update(html).digest('hex'),
    coordinate_system: 'zero-based row and Unicode code-point column in data/areas/worldmap.txt',
    first_chart_row: firstChartRow,
  },
  summary: {
    indexed_areas: index.areas.length,
    mapped_occurrences: occurrences.filter((item) => item.destination).length,
    unresolved_occurrences: occurrences.filter((item) => !item.destination).length,
    represented_index_areas: represented.length,
    unrepresented_index_areas: notRepresented,
    unresolved_preserved_targets: unresolved,
  },
  occurrences,
};

fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result.summary, null, 2));
