import * as THREE from 'three';

// A compact teak side table. Its top meets the existing glass origin, so adding
// the support never changes the camera, pipe position or return animation.
export const TABLE_TOP=-.006;
function teakTexture(){
  const size=256,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const plank=Math.floor(y/43),seam=y%43<1?-.16:0;
    const grain=Math.sin(x*.37+Math.sin(y*.09)*2.8)*.023+Math.sin(x*.08+y*.04)*.016;
    const tone=1+seam+grain+Math.sin(plank*2.1)*.04,i=(y*size+x)*4;
    pixels[i]=Math.min(255,205*tone);pixels[i+1]=Math.min(255,163*tone);pixels[i+2]=Math.min(255,107*tone);pixels[i+3]=255;
  }
  const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}
export function createBeachTable(){
  const root=new THREE.Group();root.name='beach-side-table';root.userData.top=TABLE_TOP;
  const wood=new THREE.MeshStandardMaterial({map:teakTexture(),color:'#fff3df',roughness:.82,metalness:0,envMapIntensity:.45});
  const edge=new THREE.MeshStandardMaterial({color:'#a47d51',roughness:.86,metalness:0});
  const top=new THREE.Mesh(new THREE.CylinderGeometry(1.46,1.43,.10,72),wood);top.name='tabletop';top.position.y=TABLE_TOP-.05;root.add(top);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(1.425,.024,8,72),edge);rim.rotation.x=Math.PI/2;rim.position.y=TABLE_TOP-.075;root.add(rim);
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(1.26,1.21,.12,64,true),edge);skirt.position.y=TABLE_TOP-.13;root.add(skirt);
  const legs=[];
  for(let i=0;i<3;i++){
    const angle=i*Math.PI*2/3+Math.PI/6;
    const upper=new THREE.Vector3(Math.cos(angle)*.91,TABLE_TOP-.10,Math.sin(angle)*.91);
    const lower=new THREE.Vector3(Math.cos(angle)*1.08,TABLE_TOP-.94,Math.sin(angle)*1.08);
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.074,.052,upper.distanceTo(lower),12),wood);
    leg.position.copy(upper).add(lower).multiplyScalar(.5);leg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),upper.clone().sub(lower).normalize());root.add(leg);
    legs.push(new THREE.Vector3(Math.cos(angle)*1.02,TABLE_TOP-.62,Math.sin(angle)*1.02));
  }
  for(let i=0;i<3;i++){
    const a=legs[i],b=legs[(i+1)%3],brace=new THREE.Mesh(new THREE.CylinderGeometry(.026,.026,a.distanceTo(b),8),edge);
    brace.position.copy(a).add(b).multiplyScalar(.5);brace.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),a.clone().sub(b).normalize());root.add(brace);
  }
  return root;
}
