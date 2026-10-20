// Conservative central-grid transcription of The Grove, revision 4971.
// This excludes caves, teleports, diagonal guild passages, the Void and
// boundary crossings; their matching rooms/commands are not established.
export const anchors=[
 {id:'south',row:30,col:33,label:'Western Eastern Road approach'},
 {id:'camp',row:18,col:33,label:'Traveler’s Camp'},
 {id:'ash',row:14,col:36,label:'Great Ash Tree'},
 {id:'circle',row:14,col:39,label:'Before the Circle of Stones'},
 {id:'willow',row:16,col:36,label:'Great Willow Tree'},
 {id:'water',row:18,col:39,label:'Altar to Water'},
 {id:'hickory',row:20,col:42,label:'Great Hickory Tree'},
 {id:'earth',row:18,col:48,label:'Altar to Earth'},
 {id:'birch',row:14,col:51,label:'Great Birch Tree'},
 {id:'ranger',row:26,col:57,label:'Ranger Guild approach'}
];
export const roomKey=(row,col)=>`${row}:${col}`;
const rowSet=[12,14,16,18,20,22,24,26,28,30],columns=[33,36,39,42,45,48,51,53,54,55,57];
const glyphs=new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ+tU');
export function sourceGraph(data){
 if(data.slug!=='the-grove'||data.source?.revision_id!==4971)throw Error('Unexpected Grove source revision');
 const at=(r,c)=>data.lines[r-1]?.[c-1]||' ',rooms=new Map(),edges=[];
 for(const row of rowSet)for(const col of columns){const ch=at(row,col);if(row===20&&col===53)continue; // T begins the Tool Maker's Wagon label
  if(glyphs.has(ch))rooms.set(roomKey(row,col),{row,col,ch,id:`qhcf.area.the-grove.r${row}c${col}`})}
 // The 2 at r12c33 is the second glyph of G2, an actual source room.
 rooms.set('12:33',{row:12,col:33,ch:'G2',id:'qhcf.area.the-grove.r12c33'});
 for(const n of rooms.values()){
  const sameRow=[...rooms.values()].filter(v=>v.row===n.row&&v.col>n.col).sort((a,b)=>a.col-b.col)[0];
  if(sameRow&&Array.from({length:sameRow.col-n.col-1},(_,i)=>at(n.row,n.col+i+1)).join('').match(/^-+$/))edges.push({from:roomKey(n.row,n.col),to:roomKey(sameRow.row,sameRow.col),command:'e'});
  const sameColumn=[...rooms.values()].filter(v=>v.col===n.col&&v.row>n.row).sort((a,b)=>a.row-b.row)[0];
  if(sameColumn&&Array.from({length:sameColumn.row-n.row-1},(_,i)=>at(n.row+i+1,n.col)).join('').match(/^\|+$/))edges.push({from:roomKey(n.row,n.col),to:roomKey(sameColumn.row,sameColumn.col),command:'s'});
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
