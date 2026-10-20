export const DIRECTION_ORDER=['north','northeast','east','southeast','south','southwest','west','northwest','up','down'];

export function buildRoomIndex(data){
 const rooms=new Map(data.rooms.map(room=>[room.id,room]));
 if(rooms.size!==data.rooms.length)throw Error('Duplicate WARP room ID');
 for(const room of data.rooms)for(const [direction,target] of Object.entries(room.exits)){
  if(!DIRECTION_ORDER.includes(direction))throw Error(`Unsupported direction ${direction} on ${room.id}`);
  if(!rooms.has(target))throw Error(`Missing route target ${target} from ${room.id}`);
 }
 return rooms;
}

export function planCandidateRoute(data,fromId,toId){
 const rooms=buildRoomIndex(data);
 if(!rooms.has(fromId)||!rooms.has(toId))return {status:'UNKNOWN_ROOM',from:fromId,to:toId,steps:[],commands:[],copy_commands:'',movement_count:0,executable:false,live_gameplay_verified:false};
 if(fromId===toId)return {status:'SAME_ROOM',from:fromId,to:toId,steps:[fromId],commands:[],copy_commands:'',movement_count:0,executable:false,live_gameplay_verified:false};
 const queue=[fromId],seen=new Set(queue),previous=new Map();
 while(queue.length){
  const current=queue.shift(),room=rooms.get(current);
  const exits=Object.entries(room.exits).sort(([a],[b])=>DIRECTION_ORDER.indexOf(a)-DIRECTION_ORDER.indexOf(b));
  for(const [direction,target] of exits){
   if(seen.has(target))continue;
   seen.add(target);previous.set(target,{room:current,direction});queue.push(target);
   if(target===toId){queue.length=0;break}
  }
 }
 if(!previous.has(toId))return {status:'UNREACHABLE_COMPONENT',from:fromId,to:toId,steps:[],commands:[],copy_commands:'',movement_count:0,executable:false,live_gameplay_verified:false};
 const steps=[toId],commands=[];let cursor=toId;
 while(cursor!==fromId){const edge=previous.get(cursor);commands.unshift(edge.direction);cursor=edge.room;steps.unshift(cursor)}
 return {status:'CANDIDATE_ROUTE',from:fromId,to:toId,steps,commands,copy_commands:commands.join(';;'),movement_count:commands.length,requires_directions_11:commands.some(command=>command==='southwest'||command==='northeast'),executable:false,live_gameplay_verified:false};
}
