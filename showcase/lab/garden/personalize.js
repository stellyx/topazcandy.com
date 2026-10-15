(() => {
  const requested = new URLSearchParams(window.location.search).get('business');
  if (!requested) return;
  const business = Array.from(requested.normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/gu, ' ').trim()).slice(0, 80).join('');
  if (!business) return;

  document.body.dataset.previewBusiness = business;
  document.body.classList.add('has-business-preview');
  document.querySelector('[data-preview-name]').textContent = business;
  document.querySelector('[data-preview-symbol]').textContent = Array.from(business)[0].toLocaleLowerCase();
  document.querySelector('[data-preview-home]').setAttribute('aria-label', business + ' website design');
  const label = document.querySelector('[data-preview-label]');
  label.textContent = 'Website design for ' + business;
  label.hidden = false;
  document.querySelector('[data-preview-notice]').textContent = 'WEBSITE DESIGN BY TOPAZ CANDY';
  document.querySelector('[data-preview-disclosure]').textContent = 'WEBSITE BY TOPAZ CANDY · PHOTOGRAPHY: PEXELS.';
})();
