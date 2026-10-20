import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {academyReferenceAreaPaths,enhancedAreaLinks} from '../qhcf/enhanced-area-links.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(repo,'qhcf');
const index=JSON.parse(fs.readFileSync(path.join(site,'data','index.json'),'utf8'));
const world=JSON.parse(fs.readFileSync(path.join(site,'data','world-map-links.json'),'utf8'));
const htmlFiles=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.name.endsWith('.html'))htmlFiles.push(file)}}walk(site);

function exactFile(relative){
 let here=site;
 for(const segment of relative.split('/').filter(Boolean)){
  const actual=fs.readdirSync(here).find(name=>name===segment);
  if(!actual)return false;
  here=path.join(here,actual);
 }
 return fs.existsSync(here)&&fs.statSync(here).isFile();
}
function text(html){return html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim()}

const dynamicFragmentRoutes=new Set([
 'eastern-road-preview.html#grove-west-turnoff','eastern-road-preview.html#grove-east-turnoff',
 'grove-preview.html#eastern-road-exits','past-grove-preview.html#void-markers',
 'western-shadow-sorcery-preview.html#source-grove-L16','western-shadow-sorcery-preview.html#source-grove-L12',
 'western-shadow-sorcery-preview.html#source-tower-L28'
]);
const broken=[],fragmentFailures=[],dynamicFragments=[],localReferences=[];
let neighborLinks=0;
for(const file of htmlFiles){
 const html=fs.readFileSync(file,'utf8');
 const rel=path.relative(site,file).replaceAll('\\','/');
 const ids=new Set([...html.matchAll(/\s(?:id|name)=["']([^"']+)["']/gi)].map(m=>m[1]));
 const base=`https://atlas.test/qhcf/${rel}`;
 for(const match of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/gi)){
  const raw=match[1].replaceAll('&amp;','&');
  if(/^(?:https?:|mailto:|data:|javascript:)/i.test(raw))continue;
  const url=new URL(raw,base);
  if(!url.pathname.startsWith('/qhcf/'))continue;
  let target=url.pathname.slice('/qhcf/'.length);
  if(!target||target.endsWith('/'))target+= 'index.html';
  target=decodeURIComponent(target);
  const exists=exactFile(target);
  localReferences.push({from:rel,raw,target,exists});
  if(!exists)broken.push({from:rel,raw,target,reason:'missing or wrong-case destination'});
  if(exists&&url.hash&&target.endsWith('.html')){
   const targetHtml=fs.readFileSync(path.join(site,...target.split('/')),'utf8');
   const targetIds=new Set([...targetHtml.matchAll(/\s(?:id|name)=["']([^"']+)["']/gi)].map(m=>m[1]));
   const fragment=decodeURIComponent(url.hash.slice(1));
   if(!targetIds.has(fragment)){
    const key=`${target}#${fragment}`;
    if(dynamicFragmentRoutes.has(key))dynamicFragments.push({from:rel,raw,target,fragment,handled_by_script:true});
    else fragmentFailures.push({from:rel,raw,target,fragment});
   }
  }
 }
 for(const block of html.matchAll(/<(?:nav|div)[^>]+class=["'][^"']*(?:edges|key-exits)[^"']*["'][^>]*>([\s\S]*?)<\/(?:nav|div)>/gi))neighborLinks+=[...block[1].matchAll(/<a\s/gi)].length;
}

const areaChecks=index.areas.map(area=>{
 const relative=`areas/${area.slug}.html`,html=fs.readFileSync(path.join(site,...relative.split('/')),'utf8');
 const h1=text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
 return {slug:area.slug,title:area.title,h1,has_overview:/href=["']\/qhcf\/["']/.test(html),has_world_map:/href=["']\/qhcf\/world-map\.html["']/.test(html),has_text:exactFile(`data/areas/${area.slug}.txt`),has_json:exactFile(`data/areas/${area.slug}.json`)};
});
const areaFailures=areaChecks.filter(a=>a.h1!==a.title||!a.has_overview||!a.has_world_map||!a.has_text||!a.has_json);
const previewFiles=fs.readdirSync(site).filter(name=>name.endsWith('-preview.html'));
const inbound=new Set(localReferences.filter(x=>x.exists).map(x=>x.target));
for(const destination of enhancedAreaLinks.values())inbound.add(destination.slice('/qhcf/'.length));
const orphanedPreviews=previewFiles.filter(file=>!inbound.has(file));
const represented=new Set(world.occurrences.filter(x=>x.destination).map(x=>x.destination));
const report={
 generated_at_utc:new Date().toISOString(),
 scope:'Static local HTML navigation plus generated index/world-chart link manifests; no travel edges inferred.',
 counts:{indexed_areas:index.areas.length,area_pages_checked:areaChecks.length,html_files_checked:htmlFiles.length,local_references_checked:localReferences.length,neighbor_area_links:neighborLinks,dedicated_preview_files:previewFiles.length,dedicated_source_mappings:enhancedAreaLinks.size,generic_fallback_areas:index.areas.length-enhancedAreaLinks.size,world_mapped_occurrences:world.summary.mapped_occurrences,world_unresolved_occurrences:world.summary.unresolved_occurrences,world_represented_index_areas:represented.size,academy_reference_area_pages:academyReferenceAreaPaths.size},
 dynamic_fragment_routes:dynamicFragments,
 failures:{broken_local_links:broken,fragment_failures:fragmentFailures,area_contract_failures:areaFailures,orphaned_preview_pages:orphanedPreviews},
 documented_unknown_world_destinations:world.summary.unresolved_preserved_targets,
 index_areas_not_on_historical_chart:world.summary.unrepresented_index_areas
};
const output=process.argv[2];
if(output){fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
console.log(JSON.stringify(report,null,2));
if(broken.length||fragmentFailures.length||areaFailures.length||orphanedPreviews.length)process.exitCode=1;
