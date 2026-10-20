import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {academyReferenceAreaPaths,enhancedAreaLinks} from '../qhcf/enhanced-area-links.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=new Set([...enhancedAreaLinks.keys(),...academyReferenceAreaPaths]);
let changed=0;
for(const urlPath of pages){
 const file=path.join(root,urlPath.replace(/^\//,''));
 let html=fs.readFileSync(file,'utf8');
 const updated=/enhanced-area-links\.mjs/.test(html)
  ?html.replace(/enhanced-area-links\.mjs\?v=[^"']+/g,'enhanced-area-links.mjs?v=2')
  :html.replace('</body>','<script type="module" src="/qhcf/enhanced-area-links.mjs?v=2"></script></body>');
 if(updated!==html){fs.writeFileSync(file,updated);changed++}
}
console.log(`Ensured shared navigation on ${pages.size} evidence/preview source pages; ${changed} changed.`);
