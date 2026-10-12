import { enquiryContext, SERVICES, prepareEnquiry } from './model.mjs?v=3';
import { cleanDetail } from '../checkout/config.mjs?v=4';
import { WEBSITE_PACKAGE } from '../checkout/config.mjs?v=4';
import { bindMessageForm } from '../assets/topaz/form.mjs?v=1';

const params = new URLSearchParams(location.search);
const context = enquiryContext(params);
const form = document.getElementById('contact-form');
form.elements.service.value = context.service;
const offerCopy = {
  'ai-work-session': {
    title: 'Request your $99 AI session.',
    intro: 'One task, 60 minutes, a reusable prompt or template, and simple instructions. Tell us what you want to work on and a few times that suit you. We’ll confirm fit and availability by email before you book. $99 USD, one-time.',
    label: 'Your task and preferred times',
    placeholder: 'What task would you like help with? Which AI tool do you use, if any? Include a few preferred times and your time zone.'
  },
  'small-website-repair': {
    title: 'Let’s look at the repair.',
    intro: 'One inspected, agreed website repair costs $99–$199 USD. Share your site and the issue. We’ll confirm the exact scope and price before work starts. Larger work is quoted separately.',
    label: 'What needs fixing?',
    placeholder: 'Which page or button needs attention? Tell us what happens and what you want it to do.'
  },
  'lead-response-setup': {
    title: 'Tell us how enquiries arrive.',
    intro: 'We’ll check your existing tools before quoting a lead-response setup. Share how you receive and reply to enquiries today. Software costs are separate.',
    label: 'Your current tools and the missing step',
    placeholder: 'Which form, inbox or other tools do you use? Where does replying to a new enquiry get stuck?'
  }
};
const defaultCopy = {
  title: document.getElementById('contact-title').textContent,
  intro: document.getElementById('contact-intro').textContent,
  label: document.getElementById('contact-notes-label').textContent,
  placeholder: form.elements.notes.placeholder
};
function showServiceContext() {
  const service = form.elements.service.value;
  const copy = offerCopy[service] || defaultCopy;
  document.getElementById('contact-interest').textContent = context.template ? `Your enquiry · ${WEBSITE_PACKAGE.templates[context.template].paypalOption} · ${SERVICES[service]}` : SERVICES[service];
  document.getElementById('contact-title').textContent = copy.title;
  document.getElementById('contact-intro').textContent = copy.intro;
  document.getElementById('contact-notes-label').textContent = copy.label;
  form.elements.notes.placeholder = copy.placeholder;
}
showServiceContext();
form.elements.service.addEventListener('change', showServiceContext);
// A sample brief can arrive in the fragment, which is not sent in HTTP requests.
const brief = new URLSearchParams(location.hash.slice(1)).get('notes');
if (brief) { form.elements.notes.value = cleanDetail(brief,1200); history.replaceState(null,'',location.pathname + location.search + '#contact-form'); }
bindMessageForm(form, {prepare:(raw, reference) => prepareEnquiry(raw,reference,context)});

