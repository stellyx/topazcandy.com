import * as THREE from 'three';
import {PARTS,optionFor,colorFor,graphicFor,INK_COLORS,HARDWARE_COLORS} from './catalog.js';
import {artPaths} from './art.js';

const Y_AXIS=new THREE.Vector3(0,1,0), Z_AXIS=new THREE.Vector3(0,0,1);
export function glassMaterial(hex, stronger=false) {
  return new THREE.MeshPhysicalMaterial({color:hex,metalness:0,roughness:stronger?.13:.085,transmission:stronger?.55:.76,thickness:.34,ior:1.47,clearcoat:1,clearcoatRoughness:.08,attenuationColor:new THREE.Color(hex),attenuationDistance:1.55,envMapIntensity:1.5,side:THREE.DoubleSide});
}
function mesh(group,geometry,material,position=[0,0,0]) {
  const m=new THREE.Mesh(geometry,material);m.position.set(...position);m.castShadow=false;m.receiveShadow=false;group.add(m);return m;
}
function lathe(group,points,material,position=[0,0,0]) {
  return mesh(group,new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),96),material,position);
}
function lip(group,r,y,material,tube=.037,position=[0,0,0]) {
  const m=mesh(group,new THREE.TorusGeometry(r,tube,12,80),material,[position[0],y+position[1],position[2]]);m.rotation.x=Math.PI/2;return m;
}
function tube(group,points,r,material,segments=48) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const outer=mesh(group,new THREE.TubeGeometry(curve,segments,r,24,false),material);
  const innerMaterial=material.clone();innerMaterial.side=THREE.BackSide;innerMaterial.transmission=.55;
  mesh(group,new THREE.TubeGeometry(curve,segments,Math.max(.015,r-.055),24,false),innerMaterial);
  for(const t of [0,1]) {
    const tangent=curve.getTangent(t).normalize();
    const cap=mesh(group,new THREE.RingGeometry(Math.max(.015,r-.055),r,48),material);
    cap.position.copy(curve.getPoint(t));cap.quaternion.setFromUnitVectors(Z_AXIS,tangent);
  }
  return {outer,curve};
}
function connector(group,y,settings) {
  if(!settings.hasConnector)return;
  if(settings.system==='stax'){
    const frosted=new THREE.MeshPhysicalMaterial({color:'#e3ece6',transmission:.65,roughness:.32,thickness:.12,ior:1.47});
    lathe(group,[[.39,0],[.48,0],[.49,.04],[.49,.16],[.47,.19],[.39,.19],[.39,0]],frosted,[0,y,0]);
    const clip=new THREE.MeshStandardMaterial({color:settings.hex,metalness:.08,roughness:.38});
    const clamp=mesh(group,new THREE.TorusGeometry(.50,.044,10,70,Math.PI*1.74),clip,[0,y+.1,0]);clamp.rotation.x=Math.PI/2;
    const tab=mesh(group,new THREE.BoxGeometry(.18,.08,.08),clip,[.40,y+.1,-.31]);tab.rotation.y=-.55;
    return;
  }
  const bronze=new THREE.MeshStandardMaterial({color:settings.hex,metalness:.82,roughness:.29,envMapIntensity:1.4});
  const dark=new THREE.MeshStandardMaterial({color:'#39473b',metalness:.45,roughness:.48});
  lathe(group,[[.456,0],[.515,0],[.532,.032],[.532,.15],[.515,.18],[.456,.18],[.456,0]],bronze,[0,y,0]);
  for(const n of [.052,.083,.114])lip(group,.534,y+n,dark,.006);
  lip(group,.495,y+.015,bronze,.023);lip(group,.495,y+.168,bronze,.023);
}
function makeBase(kind,mat,settings) {
  if(kind==='klein-base'||kind==='coil-base')return makeSculpturalBase(kind,mat,settings);
  const g=new THREE.Group();let profile;
  const column=['column','honey-base','turbine-base'].includes(kind);
  if(kind==='beaker')profile=[[0,0],[.94,0],[1.12,.035],[1.19,.10],[1.20,.17],[1.18,.24],[1.08,.29],[.97,.44],[.83,.73],[.66,1.13],[.52,1.51],[.46,1.70],[.46,2.03],[.382,2.03],[.382,1.70],[.45,1.50],[.59,1.13],[.76,.73],[.89,.45],[1.01,.29],[1.08,.22],[1.05,.145],[.94,.12],[0,.12]];
  if(kind==='bubble')profile=[[0,0],[.73,0],[.86,.04],[1.02,.18],[1.16,.39],[1.19,.60],[1.13,.82],[.99,1.06],[.81,1.28],[.62,1.47],[.48,1.62],[.46,1.75],[.46,2.03],[.382,2.03],[.382,1.75],[.40,1.62],[.55,1.47],[.74,1.28],[.92,1.06],[1.05,.82],[1.11,.60],[1.08,.40],[.96,.23],[.82,.12],[0,.12]];
  if(column)profile=[[0,0],[.80,0],[.89,.045],[.90,.13],[.84,.21],[.70,.24],[.67,.30],[.67,1.25],[.65,1.42],[.54,1.62],[.46,1.72],[.46,2.03],[.382,2.03],[.382,1.73],[.47,1.60],[.57,1.42],[.59,1.25],[.59,.30],[.60,.21],[0,.16]];
  lathe(g,profile,mat);lip(g,column?.83:1.115,.11,mat,.028);
  g.userData.artSurface=profileSurface(profile,.32,1.53);
  const inner=new THREE.MeshPhysicalMaterial({color:'#c5d6b6',transmission:.84,opacity:.34,transparent:true,roughness:.12,metalness:0,ior:1.33,thickness:.05,side:THREE.DoubleSide,envMapIntensity:.8});
  if(column)lathe(g,[[0,.18],[.57,.18],[.57,.65],[0,.65]],inner);
  else if(kind==='bubble')lathe(g,[[0,.17],[.88,.17],[1.01,.38],[1.05,.6],[0,.6]],inner);
  else lathe(g,[[0,.15],[.95,.15],[1.03,.23],[.93,.39],[.83,.59],[0,.59]],inner);
  const stemMat=glassMaterial('#d6e2d5',true);
  if(kind==='honey-base'||kind==='turbine-base'){
    tube(g,[[0,.35,0],[.37,.40,.27],[.81,.48,.63],[1.0,.70,.84],[1.0,1.08,.84]],.13,stemMat);
    lip(g,.15,1.08,mat,.033,[1,0,.84]);g.userData.bowlTarget=[1,1.08,.84];
    if(kind==='honey-base')diffusionDisk(g,.57,.56,stemMat);
    else{
      lip(g,.40,.66,stemMat,.065);
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const blade=mesh(g,new THREE.BoxGeometry(.32,.035,.065),stemMat,[Math.cos(a)*.28,.64,Math.sin(a)*.28]);blade.rotation.y=-a+.55;}
    }
  }else{
    tube(g,[[.0,.42,.02],[.35,.78,.30],[.74,1.17,.63],[.95,1.38,.82]],.13,stemMat);
    const outlet=lip(g,.167,0,mat,.031);outlet.position.set(.87,1.30,.73);outlet.quaternion.setFromUnitVectors(Z_AXIS,new THREE.Vector3(.6,.6,.52).normalize());
    g.userData.bowlTarget=[.96,1.39,.84];
  }
  connector(g,1.95,settings);
  return g;
}
function makeSculpturalBase(kind,mat,settings){
  const g=new THREE.Group(),profile=[[0,0],[.79,0],[.90,.04],[.91,.13],[.85,.21],[.63,.25],[.60,.31],[.60,1.83],[.55,1.90],[.46,1.96],[.46,2.20],[.382,2.20],[.382,1.98],[.49,1.91],[.52,1.82],[.52,.32],[.56,.22],[0,.16]];
  lathe(g,profile,mat);lip(g,.85,.11,mat,.03);g.userData.artSurface=profileSurface(profile,.33,1.79);
  const core=glassMaterial('#dce5df',true);
  tube(g,[[-.03,.40,0],[-.62,.42,.1],[-.92,.55,.18],[-.92,1.52,.18]],.14,core,54);
  lip(g,.165,1.52,mat,.028,[-.92,0,.18]);g.userData.bowlTarget=[-.92,1.52,.18];
  if(kind==='coil-base'){
    const turns=[];for(let i=0;i<=160;i++){const t=i/160,a=t*Math.PI*10;turns.push([Math.cos(a)*.34,.55+t*1.18,Math.sin(a)*.34]);}
    tube(g,turns,.063,core,150);tube(g,[[.34,.55,0],[.25,.49,0],[0,.45,0]],.07,core,24);
    tube(g,[[0,1.85,0],[0,.46,0]],.08,core,40);
    lathe(g,[[.08,.51],[.19,.47],[.20,.32],[.14,.32],[.14,.43],[.05,.47]],core);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const slit=mesh(g,new THREE.BoxGeometry(.012,.07,.018),new THREE.MeshStandardMaterial({color:'#c4d8ce',roughness:.3}),[Math.cos(a)*.20,.38,Math.sin(a)*.20]);slit.rotation.y=-a;}
  }else{
    lathe(g,[[.10,1.08],[.13,1.16],[.46,1.51],[.46,1.77],[.40,1.77],[.40,1.53],[.085,1.18],[.05,1.08]],core);
    tube(g,[[0,1.11,0],[.07,.83,0],[.37,.63,0],[.57,.57,0],[.59,.37,0],[.16,.28,0]],.059,core,70);
    tube(g,[[.58,.45,0],[.82,.55,-.02],[.83,.83,-.02],[.56,.89,0]],.061,core,48);
    lathe(g,[[.07,.46],[.21,.44],[.22,.30],[.16,.30],[.16,.39],[.04,.42]],core);
  }
  connector(g,2.12,settings);return g;
}
function diffusionDisk(group,r,y,material){
  const shape=new THREE.Shape();shape.absarc(0,0,r,0,Math.PI*2,false);
  for(let ring=0;ring<3;ring++){const n=ring===0?1:ring*7;const radius=ring*r*.34;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,hole=new THREE.Path();hole.absarc(Math.cos(a)*radius,Math.sin(a)*radius,r*.097,0,Math.PI*2,true);shape.holes.push(hole);}}
  const plate=mesh(group,new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false,curveSegments:10}),material,[0,y,0]);plate.rotation.x=Math.PI/2;
}
function makeChamber(kind,mat,settings) {
  const g=new THREE.Group();
  lathe(g,[[.38,0],[.46,0],[.46,.15],[.485,.20],[.485,.97],[.46,1.04],[.46,1.17],[.38,1.17],[.38,1.04],[.407,.97],[.407,.20],[.38,.15],[.38,0]],mat);
  g.userData.artSurface=profileSurface([[.485,.20],[.485,.97]],.24,.94);
  const core=glassMaterial(mat.color.getHexString().padStart(6,'0').replace(/^/,'#'),true);
  if(kind==='spiral'){
    const p=[];for(let i=0;i<=120;i++){const t=i/120,a=t*Math.PI*6.4;p.push([Math.cos(a)*.267,.17+t*.82,Math.sin(a)*.267]);}
    tube(g,p,.07,core,100);
    tube(g,[[.267,.17,0],[.2,.1,0],[0,.06,0]],.09,core);
  }else if(kind==='honeycomb'){
    for(const y of [.31,.64]){
      const shape=new THREE.Shape();shape.absarc(0,0,.38,0,Math.PI*2,false);
      for(let ring=0;ring<3;ring++){const n=ring===0?1:ring*7;const r=ring*.128;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const hole=new THREE.Path();hole.absarc(Math.cos(a)*r,Math.sin(a)*r,.037,0,Math.PI*2,true);shape.holes.push(hole);}}
      const plate=mesh(g,new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false,curveSegments:12}),core,[0,y,0]);plate.rotation.x=Math.PI/2;
    }
    tube(g,[[0,.1,0],[0,.89,0]],.105,core);
  }else if(['halo','circle','shower'].includes(kind)){
    tube(g,[[0,1.05,0],[0,.76,0]],.105,core);
    const radius=kind==='shower'?.23:.28;
    if(kind==='shower'){
      lathe(g,[[.1,.75],[.1,.63],[.23,.59],[.23,.31],[.17,.31],[.17,.54],[.065,.57],[.065,.75]],core);
    }else{
      lip(g,radius,.48,core,.065);
      for(const sign of [-1,1])tube(g,[[0,.76,0],[sign*.17,.70,0],[sign*radius,.55,0],[sign*radius,.48,0]],.062,core,24);
    }
    const slash=new THREE.MeshStandardMaterial({color:'#a3b5a8',roughness:.4});
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2,bar=mesh(g,new THREE.BoxGeometry(.011,.10,.021),slash,[Math.cos(a)*radius,.38,Math.sin(a)*radius]);bar.rotation.y=-a;}
  }else{
    tube(g,[[0,1.05,0],[0,.79,0]],.12,core);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.cos(a)*.26,z=Math.sin(a)*.26;
      tube(g,[[0,.85,0],[x*.6,.82,z*.6],[x,.72,z],[x,.2,z]],.07,core,24);
      const slash=new THREE.MeshStandardMaterial({color:'#7e9980',roughness:.4});
      for(const y of [.24,.29])lip(g,.071,y,slash,.008,[x,0,z]);
    }
  }
  connector(g,1.08,settings);return g;
}
function makeNeck(kind,mat) {
  const g=new THREE.Group();
  if(kind==='bent'){
    const result=tube(g,[[0,0,0],[0,.34,0],[0,.74,0],[.08,1.10,0],[.30,1.36,0],[.62,1.56,0]],.36,mat,64);
    g.userData.smokeOutlet={position:result.curve.getPoint(1).toArray(),direction:result.curve.getTangent(1).normalize().toArray()};
    g.userData.artSurface=(u,v)=>{const t=.15+v*.72,center=result.curve.getPoint(t),tangent=result.curve.getTangent(t).normalize(),q=new THREE.Quaternion().setFromUnitVectors(Y_AXIS,tangent),a=u*Math.PI*2;return new THREE.Vector3(Math.sin(a)*.369,0,Math.cos(a)*.369).applyQuaternion(q).add(center);};
    const rim=mesh(g,new THREE.TorusGeometry(.331,.047,16,80),mat);
    rim.position.copy(result.curve.getPoint(1));rim.quaternion.setFromUnitVectors(Z_AXIS,result.curve.getTangent(1).normalize());
    lip(g,.397,.04,mat,.033);
  }else{
    let outer=kind==='flared'?[[.46,0],[.46,.10],[.36,.18],[.36,1.26],[.39,1.38],[.46,1.54],[.51,1.60],[.51,1.67],[.43,1.67],[.43,1.60],[.39,1.48],[.32,1.31],[.285,1.26],[.285,.18],[.382,.10],[.382,0],[.46,0]]:[[.46,0],[.46,.10],[.36,.19],[.36,1.61],[.39,1.65],[.39,1.70],[.29,1.70],[.29,1.62],[.285,.19],[.382,.10],[.382,0],[.46,0]];
    if(kind==='helix')outer=[[.46,0],[.46,.1],[.37,.23],[.44,.36],[.54,.57],[.57,.77],[.51,1.03],[.38,1.26],[.32,1.40],[.36,1.66],[.36,1.70],[.28,1.70],[.25,1.40],[.30,1.26],[.44,1.03],[.50,.77],[.47,.57],[.37,.36],[.30,.23],[.38,.10],[.38,0],[.46,0]];
    if(kind==='trumpet'){
      const frost=new THREE.MeshPhysicalMaterial({color:'#e7eee9',transmission:.6,roughness:.3,thickness:.12,ior:1.47});
      lathe(g,[[.38,0],[.46,0],[.46,.14],[.39,.20],[.25,.26],[.20,.26],[.31,.16],[.38,.14],[.38,0]],frost);g.userData.includedAdapter=true;
      outer=[[.22,.18],[.22,.27],[.16,.40],[.16,1.43],[.20,1.52],[.30,1.65],[.33,1.70],[.28,1.70],[.25,1.64],[.15,1.51],[.11,1.43],[.11,.41],[.17,.27],[.17,.18],[.22,.18]];
    }
    g.userData.artSurface=profileSurface(outer,.28,1.50);
    lathe(g,outer,mat);lip(g,kind==='flared'?.47:kind==='trumpet'?.30:.34,kind==='trumpet'?1.685:1.655,mat,.039);
    g.userData.smokeOutlet={position:[0,kind==='flared'?1.67:1.70,0],direction:[0,1,0]};
  }
  return g;
}
function makeBowl(kind,mat) {
  const g=new THREE.Group();
  tube(g,[[0,0,0],[.13,.13,.12],[.22,.30,.20]],.125,mat,28);
  const wide=kind==='wide',r=wide?.37:.29;
  lathe(g,[[.13,0],[.15,.08],[r*.88,.25],[r,.38],[r,.44],[r-.055,.44],[r-.06,.38],[.11,.14],[.075,.1],[.075,0],[.13,0]],mat,[.22,.28,.20]);
  lip(g,r-.028,.71,mat,.028,[.22,0,.20]);
  g.userData.artSurface=profileSurface([[r*.55,.45],[r*.88,.53],[r,.66]],.46,.66,[.22,0,.20]);
  if(kind==='loop')tube(g,[[.42,.63,.22],[.67,.69,.24],[.74,.54,.24],[.64,.39,.23],[.40,.43,.21]],.04,mat,36);
  else mesh(g,new THREE.SphereGeometry(.074,16,12),mat,[.22+r+.034,.53,.20]);
  return g;
}
function profileSurface(profile,minY,maxY,offset=[0,0,0]){
  const highest=Math.max(...profile.map(p=>p[1])),end=profile.findIndex(p=>p[1]===highest),outer=end<1?profile:profile.slice(0,end+1);
  return (u,v)=>{
    const y=minY+v*(maxY-minY);let radius=outer.at(-1)[0];
    for(let i=0;i<outer.length-1;i++){const [r0,y0]=outer[i],[r1,y1]=outer[i+1];if(y>=y0&&y<=y1&&y1!==y0){radius=THREE.MathUtils.lerp(r0,r1,(y-y0)/(y1-y0));break;}}
    const a=u*Math.PI*2;return new THREE.Vector3(Math.sin(a)*(radius+.009)+offset[0],y+offset[1],Math.cos(a)*(radius+.009)+offset[2]);
  };
}
function surfaceArtwork(group,kind,colors){
  const surface=group.userData.artSurface;if(!surface||kind==='none')return;
  const batches=[[],[],[]];
  function triangle(a,b,c,ink,depth=0){
    // Subdivide before wrapping so large flat triangles stay on curved glass.
    const edges=[[a,b,c],[b,c,a],[c,a,b]],longest=edges.sort((p,q)=>Math.hypot(q[0][0]-q[1][0],q[0][1]-q[1][1])-Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]))[0];
    if(depth<9&&(Math.abs(longest[0][0]-longest[1][0])>.024||Math.abs(longest[0][1]-longest[1][1])>.065)){
      const mid=[(longest[0][0]+longest[1][0])/2,(longest[0][1]+longest[1][1])/2];triangle(longest[0],mid,longest[2],ink,depth+1);triangle(mid,longest[1],longest[2],ink,depth+1);return;
    }
    for(const point of [a,b,c]){const mapped=surface(...point);batches[ink].push(mapped.x,mapped.y,mapped.z);}
  }
  for(const path of artPaths(kind)){
    if(path.fill){const points=path.points.map(p=>new THREE.Vector2(...p));for(const [a,b,c]of THREE.ShapeUtils.triangulateShape(points,[]))triangle(path.points[a],path.points[b],path.points[c],path.ink);}
    else for(let i=0;i<path.points.length-1;i++){
      const a=path.points[i],b=path.points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<.00001)continue;
      const nx=-dy/length*path.width/2,ny=dx/length*path.width/2,pa=[a[0]+nx,a[1]+ny],pb=[b[0]+nx,b[1]+ny],pc=[b[0]-nx,b[1]-ny],pd=[a[0]-nx,a[1]-ny];triangle(pa,pb,pc,path.ink);triangle(pa,pc,pd,path.ink);
    }
  }
  for(let i=0;i<batches.length;i++)if(batches[i].length){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(batches[i],3));geometry.computeVertexNormals();
    const print=mesh(group,geometry,new THREE.MeshBasicMaterial({color:colors[i],side:THREE.DoubleSide,toneMapped:false}));print.userData.artwork=kind;
  }
}
export function createModel(build) {
  const root=new THREE.Group(),groups={},targets={};
  const baseHeight=build.parts.base.enabled?optionFor(build,'base').height:.12;
  const chamberHeight=build.parts.chamber.enabled?optionFor(build,'chamber').height:0;
  for(const p of PARTS){
    if(!build.parts[p.id].enabled)continue;
    const option=optionFor(build,p.id),mat=glassMaterial(colorFor(build,p.id).hex);
    let group;
    const settings={system:build.system,hex:HARDWARE_COLORS.find(c=>c.id===build.hardware)?.hex||'#c1a47b',hasConnector:p.id==='base'?(build.parts.chamber.enabled||build.parts.neck.enabled):build.parts.neck.enabled};
    if(p.id==='base')group=makeBase(option.kind,mat,settings);
    else if(p.id==='chamber')group=makeChamber(option.kind,mat,settings);
    else if(p.id==='neck')group=makeNeck(option.kind,mat);
    else group=makeBowl(option.kind,mat);
    surfaceArtwork(group,graphicFor(build,p.id),(INK_COLORS.find(c=>c.id===build.ink)||INK_COLORS[0]).colors);
    if(p.id==='chamber')group.scale.y=option.height/1.17;
    if(p.id==='neck')group.scale.y=option.height/1.70;
    const bowlTarget=groups.base?.userData.bowlTarget||[.96,.18,.84];
    const target=p.id==='base'?new THREE.Vector3(0,0,0):p.id==='chamber'?new THREE.Vector3(0,baseHeight,0):p.id==='neck'?new THREE.Vector3(0,baseHeight+chamberHeight,0):new THREE.Vector3(...bowlTarget);
    const exploded=target.clone();
    if(p.id==='chamber')exploded.y+=.70;
    if(p.id==='neck')exploded.y+=build.parts.chamber.enabled?1.40:.70;
    if(p.id==='bowl'){exploded.x+=.58;exploded.y+=.35;exploded.z+=.34;}
    group.name=p.id;group.position.copy(build.exploded?exploded:target);
    group.traverse(obj=>{if(obj.isMesh){obj.userData.part=p.id;obj.userData.glass=obj.material.isMeshPhysicalMaterial;obj.userData.initialIntensity=obj.material.envMapIntensity;}});
    root.add(group);groups[p.id]=group;targets[p.id]={assembled:target,exploded};
  }
  const height=Math.max(2.5,baseHeight+chamberHeight+(build.parts.neck.enabled?optionFor(build,'neck').height:0));
  return {root,groups,targets,height};
}
export function disposeModel(root) {
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
