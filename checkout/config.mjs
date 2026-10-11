export const WEBSITE_PACKAGE = Object.freeze({
  price: 450,
  currency: 'USD',
  maintenanceMonths: 3,
  email: 'andrew@topazcandy.com',
  paypalUrl: 'https://www.paypal.com/qrcodes/p2pqrc/ZGLFN3MZMZ2J8',
  paypalMode: 'entered-amount',
  templates: Object.freeze({
    auto: { name: 'Afterimage', industry: 'Auto detailing', url: '/showcase/lab/auto/' },
    garden: { name: 'Stillfield', industry: 'Landscaping', url: '/showcase/lab/garden/' },
    roof: { name: 'Upperhand', industry: 'Roofing', url: '/showcase/lab/roof/' },
    hvac: { name: 'Temper', industry: 'Heating and cooling', url: '/showcase/lab/hvac/' },
    hair: { name: 'Crown & Calm', industry: 'Hair styling', url: '/showcase/lab/hair/' },
    carpet: { name: 'Softstep', industry: 'Carpet cleaning', url: '/showcase/lab/carpet/' }
  })
});

export function templateKey(value) {
  return Object.hasOwn(WEBSITE_PACKAGE.templates, value) ? value : 'carpet';
}
export function cleanDetail(value, limit = 200) {
  return Array.from(String(value ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/gu, ' ').trim()).slice(0, limit).join('');
}
export function orderEmail(key, details = {}) {
  const template = WEBSITE_PACKAGE.templates[templateKey(key)];
  const body = [
    'Hi Topaz Candy,', '',
    'I would like the $450 USD website launch package.',
    `Design: ${template.name} / ${template.industry}`,
    `Preview: https://topazcandy.com${template.url}`, '',
    'Included: website setup and launch; SEO setup; Google Business Profile and Maps connection for an eligible business; business information and link checks; three months of website service and maintenance from launch.',
    'Website maintenance covers the agreed website. AI agents, automation and ongoing AI services are separate.', '',
    `Business name: ${cleanDetail(details.business)}`,
    `Contact name: ${cleanDetail(details.contact)}`,
    `Reply email: ${cleanDetail(details.email)}`,
    `Current website: ${cleanDetail(details.website, 300)}`,
    `PayPal transaction ID, if paid: ${cleanDetail(details.transaction, 100)}`,
    `Notes: ${cleanDetail(details.notes, 1200)}`, '',
    'Please confirm payment receipt and the next steps. This email is not proof of payment.'
  ].join('\n');
  return `mailto:${WEBSITE_PACKAGE.email}?subject=${encodeURIComponent('$450 website package: ' + template.industry)}&body=${encodeURIComponent(body)}`;
}
