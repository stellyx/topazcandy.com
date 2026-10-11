import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { WEBSITE_PACKAGE, templateKey, cleanDetail, orderEmail } from '../checkout/config.mjs';

assert.equal(WEBSITE_PACKAGE.price, 450);
assert.equal(WEBSITE_PACKAGE.currency, 'USD');
assert.equal(WEBSITE_PACKAGE.maintenanceMonths, 3);
assert.equal(WEBSITE_PACKAGE.paypalUrl, 'https://www.paypal.com/qrcodes/p2pqrc/ZGLFN3MZMZ2J8');
for (const input of ['__proto__', '../clients/mj-holistic-studio', 'https://example.com', null]) assert.equal(templateKey(input), 'carpet');
assert.equal(cleanDetail('  Good\u202e  Name\nHere '), 'Good NameHere');
assert.equal(Array.from(cleanDetail('🏡'.repeat(300), 80)).length, 80);
for (const key of Object.keys(WEBSITE_PACKAGE.templates)) {
  const url = new URL(orderEmail(key, { business: 'Business\r\nBcc: victim@example.com', notes: '<script>bad()</script>', transaction: 'example-transaction' }));
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, WEBSITE_PACKAGE.email);
  assert.match(url.searchParams.get('body'), /\$450 USD/);
  assert.match(url.searchParams.get('body'), /three months of website service and maintenance/);
  assert.match(url.searchParams.get('body'), /AI agents, automation and ongoing AI services are separate/);
  assert.match(url.searchParams.get('body'), /not proof of payment/);
  assert.equal(url.searchParams.has('bcc'), false);
  const html = readFileSync(`showcase/lab/${key}/index.html`, 'utf8');
  const purchases = [...html.matchAll(/<a\b[^>]*data-website-purchase[^>]*>/g)].map(m => m[0]);
  assert.equal(purchases.length, 2, `${key}: footer and bottom-dock buying actions`);
  for (const tag of purchases) assert.ok(tag.includes(`href="https://topazcandy.com/checkout/?template=${key}"`));
  assert.ok(html.includes(`data-purchase-theme="${key}"`));
  assert.ok(html.includes('Want to spend more money?'));
  assert.ok(!html.slice(0, html.indexOf('<main')).includes('>Buy this website'));
}
const cart = readFileSync('checkout/index.html', 'utf8');
assert.ok(cart.includes('first-day indexing or ranking is not guaranteed'));
assert.ok(cart.includes('AI agents, automation and ongoing AI services are separate'));
assert.ok(cart.includes('three months'));
assert.equal((cart.match(/<video\b/g) || []).length, 5);
for (const m of cart.matchAll(/<video\b([^>]*)>/g)) {
  assert.match(m[1], /muted/); assert.match(m[1], /loop/); assert.match(m[1], /playsinline/);
  assert.ok(!/\ssrc=/.test(m[1]), 'Film loading waits for visibility and motion preference');
  const src = m[1].match(/data-src="([^"]+)"/)[1];
  assert.ok(existsSync('.' + src));
}
assert.ok(!/localStorage|sessionStorage|\bfetch\(|innerHTML|paid=true|payment=success/.test(readFileSync('checkout/app.mjs', 'utf8')));

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
console.log(JSON.stringify({ passed: true, checks: 'six fixed-price cart routes, package scope, safe email drafts, allowlisted selections, five films, motion and poster fallbacks' }));
