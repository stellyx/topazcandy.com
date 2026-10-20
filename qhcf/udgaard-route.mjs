// Source-faithful orthogonal routing for QHCF Udgaard revision 4963.
// Diagonals, dense adjacent '+' cells, boundary labels, underground-river prose,
// doors/special exits, and spacing are not routes.
export const anchors=[
 {id:'ap-guild',row:8,col:29,label:'Anti-paladin guild'},
 {id:'pit',row:12,col:36,label:'Pit and healer'},
 {id:'cartographer',row:20,col:28,label:"Cartographer's Store"},
 {id:'sapphire-west',row:22,col:31,label:'Sapphire Lane, west'},
 {id:'paper-mill',row:22,col:46,label:'The Paper Mill'},
 {id:'jade-court',row:27,col:28,label:'Jade Court'},
 {id:'fountain',row:27,col:36,label:'Fountain'},
 {id:'bank',row:32,col:26,label:'Bank'},
 {id:'registry',row:34,col:33,label:'Registry'},
 {id:'diamond-south',row:36,col:36,label:'Diamond Boulevard, south'}
];
export const boundaries=[
 {text:'Northern Trails',href:'/qhcf/areas/a-northern-trail.html',x:345,y:25},
 {text:'Northern Mountains',href:'/qhcf/areas/the-northern-mountains.html',x:2,y:315},
 {text:'Udgaardian Plains',href:'/qhcf/areas/udgaardian-plains.html',x:700,y:315},
 {text:'Traveller',href:'/qhcf/areas/traveller.html',x:365,y:1015}
];
export const roomKey=(row,col)=>`${row}:${col}`;
const glyphs=new Set('+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
const connector=new Set(['-','|','/','\\']);

export function sourceGraph(data){
 if(data.slug!=='udgaard'||data.source?.revision_id!==4963)throw Error('Unexpected Udgaard source revision');
 const lines=data.lines,at=(r,c)=>lines[r-1]?.[c-1]||' ',rooms=new Map(),edges=[];
 for(let row=3;row<=49;row++)for(let col=19;col<=53;col++){
  // Printed avenue/"Foot" labels are prose, even when a letter happens to align
  // with a connector on the row above or below.
  if(row===5||row===7||row===40)continue;
  const ch=at(row,col);if(!glyphs.has(ch))continue;
  const adjacent=[[0,1],[0,-1],[1,0],[-1,0]].some(([dr,dc])=>connector.has(at(row+dr,col+dc)));
  if(ch==='+'||adjacent)rooms.set(roomKey(row,col),{row,col,ch,id:`qhcf.area.udgaard.r${row}c${col}`});
 }
 const values=[...rooms.values()];
 for(const room of values){
  const right=values.filter(n=>n.row===room.row&&n.col>room.col).sort((a,b)=>a.col-b.col)[0];
  if(right&&right.col>room.col+1&&[...Array(right.col-room.col-1)].every((_,i)=>at(room.row,room.col+i+1)==='-'))edges.push({from:roomKey(room.row,room.col),to:roomKey(right.row,right.col),command:'e'});
  const below=values.filter(n=>n.col===room.col&&n.row>room.row).sort((a,b)=>a.row-b.row)[0];
  if(below&&below.row>room.row+1&&[...Array(below.row-room.row-1)].every((_,i)=>at(room.row+i+1,room.col)==='|'))edges.push({from:roomKey(room.row,room.col),to:roomKey(below.row,below.col),command:'s'});
 }
 const plus=[...rooms.values()].filter(r=>r.ch==='+');
 if(plus.length!==94||plus.length!==data.plus_cells.length)throw Error('Udgaard plus inventory changed');
 for(const a of anchors)if(!rooms.has(roomKey(a.row,a.col)))throw Error(`Missing Udgaard anchor ${a.id}`);
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
