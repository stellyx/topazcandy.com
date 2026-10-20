export const sourceRevision = 5073;
export const diagramFirstSourceRow = 4;
export const diagramWidth = 43;

export const legend = [
  {symbol:'K', note:'The knight of Clover Chapel & Maddie the village beauty'},
  {symbol:'W', note:'Marealee the witch-druid'},
  {symbol:'G', note:'Clodork, the goblin general'},
  {symbol:'L', note:"Witch's Lieutenant"},
  {symbol:'1', note:'A Small Cave Under the Ravine'},
  {symbol:'o', note:'Outside the Entrance to the Village Clover'},
  {symbol:'r', note:'Razed Signpost at the Entrance to the Emerald Forest'},
  {symbol:'g', note:'gibberling (aggro)'},
  {symbol:'R', note:"Ranger's Guild"},
  {symbol:'w', note:'At the Entrance to the Witch Wood'},
  {symbol:'p', note:'Pond'},
  {symbol:'h', note:'A Treehouse at the Heart of the Forest (marmalade orb)'},
  {symbol:'H', note:'The Heart of the Forest'},
  {symbol:'e', note:'Entrance to the Village of the Trees'},
  {symbol:'S', note:'Sir Sorrow'},
  {symbol:'X', note:'cook shopkeeper'},
  {symbol:'C', note:"Chief's Dwelling, Sheeka the Pixie Chief"},
  {symbol:'s', note:'The pixie shopkeeper (barter 6AM-9PM)'},
];

export const markerPositions = [
  ['K',4,5],['W',10,7],['G',11,21],['L',12,5],['1',16,23],
  ['o',18,17],['r',18,21],['g',18,25],['R',21,30],['w',21,13],
  ['p',12,13],['p',27,37],['p',30,37],['p',33,37],['h',31,21],
  ['H',33,21],['e',39,17],['S',42,37],['X',42,13],['C',45,17],['s',45,9],
].map(([symbol,row,column])=>({symbol,row,column}));

export const relatedAreas = [
  {label:'Silverwood', href:'/warp/maps/archive/cf/areas/silverwood.html', local:true},
  {label:'Spiderhaunt Woods', href:'/warp/maps/archive/cf/areas/spiderhaunt-woods.html', local:true},
  {label:'Aubade', href:'http://wiki.qhcf.net/index.php?title=Aubade', local:false},
];

export function buildEmeraldModel(data){
  if(data?.source?.revision_id!==sourceRevision)throw new Error(`Expected source revision ${sourceRevision}`);
  if(!Array.isArray(data.lines)||data.lines.length<50)throw new Error('Emerald Forest source lines are incomplete');
  const diagramLines=data.lines.slice(diagramFirstSourceRow-1).map(line=>[...line].slice(0,diagramWidth).join('').trimEnd());
  const plusCells=data.plus_cells.map(cell=>({sourceRow:cell.row,column:cell.column,diagramRow:cell.row-diagramFirstSourceRow+1}));
  for(const cell of plusCells){
    if(data.lines[cell.sourceRow-1]?.[cell.column-1]!=='+')throw new Error(`Plus cell mismatch at r${cell.sourceRow}c${cell.column}`);
  }
  const noteBySymbol=new Map(legend.map(entry=>[entry.symbol,entry.note]));
  const markers=markerPositions.map(marker=>{
    if(data.lines[marker.row-1]?.[marker.column-1]!==marker.symbol)throw new Error(`Marker mismatch at r${marker.row}c${marker.column}`);
    return {...marker,diagramRow:marker.row-diagramFirstSourceRow+1,note:noteBySymbol.get(marker.symbol)};
  });
  return {header:data.lines[0],diagramLines,plusCells,markers};
}

const NS='http://www.w3.org/2000/svg';
const svgNode=(name,attributes,parent)=>{const node=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));parent?.append(node);return node};

export function renderEmeraldMap(svg,model){
  const stepX=18,stepY=20,padX=24,padY=28;
  const width=diagramWidth*stepX+padX*2,height=model.diagramLines.length*stepY+padY*2;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',width);svg.setAttribute('height',height);
  svg.replaceChildren();
  const title=svgNode('title',{id:'emerald-map-title'},svg);title.textContent='Ancient Emerald Forest source map';
  const description=svgNode('desc',{id:'emerald-map-desc'},svg);description.textContent='Revision 5073 map grid with literal plus cells and source-defined legend markers highlighted.';
  svgNode('rect',{width:'100%',height:'100%',fill:'#081013'},svg);
  const x=column=>padX+(column-1)*stepX,y=diagramRow=>padY+(diagramRow-1)*stepY;
  for(const cell of model.plusCells)svgNode('circle',{cx:x(cell.column),cy:y(cell.diagramRow)-4,r:7,class:'plus-highlight'},svg);
  for(const marker of model.markers){
    const group=svgNode('g',{class:'note-marker',role:'img','aria-label':`${marker.symbol}: ${marker.note}`},svg);
    const title=svgNode('title',{},group);title.textContent=`${marker.symbol}: ${marker.note}`;
    svgNode('rect',{x:x(marker.column)-8,y:y(marker.diagramRow)-15,width:16,height:19,rx:4},group);
  }
  model.diagramLines.forEach((line,rowIndex)=>[...line].forEach((character,columnIndex)=>{
    if(character===' ')return;
    const text=svgNode('text',{x:x(columnIndex+1),y:y(rowIndex+1),'text-anchor':'middle'},svg);text.textContent=character;
  }));
}

async function mount(){
  const response=await fetch('/warp/maps/archive/cf/data/areas/ancient-emerald-forest.json?v=5073');
  if(!response.ok)throw new Error('Emerald Forest source record unavailable');
  const model=buildEmeraldModel(await response.json()),svg=document.querySelector('#emerald-map'),wrap=document.querySelector('#map-wrap');
  renderEmeraldMap(svg,model);
  document.querySelector('#map-status').textContent=`Source revision ${sourceRevision}: ${model.plusCells.length} literal + cells and ${model.markers.length} annotated marker positions shown.`;
  document.querySelector('#fit').addEventListener('click',()=>{wrap.classList.add('fit');document.querySelector('#fit').setAttribute('aria-pressed','true');document.querySelector('#actual').setAttribute('aria-pressed','false')});
  document.querySelector('#actual').addEventListener('click',()=>{wrap.classList.remove('fit');document.querySelector('#fit').setAttribute('aria-pressed','false');document.querySelector('#actual').setAttribute('aria-pressed','true')});
}

if(typeof document!=='undefined')mount().catch(error=>{document.querySelector('#map-status').textContent=`Map could not load: ${error.message}`});
