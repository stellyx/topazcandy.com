import { cleanDetail } from '../../checkout/config.mjs?v=4';
import { validateContact } from '../../checkout/intake.mjs?v=2';
import { bindMessageForm } from './form.mjs?v=1';

export function prepareFeedback(raw, reference) {
  const errors = {};
  const comments = cleanDetail(raw.comments,3000);
  const email = cleanDetail(raw.email,200);
  if (!comments) errors.comments = 'Enter your comments.';
  if (email && validateContact({contact:'Feedback',email}).errors.email) errors.email = 'Enter a valid reply email, or leave it blank.';
  if (raw.rating && !['1','2','3','4','5'].includes(raw.rating)) errors.rating = 'Choose a rating from the list.';
  return {errors, payload:{
    name:cleanDetail(raw.name,80) || 'Anonymous', ...(email ? {email} : {}), 'Rating':raw.rating ? `${raw.rating} / 5` : 'Not rated',
    'Permission to publish comments and display name':raw.publication_permission === 'yes' ? 'Yes' : 'No',
    'Comments':comments, 'Feedback reference':reference, _subject:`Topaz Candy feedback ${reference}`, _url:'https://topazcandy.com/comments.html', _template:'table'
  }};
}
if (typeof document !== 'undefined') {
  document.getElementById('year').textContent = new Date().getFullYear();
  bindMessageForm(document.getElementById('reviewForm'), {prepare:prepareFeedback, prefix:'FB'});
}
