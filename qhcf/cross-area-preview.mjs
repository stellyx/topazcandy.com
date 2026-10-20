import { buildAsciiMapGraph } from './navigation/route-engine.mjs';
import { EASTERN_ANCHORS, guildThresholds, planTwoAreaRoute } from './cross-area-route.mjs';

const fromField = document.querySelector('#from'), toField = document.querySelector('#to');
const buttons = [...document.querySelectorAll('[data-anchor]')];
let graph, names = new Map(), start = '', destination = '';

function label(id) { return names.get(id) || id; }
function addChoice(field, group, node) {
  const option = document.createElement('option');
  option.value = node.id; option.textContent = node.name;
  group.append(option);
}
function populate() {
  const map = buildAsciiMapGraph(graph);
  const named = map.nodes.filter(node => node.kind !== 'plus-room' && node.kind !== 'linked-area');
  const crossroads = map.nodes.find(node => node.id === 'galadon.map.r51c36');
  const galadon = [...named.filter(node => node.id === 'galadon.map.marker.m' || node.id === 'galadon.map.gate.east' || node.id.startsWith('galadon.map.guild.')), crossroads];
  names = new Map([...map.nodes, ...EASTERN_ANCHORS].map(node => [node.id, node.name]));
  names.set('galadon.map.r51c36', 'Large Crossroads');
  for (const [guildId, threshold] of guildThresholds(map)) {
    const guild = names.get(guildId)?.replace(/ \([^)]*\)$/, '') || 'Guild';
    names.set(threshold.outside, `Outside ${guild}`);
  }
  for (const field of [fromField, toField]) {
    const city = document.createElement('optgroup'); city.label = 'Galadon';
    const road = document.createElement('optgroup'); road.label = 'Eastern Road (entrance unknown)';
    for (const node of galadon) addChoice(field, city, node);
    for (const node of EASTERN_ANCHORS) addChoice(field, road, node);
    field.append(city, road);
  }
}
async function copy(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    document.querySelector('#copy-status').textContent = `${button} clipboard write reported success. Paste to confirm on your device.`;
  } catch {
    document.querySelector('#copy-status').textContent = 'Clipboard unavailable. Select the command text and use your device’s Copy action.';
  }
}
function render() {
  fromField.value = start; toField.value = destination;
  document.querySelector('#flip').disabled = !(start && destination);
  for (const button of buttons) {
    button.classList.toggle('start', button.dataset.anchor === start);
    button.classList.toggle('goal', button.dataset.anchor === destination);
    button.setAttribute('aria-pressed', button.dataset.anchor === start || button.dataset.anchor === destination ? 'true' : 'false');
  }
  const summary = document.querySelector('#summary'), legs = document.querySelector('#legs');
  const stop = document.querySelector('#stop'), threshold = document.querySelector('#threshold');
  const all = document.querySelector('#all-commands'), copyAll = document.querySelector('#copy-all');
  legs.replaceChildren(); stop.replaceChildren(); stop.hidden = true; threshold.hidden = true;
  all.value = ''; copyAll.disabled = true; document.querySelector('#copy-status').textContent = '';
  document.querySelector('#selection').textContent = !start ? 'First click sets Start.' : !destination ? `Start: ${label(start)}. Choose Destination.` : `${label(start)} → ${label(destination)}. Another click starts a new pair.`;
  if (!graph || !start || !destination) { summary.textContent = 'Choose a start and destination.'; return; }
  const result = planTwoAreaRoute(graph, start, destination);
  summary.textContent = result.status === 'PARTIAL' ? `${result.known_moves} known Galadon ${result.known_moves === 1 ? 'move' : 'moves'} + unknown crossing/remainder · no end-to-end total` : result.status === 'MAP_ROUTE' ? `${result.known_moves} map-derived ${result.known_moves === 1 ? 'move' : 'moves'} · live travel unverified` : result.reason || 'No supported route calculated.';
  for (const leg of result.legs) {
    const section = document.createElement('section'); section.className = 'leg';
    const title = document.createElement('strong'); title.textContent = `${label(leg.from)} → ${label(leg.to)} · ${leg.moves} ${leg.moves === 1 ? 'move' : 'moves'} · ${leg.grouped}`;
    const evidence = document.createElement('p'); evidence.textContent = `Captured Galadon map, revision ${leg.source_revision}. Not live verified.`;
    const code = document.createElement('code'); code.textContent = leg.copy_commands;
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Copy this leg'; button.addEventListener('click', () => copy(leg.copy_commands, 'Leg'));
    section.append(title, evidence, code, button); legs.append(section);
  }
  if (result.stop) {
    stop.hidden = false;
    const heading = document.createElement('strong'); heading.textContent = 'STOP · ' + result.stop.reason;
    const detail = document.createElement('p'); detail.textContent = 'No further commands are included. The other area can be opened for manual orientation.';
    const link = document.createElement('a'); link.href = result.next_map_url; link.textContent = result.stop.reverse ? 'Open Galadon interactive map →' : 'Open Eastern Road interactive preview →';
    stop.append(heading, detail, link);
  }
  if (result.threshold) {
    threshold.hidden = false;
    threshold.textContent = `Stop outside ${label(result.threshold.guild)}. Optional entry ${result.threshold.optional_entry} is separate and is excluded from commands and move count.`;
  }
  if (result.status === 'MAP_ROUTE' && result.copy_all) {
    all.value = result.copy_all; copyAll.disabled = false;
  }
}

fromField.addEventListener('change', () => { start = fromField.value; render(); });
toField.addEventListener('change', () => { destination = toField.value; render(); });
document.querySelector('#flip').addEventListener('click', () => { [start, destination] = [destination, start]; render(); });
document.querySelector('#copy-all').addEventListener('click', () => { if (!document.querySelector('#copy-all').disabled) copy(document.querySelector('#all-commands').value, 'Complete route'); });
for (const button of buttons) button.addEventListener('click', () => {
  if (!start || destination) { start = button.dataset.anchor; destination = ''; }
  else destination = button.dataset.anchor;
  render();
});
try {
  const response = await fetch('/qhcf/navigation/galadon-v1.json');
  if (!response.ok) throw new Error('Galadon graph unavailable');
  graph = await response.json(); populate(); render();
} catch (error) {
  document.querySelector('#summary').textContent = `Route data unavailable: ${error.message}.`;
}
