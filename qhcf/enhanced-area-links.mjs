export const enhancedAreaLinks=new Map([
 ['/qhcf/areas/galadon.html','/qhcf/galadon-preview.html'],
 ['/qhcf/areas/galadonian-settlement.html','/qhcf/galadonian-settlement-preview.html'],
 ['/qhcf/areas/outskirts-of-galadon.html','/qhcf/outskirts-preview.html'],
 ['/qhcf/areas/northernroads.html','/qhcf/north-road-preview.html'],
 ['/qhcf/areas/the-eastern-road.html','/qhcf/eastern-road-preview.html'],
 ['/qhcf/areas/aldevari.html','/qhcf/aldevari-preview.html'],
 ['/qhcf/areas/bramblefield-road.html','/qhcf/bramblefield-preview.html'],
 ['/qhcf/areas/the-grove.html','/qhcf/grove-preview.html'],
 ['/qhcf/areas/the-past-grove.html','/qhcf/past-grove-preview.html'],
 ['/qhcf/areas/the-plains-of-arendyl.html','/qhcf/plains-arendyl-preview.html'],
 ['/qhcf/areas/a-wagon-marked-road.html','/qhcf/wagon-road-preview.html'],
 ['/qhcf/areas/silverwood.html','/qhcf/silverwood-preview.html'],
 ['/qhcf/areas/udgaard.html','/qhcf/udgaard-preview.html'],
 ['/qhcf/areas/graveyard.html','/qhcf/graveyard-preview.html'],
 ['/qhcf/areas/the-shadow-grove.html','/qhcf/western-shadow-sorcery-preview.html'],
 ['/qhcf/areas/the-tower-of-sorcery.html','/qhcf/western-shadow-sorcery-preview.html']
]);

// Only pages with Academy or hometown-temple evidence in the reviewed inventory
// get this reference. The link documents coverage; it is not a travel edge.
export const academyReferenceAreaPaths=new Set([
 '/qhcf/areas/akan.html',
 '/qhcf/areas/hillcrest.html',
 '/qhcf/areas/galadon.html',
 '/qhcf/areas/evermoon-hollow.html',
 '/qhcf/areas/hamsah-mu-tazz.html',
 '/qhcf/areas/the-jade-mountains.html',
 '/qhcf/areas/valley-of-veran.html',
 '/qhcf/areas/teth-azeleth.html',
 '/qhcf/areas/arkham.html',
 '/qhcf/areas/balator.html',
 '/qhcf/areas/blackclaw-village.html',
 '/qhcf/areas/darsylon.html',
 '/qhcf/areas/grinning-skull-village.html',
 '/qhcf/areas/seantryn-modan.html',
 '/qhcf/areas/south-dairein-settlement.html',
 '/qhcf/areas/the-outpost-of-tir-talath.html'
]);

export function enhancedAreaHref(href,base=location.href){
 const url=new URL(href,base),preview=enhancedAreaLinks.get(url.pathname);
 return preview||url.pathname+url.search+url.hash;
}

export function upgradeEnhancedAreaLinks(root=document){
 for(const anchor of root.querySelectorAll('a[href]')){
  const sourcePath=new URL(anchor.href,location.href).pathname,preview=enhancedAreaLinks.get(sourcePath);
  if(preview&&!/captured source|source map|text reference|json/i.test(anchor.textContent))anchor.href=preview;
 }
 const preview=enhancedAreaLinks.get(location.pathname),side=root.querySelector('.side.panel');
 if(preview&&side&&!side.querySelector('[data-enhanced-preview]')){const p=document.createElement('p'),a=document.createElement('a');p.dataset.enhancedPreview='true';a.href=preview;a.textContent='Open interactive graphical map';p.append(a);side.querySelector('h2')?.after(p)}
 if(academyReferenceAreaPaths.has(location.pathname)&&side&&!side.querySelector('[data-academy-reference]')){const p=document.createElement('p'),a=document.createElement('a');p.dataset.academyReference='true';a.href='/qhcf/academy-temple-coverage.html';a.textContent='Academy entrances';a.title='Evidence-backed Academy entrance coverage; not a verified travel route';p.append(a);side.append(p)}
}

if(typeof document!=='undefined')upgradeEnhancedAreaLinks();
