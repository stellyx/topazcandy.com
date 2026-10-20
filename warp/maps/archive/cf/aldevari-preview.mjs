// Render only the captured ASCII chart; never infer an inter-area route from spacing.
const NS='http://www.w3.org/2000/svg';
const svg=document.querySelector('#map');
const viewport=document.querySelector('#viewport');
const note=document.querySelector('#room-note');
const names={A:'Gralan · pale white skull ring',D:'Dwarf · water canteen',s:'Sutton',S:'Southern gates',P:'Princess’s bedroom · Princess Renee, long white gown and rod of purity',T:'Throne room',J:'Jousting Arena · white, blue, silver and black knights',E:'Eastern gates',U:'Southwest tower',I:'Southeast tower',O:'Olgakar',V:'Vincent · merchant'};
const cell=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e};
const pos=(row,col)=>({x:24+(col-27)*24,y:60+(row-7)*22});
const key=(r,c)=>`${r}:${c}`;
const chart=lines=>lines.slice(6,39).map((line,i)=>({row:i+7,line}));
function render(data){
 const lines=data.lines, nodes=new Map(), edges=[];
 for(const {row,line} of chart(lines))for(let col=28;col<=Math.min(71,line.length);col++){
  const ch=line[col-1];if(ch==='+' || (names[ch] && !(row===40 && ch==='D')))nodes.set(key(row,col),{row,col,ch,id:`qhcf.area.aldevari.r${row}c${col}`});
 }
 // The map key starts after the chart. Only inspect coordinate-aligned glyph runs.
 for(const node of nodes.values()){
  for(const [dr,dc,pattern] of [[0,3,'--'],[3,0,'||'],[2,-2,'/']]){
   const other=nodes.get(key(node.row+dr,node.col+dc));if(!other)continue;
   let actual='';
   if(pattern==='/')actual=lines[node.row]?.[node.col-2]||' ';
   else for(let k=1;k<3;k++)actual+=(dr?lines[node.row-1+k]?.[node.col-1]:lines[node.row-1]?.[node.col-1+k])||' ';
   if(actual===pattern)edges.push([node,other]);
  }
 }
 svg.setAttribute('viewBox','0 0 1150 800');
 const wires=cell('g',{'aria-hidden':'true'});svg.append(wires);
 for(const [a,b] of edges){const p=pos(a.row,a.col),q=pos(b.row,b.col);wires.append(cell('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:`connector${a.row+2===b.row?' diagonal':''}`}))}
 let selected;
 for(const n of nodes.values()){
  const p=pos(n.row,n.col),label=n.ch==='+'?'Unnamed source room':names[n.ch];
  const group=cell('g',{class:`room${n.ch==='+'?'':' named'}`,id:n.id,tabindex:n.ch==='+'?'-1':'0',role:'button','aria-label':`${label}, source row ${n.row} column ${n.col}`});
  group.append(cell('circle',{cx:p.x,cy:p.y,r:n.ch==='+'?5:9}));group.append(cell('circle',{cx:p.x,cy:p.y,r:15,class:'hit'}));
  if(n.ch!=='+'){const t=cell('text',{x:p.x,y:p.y});t.textContent=n.ch;group.append(t)}
  const title=cell('title');title.textContent=`${label} · row ${n.row}, column ${n.col}`;group.append(title);
  function choose(){selected?.classList.remove('selected');selected=group;group.classList.add('selected');note.textContent=`${label} · captured chart row ${n.row}, column ${n.col}. Live movement unverified.`}
  group.addEventListener('click',choose);group.addEventListener('focus',()=>{note.textContent=`${label} · captured chart row ${n.row}, column ${n.col}. Live movement unverified.`});group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}});
  svg.append(group);
  if(n.ch!=='+'){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{choose();group.focus();group.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'})});document.querySelector('#landmarks').append(button)}
 }
 const boundaries=[{text:'Bramblefield Road ↖',href:'/warp/maps/archive/cf/bramblefield-preview.html',x:18,y:32},{text:'The Grove →',href:'/warp/maps/archive/cf/grove-preview.html',x:925,y:625},{text:'Eastern Road ↓',href:'/warp/maps/archive/cf/eastern-road-preview.html',x:200,y:765}];
 for(const b of boundaries){const a=cell('a',{href:b.href,class:'edge-link','aria-label':`${b.text}, open map; crossing unresolved`});const t=cell('text',{x:b.x,y:b.y,class:'edge-label'});t.textContent=b.text;a.append(t);svg.append(a)}
 let scale=1;function fit(){scale=Math.min(1,(viewport.clientWidth-12)/1150,(viewport.clientHeight-12)/800);resize();viewport.scrollTo(0,0)}
 function resize(){svg.style.width=`${1150*scale}px`;svg.style.height=`${800*scale}px`;svg.style.marginLeft=scale*1150<viewport.clientWidth?'auto':'0';svg.style.marginRight=scale*1150<viewport.clientWidth?'auto':'0';svg.style.marginTop=`${Math.max(0,(viewport.clientHeight-800*scale)/2)}px`}
 document.querySelector('#fit').addEventListener('click',()=>{fit();viewport.scrollTo(0,0)});
 document.querySelector('#larger').addEventListener('click',()=>{scale=Math.min(2.5,scale*1.3);resize()});
 document.querySelector('#smaller').addEventListener('click',()=>{scale=Math.max(.35,scale/1.3);resize()});
 window.addEventListener('resize',fit);
 fit();
}
fetch('/warp/maps/archive/cf/data/areas/aldevari.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()}).then(render).catch(()=>{note.textContent='Graphical data unavailable. Open the captured source map or text record using the links at right.'});
