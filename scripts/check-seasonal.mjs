import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/topaz/seasonal.js','utf8'),css=readFileSync('assets/topaz/seasonal.css','utf8');
function fixture(date='2026-10-13T04:00:00Z') {
 const nodes=[],events={};let now=date;
 function node(){const n={isConnected:true,style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},appendChild(){},remove(){this.isConnected=false;}};nodes.push(n);return n;}
 const document={hidden:false,currentScript:{src:'https://topazcandy.com/assets/topaz/seasonal.js?v=1'},documentElement:{classList:{toggle(){}}},head:node(),body:node(),createElement:node,getElementById:id=>nodes.find(n=>n.id===id&&n.isConnected),querySelector:()=>({getBoundingClientRect:()=>({bottom:114})}),querySelectorAll:()=>[],addEventListener:(e,f)=>events[e]=f};
 const window={scrollY:0,addEventListener:(e,f)=>events[e]=f};
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}}
 vm.runInNewContext(source,{document,window,Date:Clock,Intl,URL,Math,setInterval(){}});
 return {document,window,events,setDate:d=>{now=d;},nodes};
}
const f=fixture();const decor=f.document.getElementById('tc-season-decor');assert.equal(decor.style.top,'132px');assert.equal(decor.attrs['aria-hidden'],'true');assert.equal((decor.innerHTML.match(/<svg /g)||[]).length,1);
f.events.pageshow();assert.equal(f.nodes.filter(n=>n.isConnected&&n.id==='tc-season-decor').length,1);
f.window.scrollY=40;f.events.resize();assert.equal(decor.style.top,'172px');
assert.equal(f.window.TopazSeason.isActive(new Date('2026-11-01T04:59:59Z')),true);assert.equal(f.window.TopazSeason.isActive(new Date('2026-11-01T05:00:00Z')),false);
f.setDate('2026-11-01T05:00:00Z');f.events.focus();assert.equal(f.document.getElementById('tc-season-decor'),undefined);assert.equal(f.document.getElementById('tc-season-style'),undefined);
assert.equal(fixture('2026-11-02T00:00:00Z').document.getElementById('tc-season-decor'),undefined);
assert.doesNotMatch(source,/\.animate\(|tc-season-pair|tc-season-moon|createElement\('button'\)/);assert.doesNotMatch(css,/animation|opacity|filter/);assert.match(css,/pointer-events:none!important/);assert.match(css,/position:absolute/);
console.log('Seasonal checks passed: one static decorative pumpkin below header, no bats/animation/control, duplicate sync, resize, and November 1 Chicago expiry.');
