import { BOUNDARY_STUBS, inspectPath, sourceGraph } from './outskirts-route.mjs';

const from = document.querySelector('#from'), to = document.querySelector('#to');
const summary = document.querySelector('#summary'), commands = document.querySelector('#commands');
let graph;

function optionFor(node) {
  const option = document.createElement('option');
  option.value = node.key; option.textContent = `${node.glyph} - source r${node.row}c${node.column}`;
  return option;
}

function render() {
  const result = inspectPath(graph, from.value, to.value);
  commands.value = result.copy_commands;
  document.querySelector('#copy').disabled = !result.copy_commands;
  summary.textContent = result.status === 'UNVERIFIED_DIRECTION_SEMANTICS'
    ? `${result.node_keys.length} connected source glyphs: ${result.source_glyphs.join(' → ')}. STOP: ${result.reason}`
    : result.status === 'SAME_SOURCE_NODE' ? 'Start and destination are the same preserved source node.'
      : `STOP: ${result.status.replaceAll('_', ' ').toLowerCase()}. No commands are available.`;
}

document.querySelector('#inspect').addEventListener('click', render);
document.querySelector('#flip').addEventListener('click', () => { [from.value, to.value] = [to.value, from.value]; render(); });
document.querySelector('#copy').addEventListener('click', async () => {
  if (!commands.value) return;
  await navigator.clipboard.writeText(commands.value);
});

const response = await fetch('/warp/maps/archive/cf/data/areas/outskirts-of-galadon.json');
if (!response.ok) throw new Error('Outskirts source JSON unavailable');
const data = await response.json(); graph = sourceGraph(data);
for (const node of graph.nodes.values()) { from.append(optionFor(node)); to.append(optionFor(node)); }
to.selectedIndex = Math.max(0, to.options.length - 1);
document.querySelector('#map').textContent = data.lines.slice(9, 52).join('\n');
const stubList = document.createElement('ul');
for (const stub of BOUNDARY_STUBS) {
  const item = document.createElement('li');
  item.textContent = `${stub.label}: source direction ${stub.direction}; crossing and matching entrance unverified.`;
  stubList.append(item);
}
document.querySelector('#stubs').append(stubList); render();

