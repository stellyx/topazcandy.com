import {anchors,roomKey,sourceConnectorSegments,sourceGraph,route} from './grove-route.mjs?v=3';
const NS='http://www.w3.org/2000/svg',svg=document.querySelector('#map'),viewport=document.querySelector('#viewport'),note=document.querySelector('#room-note');
const names={G:'The Grove',G2:'The Grove (G2)',B:'Before the Circle of Stones',C:'The Great Ash Tree',D:'Druid’s Guild',E:'The Altar to Earth',F:'The Altar to Fire',I:'The Great Hickory Tree',K:'The Great Elm Tree',L:'The Altar to Air',A:'The Gathering Place',Q:'The Great Beech Tree',T:'The Great Willow Tree',W:'The Altar to Water',Z:'The Great Birch Tree',t:'Traveler’s Camp',u:'Rangers Guild',U:'Rangers Guild approach'};
const position=(r,c)=>({x:36+(c-4)*17,y:38+(r-1)*25});
function element(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e}
function render(data){
 const graph=sourceGraph(data),byAnchor=new Map(anchors.map(a=>[roomKey(a.row,a.col),a]));
 svg.setAttribute('viewBox','0 0 1100 820');
 const defs=element('defs'),arrow=element('marker',{id:'bramble-arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:5,markerHeight:5,orient:'auto'});arrow.append(element('path',{d:'M 1 1 L 9 5 L 1 9 z',fill:'#ffd17e'}));defs.append(arrow);svg.append(defs);
 const wires=element('g',{'aria-hidden':'true'}),highlight=element('g',{'aria-hidden':'true'});svg.append(wires,highlight);
 for(const {row,column,glyph} of sourceConnectorSegments(data)){
  const p=position(row,column),attrs={class:'connector'};
  if(glyph==='-')Object.assign(attrs,{x1:p.x-8.5,y1:p.y,x2:p.x+8.5,y2:p.y});
  else if(glyph==='|')Object.assign(attrs,{x1:p.x,y1:p.y-12.5,x2:p.x,y2:p.y+12.5});
  else if(glyph==='/'||glyph==='\\')Object.assign(attrs,{x1:p.x-7,y1:p.y+(glyph==='/'?8:-8),x2:p.x+7,y2:p.y+(glyph==='/'?-8:8)});
  else Object.assign(attrs,{x1:p.x-7,y1:p.y,x2:p.x+7,y2:p.y});
  wires.append(element('line',attrs));
 }
 const controls=document.querySelector('#anchors'),fromField=document.querySelector('#from'),toField=document.querySelector('#to');let start=null,goal=null,selected=null,scale=1;
 function draw(){
  for(const room of svg.querySelectorAll('.room')){const key=room.dataset.key;room.classList.toggle('selected',key===selected);room.classList.toggle('route-start',key===start);room.classList.toggle('route-goal',key===goal)}
  fromField.value=start||'';toField.value=goal||'';document.querySelector('#flip').disabled=!(start&&goal);
  highlight.replaceChildren();const result=document.querySelector('#result'),path=start&&goal?route(graph,start,goal):null;result.hidden=!path;
  if(start&&goal&&!path)note.textContent='These rooms are not connected by printed chart lines. No route or commands are offered.';
  if(!path)return;
  for(let i=1;i<path.rooms.length;i++){
   const a=graph.rooms.get(path.rooms[i-1]),b=graph.rooms.get(path.rooms[i]),p=position(a.row,a.col),q=position(b.row,b.col);
   highlight.append(element('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:'route-line'}));
   highlight.append(element('line',{x1:p.x+(q.x-p.x)*.44,y1:p.y+(q.y-p.y)*.44,x2:p.x+(q.x-p.x)*.78,y2:p.y+(q.y-p.y)*.78,class:'route-arrow','marker-end':'url(#bramble-arrow)'}));
  }
  const label=key=>byAnchor.get(key)?.label||'Selected room';document.querySelector('#summary').textContent=`${path.moves} moves · ${label(start)} → ${label(goal)}`;
  document.querySelector('#grouped').textContent=path.grouped.map(({direction,count})=>`${count} ${({n:'north',s:'south',e:'east',w:'west'})[direction]}`).join(' · ')||'Already there';
  document.querySelector('#commands').value=path.commands.join(';;');note.textContent='Highlighted path follows printed room connectors in revision 4971. Live movement and boundary crossings remain unverified.';
 }
 function choose(key){selected=key;if(!start||goal){start=key;goal=null}else goal=key;draw()}
 for(const n of graph.rooms.values()){
  const p=position(n.row,n.col),key=roomKey(n.row,n.col),anchor=byAnchor.get(key),label=anchor?.label||names[n.ch]||'Unnamed source room';
  const group=element('g',{class:`room${anchor?' named':''}`,id:n.id,tabindex:anchor?'0':'-1',role:anchor?'button':'img','aria-label':`${label}, source row ${n.row} column ${n.col}`,'data-key':key});
  group.append(element('circle',{cx:p.x,cy:p.y,r:anchor?10:n.ch==='+'?5:7}),element('circle',{cx:p.x,cy:p.y,r:anchor?19:13,class:'hit'}));
  if(n.ch!=='+'){const t=element('text',{x:p.x,y:p.y});t.textContent=n.ch;group.append(t)}const title=element('title');title.textContent=`${label} · row ${n.row}, column ${n.col}`;group.append(title);
  group.addEventListener('pointerenter',()=>{note.textContent=`${label} · captured row ${n.row}, column ${n.col}`});
  if(anchor){group.addEventListener('click',()=>choose(key));group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(key)}});group.addEventListener('focus',()=>{note.textContent=`${label} · captured row ${n.row}, column ${n.col}`})}svg.append(group);
 }
 for(const a of anchors){const key=roomKey(a.row,a.col),button=document.createElement('button');button.type='button';button.textContent=a.label;button.addEventListener('click',()=>{choose(key);document.getElementById(graph.rooms.get(key).id).focus()});controls.append(button);
  for(const field of [fromField,toField]){const option=document.createElement('option');option.value=key;option.textContent=a.label;field.append(option)}
 }
 fromField.addEventListener('change',()=>{start=fromField.value||null;selected=start;draw()});toField.addEventListener('change',()=>{goal=toField.value||null;selected=goal;draw()});document.querySelector('#flip').addEventListener('click',()=>{[start,goal]=[goal,start];selected=start;draw()});
 document.querySelector('#copy').addEventListener('click',async()=>{const box=document.querySelector('#commands'),feedback=document.querySelector('#copy-feedback');box.select();try{await navigator.clipboard.writeText(box.value);feedback.textContent='Copied. Paste to confirm your device accepted the commands.'}catch{feedback.textContent='Commands selected; press Ctrl+C or use Copy on your device.'}});
 if(location.hash==='#eastern-road-west-exit')choose('30:33');
 else if(location.hash==='#eastern-road-east-exit')choose('30:55');
 else if(location.hash==='#eastern-road-exits')note.textContent='Revision 4971 shows two distinct southern Eastern Road exits at c33 and c55; their matching road turnoffs remain unverified.';
 const boundaries=[
  {text:'Aldevari ←',href:'/warp/maps/archive/cf/aldevari-preview.html',x:384,y:468},
  {text:'The Void / Past Grove ?',href:'/warp/maps/archive/cf/past-grove-preview.html#void-markers',x:870,y:145},
  {text:'Eastern Road - west exit ↓',href:'/warp/maps/archive/cf/eastern-road-preview.html#grove-west-turnoff',x:464,y:806},
  {text:'Eastern Road - east exit ↓',href:'/warp/maps/archive/cf/eastern-road-preview.html#grove-east-turnoff',x:816,y:806}
 ];
 for(const b of boundaries){const a=element('a',{href:b.href,class:'edge-link','aria-label':`${b.text}, open map; crossing unresolved`}),t=element('text',{x:b.x,y:b.y,class:'edge-label'});t.textContent=b.text;a.append(t);svg.append(a)}
 function resize(){svg.style.width=`${1100*scale}px`;svg.style.height=`${820*scale}px`;svg.style.marginLeft=1100*scale<viewport.clientWidth?'auto':'0';svg.style.marginRight=1100*scale<viewport.clientWidth?'auto':'0';svg.style.marginTop=`${Math.max(0,(viewport.clientHeight-820*scale)/2)}px`}
 function fit(){scale=Math.min(1,(viewport.clientWidth-12)/1100,(viewport.clientHeight-12)/820);resize();viewport.scrollTo(0,0)}
 document.querySelector('#fit').addEventListener('click',fit);document.querySelector('#larger').addEventListener('click',()=>{scale=Math.min(2.5,scale*1.3);resize()});document.querySelector('#smaller').addEventListener('click',()=>{scale=Math.max(.25,scale/1.3);resize()});window.addEventListener('resize',fit);fit();draw();
}
fetch('/warp/maps/archive/cf/data/areas/the-grove.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()}).then(render).catch(()=>{note.textContent='Graphical data unavailable. Open the captured source or text record.'});
