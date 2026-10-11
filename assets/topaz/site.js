document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
const example = document.querySelector('[data-repair-example]');
if (example) {
  const button = example.querySelector('button');
  const note = example.querySelector('[data-repair-status]');
  button.addEventListener('click', () => {
    const fixed = example.dataset.fixed !== 'true';
    example.dataset.fixed = String(fixed);
    button.setAttribute('aria-pressed', String(fixed));
    example.querySelectorAll('[data-before]').forEach(el => { el.textContent = fixed ? el.dataset.after : el.dataset.before; });
    button.querySelector('[data-button-label]').textContent = fixed ? 'See the original problems' : 'See the difference';
    note.textContent = fixed ? 'A clear next step. The right contact details. An inquiry that reaches a person.' : 'Illustrative example. Try the button to see what changes after a repair.';
  });
}
