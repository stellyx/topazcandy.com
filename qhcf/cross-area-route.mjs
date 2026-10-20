import { buildAsciiMapGraph, planMapRoute } from './navigation/route-engine.mjs';
import { EAST_GATE, OUTSIDE_EAST_GATE, withEastGateAction } from './gate-commands.mjs';

export const EASTERN_ANCHORS = [
  { id: 'eastern.map.c', name: 'Eastern Road Large Crossroads (C)', area: 'eastern', source_revision: 5027 },
  { id: 'eastern.map.east-one', name: '1 (east end of Eastern Road)', area: 'eastern', source_revision: 5027 }
];
export { EAST_GATE, OUTSIDE_EAST_GATE };
export const OUTSIDE_TO_C_MOVES = 34;
export const UNKNOWN_BOUNDARY = Object.freeze({
  from: OUTSIDE_EAST_GATE, toward_area: 'the-eastern-road',
  reason: 'Beyond the outside East Gate room, intermediate road rooms are not individually verified.',
  map_url: '/qhcf/eastern-road-preview.html?v=bbbdc14'
});
const opposite = { n: 's', s: 'n', e: 'w', w: 'e' };
const isEastern = id => EASTERN_ANCHORS.some(anchor => anchor.id === id);

export function guildThresholds(map) {
  const thresholds = new Map();
  for (const node of map.nodes.filter(node => node.id.startsWith('galadon.map.guild.'))) {
    const exits = map.edges.filter(edge => edge.from === node.id);
    if (exits.length !== 1) continue;
    const edge = exits[0], entry = opposite[edge.direction];
    if (map.edges.some(back => back.from === edge.to && back.to === node.id && back.direction === entry)) {
      thresholds.set(node.id, { outside: edge.to, entry });
    }
  }
  return thresholds;
}

export function planTwoAreaRoute(graph, from, to) {
  const map = buildAsciiMapGraph(graph);
  const nodes = new Map(map.nodes.map(node => [node.id, node]));
  for (const node of EASTERN_ANCHORS) nodes.set(node.id, node);
  if (!nodes.has(from) || !nodes.has(to)) return { status: 'UNKNOWN_ENDPOINT', legs: [], copy_all: null, known_moves: 0 };
  const fromEastern = isEastern(from), toEastern = isEastern(to);
  const thresholds = guildThresholds(map);
  const thresholdFor = id => thresholds.get(id);
  const outside = id => thresholdFor(id)?.outside || id;
  const restricted = id => id.startsWith('galadon.map.guild.') && !thresholdFor(id);
  if ((!fromEastern && restricted(from)) || (!toEastern && restricted(to))) {
    return { status: 'UNRESOLVED_GUILD_THRESHOLD', legs: [], copy_all: null, known_moves: 0,
      reason: 'The outside guild threshold is not uniquely established in the captured map.' };
  }
  const thresholdNote = toEastern || !thresholdFor(to) ? null : {
    guild: to, outside: outside(to), optional_entry: thresholdFor(to).entry
  };
  if (fromEastern && toEastern) return { status: 'UNRESOLVED_EASTERN_SEGMENT', legs: [], copy_all: null, known_moves: 0,
    reason: 'This panel does not calculate Eastern Road rooms. Open its separate map.' };
  if (fromEastern) return { status: 'PARTIAL', legs: [], copy_all: null, known_moves: 0,
    stop: { ...UNKNOWN_BOUNDARY, reverse: true, reason: 'Return crossing and matching Galadon entrance are unverified.' },
    next_map_url: '/qhcf/galadon-preview.html' };
  const target = toEastern ? OUTSIDE_EAST_GATE : outside(to);
  const route = planMapRoute(graph, outside(from), target);
  if (route.status !== 'MAP_ROUTE') return { status: 'UNRESOLVED_MAP_ROUTE', legs: [], copy_all: null, known_moves: 0,
    reason: route.reason || 'No supported Galadon cardinal path reaches this anchor.' };
  const gateCommands = withEastGateAction(route.node_ids, route.commands);
  const legs = route.movement_count ? [{
    area: 'galadon', from: outside(from), to: target, commands: route.commands,
    copy_commands: gateCommands.join(';;'), grouped: route.compressed_commands,
    moves: route.movement_count, node_ids: route.node_ids, evidence: 'captured Galadon map',
    source_revision: route.source_revision, live_verified: false
  }] : [];
  if (to === 'eastern.map.c') {
    const road = Array(OUTSIDE_TO_C_MOVES).fill('e');
    legs.push({area:'eastern-road',from:OUTSIDE_EAST_GATE,to,commands:road,
      copy_commands:road.join(';;'),grouped:`${OUTSIDE_TO_C_MOVES}e`,moves:OUTSIDE_TO_C_MOVES,
      node_ids:[],evidence:'player-reported outside East Gate → Large Crossroads distance',
      source_revision:null,live_verified:false});
    return {status:'REPORTED_ROUTE',legs,known_moves:route.movement_count+OUTSIDE_TO_C_MOVES,
      mapped_moves:route.movement_count,reported_moves:OUTSIDE_TO_C_MOVES,
      copy_all:[...gateCommands,...road].join(';;'),
      note:'Open east is sent at the inside gate even when already open. The 34 east road run is player-reported and its intermediate rooms are not mapped.'};
  }
  if (toEastern) return { status: 'PARTIAL', legs, known_moves: route.movement_count,
    copy_all: null, stop: UNKNOWN_BOUNDARY, next_map_url: UNKNOWN_BOUNDARY.map_url,
    note: 'Known Galadon moves plus unknown crossing and remainder. No end-to-end total.' };
  return { status: 'MAP_ROUTE', legs, known_moves: route.movement_count,
    copy_all: gateCommands.join(';;'), threshold: thresholdNote, live_verified: false,
    note: 'Calculated from captured map revision 5044; live rooms are not verified.' };
}
