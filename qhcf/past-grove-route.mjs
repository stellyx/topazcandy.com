// The Past Grove revision 4972: source glyphs and explicit straight connectors.
// Text labels and the external Void/road/canyon crossings are excluded.
export const anchors=[
 {id:'void',row:19,col:33,label:'The Void · eastern marker'},
 {id:'woods',row:19,col:30,label:'Clearing in the Woods'},
 {id:'moss',row:21,col:15,label:'Moss-covered Clearing'},
 {id:'canyon',row:15,col:15,label:'Edge of the Rock-Faced Canyon'},
 {id:'split',row:11,col:9,label:'Split in the Canyon'},
 {id:'mouth',row:3,col:5,label:'Rocky Gorge mouth · west'},
 {id:'woodland',row:21,col:9,label:'Woodland Grove'},
 {id:'bridge',row:25,col:21,label:'Rickety Bridge'},
 {id:'hidden',row:31,col:24,label:'Hidden Junction'},
 {id:'stream',row:33,col:33,label:'Crystal Stream'},
 {id:'baern',row:35,col:24,label:'Baern’s secluded clearing'},
 {id:'road',row:39,col:6,label:'Wagon-Marked Road approach'}
];
export const roomKey=(row,col)=>`${row}:${col}`;
const glyph=/[A-Z][a-z]?|[a-z]|1/g;
export function sourceGraph(data){
 if(data.slug!=='the-past-grove'||data.source?.revision_id!==4972)throw Error('Unexpected Past Grove source');
 const at=(r,c)=>data.lines[r-1]?.[c-1]||' ',rooms=new Map(),edges=[];
 for(let row=3;row<=39;row+=2){
  for(const match of data.lines[row-1].slice(0,43).matchAll(glyph)){
   const col=match.index+1;
   // Title lettering is printed in the open map field on these two rows.
   if((row===5&&col>5)||(row===11&&col>13))continue;
   rooms.set(roomKey(row,col),{row,col,ch:match[0],id:`qhcf.area.the-past-grove.r${row}c${col}`});
  }
 }
 for(const n of rooms.values()){
  const right=[...rooms.values()].filter(x=>x.row===n.row&&x.col>n.col).sort((a,b)=>a.col-b.col)[0];
  if(right&&Array.from({length:right.col-n.col-n.ch.length},(_,i)=>at(n.row,n.col+n.ch.length+i)).join('').match(/^-+$/))edges.push({from:roomKey(n.row,n.col),to:roomKey(right.row,right.col),command:'e'});
  const below=[...rooms.values()].filter(x=>x.col===n.col&&x.row>n.row).sort((a,b)=>a.row-b.row)[0];
  if(below&&Array.from({length:below.row-n.row-1},(_,i)=>at(n.row+i+1,n.col)).join('').match(/^\|+$/))edges.push({from:roomKey(n.row,n.col),to:roomKey(below.row,below.col),command:'s'});
 }
 for(const a of anchors)if(!rooms.has(roomKey(a.row,a.col)))throw Error(`Missing ${a.id}`);
 return {rooms,edges};
}
export function route(graph,from,to){
 if(!graph.rooms.has(from)||!graph.rooms.has(to))return null;
 const neighbors=new Map();for(const e of graph.edges)for(const [a,b,d] of [[e.from,e.to,e.command],[e.to,e.from,{e:'w',s:'n'}[e.command]]])neighbors.set(a,[...(neighbors.get(a)||[]),{to:b,d}]);
 const queue=[from],prev=new Map([[from,null]]);for(let i=0;i<queue.length;i++)for(const step of neighbors.get(queue[i])||[])if(!prev.has(step.to)){prev.set(step.to,{from:queue[i],d:step.d});queue.push(step.to)}
 if(!prev.has(to))return null;const rooms=[to],commands=[];let key=to;while(key!==from){const step=prev.get(key);commands.unshift(step.d);rooms.unshift(step.from);key=step.from}
 const grouped=[];for(const direction of commands){const last=grouped.at(-1);if(last?.direction===direction)last.count++;else grouped.push({direction,count:1})}
 return {rooms,commands,grouped,moves:commands.length};
}
