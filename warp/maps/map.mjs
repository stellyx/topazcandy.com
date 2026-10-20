import {planCandidateRoute} from './route-engine.mjs';

const $=selector=>document.querySelector(selector),ns='http://www.w3.org/2000/svg';
const svg=$('#map'),mapScroll=$('.map-scroll'),search=$('#search'),result=$('#result'),roomList=$('#room-list');
const fromSelect=$('#route-from'),toSelect=$('#route-to'),routeOutput=$('#route-output'),routeStatus=$('#route-status'),copyRoute=$('#copy-route');
const data=await fetch('./public-town.json').then(response=>{if(!response.ok)throw Error('Candidate data unavailable');return response.json()});
$('#rooms').textContent=data.contract.room_count;$('#exits').textContent=data.contract.directed_internal_exit_count;
const byId=new Map(data.rooms.map(room=>[room.id,room]));
const xs=data.rooms.map(room=>room.position.x),ys=data.rooms.map(room=>room.position.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=18,pad=45;
const naturalWidth=(maxX-minX)*scale+pad*2,naturalHeight=(maxY-minY)*scale+pad*2;
const point=room=>({x:(room.position.x-minX)*scale+pad,y:(room.position.y-minY)*scale+pad});
svg.setAttribute('viewBox',`0 0 ${naturalWidth} ${naturalHeight}`);

const edgeLayer=document.createElementNS(ns,'g'),routeLayer=document.createElementNS(ns,'g'),roomLayer=document.createElementNS(ns,'g'),labelLayer=document.createElementNS(ns,'g');
svg.append(edgeLayer,routeLayer,roomLayer,labelLayer);
const edgePairs=new Set();
for(const room of data.rooms)for(const [direction,targetId] of Object.entries(room.exits)){
 const target=byId.get(targetId);if(!target)continue;
 const pair=[room.id,targetId].sort().join('|');if(edgePairs.has(pair))continue;edgePairs.add(pair);
 const a=point(room),b=point(target),line=document.createElementNS(ns,'line');
 for(const [name,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(name,value);
 line.classList.add('edge');if(direction.includes('east')&&direction.includes('north')||direction.includes('east')&&direction.includes('south')||direction.includes('west')&&direction.includes('north')||direction.includes('west')&&direction.includes('south'))line.classList.add('diagonal');
 edgeLayer.append(line);
}

const roomNodes=new Map();
for(const room of data.rooms){
 const p=point(room),group=document.createElementNS(ns,'g'),circle=document.createElementNS(ns,'circle'),title=document.createElementNS(ns,'title');
 group.classList.add('room-node');group.dataset.id=room.id;group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`${room.title}, ${room.id}`);
 circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r',4);circle.classList.add('room');if(room.source_label_for_reference_only)circle.classList.add('labelled');
 title.textContent=`${room.title} — ${room.id}`;circle.append(title);group.append(circle);roomLayer.append(group);roomNodes.set(room.id,{group,circle,room});
 if(room.source_label_for_reference_only){const label=document.createElementNS(ns,'text');label.setAttribute('x',p.x+7);label.setAttribute('y',p.y-7);label.textContent=room.title;label.classList.add('map-label');labelLayer.append(label)}
 group.addEventListener('click',()=>selectRoom(room.id));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectRoom(room.id)}});
}

const numericId=id=>Number(id.split('#')[1]);
for(const room of [...data.rooms].sort((a,b)=>numericId(a.id)-numericId(b.id))){
 const label=`${room.title} — ${room.id}`;
 for(const select of [fromSelect,toSelect]){const option=document.createElement('option');option.value=room.id;option.textContent=label;select.append(option)}
 const button=document.createElement('button');button.type='button';button.className='room-card';button.dataset.id=room.id;button.innerHTML=`<strong>${escapeHtml(room.title)}</strong><code>${escapeHtml(room.id)}</code><span>${escapeHtml(room.description)}</span>`;button.addEventListener('click',()=>{selectRoom(room.id);mapScroll.scrollIntoView({behavior:'smooth',block:'start'})});roomList.append(button);
}
fromSelect.value='WarpGaladonSeed#0';toSelect.value='WarpGaladonSeed#3';

let selectedId=null,currentRoute=null,zoom=1;
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function selectRoom(id){
 const room=byId.get(id);if(!room)return;selectedId=id;
 for(const entry of roomNodes.values())entry.circle.classList.toggle('selected',entry.room.id===id);
 $('#room-title').textContent=room.title;$('#room-id').textContent=room.id;$('#room-description').textContent=room.description;
 const exits=$('#room-exits');exits.replaceChildren();
 for(const [direction,target] of Object.entries(room.exits)){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=direction;dd.textContent=`${byId.get(target)?.title||target} — ${target}`;exits.append(dt,dd)}
 $('#use-start').disabled=false;$('#use-destination').disabled=false;
 const p=point(room),targetX=p.x*zoom-mapScroll.clientWidth/2,targetY=p.y*zoom-mapScroll.clientHeight/2;mapScroll.scrollTo({left:Math.max(0,targetX),top:Math.max(0,targetY),behavior:'smooth'});
}
function renderSearch(){
 const query=search.value.trim().toLowerCase();let count=0,first=null;
 for(const entry of roomNodes.values()){
  const room=entry.room,hay=`${room.id} ${room.title} ${room.description} ${room.source_node_id}`.toLowerCase(),match=query&&hay.includes(query);
  entry.circle.classList.toggle('match',Boolean(match));const card=roomList.querySelector(`[data-id="${CSS.escape(room.id)}"]`);if(card)card.hidden=Boolean(query&&!match);
  if(match){count++;first??=room}
 }
 if(!query)result.textContent=`${data.rooms.length} WARP snapshot rooms shown.`;else if(!count)result.textContent='No WARP room matches that text.';else result.textContent=`${count} match${count===1?'':'es'}; first: ${first.title} - ${first.id}.`;
}
function clearRoute(){routeLayer.replaceChildren();for(const entry of roomNodes.values())entry.circle.classList.remove('route','route-start','route-end')}
function renderRoute(){
 clearRoute();const route=planCandidateRoute(data,fromSelect.value,toSelect.value);currentRoute=route;
 routeOutput.value=route.copy_commands;copyRoute.disabled=!route.copy_commands;
 if(route.status==='UNKNOWN_ROOM')routeStatus.textContent='Unknown endpoint; no route produced.';
 else if(route.status==='UNREACHABLE_COMPONENT')routeStatus.textContent='These rooms are in separate snapshot components. No connection is invented.';
 else if(route.status==='SAME_ROOM')routeStatus.textContent='Start and destination are the same room: 0 movements.';
 else routeStatus.textContent=`Installed-release snapshot route: ${route.movement_count} movement${route.movement_count===1?'':'s'}. Preview only; this website is not connected to the running game and cannot execute movement.`;
 if(!route.steps.length)return;
 route.steps.forEach((id,index)=>{const entry=roomNodes.get(id);entry?.circle.classList.add('route');if(index===0)entry?.circle.classList.add('route-start');if(index===route.steps.length-1)entry?.circle.classList.add('route-end')});
 for(let index=0;index<route.steps.length-1;index++){
  const a=point(byId.get(route.steps[index])),b=point(byId.get(route.steps[index+1])),line=document.createElementNS(ns,'line');
  for(const [name,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(name,value);line.classList.add('route-edge');routeLayer.append(line);
 }
 selectRoom(route.to);
}
function applyZoom(next){
 zoom=Math.min(2.5,Math.max(.2,next));
 const labelsHidden=zoom<.38;
 svg.classList.toggle('compact-labels',labelsHidden);
 svg.style.width=`${Math.round(naturalWidth*zoom)}px`;
 svg.style.height=`${Math.round(naturalHeight*zoom)}px`;
 $('#zoom-value').textContent=`${Math.round(zoom*100)}%${labelsHidden?' · labels hidden':''}`;
}
function fitMap(){applyZoom((mapScroll.clientWidth-18)/naturalWidth);mapScroll.scrollTo({left:0,top:0})}
async function copyCandidateRoute(){
 const text=routeOutput.value;if(!text)return;let confirmed=false,fallbackSent=false;
 if(navigator.clipboard?.writeText)try{await Promise.race([navigator.clipboard.writeText(text).then(()=>{confirmed=true}),new Promise((_,reject)=>setTimeout(()=>reject(Error('clipboard timeout')),900))])}catch{}
 if(!confirmed){routeOutput.focus();routeOutput.select();fallbackSent=document.execCommand('copy');routeOutput.setSelectionRange(0,0)}
 routeStatus.textContent=confirmed
  ?`Copied ${currentRoute.movement_count} snapshot movements. This page cannot execute them.`
  :fallbackSent
   ?`Copy command sent for ${currentRoute.movement_count} snapshot movements; paste to confirm if the browser blocks clipboard access.`
   :'Copy was blocked; select the route text manually.';
}

search.addEventListener('input',renderSearch);$('#plan-route').addEventListener('click',renderRoute);$('#swap-route').addEventListener('click',()=>{[fromSelect.value,toSelect.value]=[toSelect.value,fromSelect.value];renderRoute()});
$('#use-start').addEventListener('click',()=>{if(selectedId){fromSelect.value=selectedId;renderRoute()}});$('#use-destination').addEventListener('click',()=>{if(selectedId){toSelect.value=selectedId;renderRoute()}});copyRoute.addEventListener('click',copyCandidateRoute);
$('#zoom-out').addEventListener('click',()=>applyZoom(zoom-.2));$('#zoom-in').addEventListener('click',()=>applyZoom(zoom+.2));$('#zoom-fit').addEventListener('click',fitMap);
window.addEventListener('resize',()=>{if(zoom<.8)fitMap()});
renderSearch();selectRoom(fromSelect.value);renderRoute();requestAnimationFrame(fitMap);
