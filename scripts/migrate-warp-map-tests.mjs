import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=path.join(root,'tests');
const changed=[];
for(const name of fs.readdirSync(tests).filter(name=>name.startsWith('qhcf-')&&name.endsWith('.test.mjs')&&name!=='qhcf-ranking-items.test.mjs')){
 const target=path.join(tests,name),before=fs.readFileSync(target,'utf8');
 const after=before.replaceAll('../qhcf/','../warp/maps/archive/cf/')
  .replaceAll('/qhcf/','/warp/maps/archive/cf/')
  .replaceAll('/warp/maps/archive/cf/references/','/qhcf/references/')
  .replaceAll('/warp/maps/archive/cf/academy-temple-coverage.html','/qhcf/academy-temple-coverage.html');
 if(after!==before){fs.writeFileSync(target,after);changed.push(name)}
}
const academy=path.join(tests,'academy-presentation.test.mjs'),before=fs.readFileSync(academy,'utf8');
const after=before.replace("path.join(root, 'qhcf/index.html')","path.join(root, 'warp/maps/archive/cf/index.html')");
if(after!==before){fs.writeFileSync(academy,after);changed.push('academy-presentation.test.mjs')}
console.log(JSON.stringify({changed:changed.length,files:changed.sort()},null,2));
