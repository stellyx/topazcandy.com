import { WEBSITE_PACKAGE, templateKey, orderEmail } from './config.mjs?v=1';
const choice = document.getElementById('template-choice');
const form = document.getElementById('website-details');
const email = document.getElementById('order-email');
const preview = document.getElementById('design-preview');
const payment = document.getElementById('paypal-payment');
choice.value = templateKey(new URLSearchParams(location.search).get('template'));
payment.href = WEBSITE_PACKAGE.paypalUrl;
function updateOrder() {
  const key = templateKey(choice.value);
  preview.href = WEBSITE_PACKAGE.templates[key].url;
  email.href = orderEmail(key, Object.fromEntries(new FormData(form)));
}
choice.addEventListener('change', () => {
  updateOrder();
  const url = new URL(location.href);
  url.searchParams.set('template', templateKey(choice.value));
  history.replaceState(null, '', url);
});
form.addEventListener('input', updateOrder);
form.addEventListener('submit', event => { event.preventDefault(); email.focus(); });
email.addEventListener('click', event => {
  if (!form.reportValidity()) event.preventDefault();
});
updateOrder();
