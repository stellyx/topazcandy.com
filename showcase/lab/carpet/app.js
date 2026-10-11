import { CONFIG } from './config.js?v=2';
import { calculateQuote, cleanName, money, requestBrief } from './quote.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const requestedName = cleanName(new URLSearchParams(location.search).get('business'));
let businessName = requestedName || CONFIG.businessName;
function applyBusinessName() {
  $$('[data-business-name]').forEach(el => { el.textContent = businessName; });
  $$('[data-brand-home]').forEach(el => { el.setAttribute('aria-label', `${businessName} home`); });
}
applyBusinessName();
$$('[data-descriptor]').forEach(el => { el.textContent = CONFIG.businessDescriptor.toUpperCase(); });
$$('[data-brand-home]').forEach(el => { el.setAttribute('aria-label', `${businessName} home`); });
$$('[data-library]').forEach(el => { el.href = CONFIG.templateLibraryUrl; });
$$('[data-website-inquiry]').forEach(el => { el.href = CONFIG.websiteInquiryUrl; });
$('[data-year]').textContent = new Date().getFullYear();
$('[data-room-rate]').textContent = money(CONFIG.rates.room, CONFIG);
$('[data-room-note]').textContent = CONFIG.roomSizeNote;
$('[data-minimum-note]').textContent = `Minimum visit: ${money(CONFIG.rates.minimum, CONFIG)}`;
$$('[data-rate]').forEach(el => { el.textContent = `+${money(CONFIG.rates[el.dataset.rate], CONFIG)}${el.dataset.rate === 'pet' ? ' allowance' : ''}`; });
if (!CONFIG.demoMode) {
  $$('[data-demo-only]').forEach(el => { el.hidden = true; });
  $$('[data-client-only]').forEach(el => { el.hidden = false; });
  $('[data-form-submit]').textContent = 'Prepare quote request ↗';
  const contact = $('[data-live-contact]');
  if (/^\+?[\d ()-]{7,25}$/.test(CONFIG.phone)) {
    const link = document.createElement('a'); link.href = `tel:${CONFIG.phone.replace(/[^+\d]/g, '')}`; link.textContent = CONFIG.phone; contact.append(link);
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONFIG.quoteEmail)) {
    const link = document.createElement('a'); link.href = `mailto:${CONFIG.quoteEmail}`; link.textContent = CONFIG.quoteEmail; contact.append(link);
  }
  if (CONFIG.serviceAreas.length) { const area = document.createElement('span'); area.textContent = CONFIG.serviceAreas.join(' · '); contact.append(area); }
  contact.hidden = !contact.children.length;
}

const previewForm = $('#brand-preview');
const previewToggle = $('[data-personalize-toggle]');
previewForm.elements.previewBusiness.value = businessName;
previewToggle.addEventListener('click', () => {
  const open = previewToggle.getAttribute('aria-expanded') !== 'true';
  previewToggle.setAttribute('aria-expanded', String(open)); previewForm.hidden = !open;
  if (open) previewForm.elements.previewBusiness.focus();
});
previewForm.addEventListener('submit', event => {
  event.preventDefault();
  businessName = cleanName(previewForm.elements.previewBusiness.value) || CONFIG.businessName;
  previewForm.elements.previewBusiness.value = businessName; applyBusinessName();
  $('#brand-preview-status').textContent = `Previewing ${businessName} in the website below.`;
});

let state = { rooms: 3, stairs: false, pet: false, rug: false, sofa: false };
let quote = calculateQuote(state, CONFIG);
let isCommercial = false;
let brief = '';
const modal = $('#request-dialog');
const form = $('#request-form');
const today = new Date();
form.elements.date.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

function render() {
  quote = calculateQuote(state, CONFIG); state = quote.state;
  $('#room-count').value = state.rooms; $('#room-count').textContent = state.rooms;
  $('[data-room-change="-1"]').disabled = state.rooms === 0;
  $('[data-room-change="1"]').disabled = state.rooms === CONFIG.roomLimit;
  $$('.room-visual span').forEach((el, index) => el.classList.toggle('selected', index < state.rooms));
  $$('[data-extra]').forEach(el => {
    const key = el.dataset.extra; const active = state[key] && (key !== 'pet' || state.rooms > 0);
    el.setAttribute('aria-pressed', String(active)); el.querySelector('i').textContent = active ? '✓' : '+';
    if (key === 'pet') { el.disabled = !state.rooms; el.setAttribute('title', state.rooms ? 'Add a pet treatment allowance' : 'Choose at least one carpeted room for pet treatment'); }
  });
  $('#quote-total').value = money(quote.total, CONFIG); $('#quote-total').textContent = money(quote.total, CONFIG);
  $('#selection-summary').textContent = quote.lines.filter(line => line.label !== 'Minimum visit adjustment').map(line => line.label).join(' · ') || 'No cleaning areas selected';
  const list = $('#breakdown'); list.replaceChildren();
  for (const line of quote.lines) {
    const li = document.createElement('li'); const label = document.createElement('span'); const amount = document.createElement('span');
    label.textContent = line.label; amount.textContent = money(line.amount, CONFIG); li.append(label, amount); list.append(li);
  }
  $('[data-request]').disabled = !quote.hasSelection;
  $('.empty-message').hidden = quote.hasSelection;
}
$$('[data-room-change]').forEach(button => button.addEventListener('click', () => {
  state.rooms += Number(button.dataset.roomChange); if (state.rooms <= 0) state.pet = false; render();
}));
$$('[data-extra]').forEach(button => button.addEventListener('click', () => { state[button.dataset.extra] = !state[button.dataset.extra]; render(); }));
$$('[data-service]').forEach(link => link.addEventListener('click', () => {
  const service = link.dataset.service;
  if (service === 'carpet') state.rooms = Math.max(1, state.rooms);
  if (service === 'rug') state.rug = true;
  if (service === 'pet') { state.rooms = Math.max(1, state.rooms); state.pet = true; }
  render();
}));
$('.breakdown-toggle').addEventListener('click', event => {
  const button = event.currentTarget; const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded)); button.querySelector('span').textContent = expanded ? '+' : '−'; $('#breakdown').hidden = expanded;
});

const menuButton = $('.menu-toggle');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); $('#navigation').classList.remove('menu-open'); menuButton.querySelector('span').textContent = '+'; }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open));
  $('#navigation').classList.toggle('menu-open', open); menuButton.querySelector('span').textContent = open ? '−' : '+';
});
$$('#navigation a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

function openRequest(commercial = false) {
  isCommercial = commercial;
  $('#request-entry').hidden = false; $('#request-result').hidden = true; $('#form-error').hidden = true;
  modal.setAttribute('aria-labelledby', 'request-title');
  $('[data-request-description]').textContent = commercial ? 'Tell us about your commercial space, approximate floor area and preferred cleaning hours. It will need a tailored quote.' : 'Tell us a little about your home and preferred timing.';
  if (commercial && !form.elements.notes.value) form.elements.notes.value = 'Commercial space — approximate floor area, carpet type and access hours: ';
  modal.showModal();
}
$('[data-request]').addEventListener('click', () => openRequest());
$('[data-commercial]').addEventListener('click', event => { event.preventDefault(); openRequest(true); });
$('.dialog-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) { const r = modal.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) modal.close(); } });
$('.edit-request').addEventListener('click', () => { $('#request-result').hidden = true; $('#request-entry').hidden = false; modal.setAttribute('aria-labelledby', 'request-title'); form.elements.name.focus(); });

form.addEventListener('submit', event => {
  event.preventDefault();
  const contact = Object.fromEntries(new FormData(form)); const error = $('#form-error'); error.hidden = true;
  const email = String(contact.email).trim(); const phone = String(contact.phone).trim();
  if (!email && phone.replace(/\D/g, '').length < 7) { error.textContent = 'Add an email address or a phone number with at least seven digits.'; error.hidden = false; form.elements.email.focus(); return; }
  if (phone && phone.replace(/\D/g, '').length < 7) { error.textContent = 'Please check the phone number or leave it blank and use your email.'; error.hidden = false; form.elements.phone.focus(); return; }
  if (!cleanName(contact.name) || cleanName(contact.postal).length < 3) { error.textContent = 'Add your name and ZIP or postal code.'; error.hidden = false; return; }
  brief = requestBrief({ quote, contact, businessName, config: CONFIG, commercial: isCommercial });
  $('#request-brief').value = brief; $('#request-entry').hidden = true; $('#request-result').hidden = false; $('#copy-status').textContent = '';
  modal.setAttribute('aria-labelledby', 'result-title');
  if (!CONFIG.demoMode) {
    $('[data-result-status]').textContent = 'REQUEST PREPARED · NOT SENT';
    $('[data-result-message]').textContent = 'Review the details, then open your email request or the booking page. Your appointment is confirmed separately.';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CONFIG.quoteEmail)) { const link = $('#send-brief'); link.href = `mailto:${CONFIG.quoteEmail}?subject=${encodeURIComponent('Carpet cleaning quote request')}&body=${encodeURIComponent(brief)}`; link.hidden = false; }
    try { const url = new URL(CONFIG.bookingUrl); if (url.protocol === 'https:') { const link = $('#book-brief'); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.hidden = false; } } catch { /* No verified booking route configured. */ }
  }
  $('#request-brief').focus();
});
$('#copy-brief').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(brief); $('#copy-status').textContent = 'Copied. Your request has not been sent.'; }
  catch { $('#request-brief').focus(); $('#request-brief').select(); $('#copy-status').textContent = 'Select and copy the text above. Your request has not been sent.'; }
});
$('#download-brief').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a');
  a.href = url; a.download = 'carpet-cleaning-request.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const motionButton = $('.motion-control');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
let visitorPaused = false;
let heroVisible = true;
const dataSaver = navigator.connection?.saveData === true;
function updateMotion() { const paused = visitorPaused || !heroVisible || reduceMotion.matches || dataSaver || document.hidden; document.body.classList.toggle('photo-paused', paused); motionButton.hidden = reduceMotion.matches || dataSaver; motionButton.setAttribute('aria-pressed', String(visitorPaused)); motionButton.setAttribute('aria-label', visitorPaused ? 'Play gentle photo motion' : 'Pause gentle photo motion'); motionButton.querySelector('span').textContent = visitorPaused ? '▶' : 'Ⅱ'; }
motionButton.addEventListener('click', () => { visitorPaused = !visitorPaused; updateMotion(); });
reduceMotion.addEventListener('change', updateMotion); document.addEventListener('visibilitychange', updateMotion);
if ('IntersectionObserver' in window) { const observer = new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; updateMotion(); }, { threshold: 0.05 }); observer.observe($('.hero-media')); }
updateMotion(); render();
