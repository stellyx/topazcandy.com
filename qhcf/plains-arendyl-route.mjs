// The Plains of Arendyl revision 4973: map glyphs and explicit straight connectors.
// External labels and their boundary crossings are intentionally excluded.
export const anchors=[
 {id:'delar',row:1,col:68,label:'Delar Tol approach'},
 {id:'valley',row:5,col:65,label:'Edge of the Valley'},
 {id:'high-road',row:5,col:53,label:'High Road junction'},
 {id:'forest-clearing',row:9,col:35,label:'Forest clearing'},
 {id:'wood-elf',row:9,col:41,label:'Sneering wood-elf'},
 {id:'river',row:11,col:47,label:'Riverbank'},
 {id:'maethien',row:13,col:11,label:'Maethien approach'},
 {id:'brush',row:11,col:23,label:'Cleared Brush'},
 {id:'plain-center',row:15,col:35,label:'Central plain'},
 {id:'stones',row:19,col:29,label:'Ancient Plain Stones'},
 {id:'past-grove-west',row:21,col:32,label:'Past Grove - west approach'},
 {id:'past-grove-east',row:21,col:41,label:'Past Grove - east approach'}
];
export const roomKey=(row,col)=>`${row}:${col}`;
const ranges=new Map([[1,[65,68]],[3,[65,68]],[5,[50,68]],[7,[32,62]],[9,[32,50]],[11,[17,47]],[13,[11,47]],[15,[20,47]],[17,[26,44]],[19,[29,41]],[21,[32,41]]]);
export function sourceGraph(data){
 if(data.slug!=='the-plains-of-arendyl'||data.source?.revision_id!==4973)throw Error('Unexpected Plains of Arendyl source');
 const at=(row,col)=>data.lines[row-1]?.[col-1]||' ',rooms=new Map(),edges=[];
 for(const [row,[start,end]] of ranges){for(const match of data.lines[row-1].slice(start-1,end).matchAll(/[A-Z]|[a-z]|1|\+/g)){const col=start+match.index;rooms.set(roomKey(row,col),{row,col,ch:match[0],id:`qhcf.area.the-plains-of-arendyl.r${row}c${col}`})}}
 for(const room of rooms.values()){
  const right=[...rooms.values()].filter(other=>other.row===room.row&&other.col>room.col).sort((a,b)=>a.col-b.col)[0];
  if(right&&Array.from({length:right.col-room.col-1},(_,i)=>at(room.row,room.col+i+1)).join('').match(/^-+$/))edges.push({from:roomKey(room.row,room.col),to:roomKey(right.row,right.col),command:'e'});
  const below=[...rooms.values()].filter(other=>other.col===room.col&&other.row>room.row).sort((a,b)=>a.row-b.row)[0];
  if(below&&Array.from({length:below.row-room.row-1},(_,i)=>at(room.row+i+1,room.col)).join('').match(/^\|+$/))edges.push({from:roomKey(room.row,room.col),to:roomKey(below.row,below.col),command:'s'});
 }
 for(const anchor of anchors)if(!rooms.has(roomKey(anchor.row,anchor.col)))throw Error(`Missing ${anchor.id}`);
 return {rooms,edges};
}
export function route(graph,from,to){
 if(!graph.rooms.has(from)||!graph.rooms.has(to))return null;
 const neighbors=new Map();for(const edge of graph.edges)for(const [a,b,direction] of [[edge.from,edge.to,edge.command],[edge.to,edge.from,{e:'w',s:'n'}[edge.command]]])neighbors.set(a,[...(neighbors.get(a)||[]),{to:b,direction}]);
 const queue=[from],previous=new Map([[from,null]]);for(let i=0;i<queue.length;i++)for(const step of neighbors.get(queue[i])||[])if(!previous.has(step.to)){previous.set(step.to,{from:queue[i],direction:step.direction});queue.push(step.to)}
 if(!previous.has(to))return null;const rooms=[to],commands=[];let key=to;while(key!==from){const step=previous.get(key);commands.unshift(step.direction);rooms.unshift(step.from);key=step.from}
 const grouped=[];for(const direction of commands){const last=grouped.at(-1);if(last?.direction===direction)last.count++;else grouped.push({direction,count:1})}return {rooms,commands,grouped,moves:commands.length};
}
