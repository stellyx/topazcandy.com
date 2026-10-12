import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { enquiryContext, prepareEnquiry, SERVICES } from '../contact/model.mjs';
import { WEBSITE_PACKAGE, cleanDetail } from '../checkout/config.mjs';

const offers = ['ai-work-session', 'small-website-repair', 'lead-response-setup'];
const page = readFileSync('services/ai-work-session/index.html', 'utf8');
const contact = readFileSync('contact/index.html', 'utf8');
const app = readFileSync('contact/app.mjs', 'utf8');
const raw = {contact:'Example Contact', email:'example@example.com', notes:'Help me create a reply template. Tuesday, 2 pm UTC.', website:''};
for (const service of offers) {
  const context = enquiryContext(new URLSearchParams({service, amount:'1', recipient:'elsewhere'}));
  assert.deepEqual(context, {service, template:''});
  assert.ok(page.includes(`href="/contact/?service=${service}#contact-form"`));
  assert.ok(contact.includes(`<option value="${service}">`));
  const {errors,payload} = prepareEnquiry({...raw,service}, 'TC-TEST-OFFER', context);
  assert.deepEqual(errors,{});
  assert.equal(payload['Requested service'],SERVICES[service]);
  assert.equal(payload.amount,undefined);
  assert.equal(payload.recipient,undefined);
  assert.ok(payload.Purpose.includes('No order, appointment or payment'));
  const nodes = {
    'contact-title':{textContent:'Tell us what you have in mind.'},
    'contact-intro':{textContent:'Share your website or a few words about the project.'},
    'contact-notes-label':{textContent:'What would you like help with?'},
    'contact-interest':{textContent:''}
  };
  const changeHandlers = {};
  const form = {elements:{service:{value:'',addEventListener(name,callback){changeHandlers[name]=callback;}},notes:{value:'A note already entered',placeholder:'Tell us what you want to improve or create.'}}};
  nodes['contact-form']=form;
  let bound=0;
  vm.runInNewContext(app.replace(/^import .*;\n/gm,''),{
    enquiryContext,SERVICES,prepareEnquiry,cleanDetail,WEBSITE_PACKAGE,URLSearchParams,
    document:{getElementById(id){assert.ok(nodes[id],id);return nodes[id];}},
    location:{search:`?service=${service}`,hash:'',pathname:'/contact/'},
    history:{replaceState(){throw Error('No fragment should be rewritten');}},
    bindMessageForm(boundForm){assert.equal(boundForm,form);bound++;}
  });
  assert.equal(bound,1);
  assert.equal(form.elements.service.value,service);
  assert.equal(nodes['contact-interest'].textContent,SERVICES[service]);
  assert.notEqual(nodes['contact-title'].textContent,'Tell us what you have in mind.');
  assert.equal(form.elements.notes.value,'A note already entered');
  form.elements.service.value='seo';changeHandlers.change();
  assert.equal(nodes['contact-title'].textContent,'Tell us what you have in mind.');
  assert.equal(nodes['contact-interest'].textContent,SERVICES.seo);
  assert.equal(form.elements.notes.value,'A note already entered');
  form.elements.service.value=service;changeHandlers.change();
  assert.equal(nodes['contact-interest'].textContent,SERVICES[service]);
  assert.equal(form.elements.notes.value,'A note already entered');
}
assert.match(page,/\$99/);assert.match(page,/60 minutes/);assert.match(page,/\$99–\$199 USD/);
assert.match(page,/Software costs|software costs/);
assert.match(page,/Custom integrations/);
assert.ok(!/target=|mailto:|paypal|<form|<video|localStorage|sessionStorage/.test(page));
assert.match(readFileSync('index.html','utf8'),/id="ai-work-session"/);
assert.match(readFileSync('services/index.html','utf8'),/href="\/services\/ai-work-session\/"/);
assert.match(readFileSync('sitemap.xml','utf8'),/https:\/\/topazcandy.com\/services\/ai-work-session\//);
console.log(JSON.stringify({passed:true,checks:'three offer routes, fixed service payloads, no order or payment creation, context changes preserve notes, existing-service fallback, homepage/directory discovery'}));
