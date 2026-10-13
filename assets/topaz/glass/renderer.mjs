import {GLASS,createMesh,phaseAt,VERTEX,FRAGMENT} from './geometry.mjs';

export function createRenderer(canvas, narrow=false) {
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
  if(!gl)throw new Error('WebGL unavailable');
  const quality=narrow?GLASS.mobile:GLASS.desktop;
  function compile(type,source){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error('Glass shader compilation failed');}
    return shader;
  }
  const vertex=compile(gl.VERTEX_SHADER,VERTEX),fragment=compile(gl.FRAGMENT_SHADER,FRAGMENT);
  const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);throw new Error('Glass shader linking failed');}
  gl.useProgram(program);
  const mesh=createMesh(quality.segments,quality.sides);
  const vertices=gl.createBuffer(),indices=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,mesh.parameters,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
  const attribute=gl.getAttribLocation(program,'aParam');
  gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
  const phase=gl.getUniformLocation(program,'uPhase'),aspect=gl.getUniformLocation(program,'uAspect');
  const reflection=gl.getUniformLocation(program,'uReflection');
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.clearColor(242/255,238/255,229/255,1);
  let disposed=false;
  function resize(){
    const box=canvas.getBoundingClientRect();
    let dpr=Math.min(globalThis.devicePixelRatio||1,quality.dpr);
    dpr=Math.min(dpr,Math.sqrt(quality.maxPixels/Math.max(1,box.width*box.height)));
    const width=Math.max(1,Math.round(box.width*dpr)),height=Math.max(1,Math.round(box.height*dpr));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.uniform1f(aspect,width/height);
  }
  function render(seconds){
    if(disposed||gl.isContextLost())throw new Error('Glass context lost');
    gl.useProgram(program);gl.uniform1f(phase,phaseAt(seconds));gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.depthMask(false);gl.enable(gl.CULL_FACE);
    // Filter light through both walls, then add the studio reflections.
    // Multiplication gives amber absorption without a flat orange coating.
    for(const pass of [0,1]){
      gl.uniform1f(reflection,pass);gl.blendFunc(pass?gl.ONE:gl.DST_COLOR,pass?gl.ONE:gl.ZERO);
      gl.cullFace(gl.FRONT);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);
      gl.cullFace(gl.BACK);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);
    }
    gl.depthMask(true);gl.disable(gl.CULL_FACE);
    if(gl.getError()!==gl.NO_ERROR)throw new Error('Glass draw failed');
  }
  function dispose(){
    if(disposed)return;disposed=true;
    gl.deleteBuffer(vertices);gl.deleteBuffer(indices);gl.deleteProgram(program);
  }
  resize();
  return {render,resize,dispose,quality};
}
