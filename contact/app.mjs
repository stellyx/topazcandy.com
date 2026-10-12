import { enquiryContext, SERVICES, prepareEnquiry } from './model.mjs?v=2';
import { cleanDetail } from '../checkout/config.mjs?v=4';
import { WEBSITE_PACKAGE } from '../checkout/config.mjs?v=4';
import { bindMessageForm } from '../assets/topaz/form.mjs?v=1';

const params = new URLSearchParams(location.search);
const context = enquiryContext(params);
const form = document.getElementById('contact-form');
form.elements.service.value = context.service;
document.getElementById('contact-interest').textContent = context.template ? `Your enquiry · ${WEBSITE_PACKAGE.templates[context.template].paypalOption}` : SERVICES[context.service];
// A sample brief can arrive in the fragment, which is not sent in HTTP requests.
const brief = new URLSearchParams(location.hash.slice(1)).get('notes');
if (brief) { form.elements.notes.value = cleanDetail(brief,1200); history.replaceState(null,'',location.pathname + location.search + '#contact-form'); }
bindMessageForm(form, {prepare:(raw, reference) => prepareEnquiry(raw,reference,context)});

