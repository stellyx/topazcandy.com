export function recommendation(goal, guest, services) {
  const ids = {cut:'woman-cut',color:'root-color',care:'scalp-therapy',extensions:'extensions-consult',unsure:null};
  const titles={cut:'Choose your haircut.',color:guest==='new'?'Ask before a color change.':'Choose your color appointment.',care:'Explore scalp and hair care.',extensions:'Start with an extensions consultation.',unsure:'Ask which service to book.'};
  const notes={cut:'Browse women’s, men’s and children’s cuts in the menu. If you want advice on shape or texture, send a message first.',color:guest==='new'?'Tell MJ about the color you want and any recent color or treatments before choosing a service.':'Root color and blowout is one option. Choose the service that matches your visit, or ask MJ if you want a change.',care:'Scalp therapy is listed at $200 for 60 minutes. Ask MJ about products, sensitivities and what your appointment involves.',extensions:'The menu lists a complimentary 15 minute extensions consultation. Start there to discuss options and pricing.',unsure:'Tell MJ what you’re hoping to change. She can help you choose the right service and appointment length.'};
  if(!Object.hasOwn(ids,goal))throw new Error('Unknown appointment goal');
  const action=goal==='unsure'||(goal==='color'&&guest==='new')?'ask':'book';
  const service=action==='ask'?null:services.find(s=>s.id===ids[goal]);
  if(action==='book'&&!service)throw new Error('Unknown appointment goal');
  return {goal,guest,title:titles[goal],note:notes[goal],service,action};
}
export function messageLink(profile, goal, guest) {
  const goals={cut:'a haircut',color:'color or balayage',care:'scalp care',extensions:'hair extensions',unsure:'help choosing the right service'};
  const text=`Hi MJ! ${guest==='new'?'This would be my first visit.':'I am a returning guest.'} I am interested in ${goals[goal]||goals.unsure}. Could you help me choose the right appointment?`;
  if(profile.mode==='template')return 'https://topazcandy.com/contact/?service=website&template=hair#contact-form';
  return 'sms:'+profile.phone+'?body='+encodeURIComponent(text);
}

export function visitNotes(profile, goal, guest, services) {
  const goals={cut:'a haircut',color:'color or balayage',care:'scalp care',extensions:'hair extensions',unsure:'help choosing a service'};
  const r=recommendation(goal,guest,services);
  return [
    profile.name+' · My visit notes',
    guest==='new'?'This would be my first visit.':'I am a returning guest.',
    'I am interested in '+goals[goal]+'.',
    r.service?'A possible starting point: '+r.service.name+'.':'Next step: ask which service and appointment length fit my plans.',
    'Questions to discuss: my hair history, inspiration, appointment length, total price and home care.',
    profile.mode==='mj'?'Current booking menu: '+profile.bookingUrl:'Template preview: connect your stylist’s booking menu before reserving a visit.',
    'These are planning notes. No appointment has been reserved.'
  ].join('\n');
}
