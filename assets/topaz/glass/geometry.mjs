/** Continuous closed ribbon. All temporal frequencies are integers of one cycle. */
export const GLASS = Object.freeze({
  version: '1.0', seed: 53, period: 64, fps: 30,
  desktop: {segments: 192, sides: 24, dpr: 1.5, maxPixels: 1100000},
  mobile: {segments: 112, sides: 16, dpr: 1.25, maxPixels: 420000},
  stillTime: 7, material: {ior: 1.48, absorption: [0.10, 0.62, 2.3]}
});
const TAU = Math.PI * 2;
export const phaseAt = seconds => ((seconds % GLASS.period) + GLASS.period) % GLASS.period / GLASS.period * TAU;
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const scale=(a,k)=>a.map(x=>x*k);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>scale(a,1/Math.hypot(...a));
export function ribbonCenter(u, phase) {
  const gather=(1+Math.cos(phase*2))*.5;
  const radius=1.06+(.32+.08*(1-gather))*Math.cos(u*3);
  const wind=Math.sin(u*3+phase*2)*.10 + Math.sin(u*5-phase*3)*.035;
  return [radius*Math.cos(u*2)+wind, .79*Math.sin(u*3)+.10*Math.sin(u*2-phase), radius*Math.sin(u*2)*.76+.09*Math.sin(u*3+phase)];
}
export function ribbonPoint(u,v,seconds=GLASS.stillTime) {
  const phase=phaseAt(seconds), center=ribbonCenter(u,phase);
  const forward=ribbonCenter(u+.0005,phase),back=ribbonCenter(u-.0005,phase);
  const tangent=unit(forward.map((x,i)=>x-back[i]));
  const normal=unit(cross(tangent,unit([center[0],center[1],center[2]])));
  const binormal=unit(cross(tangent,normal));
  const twist=.58*Math.sin(u*3+phase)+.17*Math.sin(u*2-phase*2);
  const width=.205+.045*Math.cos(u*3-phase*2);
  const thick=.085+.016*Math.sin(u*3+phase);
  const n=add(scale(normal,Math.cos(twist)),scale(binormal,Math.sin(twist)));
  const b=add(scale(binormal,Math.cos(twist)),scale(normal,-Math.sin(twist)));
  let p=add(center,add(scale(n,Math.cos(v)*width),scale(b,Math.sin(v)*thick)));
  const x=.32+.13*Math.sin(phase*2),y=phase-.42,z=-.28+.09*Math.sin(phase);
  p=[p[0],p[1]*Math.cos(x)-p[2]*Math.sin(x),p[1]*Math.sin(x)+p[2]*Math.cos(x)];
  p=[p[0]*Math.cos(y)+p[2]*Math.sin(y),p[1],-p[0]*Math.sin(y)+p[2]*Math.cos(y)];
  p=[p[0]*Math.cos(z)-p[1]*Math.sin(z),p[0]*Math.sin(z)+p[1]*Math.cos(z),p[2]];
  return [p[0],p[1]+.09*Math.sin(phase)-.06,p[2]];
}
export function createMesh(segments=GLASS.desktop.segments,sides=GLASS.desktop.sides) {
  const parameters=new Float32Array((segments+1)*(sides+1)*2);
  let offset=0;
  for(let s=0;s<=segments;s++)for(let v=0;v<=sides;v++){
    parameters[offset++]=s/segments*TAU;parameters[offset++]=v/sides*TAU;
  }
  const indices=new Uint16Array(segments*sides*6);offset=0;
  for(let s=0;s<segments;s++)for(let v=0;v<sides;v++){
    const a=s*(sides+1)+v,b=a+sides+1;
    indices.set([a,b,a+1,a+1,b,b+1],offset);offset+=6;
  }
  return {parameters,indices};
}

export const VERTEX = `
precision highp float;
attribute vec2 aParam;
uniform float uPhase;
uniform float uAspect;
varying vec3 vPosition;
varying vec3 vNormal;
vec3 center(float u){
 float gather=(1.0+cos(uPhase*2.0))*.5;
 float radius=1.06+(.32+.08*(1.0-gather))*cos(u*3.0);
 float wind=sin(u*3.0+uPhase*2.0)*.10+sin(u*5.0-uPhase*3.0)*.035;
 return vec3(radius*cos(u*2.0)+wind,.79*sin(u*3.0)+.10*sin(u*2.0-uPhase),radius*sin(u*2.0)*.76+.09*sin(u*3.0+uPhase));
}
vec3 pose(vec2 uv){
 float u=uv.x,v=uv.y;
 vec3 c=center(u),t=normalize(center(u+.0005)-center(u-.0005));
 vec3 n=normalize(cross(t,normalize(c))),b=normalize(cross(t,n));
 float twist=.58*sin(u*3.0+uPhase)+.17*sin(u*2.0-uPhase*2.0);
 vec3 nn=n*cos(twist)+b*sin(twist),bb=b*cos(twist)-n*sin(twist);
 float width=.205+.045*cos(u*3.0-uPhase*2.0),thick=.085+.016*sin(u*3.0+uPhase);
 vec3 p=c+nn*cos(v)*width+bb*sin(v)*thick;
 float x=.32+.13*sin(uPhase*2.0),y=uPhase-.42,z=-.28+.09*sin(uPhase);
 p=vec3(p.x,p.y*cos(x)-p.z*sin(x),p.y*sin(x)+p.z*cos(x));
 p=vec3(p.x*cos(y)+p.z*sin(y),p.y,-p.x*sin(y)+p.z*cos(y));
 p=vec3(p.x*cos(z)-p.y*sin(z),p.x*sin(z)+p.y*cos(z),p.z);
 p.y+=.09*sin(uPhase)-.06;
 return p;
}
void main(){
 vec3 p=pose(aParam);
 vPosition=p;
 vec3 du=pose(aParam+vec2(.001,0.0))-pose(aParam-vec2(.001,0.0));
 vec3 dv=pose(aParam+vec2(0.0,.001))-pose(aParam-vec2(0.0,.001));
 vNormal=normalize(cross(du,dv));
 float camera=4.8,depth=camera-p.z,zoom=3.65;
 gl_Position=vec4(p.x*zoom/uAspect,p.y*zoom,(depth-2.6)*.45,depth);
}
`;
export const FRAGMENT = `
precision mediump float;
uniform float uReflection;
varying vec3 vPosition;
varying vec3 vNormal;
vec3 studio(vec3 d){
 vec3 color=mix(vec3(.045,.026,.012),vec3(.94,.91,.83),smoothstep(-.48,.22,d.y));
 float band=exp(-pow((d.x+.26*d.y-.13)/.085,2.0));
 color=mix(color,vec3(.018,.009,.003),band*.96);
 float softbox=pow(max(0.0,dot(d,normalize(vec3(-.65,1.0,.85)))),18.0);
 float strip=exp(-pow((d.x-.18*d.y-.4)/.055,2.0))*smoothstep(-.5,-.1,d.z);
 return color+vec3(1.9,1.8,1.6)*softbox+vec3(2.7,2.55,2.3)*strip;
}
void main(){
 vec3 n=normalize(vNormal);
 vec3 eye=normalize(vec3(0.0,0.0,4.8)-vPosition);
 if(dot(n,eye)<0.0)n=-n;
 float facing=max(.001,dot(n,eye));
 float fresnel=.045+.955*pow(1.0-facing,4.3);
 vec3 reflected=studio(reflect(-eye,n));
 float thickness=.35+.85*(1.0-facing);
 vec3 absorption=exp(-vec3(.10,.62,2.3)*thickness);
 vec3 darkRim=mix(vec3(1.0),vec3(.33,.18,.055),fresnel*.80);
 vec3 transmitted=absorption*darkRim;
 float glint=pow(max(0.0,dot(reflect(-eye,n),normalize(vec3(-.55,.75,1.0)))),80.0);
 vec3 shine=reflected*(fresnel*.18+.008)+vec3(.95,.88,.73)*glint;
 gl_FragColor=vec4(uReflection>.5?shine:transmitted,1.0);
}
`;
