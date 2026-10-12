import { WEBSITE_PACKAGE, cleanDetail } from '../checkout/config.mjs?v=4';
import { validateContact } from '../checkout/intake.mjs?v=2';

export const SERVICES = Object.freeze({
  'ai-work-session':'$99 AI work session · 60 minutes', 'small-website-repair':'One website repair · $99–$199', 'lead-response-setup':'Lead-response setup · request a quote',
  'ai-class':'30-day AI class',
  'web-presence':'Website evaluation and repair', website:'Website design and setup', seo:'SEO and search presence',
  automation:'AI and workflow automation', chat:'Website chat', 'email-automation':'Email automation', telephony:'Business telephony and AI voice',
  'customer-service':'Customer service systems', apps:'Custom apps and operations', youtube:'YouTube management', 'social-media':'Social media',
  video:'Video, animation and commercials', audio:'Music, voice and audio', 'master-clipper':'MASTER CLIPPER', brand:'Brand and web',
  research:'Business and marketing research', model:'Business model review', acquisition:'Business acquisition research', package:'Complete brand and media package', other:'Something else'
});
export function enquiryContext(params) {
  const service = Object.hasOwn(SERVICES, params.get('service')) ? params.get('service') : 'web-presence';
  const template = Object.hasOwn(WEBSITE_PACKAGE.templates, params.get('template')) ? params.get('template') : '';
  return {service, template};
}
export function prepareEnquiry(raw, reference, context) {
  const validation = validateContact(raw);
  const {details, errors} = validation;
  if (!details.website && !details.notes) errors.notes = 'Add a website above or tell us a little about the project.';
  const service = Object.hasOwn(SERVICES, raw.service) ? raw.service : context.service;
  const design = WEBSITE_PACKAGE.templates[context.template];
  return {errors, payload:{
    name:details.contact, email:details.email, 'Business name':details.business || 'Not supplied', 'Phone':details.phone || 'Not supplied',
    'Current website':details.website || 'Not supplied', 'Requested service':SERVICES[service],
    'Website template':design?.paypalOption || 'No template selected', 'Design preview':design ? `https://topazcandy.com${design.url}` : 'Not supplied',
    'Project notes':details.notes || 'Website evaluation requested', 'Enquiry reference':reference,
    'Purpose':'Enquiry only. No order, appointment or payment has been created.',
    _subject:`Topaz Candy enquiry ${reference} · ${SERVICES[service]}`, _url:'https://topazcandy.com/contact/', _template:'table'
  }};
}

