import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const qhcf = path.join(root, 'qhcf');
const source = JSON.parse(fs.readFileSync(path.join(qhcf, 'maps.json'), 'utf8'));
const dataDir = path.join(qhcf, 'data');
const areaDir = path.join(dataDir, 'areas');
fs.mkdirSync(areaDir, { recursive: true });
const slugify = (value) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'area';
const used = new Map();
const areas = source.maps.map((map, index) => {
  const base = slugify(map.title); const n = (used.get(base) || 0) + 1; used.set(base, n);
  const slug = n === 1 ? base : `${base}-${n}`;
  const area = { ...map, id: `qhcf.area.${slug}`, slug, ordinal: index + 1 };
  fs.writeFileSync(path.join(areaDir, `${slug}.json`), JSON.stringify(area));
  fs.writeFileSync(path.join(areaDir, `${slug}.txt`), `${map.title}\n${'='.repeat(map.title.length)}\n\n${map.lines.join('\n')}\n\nSource: ${map.source.permalink || map.source.url}\nRevision: ${map.source.revision_id ?? 'unrecorded'}\n`);
  return { id: area.id, slug, title: map.title, source_title: map.source_title, status: map.status, plus_cells: map.plus_cells.length, source: map.source, routing_status: map.routing_status };
});
fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify({ format_version: 'qhcf-atlas-1', generated_at_utc: new Date().toISOString(), count: areas.length, areas }));
