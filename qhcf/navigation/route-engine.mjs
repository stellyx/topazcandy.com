const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const MAX_OBSERVATION_AGE_MS = 120000;

export function resolveRoom(graph, name) {
  const query = normalize(name);
  if (!query) return { status: 'UNKNOWN_ENDPOINT', query: name, candidates: [] };
  const direct = graph.nodes.filter(node => node.id === name);
  const matches = direct.length ? direct : graph.nodes.filter(node => [node.name, ...(node.aliases || [])].some(alias => normalize(alias) === query));
  if (matches.length === 0) {
    const suggestions = graph.nodes.filter(node => normalize(node.name).includes(query) || query.includes(normalize(node.name))).slice(0, 5).map(node => ({ id: node.id, name: node.name }));
    return { status: 'UNKNOWN_ENDPOINT', query: name, candidates: suggestions };
  }
  if (matches.length > 1) return { status: 'AMBIGUOUS_ENDPOINT', query: name, candidates: matches.map(node => ({ id: node.id, name: node.name, localization_status: node.localization_status })) };
  const node = matches[0];
  return { status: 'RESOLVED', query: name, node_id: node.id, name: node.name, localization_status: node.localization_status };
}

const validateStartObservation = (graph, resolution, actualObservation) => {
  const node = graph.nodes.find(item => item.id === resolution.node_id);
  const fingerprint = node?.runtime_fingerprint;
  if (!fingerprint) return {
    status: 'UNVERIFIED_NODE',
    reason: `The resolved start ${JSON.stringify(node?.name)} has no verified runtime fingerprint. A title match alone cannot localize a character.`
  };
  const required = ['observation_id', 'observed_at_utc', 'world', 'area', 'room', 'description_fingerprint', 'exits'];
  const missing = required.filter(field => field === 'exits' ? !Array.isArray(actualObservation?.exits) : !actualObservation?.[field]);
  if (missing.length) return {
    status: 'MISSING',
    reason: `Current localization requires a fresh full room fingerprint; missing: ${missing.join(', ')}.`,
    required_fields: required
  };
  const observedAt = Date.parse(actualObservation.observed_at_utc);
  const ageMs = Date.now() - observedAt;
  if (!Number.isFinite(observedAt) || ageMs < -5000 || ageMs > MAX_OBSERVATION_AGE_MS) return {
    status: 'STALE',
    reason: 'The supplied room observation is invalid, from the future, or older than the two-minute execution window.',
    observation_id: actualObservation.observation_id,
    observed_at_utc: actualObservation.observed_at_utc,
    max_age_ms: MAX_OBSERVATION_AGE_MS
  };
  const comparisons = {
    world: normalize(actualObservation.world) === normalize(fingerprint.world),
    area: normalize(actualObservation.area) === normalize(fingerprint.area),
    room: normalize(actualObservation.room) === normalize(fingerprint.room),
    description_fingerprint: String(actualObservation.description_fingerprint) === String(fingerprint.description_fingerprint)
  };
  if (Object.values(comparisons).some(match => !match)) return {
    status: 'MISMATCH',
    reason: `Observed room fingerprint does not match the verified fingerprint for ${JSON.stringify(node?.name)}.`,
    observation_id: actualObservation.observation_id,
    comparisons
  };
  const normalizedExits = [...new Set(actualObservation.exits.map(normalize).filter(Boolean))];
  const missingRequiredExits = (fingerprint.required_exits || []).map(normalize).filter(exit => !normalizedExits.includes(exit));
  if (missingRequiredExits.length) return {
    status: 'MISMATCH',
    reason: `Observed exits are missing verified fingerprint exits: ${missingRequiredExits.join(', ')}.`,
    observation_id: actualObservation.observation_id
  };
  return { status: 'MATCH', observation_id: actualObservation.observation_id, observed_at_utc: actualObservation.observed_at_utc, matched_node_id: node.id, observed_exits: normalizedExits };
};

const edgeHasExecutableEvidence = edge => edge.directed && edge.validation === 'validated' && edge.executable === true
  && Array.isArray(edge.commands) && edge.commands.length > 0
  && Array.isArray(edge.expected_observations) && edge.expected_observations.length === edge.commands.length
  && edge.expected_observations.every((observation, index) => observation?.after_command === edge.commands[index]
    && observation?.room_fingerprint && observation?.provenance);

const localizationFailure = (graph, fromResolution, toResolution, validation) => ({
  schema_version: graph.schema_version,
  graph_id: graph.graph_id,
  graph_version: graph.graph_version,
  status: 'NEEDS_LOCALIZATION',
  from: fromResolution,
  to: toResolution,
  reason: validation.reason,
  observation_validation: validation,
  commands: [],
  compressed_commands: '',
  movement_count: 0,
  plus_cells_crossed: null,
  executable: false,
  execution_policy: 'none'
});

const compress = commands => {
  const result = [];
  for (const command of commands) {
    const prior = result.at(-1);
    if (prior?.command === command) prior.count += 1;
    else result.push({ command, count: 1 });
  }
  return result.map(item => item.count === 1 ? item.command : `${item.count}${item.command}`).join(' ');
};

const directionRuns = commands => {
  const runs = [];
  for (const command of commands) {
    const prior = runs.at(-1);
    if (prior?.direction === command) prior.count += 1;
    else runs.push({ direction: command, count: 1 });
  }
  return runs;
};

export const formatCopyCommands = commands => commands.join(';;');

const mapNodeId = (row, column) => `galadon.map.r${row}c${column}`;

export function buildAsciiMapGraph(graph) {
  const source = graph.map_route;
  if (!source?.lines?.length) throw new Error('graph.map_route.lines is required');
  const nodes = [];
  source.lines.forEach((line, rowIndex) => {
    [...line].forEach((character, columnIndex) => {
      if (character !== '+') return;
      const row = rowIndex + 1, column = columnIndex + 1;
      const id = mapNodeId(row, column);
      const description = source.descriptive_labels?.[id];
      nodes.push({
        id,
        name: description?.label ? `${description.label} (+ r${row}c${column})` : `Unnamed map room (+ r${row}c${column})`,
        short_name: `+ r${row}c${column}`,
        aliases: [`r${row}c${column}`, `${row},${column}`, ...(description?.aliases || [])],
        kind: 'plus-room', row, start_column: column, end_column: column, port_column: column,
        name_kind: description?.name_kind || (description ? 'descriptive-map-position' : 'unnamed-map-position'),
        description_basis: description?.basis || null,
        source_evidence: description?.source_evidence || []
      });
    });
  });
  for (const landmark of source.landmarks || []) {
    nodes.push({
      ...landmark,
      kind: landmark.kind || 'map-landmark',
      end_column: landmark.end_column || landmark.start_column,
      port_column: landmark.port_column || landmark.start_column
    });
  }
  const byId = new Map(nodes.map(node => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error('duplicate ASCII map node id');
  const edges = [];
  const addEdgePair = (left, right, forward, reverse) => {
    edges.push({ from: left.id, to: right.id, direction: forward });
    edges.push({ from: right.id, to: left.id, direction: reverse });
  };
  const byRow = new Map();
  for (const node of nodes) {
    const bucket = byRow.get(node.row) || [];
    bucket.push(node);
    byRow.set(node.row, bucket);
  }
  for (const [row, rowNodes] of byRow) {
    rowNodes.sort((a, b) => a.start_column - b.start_column);
    const line = source.lines[row - 1];
    for (let index = 0; index < rowNodes.length - 1; index += 1) {
      const left = rowNodes[index], right = rowNodes[index + 1];
      const between = line.slice(left.end_column, right.start_column - 1);
      if (/^-+$/.test(between)) addEdgePair(left, right, 'e', 'w');
    }
  }
  const verticalCandidates = new Map();
  for (const node of nodes) {
    const bucket = verticalCandidates.get(node.port_column) || [];
    bucket.push(node);
    verticalCandidates.set(node.port_column, bucket);
  }
  for (const [column, columnNodes] of verticalCandidates) {
    columnNodes.sort((a, b) => a.row - b.row);
    for (let index = 0; index < columnNodes.length - 1; index += 1) {
      const top = columnNodes[index], bottom = columnNodes[index + 1];
      let connected = bottom.row > top.row;
      for (let row = top.row + 1; connected && row < bottom.row; row += 1) {
        connected = source.lines[row - 1]?.[column - 1] === '|';
      }
      if (connected) addEdgePair(top, bottom, 's', 'n');
    }
  }
  return {
    id: source.id,
    title: source.title,
    source_revision: graph.source_map?.revision_id,
    lines: source.lines,
    nodes,
    edges,
    ambiguities: source.ambiguities || []
  };
}

export function resolveMapNode(mapGraph, value) {
  const query = normalize(value);
  const direct = mapGraph.nodes.find(node => node.id === value);
  if (direct) return { status: 'RESOLVED', node: direct };
  const matches = mapGraph.nodes.filter(node => [node.name, node.short_name, ...(node.aliases || [])].some(alias => normalize(alias) === query));
  if (matches.length === 1) return { status: 'RESOLVED', node: matches[0] };
  if (matches.length > 1) return { status: 'AMBIGUOUS_ENDPOINT', candidates: matches.map(node => ({ id: node.id, name: node.name })) };
  return { status: 'UNKNOWN_ENDPOINT', candidates: [] };
}

export function planMapRoute(graph, from, to) {
  const mapGraph = buildAsciiMapGraph(graph);
  const fromResolution = resolveMapNode(mapGraph, from);
  const toResolution = resolveMapNode(mapGraph, to);
  if (fromResolution.status !== 'RESOLVED') return { status: fromResolution.status, endpoint: 'from', resolution: fromResolution, commands: [], movement_count: 0 };
  if (toResolution.status !== 'RESOLVED') return { status: toResolution.status, endpoint: 'to', resolution: toResolution, commands: [], movement_count: 0 };
  const start = fromResolution.node, goal = toResolution.node;
  if (start.id === goal.id) return {
    status: 'MAP_ROUTE', route_basis: 'published-ascii-map', live_verified: false,
    from: { id: start.id, name: start.name }, to: { id: goal.id, name: goal.name },
    node_ids: [start.id], commands: [], direction_runs: [], compressed_commands: '', movement_count: 0,
    copy_commands: '',
    note: 'Start and destination are the same selected map node.'
  };
  const outgoing = new Map();
  for (const edge of mapGraph.edges) {
    const bucket = outgoing.get(edge.from) || [];
    bucket.push(edge);
    outgoing.set(edge.from, bucket);
  }
  const queue = [start.id], previous = new Map([[start.id, null]]), via = new Map();
  while (queue.length && !previous.has(goal.id)) {
    const current = queue.shift();
    for (const edge of outgoing.get(current) || []) {
      if (previous.has(edge.to)) continue;
      previous.set(edge.to, current);
      via.set(edge.to, edge);
      queue.push(edge.to);
    }
  }
  if (!previous.has(goal.id)) return {
    status: 'AMBIGUOUS_OR_UNMAPPED_CONNECTION', route_basis: 'published-ascii-map', live_verified: false,
    from: { id: start.id, name: start.name }, to: { id: goal.id, name: goal.name },
    commands: [], direction_runs: [], compressed_commands: '', movement_count: 0,
    ambiguities: mapGraph.ambiguities,
    reason: 'No cardinal corridor path connects these selected nodes. Diagonal, crossing, and unclear map transitions are not guessed.'
  };
  const nodeIds = [], commands = [];
  for (let cursor = goal.id; cursor; cursor = previous.get(cursor)) {
    nodeIds.push(cursor);
    if (via.has(cursor)) commands.push(via.get(cursor).direction);
  }
  nodeIds.reverse();
  commands.reverse();
  return {
    status: 'MAP_ROUTE',
    route_basis: 'published-ascii-map',
    live_verified: false,
    source_revision: mapGraph.source_revision,
    from: { id: start.id, name: start.name },
    to: { id: goal.id, name: goal.name },
    node_ids: nodeIds,
    commands,
    copy_commands: formatCopyCommands(commands),
    direction_runs: directionRuns(commands),
    compressed_commands: compress(commands),
    movement_count: commands.length,
    steps: commands.map((direction, index) => ({ number: index + 1, direction, from: nodeIds[index], to: nodeIds[index + 1] })),
    executable: false,
    execution_policy: 'directions-only; map calculation does not control the game',
    note: 'Each transition between adjacent selected map rooms or landmarks counts as one movement. This is map-derived and not a live-game verification.'
  };
}

export function planRoute(graph, from, to, { mode = 'tell', actualObservation = null } = {}) {
  if (!['tell', 'take-me'].includes(mode)) return {
    schema_version: graph.schema_version,
    graph_id: graph.graph_id,
    graph_version: graph.graph_version,
    status: 'INVALID_MODE',
    accepted_modes: ['tell', 'take-me'],
    commands: [],
    compressed_commands: '',
    movement_count: 0,
    plus_cells_crossed: null,
    executable: false,
    execution_policy: 'none'
  };
  const fromResolution = resolveRoom(graph, from);
  if (fromResolution.status !== 'RESOLVED') return { schema_version: graph.schema_version, graph_id: graph.graph_id, graph_version: graph.graph_version, status: fromResolution.status === 'AMBIGUOUS_ENDPOINT' ? 'AMBIGUOUS_START' : fromResolution.status, endpoint: 'from', resolution: fromResolution, commands: [], movement_count: 0, plus_cells_crossed: null, executable: false };
  const toResolution = resolveRoom(graph, to);
  if (toResolution.status !== 'RESOLVED') return { schema_version: graph.schema_version, graph_id: graph.graph_id, graph_version: graph.graph_version, status: toResolution.status === 'AMBIGUOUS_ENDPOINT' ? 'AMBIGUOUS_GOAL' : toResolution.status, endpoint: 'to', resolution: toResolution, commands: [], movement_count: 0, plus_cells_crossed: null, executable: false };
  if (fromResolution.node_id === toResolution.node_id) {
    const validation = validateStartObservation(graph, fromResolution, actualObservation);
    if (validation.status !== 'MATCH') return localizationFailure(graph, fromResolution, toResolution, validation);
    return { schema_version: graph.schema_version, graph_id: graph.graph_id, graph_version: graph.graph_version, status: 'ALREADY_THERE', from: fromResolution, to: toResolution, observation_validation: validation, commands: [], compressed_commands: '', movement_count: 0, plus_cells_crossed: 0, edge_count: 0, executable: false, execution_policy: 'none' };
  }

  const edges = graph.edges.filter(edgeHasExecutableEvidence);
  const queue = [{ node: fromResolution.node_id, path: [], cost: 0 }];
  const bestCost = new Map([[fromResolution.node_id, 0]]);
  let found = null;
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.cost !== bestCost.get(current.node)) continue;
    if (current.node === toResolution.node_id) { found = current.path; break; }
    for (const edge of edges.filter(item => item.from === current.node)) {
      const cost = current.cost + edge.commands.length;
      if (cost >= (bestCost.get(edge.to) ?? Infinity)) continue;
      bestCost.set(edge.to, cost);
      queue.push({ node: edge.to, path: [...current.path, edge], cost });
    }
  }

  if (!found) {
    const rule = graph.localization_rules.find(item => item.from === fromResolution.node_id && item.to === toResolution.node_id);
    const conditional = rule?.conditional_trace_id ? graph.conditional_traces.find(item => item.id === rule.conditional_trace_id) : graph.conditional_traces.find(item => item.id === 'galadon.trace.market-square-hypothesis.to-eastern-road' && rule?.to === 'galadon.region.eastern-road');
    const candidateEdge = rule?.candidate_edge_id ? graph.edges.find(item => item.id === rule.candidate_edge_id) : null;
    if (rule) return { schema_version: graph.schema_version, graph_id: graph.graph_id, graph_version: graph.graph_version, status: rule.status, from: fromResolution, to: toResolution, reason: rule.reason, focused_localization_step: rule.focused_step, forbidden_inference: rule.forbidden_inference, conditional_trace_id: conditional?.id || null, candidate_edge_id: candidateEdge?.id || null, candidate_commands: candidateEdge?.candidate_commands || [], candidate_compressed_commands: candidateEdge?.candidate_commands ? compress(candidateEdge.candidate_commands) : '', candidate_movement_count: candidateEdge?.candidate_movement_count ?? null, commands: [], compressed_commands: '', movement_count: 0, plus_cells_crossed: conditional?.plus_cells_crossed ?? null, plus_count_is_not_movement_count: true, executable: false, execution_policy: 'none' };
    return { schema_version: graph.schema_version, graph_id: graph.graph_id, graph_version: graph.graph_version, status: 'NO_ROUTE', from: fromResolution, to: toResolution, reason: 'No directed validated executable edge path exists in this graph version.', commands: [], compressed_commands: '', movement_count: 0, plus_cells_crossed: null, edge_count: 0, executable: false, execution_policy: 'none' };
  }

  const commands = found.flatMap(edge => edge.commands);
  const validation = validateStartObservation(graph, fromResolution, actualObservation);
  if (validation.status !== 'MATCH') return localizationFailure(graph, fromResolution, toResolution, validation);
  const directionalCommands = new Set(['n', 's', 'e', 'w', 'u', 'd', 'ne', 'nw', 'se', 'sw']);
  const firstCommand = normalize(commands[0]);
  if (!directionalCommands.has(firstCommand)) return localizationFailure(graph, fromResolution, toResolution, {
    status: 'UNRESOLVED_SPECIAL_EXIT',
    reason: `The first command ${JSON.stringify(commands[0])} is not a plain observed direction. Doors and special exits require explicit state and handling evidence.`
  });
  if (!validation.observed_exits.includes(firstCommand)) return localizationFailure(graph, fromResolution, toResolution, {
    status: 'CONTRADICTORY_EXITS',
    reason: `The first planned direction ${JSON.stringify(firstCommand)} is absent from the fresh observed exits.`,
    observation_id: validation.observation_id,
    observed_exits: validation.observed_exits
  });
  const allPlusKnown = found.every(edge => Number.isInteger(edge.plus_cells_crossed));
  const plusCells = allPlusKnown ? found.reduce((sum, edge) => sum + edge.plus_cells_crossed, 0) : null;
  const policy = mode === 'tell' ? 'directions_only' : 'announce_then_execute_by_separate_authorized_game_agent';
  return {
    schema_version: graph.schema_version,
    graph_id: graph.graph_id,
    graph_version: graph.graph_version,
    status: 'OK',
    from: fromResolution,
    to: toResolution,
    observation_validation: validation,
    edge_ids: found.map(edge => edge.id),
    edge_count: found.length,
    commands,
    compressed_commands: compress(commands),
    movement_count: commands.length,
    plus_cells_crossed: plusCells,
    plus_count_status: allPlusKnown ? 'known-from-edge-evidence' : 'not-applicable-or-unverified',
    expected_observations: found.flatMap(edge => edge.expected_observations || []),
    source_evidence: found.flatMap(edge => edge.source_evidence || []),
    executable: true,
    execution_policy: policy,
    rescue_task_executes_commands: false,
    stop_conditions: ['stale localization', 'user takeover', 'movement failure', 'unexpected room output', 'unresolved special exit']
  };
}
