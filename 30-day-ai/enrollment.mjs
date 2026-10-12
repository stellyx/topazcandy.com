import { validateContact } from '../checkout/intake.mjs?v=2';
import { COURSE, COPY } from './content.mjs?v=1';

export function prepareEnrollment(raw, reference, uiLanguage='en') {
  const t = COPY[uiLanguage] || COPY.en;
  const { details, errors: baseErrors } = validateContact({...raw,website:''});
  const errors = {};
  if (baseErrors.contact) errors.contact = t.errName;
  if (baseErrors.email) errors.email = t.errEmail;
  if (baseErrors.phone) errors.phone = t.errPhone;
  const language = ['en','es','either'].includes(raw.language) ? raw.language : '';
  if (!language) errors.language = t.errLanguage;
  if (raw.consent !== 'on') errors.consent = t.errConsent;
  if (raw._honey) errors.contact = t.reload;
  const levels = {new:'Starting from zero',tried:'Has tried AI tools',work:'Uses AI and wants practical help'};
  return {errors, payload:{
    name:details.contact, email:details.email, Phone:details.phone || 'Not supplied',
    Course:COURSE.name, 'Course price': '$450 USD per student', 'Course structure':'4 weeks; 8 in-person classes; 16 classroom hours',
    'Preferred language':{en:'English',es:'Spanish',either:'Either'}[language] || 'Invalid',
    'Starting point':Object.hasOwn(levels,raw.level) ? levels[raw.level] : levels.new,
    'Student question':details.notes || 'Enrollment details requested', 'Permission to contact about this request':'Yes',
    'Enrollment reference':reference,
    Purpose:'Enrollment request only. Confirm dates, venue, teaching language, cancellation terms and payment instructions. No seat, order or payment is confirmed.',
    _subject:'Topaz Candy / 30-day AI enrollment / ' + reference, _url:'https://topazcandy.com/30-day-ai/', _template:'table'
  }};
}

// A failed delivery keeps all entries. Retrying unchanged information reuses
// its reference; simultaneous or already-accepted requests are not resent.
export function createEnrollmentSender({send, referenceFactory, prepare=prepareEnrollment}) {
  let busy=false, accepted='', attempt=null;
  return {
    get busy(){return busy;},
    async submit(raw,language) {
      if (busy) return {state:'busy'};
      const signature=JSON.stringify(raw);
      if (attempt?.signature !== signature) attempt={signature,reference:referenceFactory()};
      const prepared=prepare(raw,attempt.reference,language);
      if(Object.keys(prepared.errors).length) return {state:'invalid',errors:prepared.errors};
      if(accepted===signature) return {state:'received',reference:attempt.reference};
      busy=true;
      try {await send(prepared.payload);accepted=signature;return {state:'received',reference:attempt.reference};}
      catch {return {state:'failed',reference:attempt.reference};}
      finally {busy=false;}
    }
  };
}
