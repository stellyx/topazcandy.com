import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const targets=[
 'qhcf/areas/the-eastern-road.html','qhcf/areas/aldevari.html','qhcf/areas/bramblefield-road.html',
 'qhcf/areas/the-grove.html','qhcf/areas/the-past-grove.html','qhcf/areas/the-plains-of-arendyl.html',
 'qhcf/areas/a-wagon-marked-road.html','qhcf/galadon-preview.html','qhcf/eastern-road-preview.html',
 'qhcf/past-grove-preview.html'
];
const tag='<script type="module" src="/qhcf/enhanced-area-links.mjs?v=1"></script>';
for(const relative of targets){
 const file=path.join(root,relative),html=fs.readFileSync(file,'utf8');
 if(html.includes(tag))continue;
 if(!html.includes('</body>'))throw Error(`Missing body close in ${relative}`);
 fs.writeFileSync(file,html.replace('</body>',`${tag}</body>`));
}

const replacements=new Map([
 ['qhcf/western-shadow-sorcery-preview.html',[
  ['#source-grove-L19','#source-grove-L16'],['#source-grove-L15','#source-grove-L12']
 ]],
 ['qhcf/cross-area-preview.html',[
  ['Market Square is five east from the inside East Gate.','The inside East Gate is five east from Market Square.'],
  ['data-anchor="galadon.map.r51c36">Large Crossroads<','data-anchor="galadon.map.r51c36">Galadon Large Crossroads<'],
  ['data-anchor="eastern.map.c">C on Eastern Road<','data-anchor="eastern.map.c">Eastern Road Large Crossroads (C)<'],
  ['For Large Crossroads, Copy reported route includes open east after the fifth move.','For a route crossing the inside East Gate, Copy reported route includes open east after the fifth east move.']
 ]],
 ['tests/qhcf-eastern-road-preview.test.mjs',[
  ["'/qhcf/areas/the-grove.html'","'/qhcf/grove-preview.html'"],
  ['The Grove · west turnoff','The Grove · first entrance (Rangers Guild side)'],
  ['The Grove · east turnoff','The Grove · second entrance (Void side)']
 ]]
]);
for(const [relative,changes] of replacements){const file=path.join(root,relative);let text=fs.readFileSync(file,'utf8');for(const [from,to] of changes){if(!text.includes(from)&&!text.includes(to))throw Error(`Missing replacement target in ${relative}: ${from}`);text=text.split(from).join(to)}fs.writeFileSync(file,text)}
