const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

const [inventory, graph, csvText] = await Promise.all([
  fetch('/qhcf/data/academy-source-inventory.json').then(r => r.json()),
  fetch('/qhcf/data/navigation/academy-graph.json').then(r => r.json()),
  fetch('/qhcf/data/references/temple-coverage-matrix.csv').then(r => r.text())
]);
const rows = parseCsv(csvText);
const summary = document.querySelector('#summary');
summary.innerHTML = [
  ['Standalone Academy capture', inventory.standaloneAcademyCapture.present ? 'present' : 'missing'],
  ['Preserved Academy anchors', inventory.academyApproachCharts.length],
  ['Hometown coverage rows', rows.length],
  ['Executable seam routes', graph.seams.filter(s => s.routeEligible).length]
].map(([label, value]) => `<div class="card"><strong>${esc(value)}</strong>${esc(label)}</div>`).join('');

document.querySelector('#coverage').innerHTML = rows.map(row => {
  const map = row.atlas_slug ? `<a href="/qhcf/areas/${encodeURIComponent(row.atlas_slug)}.html">${esc(row.source_label || row.atlas_slug)}</a>` : esc(row.source_label || '—');
  return `<tr>
    <td>${esc(row.hometown)}</td><td>${map}</td><td>${esc(row.academy_evidence)}</td>
    <td class="${row.user_report_down === 'yes' ? 'yes' : 'no'}">${esc(row.user_report_down)}</td>
    <td class="${row.live_verified === 'yes' ? 'yes' : 'no'}">${esc(row.live_verified)}</td>
    <td>${esc(row.destination_room)}</td><td>${esc(row.return_to_origin)}</td>
    <td class="${row.route_advertised === 'yes' ? 'yes' : 'no'}">${esc(row.route_advertised)}</td>
    <td>${esc(row.notes)}</td>
  </tr>`;
}).join('');
