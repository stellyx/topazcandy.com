// Isolated preview model. Coordinates locate evidence in the captured chart; they
// never determine command counts. Only the two explicitly numbered spans route.
const named = [
  ['a','A (west)',5,9],['b1','B (west)',5,11],['b2','B (east)',5,13],
  ['along','Along the Eastern Road',5,16],['s','S',5,42],
  ['eastern','Eastern Road',5,46],['c','C',5,70],['east-e','E (east of C)',5,77],
  ['east-one','1 (east end)',5,84],['south-one','1 (southern road)',14,18],
  ...[20,22,24].map((col,i)=>[`lower-top-${i}`,`E (southern road ${i+1})`,14,col]),
  ...[24,26,28,30,32,34,36,38].map((col,i)=>[`lower-${i}`,`E (lower road ${i+1})`,16,col]),
  ['lower-east','E (southeast road)',18,45],['hamsah-east','E (toward Hamsah)',20,45],['i','I',20,55]
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
  {name:'Ostalagiah',slug:null,row:9,column:57},
  {name:'Dwarf Forest',slug:'the-dwarf-forest',row:10,column:69},
  {name:'A Thick Copse of Trees',slug:null,row:8,column:23},
  {name:'The Grove',slug:'the-grove',row:12,column:18},
  {name:'The Grove',slug:'the-grove',row:14,column:35},
  {name:'Drogan Hills',slug:null,row:18,column:24},
  {name:'Outside Hamsah Mu’tazz',slug:'outside-hamsah-mu-tazz',row:20,column:64},
  {name:'Hamsah Mu’tazz',slug:'hamsah-mu-tazz',row:20,column:76}
];
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
  const W=1250,H=580,X=c=>30+c*14,Y=r=>22+r*25;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const add=(tag,attrs={},parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,String(value));parent.append(e);return e};
  const defs=add('defs'),marker=add('marker',{id:'east-arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto'},defs);add('path',{d:'M 1 1 L 9 5 L 1 9 z',fill:'#162420'},marker);
  const roads=add('g'),active=add('g'),points=add('g');
  for(const {row,column,glyph} of sourceSegments(source)){
    const horizontal=glyph==='-';
    add('line',{
      x1:X(column)+(horizontal?-7:0),y1:Y(row)+(horizontal?0:-12.5),
      x2:X(column)+(horizontal?7:0),y2:Y(row)+(horizontal?0:12.5),
      class:'road source-glyph','aria-hidden':'true'
    },roads);
  }
  // Counted spans are geometric only for display; movement comes from (7E)/(5E).
  const spanEls=model.spans.map(s=>{const a=byId.get(s.from),b=byId.get(s.to);return add('line',{x1:X(a.column),y1:Y(a.row),x2:X(b.column),y2:Y(b.row),class:'road counted'},roads)});
  const note=document.querySelector('#map-note'),defaultNote=note.textContent;
  const showNote=value=>{note.textContent=value},resetNote=()=>{note.textContent=defaultNote};
  for(const n of model.nodes){const g=add('g',{class:`point ${n.kind}`,tabindex:'0',role:'button','aria-label':n.name,'data-room':n.id},points);add('circle',{cx:X(n.column),cy:Y(n.row),r:n.kind==='plus'?11:12},g);if(n.kind==='plus')add('text',{x:X(n.column),y:Y(n.row)+5,'text-anchor':'middle',class:'code'},g).textContent='+';const t=add('title',{},g);t.textContent=n.name;g.addEventListener('click',()=>select(n));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(n)}});g.addEventListener('pointerenter',()=>showNote(`${n.name} · source r${n.row}c${n.column}`));g.addEventListener('pointerleave',resetNote);g.addEventListener('focus',()=>showNote(`${n.name} · source r${n.row}c${n.column}`));g.addEventListener('blur',resetNote)}
  // Area labels live in a compact Places control. These are real HTML links,
  // separate from source-positioned rooms and from the routing graph.
  const placeList=document.querySelector('#place-list');
  for(const a of model.areas){const item=document.createElement(a.slug?'a':'span');item.className=a.slug?'place-link':'place-unresolved';if(a.slug)item.href=a.preview||`/qhcf/areas/${a.slug}.html`;else item.tabIndex=0;const descriptor=`${a.name} · source r${a.row}c${a.column} · ${a.slug?'open map; matching entrance unverified':'destination unresolved'}`;item.setAttribute('aria-label',descriptor);item.title=descriptor;const title=document.createElement('strong');title.textContent=a.name;const position=document.createElement('small');position.textContent=`r${a.row}c${a.column} · ${a.slug?'Open map':'Unresolved'}`;item.append(title,position);item.addEventListener('pointerenter',()=>showNote(descriptor));item.addEventListener('pointerleave',resetNote);item.addEventListener('focus',()=>showNote(descriptor));item.addEventListener('blur',resetNote);placeList.append(item)}
  let start=null,goal=null,selected=null,zoom=1,autoFit=true,route=null;
  const fromField=document.querySelector('#from'),toField=document.querySelector('#to'),status=document.querySelector('#selection');
  const sorted=[...model.nodes].sort((a,b)=>a.row-b.row||a.column-b.column);
  for(const field of [fromField,toField])for(const n of sorted){const option=document.createElement('option');option.value=n.id;option.textContent=n.name;field.append(option)}
  function show(){fromField.value=start||'';toField.value=goal||'';document.querySelector('#start-chip').textContent=start?`① ${byId.get(start).name}`:'① Click starting point';document.querySelector('#goal-chip').textContent=goal?`② ${byId.get(goal).name}`:'② Click destination';document.querySelector('#flip').disabled=!(start&&goal);for(const g of points.children){g.classList.toggle('start',g.dataset.room===start);g.classList.toggle('goal',g.dataset.room===goal);g.classList.toggle('selected',g.dataset.room===selected)}active.replaceChildren();spanEls.forEach(el=>el.classList.remove('active'));route=start&&goal?routeBetween(model,start,goal):null;const result=document.querySelector('#result'),fitRoute=document.querySelector('#fit-route');result.hidden=!route;fitRoute.disabled=!route||route.nodes.length<2;document.querySelector('#copy-feedback').textContent='';
    if(start&&goal&&!route){status.textContent=`${byId.get(start).name} → ${byId.get(goal).name}: connection or step count unresolved in revision 5027. No commands offered.`;return}
    if(route){document.querySelector('#summary').textContent=`${route.moves} moves · ${byId.get(start).name} → ${byId.get(goal).name}`;document.querySelector('#grouped').textContent=route.runs.join(' · ')||'Already there';document.querySelector('#commands').value=route.commands.join(';;');status.textContent='Source-counted map route; live travel and boundary entrances unverified.';for(let i=1;i<route.nodes.length;i++){const a=byId.get(route.nodes[i-1]),b=byId.get(route.nodes[i]),index=model.spans.findIndex(s=>s.from===a.id&&s.to===b.id||s.to===a.id&&s.from===b.id);spanEls[index]?.classList.add('active');add('line',{x1:X(a.column)+(X(b.column)-X(a.column))*.4,y1:Y(a.row),x2:X(a.column)+(X(b.column)-X(a.column))*.76,y2:Y(b.row),class:'route-arrow','marker-end':'url(#east-arrow)'},active)}return}
    status.textContent=start?`${byId.get(start).name}. Click a destination; only explicitly counted spans can route.`:'Click a room or place for details.';
  }
  function select(n){selected=n.id;const mode=document.querySelector('#click-mode').value;if(mode==='start')start=n.id;else if(mode==='goal')goal=n.id;else if(!start||goal){start=n.id;goal=null}else goal=n.id;show()}
  fromField.onchange=()=>{start=fromField.value||null;selected=start;show()};toField.onchange=()=>{goal=toField.value||null;selected=goal;show()};document.querySelector('#flip').onclick=()=>{[start,goal]=[goal,start];show()};document.querySelector('#copy').onclick=async()=>{const box=document.querySelector('#commands'),feedback=document.querySelector('#copy-feedback');box.select();try{await navigator.clipboard.writeText(box.value);feedback.textContent='Clipboard write reported success. Paste to confirm the commands on your device.'}catch{feedback.textContent='Clipboard access unavailable. Commands selected; use Copy or Ctrl+C.'}};
  function size(){svg.style.width=W*zoom+'px';svg.style.height=H*zoom+'px';svg.style.marginLeft=Math.max(0,(view.clientWidth-W*zoom)/2)+'px';svg.style.marginTop=Math.max(0,(view.clientHeight-H*zoom)/2)+'px'}function fit(){autoFit=true;zoom=Math.min(1,(view.clientWidth-20)/W,(view.clientHeight-20)/H);size();view.scrollLeft=0;view.scrollTop=0}function zoomTo(value){autoFit=false;const old=zoom;zoom=Math.max(.25,Math.min(2.5,value));size();view.scrollLeft=(view.scrollLeft+view.clientWidth/2)*zoom/old-view.clientWidth/2;view.scrollTop=(view.scrollTop+view.clientHeight/2)*zoom/old-view.clientHeight/2}
  document.querySelector('#fit').onclick=fit;document.querySelector('#zoom-in').onclick=()=>zoomTo(zoom*1.3);document.querySelector('#zoom-out').onclick=()=>zoomTo(zoom/1.3);document.querySelector('#fit-route').onclick=()=>{if(!route||route.nodes.length<2)return;autoFit=false;const xs=route.nodes.map(id=>X(byId.get(id).column)),min=Math.min(...xs),max=Math.max(...xs);zoom=Math.min(2,(view.clientWidth-110)/Math.max(120,max-min));size();view.scrollLeft=(min+max)/2*zoom-view.clientWidth/2;view.scrollTop=Y(5)*zoom-view.clientHeight/2};addEventListener('resize',()=>autoFit?fit():size());fit();
  let drag=null;view.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0||e.target.closest('.point'))return;drag={x:e.clientX,y:e.clientY,left:view.scrollLeft,top:view.scrollTop};view.setPointerCapture(e.pointerId)});view.addEventListener('pointermove',e=>{if(!drag)return;view.classList.add('dragging');view.scrollLeft=drag.left+drag.x-e.clientX;view.scrollTop=drag.top+drag.y-e.clientY});view.addEventListener('pointerup',()=>{drag=null;view.classList.remove('dragging')});view.addEventListener('pointercancel',()=>{drag=null;view.classList.remove('dragging')});view.addEventListener('keydown',e=>{if(e.target!==view)return;if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(zoom*1.3)}if(e.key==='-'){e.preventDefault();zoomTo(zoom/1.3)}});
  const areaSelect=document.querySelector('#area-select');fetch('/qhcf/data/index.json').then(r=>r.json()).then(data=>{areaSelect.options[0].textContent='Choose a map…';for(const a of data.areas){const option=document.createElement('option');option.value=a.slug;option.textContent=a.title;areaSelect.append(option)}}).catch(()=>areaSelect.options[0].textContent='Browse all maps');areaSelect.onchange=()=>{if(areaSelect.value)location.assign(`/qhcf/areas/${encodeURIComponent(areaSelect.value)}.html`)};show();
}
