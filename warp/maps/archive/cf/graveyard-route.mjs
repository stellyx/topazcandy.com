// Source-faithful orthogonal routing for QHCF Graveyard revision 5045.
// The two printed "=" gate segments are rendered but deliberately emit no
// movement commands because the source does not document their interaction.
export const anchors=[
 {id:'mausoleum-foyer',row:9,col:10,label:'Foyer of the mausoleum'},
 {id:'mummy',row:7,col:17,label:'Mummy (beyond printed gate)'},
 {id:'caretaker',row:7,col:27,label:'Caretaker (keys)'},
 {id:'ghost-king',row:7,col:37,label:'Ghost of a king (beyond printed gate)'},
 {id:'fountain',row:17,col:27,label:'Fountain'},
 {id:'banshee',row:23,col:35,label:'Banshee'},
 {id:'holy-road-entrance',row:27,col:27,label:'Holy Road entrance'}
];
export const boundaries=[
 {text:'Holy Road (Galadon) - crossing unresolved',href:'/warp/maps/archive/cf/areas/galadon.html',x:270,y:603}
];
export const roomKey=(row,col)=>`${row}:${col}`;
const glyphs=new Set('+tTfbgmn');
const connector=new Set(['-','|','=']);

export function sourceGraph(data){
 if(data.slug!=='graveyard'||data.source?.revision_id!==5045)throw Error('Unexpected Graveyard source revision');
 const lines=data.lines,at=(row,col)=>lines[row-1]?.[col-1]||' ',rooms=new Map(),edges=[];
 for(let row=5;row<=27;row++)for(let col=1;col<=46;col++){
  const ch=at(row,col);if(!glyphs.has(ch))continue;
  const adjacent=[[0,1],[0,-1],[1,0],[-1,0]].some(([dr,dc])=>connector.has(at(row+dr,col+dc)));
  if(ch==='+'||adjacent)rooms.set(roomKey(row,col),{row,col,ch,id:`qhcf.area.graveyard.r${row}c${col}`});
 }
 const values=[...rooms.values()];
 for(const room of values){
  const right=values.filter(next=>next.row===room.row&&next.col>room.col).sort((a,b)=>a.col-b.col)[0];
  if(right&&Array.from({length:right.col-room.col-1},(_,i)=>at(room.row,room.col+i+1)).every(ch=>ch==='-'))
   edges.push({from:roomKey(room.row,room.col),to:roomKey(right.row,right.col),command:'e',gate:false});
  const below=values.filter(next=>next.col===room.col&&next.row>room.row).sort((a,b)=>a.row-b.row)[0];
  if(below){
   const between=Array.from({length:below.row-room.row-1},(_,i)=>at(room.row+i+1,room.col));
   if(between.every(ch=>ch==='|'||ch==='='))edges.push({from:roomKey(room.row,room.col),to:roomKey(below.row,below.col),command:'s',gate:between.includes('=')});
  }
 }
 const plus=[...rooms.values()].filter(room=>room.ch==='+');
 if(plus.length!==79||plus.length!==data.plus_cells.length)throw Error('Graveyard plus inventory changed');
 if(rooms.size!==102||edges.length!==109||edges.filter(edge=>edge.gate).length!==2)throw Error('Graveyard topology changed');
 for(const anchor of anchors)if(!rooms.has(roomKey(anchor.row,anchor.col)))throw Error(`Missing Graveyard anchor ${anchor.id}`);
 return {rooms,edges};
}

export function route(graph,from,to){
 if(!graph.rooms.has(from)||!graph.rooms.has(to))return null;
 const next=new Map();
 for(const edge of graph.edges.filter(edge=>!edge.gate))for(const [a,b,direction] of [[edge.from,edge.to,edge.command],[edge.to,edge.from,edge.command==='e'?'w':'n']])
  next.set(a,[...(next.get(a)||[]),{to:b,command:direction}]);
 const queue=[from],previous=new Map([[from,null]]);
 for(let i=0;i<queue.length;i++){const here=queue[i];if(here===to)break;for(const step of next.get(here)||[])if(!previous.has(step.to)){previous.set(step.to,{from:here,command:step.command});queue.push(step.to)}}
 if(!previous.has(to))return null;
 const rooms=[to],commands=[];let here=to;
 while(here!==from){const step=previous.get(here);commands.unshift(step.command);rooms.unshift(step.from);here=step.from}
 const grouped=[];for(const direction of commands){const last=grouped.at(-1);if(last?.direction===direction)last.count++;else grouped.push({direction,count:1})}
 return {rooms,commands,grouped,moves:commands.length};
}
