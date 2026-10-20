import { anchorCatalog, route, sourceGraph } from './galadonian-settlement-route.mjs';

const from = document.querySelector('#from'), to = document.querySelector('#to');
const buttons = document.querySelector('#anchors'), summary = document.querySelector('#summary');
const commandBox = document.querySelector('#commands'), copyButton = document.querySelector('#copy');
let graph, start = '', destination = '';

function label(key) { return graph.rooms.get(key)?.label || key; }
function addOption(select, anchor) {
  const option = document.createElement('option'); option.value = anchor.key; option.textContent = anchor.label; select.append(option);
}
function choose(key) {
  if (!start || destination) { start = key; destination = ''; } else destination = key;
  render();
}
function render() {
  from.value = start; to.value = destination;
  document.querySelector('#selection').textContent = !start ? 'First anchor click sets Start.' : !destination ? `Start: ${label(start)}. Choose Destination.` : `${label(start)} → ${label(destination)}.`;
  for (const button of buttons.querySelectorAll('button')) {
    button.classList.toggle('start', button.dataset.key === start); button.classList.toggle('goal', button.dataset.key === destination);
    button.setAttribute('aria-pressed', String(button.dataset.key === start || button.dataset.key === destination));
  }
  commandBox.value = ''; copyButton.disabled = true; document.querySelector('#grouped').textContent = '';
  if (!start || !destination) { summary.textContent = 'Choose a start and destination.'; return; }
  const result = route(graph, start, destination);
  if (result.status !== 'MAP_ROUTE') { summary.textContent = `STOP: ${result.reason || result.status}`; return; }
  summary.textContent = `${result.movement_count} source-derived ${result.movement_count === 1 ? 'step' : 'steps'}; ${result.plus_rooms_visited} plus rooms visited; live travel unverified.`;
  document.querySelector('#grouped').textContent = result.grouped.map(run => `${run.count}${run.direction}`).join(' ');
  commandBox.value = result.copy_commands; copyButton.disabled = !result.copy_commands;
}

from.addEventListener('change', () => { start = from.value; render(); });
to.addEventListener('change', () => { destination = to.value; render(); });
document.querySelector('#flip').addEventListener('click', () => { [start, destination] = [destination, start]; render(); });
copyButton.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  commandBox.focus();
  commandBox.select();
  try {
    if (document.execCommand('copy')) {
      status.textContent = 'Copied to clipboard.';
      return;
    }
  } catch {}
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await Promise.race([
      navigator.clipboard.writeText(commandBox.value),
      new Promise((_, reject) => setTimeout(() => reject(new Error('clipboard timeout')), 1200)),
    ]);
    status.textContent = 'Copied to clipboard.';
  } catch {
    status.textContent = 'Clipboard unavailable - commands are selected. Press Ctrl+C or use your device copy action.';
  }
});

const response = await fetch('/warp/maps/archive/cf/data/areas/galadonian-settlement.json');
if (!response.ok) throw new Error('Galadonian Settlement source JSON unavailable');
const data = await response.json(); graph = sourceGraph(data); const anchors = anchorCatalog(graph);
for (const anchor of anchors) {
  addOption(from, anchor); addOption(to, anchor);
  const button = document.createElement('button'); button.type = 'button'; button.className = 'anchor'; button.dataset.key = anchor.key; button.textContent = anchor.glyph; button.title = anchor.label; button.setAttribute('aria-pressed', 'false'); button.addEventListener('click', () => choose(anchor.key)); buttons.append(button);
}
start = anchors[0]?.key || ''; destination = anchors.at(-1)?.key || '';
document.querySelector('#map').textContent = data.lines.slice(9, 40).join('\n'); render();

