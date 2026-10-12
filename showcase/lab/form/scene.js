import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createModel,disposeModel} from './model.js';
import {PARTS,sanitizeView,sanitizeBuild} from './catalog.js';
import {createSmokeEffect,projectPartBounds} from './effects.js';
import {createSelectionGesture} from './selection.js';
import {grabPose} from './welcome.js';
import {beachFrame} from './backdrop.js';
import {createBeachTable} from './table.js';
import {createExhaleEffect} from './exhale.js';

export function initScene(container,build,{onSelect,onInteraction,onAssembled,onViewChange,isReducedMotion=()=>false,isBeach=()=>false,backgroundVideo,smokeVideo,enableWelcome=false,onWelcomeReady,onWelcomeReturned,onWelcomeInterrupted,onWelcomeUnavailable}={}) {
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const camera=new THREE.OrthographicCamera(-5,5,4,-4,.1,60);
  camera.position.set(6.7,5.2,9.5);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(0,2.5,0);controls.enableDamping=true;controls.dampingFactor=.08;
  controls.enablePan=false;controls.autoRotate=build.spin&&!build.exploded&&!isReducedMotion();controls.autoRotateSpeed=.60;
  controls.minPolarAngle=.38;controls.maxPolarAngle=1.78;controls.minZoom=.72;controls.maxZoom=2.6;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.05);scene.environment=environment.texture;
  room.dispose();pmrem.dispose();
  const key=new THREE.DirectionalLight('#f4f9ef',3.4);key.position.set(3,7,5);scene.add(key);
  const rim=new THREE.DirectionalLight('#beddb8',2.1);rim.position.set(-5,3,-3);scene.add(rim);
  const fill=new THREE.DirectionalLight('#ede1c7',1.3);fill.position.set(4,2,-5);scene.add(fill);
  scene.add(new THREE.HemisphereLight('#d1ddcc','#31482f',1));
  const floorMat=new THREE.MeshStandardMaterial({color:'#0c100e',roughness:.82,metalness:.12});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.055;scene.add(floor);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
  const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(128,128,0,128,128,125);
  gradient.addColorStop(0,'rgba(0,0,0,.52)');gradient.addColorStop(.38,'rgba(0,0,0,.22)');gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
  shadow.name='glass-contact-shadow';shadow.rotation.x=-Math.PI/2;shadow.position.y=-.024;scene.add(shadow);
  const table=createBeachTable();scene.add(table);
  let current=createModel(build),state=build;
  scene.add(current.root);
  const smoke=createSmokeEffect();scene.add(smoke.root);
  const selectionCue=container.querySelector('.selection-cue'),selectionName=selectionCue.querySelector('.selection-name');
  const customizeHint=container.parentElement?.querySelector?.('.customize-hint');
  let viewHeight=7,active=true,lastTime=0,animating=false,visible=!document.hidden,effectTime=0,lastViewSave=0;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const selectionGesture=createSelectionGesture();
  let welcomeBuild=null,welcomeActive=false,grabStarted=null,returned=false,handReady=false,handLoading=false,handFailed=false;
  const handMaterial=new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
  const hand=new THREE.Sprite(handMaterial);hand.name='welcome-hand';hand.center.set(.741,.53);hand.renderOrder=20;hand.visible=false;scene.add(hand);
  function prepareWelcome(){
    if(handReady||handLoading||handFailed)return;handLoading=true;
    new THREE.TextureLoader().load('./assets/welcome-hand.webp',texture=>{texture.colorSpace=THREE.SRGBColorSpace;handMaterial.map=texture;handMaterial.needsUpdate=true;handLoading=false;handReady=true;onWelcomeReady?.();},undefined,()=>{handLoading=false;handFailed=true;onWelcomeUnavailable?.();});
  }
  if(enableWelcome)prepareWelcome();
  const smokeVideoTexture=smokeVideo?new THREE.VideoTexture(smokeVideo):null;
  if(smokeVideoTexture)smokeVideoTexture.colorSpace=THREE.NoColorSpace;
  const exhale=createExhaleEffect({video:smokeVideo,videoTexture:smokeVideoTexture,loadTexture:(path,onLoad)=>new THREE.TextureLoader().load(path,onLoad)});scene.add(exhale.root);
  if(enableWelcome)exhale.prepare();
  const beachTexture=backgroundVideo?new THREE.VideoTexture(backgroundVideo):null;
  if(beachTexture)beachTexture.colorSpace=THREE.SRGBColorSpace;
  const beachPoster=new THREE.TextureLoader().load('./assets/beach-poster.jpg',()=>{setBackground(state.background);size();});beachPoster.colorSpace=THREE.SRGBColorSpace;
  backgroundVideo?.addEventListener('loadeddata',()=>{setBackground(state.background);size();});
  backgroundVideo?.addEventListener('error',()=>setBackground(state.background));

  function fitBeachTexture(texture){
    if(!texture)return;
    const surface=container.parentElement,sw=surface?.clientWidth||container.clientWidth,sh=surface?.clientHeight||container.clientHeight;
    const image=texture===beachTexture?backgroundVideo:texture.image,iw=image?.videoWidth||image?.naturalWidth||image?.width||1280,ih=image?.videoHeight||image?.naturalHeight||image?.height||720;
    const frame=beachFrame({surfaceWidth:sw,surfaceHeight:sh,width:container.clientWidth,height:container.clientHeight,imageWidth:iw,imageHeight:ih,left:container.offsetLeft||0,top:container.offsetTop||0});
    surface?.style.setProperty('--beach-x',frame.position*100+'%');
    texture.repeat.set(...frame.repeat);texture.offset.set(...frame.offset);texture.updateMatrix();
  }
  function startWelcome(){
    if(!handReady||welcomeActive||isReducedMotion()||state.exploded||!current.groups.base||!current.groups.neck)return false;
    // Carry the actual rendered piece. The independent motion snapshot lets
    // smoke pause without changing its saved design, materials or spin state.
    welcomeBuild=sanitizeBuild({...state,spin:true,selected:null});
    welcomeActive=true;grabStarted=null;returned=false;selectionCue.hidden=true;controls.autoRotate=true;
    updateGrounding();return true;
  }
  function grabWelcome(){if(welcomeActive&&grabStarted===null){grabStarted=effectTime;welcomeBuild.spin=false;controls.autoRotate=false;smoke.hide();}}
  function stopWelcome(){
    if(!welcomeActive)return;welcomeActive=false;hand.visible=false;
    exhale.hide();
    current.root.position.set(0,0,0);current.root.updateMatrixWorld(true);welcomeBuild=null;
    controls.autoRotate=state.spin&&!state.exploded&&!isReducedMotion();updateGrounding();selectPart(state.selected);smoke.update(current,state,effectTime,{reducedMotion:isReducedMotion(),settled:!animating});
  }
  function animateWelcome(dt){
    if(!welcomeActive)return;
    if(grabStarted===null){controls.update(dt);return;}
    const pose=grabPose(effectTime-grabStarted);camera.updateMatrixWorld();
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
    const width=(camera.right-camera.left)/camera.zoom,height=(camera.top-camera.bottom)/camera.zoom;
    if(pose.carry)current.root.position.copy(right).multiplyScalar(-pose.carry*width*1.1).addScaledVector(up,pose.carry*height*.13);
    else current.root.position.set(0,0,0);
    current.root.updateMatrixWorld(true);
    const neck=current.groups.neck,grip=neck.localToWorld(new THREE.Vector3(0,.22,0));
    hand.position.copy(grip).addScaledVector(right,-(1-pose.approach)*width*1.25);
    const handWidth=Math.max(7.8/camera.zoom,width/(2*hand.center.x)+1/camera.zoom);
    hand.scale.set(handWidth,handWidth*724/2172,1);handMaterial.rotation=-.055*(1-pose.approach);hand.visible=!pose.done;
    if(pose.returned&&!returned){returned=true;onWelcomeReturned?.();}
    if(pose.done){welcomeBuild.spin=true;controls.autoRotate=true;controls.update(dt);}
  }
  function updateGrounding(){
    const build=welcomeActive?welcomeBuild:state,beach=isBeach();
    const carry=welcomeActive&&grabStarted!==null?grabPose(effectTime-grabStarted).carry:0;
    // Counter the orbit for the prop, keeping its grain and legs steady against
    // the fixed beach footage while the product turns in the same camera.
    table.visible=beach;table.rotation.y=controls.getAzimuthalAngle();
    shadow.position.y=beach?-.002:-.024;
    shadow.scale.setScalar(beach?.78:1);
    shadow.visible=!!current.groups.base&&!build.exploded;
    shadow.material.opacity=(beach?.48:1)*(1-carry);
  }

  function selectPart(id) {
    for(const [part,group]of Object.entries(current.groups))group.traverse(o=>{
      if(o.isMesh&&o.userData.glass){
        const picked=part===id,brightness=picked?1.3:(id?0.88:1);o.material.envMapIntensity=o.userData.initialIntensity*brightness;
        o.material.emissive.set(state.background==='light'?'#57753b':'#badd8e');o.material.emissiveIntensity=picked?(state.exploded?0.18:0.08):0;
      }
    });
    const part=PARTS.find(p=>p.id===id);selectionName.textContent=part?part.number+' / '+part.name:'';
    selectionCue.dataset.expanded=String(state.exploded);selectionCue.hidden=!current.groups[id];
    container.setAttribute('aria-label','Your modular glass piece. Drag to rotate, scroll or pinch to zoom. Use arrow keys to rotate. Click empty space or press Escape to clear a selection.'+(part&&current.groups[id]?' Selected part: '+part.name+'.':''));
    if(id)updateSelection();else selectionCue.hidden=true;
  }
  function updateSelection(){
    const bounds=projectPartBounds(current.groups[state.selected],camera,container.clientWidth,container.clientHeight);
    selectionCue.hidden=!bounds;if(!bounds)return;
    selectionCue.style.transform='translate3d('+bounds.left.toFixed(1)+'px,'+bounds.top.toFixed(1)+'px,0)';
    selectionCue.style.width=bounds.width.toFixed(1)+'px';selectionCue.style.height=bounds.height.toFixed(1)+'px';
  }
  function positionCustomizeHint(){
    if(!customizeHint||customizeHint.hidden||!exhale.layout)return;
    const {left,top,width,height}=exhale.layout.hit;
    customizeHint.style.width=width.toFixed(1)+'px';customizeHint.style.height=height.toFixed(1)+'px';
    customizeHint.style.transform='translate3d('+(left+(container.offsetLeft||0)).toFixed(1)+'px,'+(top+(container.offsetTop||0)).toFixed(1)+'px,0)';
    customizeHint.dataset.positioned='true';
  }
  function setBackground(mode) {
    const color=mode==='light'?'#f6f5f0':'#0c100e';
    const beach=isBeach();scene.background=beach?(backgroundVideo?.readyState>=2&&beachTexture?beachTexture:beachPoster):new THREE.Color(color);
    scene.fog=beach?null:new THREE.Fog(color,16,29);floorMat.color.set(color);floor.visible=!beach;
    renderer.toneMappingExposure=beach?1:mode==='light'?1.05:1.15;
  }
  function size() {
    const width=Math.max(1,container.clientWidth),height=Math.max(1,container.clientHeight),aspect=width/height;
    renderer.setSize(width,height,false);
    viewHeight=Math.max(6.5,current.height+(state.exploded?3.0:1.95),3.6/aspect);
    // The mobile summary has its own side rail; center the glass in its canvas.
    const shift=container.parentElement?.classList.contains('viewer-surface')&&window.matchMedia('(max-width: 800px)').matches?0:width<600?.27:0;
    camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.left=-viewHeight*aspect/2-shift;camera.right=viewHeight*aspect/2-shift;
    camera.updateProjectionMatrix();
    fitBeachTexture(beachPoster);fitBeachTexture(beachTexture);
  }
  function frameTarget() {
    const next=(current.height+(state.exploded?1.1:0))/2;
    camera.position.y+=next-controls.target.y;controls.target.y=next;controls.update(0);
  }
  function update(next,rebuild=true) {
    state=next;controls.autoRotate=!welcomeActive&&state.spin&&!state.exploded&&!isReducedMotion();setBackground(state.background);
    if(!isBeach()||state.exploded||isReducedMotion())exhale.hide();
    if(rebuild){
      const rotation=current.root.rotation.clone();scene.remove(current.root);disposeModel(current.root);
      current=createModel(state);current.root.rotation.copy(rotation);scene.add(current.root);animating=false;frameTarget();
    }
    size();updateGrounding();selectPart(state.selected);smoke.update(current,state,effectTime,{reducedMotion:isReducedMotion(),settled:!animating});
  }
  function setExploded(value) {
    state.exploded=value;controls.autoRotate=false;smoke.hide();
    if(isReducedMotion()){
      for(const[id,g]of Object.entries(current.groups))g.position.copy(current.targets[id][value?'exploded':'assembled']);
      animating=false;if(!value)onAssembled?.();
    }else animating=true;
    frameTarget();size();updateGrounding();selectPart(state.selected);
  }
  function getView(){
    return sanitizeView({azimuth:controls.getAzimuthalAngle(),polar:controls.getPolarAngle(),zoom:camera.zoom,rotation:current.root.rotation.toArray().slice(0,3)});
  }
  function restoreView(raw){
    const view=sanitizeView(raw);if(!view)return;
    const damping=controls.enableDamping;controls.enableDamping=false;controls.update(0);
    const radius=Math.hypot(6.7,2.7,9.5),offset=new THREE.Vector3().setFromSpherical(new THREE.Spherical(radius,view.polar,view.azimuth));
    camera.position.copy(controls.target).add(offset);camera.zoom=view.zoom;current.root.rotation.set(...view.rotation);
    controls.update(0);controls.enableDamping=damping;camera.updateProjectionMatrix();updateSelection();
  }
  function resetView() {
    camera.zoom=1;camera.position.set(6.7,controls.target.y+2.7,9.5);current.root.rotation.set(0,0,0);controls.update(0);size();updateSelection();onViewChange?.(getView());
  }
  function nudge(keyName) {
    if(keyName==='ArrowLeft')current.root.rotation.y-=.12;
    if(keyName==='ArrowRight')current.root.rotation.y+=.12;
    if(keyName==='ArrowUp')current.root.rotation.x=THREE.MathUtils.clamp(current.root.rotation.x-.07,-.35,.35);
    if(keyName==='ArrowDown')current.root.rotation.x=THREE.MathUtils.clamp(current.root.rotation.x+.07,-.35,.35);
    if(keyName==='+'||keyName==='=')camera.zoom=Math.min(2.6,camera.zoom+.1);
    if(keyName==='-')camera.zoom=Math.max(.72,camera.zoom-.1);
    camera.updateProjectionMatrix();
    updateSelection();onViewChange?.(getView());
  }
  function capture(sizePx=800) {
    if(welcomeActive)onWelcomeInterrupted?.();
    exhale.hide();
    const originalSize=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio();
    const old={left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom,zoom:camera.zoom};
    smoke.hide();selectPart(null);
    try{
      renderer.setPixelRatio(1);renderer.setSize(sizePx,sizePx,false);
      const frame=Math.max(6.1,current.height+(state.exploded?2.6:1.3));
      camera.left=-frame/2;camera.right=frame/2;camera.top=frame/2;camera.bottom=-frame/2;camera.zoom=1;camera.updateProjectionMatrix();
      renderer.render(scene,camera);
      return renderer.domElement.toDataURL('image/png');
    }finally{
      Object.assign(camera,old);camera.updateProjectionMatrix();renderer.setPixelRatio(ratio);renderer.setSize(originalSize.x,originalSize.y,false);
      selectPart(state.selected);smoke.update(current,state,effectTime,{reducedMotion:isReducedMotion(),settled:!animating});renderer.render(scene,camera);
    }
  }
  controls.addEventListener('start',()=>onInteraction?.());
  controls.addEventListener('end',()=>onViewChange?.(getView()));
  renderer.domElement.addEventListener('pointerdown',e=>{
    selectionGesture.begin(e);onInteraction?.();
  });
  renderer.domElement.addEventListener('pointermove',e=>selectionGesture.move(e));
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!selectionGesture.end(e))return;
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObject(current.root,true).find(h=>h.object.userData.part);
    onSelect?.(hit?.object.userData.part??null);
  });
  renderer.domElement.addEventListener('pointercancel',e=>selectionGesture.cancel(e));
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;exhale.hide();container.dispatchEvent(new CustomEvent('viewer-lost'));});
  const observer=new ResizeObserver(size);observer.observe(container);
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;lastTime=0;if(!visible){exhale.hide();onViewChange?.(getView());}});
  function animate(time) {
    if(!active)return;
    requestAnimationFrame(animate);if(!visible)return;
    const dt=Math.min(.05,lastTime?(time-lastTime)/1000:1/60);lastTime=time;
    effectTime+=dt;
    if(animating){
      let remaining=0;
      for(const[id,g]of Object.entries(current.groups)){const target=current.targets[id][state.exploded?'exploded':'assembled'];g.position.lerp(target,1-Math.exp(-dt*8));remaining+=g.position.distanceTo(target);}
      if(remaining<.001){for(const[id,g]of Object.entries(current.groups))g.position.copy(current.targets[id][state.exploded?'exploded':'assembled']);animating=false;if(!state.exploded)onAssembled?.();}
    }
    if(welcomeActive)animateWelcome(dt);else{controls.update(dt);updateSelection();}
    updateGrounding();smoke.update(current,welcomeActive?welcomeBuild:state,effectTime,{reducedMotion:isReducedMotion(),settled:!animating});
    exhale.update(effectTime,{camera,model:current,width:container.clientWidth,height:container.clientHeight,allowed:isBeach()&&!isReducedMotion()&&!state.exploded&&(welcomeActive||state.spin)});
    positionCustomizeHint();renderer.render(scene,camera);
    if(!welcomeActive&&time-lastViewSave>1000){onViewChange?.(getView());lastViewSave=time;}
  }
  update(state,false);frameTarget();size();restoreView(state.view);updateGrounding();updateSelection();smoke.update(current,state,effectTime,{reducedMotion:isReducedMotion()});renderer.render(scene,camera);requestAnimationFrame(animate);
  return {update,setExploded,resetView,nudge,capture,selectPart,getView,restoreView,startWelcome,grabWelcome,stopWelcome,prepareExhale:()=>{exhale.prepare();prepareWelcome();},showExhale:options=>exhale.show(effectTime,options),hideExhale:()=>exhale.hide(),get welcomeReady(){return handReady;}};
}
