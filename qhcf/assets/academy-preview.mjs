const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
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
  const headers = rows.shift() ?? [];
  return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

const local = new URLSearchParams(location.search).get('local') === '1';
const paths = local ? {
  inventory: '../academy-temple-seams/academy-source-inventory.json',
  graph: '../academy-temple-seams/academy-graph.json',
  csv: '../academy-temple-seams/temple-coverage-matrix.csv'
} : {
  inventory: '/qhcf/data/academy-source-inventory.json',
  graph: '/qhcf/data/navigation/academy-graph.json',
  csv: '/qhcf/data/references/temple-coverage-matrix.csv'
};

const [inventory, graph, csvText] = await Promise.all([
  fetch(paths.inventory).then(r => { if (!r.ok) throw new Error('inventory'); return r.json(); }),
  fetch(paths.graph).then(r => { if (!r.ok) throw new Error('graph'); return r.json(); }),
  fetch(paths.csv).then(r => { if (!r.ok) throw new Error('coverage'); return r.text(); })
]);
const rows = parseCsv(csvText);

document.querySelector('#summary').innerHTML = [
  ['Standalone map', inventory.standaloneAcademyCapture.present ? 'present' : 'missing'],
  ['Preserved labels', inventory.academyApproachCharts.length],
  ['Hometowns covered', rows.length],
  ['Executable routes', graph.seams.filter(s => s.routeEligible).length]
].map(([label, value]) => `<div class="stat"><strong>${esc(value)}</strong>${esc(label)}</div>`).join('');

const sourceLink = row => row.atlas_slug
  ? `<a class="source-link" href="/qhcf/areas/${encodeURIComponent(row.atlas_slug)}.html">${esc(row.source_label || row.atlas_slug)}</a>`
  : esc(row.source_label || 'No preserved chart');
const state = {filter: 'all', query: ''};
const matches = row => {
  const haystack = Object.values(row).join(' ').toLowerCase();
  const queryMatch = !state.query || haystack.includes(state.query);
  const filterMatch = state.filter === 'all'
    || (state.filter === 'source' && /source label|rev \d+|academy/i.test(`${row.academy_evidence} ${row.source_label}`))
    || (state.filter === 'official' && /official help/i.test(`${row.academy_evidence} ${row.notes}`))
    || (state.filter === 'unresolved' && /unknown|unresolved|none|absent/i.test(`${row.origin_identity} ${row.destination_room} ${row.return_to_origin} ${row.notes}`));
  return queryMatch && filterMatch;
};

function render() {
  const visible = rows.filter(matches);
  document.querySelector('#result-count').textContent = `${visible.length} of ${rows.length} hometown coverage records shown`;
  document.querySelector('#empty').hidden = visible.length !== 0;
  document.querySelector('#coverage-table').innerHTML = visible.map(row => `<tr>
    <td><strong>${esc(row.hometown)}</strong></td><td>${sourceLink(row)}</td><td>${esc(row.academy_evidence)}</td>
    <td class="yes">${row.user_report_down === 'yes' ? 'DOWN (user report)' : esc(row.user_report_down)}</td>
    <td class="no">${row.live_verified === 'yes' ? 'live verified' : 'not live verified'}</td>
    <td>${esc(row.destination_room)} / ${esc(row.return_to_origin)}</td><td>${esc(row.notes || '—')}</td></tr>`).join('');
  document.querySelector('#coverage-cards').innerHTML = visible.map(row => `<article class="coverage-card">
    <h2>${esc(row.hometown)}</h2><dl><dt>Source chart</dt><dd>${sourceLink(row)}</dd><dt>Evidence</dt><dd>${esc(row.academy_evidence)}</dd>
    <dt>Reported</dt><dd class="yes">${row.user_report_down === 'yes' ? 'DOWN (user report)' : esc(row.user_report_down)}</dd>
    <dt>Verified</dt><dd class="no">${row.live_verified === 'yes' ? 'Live verified' : 'Not live verified'}</dd>
    <dt>Destination</dt><dd>${esc(row.destination_room)}</dd><dt>Return</dt><dd>${esc(row.return_to_origin)}</dd>
    <dt>Notes</dt><dd>${esc(row.notes || '—')}</dd></dl></article>`).join('');
}

document.querySelector('#coverage-search').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); render(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  render();
}));

document.querySelector('#anchor-grid').innerHTML = inventory.academyApproachCharts.map(anchor => {
  const source = anchor.sourceChart; const href = `/qhcf/areas/${encodeURIComponent(source.slug)}.html`;
  return `<a class="anchor-card" href="${href}"><strong>${esc(source.title)}</strong><span>Revision ${esc(source.revision)} · row ${esc(source.row)} · column ${esc(source.column)}</span><code>${esc(source.literal)}</code></a>`;
}).join('');
render();

if (new URLSearchParams(location.search).get('probe') === '1') {
  const rects = selector => [...document.querySelectorAll(selector)].map(el => Math.round(el.getBoundingClientRect().height));
  const probe = {
    viewport: {width: innerWidth, height: innerHeight},
    document: {clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth},
    display: {
      desktopTable: getComputedStyle(document.querySelector('.desktop-table')).display,
      mobileList: getComputedStyle(document.querySelector('.mobile-list')).display
    },
    targets: {
      navLinks: rects('.nav a'), filterButtons: rects('.filters button'), sourceLinks: rects('.mobile-list .source-link')
    },
    typography: {body: getComputedStyle(document.body).fontSize, heading: getComputedStyle(document.querySelector('h1')).fontSize},
    counts: {rows: document.querySelectorAll('#coverage-table tr').length, cards: document.querySelectorAll('.coverage-card').length, anchors: document.querySelectorAll('.anchor-card').length}
  };
  const output = document.createElement('pre'); output.id = 'render-probe'; output.hidden = true; output.textContent = JSON.stringify(probe); document.body.append(output);
}
