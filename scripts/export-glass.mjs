import {GLASS,createMesh,VERTEX,FRAGMENT} from '../assets/topaz/glass/geometry.mjs';
const mesh=createMesh();
process.stdout.write(JSON.stringify({config:GLASS,vertex:VERTEX,fragment:FRAGMENT,
  parameters:Buffer.from(mesh.parameters.buffer).toString('base64'),
  indices:Buffer.from(mesh.indices.buffer).toString('base64'),count:mesh.indices.length}));
