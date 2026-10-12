import * as THREE from 'three';

export function smokeOutletFor(model){
  const neck=model.groups.neck,outlet=neck?.userData.smokeOutlet;
  if(!outlet)return null;
  neck.updateWorldMatrix(true,false);
  return {position:new THREE.Vector3(...outlet.position).applyMatrix4(neck.matrixWorld),direction:new THREE.Vector3(...outlet.direction).transformDirection(neck.matrixWorld)};
}
export function canShowSmoke(build,{reducedMotion=false,settled=true}={}){
  return build.spin&&!build.exploded&&!reducedMotion&&settled&&['base','neck','bowl'].every(id=>build.parts[id].enabled);
}
export function smokePuff(outlet,age,index=0){
  // Begin just outside the open lip, follow its angle briefly, then drift upward.
  const position=outlet.position.clone().addScaledVector(outlet.direction,.035+age*.14);
  position.y+=age*.83;
  position.x+=Math.sin(age*5.2+index*.83)*age*.075;
  position.z+=Math.cos(age*4.3+index*1.17)*age*.055;
  return {position,size:.085+age*.31,opacity:Math.pow(Math.sin(Math.PI*age),1.5)*.114};
}
function smokeTexture(){
  const size=64,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=(x+.5-size/2)/(size/2),v=(y+.5-size/2)/(size/2),r=Math.hypot(u,v),i=(y*size+x)*4;
    const soft=Math.max(0,1-r),noise=.86+.14*Math.sin(x*.27+Math.sin(y*.31)*2);
    pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(255*Math.pow(soft,1.8)*noise);
  }
  const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
  return texture;
}
export function createSmokeEffect(){
  const root=new THREE.Group();root.name='mouthpiece-smoke';root.visible=false;
  const texture=smokeTexture(),puffs=Array.from({length:20},(_,i)=>{
    const material=new THREE.SpriteMaterial({map:texture,color:'#dce5df',transparent:true,opacity:0,depthWrite:false,fog:false,toneMapped:false});
    const sprite=new THREE.Sprite(material);sprite.material.rotation=i*.83;sprite.renderOrder=3;root.add(sprite);return sprite;
  });
  function hide(){root.visible=false;}
  function update(model,build,elapsed,options={}){
    const outlet=smokeOutletFor(model);root.visible=!!outlet&&canShowSmoke(build,options);
    if(!root.visible)return;
    for(let i=0;i<puffs.length;i++){
      const age=((elapsed/5.8+i/puffs.length)%1+1)%1,sample=smokePuff(outlet,age,i),sprite=puffs[i];
      sprite.position.copy(sample.position);sprite.scale.set(sample.size,sample.size*1.32,1);
      sprite.material.color.set(build.background==='light'?'#6d8276':'#dce5df');sprite.material.opacity=sample.opacity;
    }
  }
  function dispose(){texture.dispose();for(const p of puffs)p.material.dispose();}
  return {root,update,hide,dispose};
}
export function projectPartBounds(group,camera,width,height){
  if(!group||width<1||height<1)return null;
  group.updateWorldMatrix(true,true);camera.updateMatrixWorld();
  const box=new THREE.Box3().setFromObject(group);if(box.isEmpty())return null;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,inView=false;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
    const p=new THREE.Vector3(x,y,z).project(camera);inView||=p.z>=-1&&p.z<=1;
    const px=(p.x+1)*width/2,py=(1-p.y)*height/2;minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);
  }
  if(!inView||maxX<0||minX>width||maxY<0||minY>height)return null;
  const left=Math.max(8,minX-9),top=Math.max(37,minY-9),right=Math.min(width-8,maxX+9),bottom=Math.min(height-15,maxY+9);
  return right>left&&bottom>top?{left,top,width:right-left,height:bottom-top}:null;
}
