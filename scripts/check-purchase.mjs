import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { WEBSITE_PACKAGE, templateKey, templateFromPayPalOption, paypalDetails, cleanDetail } from '../checkout/config.mjs';
import { INTAKE_URL, COUNTRY_CODES, validateIntake, intakePayload, intakeAccepted, addressRules, addressText, postalInputMode } from '../checkout/intake.mjs';

assert.equal(WEBSITE_PACKAGE.price, 450);
assert.equal(WEBSITE_PACKAGE.currency, 'USD');
assert.equal(WEBSITE_PACKAGE.maintenanceMonths, 3);
assert.equal(WEBSITE_PACKAGE.paypalUrl, 'https://www.paypal.com/cgi-bin/webscr');
assert.equal(WEBSITE_PACKAGE.paypalMode, 'hosted-button');
assert.equal(WEBSITE_PACKAGE.paypalButtonId, 'H48437LCHWWFQ');
assert.equal(INTAKE_URL, 'https://formsubmit.co/ajax/2dbdde9ca207c74c11f854daf548a85b');
assert.equal(new Set(COUNTRY_CODES).size, 249);
for (const input of ['__proto__', '../clients/mj-holistic-studio', 'https://example.com', null]) assert.equal(templateKey(input), 'carpet');
assert.equal(cleanDetail('  Good\u202e  Name\nHere '), 'Good NameHere');
assert.equal(Array.from(cleanDetail('🏡'.repeat(300), 80)).length, 80);
const base = {business:'Example Cleaning',contact:'Example Contact',email:'buyer@example.com',phone:'+1 (202) 555-0100',website:'https://example.com',notes:'Website setup',business_line1:'100 Example Street',business_line2:'Suite 1',business_city:'Example City',business_region:'Texas',business_postal:'78701',business_country:'US',billing_same:'on'};
const valid = validateIntake(base);
assert.equal(valid.valid,true);
assert.equal(valid.details.business_address.region,'TX');
assert.deepEqual(valid.details.billing_address, valid.details.business_address);
for (const key of Object.keys(WEBSITE_PACKAGE.templates)) {
  assert.equal(templateFromPayPalOption(WEBSITE_PACKAGE.templates[key].paypalOption), key);
  assert.ok(WEBSITE_PACKAGE.templates[key].paypalOption.length <= 64);
  const payload = intakePayload(key,valid.details,'TC-TEST-01');
  assert.equal(payload['Website design'],WEBSITE_PACKAGE.templates[key].paypalOption);
  assert.equal(payload['Order reference'],'TC-TEST-01');
  assert.equal(payload['Billing address'],payload['Business address']);
  assert.ok(payload['Business address'].includes('Suite 1'));
  assert.ok(payload['Payment status'].includes('not yet verified'));
  assert.equal(payload.email, 'buyer@example.com');
  assert.ok(!('_cc' in payload));
  const html = readFileSync(`showcase/lab/${key}/index.html`, 'utf8');
  const purchases = [...html.matchAll(/<a\b[^>]*data-website-purchase[^>]*>/g)].map(m => m[0]);
  assert.equal(purchases.length, 2, `${key}: footer and bottom-dock buying actions`);
  for (const tag of purchases) assert.ok(tag.includes(`href="https://topazcandy.com/checkout/?template=${key}"`));
  assert.ok(html.includes(`data-purchase-theme="${key}"`));
  assert.ok(!html.includes('Want to spend more money?'));
  assert.ok(!html.slice(0, html.indexOf('<main')).includes('data-website-purchase'));
}
for (const [field,value] of [['email','bad-address'],['business',''],['contact',''],['business_line1',''],['business_city',''],['business_country','XX'],['business_region','No State'],['business_postal','wrong'],['phone','phone'],['website','javascript:alert(1)']]) assert.ok(validateIntake({...base,[field]:value}).errors[field],field);
assert.equal(validateIntake({...base,billing_same:false}).valid,false);
const different = validateIntake({...base,billing_same:false,billing_line1:'200 Sample Road',billing_line2:'',billing_city:'Sample Town',billing_region:'California',billing_postal:'90210',billing_country:'US'});
assert.equal(different.valid,true);
assert.notDeepEqual(different.details.billing_address,different.details.business_address);
assert.ok(intakePayload('carpet',different.details,'TC-TEST-02')['Billing address'].includes('200 Sample Road'));
for (const address of [
  {business_country:'CA',business_region:'Ontario',business_postal:'K1A 0B1'},
  {business_country:'GB',business_region:'',business_postal:'SW1A 1AA'},
  {business_country:'AU',business_region:'New South Wales',business_postal:'2000'},
  {business_country:'HK',business_region:'',business_postal:''}
]) assert.equal(validateIntake({...base,...address}).valid,true);
assert.equal(intakeAccepted({success:'false'}),false);
assert.equal(intakeAccepted({success:true}),true);
assert.equal(intakeAccepted({success:'true'}),true);
assert.equal(intakeAccepted({message:'Submitted'}),false);
assert.equal(paypalDetails(valid.details,'TC-TEST-01').os2.startsWith('Order TC-TEST-01 / '),true);
const long = paypalDetails({business:'🏡'.repeat(200),email:'buyer@example.com',notes:'n'.repeat(1200)},'TC-TEST-01');
assert.ok(long.os1.length<=200 && long.os1.isWellFormed());
assert.ok(long.os2.length<=200);

const cart = readFileSync('checkout/index.html','utf8');
assert.match(cart, /<form id="paypal-checkout" action="https:\/\/www\.paypal\.com\/cgi-bin\/webscr" method="post" target="_top" hidden>/);
assert.match(cart, /name="cmd" value="_s-xclick"/);
assert.match(cart, /name="hosted_button_id" value="H48437LCHWWFQ"/);
assert.match(cart, /name="currency_code" value="USD"/);
assert.match(cart, /<select id="template-choice" name="os0" form="website-details">/);
assert.ok(!/name="(?:amount|business|undefined_amount|undefined_quantity)"/.test(cart.slice(cart.indexOf('<form id="paypal-checkout"'))));
assert.ok(!/order-email|Send my business|Email my website|transaction ID|email us|email them|email draft/.test(cart));
assert.ok(cart.includes('first-day indexing or ranking is not guaranteed'));
assert.ok(cart.includes('AI agents, automation and ongoing AI services are separate'));
assert.ok(cart.includes('three months'));
assert.equal((cart.match(/<video\b/g)||[]).length,5);
for (const m of cart.matchAll(/<video\b([^>]*)>/g)) {
  assert.match(m[1],/muted/); assert.match(m[1],/loop/); assert.match(m[1],/playsinline/);
  assert.ok(!/\ssrc=/.test(m[1]),'Film loading waits for visibility and motion preference');
  assert.ok(existsSync('.'+m[1].match(/data-src="([^"]+)"/)[1]));
}
const app = readFileSync('checkout/app.mjs','utf8');
assert.ok(!/localStorage|sessionStorage|innerHTML|paid=true|payment=success|mailto:/.test(app));

// Run the actual submit handler against a controlled email service and PayPal
// form. Network rejection must preserve the details and block payment.
async function checkoutFixture({result={success:'true'},reject=false,atReview=true}={}) {
  const events={}, choiceEvents={}, fields={...base}; let sends=0, submissions=0, sentPayload;
  const control=()=>({value:'',disabled:false,required:false,hidden:false,attrs:{},events:{},dataset:{},addEventListener(n,f){this.events[n]=f;},setCustomValidity(v){this.validity=v;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){},reportValidity(){return !this.validity;},closest(){return null;}});
  const steps=Array.from({length:3},(_,i)=>Object.assign(control(),{dataset:{checkoutStep:String(i)},querySelector(){return control();}}));
  const controls={};
  for(const name of ['business','contact','email','phone','website','notes','business_line1','business_line2','business_city','business_region','business_postal','business_country','billing_line1','billing_line2','billing_city','billing_region','billing_postal','billing_country']) {
    controls[name]=control();
    controls[name].closest=selector=>selector==='[data-checkout-step]'?steps[name.startsWith('business_')||name.startsWith('billing_')?1:0]:null;
  }
  controls.business_country.value='US'; controls.billing_country.value='US';
  const choice=Object.assign(control(),{addEventListener(n,f){choiceEvents[n]=f;}});
  const formElements=Object.assign(Object.values(controls),controls);
  formElements.push(choice);
  const form={elements:formElements,reportValidity(){return !Object.values(controls).some(c=>c.validity);},addEventListener(n,f){events[n]=f;},setAttribute(){}};
  const payment={elements:{hosted_button_id:control(),os0:control(),os1:control(),os2:control(),custom:control()},submit(){submissions++;}};
  const preview=control(),status=control(),button=control(),billingSame=Object.assign(control(),{checked:true}),billingFields=control(),next=control(),back=control();
  formElements.push(button,next,back,billingSame,billingFields);
  const nodes={'template-choice':choice,'website-details':form,'design-preview':preview,'paypal-checkout':payment,'billing-same':billingSame,'billing-fields':billingFields,'checkout-status':status,'checkout-submit':button,'checkout-next':next,'checkout-back':back};
  for(const id of ['checkout-review-design','checkout-review','checkout-review-notes','checkout-review-notes-text','checkout-progress'])nodes[id]=control();
  for(const prefix of ['business','billing'])for(const part of ['region','postal'])nodes[`${prefix}-${part}-optional`]=control();
  vm.runInNewContext(app.replace(/^import .*;\n/gm,''),{
    WEBSITE_PACKAGE,templateKey,templateFromPayPalOption,paypalDetails,INTAKE_URL,addressRules,addressText,postalInputMode,validateIntake,intakePayload,intakeAccepted,
    document:{getElementById(id){return nodes[id];},querySelectorAll(){return steps;}},location:{search:'?template=roof&amount=1',href:'https://topazcandy.com/checkout/?template=roof&amount=1'},history:{replaceState(){}},
    FormData:class{*[Symbol.iterator](){yield* Object.entries(fields);}},URL,URLSearchParams,AbortSignal,Date,crypto:{randomUUID(){return '12345678-1234-1234-1234-123456789012';}},
    fetch:async(url,options)=>{sends++;assert.equal(url,INTAKE_URL);assert.equal(options.credentials,'omit');assert.equal(options.headers['Content-Type'],undefined);sentPayload=Object.fromEntries(options.body);if(reject)throw Error('Network unavailable');return{ok:true,json:async()=>result};}
  });
  if(atReview){next.events.click();next.events.click();}
  return{events,choice,fields,controls,payment,status,button,next,back,steps,nodes,get sends(){return sends;},get submissions(){return submissions;},get sentPayload(){return sentPayload;}};
}
const staged=await checkoutFixture({atReview:false});
assert.equal(staged.steps[0].hidden,false);assert.equal(staged.button.hidden,true);
staged.fields.business_line1='';
await staged.events.submit({preventDefault(){}});
assert.equal(staged.steps[1].hidden,false);assert.equal(staged.sends,0,'Enter in the first step does not send intake');
staged.next.events.click();assert.equal(staged.steps[1].hidden,false,'Address errors stop the next step');assert.equal(staged.sends,0);
staged.fields.business_line1=base.business_line1;staged.next.events.click();assert.equal(staged.steps[2].hidden,false);assert.equal(staged.sends,0,'Review does not send intake');
assert.ok(staged.nodes['checkout-review'].textContent.includes(base.business_line1));
staged.back.events.click();assert.equal(staged.steps[1].hidden,false);assert.equal(staged.fields.email,base.email);
assert.equal(staged.controls.business_postal.attrs.inputmode,'numeric');
staged.controls.business_country.value='CA';staged.controls.business_country.events.change();assert.equal(staged.controls.business_postal.attrs.inputmode,'text');
for(const country of ['US','AU'])assert.equal(postalInputMode(country),'numeric');
for(const country of ['CA','GB','DE','HK'])assert.equal(postalInputMode(country),'text');
assert.equal(validateIntake({...base,website:'example.com/services'}).details.website,'https://example.com/services');
assert.equal(validateIntake({...base,website:'javascript:alert(1)'}).valid,false);
assert.ok(!cart.includes('cart-other'));assert.ok(!cart.includes('href="/services/"'));
for (const option of [{result:{success:'false'}},{reject:true}]) {
  const failed=await checkoutFixture(option);await failed.events.submit({preventDefault(){}});
  assert.equal(failed.submissions,0);assert.equal(failed.status.dataset.state,'error');assert.equal(failed.button.disabled,false);assert.equal(failed.fields.business,base.business);
}
const success=await checkoutFixture();
const first=success.events.submit({preventDefault(){}});const duplicate=success.events.submit({preventDefault(){}});await Promise.all([first,duplicate]);
assert.equal(success.sends,1);assert.equal(success.submissions,1);
assert.equal(success.sentPayload['Website design'],WEBSITE_PACKAGE.templates.roof.paypalOption);
assert.equal(success.payment.elements.custom.value,success.sentPayload['Order reference']);
assert.equal(success.payment.elements.os0.value,WEBSITE_PACKAGE.templates.roof.paypalOption);
assert.equal(success.payment.elements.hosted_button_id.value,WEBSITE_PACKAGE.paypalButtonId);
await success.events.submit({preventDefault(){}});assert.equal(success.sends,1,'Returning to PayPal reuses the accepted details');
success.fields.business='Changed Business';await success.events.submit({preventDefault(){}});assert.equal(success.sends,2,'Changed details are sent again');
const invalid=await checkoutFixture();invalid.fields.email='bad';await invalid.events.submit({preventDefault(){}});assert.equal(invalid.sends,0);assert.equal(invalid.submissions,0);
const spam=await checkoutFixture();spam.fields._honey='bot';await spam.events.submit({preventDefault(){}});assert.equal(spam.sends,0);assert.equal(spam.submissions,0);

// Exercise motion behavior with a simulated document, including late play resolution.
const motion = readFileSync('checkout/motion.mjs', 'utf8');
async function motionFixture({ reduced = false, saveData = false, blocked = false } = {}) {
  const events = {}, preferenceEvents = {}, buttonEvents = {};
  const videos = Array.from({ length: 5 }, () => ({
    dataset: { src: '/example.mp4' }, attrs: {}, paused: true, loads: 0, events: {},
    getAttribute(name) { return this.attrs[name]; },
    set src(value) { this.attrs.src = value; },
    load() { this.loads++; },
    async play() { if (blocked) throw new Error('autoplay blocked'); this.paused = false; this.events.playing?.(); },
    pause() { this.paused = true; },
    addEventListener(name, listener) { this.events[name] = listener; }
  }));
  const button = { dataset: {}, attributes: {}, hidden: true, setAttribute(k, v) { this.attributes[k] = v; }, addEventListener(n, f) { buttonEvents[n] = f; } };
  const preference = { matches: reduced, addEventListener(n, f) { preferenceEvents[n] = f; } };
  const montage = { querySelectorAll() { return videos; }, querySelector() { return button; } };
  const document = { hidden: false, getElementById() { return montage; }, addEventListener(n, f) { events[n] = f; } };
  let observe;
  class IntersectionObserver { constructor(callback) { observe = callback; } observe() {} }
  vm.runInNewContext(motion, { document, window: { IntersectionObserver, matchMedia() { return preference; } }, navigator: { connection: { saveData } }, IntersectionObserver, Promise });
  const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  return { videos, button, document, preference, events, buttonEvents, preferenceEvents, observe, settle };
}
const f = await motionFixture();
assert.ok(f.videos.every(v => v.loads === 0));
f.observe([{ isIntersecting: true }]); await f.settle();
assert.ok(f.videos.every(v => !v.paused && v.loads === 1));
assert.equal(f.button.dataset.playing, 'true');
f.document.hidden = true; f.events.visibilitychange(); await f.settle();
assert.ok(f.videos.every(v => v.paused));
f.document.hidden = false; f.events.visibilitychange(); await f.settle();
assert.ok(f.videos.every(v => !v.paused));
f.buttonEvents.click(); await f.settle();
f.observe([{ isIntersecting: false }]); f.observe([{ isIntersecting: true }]); await f.settle();
assert.ok(f.videos.every(v => v.paused), 'Explicit pause survives visibility changes');
for (const preferences of [{ reduced: true }, { saveData: true }]) {
  const p = await motionFixture(preferences); p.observe([{ isIntersecting: true }]); await p.settle();
  assert.ok(p.videos.every(v => v.loads === 0));
  p.buttonEvents.click(); await p.settle(); assert.ok(p.videos.every(v => !v.paused), 'Manual opt-in remains available');
}
const blocked = await motionFixture({ blocked: true }); blocked.observe([{ isIntersecting: true }]); await blocked.settle();
assert.equal(blocked.button.dataset.playing, 'false');
assert.ok(blocked.videos.every(v => !v.dataset.loaded));
console.log(JSON.stringify({ passed: true, checks: 'eight fixed-price cart routes, one automatic intake, validated contacts and addresses, email-before-payment handoff, failure preservation, duplicate protection, compact three-step checkout, correct keyboard hints, five films and motion fallbacks' }));
