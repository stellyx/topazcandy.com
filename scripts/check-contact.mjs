import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { enquiryContext, prepareEnquiry, SERVICES } from '../contact/model.mjs';
import { prepareFeedback } from '../assets/topaz/feedback.mjs';
import { INTAKE_URL, intakeAccepted } from '../checkout/intake.mjs';

const context = enquiryContext(new URLSearchParams('service=seo&template=hair&recipient=elsewhere&amount=1'));
assert.deepEqual(context,{service:'seo',template:'hair'});
assert.deepEqual(enquiryContext(new URLSearchParams('service=__proto__&template=unknown')),{service:'web-presence',template:''});
const base = {contact:'Example Contact',email:'buyer@example.com',website:'example.com/services',notes:'',service:'seo'};
const enquiry = prepareEnquiry({...base,_cc:'elsewhere',_subject:'Changed',recipient:'elsewhere'},'TC-TEST-ENQ',context);
assert.equal(Object.keys(enquiry.errors).length,0);
assert.equal(enquiry.payload['Current website'],'https://example.com/services');
assert.equal(enquiry.payload['Requested service'],SERVICES.seo);
assert.ok(enquiry.payload['Website template'].includes('Crown and Calm'));
assert.equal(enquiry.payload._cc,undefined);
assert.equal(enquiry.payload.recipient,undefined);
assert.ok(enquiry.payload._subject.includes('TC-TEST-ENQ'));
assert.ok(enquiry.payload.Purpose.includes('No order'));
for (const patch of [{email:'bad'},{contact:''},{website:'javascript:alert(1)'},{website:'https://person:secret@example.com'},{website:'',notes:''},{phone:'one two three'}]) assert.ok(Object.keys(prepareEnquiry({...base,...patch},'TC-TEST-ENQ',context).errors).length);
assert.equal(Object.keys(prepareEnquiry({...base,website:'',notes:'Build a website for my business'},'TC-TEST-ENQ',context).errors).length,0);
for(const permission of [undefined,'yes']) {
  const feedback=prepareFeedback({comments:'Example test feedback',publication_permission:permission},'TC-TEST-FB');
  assert.equal(Object.keys(feedback.errors).length,0);
  assert.equal(feedback.payload.name,'Anonymous');
  assert.equal(feedback.payload.email,undefined);
  assert.equal(feedback.payload['Permission to publish comments and display name'],permission==='yes'?'Yes':'No');
}
assert.ok(prepareFeedback({comments:'   '},'TC-TEST-FB').errors.comments);
assert.ok(prepareFeedback({comments:'Example',email:'bad'},'TC-TEST-FB').errors.email);

// Exercise the real shared controller. Rejected mail never reports success,
// changes preserve entries, and retries carry the same request reference.
const source=readFileSync('assets/topaz/form.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
function formFixture({feedback=false,result={success:'true'},reject=false}={}) {
  const fields=feedback?{comments:'Example test feedback',email:'',name:'',rating:'',publication_permission:''}:{...base};
  const controls={},events={},button={textContent:'Send message',disabled:true};
  const status={textContent:'',dataset:{}};
  for(const name of Object.keys(fields)) controls[name]={disabled:false,validity:'',attrs:{},setCustomValidity(v){this.validity=v;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},closest(){return null;}};
  Object.assign(button,{setCustomValidity(){},removeAttribute(){}});
  const elements=Object.assign(Object.values(controls),controls);elements.push(button);
  const form={elements,querySelector(q){return q==='[data-form-status]'?status:button;},addEventListener(n,f){events[n]=f;},setAttribute(){},reportValidity(){return !Object.values(controls).some(c=>c.validity);}};
  let sends=0,payloads=[];
  const ctx={INTAKE_URL,intakeAccepted,AbortSignal,URLSearchParams,Date,crypto:{randomUUID(){return '12345678-1234-1234-1234-123456789012';}},FormData:class{*[Symbol.iterator](){yield*Object.entries(fields);}},fetch:async(url,options)=>{
    sends++;assert.equal(url,INTAKE_URL);assert.equal(options.credentials,'omit');assert.equal(options.headers['Content-Type'],undefined);
    payloads.push(Object.fromEntries(options.body));if(reject)throw Error('Unavailable');return {ok:true,json:async()=>result};
  }};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  ctx.bindMessageForm(form,{prepare:feedback?prepareFeedback:(raw,ref)=>prepareEnquiry(raw,ref,context),prefix:feedback?'FB':'ENQ'});
  return {fields,controls,events,button,status,payloads,get sends(){return sends;}};
}
for(const setting of [{result:{success:'false'}},{reject:true}]) {
  const f=formFixture(setting);await f.events.submit({preventDefault(){}});
  assert.equal(f.status.dataset.state,'error');assert.equal(f.fields.email,base.email);assert.equal(f.button.disabled,false);
  const ref=f.payloads[0]['Enquiry reference'];await f.events.submit({preventDefault(){}});assert.equal(f.payloads[1]['Enquiry reference'],ref);
}
for(const feedback of [false,true]) {
  const f=formFixture({feedback});
  await Promise.all([f.events.submit({preventDefault(){}}),f.events.submit({preventDefault(){}})]);
  assert.equal(f.sends,1);assert.equal(f.status.dataset.state,'success');assert.equal(f.button.disabled,true);
  await f.events.submit({preventDefault(){}});assert.equal(f.sends,1);
  if(feedback)f.fields.comments='Changed feedback';else f.fields.notes='A changed enquiry';
  f.events.input();await f.events.submit({preventDefault(){}});assert.equal(f.sends,2);
}
const invalid=formFixture();invalid.fields.email='bad';await invalid.events.submit({preventDefault(){}});assert.equal(invalid.sends,0);
const spam=formFixture();spam.fields._honey='bot';await spam.events.submit({preventDefault(){}});assert.equal(spam.sends,0);

function files(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.name==='.git'?[]:entry.isDirectory()?files(`${dir}/${entry.name}`):[`${dir}/${entry.name}`]); }
let pages=0;
for (const path of files('.').filter(p=>p.endsWith('.html'))) {
  if(path.includes('/showcase/clients/')||(path.includes('/templates/')&&!path.includes('/dist/template/')))continue;
  const html=readFileSync(path,'utf8');pages++;
  assert.ok(!/href="(?:mailto:andrew@topazcandy\.com|sms:\+15125532552)|action="mailto:/.test(html),path);
  assert.ok(!html.includes('Want to spend more money?'),path);
  for(const link of html.matchAll(/<a\b[^>]*href="[^"]*\/contact\/[^>]*>/g))assert.ok(!/target="_blank"/.test(link[0]),path);
}
const home=readFileSync('index.html','utf8');assert.match(home,/Show us your site/);assert.match(home,/href="\/contact\/\?service=web-presence#contact-form"/);
assert.ok(home.indexOf('id="everything-we-do"')<home.indexOf('id="work"'));
assert.match(home,/class="button light" href="\/services\/">Everything we do/);
const contact=readFileSync('contact/index.html','utf8');assert.match(contact,/inputmode="url"/);assert.match(contact,/inputmode="email"/);assert.match(contact,/inputmode="tel"/);
assert.equal((contact.match(/<form\b/g)||[]).length,1);
assert.ok(!/localStorage|sessionStorage|window\.open|location\.(?:href|assign)\s*=|innerHTML/.test(readFileSync('contact/app.mjs','utf8')));
console.log(JSON.stringify({passed:true,pages,checks:'all information routes stay on the website, short enquiry, automatic feedback, input validation, fixed recipient, delivery failures, duplicate blocking and retry preservation'}));
