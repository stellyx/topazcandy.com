import {mountSourceGridPreview} from '/qhcf/source-grid-preview.mjs';
import {anchors,boundaries,roomKey,route,sourceGraph} from './silverwood-route.mjs';

const names={A:'Unusual rock altar',C:'Cottage front',H:'Heart of Silverwood',E:'Hidden Canopy',I:'Iron Statue',O:'Old fallen tree',P:'Pond',v:'Small cottage',W:'Cave of webs',L:'Unlabelled L room'};
mountSourceGridPreview({
 dataUrl:'/qhcf/data/areas/silverwood.json',expectedRevision:5048,sourceGraph,route,anchors,roomKey,names,
 width:760,height:900,position:room=>({x:45+(room.col-10)*19,y:45+(room.row-5)*24}),boundaries,
 sourceDescription:'Orthogonal routes use only printed - and | connectors in Silverwood revision 5048. Diagonals, cottage prose, and boundary crossings remain unresolved.'
});
