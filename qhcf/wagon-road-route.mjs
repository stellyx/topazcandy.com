// A Wagon-Marked Road revision 4977: the 20 literal road rooms and 19 printed connectors.
// Labeled area branches are links only; their crossing moves are not inferred.
export const anchors=[
 {id:'galadon',row:7,col:23,label:'Galadonian Settlement approach'},
 {id:'maethien',row:7,col:38,label:'Maethien turnoff'},
 {id:'citadel-west',row:7,col:41,label:'Citadel - west turnoff'},
 {id:'citadel-east',row:7,col:68,label:'Citadel - east turnoff'},
 {id:'past-grove',row:7,col:77,label:'Past Grove turnoff'},
 {id:'east-end',row:7,col:80,label:'Eastern road end'}
];
export const roomKey=(row,col)=>`${row}:${col}`;
export function sourceGraph(data){
 if(data.slug!=='a-wagon-marked-road'||data.source?.revision_id!==4977)throw Error('Unexpected Wagon-Marked Road source');
 const rooms=new Map(),edges=[];
 for(const cell of data.plus_cells){const {row,column:col}=cell;rooms.set(roomKey(row,col),{row,col,ch:'+',id:`qhcf.area.a-wagon-marked-road.r${row}c${col}`})}
 const ordered=[...rooms.values()].sort((a,b)=>a.col-b.col);for(let i=1;i<ordered.length;i++){const a=ordered[i-1],b=ordered[i],between=data.lines[6].slice(a.col,b.col-1);if(between!=='--')throw Error(`Unsupported road span ${a.col}-${b.col}`);edges.push({from:roomKey(a.row,a.col),to:roomKey(b.row,b.col),command:'e'})}
 for(const anchor of anchors)if(!rooms.has(roomKey(anchor.row,anchor.col)))throw Error(`Missing ${anchor.id}`);
 return {rooms,edges};
}
export function route(graph,from,to){
 if(!graph.rooms.has(from)||!graph.rooms.has(to))return null;const a=graph.rooms.get(from),b=graph.rooms.get(to),ordered=[...graph.rooms.values()].sort((x,y)=>x.col-y.col),start=ordered.findIndex(room=>room.col===a.col),end=ordered.findIndex(room=>room.col===b.col),step=start<=end?1:-1,command=step===1?'e':'w',rooms=[];for(let i=start;;i+=step){rooms.push(roomKey(ordered[i].row,ordered[i].col));if(i===end)break}const commands=Array.from({length:Math.abs(end-start)},()=>command),grouped=commands.length?[{direction:command,count:commands.length}]:[];return {rooms,commands,grouped,moves:commands.length};
}
