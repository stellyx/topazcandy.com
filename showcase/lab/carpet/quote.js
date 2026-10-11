export function cleanName(value, limit = 80) {
  return Array.from(String(value ?? '').normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/gu, ' ').trim()).slice(0, limit).join('');
}

export function normalizeState(input, limit = 12) {
  const rooms = Number(input.rooms);
  return {
    rooms: Number.isFinite(rooms) ? Math.min(limit, Math.max(0, Math.trunc(rooms))) : 3,
    stairs: input.stairs === true,
    pet: input.pet === true,
    rug: input.rug === true,
    sofa: input.sofa === true
  };
}

export function calculateQuote(input, config) {
  const state = normalizeState(input, config.roomLimit);
  const rates = config.rates;
  const lines = [];
  if (state.rooms) lines.push({ label: `${state.rooms} carpeted ${state.rooms === 1 ? 'room' : 'rooms'}`, amount: state.rooms * rates.room });
  if (state.stairs) lines.push({ label: 'One staircase', amount: rates.stairs });
  if (state.rug) lines.push({ label: 'One area rug', amount: rates.rug });
  if (state.sofa) lines.push({ label: 'One standard sofa', amount: rates.sofa });
  // Pet treatment is scoped to carpeted rooms, never charged for an empty selection.
  if (state.pet && state.rooms) lines.push({ label: 'Pet spot assessment and treatment allowance', amount: rates.pet });
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const adjustment = lines.length ? Math.max(0, rates.minimum - subtotal) : 0;
  if (adjustment) lines.push({ label: 'Minimum visit adjustment', amount: adjustment });
  return { state, lines, total: subtotal + adjustment, adjustment, hasSelection: subtotal > 0 };
}

export function money(value, config) {
  return new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency, maximumFractionDigits: 0 }).format(value);
}

export function requestBrief({ quote, contact, businessName, config, commercial = false }) {
  const demo = config.demoMode ? 'SAMPLE REQUEST — NOT SENT\n\n' : '';
  const selection = commercial ? 'Commercial cleaning: tailored quote required. Residential guide estimate does not apply.' : `${quote.lines.filter(line => line.label !== 'Minimum visit adjustment').map(line => `• ${line.label}`).join('\n')}\nGuide estimate: ${money(quote.total, config)}${config.demoMode ? ' (sample rates)' : ''}`;
  return `${demo}${cleanName(businessName)} — carpet cleaning request\n\n${selection}\n\nName: ${cleanName(contact.name, 100)}\nEmail: ${cleanName(contact.email, 180) || 'Not provided'}\nPhone: ${cleanName(contact.phone, 40) || 'Not provided'}\nZIP / postal code: ${cleanName(contact.postal, 20)}\nPreferred date: ${cleanName(contact.date, 20) || 'Flexible'}\nNotes: ${String(contact.notes ?? '').trim().slice(0, 1200) || 'None'}\n\nRequest only. Appointment, scope and final price must be confirmed before work. No payment is collected here.`;
}
