import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visibleDesigns,nextDesign,bindPortfolio} from '../assets/topaz/portfolio-browser.mjs';
const html=readFileSync('index.html','utf8');
const cards=[...html.matchAll(/<article class="work-card[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
const designs=cards.map(card=>({key:card.match(/data-portfolio-design="([^"]+)"/)[1],category:card.match(/data-portfolio-category="([^"]+)"/)[1]}));
assert.ok(html.indexOf('role="tablist"')<html.indexOf('role="tabpanel"'),'Tab from selected thumbnail reaches its panel controls');
assert.equal(designs.length,12);assert.equal(new Set(designs.map(d=>d.key)).size,12);
assert.deepEqual(['services','creative','shops','learning'].map(c=>visibleDesigns(designs,c).length),[6,1,3,2]);
assert.equal(nextDesign(designs,'all','garden',-1),'tattoo');assert.equal(nextDesign(designs,'shops','dusk',1),'form');
assert.equal(cards.filter(c=>!/^<article[^>]*\shidden(?:\s|>)/.test(c)).length,1,'Only one card is initially laid out');
for(const [i,card]of cards.entries()){
 assert.match(card,/role="tabpanel"/);assert.match(card,new RegExp(`aria-labelledby="portfolio-tab-${designs[i].key}"`));
 assert.match(card,/<div class="portfolio-media"><a class="work-card-link"/);assert.ok(card.indexOf('</a>')<card.indexOf('class="work-meta"'),'Media click target has a valid independent boundary');
 assert.ok(!/<video[^>]*\ssrc=/.test(card),'No eager movie source');
}
assert.match(html,/@media\(max-width:760px\)\{\.home-page \.portfolio-stage>\.work-card\[hidden\]\{display:flex!important\}\}/,'No-JS fallback uses the same mobile stack');
assert.equal((html.match(/role="tab"/g)||[]).length,12);assert.equal((html.match(/tabindex="0"/g)||[]).length,1);
function element(dataset={}){return {dataset,hidden:false,tabIndex:-1,attrs:{},handlers:{},offsetLeft:0,offsetWidth:112,addEventListener(k,fn){this.handlers[k]=fn;},setAttribute(k,v){this.attrs[k]=v;},focus(options){this.focusOptions=options;},click(){this.handlers.click();}};}
const tabs=designs.map((d,i)=>Object.assign(element({designTab:d.key}),{offsetLeft:i*122}));
const panels=designs.map((d,i)=>{const panel=element({portfolioDesign:d.key,portfolioCategory:d.category,portfolioName:d.key});panel.hidden=i!==0;panel.pauses=0;panel.querySelectorAll=()=>[{pause(){panel.pauses++;}}];return panel;});
const filters=['all','services','creative','shops','learning'].map(c=>element({portfolioFilter:c}));
const prev=element(),next=element(),status=element();const rail={scrollLeft:0,clientWidth:320,scrollTo({left}){this.scrollLeft=left;}};
const root={querySelector(s){if(s==='[data-portfolio-rail]')return rail;if(s==='[data-portfolio-status]')return status;if(s==='[data-portfolio-previous]')return prev;if(s==='[data-portfolio-next]')return next;return tabs.find(t=>s===`[data-design-tab="${t.dataset.designTab}"]`);},querySelectorAll:s=>s==='[data-portfolio-filter]'?filters:panels};
let changes=0;const state=bindPortfolio(root,{dispatchEvent(event){assert.equal(event.type,'portfoliochange');changes++;}});
const selected=()=>panels.filter(p=>!p.hidden);assert.equal(selected().length,1);assert.equal(state.current,'garden');
tabs[8].click();assert.equal(state.current,'dusk');assert.equal(tabs[8].attrs['aria-selected'],'true');assert.equal(tabs[0].tabIndex,-1);assert.ok(panels[0].pauses>0);
filters[3].click();assert.equal(state.current,'dusk','Compatible filter keeps selection');assert.equal(tabs.filter(t=>!t.hidden).length,3);
next.click();assert.equal(state.current,'form');next.click();assert.equal(state.current,'shiro');prev.click();assert.equal(state.current,'form');
filters[2].click();assert.equal(state.current,'signal');assert.equal(prev.disabled,true);assert.equal(next.disabled,true);
filters[0].click();assert.equal(state.current,'signal');assert.equal(tabs.filter(t=>!t.hidden).length,12);
let prevented=false;tabs[6].handlers.keydown({key:'End',preventDefault(){prevented=true;}});assert.equal(state.current,'tattoo');assert.equal(prevented,true);assert.deepEqual(tabs[11].focusOptions,{preventScroll:true});assert.ok(rail.scrollLeft>0);
tabs[11].handlers.keydown({key:'Home',preventDefault(){}});assert.equal(state.current,'garden');assert.equal(rail.scrollLeft,0);
filters[4].click();assert.equal(state.current,'wonderbranch');tabs[5].handlers.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(state.current,'waypoint');
assert.equal(selected().length,1);assert.equal(tabs.filter(t=>t.tabIndex===0).length,1);assert.match(status.textContent,/2 of 2/);assert.ok(changes>=10);
const css=readFileSync('assets/topaz/portfolio-browser.css','utf8');assert.match(css,/\.work-card\[hidden\].*display:none!important/);assert.match(css,/overflow-x:auto/);assert.match(css,/touch-action:pan-x pan-y/);assert.match(css,/aspect-ratio:16\/10/);assert.match(css,/min-height:2\.9em/);assert.match(css,/min-height:44px/);
const js=readFileSync('assets/topaz/portfolio-browser.mjs','utf8');assert.doesNotMatch(js,/touchstart|touchmove|pointermove|scrollIntoView|fetch\(/,'Native rail scroll, no swipe hijacking or media requests');
console.log('PASS: 12 panels, one visible, category counts/filter retention, prev/next wrapping, keyboard arrows/Home/End, ARIA/roving focus, rail-only scrolling, inactive media pause, lazy movies, fixed media/copy dimensions. Real browser layout/device QA unavailable.');
