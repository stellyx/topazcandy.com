export const enhancedAreaLinks=new Map([
 ['/warp/maps/archive/cf/areas/galadon.html','/warp/maps/archive/cf/galadon-preview.html'],
 ['/warp/maps/archive/cf/areas/galadonian-settlement.html','/warp/maps/archive/cf/galadonian-settlement-preview.html'],
 ['/warp/maps/archive/cf/areas/outskirts-of-galadon.html','/warp/maps/archive/cf/outskirts-preview.html'],
 ['/warp/maps/archive/cf/areas/northernroads.html','/warp/maps/archive/cf/north-road-preview.html'],
 ['/warp/maps/archive/cf/areas/the-eastern-road.html','/warp/maps/archive/cf/eastern-road-preview.html'],
 ['/warp/maps/archive/cf/areas/aldevari.html','/warp/maps/archive/cf/aldevari-preview.html'],
 ['/warp/maps/archive/cf/areas/bramblefield-road.html','/warp/maps/archive/cf/bramblefield-preview.html'],
 ['/warp/maps/archive/cf/areas/the-grove.html','/warp/maps/archive/cf/grove-preview.html'],
 ['/warp/maps/archive/cf/areas/the-past-grove.html','/warp/maps/archive/cf/past-grove-preview.html'],
 ['/warp/maps/archive/cf/areas/the-plains-of-arendyl.html','/warp/maps/archive/cf/plains-arendyl-preview.html'],
 ['/warp/maps/archive/cf/areas/a-wagon-marked-road.html','/warp/maps/archive/cf/wagon-road-preview.html'],
 ['/warp/maps/archive/cf/areas/silverwood.html','/warp/maps/archive/cf/silverwood-preview.html'],
 ['/warp/maps/archive/cf/areas/udgaard.html','/warp/maps/archive/cf/udgaard-preview.html'],
 ['/warp/maps/archive/cf/areas/graveyard.html','/warp/maps/archive/cf/graveyard-preview.html'],
 ['/warp/maps/archive/cf/areas/the-shadow-grove.html','/warp/maps/archive/cf/western-shadow-sorcery-preview.html'],
 ['/warp/maps/archive/cf/areas/the-tower-of-sorcery.html','/warp/maps/archive/cf/western-shadow-sorcery-preview.html']
]);

// Only pages with Academy or hometown-temple evidence in the reviewed inventory
// get this reference. The link documents coverage; it is not a travel edge.
export const academyReferenceAreaPaths=new Set([
 '/warp/maps/archive/cf/areas/akan.html',
 '/warp/maps/archive/cf/areas/hillcrest.html',
 '/warp/maps/archive/cf/areas/galadon.html',
 '/warp/maps/archive/cf/areas/evermoon-hollow.html',
 '/warp/maps/archive/cf/areas/hamsah-mu-tazz.html',
 '/warp/maps/archive/cf/areas/the-jade-mountains.html',
 '/warp/maps/archive/cf/areas/valley-of-veran.html',
 '/warp/maps/archive/cf/areas/teth-azeleth.html',
 '/warp/maps/archive/cf/areas/arkham.html',
 '/warp/maps/archive/cf/areas/balator.html',
 '/warp/maps/archive/cf/areas/blackclaw-village.html',
 '/warp/maps/archive/cf/areas/darsylon.html',
 '/warp/maps/archive/cf/areas/grinning-skull-village.html',
 '/warp/maps/archive/cf/areas/seantryn-modan.html',
 '/warp/maps/archive/cf/areas/south-dairein-settlement.html',
 '/warp/maps/archive/cf/areas/the-outpost-of-tir-talath.html'
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
