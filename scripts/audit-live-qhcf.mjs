import fs from 'node:fs';
import path from 'node:path';

const base='https://topazcandy.com/qhcf/';
const indexResponse=await fetch(new URL('data/index.json',base));
if(!indexResponse.ok)throw Error(`Live index HTTP ${indexResponse.status}`);
const index=await indexResponse.json();
const previewFiles=fs.readdirSync(new URL('../qhcf/',import.meta.url)).filter(name=>name.endsWith('-preview.html'));
const targets=[...index.areas.map(area=>({kind:'area',title:area.title,path:`areas/${area.slug}.html`})),...previewFiles.map(file=>({kind:'preview',path:file})),{kind:'overview',path:''},{kind:'world',path:'world-map.html'},{kind:'academy',path:'academy-temple-coverage.html'}];
const results=[];
let cursor=0;
async function worker(){while(cursor<targets.length){const target=targets[cursor++],url=new URL(target.path,base);try{const response=await fetch(url),body=await response.text(),h1=body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim()||null;results.push({...target,url:String(url),status:response.status,correct_destination:target.kind!=='area'||h1===target.title,h1,has_overview:target.kind!=='area'||/href=["']\/qhcf\/["']/.test(body),has_world_map:target.kind!=='area'||/href=["']\/qhcf\/world-map\.html["']/.test(body)})}catch(error){results.push({...target,url:String(url),status:null,error:String(error)})}}}
await Promise.all(Array.from({length:10},worker));
results.sort((a,b)=>a.url.localeCompare(b.url));
const failures=results.filter(item=>item.status!==200||!item.correct_destination||!item.has_overview||!item.has_world_map);
const report={generated_at_utc:new Date().toISOString(),base,indexed_areas:index.areas.length,urls_checked:results.length,http_200:results.filter(x=>x.status===200).length,correct_area_destinations:results.filter(x=>x.kind==='area'&&x.correct_destination).length,failures,results};
if(process.argv[2]){fs.mkdirSync(path.dirname(path.resolve(process.argv[2])),{recursive:true});fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify({...report,results:undefined},null,2));
if(failures.length)process.exitCode=1;
