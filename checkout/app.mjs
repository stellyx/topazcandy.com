import { WEBSITE_PACKAGE, templateKey, templateFromPayPalOption, paypalDetails, orderEmail } from './config.mjs?v=2';
const choice = document.getElementById('template-choice');
const form = document.getElementById('website-details');
const email = document.getElementById('order-email');
const preview = document.getElementById('design-preview');
const payment = document.getElementById('paypal-checkout');
choice.value = WEBSITE_PACKAGE.templates[templateKey(new URLSearchParams(location.search).get('template'))].paypalOption;
payment.action = WEBSITE_PACKAGE.paypalUrl;
payment.elements.hosted_button_id.value = WEBSITE_PACKAGE.paypalButtonId;
function updateOrder() {
  const key = templateFromPayPalOption(choice.value);
  const details = Object.fromEntries(new FormData(form));
  preview.href = WEBSITE_PACKAGE.templates[key].url;
  email.href = orderEmail(key, details);
  const options = paypalDetails(details);
  payment.elements.os1.value = options.os1;
  payment.elements.os2.value = options.os2;
}
choice.addEventListener('change', () => {
  updateOrder();
  const url = new URL(location.href);
  url.searchParams.set('template', templateFromPayPalOption(choice.value));
  history.replaceState(null, '', url);
});
form.addEventListener('input', updateOrder);
form.addEventListener('submit', event => { event.preventDefault(); email.focus(); });
email.addEventListener('click', event => {
  if (!form.reportValidity()) event.preventDefault();
});
payment.addEventListener('submit', event => {
  if (!form.reportValidity()) { event.preventDefault(); return; }
  updateOrder();
});
updateOrder();
