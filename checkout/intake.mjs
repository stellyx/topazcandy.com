import { WEBSITE_PACKAGE, cleanDetail, templateKey } from './config.mjs?v=3';

export const INTAKE_URL = 'https://formsubmit.co/ajax/2dbdde9ca207c74c11f854daf548a85b';
export const COUNTRY_CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
export const COUNTRY_LABELS = new Intl.DisplayNames(['en'], { type: 'region' });
export const POSTAL_PATTERNS = Object.freeze({
  US: /^\d{5}(?:-\d{4})?$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
  GB: /^(?:GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i,
  AU: /^\d{4}$/
});
const regions = {
  US: 'AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|DC:District of Columbia|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|AS:American Samoa|GU:Guam|MP:Northern Mariana Islands|PR:Puerto Rico|VI:US Virgin Islands|AA:Armed Forces Americas|AE:Armed Forces Europe|AP:Armed Forces Pacific',
  CA: 'AB:Alberta|BC:British Columbia|MB:Manitoba|NB:New Brunswick|NL:Newfoundland and Labrador|NS:Nova Scotia|NT:Northwest Territories|NU:Nunavut|ON:Ontario|PE:Prince Edward Island|QC:Quebec|SK:Saskatchewan|YT:Yukon',
  AU: 'ACT:Australian Capital Territory|NSW:New South Wales|NT:Northern Territory|QLD:Queensland|SA:South Australia|TAS:Tasmania|VIC:Victoria|WA:Western Australia'
};
function regionCode(value, country) {
  const entries = regions[country]?.split('|').map(pair => pair.split(':'));
  if (!entries) return value;
  const normalized = value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return entries.find(([code, name]) => code.toLowerCase() === normalized || name.toLowerCase() === normalized)?.[0] || '';
}
export function addressRules(country) {
  return { regionRequired: !!regions[country], postalRequired: !!POSTAL_PATTERNS[country] };
}
export function validateIntake(raw) {
  const details = {}, errors = {};
  const field = (key, limit = 160) => details[key] = cleanDetail(raw[key], limit);
  for (const key of ['business', 'contact', 'email', 'phone', 'website', 'notes']) field(key, { email:200, phone:40, website:300, notes:1200 }[key] || 160);
  if (!details.business) errors.business = 'Enter your business name.';
  if (!details.contact) errors.contact = 'Enter your contact name.';
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(details.email)) errors.email = 'Enter a valid email address.';
  if (details.phone && (!/^[+\d\s().-]+$/.test(details.phone) || !/^\d{7,15}$/.test(details.phone.replace(/\D/g, '')))) errors.phone = 'Enter a phone number with 7 to 15 digits, or leave it blank.';
  if (details.website) {
    try { const url = new URL(details.website); if (!['http:','https:'].includes(url.protocol) || !url.hostname.includes('.')) throw Error(); }
    catch { errors.website = 'Enter a complete website address starting with https://, or leave it blank.'; }
  }
  details.billing_same = raw.billing_same === 'on' || raw.billing_same === true;
  const address = prefix => {
    const values = {};
    for (const part of ['line1','line2','city','region','postal','country']) values[part] = field(`${prefix}_${part}`, part === 'country' ? 10 : part === 'postal' ? 20 : 160);
    values.country = values.country.toUpperCase(); details[`${prefix}_country`] = values.country;
    if (!COUNTRY_CODES.includes(values.country)) errors[`${prefix}_country`] = 'Choose your country.';
    if (!values.line1) errors[`${prefix}_line1`] = 'Enter the street address.';
    if (!values.city) errors[`${prefix}_city`] = 'Enter the city or town.';
    const rules = addressRules(values.country);
    const normalized = regionCode(values.region, values.country);
    if (rules.regionRequired && !normalized) errors[`${prefix}_region`] = 'Enter a valid state or province name or abbreviation.';
    else if (normalized) details[`${prefix}_region`] = values.region = normalized;
    if (rules.postalRequired && !values.postal) errors[`${prefix}_postal`] = 'Enter the postal or ZIP code.';
    else if (values.postal && !(POSTAL_PATTERNS[values.country] || /^[\p{L}\p{N} -]{2,20}$/u).test(values.postal)) errors[`${prefix}_postal`] = 'Check the postal or ZIP code for this country.';
    return values;
  };
  details.business_address = address('business');
  details.billing_address = details.billing_same ? { ...details.business_address } : address('billing');
  return { details, errors, valid: Object.keys(errors).length === 0 };
}
export function addressText(address) {
  return [address.line1, address.line2, address.city, address.region, address.postal, COUNTRY_LABELS.of(address.country)].filter(Boolean).join(', ');
}
export function intakePayload(key, details, reference) {
  const design = WEBSITE_PACKAGE.templates[templateKey(key)];
  return {
    name: details.contact,
    email: details.email,
    'Business name': details.business,
    'Phone': details.phone || 'Not supplied',
    'Current website': details.website || 'Not supplied',
    'Website design': design.paypalOption,
    'Design preview': `https://topazcandy.com${design.url}`,
    'Order reference': reference,
    'Package': '$450 USD website launch package',
    'Included': 'Website setup and launch; SEO setup; eligible Maps/Business Profile setup; business information and link checks; three months of website service and maintenance from launch. AI and automation services are separate.',
    'Business address': addressText(details.business_address),
    'Billing address': addressText(details.billing_address),
    'Billing same as business': details.billing_same ? 'Yes' : 'No',
    'Project notes': details.notes || 'Not supplied',
    'Payment status': 'Checkout details received. Payment is not yet verified. Match this reference to the PayPal transaction before starting work.',
    _subject: `Website checkout ${reference} · ${design.name}`,
    _url: 'https://topazcandy.com/checkout/',
    _template: 'table'
  };
}
export function intakeAccepted(result) {
  return result?.success === true || result?.success === 'true';
}
