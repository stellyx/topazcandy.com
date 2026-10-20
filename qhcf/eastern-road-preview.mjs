// Isolated preview model. Coordinates locate evidence in the captured chart; they
// never determine command counts. Only the two explicitly numbered spans route.
const named = [
  ['a','Galadon Outskirts junction (A)',5,9],['b1','Beyond Galadon Outskirts (B west)',5,11],['b2','Beyond Galadon Outskirts (B east)',5,13],
  ['along','Along the Eastern Road',5,16],['s','S · source marker',5,42],
  ['eastern','Eastern Road center',5,46],['c','Large Crossroads (C)',5,70],['east-e','Aldevari turnoff (E)',5,77],
  ['east-one','West Grove branch approach (1) · crossing unresolved',5,84],['south-one','Hamsah-bound continuation (1) · route unresolved',14,18],
  ...[20,22,24].map((col,i)=>[`lower-top-${i}`,`E (southern road ${i+1})`,14,col]),
  ...[24,26,28,30,32,34,36,38].map((col,i)=>[`lower-${i}`,`E (lower road ${i+1})`,16,col]),
  ['lower-east','E (southeast road)',18,45],['hamsah-east','E (toward Hamsah) · route unresolved',20,45],['i','I · Bridge over the River Khalid',20,55]
].map(([key,name,row,column])=>({id:`eastern.map.${key}`,name,row,column,kind:'letter'}));
const areas = [
  {name:'Galadon',slug:'galadon',preview:'/qhcf/galadon-preview.html',row:5,column:1},
  {name:'Outskirts of Galadon',slug:'outskirts-of-galadon',row:2,column:9},
  {name:'Outskirts of Galadon',slug:'outskirts-of-galadon',row:8,column:9},
  {name:'Bramblefield Road',slug:'bramblefield-road',row:1,column:63},
  {name:"Voralia’s Tears",slug:'voralia-s-tears',row:3,column:37},
  {name:"Voralia’s Tears",slug:'voralia-s-tears',row:7,column:35},
  {name:'Aldevari',slug:'aldevari',row:3,column:75},
  {name:'Blackclaw Village',slug:'blackclaw-village',row:8,column:46},
  {name:'Ostalagiah · The Ruins',slug:'the-ruins-of-ostalagiah',row:9,column:57},
  {name:'Dwarf Forest',slug:'the-dwarf-forest',row:10,column:69},
  {name:'A Thick Copse of Trees',slug:null,row:8,column:23},
  {name:'The Grove',slug:'the-grove',row:12,column:18},
  {name:'The Grove',slug:'the-grove',row:14,column:35},
  {name:'Drogan Hills · The Drogran Hills',slug:'the-drogran-hills',row:18,column:24},
  {name:'Outside Hamsah Mu’tazz',slug:'outside-hamsah-mu-tazz',row:20,column:64},
  {name:'Hamsah Mu’tazz',slug:'hamsah-mu-tazz',row:20,column:76}
];
// Source-attached turnoffs. A displayed link opens the destination map, never
// claims a matching entrance or an executable inter-area edge.
export const turnoffs = [
  {area:1,section:'upper',column:9,direction:'north',lane:0},
  {area:2,section:'upper',column:9,direction:'south',lane:0},
  {area:10,section:'upper',column:23,direction:'south',lane:1},
  {area:4,section:'upper',column:44,direction:'north',lane:0},
  {area:5,section:'upper',column:44,direction:'south',lane:0},
  {area:7,section:'upper',column:52,direction:'south',lane:1},
  {area:8,section:'upper',column:58,direction:'south',lane:2},
  {name:'Unidentified southern spur',section:'upper',column:64,direction:'south',lane:0},
  {area:3,section:'upper',column:70,direction:'north',lane:1},
  {area:9,section:'upper',column:70,direction:'south',lane:1},
  {area:6,section:'upper',column:77,direction:'north',lane:0},
  {area:11,name:'The Grove · west turnoff',section:'lower',column:18,direction:'north',lane:1},
  {area:12,name:'The Grove · east turnoff',section:'lower',column:34,direction:'north',lane:0},
  {area:13,section:'lower',column:24,direction:'south',lane:0}
].map(t=>({...t,name:t.name||areas[t.area].name,slug:t.area===undefined?null:areas[t.area].slug,
  href:t.area===undefined||!areas[t.area].slug?null:areas[t.area].preview||`/qhcf/areas/${areas[t.area].slug}.html`,
  sourceRow:t.area===undefined?null:areas[t.area].row,
  sourceColumn:t.area===undefined?null:areas[t.area].column}));
const spans = [
  {from:'eastern.map.c',to:'eastern.map.east-e',count:7,evidence:'(7E) on source row 5'},
  {from:'eastern.map.east-e',to:'eastern.map.east-one',count:5,evidence:'(5E) on source row 5'}
];
export function buildModel(source){
  if(source.slug!=='the-eastern-road'||source.source?.revision_id!==5027)throw Error('Unexpected source revision');
  const plus=source.plus_cells.map(({row,column})=>{
    if(source.lines[row-1]?.[column-1]!=='+')throw Error(`Missing source + at ${row}:${column}`);
    return {id:`eastern.map.r${row}c${column}`,name:`Unnamed + room (r${row}c${column})`,row,column,kind:'plus'};
  });
  if(plus.length!==9)throw Error('Source + inventory changed');
  for(const s of spans){if(!source.lines.join('\n').includes(s.evidence.slice(0,s.evidence.indexOf(' on '))))throw Error('Count annotation missing')}
  return {nodes:[...named,...plus],areas,spans,source};
}
// Each decorative connector stroke occupies exactly one literal road glyph.
// Labels, blanks, parentheses and other symbols cannot become drawn roads.
export function sourceSegments(source){
  const segments=[];
  source.lines.forEach((line,index)=>[...line].forEach((glyph,column)=>{
    if(glyph==='-'||glyph==='|')segments.push({row:index+1,column:column+1,glyph});
  }));
  return segments;
}
export function sourceCountNotes(source){
  return source.lines.flatMap((line,index)=>[...line.matchAll(/\([^)]*\)/g)].map(match=>({
    row:index+1,column:match.index+1+(match[0].length-1)/2,label:match[0]
  })));
}
export function routeBetween(model,from,to){
  if(!model.nodes.some(n=>n.id===from)||!model.nodes.some(n=>n.id===to))return null;
  if(from===to)return {nodes:[from],commands:[],runs:[],moves:0};
  const queue=[from],previous=new Map([[from,null]]);
  for(let index=0;index<queue.length;index++){
    const current=queue[index];for(const span of model.spans){
      const forward=span.from===current,reverse=span.to===current;
      if(!forward&&!reverse)continue;
      const next=forward?span.to:span.from;
      if(previous.has(next))continue;
      previous.set(next,{parent:current,span,direction:forward?'e':'w'});queue.push(next);
    }
  }
  if(!previous.has(to))return null;
  const nodes=[to],sections=[];let cursor=to;
  while(cursor!==from){const entry=previous.get(cursor);sections.unshift(entry);cursor=entry.parent;nodes.unshift(cursor)}
  const commands=sections.flatMap(({span,direction})=>Array(span.count).fill(direction));
  const runs=sections.map(({span,direction})=>`${span.count}${direction}`);
  return {nodes,commands,runs,moves:commands.length};
}

if(typeof document!=='undefined'){
  const source=await fetch('/qhcf/data/areas/the-eastern-road.json').then(r=>{if(!r.ok)throw Error('Source unavailable');return r.json()});
  const model=buildModel(source),byId=new Map(model.nodes.map(n=>[n.id,n]));
  const svg=document.querySelector('#map'),view=document.querySelector('#viewport'),NS='http://www.w3.org/2000/svg';
  // Display coordinates deliberately straighten the two source rows. They
  // carry no movement weight; source row/column and IDs remain unchanged.
  const W=1580,H=430,BASE=205,U=c=>24+c*9,L=c=>U(84)+14+(c-18)*12;
  const P=(row,column)=>row<11?{x:U(column),y:BASE+(row-5)*24}:{x:L(column),y:BASE};
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const add=(tag,attrs={},parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,String(value));parent.append(e);return e};
  const defs=add('defs'),marker=add('marker',{id:'east-arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto'},defs);add('path',{d:'M 1 1 L 9 5 L 1 9 z',fill:'#162420'},marker);
  const roads=add('g'),active=add('g'),points=add('g');
  add('line',{x1:U(1),y1:BASE,x2:U(84),y2:BASE,class:'road main-corridor','aria-hidden':'true'},roads);
  // User-marked upper '1' and lower '1' are adjacent in this schematic.
  // The short dashed join is visual continuity, with no invented command.
  add('line',{x1:U(84),y1:BASE,x2:L(18),y2:BASE,class:'road marked-continuation','aria-hidden':'true'},roads);
  add('line',{x1:L(18),y1:BASE,x2:L(76),y2:BASE,class:'road lower-corridor','aria-hidden':'true'},roads);
  add('text',{x:L(18)+8,y:BASE-57,class:'continuation-label','aria-hidden':'true'},roads).textContent='1 → 1 join · command unresolved';
  for(const [a,x,y,width,label] of [[areas[14],L(64),BASE-60,154,'Hamsah Outskirts'],[areas[15],L(76)-35,BASE+55,150,'Hamsah Mu’tazz →']]){
    const href=a.preview||`/qhcf/areas/${a.slug}.html`,sign=add('a',{href,class:'turn-sign endpoint','aria-label':`${a.name} · open area map; matching entrance unverified`},roads);
    add('rect',{x:x-width/2,y:y-15,width,height:30,rx:8},sign);add('text',{x,y:y+5,'text-anchor':'middle'},sign).textContent=label;
    add('title',{},sign).textContent=`Open ${a.name} map · matching entrance unverified`;
  }
  for(const t of turnoffs){
    const x=t.section==='upper'?U(t.column):L(t.column),north=t.direction==='north';
    const displayName=t.name.startsWith('Drogan Hills')?'Drogan Hills':t.name==='Unidentified southern spur'?'Unknown spur':t.name;
    const y=north?90-t.lane*43:285+t.lane*42,width=Math.min(220,Math.max(106,displayName.length*7.5+38));
    add('line',{x1:x,y1:BASE,x2:x,y2:north?y+14:y-14,class:'road branch-stub','aria-hidden':'true'},roads);
    const sign=add(t.href?'a':'g',t.href?{href:t.href,class:'turn-sign'}:{class:'turn-sign unresolved',tabindex:'0',role:'note'},roads);
    const descriptor=`${t.direction} turnoff to ${t.name} · road column ${t.column}${t.sourceRow?`; source label r${t.sourceRow}c${t.sourceColumn}`:''} · ${t.href?'open destination map; matching entrance unverified':'destination map unresolved'}`;
    sign.setAttribute('aria-label',descriptor);
    add('rect',{x:x-width/2,y:y-15,width,height:30,rx:8},sign);
    add('text',{x,y:y+5,'text-anchor':'middle'},sign).textContent=`${north?'↑':'↓'} ${displayName}`;
    add('title',{},sign).textContent=descriptor;
  }
  for(const {row,column,glyph} of sourceSegments(source)){
    if(row>10)continue; // lower chart is flattened into the corridor above
    const horizontal=glyph==='-';
    add('line',{
      x1:U(column)+(horizontal?-4.5:0),y1:P(row,column).y+(horizontal?0:-12),
      x2:U(column)+(horizontal?4.5:0),y2:P(row,column).y+(horizontal?0:12),
      class:'road source-glyph','aria-hidden':'true'
    },roads);
  }
  // Counted spans are geometric only for display; movement comes from (7E)/(5E).
  const spanEls=model.spans.map(s=>{const a=P(byId.get(s.from).row,byId.get(s.from).column),b=P(byId.get(s.to).row,byId.get(s.to).column);return add('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'road counted'},roads)});
  for(const [id,label,above] of [
    ['eastern.map.a','Galadon Outskirts junction',true],
    ['eastern.map.c','Large Crossroads',true],
    ['eastern.map.east-one','West Grove branch (1)',false]
  ]){
    const n=byId.get(id);
    const p=P(n.row,n.column);add('text',{x:p.x,y:p.y+(above?-23:35),class:'corridor-label','text-anchor':n.column>78?'end':'middle','aria-hidden':'true'},roads).textContent=label;
  }
  // The source has many more distance notes than the two modelled route spans.
  // Print every one at its captured position; these labels are evidence, not
  // executable edges until both endpoint rooms are established.
  for(const note of sourceCountNotes(source)){
    const p=P(note.row,note.column),offset=note.row===6?31:note.row===4||note.row===5?-32:-34;
    add('text',{x:p.x,y:p.y+offset,class:'source-count','text-anchor':'middle','aria-hidden':'true'},roads).textContent=note.label;
  }
  const note=document.querySelector('#map-note'),defaultNote=note.textContent;
  const showNote=value=>{note.textContent=value},resetNote=()=>{note.textContent=defaultNote};
  const keyIds=new Set(['a','c','east-e','east-one'].map(key=>`eastern.map.${key}`));
  for(const n of model.nodes){
    const p=P(n.row,n.column),key=keyIds.has(n.id);
    if(!key){if(n.kind==='plus')add('text',{x:p.x,y:p.y+4,'text-anchor':'middle',class:'source-plus','aria-hidden':'true'},points).textContent='+';continue}
    const g=add('g',{class:`point ${n.kind}`,tabindex:'0',role:'button','aria-label':n.name,'data-room':n.id},points);
    add('circle',{cx:p.x,cy:p.y,r:12},g);
    add('title',{},g).textContent=n.name;
    g.addEventListener('click',()=>select(n));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n)}});
    g.addEventListener('pointerenter',()=>showNote(`${n.name} · source r${n.row}c${n.column}`));g.addEventListener('pointerleave',resetNote);
    g.addEventListener('focus',()=>showNote(`${n.name} · source r${n.row}c${n.column}`));g.addEventListener('blur',resetNote);
  }
  // Area labels live in a compact Places control. These are real HTML links,
  // separate from source-positioned rooms and from the routing graph.
  const placeList=document.querySelector('#place-list');
  for(const a of model.areas){const item=document.createElement(a.slug?'a':'span');item.className=a.slug?'place-link':'place-unresolved';if(a.slug)item.href=a.preview||`/qhcf/areas/${a.slug}.html`;else item.tabIndex=0;const descriptor=`${a.name} · source r${a.row}c${a.column} · ${a.slug?'open map; matching entrance unverified':'destination unresolved'}`;item.setAttribute('aria-label',descriptor);item.title=descriptor;const title=document.createElement('strong');title.textContent=a.name;const position=document.createElement('small');position.textContent=`r${a.row}c${a.column} · ${a.slug?'Open map':'Unresolved'}`;item.append(title,position);item.addEventListener('pointerenter',()=>showNote(descriptor));item.addEventListener('pointerleave',resetNote);item.addEventListener('focus',()=>showNote(descriptor));item.addEventListener('blur',resetNote);placeList.append(item)}
  const turnoffList=document.querySelector('#turnoff-links');
  for(const t of turnoffs){const item=document.createElement(t.href?'a':'span');item.className=t.href?'turnoff-link':'turnoff-unresolved';if(t.href)item.href=t.href;item.textContent=`${t.direction==='north'?'↑':'↓'} ${t.name} · ${t.section} road${t.href?' → Open map':' · Unresolved'}`;item.title=`Road column ${t.column}${t.sourceRow?`; label r${t.sourceRow}c${t.sourceColumn}`:''}; matching entrance ${t.href?'unverified':'unresolved'}`;turnoffList.append(item)}
  let start=null,goal=null,selected=null,zoom=1,autoFit=true,route=null;
  const fromField=document.querySelector('#from'),toField=document.querySelector('#to'),status=document.querySelector('#selection');
  const sorted=model.nodes.filter(n=>keyIds.has(n.id)).sort((a,b)=>a.row-b.row||a.column-b.column);
  for(const field of [fromField,toField])for(const n of sorted){const option=document.createElement('option');option.value=n.id;option.textContent=n.name;field.append(option)}
  function show(){fromField.value=start||'';toField.value=goal||'';document.querySelector('#start-chip').textContent=start?`① ${byId.get(start).name}`:'① Click starting point';document.querySelector('#goal-chip').textContent=goal?`② ${byId.get(goal).name}`:'② Click destination';document.querySelector('#flip').disabled=!(start&&goal);for(const g of points.children){g.classList.toggle('start',g.dataset.room===start);g.classList.toggle('goal',g.dataset.room===goal);g.classList.toggle('selected',g.dataset.room===selected)}active.replaceChildren();spanEls.forEach(el=>el.classList.remove('active'));route=start&&goal?routeBetween(model,start,goal):null;const result=document.querySelector('#result'),fitRoute=document.querySelector('#fit-route');result.hidden=!route;fitRoute.disabled=!route||route.nodes.length<2;document.querySelector('#copy-feedback').textContent='';
    if(start&&goal&&!route){status.textContent=`${byId.get(start).name} → ${byId.get(goal).name}: connection or step count unresolved in revision 5027. No commands offered.`;return}
    if(route){document.querySelector('#summary').textContent=`${route.moves} moves${route.moves ? " on the C → east-end section" : ""} · ${byId.get(start).name} → ${byId.get(goal).name}`;document.querySelector('#grouped').textContent=route.runs.join(' · ')||'Already there';document.querySelector('#commands').value=route.commands.join(';;');status.textContent='Partial source-counted section only. Earlier Eastern Road spans and live boundary entrances remain unmodelled.';for(let i=1;i<route.nodes.length;i++){const a=byId.get(route.nodes[i-1]),b=byId.get(route.nodes[i]),index=model.spans.findIndex(s=>s.from===a.id&&s.to===b.id||s.to===a.id&&s.from===b.id);spanEls[index]?.classList.add('active');add('line',{x1:P(a.row,a.column).x+(P(b.row,b.column).x-P(a.row,a.column).x)*.4,y1:BASE,x2:P(a.row,a.column).x+(P(b.row,b.column).x-P(a.row,a.column).x)*.76,y2:BASE,class:'route-arrow','marker-end':'url(#east-arrow)'},active)}return}
    status.textContent=start?`${byId.get(start).name}. Click a destination; only explicitly counted spans can route.`:'Click a room or place for details.';
  }
  function select(n){selected=n.id;const mode=document.querySelector('#click-mode').value;if(mode==='start')start=n.id;else if(mode==='goal')goal=n.id;else if(!start||goal){start=n.id;goal=null}else goal=n.id;show()}
  fromField.onchange=()=>{start=fromField.value||null;selected=start;show()};toField.onchange=()=>{goal=toField.value||null;selected=goal;show()};document.querySelector('#flip').onclick=()=>{[start,goal]=[goal,start];show()};document.querySelector('#copy').onclick=async()=>{const box=document.querySelector('#commands'),feedback=document.querySelector('#copy-feedback');box.select();try{await navigator.clipboard.writeText(box.value);feedback.textContent='Clipboard write reported success. Paste to confirm the commands on your device.'}catch{feedback.textContent='Clipboard access unavailable. Commands selected; use Copy or Ctrl+C.'}};
  function size(){svg.style.width=W*zoom+'px';svg.style.height=H*zoom+'px';svg.style.marginLeft=Math.max(0,(view.clientWidth-W*zoom)/2)+'px';svg.style.marginTop=Math.max(0,(view.clientHeight-H*zoom)/2)+'px'}function fit(){autoFit=true;zoom=Math.min(1,(view.clientWidth-20)/W,(view.clientHeight-20)/H);size();view.scrollLeft=0;view.scrollTop=0}function zoomTo(value){autoFit=false;const old=zoom;zoom=Math.max(.25,Math.min(2.5,value));size();view.scrollLeft=(view.scrollLeft+view.clientWidth/2)*zoom/old-view.clientWidth/2;view.scrollTop=(view.scrollTop+view.clientHeight/2)*zoom/old-view.clientHeight/2}
  document.querySelector('#fit').onclick=fit;document.querySelector('#zoom-in').onclick=()=>zoomTo(zoom*1.3);document.querySelector('#zoom-out').onclick=()=>zoomTo(zoom/1.3);document.querySelector('#fit-route').onclick=()=>{if(!route||route.nodes.length<2)return;autoFit=false;const xs=route.nodes.map(id=>P(byId.get(id).row,byId.get(id).column).x),min=Math.min(...xs),max=Math.max(...xs);zoom=Math.min(2,(view.clientWidth-110)/Math.max(120,max-min));size();view.scrollLeft=(min+max)/2*zoom-view.clientWidth/2;view.scrollTop=BASE*zoom-view.clientHeight/2};addEventListener('resize',()=>autoFit?fit():size());fit();
  let drag=null;view.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0||e.target.closest('.point,.turn-sign'))return;drag={x:e.clientX,y:e.clientY,left:view.scrollLeft,top:view.scrollTop};view.setPointerCapture(e.pointerId)});view.addEventListener('pointermove',e=>{if(!drag)return;view.classList.add('dragging');view.scrollLeft=drag.left+drag.x-e.clientX;view.scrollTop=drag.top+drag.y-e.clientY});view.addEventListener('pointerup',()=>{drag=null;view.classList.remove('dragging')});view.addEventListener('pointercancel',()=>{drag=null;view.classList.remove('dragging')});view.addEventListener('keydown',e=>{if(e.target!==view)return;if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(zoom*1.3)}if(e.key==='-'){e.preventDefault();zoomTo(zoom/1.3)}});
  const areaSelect=document.querySelector('#area-select');fetch('/qhcf/data/index.json?v=170-5041').then(r=>r.json()).then(data=>{areaSelect.options[0].textContent='Choose a map…';for(const a of data.areas){const option=document.createElement('option');option.value=a.slug;option.textContent=a.title;areaSelect.append(option)}}).catch(()=>areaSelect.options[0].textContent='Browse all maps');areaSelect.onchange=()=>{if(areaSelect.value)location.assign(`/qhcf/areas/${encodeURIComponent(areaSelect.value)}.html`)};show();
}
