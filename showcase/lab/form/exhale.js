import * as THREE from 'three';

const blend={transparent:false,blending:THREE.CustomBlending,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneMinusSrcAlphaFactor,depthTest:false,depthWrite:false,toneMapped:false,fog:false};
const clamp=THREE.MathUtils.clamp;

export function smokeCueLayout({width,height,x,y,progress=0}){
  const w=clamp(width*.58,240,380),h=w*360/640;
  const anchor=clamp(x-w*.71,-w*.13,width-w*.85),entrance=Math.min(anchor,-w*.30);
  const arrival=1-Math.pow(1-clamp(progress/.32,0,1),3);
  const left=entrance+(anchor-entrance)*arrival+progress*18;
  const top=clamp(y-h*.80,-h*.17,height-h*.72)-progress*14;
  const hitWidth=Math.min(w*.69,width-16),hitHeight=Math.max(44,h*.28);
  return {
    clip:{left,top,width:w,height:h},
    hit:{left:clamp(left+w*.17,8,Math.max(8,width-hitWidth-8)),top:clamp(top+h*.40,8,Math.max(8,height-hitHeight-8)),width:hitWidth,height:hitHeight},
    arrow:{left:x-25+progress*12,top:y-18-progress*8,width:34,height:29},
  };
}

// Keep the effect in the opaque pass, with explicit alpha blending. Three's
// glass transmission pass then sees the smoke in its background texture too.
// Sorting a normal transparent plane behind transmissive glass is insufficient:
// transparent objects are drawn after that glass pass.
export function createExhaleEffect({video,videoTexture,loadTexture}={}){
  const root=new THREE.Group();root.name='offscreen-exhale';root.renderOrder=-100;root.visible=false;
  const material=new THREE.ShaderMaterial({
    ...blend,
    uniforms:{clip:{value:videoTexture||null},opacity:{value:0}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform sampler2D clip; uniform float opacity; varying vec2 vUv;
      void main(){
        vec2 uv=vec2(clamp(vUv.x*.5,.5/1280.0,.5-.5/1280.0),vUv.y);
        vec3 rgb=texture2D(clip,uv).rgb;
        float alpha=texture2D(clip,uv+vec2(.5,0.0)).r;
        alpha*=smoothstep(.006,.035,alpha)*opacity;
        if(alpha<.001)discard;
        gl_FragColor=vec4(sRGBTransferEOTF(vec4(rgb,1.0)).rgb,alpha);
        #include <colorspace_fragment>
      }`,
  });
  const geometry=new THREE.PlaneGeometry(1,1),clip=new THREE.Mesh(geometry,material);clip.name='smoke-letter-video';clip.renderOrder=-100;clip.frustumCulled=false;root.add(clip);
  const fallbackMaterial=new THREE.MeshBasicMaterial({...blend,opacity:0});
  const fallback=new THREE.Mesh(geometry,fallbackMaterial);fallback.name='smoke-letter-fallback';fallback.renderOrder=-99;fallback.frustumCulled=false;root.add(fallback);
  const arrowMaterial=new THREE.MeshBasicMaterial({...blend,opacity:0});
  const arrow=new THREE.Mesh(geometry,arrowMaterial);arrow.name='smoke-pointer';arrow.renderOrder=-98;arrow.frustumCulled=false;root.add(arrow);
  const pixels=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const i=(y*64+x)*4,r=Math.hypot((x-31.5)/32,(y-31.5)/32);
    pixels[i]=pixels[i+1]=pixels[i+2]=228;pixels[i+3]=Math.round(255*Math.pow(Math.max(0,1-r),2));
  }
  const puffTexture=new THREE.DataTexture(pixels,64,64,THREE.RGBAFormat);puffTexture.colorSpace=THREE.SRGBColorSpace;puffTexture.needsUpdate=true;
  const puffs=Array.from({length:16},(_,i)=>{
    const puff=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({...blend,map:puffTexture,opacity:0}));puff.renderOrder=-100;puff.frustumCulled=false;root.add(puff);return puff;
  });
  let active=false,lettering=false,startTime=0,duration=4,mediaFailed=false,playing=false,attempt=0,layout=null,prepared=false;
  function prepare(){
    if(prepared)return;prepared=true;
    if(video){video.muted=true;video.volume=0;video.preload='auto';video.load?.();}
    loadTexture?.('./assets/smoke-tap.svg',texture=>{texture.colorSpace=THREE.SRGBColorSpace;fallbackMaterial.map=texture;fallbackMaterial.needsUpdate=true;});
    loadTexture?.('./assets/smoke-arrow.svg',texture=>{texture.colorSpace=THREE.SRGBColorSpace;arrowMaterial.map=texture;arrowMaterial.needsUpdate=true;});
  }
  video?.addEventListener('error',()=>{mediaFailed=true;playing=false;});
  function show(time,{letters=false,durationMs=4000}={}){
    hide();active=true;lettering=letters;startTime=time;duration=durationMs/1000;
    if(letters)prepare();
    if(!letters||!video||mediaFailed)return;
    const token=attempt;
    try{
      video.currentTime=0;video.playbackRate=(Number.isFinite(video.duration)&&video.duration>0?video.duration:6)/duration;
      playing=true;
      video.play()?.catch?.(()=>{if(token===attempt){playing=false;mediaFailed=true;}});
    }catch{playing=false;mediaFailed=true;}
  }
  function hide(){
    attempt++;active=false;playing=false;root.visible=false;layout=null;
    video?.pause();
  }
  function place(object,rect,camera,width,height,depth){
    const direction=new THREE.Vector3();camera.getWorldDirection(direction);
    const point=new THREE.Vector3((rect.left+rect.width/2)/width*2-1,1-(rect.top+rect.height/2)/height*2,0).unproject(camera);
    const distance=point.clone().sub(camera.position).dot(direction);
    object.position.copy(point).addScaledVector(direction,depth-distance);object.quaternion.copy(camera.quaternion);
    object.scale.set((camera.right-camera.left)/camera.zoom*rect.width/width,(camera.top-camera.bottom)/camera.zoom*rect.height/height,1);
  }
  function update(time,{camera,model,width,height,allowed=true}={}){
    if(!active)return;
    if(!allowed||time-startTime>=duration){hide();return;}
    const age=Math.max(0,time-startTime),progress=clamp(age/duration,0,1);
    const fade=Math.min(1,age/.16,(duration-age)/.42);
    root.visible=true;model.root.updateWorldMatrix(true,true);camera.updateMatrixWorld();
    const bounds=new THREE.Box3().setFromObject(model.root),center=bounds.getCenter(new THREE.Vector3()).project(camera);
    let depth=0;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])depth=Math.max(depth,-new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse).z);
    depth=Math.min(camera.far-1,depth+2);
    layout=smokeCueLayout({width,height,x:(center.x+1)*width/2,y:(1-center.y)*height/2,progress});
    const hasVideo=lettering&&playing&&!mediaFailed&&video?.readyState>=2&&!video.ended;
    clip.visible=hasVideo;material.uniforms.opacity.value=fade;
    if(hasVideo)place(clip,layout.clip,camera,width,height,depth);
    fallback.visible=lettering&&!hasVideo&&!!fallbackMaterial.map;fallbackMaterial.opacity=fade*.93;
    if(fallback.visible)place(fallback,{...layout.hit,width:Math.min(138,layout.hit.width),height:32},camera,width,height,depth);
    arrow.visible=lettering&&!!arrowMaterial.map;arrowMaterial.opacity=fade*.85;
    if(arrow.visible)place(arrow,layout.arrow,camera,width,height,depth);
    for(let i=0;i<puffs.length;i++){
      const puff=puffs[i],t=clamp((age-i*.055)/3.2,0,1),size=(57+i*3)*(.6+t*1.75);
      puff.visible=!hasVideo;puff.material.opacity=Math.sin(Math.PI*t)*.27*fade;
      if(puff.visible)place(puff,{left:-75+t*(170+i*8)*(width<500?.6:1),top:height*(width<500?.35:.39)+t*(-30-Math.sin(i*.78)*30)-size/2,width:size,height:size},camera,width,height,depth);
    }
  }
  return {root,prepare,show,hide,update,get layout(){return layout;},get active(){return active;}};
}
