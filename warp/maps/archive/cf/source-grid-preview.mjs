const NS='http://www.w3.org/2000/svg';
const directionNames={n:'north',s:'south',e:'east',w:'west'};

export function mountSourceGridPreview({
  dataUrl,expectedRevision,sourceGraph,route,anchors,roomKey,names={},
  width,height,position,boundaries=[],sourceDescription
}){
 const svg=document.querySelector('#map'),viewport=document.querySelector('#viewport'),note=document.querySelector('#room-note');
 const element=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e};
 fetch(dataUrl).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()}).then(data=>{
  if(data.source?.revision_id!==expectedRevision)throw Error('Unexpected source revision');
  const graph=sourceGraph(data),byAnchor=new Map(anchors.map(a=>[roomKey(a.row,a.col),a]));
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const defs=element('defs'),arrow=element('marker',{id:'source-route-arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:5,markerHeight:5,orient:'auto'});arrow.append(element('path',{d:'M 1 1 L 9 5 L 1 9 z',fill:'#ffd17e'}));defs.append(arrow);svg.append(defs);
  const wires=element('g',{'aria-hidden':'true'}),highlight=element('g',{'aria-hidden':'true'});svg.append(wires,highlight);
  for(const edge of graph.edges){const a=graph.rooms.get(edge.from),b=graph.rooms.get(edge.to),p=position(a),q=position(b);wires.append(element('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:'connector'}))}
  const controls=document.querySelector('#anchors'),fromField=document.querySelector('#from'),toField=document.querySelector('#to');let start=null,goal=null,selected=null,scale=1;
  function draw(){
   for(const room of svg.querySelectorAll('.room')){const key=room.dataset.key;room.classList.toggle('selected',key===selected);room.classList.toggle('route-start',key===start);room.classList.toggle('route-goal',key===goal)}
   fromField.value=start||'';toField.value=goal||'';document.querySelector('#flip').disabled=!(start&&goal);
   highlight.replaceChildren();const result=document.querySelector('#result'),path=start&&goal?route(graph,start,goal):null;result.hidden=!path;
   if(start&&goal&&!path)note.textContent='These rooms are not connected by printed chart lines. No route or commands are offered.';
   if(!path)return;
   for(let i=1;i<path.rooms.length;i++){const a=graph.rooms.get(path.rooms[i-1]),b=graph.rooms.get(path.rooms[i]),p=position(a),q=position(b);highlight.append(element('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:'route-line'}));highlight.append(element('line',{x1:p.x+(q.x-p.x)*.44,y1:p.y+(q.y-p.y)*.44,x2:p.x+(q.x-p.x)*.78,y2:p.y+(q.y-p.y)*.78,class:'route-arrow','marker-end':'url(#source-route-arrow)'}))}
   const label=key=>byAnchor.get(key)?.label||'Selected room';document.querySelector('#summary').textContent=`${path.moves} moves - ${label(start)} to ${label(goal)}`;
   document.querySelector('#grouped').textContent=path.grouped.map(({direction,count})=>`${count} ${directionNames[direction]}`).join(' - ')||'Already there';
   document.querySelector('#commands').value=path.commands.join(';;');note.textContent=`Highlighted path follows printed room connectors in revision ${expectedRevision}. Live movement and boundary crossings remain unverified.`;
  }
  function choose(key){selected=key;if(!start||goal){start=key;goal=null}else goal=key;draw()}
  for(const room of graph.rooms.values()){
   const p=position(room),key=roomKey(room.row,room.col),anchor=byAnchor.get(key),label=anchor?.label||names[room.ch]||'Unnamed source room';
   const group=element('g',{class:`room${anchor?' named':''}`,id:room.id,tabindex:anchor?'0':'-1',role:anchor?'button':'img','aria-label':`${label}, source row ${room.row} column ${room.col}`,'data-key':key});
   group.append(element('circle',{cx:p.x,cy:p.y,r:anchor?10:room.ch==='+'?5:7}),element('circle',{cx:p.x,cy:p.y,r:anchor?19:13,class:'hit'}));
   if(room.ch!=='+'){const t=element('text',{x:p.x,y:p.y});t.textContent=room.ch;group.append(t)}const title=element('title');title.textContent=`${label} - row ${room.row}, column ${room.col}`;group.append(title);
   group.addEventListener('pointerenter',()=>{note.textContent=`${label} - captured row ${room.row}, column ${room.col}`});
   if(anchor){group.addEventListener('click',()=>choose(key));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(key)}});group.addEventListener('focus',()=>{note.textContent=`${label} - captured row ${room.row}, column ${room.col}`})}svg.append(group);
  }
  for(const anchor of anchors){const key=roomKey(anchor.row,anchor.col),button=document.createElement('button');button.type='button';button.textContent=anchor.label;button.addEventListener('click',()=>{choose(key);document.getElementById(graph.rooms.get(key).id).focus()});controls.append(button);for(const field of [fromField,toField]){const option=document.createElement('option');option.value=key;option.textContent=anchor.label;field.append(option)}}
  fromField.addEventListener('change',()=>{start=fromField.value||null;selected=start;draw()});toField.addEventListener('change',()=>{goal=toField.value||null;selected=goal;draw()});document.querySelector('#flip').addEventListener('click',()=>{[start,goal]=[goal,start];selected=start;draw()});
  document.querySelector('#copy').addEventListener('click',async()=>{const box=document.querySelector('#commands'),feedback=document.querySelector('#copy-feedback');box.select();try{await navigator.clipboard.writeText(box.value);feedback.textContent='Copied. Paste to confirm your device accepted the commands.'}catch{feedback.textContent='Commands selected; press Ctrl+C or use Copy on your device.'}});
  for(const boundary of boundaries){const link=element('a',{href:boundary.href,class:'edge-link','aria-label':`${boundary.text}, open map; crossing unresolved`}),text=element('text',{x:boundary.x,y:boundary.y,class:'edge-label'});text.textContent=boundary.text;link.append(text);svg.append(link)}
  function resize(){svg.style.width=`${width*scale}px`;svg.style.height=`${height*scale}px`;svg.style.marginLeft=width*scale<viewport.clientWidth?'auto':'0';svg.style.marginRight=width*scale<viewport.clientWidth?'auto':'0';svg.style.marginTop=`${Math.max(0,(viewport.clientHeight-height*scale)/2)}px`}
  function fit(){scale=Math.min(1,(viewport.clientWidth-12)/width,(viewport.clientHeight-12)/height);resize();viewport.scrollTo(0,0)}
  document.querySelector('#fit').addEventListener('click',fit);document.querySelector('#larger').addEventListener('click',()=>{scale=Math.min(2.5,scale*1.3);resize()});document.querySelector('#smaller').addEventListener('click',()=>{scale=Math.max(.25,scale/1.3);resize()});window.addEventListener('resize',fit);fit();draw();note.textContent=sourceDescription;
 }).catch(()=>{note.textContent='Graphical data unavailable. Open the captured source or text record.'});
}
