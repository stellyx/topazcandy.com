import { WEBSITE_PACKAGE, templateKey, templateFromPayPalOption, paypalDetails } from './config.mjs?v=3';
import { INTAKE_URL, addressRules, validateIntake, intakePayload, intakeAccepted } from './intake.mjs?v=1';
const choice = document.getElementById('template-choice');
const form = document.getElementById('website-details');
const preview = document.getElementById('design-preview');
const payment = document.getElementById('paypal-checkout');
const billingSame = document.getElementById('billing-same');
const billingFields = document.getElementById('billing-fields');
const status = document.getElementById('checkout-status');
const button = document.getElementById('checkout-submit');
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
  const rules = addressRules(form.elements[`${prefix}_country`].value);
  form.elements[`${prefix}_region`].required = rules.regionRequired;
  form.elements[`${prefix}_postal`].required = rules.postalRequired;
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
choice.addEventListener('change', () => {
  updateDesign(); clearErrors();
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
  clearErrors();
  const raw = Object.fromEntries(new FormData(form));
  const validation = validateIntake(raw);
  if (raw._honey || !validation.valid) {
    for (const [name,message] of Object.entries(validation.errors)) {
      form.elements[name].setCustomValidity(message);
      form.elements[name].setAttribute('aria-invalid','true');
    }
    status.textContent = raw._honey ? 'Please reload checkout and try again.' : 'Check the highlighted details to continue.';
    status.dataset.state = 'error';
    form.reportValidity();
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
updateDesign(); updateBilling(); button.disabled = false;
