export const WEBSITE_PACKAGE = Object.freeze({
  price: 450,
  currency: 'USD',
  maintenanceMonths: 3,
  email: 'andrew@topazcandy.com',
  paypalUrl: 'https://www.paypal.com/cgi-bin/webscr',
  paypalMode: 'hosted-button',
  paypalButtonId: 'H48437LCHWWFQ',
  templates: Object.freeze({
    auto: { name: 'Afterimage', industry: 'Auto detailing', url: '/showcase/lab/auto/', paypalOption: 'Afterimage - Auto detailing' },
    garden: { name: 'Stillfield', industry: 'Landscaping', url: '/showcase/lab/garden/', paypalOption: 'Stillfield - Landscaping' },
    roof: { name: 'Upperhand', industry: 'Roofing', url: '/showcase/lab/roof/', paypalOption: 'Upperhand - Roofing' },
    hvac: { name: 'Temper', industry: 'Heating and cooling', url: '/showcase/lab/hvac/', paypalOption: 'Temper - Heating and cooling' },
    hair: { name: 'Crown & Calm', industry: 'Hair styling', url: '/showcase/lab/hair/', paypalOption: 'Crown and Calm - Hair styling' },
    carpet: { name: 'Softstep', industry: 'Carpet cleaning', url: '/showcase/lab/carpet/', paypalOption: 'Softstep - Carpet cleaning' }
  })
});

export function templateKey(value) {
  return Object.hasOwn(WEBSITE_PACKAGE.templates, value) ? value : 'carpet';
}
export function templateFromPayPalOption(value) {
  return Object.keys(WEBSITE_PACKAGE.templates).find(key => WEBSITE_PACKAGE.templates[key].paypalOption === value) || 'carpet';
}
export function cleanDetail(value, limit = 200) {
  return Array.from(String(value ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/gu, ' ').trim()).slice(0, limit).join('');
}
function paypalSummary(value) {
  let result = '';
  for (const character of cleanDetail(value)) {
    if (result.length + character.length > 200) break;
    result += character;
  }
  return result.trim();
}
export function paypalDetails(details = {}, reference = '') {
  // PayPal's generated button accepts two text options of at most 200 characters.
  // Keep a full reply email first; full details travel in the automatic intake email.
  const reply = cleanDetail(details.email);
  const business = cleanDetail(details.business, 160);
  return {
    os1: paypalSummary([reply, business].filter(Boolean).join(' / ')),
    os2: paypalSummary([reference ? `Order ${cleanDetail(reference, 40)}` : '', cleanDetail(details.website, 100), cleanDetail(details.notes)].filter(Boolean).join(' / '))
  };
}
