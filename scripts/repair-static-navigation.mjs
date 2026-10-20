import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','qhcf');
const rankingFile=path.join(root,'references','ranking-items.html');
let ranking=fs.readFileSync(rankingFile,'utf8');
for(const fragment of ['01-05','05-10','10-15','15-20','20-25','25-30','30-35','35-40','40-45','45-51','Notes']){
 ranking=ranking.replace(`href="#${fragment}"`,`href="http://wiki.qhcf.net/index.php?title=RankingList#${fragment}"`);
}
fs.writeFileSync(rankingFile,ranking);

const drogranFile=path.join(root,'areas','the-drogran-hills.html');
let drogran=fs.readFileSync(drogranFile,'utf8');
if(!/href="\/qhcf\/world-map\.html"/.test(drogran)){
 drogran=drogran.replace(/(<a href="\/qhcf\/">World overview<\/a>)/i,'$1<a href="/qhcf/world-map.html">World Map</a>');
 fs.writeFileSync(drogranFile,drogran);
}
console.log('Repaired preserved RankingList fragment destinations and the Drogran World Map backlink.');
