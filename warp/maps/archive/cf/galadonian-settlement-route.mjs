export const SOURCE_IDENTITY = Object.freeze({
  id: 'qhcf.area.galadonian-settlement',
  slug: 'galadonian-settlement',
  source_title: 'GaladonianSettlement',
  revision_id: 4980,
  permalink: 'http://wiki.qhcf.net/index.php?title=Galadonian_Settlement&oldid=4980',
  captured_at_utc: '2026-10-19T21:34:41.952Z',
  sha256_content: 'B85EC09B70496BFC8C41FE1E7B45BA8F80610CEF3814E4B34167D52F7A5A0B66',
  attribution: 'QHCF / DIKU-WIKI, credited map authors, and contributors',
  validation: 'verified-transcription-not-live-route'
});

export const roomKey = (row, column) => `${row}:${column}`;
export const roomId = (row, column) => `${SOURCE_IDENTITY.id}.r${row}c${column}`;
const anchorLabels = Object.freeze({
  A: 'Thralin Iron-Arm', C: 'A Grimy Mercenary', F: 'Reflous the Butcher of Galadon',
  G: 'A Tiny Graveyard', H: 'Stee Hoarns', J: 'A Jolly Baker', K: 'Speaking-River',
  M: 'Murazaug the Merciless', N: 'Morkaih the Bandit', P: 'Berthgrah the Bold',
  R: 'Roger, the Tavern Owner', V: 'Evansh / Droga', S: 'Stump',
  W: 'Borgus the metalsmith', Y: 'Mayor', y: 'Young bladesman', Z: "A Wizard's Shop"
});
const glyphs = new Set(['+', ...Object.keys(anchorLabels)]);
const opposite = Object.freeze({ n: 's', s: 'n', e: 'w', w: 'e', ne: 'sw', sw: 'ne', nw: 'se', se: 'nw' });

export const BOUNDARY_STUBS = Object.freeze([
  { id: 'hidden-forest', label: 'HiddenForest', row: 24, column: 1, port: '24:15', direction_from_port: 'w' },
  { id: 'wagon-marked-road', label: 'WagonMarkedRoad', row: 24, column: 54, port: '24:51', direction_from_port: 'e' }
]);

function assertSource(data) {
  if (data.id !== SOURCE_IDENTITY.id || data.source_title !== SOURCE_IDENTITY.source_title || data.source?.revision_id !== SOURCE_IDENTITY.revision_id) {
    throw new Error('Unexpected Galadonian Settlement source identity');
  }
  for (const field of ['permalink', 'captured_at_utc', 'sha256_content']) {
    if (data.source[field] !== SOURCE_IDENTITY[field]) throw new Error(`Settlement source ${field} changed`);
  }
  if (data.plus_cells.length !== 75) throw new Error('Settlement plus inventory changed');
}

const connectorOnly = text => text.length > 0 && /^[-=]+$/.test(text);

export function sourceGraph(data) {
  assertSource(data);
  const lines = data.lines, at = (row, column) => lines[row - 1]?.[column - 1] || ' ';
  const rooms = new Map(), edges = [];
  for (let row = 10; row <= 40; row += 1) for (let column = 15; column <= 67; column += 1) {
    const glyph = at(row, column);
    if (!glyphs.has(glyph)) continue;
    // WagonMarkedRoad is a boundary label, not legend glyph rooms.
    if (row === 24 && column >= 54) continue;
    rooms.set(roomKey(row, column), {
      id: roomId(row, column), key: roomKey(row, column), row, column, glyph,
      kind: glyph === '+' ? 'plus-room' : 'named-anchor',
      label: glyph === '+' ? `Unnamed plus room (r${row}c${column})` : `${anchorLabels[glyph]} (${glyph})`
    });
  }
  const add = (from, to, command, connector) => edges.push({
    id: `${from}--${to}`, from, to, command, connector,
    evidence: 'explicit-printed-source-connector', live_verified: false
  });
  const byRow = new Map();
  for (const room of rooms.values()) byRow.set(room.row, [...(byRow.get(room.row) || []), room]);
  for (const [row, rowRooms] of byRow) {
    rowRooms.sort((a, b) => a.column - b.column);
    for (let i = 0; i < rowRooms.length - 1; i += 1) {
      const left = rowRooms[i], right = rowRooms[i + 1];
      const between = lines[row - 1].slice(left.column, right.column - 1);
      if (connectorOnly(between)) add(left.key, right.key, 'e', between);
    }
  }
  const byColumn = new Map();
  for (const room of rooms.values()) byColumn.set(room.column, [...(byColumn.get(room.column) || []), room]);
  for (const [column, columnRooms] of byColumn) {
    columnRooms.sort((a, b) => a.row - b.row);
    for (let i = 0; i < columnRooms.length - 1; i += 1) {
      const top = columnRooms[i], bottom = columnRooms[i + 1];
      let connected = bottom.row > top.row + 1;
      for (let row = top.row + 1; connected && row < bottom.row; row += 1) {
        if (!['|', '='].includes(at(row, column))) connected = false;
      }
      if (connected) add(top.key, bottom.key, 's', `vertical r${top.row + 1}-r${bottom.row - 1}`);
    }
  }
  const values = [...rooms.values()];
  for (const top of values) for (const bottom of values) {
    if (bottom.row !== top.row + 2 || Math.abs(bottom.column - top.column) !== 2) continue;
    const middle = at(top.row + 1, (top.column + bottom.column) / 2);
    if (middle !== '/') continue;
    add(top.key, bottom.key, bottom.column > top.column ? 'se' : 'sw', '/');
  }
  const plusKeys = [...rooms.values()].filter(room => room.glyph === '+').map(room => room.key).sort();
  const inventory = data.plus_cells.map(({ row, column }) => roomKey(row, column)).sort();
  if (JSON.stringify(plusKeys) !== JSON.stringify(inventory)) throw new Error('Settlement plus coordinates do not match the preserved inventory');
  return {
    source: SOURCE_IDENTITY, rooms, edges,
    boundaries: BOUNDARY_STUBS.map(stub => ({ ...stub, status: 'source-labeled-boundary-stub', crossing_verified: false, cross_area_command: null })),
    ambiguities: [
      { id: 'inn-labels', reason: 'Two Inn labels are preserved as annotations, not converted into room nodes because their exact attachment is not explicit.' },
      { id: 'lower-district-gap', reason: 'The lower V/R/J/C component begins at the separate plus at r30c55; the source prints no connector from it to the main component at r30c48, so the components remain disconnected.' },
      { id: 'boundary-crossings', reason: 'HiddenForest and WagonMarkedRoad are source-labeled stubs only; matching rooms and crossings in those areas are unverified.' }
    ]
  };
}

export function anchorCatalog(graph) {
  return [...graph.rooms.values()].filter(room => room.kind === 'named-anchor')
    .sort((a, b) => a.glyph.localeCompare(b.glyph) || a.row - b.row || a.column - b.column);
}

function resolve(graph, value) {
  if (graph.rooms.has(value)) return { status: 'RESOLVED', key: value };
  const byId = [...graph.rooms.values()].filter(room => room.id === value);
  if (byId.length === 1) return { status: 'RESOLVED', key: byId[0].key };
  const query = String(value || '').toLowerCase();
  const matches = [...graph.rooms.values()].filter(room => room.glyph.toLowerCase() === query || room.label.toLowerCase() === query);
  if (matches.length === 1) return { status: 'RESOLVED', key: matches[0].key };
  if (matches.length > 1) return { status: 'AMBIGUOUS_ENDPOINT', candidates: matches.map(room => room.id) };
  return { status: 'UNKNOWN_ENDPOINT', candidates: [] };
}

function grouped(commands) {
  const result = [];
  for (const command of commands) {
    const prior = result.at(-1);
    if (prior?.direction === command) prior.count += 1;
    else result.push({ direction: command, count: 1 });
  }
  return result;
}

export const formatCopyCommands = commands => commands.join(';;');

export function route(graph, from, to) {
  const start = resolve(graph, from), goal = resolve(graph, to);
  if (start.status !== 'RESOLVED') return { status: start.status, endpoint: 'from', commands: [], copy_commands: '', movement_count: 0 };
  if (goal.status !== 'RESOLVED') return { status: goal.status, endpoint: 'to', commands: [], copy_commands: '', movement_count: 0 };
  if (start.key === goal.key) return { status: 'MAP_ROUTE', room_keys: [start.key], commands: [], copy_commands: '', movement_count: 0, grouped: [] };
  const next = new Map();
  for (const edge of graph.edges) {
    next.set(edge.from, [...(next.get(edge.from) || []), { to: edge.to, command: edge.command }]);
    next.set(edge.to, [...(next.get(edge.to) || []), { to: edge.from, command: opposite[edge.command] }]);
  }
  const queue = [start.key], previous = new Map([[start.key, null]]);
  for (let i = 0; i < queue.length && !previous.has(goal.key); i += 1) {
    for (const step of next.get(queue[i]) || []) if (!previous.has(step.to)) {
      previous.set(step.to, { from: queue[i], command: step.command }); queue.push(step.to);
    }
  }
  if (!previous.has(goal.key)) return {
    status: 'AMBIGUOUS_OR_UNMAPPED_CONNECTION', commands: [], copy_commands: '', movement_count: 0,
    reason: 'No path composed only of explicit printed orthogonal or slash-diagonal connectors reaches the destination.'
  };
  const roomKeys = [goal.key], commands = [];
  for (let cursor = goal.key; cursor !== start.key;) {
    const step = previous.get(cursor); commands.unshift(step.command); roomKeys.unshift(step.from); cursor = step.from;
  }
  return {
    status: 'MAP_ROUTE', route_basis: 'captured-source-connectors', live_verified: false,
    source_revision: SOURCE_IDENTITY.revision_id, room_keys: roomKeys, commands,
    copy_commands: formatCopyCommands(commands), movement_count: commands.length,
    plus_rooms_visited: roomKeys.filter(key => graph.rooms.get(key)?.glyph === '+').length,
    grouped: grouped(commands),
    note: 'Source-derived map calculation only; not live-play validation or a cross-area route.'
  };
}

