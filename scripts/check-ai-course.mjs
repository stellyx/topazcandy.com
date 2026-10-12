import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COPY, COURSE, WEEKS, makePrompt } from '../30-day-ai/content.mjs';
import { prepareEnrollment, createEnrollmentSender } from '../30-day-ai/enrollment.mjs';

assert.equal(COURSE.price,450);
assert.equal(COURSE.delivery,'in-person');
assert.equal(COURSE.paymentUrl,null);
assert.equal(COURSE.nextCohort,null);
assert.deepEqual(Object.keys(COPY.en).sort(),Object.keys(COPY.es).sort());
assert.equal(WEEKS.length,4);
assert.deepEqual(WEEKS.flatMap(w=>w.lessons).map(l=>l.n),[1,2,3,4,5,6,7,8]);
for(const t of Object.values(COPY))for(const [key,value]of Object.entries(t))assert.ok(typeof value==='string'&&value.trim(),key);
const student={contact:'Test Student',email:'test@example.com',language:'es',level:'new',consent:'on',notes:'A practice website.',_honey:''};
const good=prepareEnrollment({...student,recipient:'elsewhere',amount:1,_subject:'Changed',_cc:'elsewhere'},'TC-TEST-AI','es');
assert.deepEqual(good.errors,{});
assert.equal(good.payload['Course price'],'$450 USD per student');
assert.equal(good.payload['Preferred language'],'Spanish');
assert.equal(good.payload.recipient,undefined);
assert.equal(good.payload._cc,undefined);
assert.ok(good.payload._subject.includes('TC-TEST-AI'));
assert.ok(good.payload.Purpose.includes('No seat, order or payment'));
for(const patch of [{contact:''},{email:'bad'},{language:'other'},{consent:''},{phone:'not a number'},{_honey:'bot'}]){
  const bad=prepareEnrollment({...student,...patch},'TC-TEST-AI','en');assert.ok(Object.keys(bad.errors).length,JSON.stringify(patch));
}
assert.equal(prepareEnrollment({...student,email:'bad'},'TC-TEST-AI','es').errors.email,COPY.es.errEmail);
assert.equal(prepareEnrollment({...student,phone:'+1 512 555 0100'},'TC-TEST-AI').errors.phone,undefined);
assert.equal(prepareEnrollment({...student,notes:'x'.repeat(1400)},'TC-TEST-AI').payload['Student question'].length,1200);

let sends=0, refs=0, fail=true;const payloads=[];
const sender=createEnrollmentSender({referenceFactory:()=> 'TC-TEST-'+(++refs),send:async payload=>{
  sends++;payloads.push(payload);if(fail)throw Error('Delivery unavailable');
}});
assert.equal((await sender.submit({...student,email:'bad'},'en')).state,'invalid');assert.equal(sends,0);
const first=await sender.submit(student,'en');assert.equal(first.state,'failed');
const second=await sender.submit(student,'es');assert.equal(second.state,'failed');assert.equal(first.reference,second.reference);
assert.equal(sender.busy,false);
fail=false;
const success=await sender.submit(student,'es');assert.equal(success.state,'received');assert.equal(success.reference,first.reference);
assert.equal((await sender.submit(student,'es')).state,'received');assert.equal(sends,3);
await sender.submit({...student,notes:'A changed question'},'en');assert.equal(sends,4);assert.equal(refs,3);

let release;let count=0;
const pending=createEnrollmentSender({referenceFactory:()=> 'TC-PENDING',send:()=>{count++;return new Promise(resolve=>{release=resolve;});}});
const running=pending.submit(student,'en');
assert.equal(pending.busy,true);assert.equal((await pending.submit(student,'en')).state,'busy');assert.equal(count,1);
release();assert.equal((await running).state,'received');assert.equal(pending.busy,false);
for(const language of ['en','es']) {
  for(const kind of ['everyday','website','workflow'])assert.ok(makePrompt('My business',kind,language).length>150);
  assert.equal(makePrompt(' ','website',language),'');
  const path=language==='en'?'30-day-ai/index.html':'30-day-ai/es/index.html';
  const html=readFileSync(path,'utf8');
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.equal((html.match(/<form\b/g)||[]).length,1);
  assert.match(html,new RegExp('<html lang="'+language+'"'));
  for(const [,key]of html.matchAll(/data-i18n="([^"]+)"/g))assert.ok(Object.hasOwn(COPY[language],key),key);
  assert.ok(!html.includes('undefined'));
  assert.ok(html.includes('inputmode="email"'));assert.ok(html.includes('inputmode="tel"'));
  assert.ok(html.includes(COURSE.routes[language]+'#enroll'));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]);
  assert.equal(schema.offers.price,450);assert.equal(schema.provider.name,'Topaz Candy LLC');
  assert.ok(html.includes(COURSE.workbooks.en)&&html.includes(COURSE.workbooks.es));
}
const app=readFileSync('30-day-ai/app.mjs','utf8');
assert.ok(app.includes("wave.setAttribute('scale'"));
assert.ok(!app.includes('rotate('));
assert.ok(app.includes("form.elements.language.value=next"));
assert.ok(!/localStorage\.(?:setItem|getItem)\([^)]*(?:email|contact|notes)/.test(app));
console.log(JSON.stringify({passed:true,checks:'bilingual content and routes, fixed course price and recipient, enrollment validation, consent, delivery failure and retry, duplicate blocking, concurrent sends, prompt templates and public page structure'}));
