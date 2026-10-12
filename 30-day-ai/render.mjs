import { mkdirSync, writeFileSync } from 'node:fs';
import { COPY, COURSE, WEEKS } from './content.mjs';

const root = new URL('.', import.meta.url);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function render(language) {
  const t = COPY[language], spanish = language === 'es';
  const text = (key,tag='span',cls='') => '<' + tag + ' data-i18n="' + key + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(t[key]) + '</' + tag + '>';
  const attr = (key,attribute) => ' data-i18n-' + attribute + '="' + key + '" ' + attribute + '="' + esc(t[key]) + '"';
  const link = (key,href,cls='') => '<a href="' + href + '"' + (href.endsWith('.pdf') ? ' download' : '') + (cls ? ' class="' + cls + '"' : '') + '>' + text(key) + '<span aria-hidden="true">↗</span></a>';
  const heading = (eyebrow,title,intro) => '<div class="course-heading"><div>' + text(eyebrow,'p','course-kicker') + text(title,'h2') + '</div>' + text(intro,'p') + '</div>';
  const option = (value,key,selected=false) => '<option value="' + value + '"' + (selected ? ' selected' : '') + ' data-i18n="' + key + '">' + esc(t[key]) + '</option>';
  const socialTitle = esc(t.title);
  const courseSchema = {
    '@context':'https://schema.org','@type':'Course',
    '@id':'https://topazcandy.com/30-day-ai/#course', name:COURSE.name,
    description:t.description, inLanguage:['en','es'], url:'https://topazcandy.com'+COURSE.routes[language],
    provider:{'@type':'Organization',name:'Topaz Candy LLC',url:'https://topazcandy.com/'},
    educationalLevel:'Beginner', timeRequired:'PT16H',coursePrerequisites:spanish?'No se requiere experiencia con IA ni programación.':'No AI or coding experience required.',
    offers:{'@type':'Offer',price:450,priceCurrency:'USD',category:'Paid',url:'https://topazcandy.com'+COURSE.routes[language]+'#enroll'}
  };
  let html = [
    '<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>'+socialTitle+'</title><meta name="description" content="'+esc(t.description)+'"><meta name="theme-color" content="#f5eee6"><meta name="color-scheme" content="light"><meta name="robots" content="index,follow">',
    '<link rel="canonical" href="https://topazcandy.com'+COURSE.routes[language]+'"><link rel="alternate" hreflang="en" href="https://topazcandy.com/30-day-ai/"><link rel="alternate" hreflang="es" href="https://topazcandy.com/30-day-ai/es/"><link rel="alternate" hreflang="x-default" href="https://topazcandy.com/30-day-ai/">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,650;1,400;1,450;1,500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="/assets/topaz/site.css?v=2"><link rel="stylesheet" href="/assets/topaz/brand.css?v=3"><link rel="stylesheet" href="/30-day-ai/course.css?v=2">',
    '<meta property="og:site_name" content="Topaz Candy"><meta property="og:type" content="website"><meta property="og:title" content="'+socialTitle+'"><meta property="og:description" content="'+esc(t.description)+'"><meta property="og:url" content="https://topazcandy.com'+COURSE.routes[language]+'"><meta property="og:image" content="https://topazcandy.com/assets/topaz/social-card.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+socialTitle+'"><meta name="twitter:description" content="'+esc(t.description)+'"><meta name="twitter:image" content="https://topazcandy.com/assets/topaz/social-card.png">',
    '<script type="application/ld+json" id="course-schema">'+JSON.stringify(courseSchema)+'</script><script type="module" src="/30-day-ai/app.mjs?v=1"></script></head>',
    '<body class="ai-course"><a class="skip" href="#main" data-i18n="skip">'+esc(t.skip)+'</a><div class="translation-shimmer" aria-hidden="true"></div>',
    '<svg class="sr-only" aria-hidden="true" focusable="false"><defs><filter id="ink-waver" x="-15%" y="-30%" width="130%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".012 .07" numOctaves="1" seed="8" result="noise"/><feDisplacementMap id="wave-displacement" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg>',
    '<p id="language-announcement" class="sr-only" role="status" aria-live="polite"></p>',
    '<header class="site-header course-header wrap"><a class="topaz-brand" href="/" aria-label="Topaz Candy"><img class="brand-emblem" src="/assets/topaz/logo-mark.svg?v=2" width="66" height="66" alt="" aria-hidden="true"><span class="brand-type"><span class="brand-wordmark">topaz <em>candy</em></span>'+text('brandSignature','span','brand-signature')+'</span></a>',
    '<div class="course-header-actions"><a class="back-topaz" href="/">'+text('back')+' ↗</a><nav class="language-switch"'+attr('languageLabel','aria-label')+'><a href="/30-day-ai/" data-language="en" lang="en" hreflang="en" aria-current="'+(!spanish)+'">English</a><a href="/30-day-ai/es/" data-language="es" lang="es" hreflang="es" aria-current="'+spanish+'">Español</a></nav></div></header>',
    '<div class="course-nav-wrap"><div class="course-nav wrap"><a class="course-nav-name" href="'+COURSE.routes[language]+'" data-course-home>30-day AI <span class="tiny-spark" aria-hidden="true">✦</span></a><nav aria-label="'+(spanish?'Secciones del curso':'Course sections')+'" data-nav-label><a href="#learn">'+text('navLearn')+'</a><a href="#plan">'+text('navPlan')+'</a><a href="#kit">'+text('navKit')+'</a><a href="#enroll" class="nav-enroll">'+text('navJoin')+'</a></nav></div></div>',
    '<main id="main"><section class="course-hero wrap"><div>'+text('eyebrow','p','course-kicker')+'<p class="course-name"><span class="tiny-spark" aria-hidden="true">✦</span>30-day AI</p><h1>'+text('headline1')+text('headline2')+'</h1>'+text('intro','p','lede'),
    '<div class="actions">'+link('join','#enroll','button')+link('seePlan','#plan','button light')+'</div><p class="hero-course-foot">'+text('priceNote','strong')+text('heroNote')+'</p></div>',
    '<div class="project-stage" data-paused="false"><div class="stage-constellation" aria-hidden="true"><svg class="stage-gem" viewBox="0 0 100 112"><defs><linearGradient id="gemGold" x1="0" x2="1" y2="1"><stop stop-color="#fff0b7"/><stop offset="1" stop-color="#d89935"/></linearGradient></defs><g class="stage-gem-core"><path d="M20 22 50 7 80 22 92 51 50 105 8 51Z" fill="url(#gemGold)"/><path d="M20 22 50 37 80 22 66 51 50 105 34 51Z" fill="#e8ae43"/><path d="M20 22 8 51 34 51 50 37Z" fill="#fbe099"/><path d="M80 22 92 51 66 51 50 37Z" fill="#d79334"/><path d="M8 51 50 105 34 51Z" fill="#e5be6a"/><path d="M92 51 50 105 66 51Z" fill="#b87928"/><path d="M20 22 50 7 80 22 50 37ZM8 51h84M20 22l14 29 16 54 16-54 14-29" fill="none" stroke="#fff0b7" stroke-width=".8"/></g></svg><span class="stage-spark s1">✦</span><span class="stage-spark s2">✧</span><span class="stage-spark s3">✦</span><span class="stage-spark s4">✧</span></div>',
    text('stageEyebrow','p','stage-small-label')+'<div class="stage-tabs"'+attr('stageLabel','aria-label')+'><button type="button" data-stage="prompt" aria-pressed="true">'+text('stagePrompt')+'</button><button type="button" data-stage="website" aria-pressed="false">'+text('stageWebsite')+'</button><button type="button" data-stage="reply" aria-pressed="false">'+text('stageReply')+'</button><button type="button" data-stage="tracker" aria-pressed="false">'+text('stageTracker')+'</button></div>',
    '<div class="example-sheet" data-stage-panel="prompt">'+text('promptLabel','p','sheet-overline')+text('promptExample','p','sample-prompt')+text('promptResult','p','sheet-after')+'</div>',
    '<div class="example-sheet" data-stage-panel="website" hidden>'+text('siteLabel','p','sheet-overline')+text('siteBusiness','p','sample-site-brand')+text('siteHeadline','p','sample-site-title')+text('siteCopy','p','sample-site-copy')+text('siteButton','span','sample-site-action')+'</div>',
    '<div class="example-sheet" data-stage-panel="reply" hidden>'+text('replyLabel','p','sheet-overline')+'<div class="sample-email">'+text('replySubject','h3')+text('replyCopy','p')+'</div>'+text('replyNote','p','sheet-after')+'</div>',
    '<div class="example-sheet" data-stage-panel="tracker" hidden>'+text('trackerLabel','p','sheet-overline')+'<table class="sample-track"><thead><tr>'+text('trackerCol1','th')+text('trackerCol2','th')+text('trackerCol3','th')+'</tr></thead><tbody><tr>'+text('trackerRow1','td')+text('trackerRow2','td')+text('trackerRow3','td')+'</tr></tbody></table>'+text('trackerNote','p','sheet-after')+'</div>',
    text('stageCaption','p','stage-caption')+'<button class="spark-pause" type="button" aria-pressed="false"'+attr('motionPause','aria-label')+' data-motion-toggle hidden>Ⅱ</button></div></section>',
    '<div class="wrap"><div class="course-stats"><div class="course-stat"><b>4</b>'+text('statWeeks')+'</div><div class="course-stat"><b>8</b>'+text('statClasses')+'</div><div class="course-stat"><b>16</b>'+text('statHours')+'</div><div class="course-stat">'+text('statLanguage','b')+'</div></div></div>',
    '<section class="course-section wrap" id="learn">'+heading('learnEyebrow','learnTitle','learnIntro')+'<div class="outcomes">'
  ].join('\n');
  for(let n=1;n<=3;n++) html += '<article class="outcome"><span class="outcome-num" aria-hidden="true">0'+n+'</span>'+text('outcome'+n+'Title','h3')+text('outcome'+n+'Text','p')+'</article>';
  html += '</div><div class="course-fit"><div>'+text('fitLabel','p','course-kicker')+text('fitTitle','h3')+text('fitNote','p')+'</div><ul class="fit-list">'+[1,2,3].map(n=>text('fit'+n,'li')).join('')+'</ul></div></section>';
  html += '<section class="course-section course-plan" id="plan"><div class="wrap">'+heading('planEyebrow','planTitle','planIntro');
  WEEKS.forEach((week,index)=>{
    const d=week[language];
    html+='<details class="week"'+(index===0?' open':'')+'><summary><span class="week-summary-text"><span class="week-label">'+text('weekLabel')+' '+(index+1)+'</span><span class="week-title" data-week="'+index+'">'+esc(d.title)+'</span></span><i aria-hidden="true"></i></summary><div class="week-lesson-grid">';
    week.lessons.forEach(lesson=>{
      const l=lesson[language];
      html+='<article class="lesson"><span class="class-label">'+text('classLabel')+' '+lesson.n+'</span><h3 data-lesson="'+lesson.n+'" data-lesson-field="title">'+esc(l.title)+'</h3><p data-lesson="'+lesson.n+'" data-lesson-field="text">'+esc(l.text)+'</p><span class="lesson-outcome">'+text('outcomeLabel','b')+'<span data-lesson="'+lesson.n+'" data-lesson-field="outcome">'+esc(l.outcome)+'</span></span></article>';
    });
    html+='</div><p class="week-practice">'+text('practiceLabel','strong')+' · <span data-practice="'+index+'">'+esc(d.note)+'</span></p></details>';
  });
  html+=text('planNote','p','plan-footnote')+'</div></section><section class="course-section prompt-lab" id="try"><div class="wrap">'+heading('sampleEyebrow','sampleTitle','sampleIntro');
  html+='<div class="prompt-lab-grid"><div class="prompt-fields"><label for="prompt-goal">'+text('goalLabel')+'</label><textarea id="prompt-goal" maxlength="600" rows="3"'+attr('goalPlaceholder','placeholder')+'></textarea><label for="prompt-kind">'+text('taskLabel')+'</label><select id="prompt-kind">'+option('everyday','taskEmail')+option('website','taskWebsite')+option('workflow','taskWorkflow')+'</select><button type="button" class="button" id="prompt-build">'+text('buildPrompt')+' <span aria-hidden="true">✦</span></button></div>';
  html+='<div class="prompt-output"><label for="prompt-result" class="sr-only" data-i18n="sampleTitle">'+esc(t.sampleTitle)+'</label><textarea id="prompt-result" readonly rows="7">'+esc(t.sampleDefault)+'</textarea><div class="prompt-copy-actions"><button type="button" id="prompt-copy" disabled>'+text('copyPrompt')+'</button><button type="button" id="prompt-save" disabled>'+text('savePrompt')+'</button></div></div></div><p class="prompt-status" id="prompt-status" role="status" aria-live="polite"></p>'+text('sampleNote','p','prompt-help')+'</div></section>';
  html+='<section class="course-section wrap" id="kit">'+heading('kitEyebrow','kitTitle','kitIntro')+'<div class="learning-kit"><article class="resource-workbook"><div class="resource-icon"><span class="book-icon" aria-hidden="true">30</span><div>'+text('workbookTitle','h3')+text('workbookText','p')+'</div></div><div class="workbook-links">'+link('downloadEnglish',COURSE.workbooks.en)+link('downloadSpanish',COURSE.workbooks.es)+text('pdfNote','span','pdf-note')+'</div></article>';
  html+='<article class="resource-card">'+text('madlibTitle','h3')+text('madlibText','p')+link('downloadSheet','/30-day-ai/downloads/Website-Mad-Lib-Bilingual.pdf')+'</article><article class="resource-card">'+text('reflectionTitle','h3')+text('reflectionText','p')+link('downloadSheet','/30-day-ai/downloads/Prompt-Reflection-Bilingual.pdf')+'</article></div>';
  html+='<div class="project-progress"><div class="progress-header">'+text('checklistTitle','h3')+'<span class="progress-count"><b id="progress-count">0</b>'+text('completedLabel')+'</span></div><progress class="progress-meter" max="8" value="0"'+attr('checklistTitle','aria-label')+' id="project-progress"></progress><div class="progress-list">';
  for(let n=1;n<=8;n++)html+='<label><input type="checkbox" data-progress="'+n+'">'+text('progress'+n)+'</label>';
  html+='</div><div class="progress-footer">'+text('checklistNote','p')+'<button class="plain-button" type="button" id="progress-reset">'+text('resetProgress')+'</button></div><p class="form-status" id="storage-status" role="status"></p></div>';
  html+='<div class="support-row"><div class="support-block">'+text('supportTitle','h3')+text('supportText','p')+'<a href="#enroll" data-question-link>'+text('supportLink')+' ↗</a></div><details class="prepare-block"><summary>'+text('prepareTitle')+'</summary><ul>'+[1,2,3,4].map(n=>text('prepare'+n,'li')).join('')+'</ul></details></div></section>';
  html+='<section class="faq-section wrap"><div class="course-faq"><div>'+text('faqEyebrow','p','course-kicker')+text('faqTitle','h2')+'</div><div>';
  for(let n=1;n<=6;n++)html+='<details class="faq-item"><summary>'+text('faq'+n+'Q')+'</summary>'+text('faq'+n+'A','p')+'</details>';
  html+='</div></div></section>';
  html+='<section class="course-section enroll-section" id="enroll"><div class="wrap enroll-layout"><div class="enroll-copy">'+text('enrollEyebrow','p','course-kicker')+text('enrollTitle','h2')+text('enrollIntro','p','enroll-intro')+text('priceLabel','p','price-label')+'<p class="course-price">$450'+text('priceSmall','small')+'</p><ul class="price-scope">'+[1,2,3,4].map(n=>text('included'+n,'li')).join('')+'</ul>'+text('priceFine','p','price-fine')+'<a class="form-call" href="tel:+15125532552">512-553-2552</a></div>';
  html+='<div><form class="enrollment-form" id="enrollment-form" action="https://formsubmit.co/2dbdde9ca207c74c11f854daf548a85b" method="post" novalidate aria-describedby="enrollment-privacy">'+
    '<label>'+text('formName')+'<input name="contact" autocomplete="name" maxlength="160" required></label>'+
    '<label>'+text('formEmail')+'<input name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" maxlength="200" required></label>'+
    '<label class="full">'+text('formLanguage')+'<select name="language" required>'+option('en','languageEnglish',!spanish)+option('es','languageSpanish',spanish)+option('either','languageEither')+'</select></label>'+
    '<details class="full"><summary>'+text('formOptional')+' <small>'+text('optionalLabel')+'</small></summary><div class="optional-fields"><label>'+text('formPhone')+'<input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40"></label><label>'+text('formLevel')+'<select name="level">'+option('new','levelNew')+option('tried','levelTried')+option('work','levelWork')+'</select></label><label>'+text('formNotes')+'<textarea name="notes" maxlength="1200" rows="3"'+attr('formNotesPlaceholder','placeholder')+'></textarea></label></div></details>'+
    '<label class="full consent"><input name="consent" type="checkbox" required>'+text('formConsent')+'</label>'+
    '<label hidden aria-hidden="true">Leave this empty<input name="_honey" tabindex="-1" autocomplete="off"></label>'+
    '<p class="full form-privacy" id="enrollment-privacy" data-i18n="privacy">'+esc(t.privacy)+'</p>'+
    '<p class="full form-status" id="enrollment-status" role="status" aria-live="polite" aria-atomic="true"></p>'+
    '<button type="submit" class="button full" id="enrollment-submit" disabled>'+text('submit')+' <span aria-hidden="true">↗</span></button></form><noscript>'+text('formNoJS','p')+'</noscript></div></div></section></main>';
  html+='<footer class="course-footer wrap"><p>© <span data-year>2026</span> Topaz Candy LLC<br>'+text('footerNote')+'</p><nav aria-label="'+(spanish?'Navegación del pie':'Footer navigation')+'" data-footer-label><a href="/">'+text('footerHome')+'</a><a href="/services/">'+text('footerServices')+'</a><a href="/contact/?service=ai-class#contact-form">'+text('footerContact')+'</a></nav></footer></body></html>\n';
  return html;
}
mkdirSync(new URL('es/',root),{recursive:true});
writeFileSync(new URL('index.html',root),render('en'));
writeFileSync(new URL('es/index.html',root),render('es'));
console.log('Rendered English and Spanish class pages.');
