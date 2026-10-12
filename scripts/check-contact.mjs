import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { enquiryContext, prepareEnquiry, SERVICES } from '../contact/model.mjs';
import { prepareFeedback } from '../assets/topaz/feedback.mjs';
import { INTAKE_URL, intakeAccepted } from '../checkout/intake.mjs';
import { WEBSITE_PACKAGE, cleanDetail } from '../checkout/config.mjs';
import { messageLink } from '../showcase/clients/mj-holistic-studio/assets/finder.mjs';

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
const home=readFileSync('index.html','utf8');
const siteLinks=[...home.matchAll(/<a\b[^>]*>Show us your site[\s\S]*?<\/a>/g)].map(match=>match[0]);
assert.equal(siteLinks.length,2);
for(const link of siteLinks){
  assert.match(link,/href="https:\/\/topazcandy\.com\/contact\/\?service=web-presence&amp;intent=show-site#contact-form"/);
  assert.match(link,/target="_self"/);
}
assert.match(home,/class="button contact-email-button"[^>]*>[\s\S]*?Email Topaz Candy<\/a>/);
assert.ok(!home.includes('class="email-link"'));
for(const path of files('.').filter(path=>path.endsWith('.html')&&!path.startsWith('./templates/'))){
  for(const match of readFileSync(path,'utf8').matchAll(/<a\b[^>]*href="[^"]*\/contact\/[^>]*>/g)){
    assert.match(match[0],/href="https:\/\/topazcandy\.com\/contact\//,path);
    assert.match(match[0],/target="_self"/,path);
  }
}
assert.equal(messageLink({mode:'template'},'cut','new'),'https://topazcandy.com/contact/?service=website&template=hair#contact-form');
assert.ok(messageLink({mode:'mj',phone:'+15127169236'},'cut','new').startsWith('sms:+15127169236'));
assert.ok(home.indexOf('id="everything-we-do"')<home.indexOf('id="work"'));
assert.match(home,/class="button light" href="\/services\/">Everything we do/);
const contact=readFileSync('contact/index.html','utf8');assert.match(contact,/inputmode="url"/);assert.match(contact,/inputmode="email"/);assert.match(contact,/inputmode="tel"/);
assert.equal((contact.match(/<form\b/g)||[]).length,1);
assert.ok(!/localStorage|sessionStorage|window\.open|location\.(?:href|assign)\s*=|innerHTML/.test(readFileSync('contact/app.mjs','utf8')));
// Run the real contact-page initialization for a site-review arrival and a
// template enquiry. Both bind the existing sender without opening an app.
function enquiryFixture(search){
  const controls={service:{value:'',addEventListener(){}},notes:{placeholder:'Tell us about your project.',value:''}};
  const form={elements:controls};
  const nodes={'contact-form':form,'contact-title':{textContent:'Let’s talk about your project.'},'contact-intro':{textContent:'Send us a message.'},'contact-notes-label':{textContent:'What would you like help with?'},'contact-interest':{textContent:''}};
  let bound;
  vm.runInNewContext(readFileSync('contact/app.mjs','utf8').replace(/^import .*;\n/gm,''),{
    enquiryContext,SERVICES,prepareEnquiry,cleanDetail,WEBSITE_PACKAGE,URLSearchParams,
    location:{search,hash:'#contact-form'},document:{getElementById:id=>nodes[id]},history:{replaceState(){}},
    bindMessageForm:(form,options)=>{bound=options;}
  });
  return {controls,nodes,bound};
}
const site=enquiryFixture('?service=web-presence&intent=show-site');
assert.equal(site.nodes['contact-title'].textContent,'Let’s take a look at your site.');
assert.equal(site.controls.service.value,'web-presence');
assert.equal(site.bound.prepare({...base,service:'web-presence'},'TC-SITE-TEST').payload['Current website'],'https://example.com/services');
const shop=enquiryFixture('?service=website&template=form');
assert.ok(shop.nodes['contact-interest'].textContent.includes('Head Shop'));
assert.ok(shop.bound.prepare({...base,service:'website'},'TC-SHOP-TEST').payload['Website template'].includes('Head Shop'));
console.log(JSON.stringify({passed:true,pages,checks:'canonical same-tab enquiry routes, small secondary email button, direct site-review form, template/legacy inquiry paths, automatic feedback, validated input, fixed recipient, failures and duplicate/retry protection'}));
