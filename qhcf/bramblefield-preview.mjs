// Literal chart transcription. Adjacent printed glyphs do not establish live MUD exits.
const NS='http://www.w3.org/2000/svg';
const svg=document.querySelector('#map'),viewport=document.querySelector('#viewport'),note=document.querySelector('#room-note');
const names={O:'Bramblefield Road',F:'Orum’s Field',G:'In the Wide-Bladed Grass',P:'Path to the River',E:'The Edge of Orum’s Field',W:'A Cluster of Wildflowers',M:'Farmers’ Market',S:'The Stump',B:'Barn',Z:'The Bazaar'};
const position=(r,c)=>({x:68+(c-24)*32,y:76+(r-3)*23});
const key=(r,c)=>`${r}:${c}`;
function element(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e}
function render(data){
 const lines=data.lines,nodes=new Map(),edges=[];
 for(let r=3;r<=39;r++){const line=lines[r-1]||'';for(let c=24;c<=42;c++){const ch=line[c-1];if(ch==='+'||names[ch])nodes.set(key(r,c),{r,c,ch,id:`qhcf.area.bramblefield-road.r${r}c${c}`})}}
 for(const n of nodes.values())for(const [dr,dc,glyph] of [[0,3,'--'],[2,0,'|']]){
  const other=nodes.get(key(n.r+dr,n.c+dc));if(!other)continue;
  const between=dr?lines[n.r]?.[n.c-1]:(lines[n.r-1]||'').slice(n.c,n.c+2);
  if(between===glyph)edges.push([n,other]);
 }
 svg.setAttribute('viewBox','0 0 760 970');
 const wires=element('g',{'aria-hidden':'true'});svg.append(wires);
 for(const [a,b] of edges){const p=position(a.r,a.c),q=position(b.r,b.c);wires.append(element('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:'connector'}))}
 let selected;
 for(const n of nodes.values()){
  const p=position(n.r,n.c),label=n.ch==='+'?'Unnamed source room':names[n.ch];
  const group=element('g',{class:`room${n.ch==='+'?'':' named'}`,id:n.id,tabindex:'0',role:'button','aria-label':`${label}, source row ${n.r} column ${n.c}`});
  group.append(element('circle',{cx:p.x,cy:p.y,r:n.ch==='+'?5:9}),element('circle',{cx:p.x,cy:p.y,r:16,class:'hit'}));
  if(n.ch!=='+'){const t=element('text',{x:p.x,y:p.y});t.textContent=n.ch;group.append(t)}
  const title=element('title');title.textContent=`${label} · row ${n.r}, column ${n.c}`;group.append(title);
  function choose(){selected?.classList.remove('selected');selected=group;group.classList.add('selected');note.textContent=`${label} · captured chart row ${n.r}, column ${n.c}. Live movement unverified.`}
  group.addEventListener('click',choose);group.addEventListener('focus',()=>{note.textContent=`${label} · captured chart row ${n.r}, column ${n.c}. Live movement unverified.`});group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}});
  svg.append(group);
  if(n.ch!=='+'&&!document.querySelector(`#landmarks button[data-letter="${n.ch}"]`)){
   const button=document.createElement('button');button.type='button';button.dataset.letter=n.ch;button.textContent=label;button.addEventListener('click',()=>{choose();group.focus();group.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'})});document.querySelector('#landmarks').append(button);
  }
 }
 const boundaries=[{text:'Eaststride Road ↑',href:'/qhcf/areas/eaststride-road.html',x:270,y:34},{text:'Voralian City ←',href:'/qhcf/areas/voralian-city.html',x:4,y:130},{text:'Voralia’s Tears ←',href:'/qhcf/areas/voralia-s-tears.html',x:4,y:430},{text:'Aldevari ↗',href:'/qhcf/aldevari-preview.html',x:610,y:695},{text:'Eastern Road ↓',href:'/qhcf/eastern-road-preview.html',x:205,y:958}];
 for(const b of boundaries){const a=element('a',{href:b.href,class:'edge-link','aria-label':`${b.text}, open map; crossing unresolved`});const t=element('text',{x:b.x,y:b.y,class:'edge-label'});t.textContent=b.text;a.append(t);svg.append(a)}
 let scale=1;function resize(){svg.style.width=`${760*scale}px`;svg.style.height=`${970*scale}px`;svg.style.marginLeft=760*scale<viewport.clientWidth?'auto':'0';svg.style.marginRight=760*scale<viewport.clientWidth?'auto':'0';svg.style.marginTop=`${Math.max(0,(viewport.clientHeight-970*scale)/2)}px`}
 function fit(){scale=Math.min(1,(viewport.clientWidth-12)/760,(viewport.clientHeight-12)/970);resize();viewport.scrollTo(0,0)}
 document.querySelector('#fit').addEventListener('click',fit);document.querySelector('#larger').addEventListener('click',()=>{scale=Math.min(2.5,scale*1.3);resize()});document.querySelector('#smaller').addEventListener('click',()=>{scale=Math.max(.25,scale/1.3);resize()});window.addEventListener('resize',fit);fit();
}
fetch('/qhcf/data/areas/bramblefield-road.json').then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()}).then(render).catch(()=>{note.textContent='Graphical data unavailable. Open the captured source or text record.'});
