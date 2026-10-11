import { WEBSITE_PACKAGE, templateKey, templateFromPayPalOption, paypalDetails } from './config.mjs?v=4';
import { INTAKE_URL, addressRules, postalInputMode, addressText, validateIntake, intakePayload, intakeAccepted } from './intake.mjs?v=2';
const choice = document.getElementById('template-choice');
const form = document.getElementById('website-details');
const preview = document.getElementById('design-preview');
const payment = document.getElementById('paypal-checkout');
const billingSame = document.getElementById('billing-same');
const billingFields = document.getElementById('billing-fields');
const status = document.getElementById('checkout-status');
const button = document.getElementById('checkout-submit');
const next = document.getElementById('checkout-next');
const back = document.getElementById('checkout-back');
const steps = Array.from(document.querySelectorAll('[data-checkout-step]'));
let step = 0;
let submitting = false;
let accepted = null;
choice.value = WEBSITE_PACKAGE.templates[templateKey(new URLSearchParams(location.search).get('template'))].paypalOption;
payment.action = WEBSITE_PACKAGE.paypalUrl;
payment.elements.hosted_button_id.value = WEBSITE_PACKAGE.paypalButtonId;
function updateDesign() {
  const key = templateFromPayPalOption(choice.value);
  preview.href = WEBSITE_PACKAGE.templates[key].url;
}
function updateAddress(prefix) {
  const country = form.elements[`${prefix}_country`].value;
  const rules = addressRules(country);
  form.elements[`${prefix}_region`].required = rules.regionRequired;
  form.elements[`${prefix}_postal`].required = rules.postalRequired;
  form.elements[`${prefix}_postal`].setAttribute('inputmode', postalInputMode(country));
  document.getElementById(`${prefix}-region-optional`).hidden = rules.regionRequired;
  document.getElementById(`${prefix}-postal-optional`).hidden = rules.postalRequired;
}
function updateBilling() {
  billingFields.hidden = billingSame.checked;
  billingFields.disabled = billingSame.checked;
}
function clearErrors() {
  for (const field of form.elements) {
    field.setCustomValidity?.('');
    field.removeAttribute('aria-invalid');
  }
  status.textContent = '';
  status.dataset.state = '';
}
function reviewOrder() {
  const {details, valid} = validateIntake(Object.fromEntries(new FormData(form)));
  if (!valid) return;
  const design = WEBSITE_PACKAGE.templates[templateFromPayPalOption(choice.value)];
  document.getElementById('checkout-review-design').textContent = `${design.paypalOption} · $450 USD`;
  document.getElementById('checkout-review').textContent = `${details.business}\n${details.contact} · ${details.email}\n\nBusiness address\n${addressText(details.business_address)}\n\nBilling address\n${details.billing_same ? 'Same as business address' : addressText(details.billing_address)}`;
  document.getElementById('checkout-review-notes').hidden = !details.notes;
  document.getElementById('checkout-review-notes-text').textContent = details.notes;
}
function showStep(index, focus = true) {
  step = index;
  steps.forEach((section, i) => { section.hidden = i !== step; });
  back.hidden = step === 0;
  next.hidden = step === 2;
  button.hidden = step !== 2;
  next.textContent = step === 0 ? 'Continue to addresses ↗' : 'Review order ↗';
  document.getElementById('checkout-progress').textContent = `Step ${step + 1} of 3 · ${['About you','Addresses','Review and pay'][step]}`;
  if (step === 2) reviewOrder();
  if (focus) steps[step].querySelector('[data-step-title]').focus();
}
function highlightErrors(errors) {
  const entries = Object.entries(errors);
  if (!entries.length) return false;
  const first = form.elements[entries[0][0]];
  const section = first.closest('[data-checkout-step]');
  if (section) showStep(Number(section.dataset.checkoutStep));
  for (const [name,message] of entries) {
    const field = form.elements[name];
    field.setCustomValidity(message);
    field.setAttribute('aria-invalid','true');
    const optional = field.closest('details');
    if (optional) optional.open = true;
  }
  status.textContent = 'Check the highlighted details to continue.';
  status.dataset.state = 'error';
  first.reportValidity();
  return true;
}
function advance() {
  if (submitting) return;
  clearErrors();
  const validation = validateIntake(Object.fromEntries(new FormData(form)));
  const errors = Object.fromEntries(Object.entries(validation.errors).filter(([name]) => Number(form.elements[name].closest('[data-checkout-step]')?.dataset.checkoutStep) === step));
  if (highlightErrors(errors)) return;
  const invalid = Array.from(form.elements).find(field => !field.disabled && Number(field.closest?.('[data-checkout-step]')?.dataset.checkoutStep) === step && field.checkValidity && !field.checkValidity());
  if (invalid) { const optional = invalid.closest('details'); if (optional) optional.open = true; invalid.reportValidity(); return; }
  showStep(Math.min(step + 1, 2));
}
next.addEventListener('click', advance);
back.addEventListener('click', () => { if (!submitting) { clearErrors(); showStep(Math.max(0, step - 1)); } });
choice.addEventListener('change', () => {
  updateDesign(); clearErrors();
  if (step === 2) reviewOrder();
  const url = new URL(location.href);
  url.searchParams.set('template', templateFromPayPalOption(choice.value));
  history.replaceState(null, '', url);
});
billingSame.addEventListener('change', updateBilling);
for (const prefix of ['business','billing']) {
  form.elements[`${prefix}_country`].addEventListener('change', () => updateAddress(prefix));
  updateAddress(prefix);
}
form.addEventListener('input', clearErrors);
form.addEventListener('change', clearErrors);
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  if (step < 2) { advance(); return; }
  clearErrors();
  const raw = Object.fromEntries(new FormData(form));
  const validation = validateIntake(raw);
  if (raw._honey || !validation.valid) {
    if (raw._honey) { status.textContent = 'Please reload checkout and try again.'; status.dataset.state = 'error'; }
    else highlightErrors(validation.errors);
    return;
  }
  if (!form.reportValidity()) return;
  const key = templateFromPayPalOption(choice.value);
  const details = validation.details;
  const signature = JSON.stringify({key,details});
  const reference = accepted?.signature === signature ? accepted.reference : `TC-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const states = Array.from(form.elements).map(field => [field, field.disabled]);
  submitting = true;
  form.setAttribute('aria-busy','true');
  for (const [field] of states) field.disabled = true;
  button.textContent = 'Submitting your details…';
  status.dataset.state = 'pending';
  status.textContent = 'Sending your website details. Payment will follow securely in PayPal.';
  try {
    if (accepted?.signature !== signature) {
      const response = await fetch(INTAKE_URL, {
        method:'POST', headers:{'Accept':'application/json'},
        body:new URLSearchParams(intakePayload(key,details,reference)),
        signal:AbortSignal.timeout(25000), credentials:'omit', cache:'no-store', referrerPolicy:'strict-origin-when-cross-origin'
      });
      const result = await response.json();
      if (!response.ok || !intakeAccepted(result)) throw Error('Intake was not accepted');
      accepted = {signature,reference};
    }
    const options = paypalDetails(details,reference);
    payment.elements.os0.value = WEBSITE_PACKAGE.templates[key].paypalOption;
    payment.elements.os1.value = options.os1;
    payment.elements.os2.value = options.os2;
    payment.elements.custom.value = reference;
    status.dataset.state = 'success';
    status.textContent = 'Your details have been received. Continuing to PayPal…';
    button.textContent = 'Continuing to PayPal…';
    payment.submit();
  } catch {
    status.dataset.state = 'error';
    status.textContent = accepted?.signature === signature ? 'Your details were received. Please try again to continue to PayPal.' : 'We couldn’t confirm submission. Your details are still here. Please try again; payment has not started.';
    button.textContent = 'Continue to PayPal · $450';
  } finally {
    // Restore controls so returning from PayPal with the browser Back button
    // preserves an editable checkout. The accepted reference avoids a resend.
    for (const [field,disabled] of states) field.disabled = disabled;
    submitting = false;
    form.setAttribute('aria-busy','false');
    button.textContent = 'Continue to PayPal · $450';
  }
});
updateDesign(); updateBilling(); showStep(0, false); next.disabled = false; button.disabled = false;
