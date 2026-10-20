// Source-exact transcription of The Grove, revision 4971.
// Straight '-' and '|' room links are routable. Diagonals, arrows, secret
// passages, and every area-boundary crossing are drawn but never converted to
// movement commands without separate evidence.
export const anchors=[
 {id:'west-road',row:30,col:33,label:'Eastern Road - west exit (c33)'},
 {id:'east-road',row:30,col:55,label:'Eastern Road - east exit (c55)'},
 {id:'camp',row:18,col:33,label:"Traveler's Camp"},
 {id:'ash',row:14,col:36,label:'Great Ash Tree'},
 {id:'circle',row:14,col:39,label:'Before the Circle of Stones'},
 {id:'willow',row:16,col:36,label:'Great Willow Tree'},
 {id:'water',row:18,col:39,label:'Altar to Water'},
 {id:'hickory',row:20,col:42,label:'Great Hickory Tree'},
 {id:'earth',row:18,col:48,label:'Altar to Earth'},
 {id:'birch',row:14,col:51,label:'Great Birch Tree'},
 {id:'ranger',row:26,col:57,label:'Rangers Guild approach (U)'},
 {id:'void-clearing',row:8,col:63,label:'Clearing below The Void (+)'},
 {id:'secret-tunnel',row:10,col:61,label:'Secret Tunnel (+)'}
];
export const roomKey=(row,col)=>`${row}:${col}`;

// Coordinates are explicit so prose such as "The Tool Maker's Wagon" cannot
// accidentally become rooms. Every literal '+' is added from plus_cells.
const sourceRooms=[
 [1,45],[1,48],[1,53,'*'],[3,45],[3,48],
 [5,33],[5,36],[5,39],[5,42],[5,45],[5,48],
 [7,31],[7,38],[7,44],
 [8,7],[8,10],[8,13],
 [9,30],[9,33],[9,36,'G1'],[9,39],[9,42],[9,45],[9,48],[9,51],[9,53,'*'],
 [11,4,'@'],[11,7],[11,10,'G1'],[11,28,'@'],[11,31],
 [12,32,'G2'],[12,36],[12,39],[12,42],[12,45],[12,48],[12,51],[12,54],[12,61],
 [13,7,'G2'],
 [14,33],[14,36],[14,39],[14,42],[14,45],[14,48],[14,51],[14,54],
 [16,33],[16,36],[16,39],[16,42],[16,45],[16,48],[16,51],[16,54],
 [18,33],[18,36],[18,39],[18,42],[18,45],[18,48],[18,51],[18,54],
 [20,36],[20,39],[20,42],[20,45],[20,48],
 [22,39],[22,42],[22,45],[22,48],[22,57],
 [26,57]
];

export function sourceGraph(data){
 if(data.slug!=='the-grove'||data.source?.revision_id!==4971)throw Error('Unexpected Grove source revision');
 const at=(r,c)=>data.lines[r-1]?.[c-1]||' ',rooms=new Map(),edges=[];
 for(const [row,col,override] of sourceRooms){
  const ch=override||at(row,col);
  rooms.set(roomKey(row,col),{row,col,ch,id:`qhcf.area.the-grove.r${row}c${col}`});
 }
 for(const {row,column:col} of data.plus_cells)rooms.set(roomKey(row,col),{row,col,ch:'+',id:`qhcf.area.the-grove.r${row}c${col}`});
 for(const n of rooms.values()){
  const right=[...rooms.values()].filter(v=>v.row===n.row&&v.col>n.col).sort((a,b)=>a.col-b.col)[0];
  const width=n.ch.length;
  if(right&&Array.from({length:right.col-n.col-width},(_,i)=>at(n.row,n.col+width+i)).join('').match(/^-+$/))edges.push({from:roomKey(n.row,n.col),to:roomKey(right.row,right.col),command:'e'});
  const below=[...rooms.values()].filter(v=>v.col===n.col&&v.row>n.row).sort((a,b)=>a.row-b.row)[0];
  if(below&&Array.from({length:below.row-n.row-1},(_,i)=>at(n.row+i+1,n.col)).join('').match(/^\|+$/))edges.push({from:roomKey(n.row,n.col),to:roomKey(below.row,below.col),command:'s'});
 }
 for(const a of anchors)if(!rooms.has(roomKey(a.row,a.col)))throw Error(`Missing ${a.id}`);
 return {rooms,edges};
}

export function sourceConnectorSegments(data){
 const arrowV=new Set(['10:10','12:7']);
 return data.lines.slice(0,31).flatMap((line,index)=>[...line.slice(0,63)].flatMap((glyph,column)=>{
  const key=`${index+1}:${column+1}`;
  return '-|/\\>'.includes(glyph)||glyph==='v'&&arrowV.has(key)?[{row:index+1,column:column+1,glyph}]:[];
 }));
}

export function route(graph,from,to){
 if(!graph.rooms.has(from)||!graph.rooms.has(to))return null;
 const neighbors=new Map();for(const e of graph.edges)for(const [a,b,d] of [[e.from,e.to,e.command],[e.to,e.from,{e:'w',s:'n'}[e.command]]])neighbors.set(a,[...(neighbors.get(a)||[]),{to:b,d}]);
 const queue=[from],prev=new Map([[from,null]]);for(let i=0;i<queue.length;i++)for(const step of neighbors.get(queue[i])||[])if(!prev.has(step.to)){prev.set(step.to,{from:queue[i],d:step.d});queue.push(step.to)}
 if(!prev.has(to))return null;const rooms=[to],commands=[];let key=to;while(key!==from){const step=prev.get(key);commands.unshift(step.d);rooms.unshift(step.from);key=step.from}
 const grouped=[];for(const direction of commands){const last=grouped.at(-1);if(last?.direction===direction)last.count++;else grouped.push({direction,count:1})}
 return {rooms,commands,grouped,moves:commands.length};
}
