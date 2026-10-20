export const enhancedAreaLinks=new Map([
 ['/qhcf/areas/the-eastern-road.html','/qhcf/eastern-road-preview.html'],
 ['/qhcf/areas/aldevari.html','/qhcf/aldevari-preview.html'],
 ['/qhcf/areas/bramblefield-road.html','/qhcf/bramblefield-preview.html'],
 ['/qhcf/areas/the-grove.html','/qhcf/grove-preview.html'],
 ['/qhcf/areas/the-past-grove.html','/qhcf/past-grove-preview.html'],
 ['/qhcf/areas/the-plains-of-arendyl.html','/qhcf/plains-arendyl-preview.html'],
 ['/qhcf/areas/a-wagon-marked-road.html','/qhcf/wagon-road-preview.html']
]);

export function upgradeEnhancedAreaLinks(root=document){
 for(const anchor of root.querySelectorAll('a[href]')){
  const sourcePath=new URL(anchor.href,location.href).pathname,preview=enhancedAreaLinks.get(sourcePath);
  if(preview&&!/captured source|source map|text reference|json/i.test(anchor.textContent))anchor.href=preview;
 }
 const preview=enhancedAreaLinks.get(location.pathname),side=root.querySelector('.side.panel');
 if(preview&&side&&!side.querySelector('[data-enhanced-preview]')){const p=document.createElement('p'),a=document.createElement('a');p.dataset.enhancedPreview='true';a.href=preview;a.textContent='Open interactive graphical map';p.append(a);side.querySelector('h2')?.after(p)}
}

if(typeof document!=='undefined')upgradeEnhancedAreaLinks();
