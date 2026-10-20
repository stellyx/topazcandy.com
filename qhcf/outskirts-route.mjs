export const SOURCE_IDENTITY = Object.freeze({
  id: 'qhcf.area.outskirts-of-galadon',
  slug: 'outskirts-of-galadon',
  source_title: 'GaladonOutskirts',
  revision_id: 5047,
  permalink: 'http://wiki.qhcf.net/index.php?title=Outskirts_of_Galadon&oldid=5047',
  captured_at_utc: '2026-10-19T21:34:44.110Z',
  sha256_content: '4788D52D7377E9515CD9591628C045D3394B5C006A9B194620D9EA73D00F28DA',
  credit: 'Map by Vassagon; Copyright 1997, H. Beres; for Carrion Fields MUD',
  validation: 'verified-transcription-not-live-route'
});

const TOKEN = /(?<![A-Za-z])(NW|NE|SW|SE|N|S|E|W)(?![A-Za-z])/g;
const key = (row, column) => `${row}:${column}`;
export const roomId = (row, column) => `${SOURCE_IDENTITY.id}.r${row}c${column}`;

export const BOUNDARY_STUBS = Object.freeze([
  { id: 'north-roads-top', label: 'NorthernRoads (top)', row: 10, port_column: 24, direction: 'n', node: '12:24' },
  { id: 'galadon-north', label: 'Galadon north entrance', row: 14, port_column: 24, direction: 's', node: '12:24' },
  { id: 'arena', label: 'The Arena', row: 20, port_column: 43, direction: 'e', node: '20:41' },
  { id: 'galadon-west-north', label: 'Galadon west entrance (north)', row: 24, port_column: 5, direction: 'e', node: '24:3' },
  { id: 'galadon-east-north', label: 'Galadon east entrance (north)', row: 24, port_column: 33, direction: 'w', node: '24:41' },
  { id: 'north-roads-east', label: 'NorthernRoads (east)', row: 24, port_column: 43, direction: 'e', node: '24:41' },
  { id: 'feanwyyn', label: 'Feanwyyn', row: 24, port_column: 1, direction: 'w', node: '24:3' },
  { id: 'galadon-west-south', label: 'Galadon west entrance (south)', row: 34, port_column: 5, direction: 'e', node: '34:3' },
  { id: 'galadon-east-south', label: 'Galadon east entrance (south)', row: 34, port_column: 33, direction: 'w', node: '34:41' },
  { id: 'crossroads', label: 'Crossroads', row: 34, port_column: 43, direction: 'e', node: '34:41' },
  { id: 'galadon-south', label: 'Galadon south entrance', row: 48, port_column: 24, direction: 'n', node: '50:24' },
  { id: 'silverwood', label: 'Silverwood', row: 52, port_column: 24, direction: 's', node: '50:24' }
]);

function assertSource(data) {
  if (data.id !== SOURCE_IDENTITY.id || data.source_title !== SOURCE_IDENTITY.source_title || data.source?.revision_id !== SOURCE_IDENTITY.revision_id) {
    throw new Error('Unexpected Outskirts of Galadon source identity');
  }
  for (const field of ['permalink', 'captured_at_utc', 'sha256_content']) {
    if (data.source[field] !== SOURCE_IDENTITY[field]) throw new Error(`Outskirts source ${field} changed`);
  }
  const joined = data.lines.join('\n');
  if (!joined.includes('by Vassagon') || !joined.includes('Copyright 1997, H. Beres')) throw new Error('Outskirts source credit changed');
  if (data.plus_cells.length !== 0) throw new Error('Outskirts source unexpectedly contains plus rooms');
}

function connectorOnly(text, connector) {
  return text.length > 0 && [...text].every(character => character === connector);
}

export function sourceGraph(data) {
  assertSource(data);
  const nodes = new Map();
  data.lines.forEach((line, index) => {
    if (index + 1 < 12 || index + 1 > 50) return;
    for (const match of line.matchAll(TOKEN)) {
      const row = index + 1, column = match.index + 1;
      nodes.set(key(row, column), {
        id: roomId(row, column), key: key(row, column), row, column,
        glyph: match[1], kind: 'source-direction-glyph'
      });
    }
  });
  const edges = [];
  const add = (a, b, connector, orientation) => edges.push({
    id: `${a.key}--${b.key}`, from: a.key, to: b.key, connector, orientation,
    command_status: 'unverified-source-direction-semantics'
  });
  const rows = new Map();
  for (const node of nodes.values()) rows.set(node.row, [...(rows.get(node.row) || []), node]);
  for (const [row, rowNodes] of rows) {
    rowNodes.sort((a, b) => a.column - b.column);
    for (let i = 0; i < rowNodes.length - 1; i += 1) {
      const left = rowNodes[i], right = rowNodes[i + 1];
      const between = data.lines[row - 1].slice(left.column - 1 + left.glyph.length, right.column - 1);
      if (connectorOnly(between, '-')) add(left, right, '-', 'printed-horizontal');
    }
  }
  const columns = new Map();
  for (const node of nodes.values()) columns.set(node.column, [...(columns.get(node.column) || []), node]);
  for (const [column, columnNodes] of columns) {
    columnNodes.sort((a, b) => a.row - b.row);
    for (let i = 0; i < columnNodes.length - 1; i += 1) {
      const top = columnNodes[i], bottom = columnNodes[i + 1];
      let connected = true;
      for (let row = top.row + 1; row < bottom.row; row += 1) {
        if (data.lines[row - 1]?.[column - 1] !== '|') connected = false;
      }
      if (connected) add(top, bottom, '|', 'printed-vertical');
    }
  }
  const stubs = BOUNDARY_STUBS.map(stub => ({
    ...stub, status: 'source-labeled-boundary-stub',
    crossing_verified: false, cross_area_command: null
  }));
  return {
    source: SOURCE_IDENTITY, nodes, edges, stubs,
    ambiguities: [{
      id: 'direction-glyph-semantics',
      reason: 'The source uses NW/N/NE/W/E/SW/S/SE glyphs as its old-trail notation but provides no legend establishing an edge-by-edge command orientation. Printed connectors are preserved as topology only; no copyable route is inferred.'
    }]
  };
}

function resolve(graph, value) {
  if (graph.nodes.has(value)) return { status: 'RESOLVED', key: value };
  const byId = [...graph.nodes.values()].filter(node => node.id === value);
  if (byId.length === 1) return { status: 'RESOLVED', key: byId[0].key };
  const glyph = String(value || '').toUpperCase();
  const matches = [...graph.nodes.values()].filter(node => node.glyph === glyph);
  if (matches.length > 1) return { status: 'AMBIGUOUS_ENDPOINT', candidates: matches.map(node => node.id) };
  return { status: 'UNKNOWN_ENDPOINT', candidates: [] };
}

export function inspectPath(graph, from, to) {
  const start = resolve(graph, from), goal = resolve(graph, to);
  if (start.status !== 'RESOLVED') return { status: start.status, endpoint: 'from', commands: [], copy_commands: '' };
  if (goal.status !== 'RESOLVED') return { status: goal.status, endpoint: 'to', commands: [], copy_commands: '' };
  if (start.key === goal.key) return { status: 'SAME_SOURCE_NODE', node_keys: [start.key], commands: [], copy_commands: '', movement_count: 0 };
  const next = new Map();
  for (const edge of graph.edges) {
    next.set(edge.from, [...(next.get(edge.from) || []), edge.to]);
    next.set(edge.to, [...(next.get(edge.to) || []), edge.from]);
  }
  const queue = [start.key], previous = new Map([[start.key, null]]);
  for (let i = 0; i < queue.length && !previous.has(goal.key); i += 1) {
    for (const candidate of next.get(queue[i]) || []) if (!previous.has(candidate)) {
      previous.set(candidate, queue[i]); queue.push(candidate);
    }
  }
  if (!previous.has(goal.key)) return { status: 'UNMAPPED_CONNECTION', commands: [], copy_commands: '', movement_count: 0 };
  const nodeKeys = [];
  for (let cursor = goal.key; cursor; cursor = previous.get(cursor)) nodeKeys.unshift(cursor);
  return {
    status: 'UNVERIFIED_DIRECTION_SEMANTICS', node_keys: nodeKeys,
    source_glyphs: nodeKeys.map(nodeKey => graph.nodes.get(nodeKey).glyph),
    commands: [], copy_commands: '', movement_count: null,
    reason: graph.ambiguities[0].reason
  };
}

export const formatCopyCommands = commands => commands.join(';;');

