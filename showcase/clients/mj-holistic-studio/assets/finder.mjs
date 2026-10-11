export function recommendation(goal, guest, services) {
  const ids = {cut:'woman-cut',color:guest==='new'?'correction-consult':'root-color',care:'scalp-therapy',extensions:'extensions-consult',unsure:'correction-consult'};
  const titles={cut:'Start with the shape.',color:guest==='new'?'Let’s talk color first.':'Time for a color refresh?',care:'A little room to unwind.',extensions:'Talk through the possibilities.',unsure:'You don’t need to know the service name.'};
  const notes={cut:'Browse women’s, men’s and children’s cuts in the menu. If you want advice on shape or texture, send a message first.',color:guest==='new'?'The menu includes a complimentary color correction consultation. For balayage or another color change, text your goals so MJ can point you to the right appointment.':'Root color and blowout is one option. Choose the service that matches your visit, or ask MJ if you want a change.',care:'Scalp therapy is listed at $200 for 60 minutes. Ask MJ about products, sensitivities and what your appointment involves.',extensions:'The menu lists a complimentary 15 minute extensions consultation. Start there to discuss options and pricing.',unsure:'Tell MJ what you’re hoping to change. She can help you choose the right service and appointment length.'};
  const service=services.find(s=>s.id===ids[goal]);
  if(!service)throw new Error('Unknown appointment goal');
  return {goal,guest,title:titles[goal],note:notes[goal],service};
}
export function messageLink(profile, goal, guest) {
  const goals={cut:'a haircut',color:'color or balayage',care:'scalp care',extensions:'hair extensions',unsure:'help choosing the right service'};
  const text=`Hi MJ! ${guest==='new'?'This would be my first visit.':'I am a returning guest.'} I am interested in ${goals[goal]||goals.unsure}. Could you help me choose the right appointment?`;
  if(profile.mode==='template')return 'mailto:andrew@topazcandy.com?subject='+encodeURIComponent('A hairstylist website for my business');
  return 'sms:'+profile.phone+'?body='+encodeURIComponent(text);
}
