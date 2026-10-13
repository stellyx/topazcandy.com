import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/topaz/seasonal.js','utf8');
const css=readFileSync('assets/topaz/seasonal.css','utf8');
function fixture({date='2026-10-13T04:00:00Z',reduced=false,saveData=false,paused=false}={}) {
 const nodes=[],timers=new Map(),animations=[],events={},mediaEvents={};let next=0,now=date;
 function node(tag='div') {const n={tag,hidden:false,isConnected:true,children:[],attrs:{},style:{},addEventListener(k,f){this[k]=f;},setAttribute(k,v){this.attrs[k]=v;},appendChild(child){this.children.push(child);},remove(){this.isConnected=false;},querySelector(s){return nodes.find(x=>x.isConnected&&s==='.'+x.className);},getBoundingClientRect(){return {left:1340,top:106,width:76,height:76};},animate(frames,options){const a={frames,options,cancel(){this.cancelled=true;}};animations.push(a);return a;}};Object.defineProperty(n,'innerHTML',{set(v){this.html=v;if(v.includes('tc-season-pair')){for(let i=0;i<2;i++){const pair=node();pair.className='tc-season-pair';pair.hidden=true;}const moon=node();moon.className='tc-season-moon';}}});nodes.push(n);return n;}
 const footer=node('footer'),brand=node('a');
 const find=s=>nodes.filter(n=>n.isConnected&&s.split(',').some(t=>t==='#'+n.id||t==='.'+n.className));
 const document={hidden:false,currentScript:{src:'https://topazcandy.com/assets/topaz/seasonal.js?v=1'},head:node('head'),body:node('body'),documentElement:{classList:{toggle(){}}},getElementById:id=>nodes.find(n=>n.isConnected&&n.id===id),querySelector:s=>s.includes('.site-footer')?footer:s.includes('.topaz-brand')?brand:find(s)[0],querySelectorAll:find,createElement:node,addEventListener:(e,f)=>{events[e]=f;}};
 const media={matches:reduced,addEventListener:(e,f)=>{mediaEvents[e]=f;}};
 const connection={saveData,addEventListener(){}};
 const window={innerWidth:1440,innerHeight:1000,matchMedia:()=>media,addEventListener:(e,f)=>{events[e]=f;}};
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}}
 vm.runInNewContext(source,{window,document,navigator:{connection},sessionStorage:{getItem:()=>String(paused),setItem(){}},Date:Clock,Intl,URL,Math,setTimeout:(f,delay)=>{timers.set(++next,{f,delay});return next;},clearTimeout:id=>timers.delete(id),setInterval:()=>{}});
 return {nodes,document,window,events,media,mediaEvents,animations,timers,setDate:d=>{now=d;},tick(){const [id,t]=timers.entries().next().value;timers.delete(id);t.f();}};
}
const f=fixture();
assert.equal(f.document.querySelectorAll('.tc-season-pair').length,2);
assert.equal((f.document.getElementById('tc-season-decor').html.match(/class="tc-season-bat/g)||[]).length,4);
assert.equal(f.document.getElementById('tc-season-decor').attrs['aria-hidden'],'true');
assert.equal(f.timers.size,2);f.tick();assert.equal(f.animations.length,1);
assert.equal(f.animations[0].frames.length,76);assert(f.animations[0].options.duration>=20000);
assert(f.animations[0].frames.every(frame=>!frame.transform.includes('NaN')));
f.animations[0].onfinish();assert.equal(f.document.querySelectorAll('.tc-season-pair')[0].hidden,true);assert.equal(f.timers.size,2);
const button=f.document.getElementById('tc-season-toggle');button.click();assert.equal(f.timers.size,0);assert.equal(button.textContent,'Play bats');assert.equal(button.attrs['aria-pressed'],'true');
button.click();assert.equal(f.timers.size,2);f.events.pageshow();assert.equal(f.timers.size,2);assert.equal(f.document.querySelectorAll('.tc-season-pair').length,2);
f.document.hidden=true;f.events.visibilitychange();assert.equal(f.timers.size,0);f.document.hidden=false;f.events.visibilitychange();assert.equal(f.timers.size,2);
f.media.matches=true;f.mediaEvents.change();assert.equal(f.timers.size,0);assert.equal(button.hidden,true);
f.media.matches=false;f.mediaEvents.change();assert.equal(f.timers.size,2);f.events.resize();assert.equal(f.timers.size,2);
assert.equal(f.window.TopazSeason.isActive(new Date('2026-11-01T04:59:59Z')),true);
assert.equal(f.window.TopazSeason.isActive(new Date('2026-11-01T05:00:00Z')),false);
f.setDate('2026-11-01T05:00:00Z');f.events.focus();assert.equal(f.document.getElementById('tc-season-decor'),undefined);assert.equal(f.document.getElementById('tc-season-toggle'),undefined);assert.equal(f.timers.size,0);
for(const options of [{reduced:true},{saveData:true},{paused:true},{date:'2026-11-02T12:00:00Z'}])assert.equal(fixture(options).timers.size,0);
assert.match(css,/z-index:-1/);assert.match(css,/pointer-events:none!important/);assert.match(css,/prefers-reduced-motion/);assert.doesNotMatch(css,/filter:|opacity:/);
console.log('Seasonal checks passed: two pairs, smooth bounded flights/rests, pause/resume, duplicate sync, visibility, resize, reduced motion, data saver, and Chicago expiry.');
