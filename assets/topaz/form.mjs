import { INTAKE_URL, intakeAccepted } from '../../checkout/intake.mjs?v=3';

export async function sendMessage(payload) {
  const response = await fetch(INTAKE_URL, {
    method:'POST', headers:{Accept:'application/json'}, body:new URLSearchParams(payload),
    signal:AbortSignal.timeout(25000), credentials:'omit', cache:'no-store', referrerPolicy:'strict-origin-when-cross-origin'
  });
  if (!response.ok || !intakeAccepted(await response.json())) throw Error('Message was not accepted');
}

export function bindMessageForm(form, {prepare, prefix='ENQ'}) {
  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('[type="submit"]');
  const label = button.textContent;
  let sending = false, accepted = '', attempt = null;
  function clearErrors() {
    for (const field of form.elements) { field.setCustomValidity?.(''); field.removeAttribute('aria-invalid'); }
    status.textContent = ''; status.dataset.state = ''; button.disabled = false; button.textContent = label;
  }
  form.addEventListener('input', () => { if (!sending) clearErrors(); });
  form.addEventListener('change', () => { if (!sending) clearErrors(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    clearErrors();
    const raw = Object.fromEntries(new FormData(form));
    if (raw._honey) { status.textContent = 'Please reload this page and try again.'; status.dataset.state = 'error'; return; }
    const signature = JSON.stringify(raw);
    if (attempt?.signature !== signature) attempt = {signature, reference:`TC-${prefix}-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`};
    const {errors, payload} = prepare(raw, attempt.reference);
    for (const [name, message] of Object.entries(errors)) {
      const field = form.elements[name]; field.setCustomValidity(message); field.setAttribute('aria-invalid','true');
      const optional = field.closest('details'); if (optional) optional.open = true;
    }
    if (Object.keys(errors).length || !form.reportValidity()) {
      status.textContent = 'Check the highlighted details to send your message.'; status.dataset.state = 'error'; form.reportValidity(); return;
    }
    if (accepted === signature) { status.textContent = 'Your message has been received. Thank you.'; status.dataset.state = 'success'; button.disabled = true; button.textContent = 'Message sent ✓'; return; }
    const states = Array.from(form.elements).map(field => [field, field.disabled]);
    sending = true; form.setAttribute('aria-busy','true'); states.forEach(([field]) => { field.disabled = true; });
    status.textContent = 'Sending your message…'; status.dataset.state = 'pending'; button.textContent = 'Sending…';
    try {
      await sendMessage(payload);
      accepted = signature;
      status.textContent = 'Your message has been received. Thank you.'; status.dataset.state = 'success';
    } catch {
      status.textContent = 'We couldn’t confirm your message. Your entries are still here. Please try again.'; status.dataset.state = 'error';
    } finally {
      states.forEach(([field, disabled]) => { field.disabled = disabled; }); sending = false; form.setAttribute('aria-busy','false');
      button.disabled = accepted === signature; button.textContent = accepted === signature ? 'Message sent ✓' : label;
    }
  });
  button.disabled = false;
}
