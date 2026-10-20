import {mountSourceGridPreview} from '/warp/maps/archive/cf/source-grid-preview.mjs';
import {anchors,boundaries,roomKey,route,sourceGraph} from './graveyard-route.mjs';

const names={m:'Foyer of the mausoleum',n:'Mummy',g:'Ghost of a king',f:'Fountain',b:'Banshee',t:'Inside a tomb',T:'Evil tomb'};
mountSourceGridPreview({
 dataUrl:'/warp/maps/archive/cf/data/areas/graveyard.json',expectedRevision:5045,sourceGraph,route,anchors,roomKey,names,
 width:820,height:630,position:room=>({x:30+(room.col-9)*22,y:35+(room.row-5)*25}),boundaries,
 sourceDescription:'Orthogonal routes use printed - and | connectors in Graveyard revision 5045. The two = gates and the Holy Road boundary are displayed but excluded from command output.'
});
