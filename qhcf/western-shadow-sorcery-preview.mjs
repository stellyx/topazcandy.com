const base='/qhcf/';
const $=id=>document.getElementById(id);
const [ledger,grove,tower]=await Promise.all([
  fetch(base+'data/western-shadow-sorcery-inventory.json').then(r=>{if(!r.ok)throw Error('Inventory unavailable');return r.json()}),
  fetch(base+'data/areas/the-shadow-grove.json').then(r=>{if(!r.ok)throw Error('Grove source unavailable');return r.json()}),
  fetch(base+'data/areas/the-tower-of-sorcery.json').then(r=>{if(!r.ok)throw Error('Tower source unavailable');return r.json()})
]);
const areas={grove,tower};let active='grove',size=15;
export const fragmentFor=entry=>`source-${entry.area}-L${entry.source_lines[0]}`;
export const filteredEntries=(entries,area,term='')=>entries.filter(x=>x.area===area&&x.source_text.toLocaleLowerCase().includes(term.toLocaleLowerCase()));
function areaFromHash(){const match=location.hash.match(/^#source-(grove|tower)-L(\d+)$/);return match?.[1]||null}
function focusLine(line){const pre=$('chart-text');const style=getComputedStyle(pre);$('chart-scroll').scrollTop=(line-1)*(parseFloat(style.lineHeight)||22.5);$('chart-scroll').focus()}
function showHash(){const match=location.hash.match(/^#source-(grove|tower)-L(\d+)$/);if(!match)return;if(active!==match[1]){active=match[1];render()}requestAnimationFrame(()=>focusLine(Number(match[2])))}
function link(href,label){const a=document.createElement('a');a.href=href;a.textContent=label;return a}
function render(){
  document.querySelectorAll('[data-area]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.area===active)));
  const western=active==='western', area=areas[active];
  $('area-title').textContent=western?'Western Road · source missing':active==='grove'?'The Shadow Grove':'High Tower of Sorcery';
  $('chart-status').textContent=western?'No captured map or line-counted route exists in this collection.':`Revision ${area.source.revision_id} · ${area.source.last_modified_display}`;
  const pre=$('chart-text');pre.replaceChildren();
  if(western)pre.textContent='Western Road is not a titled area in maps.json or reference.txt.\nNo topology, room names, quests, items, or route counts are asserted.';
  else area.lines.forEach((line,index)=>{if(index)pre.append('\n');const row=document.createElement('span');row.id=`source-${active}-L${index+1}`;row.textContent=line;pre.append(row)});
  $('chart-scroll').scrollTo(0,0);
  $('sources').replaceChildren();
  if(!western){const meta=ledger.areas[active];$('sources').append(link(meta.original,'Captured HTML map'),link(meta.text,'Text reference'),link(meta.json,'Source JSON'),link(meta.source.permalink,'Wiki revision '+meta.source.revision_id))}
  $('chart-hint').hidden=western;
  renderNotes();
  $('related').replaceChildren();
  if(!western)ledger.related_maps.filter(x=>x.from===active).forEach(x=>{const a=link(x.href,x.label+' ↗');a.title=x.status;$('related').append(a)})
}
function renderNotes(){
  const term=$('note-search').value.toLocaleLowerCase();
  const entries=filteredEntries(ledger.entries,active,term);
  $('notes').replaceChildren();
  $('result-count').textContent=active==='western'?'No captured notes.':`${entries.length} source note${entries.length===1?'':'s'}${term?' matching search':''}`;
  entries.forEach(entry=>{
    const item=document.createElement('article');item.className='note';
    const title=document.createElement('strong');title.textContent=entry.label||entry.source_text.split('\n')[0];
    const meta=document.createElement('small');meta.textContent=`${entry.kind==='items'?'Item / stock mention':entry.kind==='named-map-label'?'Named map label':'Place / map note'} · source line${entry.source_lines[1]>entry.source_lines[0]?'s':''} ${entry.source_lines.join('–')}`;
    const actions=document.createElement('div');actions.className='note-actions';
    const source=link(`${base}western-shadow-sorcery-preview.html#${fragmentFor(entry)}`,'Source line ↗');
    source.addEventListener('click',()=>{if(location.hash==='#'+fragmentFor(entry))showHash()});actions.append(source);
    if(entry.area_link){const destination=link(entry.area_link,`Open ${entry.label||entry.source_text.split(' - ')[1]?.trim()||'area'} map ↗`);destination.title=entry.link_status||'Matching entrance unverified';actions.append(destination)}
    const focus=document.createElement('button');focus.type='button';focus.textContent='Focus chart';focus.addEventListener('click',()=>focusLine(entry.source_lines[0]));actions.append(focus);
    item.append(title,meta,actions);
    if(entry.link_status){const status=document.createElement('small');status.textContent=entry.link_status;item.append(status)}
    $('notes').append(item)
  })
}
document.querySelectorAll('[data-area]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.area;render()}));$('note-search').addEventListener('input',renderNotes);window.addEventListener('hashchange',showHash);
$('smaller').addEventListener('click',()=>{size=Math.max(10,size-2);$('chart-text').style.setProperty('--chart-size',size+'px')});$('normal').addEventListener('click',()=>{size=15;$('chart-text').style.setProperty('--chart-size',size+'px')});$('larger').addEventListener('click',()=>{size=Math.min(28,size+2);$('chart-text').style.setProperty('--chart-size',size+'px')});active=areaFromHash()||active;render();if(areaFromHash())showHash();
