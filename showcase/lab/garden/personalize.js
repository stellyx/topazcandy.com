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
  document.querySelector('[data-preview-home]').setAttribute('aria-label', business + ' website concept');
  const label = document.querySelector('[data-preview-label]');
  label.textContent = 'Website concept for ' + business;
  label.hidden = false;
  document.querySelector('[data-preview-notice]').textContent = 'PERSONALIZED PREVIEW BY TOPAZ CANDY · WEBSITE CONCEPT';
  document.querySelector('[data-preview-disclosure]').textContent = 'PERSONALIZED WEBSITE CONCEPT BY TOPAZ CANDY. AI-GENERATED GARDEN CARE FILM AND STOCK PHOTOS ARE ILLUSTRATIVE REFERENCES, NOT VERIFIED BUSINESS PROJECTS. NO BOOKINGS OR ESTIMATE REQUESTS ARE SENT FROM THIS PREVIEW.';
})();
