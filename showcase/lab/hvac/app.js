(() => {
  const dialog = document.querySelector('.planner');
  const form = document.querySelector('#service-form');
  const brief = document.querySelector('.brief');
  const text = document.querySelector('#brief-text');
  const status = document.querySelector('.copy-status');
  let opener;
  document.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    const service = button.dataset.plan;
    if (service) {
      form.querySelector(`input[name="service"][value="${service}"]`).checked = true;
      form.elements.concern.value = service === 'repair' ? 'Not cooling comfortably' : 'Planning ahead';
    }
    form.hidden = false;
    brief.hidden = true;
    dialog.showModal();
    document.body.classList.add('planner-open');
  }));
  const close = () => dialog.close();
  dialog.querySelector('.close').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
  });
  dialog.addEventListener('close', () => { document.body.classList.remove('planner-open'); opener?.focus(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const services = {repair:'Repair', replacement:'System replacement', maintenance:'Seasonal care'};
    text.textContent = `TEMPER / SAMPLE SERVICE BRIEF\n\nService: ${services[data.get('service')]}\nStarting point: ${data.get('concern')}\nPreferred conversation: ${data.get('timing')}\n${data.get('notes').trim() ? `Notes: ${data.get('notes').trim()}\n` : ''}\nAsk the HVAC team about the visit scope, availability and any fees before booking.\n\nDesign concept only. No appointment booked or request submitted.`;
    form.hidden = true;
    brief.hidden = false;
    status.textContent = 'Saved here for this visit. Nothing submitted.';
    document.querySelector('#copy-brief').focus();
  });
  document.querySelector('#edit-brief').addEventListener('click', () => {
    form.hidden = false;
    brief.hidden = true;
    form.querySelector('input:checked').focus();
  });
  document.querySelector('#copy-brief').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text.textContent);
      status.textContent = 'Brief copied. Nothing submitted.';
    } catch {
      status.textContent = 'Copy is unavailable here. Select the brief text to save it.';
    }
  });
})();
