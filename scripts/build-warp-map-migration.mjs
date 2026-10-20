import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const qhcf=path.join(root,'qhcf');
const warp=path.join(root,'warp','maps');
const archive=path.join(warp,'archive','cf');
const sourceRoot=process.env.WARP_SEALED_EXPORT_ROOT;
if(!sourceRoot)throw Error('Set WARP_SEALED_EXPORT_ROOT to the reviewed sealed-export generated directory');
const sourceTopology=path.join(sourceRoot,'topology-v3.json');
const sourceStatus=path.join(sourceRoot,'v4.1.4-complete-content-final-status.json');
const sourceDirections=path.join(sourceRoot,'v4.1.4-directions-compatibility-analysis.json');
const expectedTopologyHash='0B1A909AF1190F33FD61E0822BE6A57E9ACEC3178E43C3A16A93AD81D5095C53';

const sha256=value=>crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
const write=(target,value)=>{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value)};
const writeBootstrap=(target,value)=>{
 if(fs.existsSync(target))return false;
 write(target,value);
 return true;
};
const readJson=target=>JSON.parse(fs.readFileSync(target,'utf8'));

const topology=readJson(sourceTopology);
const status=readJson(sourceStatus);
const directions=readJson(sourceDirections);
if(topology.topology_contract_sha256!==expectedTopologyHash)throw Error('Unexpected WARP topology contract');
if(topology.rooms.length!==204)throw Error('Expected 204 WARP public-town rooms');
const edgeCount=topology.rooms.reduce((sum,room)=>sum+Object.keys(room.exits||{}).length,0);
if(edgeCount!==440)throw Error('Expected 440 directed WARP public-town exits');
if(status.status!=='SEALED_OFFLINE_CONTENT_CANDIDATE_AWAITING_DIRECTION_CONFIG_AND_INTEGRATOR_ACCEPTANCE')throw Error('Candidate status changed');

const publicTown={
 schema_version:'1.0.0',
 dataset_id:'warp.public-town.galadon-candidate.v1',
 status:status.status,
 live_gameplay_verified:false,
 executable_routes:false,
 generated_at_utc:'2026-10-20T00:00:00Z',
 source:{
  map_title:'Galadon',
  original_wiki_permalink:'http://wiki.qhcf.net/index.php?title=Galadon&oldid=5044',
  preserved_source_record:'/warp/maps/archive/cf/areas/galadon.html',
  preserved_route_graph:'/warp/maps/archive/cf/navigation/galadon-v1.json',
  revision_id:5044,
  captured_on:'2026-10-19',
  attribution:'Historical map authors and QHCF / DIKU-WIKI contributors; original notices and credits are retained in the archive.'
 },
 contract:{
  topology_sha256:expectedTopologyHash,
  room_count:204,
  directed_internal_exit_count:440,
  components:[196,8],
  direction_configuration:'Decision pending. The authentic reciprocal southwest/northeast pair requires DIRECTIONS=11; no cardinal substitute is asserted.',
  source_authentic_diagonal:['WarpGaladonSeed#39 southwest -> WarpGaladonSeed#62','WarpGaladonSeed#62 northeast -> WarpGaladonSeed#39']
 },
 rooms:topology.rooms.map(room=>({
  id:room.room_id,
  source_node_id:room.source_node_id,
  source_kind:room.source_kind,
  position:{x:room.position.x,y:room.position.y,z:room.position.z},
  exits:{...room.exits},
  source_label_for_reference_only:room.source_label_for_reference_only??null
 }))
};
write(path.join(warp,'public-town.json'),JSON.stringify(publicTown,null,2)+'\n');

const css=`:root{color-scheme:dark;--bg:#071113;--panel:#102024;--ink:#edf7f3;--muted:#a9bfba;--line:#31565a;--cyan:#69e4c5;--gold:#f1c66a;--warn:#ff9e7d}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 15% 0,#17383b,#071113 46rem);color:var(--ink);font:16px/1.5 system-ui,sans-serif}a{color:var(--cyan)}header{padding:1rem max(1rem,calc((100% - 88rem)/2));display:flex;align-items:center;gap:1rem;flex-wrap:wrap;border-bottom:1px solid var(--line);background:#09171ae8;position:sticky;top:0;z-index:5}header strong{margin-right:auto}nav{display:flex;gap:.8rem;flex-wrap:wrap}main{max-width:88rem;margin:auto;padding:1rem}.hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(18rem,.8fr);gap:1rem;align-items:start}.panel{background:#102024;border:1px solid var(--line);border-radius:.8rem;padding:1rem}.eyebrow{color:var(--gold);font-weight:800;letter-spacing:.09em;text-transform:uppercase}.notice{border-left:.35rem solid var(--warn);background:#2a1b18;padding:.8rem 1rem}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}.fact{background:#0a171a;border:1px solid var(--line);border-radius:.55rem;padding:.7rem}.fact strong{display:block;font-size:1.35rem;color:var(--gold)}label{display:block;font-weight:700;margin:.8rem 0 .3rem}input{width:100%;min-height:44px;padding:.65rem;border-radius:.5rem;border:1px solid var(--line);background:#081719;color:var(--ink);font:inherit}.map-shell{margin-top:1rem;display:grid;grid-template-columns:minmax(15rem,22rem) minmax(0,1fr);gap:1rem}.map-shell>*{min-width:0}.map-scroll{overflow:auto;min-height:30rem;max-height:70vh;background:#050d0f;border:1px solid var(--line);border-radius:.7rem}.map-scroll svg{display:block;min-width:850px;width:100%;height:auto}.edge{stroke:#3f6769;stroke-width:1.25}.edge.diagonal{stroke:var(--warn);stroke-dasharray:4 3}.room{fill:#80dcca;stroke:#071113;stroke-width:1}.room.labelled{fill:var(--gold)}.room.match{fill:#ff7965;stroke:white;stroke-width:2.5}.legend{display:flex;gap:1rem;flex-wrap:wrap;color:var(--muted);font-size:.9rem}.swatch{display:inline-block;width:.75rem;height:.75rem;border-radius:50%;background:#80dcca;margin-right:.3rem}.swatch.labelled{background:var(--gold)}.swatch.match{background:#ff7965}.muted{color:var(--muted)}code{overflow-wrap:anywhere}footer{max-width:88rem;margin:2rem auto 0;padding:1rem;border-top:1px solid var(--line);color:var(--muted)}@media(max-width:760px){.hero,.map-shell{grid-template-columns:1fr}.facts{grid-template-columns:1fr}.map-scroll{min-height:24rem}header{position:static}main{padding:.7rem}}`;
writeBootstrap(path.join(warp,'maps.css'),css+'\n');

const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WARP Maps</title><link rel="canonical" href="https://topazcandy.com/warp/maps/"><link rel="stylesheet" href="/warp/maps/maps.css"></head>
<body><header><strong><a href="/warp/maps/">WARP Maps</a></strong><nav><a href="/warp/maps/" aria-current="page">Current candidate</a><a href="/warp/maps/archive/cf/">Historical CF archive</a><a href="/qhcf/references/ranking-items.html">QHCF ranking &amp; items</a></nav></header>
<main><section class="hero"><div><p class="eyebrow">WARP public-town map</p><h1>Galadon structural candidate</h1><p>This is a sealed offline candidate assembled from the preserved public town chart. It is available for inspection, not presented as the currently deployed game map.</p><p class="notice"><strong>No executable directions.</strong> The source-authentic diagonal pair still requires an explicit engine direction configuration decision and integration acceptance. This page does not calculate, copy, or execute routes.</p></div><aside class="panel"><div class="facts"><div class="fact"><strong id="rooms">204</strong>public-town rooms</div><div class="fact"><strong id="exits">440</strong>directed source exits</div><div class="fact"><strong>196 + 8</strong>source components</div><div class="fact"><strong>offline</strong>candidate status</div></div></aside></section>
<section class="map-shell"><aside class="panel"><h2>Inspect the candidate</h2><label for="search">Find a room ID or source label</label><input id="search" type="search" placeholder="Market Square or #105" autocomplete="off"><p id="result" class="muted" aria-live="polite">Loading public-town structure.</p><h3>Evidence boundary</h3><p class="muted">Coordinates and exits preserve the sealed source contract. Historical labels are reference evidence, not a claim that current WARP room descriptions or travel commands match.</p><p><a href="public-town.json">Download the public-town JSON</a></p><p><a href="/warp/maps/archive/cf/areas/galadon.html">Open the preserved historical source map</a></p></aside><section class="panel"><div class="map-scroll" tabindex="0" aria-label="Scrollable structural candidate map"><svg id="map" role="img" aria-label="WARP Galadon offline structural candidate"></svg></div><p class="legend"><span><i class="swatch"></i> public-town node</span><span><i class="swatch labelled"></i> source-labelled node</span><span><i class="swatch match"></i> search match</span></p></section></section></main>
<footer>Source credit: historical map authors and QHCF / DIKU-WIKI contributors. <a href="http://wiki.qhcf.net/index.php?title=Galadon&amp;oldid=5044">Original revision 5044</a> and its notices are retained; the <a href="/warp/maps/archive/cf/">historical archive</a> preserves source context. WARP-specific status is stated separately and does not change the source license or attribution.</footer><script type="module" src="/warp/maps/map.mjs"></script></body></html>`;
writeBootstrap(path.join(warp,'index.html'),html+'\n');

const module=`const svg=document.querySelector('#map'),search=document.querySelector('#search'),result=document.querySelector('#result');
const ns='http://www.w3.org/2000/svg';
const data=await fetch('/warp/maps/public-town.json').then(r=>{if(!r.ok)throw Error('Candidate data unavailable');return r.json()});
document.querySelector('#rooms').textContent=data.contract.room_count;document.querySelector('#exits').textContent=data.contract.directed_internal_exit_count;
const byId=new Map(data.rooms.map(room=>[room.id,room]));
const xs=data.rooms.map(r=>r.position.x),ys=data.rooms.map(r=>r.position.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=18,pad=28;
const point=room=>({x:(room.position.x-minX)*scale+pad,y:(room.position.y-minY)*scale+pad});
svg.setAttribute('viewBox',\`0 0 \${(maxX-minX)*scale+pad*2} \${(maxY-minY)*scale+pad*2}\`);
const edgeLayer=document.createElementNS(ns,'g'),roomLayer=document.createElementNS(ns,'g');svg.append(edgeLayer,roomLayer);
for(const room of data.rooms)for(const [direction,targetId] of Object.entries(room.exits)){const target=byId.get(targetId);if(!target)continue;const a=point(room),b=point(target),line=document.createElementNS(ns,'line');line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);line.classList.add('edge');if(direction.includes('east')||direction.includes('west'))line.classList.add('diagonal');edgeLayer.append(line)}
const circles=[];for(const room of data.rooms){const p=point(room),circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r',4);circle.classList.add('room');if(room.source_label_for_reference_only)circle.classList.add('labelled');circle.dataset.id=room.id;const title=document.createElementNS(ns,'title');title.textContent=room.source_label_for_reference_only?\`\${room.id}: \${room.source_label_for_reference_only}\`:room.id;circle.append(title);roomLayer.append(circle);circles.push({circle,room})}
function renderSearch(){const q=search.value.trim().toLowerCase();let count=0,first=null;for(const entry of circles){const hay=\`\${entry.room.id} \${entry.room.source_node_id} \${entry.room.source_label_for_reference_only||''}\`.toLowerCase(),match=q&&hay.includes(q);entry.circle.classList.toggle('match',Boolean(match));if(match){count++;first??=entry.room}}if(!q)result.textContent='204 source nodes shown. Search highlights matching evidence.';else if(!count)result.textContent='No source node matches that text.';else result.textContent=\`\${count} match\${count===1?'':'es'}; first: \${first.id}\${first.source_label_for_reference_only?' — '+first.source_label_for_reference_only:''}.\`}
search.addEventListener('input',renderSearch);renderSearch();`;
writeBootstrap(path.join(warp,'map.mjs'),module+'\n');

const skipRoot=new Set(['references','academy-temple-coverage.html']);
function copyArchiveDirectory(sourceDir,targetDir,relative=''){
 for(const entry of fs.readdirSync(sourceDir,{withFileTypes:true})){
  if(!relative&&skipRoot.has(entry.name))continue;
  const source=path.join(sourceDir,entry.name),rel=path.join(relative,entry.name),target=path.join(targetDir,entry.name);
  if(entry.isDirectory()){fs.mkdirSync(target,{recursive:true});copyArchiveDirectory(source,target,rel);continue}
  const buffer=fs.readFileSync(source);
  const ext=path.extname(entry.name).toLowerCase();
  if(!['.html','.mjs','.js','.css','.json','.txt'].includes(ext)){write(target,buffer);continue}
  let text=buffer.toString('utf8');
  text=text.replaceAll('/qhcf/references/ranking-items','/__KEEP_QHCF_RANKING_ITEMS__')
    .replaceAll('/qhcf/academy-temple-coverage.html','/__KEEP_QHCF_ACADEMY__')
    .replaceAll('/qhcf/','/warp/maps/archive/cf/')
    .replaceAll('/__KEEP_QHCF_RANKING_ITEMS__','/qhcf/references/ranking-items')
    .replaceAll('/__KEEP_QHCF_ACADEMY__','/qhcf/academy-temple-coverage.html');
  if(ext==='.html'){
   const canonical=rel==='index.html'?'https://topazcandy.com/warp/maps/archive/cf/':'https://topazcandy.com/warp/maps/archive/cf/'+rel.split(path.sep).join('/');
   text=text.replace('</head>',`<link rel="canonical" href="${canonical}"></head>`);
   text=text.replace(/<body([^>]*)>/,`<body$1><aside class="notice" data-archive-notice><strong>Historical Carrion Fields archive.</strong> Preserved source material; not verified as current WARP gameplay. <a href="/warp/maps/">Open WARP Maps</a>.</aside>`);
  }
  write(target,text);
 }
}
copyArchiveDirectory(qhcf,archive);

const archiveIndex=path.join(archive,'index.html');
let archiveLanding=fs.readFileSync(archiveIndex,'utf8');
archiveLanding=archiveLanding.replace('<title>World Atlas | QHCF Atlas</title>','<title>Historical Carrion Fields Atlas | WARP Maps</title>')
 .replace('<h1>QHCF World Atlas</h1>','<h1>Historical Carrion Fields Atlas</h1>')
 .replace('170 captured area maps, presented as a fast, crawlable graphical and text reference.','170 preserved area maps in their historical Carrion Fields context.');
write(archiveIndex,archiveLanding);

const manifest={
 schema_version:'1.0.0',
 migration:'reviewed-additive-destinations',
 generated_at_utc:'2026-10-20T00:00:00Z',
 destinations:{current_candidate:'/warp/maps/',historical_cf_archive:'/warp/maps/archive/cf/',qhcf_ranking_items:'/qhcf/references/ranking-items.html'},
 current_candidate:{dataset:'/warp/maps/public-town.json',topology_sha256:expectedTopologyHash,rooms:204,directed_exits:440,executable:false,status:status.status},
 archive:{area_pages:fs.readdirSync(path.join(archive,'areas')).filter(name=>name.endsWith('.html')).length,stable_ids:'qhcf.area.* retained inside historical records',original_source_backlinks:true},
 source_files:{
  topology_v3_sha256:sha256(fs.readFileSync(sourceTopology)),
  final_status_sha256:sha256(fs.readFileSync(sourceStatus)),
  directions_analysis_sha256:sha256(fs.readFileSync(sourceDirections))
 },
 protected_paths:['/qhcf/references/ranking-items.html','/qhcf/references/ranking-items.json','/qhcf/references/ranking-items.csv','/qhcf/references/ranking-items-SOURCE-NOTES.md'],
 legacy_redirects_installed:false
};
write(path.join(warp,'migration-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const pathManifest=[];
const inventory=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const target=path.join(directory,entry.name);if(entry.isDirectory())inventory(target);else if(entry.name!=='path-manifest.json'){const body=fs.readFileSync(target);pathManifest.push({path:path.relative(root,target).split(path.sep).join('/'),bytes:body.length,sha256:sha256(body)})}}};
inventory(warp);pathManifest.sort((a,b)=>a.path.localeCompare(b.path));
write(path.join(warp,'path-manifest.json'),JSON.stringify({schema_version:'1.0.0',generated_at_utc:'2026-10-20T00:00:00Z',files:pathManifest},null,2)+'\n');
console.log(JSON.stringify({rooms:204,edges:440,archiveAreas:manifest.archive.area_pages,files:pathManifest.length,topology:expectedTopologyHash},null,2));
