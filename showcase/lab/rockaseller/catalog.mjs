export const ROCKS=Object.freeze([
 {id:'001',name:'The Original',remark:'A rock. In its original format.',color:[151,147,135],shape:[1.25,.83,.88],seed:4},
 {id:'002',name:'The Wide One',remark:'More horizontal. Equally rock.',color:[139,145,139],shape:[1.4,.64,.87],seed:12},
 {id:'003',name:'The Other One',remark:'For people who didn’t like the first two.',color:[163,140,120],shape:[.94,1.05,.86],seed:23}
]);
export const FATES=Object.freeze([
 {id:'keep',name:'Leave it alone',note:'A rock, left to its own devices.',price:0},
 {id:'lake',name:'Throw in a lake',note:'One splash. The lake keeps it.',price:300},
 {id:'smash',name:'Smashed',note:'One rock. Several smaller opinions.',price:200},
 {id:'grind',name:'Ground',note:'For those who prefer their rock powdered.',price:500},
 {id:'stranger',name:'Given to a random stranger',note:'Offered to someone. They may decline.',price:700},
 {id:'office',name:'Dropped randomly in an office',note:'An unexpected addition to a consenting office.',price:1200},
 {id:'custom',name:'Custom request',note:'Your rock. Your highly specific idea.',price:5000}
]);
export const BASE_PRICE=25,WAX_PRICE=400;
export const money=cents=>'$'+(cents/100).toFixed(2);
export function normalize(value={}){return {rock:ROCKS.some(r=>r.id===value.rock)?value.rock:'001',wax:value.wax===true,fate:FATES.some(f=>f.id===value.fate)?value.fate:'keep',custom:typeof value.custom==='string'?value.custom.slice(0,1000):''}}
export function quote(raw){const state=normalize(raw),rock=ROCKS.find(r=>r.id===state.rock),fate=FATES.find(f=>f.id===state.fate);return {state,rock,fate,lines:[{name:'Rock '+rock.id+' · '+rock.name,price:BASE_PRICE},...(state.wax?[{name:'Wash and wax',price:WAX_PRICE}]:[]),{name:fate.name,price:fate.price}],total:BASE_PRICE+(state.wax?WAX_PRICE:0)+fate.price}}
export function specText(raw){const q=quote(raw);return ['ROCKASELLER','Ordinary rocks. Optional consequences.','',...q.lines.map(x=>x.name+'  '+money(x.price)),...(q.state.fate==='custom'?['','Custom request: '+q.state.custom]:[]),'','Total: '+money(q.total),'','Material: rock','Power source: none','Subscription required: no','Firmware updates: unlikely','','Configuration preview. Draft prices. No order or payment.','Digital display models are not scans of sale inventory.'].join('\n')}
