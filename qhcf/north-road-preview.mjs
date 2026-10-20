// NorthernRoads revision 4989. Source coordinates are 1-based Unicode columns.
export const sourceUrl='/qhcf/data/areas/northernroads.json';
export const routeStops=[
  {id:'galadon-approach',row:97,column:24,name:'North Road · Galadon approach'},
  {id:'south-bend',row:79,column:24,name:'North Road · south bend'},
  {id:'north-bend',row:79,column:22,name:'North Road · north bend'},
  {id:'sumners-crossroads',row:61,column:22,name:'The Sumners Crossroads (Q)'},
  {id:'open-plains',row:59,column:22,name:'North Road · Open Plains edge'}
];
export const mapLinks=[
  {name:"Gol'Galath",slug:'gol-galath',row:13,needle:'GolGalath'},
  {name:"Voralia's Tears · northern link",slug:'voralia-s-tears',row:43,needle:"Voralia'sTears"},
  {name:"Voralia's Tears · southern link",slug:'voralia-s-tears',row:45,needle:"Voralia'sTears"},
  {name:'Voralian City · NW Bridge',slug:'voralian-city',row:53,needle:'VoralianCity'},
  {name:'Voralian City · W Bridge',slug:'voralian-city',row:61,needle:'VoralianCity'},
  {name:'Voralian City · SW Bridge',slug:'voralian-city',row:69,needle:'VoralianCity'}
];
const glyph=(source,row,column)=>[...(source.lines[row-1]||'')][column-1];
export function sourceRooms(source){const rooms=[];source.lines.forEach((line,i)=>[...line].forEach((c,j)=>{if(c==='+'||c==='•')rooms.push({id:`north.r${i+1}c${j+1}`,row:i+1,column:j+1,glyph:c})}));return rooms}
export function northRoadSpine(source){
  const cells=[];
  for(let row=97;row>=79;row-=2)cells.push({row,column:24});
  cells.push({row:79,column:22});
  for(let row=77;row>=59;row-=2)cells.push({row,column:22});
  for(let i=0;i<cells.length;i++){
    const {row,column}=cells[i],expected=row===61?'Q':'•';
    if(glyph(source,row,column)!==expected)throw Error(`Northern Road room missing: r${row}c${column}`);
    if(i){const prev=cells[i-1],midRow=(row+prev.row)/2,midCol=(column+prev.column)/2,link=row===prev.row?'-':'|';if(glyph(source,midRow,midCol)!==link)throw Error(`Northern Road link missing: r${midRow}c${midCol}`)}
  }
  return cells.map((cell,i)=>({...cell,id:`north.r${cell.row}c${cell.column}`,index:i}));
}
export function routeBetween(source,from,to){
  const cells=northRoadSpine(source),a=cells.findIndex(n=>n.id===from),b=cells.findIndex(n=>n.id===to);
  if(a<0||b<0)return null;
  const path=a<=b?cells.slice(a,b+1):cells.slice(b,a+1).reverse();
  const commands=[];
  for(let i=1;i<path.length;i++)commands.push(path[i].row<path[i-1].row?'n':path[i].row>path[i-1].row?'s':path[i].column<path[i-1].column?'w':'e');
  const grouped=[];for(const command of commands){const last=grouped.at(-1);if(last&&last.direction===command)last.count++;else grouped.push({direction:command,count:1})}
  return {path,commands,grouped,moves:commands.length};
}
export function verifiedMapLinks(source){return mapLinks.map(item=>{const column=[...(source.lines[item.row-1]||'')].join('').indexOf(item.needle)+1;if(column<1)throw Error(`Missing source label ${item.name}`);return {...item,column,href:`/qhcf/areas/${item.slug}.html`}})}

if(typeof document!=='undefined')init();
async function init(){
  const source=await fetch(sourceUrl).then(r=>{if(!r.ok)throw Error(`Source HTTP ${r.status}`);return r.json()});
  const spine=northRoadSpine(source),byId=new Map(spine.map(n=>[n.id,n]));
  const rooms=sourceRooms(source),links=verifiedMapLinks(source),svg=document.querySelector('#map'),view=document.querySelector('#viewport');
  const ns='http://www.w3.org/2000/svg',X=12,Y=26,W=Math.max(...source.lines.map(s=>[...s].length))*X+40,H=source.lines.length*Y+40;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('width',W);svg.setAttribute('height',H);
  const el=(parent,tag,attrs={},content)=>{const node=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);if(content!==undefined)node.textContent=content;parent.append(node);return node};
  const point=n=>({x:20+(n.column-1)*X,y:31+(n.row-1)*Y});
  const sourceLayer=el(svg,'g',{'aria-hidden':'true',class:'source-chart'});
  source.lines.forEach((line,i)=>el(sourceLayer,'text',{x:20,y:31+i*Y},line));
  const pathLayer=el(svg,'g',{'aria-hidden':'true'});
  const routeLine=el(pathLayer,'polyline',{class:'highlight',points:''});
  const hotspotLayer=el(svg,'g');
  for(const stop of routeStops){const n=byId.get(`north.r${stop.row}c${stop.column}`),p=point(n);const g=el(hotspotLayer,'g',{class:'stop',role:'button',tabindex:'0','aria-label':`Select ${stop.name}, source row ${n.row}, column ${n.column}`,'data-id':n.id});el(g,'circle',{cx:p.x,cy:p.y,r:13});el(g,'title',{},stop.name);g.addEventListener('click',()=>choose(n.id));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(n.id)}})}
  // Only explicit destination labels attached to drawn exits become SVG links.
  for(const link of links){const p=point(link),a=el(svg,'a',{href:link.href,'aria-label':`Open ${link.name} map; matching entrance unverified`,class:'area-exit'});el(a,'rect',{x:p.x-3,y:p.y-17,width:link.needle.length*X+5,height:22,rx:4});el(a,'title',{},`${link.name}: matching entrance and crossing move unverified`)}
  const list=document.querySelector('#exit-links');for(const link of links){const a=document.createElement('a');a.href=link.href;a.textContent=`${link.name} →`;a.title='Opens captured map; matching entrance and crossing move unverified';list.append(a)}
  const from=document.querySelector('#from'),to=document.querySelector('#to');for(const stop of routeStops){const id=`north.r${stop.row}c${stop.column}`;for(const select of [from,to])select.add(new Option(stop.name,id))}
  let start='',goal='',zoom=1,autoFit=true;
  function render(){from.value=start;to.value=goal;const route=start&&goal?routeBetween(source,start,goal):null;routeLine.setAttribute('points',route?route.path.map(n=>{const p=point(n);return `${p.x},${p.y}`}).join(' '):'');document.querySelectorAll('.stop').forEach(node=>{node.classList.toggle('start',node.dataset.id===start);node.classList.toggle('goal',node.dataset.id===goal)});document.querySelector('#flip').disabled=!(start&&goal);document.querySelector('#fit-route').disabled=!route||route.moves===0;const result=document.querySelector('#result');result.hidden=!route;document.querySelector('#selection').textContent=route?`${routeStops.find(s=>`north.r${s.row}c${s.column}`===start).name} → ${routeStops.find(s=>`north.r${s.row}c${s.column}`===goal).name}`:start?'Choose a destination on the map or in the list.':'Click a starting point, then a destination.';if(route){document.querySelector('#summary').textContent=`${route.moves} source rooms / moves`;document.querySelector('#grouped').textContent=route.grouped.map(g=>`${g.count} ${({n:'north',s:'south',e:'east',w:'west'})[g.direction]}`).join(', ')||'Same room';document.querySelector('#commands').value=route.commands.join(';;')}}
  function choose(id){if(!start||goal){start=id;goal=''}else goal=id;render()}
  from.onchange=()=>{start=from.value;render()};to.onchange=()=>{goal=to.value;render()};document.querySelector('#flip').onclick=()=>{[start,goal]=[goal,start];render()};document.querySelector('#copy').onclick=async()=>{const box=document.querySelector('#commands'),feedback=document.querySelector('#copy-feedback');box.select();try{await navigator.clipboard.writeText(box.value);feedback.textContent='Commands copied. Paste to confirm on your device.'}catch{feedback.textContent='Commands selected; use Ctrl+C or Copy.'}};
  function size(){svg.style.width=W*zoom+'px';svg.style.height=H*zoom+'px';svg.style.marginLeft=Math.max(0,(view.clientWidth-W*zoom)/2)+'px';svg.style.marginTop=Math.max(0,(view.clientHeight-H*zoom)/2)+'px'}function fit(){autoFit=true;zoom=Math.min(1,(view.clientWidth-16)/W,(view.clientHeight-16)/H);size();view.scrollLeft=0;view.scrollTop=0}function zoomTo(z){autoFit=false;const old=zoom;zoom=Math.max(.2,Math.min(3,z));size();view.scrollLeft=(view.scrollLeft+view.clientWidth/2)*zoom/old-view.clientWidth/2;view.scrollTop=(view.scrollTop+view.clientHeight/2)*zoom/old-view.clientHeight/2}
  document.querySelector('#fit').onclick=fit;document.querySelector('#zoom-in').onclick=()=>zoomTo(zoom*1.4);document.querySelector('#zoom-out').onclick=()=>zoomTo(zoom/1.4);document.querySelector('#fit-route').onclick=()=>{if(!start||!goal)return;const r=routeBetween(source,start,goal),p=r.path.map(point),minX=Math.min(...p.map(v=>v.x)),maxX=Math.max(...p.map(v=>v.x)),minY=Math.min(...p.map(v=>v.y)),maxY=Math.max(...p.map(v=>v.y));zoom=Math.min(2,(view.clientWidth-90)/Math.max(170,maxX-minX),(view.clientHeight-90)/Math.max(140,maxY-minY));autoFit=false;size();view.scrollLeft=(minX+maxX)/2*zoom-view.clientWidth/2;view.scrollTop=(minY+maxY)/2*zoom-view.clientHeight/2};addEventListener('resize',()=>autoFit?fit():size());fit();
  let drag=null;view.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0||e.target.closest('.stop,.area-exit'))return;drag={x:e.clientX,y:e.clientY,left:view.scrollLeft,top:view.scrollTop};view.setPointerCapture(e.pointerId)});view.addEventListener('pointermove',e=>{if(!drag)return;view.scrollLeft=drag.left+drag.x-e.clientX;view.scrollTop=drag.top+drag.y-e.clientY});view.addEventListener('pointerup',()=>drag=null);view.addEventListener('keydown',e=>{if(e.target!==view)return;if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(zoom*1.4)}if(e.key==='-'){e.preventDefault();zoomTo(zoom/1.4)}});
  const areaSelect=document.querySelector('#area-select');fetch('/qhcf/data/index.json').then(r=>r.json()).then(data=>{areaSelect.options[0].textContent='Choose a map…';for(const a of data.areas)areaSelect.add(new Option(a.title,a.slug))}).catch(()=>areaSelect.options[0].textContent='Browse all maps');areaSelect.onchange=()=>{if(areaSelect.value)location.assign(`/qhcf/areas/${encodeURIComponent(areaSelect.value)}.html`)};render();
}
