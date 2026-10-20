// Source-faithful orthogonal routing for QHCF Silverwood revision 5048.
// Diagonals, boundary labels, cottage/special-exit prose, and spacing are not routes.
export const anchors=[
 {id:'old-tree',row:7,col:23,label:'Old fallen tree'},
 {id:'heart',row:9,col:27,label:'Heart of Silverwood'},
 {id:'iron-statue',row:9,col:33,label:'Iron Statue'},
 {id:'pond',row:11,col:23,label:'Pond'},
 {id:'cottage-front',row:11,col:29,label:'In front of a small cottage'},
 {id:'altar',row:16,col:27,label:'Unusual rock altar'},
 {id:'web-cave',row:18,col:23,label:'Cave of webs'},
 {id:'hidden-canopy-west',row:36,col:33,label:'Hidden Canopy, west'},
 {id:'hidden-canopy-east',row:36,col:41,label:'Hidden Canopy, east'}
];
export const boundaries=[
 {text:'Galadon Outskirts',href:'/warp/maps/archive/cf/areas/outskirts-of-galadon.html',x:315,y:28},
 {text:'Feanwyyn Weald',href:'/warp/maps/archive/cf/areas/feanwyyn-weald.html',x:2,y:175},
 {text:'Emerald Forest',href:'/warp/maps/archive/cf/areas/ancient-emerald-forest.html',x:2,y:490},
 {text:'Violet Woodland',href:'/warp/maps/archive/cf/areas/the-violet-woodland.html',x:2,y:555},
 {text:'Goblin Village',href:'/warp/maps/archive/cf/areas/the-goblin-village.html',x:610,y:500},
 {text:"Targeth's Manor",href:'/warp/maps/archive/cf/areas/targeth-s-manor.html',x:610,y:555}
];
export const roomKey=(row,col)=>`${row}:${col}`;
const glyphs=new Set('+ACHEIOPvWL');
const connector=new Set(['-','|','/','\\']);

export function sourceGraph(data){
 if(data.slug!=='silverwood'||data.source?.revision_id!==5048)throw Error('Unexpected Silverwood source revision');
 const lines=data.lines,at=(r,c)=>lines[r-1]?.[c-1]||' ',rooms=new Map(),edges=[];
 for(let row=5;row<=38;row++)for(let col=10;col<=43;col++){
  const ch=at(row,col);if(!glyphs.has(ch))continue;
  const adjacent=[[0,1],[0,-1],[1,0],[-1,0]].some(([dr,dc])=>connector.has(at(row+dr,col+dc)));
  if(ch==='+'||adjacent)rooms.set(roomKey(row,col),{row,col,ch,id:`qhcf.area.silverwood.r${row}c${col}`});
 }
 const values=[...rooms.values()];
 for(const room of values){
  const right=values.filter(n=>n.row===room.row&&n.col>room.col).sort((a,b)=>a.col-b.col)[0];
  if(right&&[...Array(right.col-room.col-1)].every((_,i)=>at(room.row,room.col+i+1)==='-'))edges.push({from:roomKey(room.row,room.col),to:roomKey(right.row,right.col),command:'e'});
  const below=values.filter(n=>n.col===room.col&&n.row>room.row).sort((a,b)=>a.row-b.row)[0];
  if(below&&[...Array(below.row-room.row-1)].every((_,i)=>at(room.row+i+1,room.col)==='|'))edges.push({from:roomKey(room.row,room.col),to:roomKey(below.row,below.col),command:'s'});
 }
 const plus=[...rooms.values()].filter(r=>r.ch==='+');
 if(plus.length!==73||plus.length!==data.plus_cells.length)throw Error('Silverwood plus inventory changed');
 for(const a of anchors)if(!rooms.has(roomKey(a.row,a.col)))throw Error(`Missing Silverwood anchor ${a.id}`);
 return {rooms,edges};
}

export function route(graph,from,to){
 if(!graph.rooms.has(from)||!graph.rooms.has(to))return null;
 const next=new Map();for(const edge of graph.edges)for(const [a,b,d] of [[edge.from,edge.to,edge.command],[edge.to,edge.from,edge.command==='e'?'w':'n']])next.set(a,[...(next.get(a)||[]),{to:b,command:d}]);
 const queue=[from],previous=new Map([[from,null]]);
 for(let i=0;i<queue.length;i++){const here=queue[i];if(here===to)break;for(const step of next.get(here)||[])if(!previous.has(step.to)){previous.set(step.to,{from:here,command:step.command});queue.push(step.to)}}
 if(!previous.has(to))return null;
 const rooms=[to],commands=[];let here=to;while(here!==from){const step=previous.get(here);commands.unshift(step.command);rooms.unshift(step.from);here=step.from}
 const grouped=[];for(const direction of commands){const last=grouped.at(-1);if(last?.direction===direction)last.count++;else grouped.push({direction,count:1})}
 return {rooms,commands,grouped,moves:commands.length};
}
