// Movement is inferred only for neighboring room glyphs joined by a printed
// connector in captured revision 5025. The live game has not been validated.
export const anchors=[
 {id:'stump',row:3,col:27,label:'The Stump'},
 {id:'market',row:3,col:33,label:'Farmers’ Market'},
 {id:'barn',row:7,col:24,label:'Barn'},
 {id:'stone-hill',row:9,col:42,label:'Watch Stone Hill branch'},
 {id:'river',row:17,col:24,label:'Path to the River'},
 {id:'wildflowers',row:23,col:33,label:'Cluster of Wildflowers'},
 {id:'aldevari',row:31,col:36,label:'Aldevari branch'},
 {id:'bazaar',row:33,col:33,label:'The Bazaar'},
 {id:'lane',row:39,col:27,label:'The Lane junction'}
];
export const roomKey=(row,col)=>`${row}:${col}`;
const glyphs=new Set('+OFGPEWMSBZ');
export function sourceGraph(data){
 if(data.slug!=='bramblefield-road'||data.source?.revision_id!==5025)throw Error('Unexpected Bramblefield source revision');
 const lines=data.lines,at=(r,c)=>lines[r-1]?.[c-1]||' ',rooms=new Map(),edges=[];
 for(let row=3;row<=39;row++)for(let col=24;col<=42;col++){
  const ch=at(row,col);
  // The M at r3c39 begins the word "Market", outside the chart.
  if(row===3&&col===39)continue;
  if(glyphs.has(ch))rooms.set(roomKey(row,col),{row,col,ch,id:`qhcf.area.bramblefield-road.r${row}c${col}`});
 }
 if([...rooms.values()].filter(r=>r.ch==='+').length!==data.plus_cells.length)throw Error('Plus inventory changed');
 for(const {row,col} of rooms.values())for(const [dr,dc,printed,command] of [[0,3,'--','e'],[2,0,'|','s']]){
  const next=roomKey(row+dr,col+dc);
  if(!rooms.has(next))continue;
  const between=dr?at(row+1,col):at(row,col+1)+at(row,col+2);
  if(between===printed)edges.push({from:roomKey(row,col),to:next,command});
 }
 for(const a of anchors)if(!rooms.has(roomKey(a.row,a.col)))throw Error(`Missing anchor ${a.id}`);
 return {rooms,edges};
}
export function route(graph,from,to){
 if(!graph.rooms.has(from)||!graph.rooms.has(to))return null;
 const next=new Map();for(const e of graph.edges){
  for(const [a,b,d] of [[e.from,e.to,e.command],[e.to,e.from,{e:'w',s:'n'}[e.command]]])next.set(a,[...(next.get(a)||[]),{to:b,command:d}]);
 }
 const queue=[from],previous=new Map([[from,null]]);
 for(let i=0;i<queue.length;i++){
  const here=queue[i];if(here===to)break;
  for(const step of next.get(here)||[])if(!previous.has(step.to)){previous.set(step.to,{from:here,command:step.command});queue.push(step.to)}
 }
 if(!previous.has(to))return null;
 const rooms=[to],commands=[];let here=to;
 while(here!==from){const step=previous.get(here);commands.unshift(step.command);rooms.unshift(step.from);here=step.from}
 const grouped=[];for(const d of commands){const last=grouped.at(-1);if(last?.direction===d)last.count++;else grouped.push({direction:d,count:1})}
 return {rooms,commands,grouped,moves:commands.length};
}
