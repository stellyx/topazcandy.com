#!/usr/bin/env python3
"""Render the actual ribbon shaders through EGL. No browser or paid service.

python3 scripts/render-living-glass.py --poster assets/topaz/glass/amber-ribbon-poster.webp
python3 scripts/render-living-glass.py --frames /absolute/scratch/frames --width 640 --height 480 --fps 12
"""
import argparse,base64,ctypes as C,json,math,subprocess,time
from pathlib import Path
from PIL import Image

EGL=C.CDLL('libEGL.so.1');GL=C.CDLL('libGL.so.1')
Int=C.c_int;UInt=C.c_uint;Float=C.c_float;Void=C.c_void_p
def function(lib,name,result,args):
    fn=getattr(lib,name);fn.restype=result;fn.argtypes=args;return fn

def context(width,height):
    getproc=function(EGL,'eglGetProcAddress',Void,[C.c_char_p])
    getdisplay=C.CFUNCTYPE(Void,UInt,Void,C.POINTER(Int))(getproc(b'eglGetPlatformDisplayEXT'))
    display=getdisplay(0x31DD,None,None)
    initialize=function(EGL,'eglInitialize',UInt,[Void,C.POINTER(Int),C.POINTER(Int)])
    major,minor=Int(),Int();assert initialize(display,C.byref(major),C.byref(minor)),'EGL initialization'
    assert function(EGL,'eglBindAPI',UInt,[UInt])(0x30A2),'OpenGL binding'
    choose=function(EGL,'eglChooseConfig',UInt,[Void,C.POINTER(Int),C.POINTER(Void),Int,C.POINTER(Int)])
    attributes=(Int*17)(0x3033,1,0x3040,8,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3025,24,0x3026,0,0x3038)
    config=Void();count=Int();assert choose(display,attributes,C.byref(config),1,C.byref(count)) and count.value,'EGL configuration'
    surface=function(EGL,'eglCreatePbufferSurface',Void,[Void,Void,C.POINTER(Int)])(display,config,(Int*5)(0x3057,width,0x3056,height,0x3038))
    ctx=function(EGL,'eglCreateContext',Void,[Void,Void,Void,C.POINTER(Int)])(display,config,None,(Int*1)(0x3038))
    assert ctx and surface,'EGL surface/context'
    assert function(EGL,'eglMakeCurrent',UInt,[Void,Void,Void,Void])(display,surface,surface,ctx),'EGL current context'
    return display,surface,ctx

class RibbonRenderer:
    def __init__(self,width,height,data):
        self.context=context(width,height);self.width=width;self.height=height;self.data=data
        self.shader_source=function(GL,'glShaderSource',None,[UInt,Int,C.POINTER(C.c_char_p),C.POINTER(Int)])
        self.compile=function(GL,'glCompileShader',None,[UInt])
        self.shader_status=function(GL,'glGetShaderiv',None,[UInt,UInt,C.POINTER(Int)])
        self.shader_log=function(GL,'glGetShaderInfoLog',None,[UInt,Int,C.POINTER(Int),C.c_char_p])
        def shader(kind,source):
            handle=function(GL,'glCreateShader',UInt,[UInt])(kind)
            source='#version 120\n'+'\n'.join(s for s in source.splitlines() if not s.strip().startswith('precision '))
            encoded=source.encode();text=C.c_char_p(encoded)
            self.shader_source(handle,1,C.byref(text),None);self.compile(handle)
            status=Int();self.shader_status(handle,0x8B81,C.byref(status))
            if not status.value:
                log=C.create_string_buffer(8192);self.shader_log(handle,8192,None,log)
                raise RuntimeError(log.value.decode())
            return handle
        vertex=shader(0x8B31,data['vertex']);fragment=shader(0x8B30,data['fragment'])
        self.program=function(GL,'glCreateProgram',UInt,[])()
        attach=function(GL,'glAttachShader',None,[UInt,UInt]);attach(self.program,vertex);attach(self.program,fragment)
        function(GL,'glLinkProgram',None,[UInt])(self.program)
        status=Int();function(GL,'glGetProgramiv',None,[UInt,UInt,C.POINTER(Int)])(self.program,0x8B82,C.byref(status));assert status.value,'Shader link'
        function(GL,'glUseProgram',None,[UInt])(self.program)
        buffers=(UInt*2)();function(GL,'glGenBuffers',None,[Int,C.POINTER(UInt)])(2,buffers)
        bind=function(GL,'glBindBuffer',None,[UInt,UInt]);upload=function(GL,'glBufferData',None,[UInt,C.c_ssize_t,Void,UInt])
        for target,index,key in [(0x8892,0,'parameters'),(0x8893,1,'indices')]:
            raw=base64.b64decode(data[key]);content=C.create_string_buffer(raw)
            bind(target,buffers[index]);upload(target,len(raw),C.cast(content,Void),0x88E4)
        attr=function(GL,'glGetAttribLocation',Int,[UInt,C.c_char_p])(self.program,b'aParam')
        function(GL,'glEnableVertexAttribArray',None,[UInt])(attr)
        function(GL,'glVertexAttribPointer',None,[UInt,Int,UInt,UInt,Int,Void])(attr,2,0x1406,0,0,None)
        uniform=function(GL,'glGetUniformLocation',Int,[UInt,C.c_char_p])
        self.phase=uniform(self.program,b'uPhase');self.reflection=uniform(self.program,b'uReflection');self.uniform=function(GL,'glUniform1f',None,[Int,Float])
        self.uniform(uniform(self.program,b'uAspect'),width/height)
        function(GL,'glViewport',None,[Int,Int,Int,Int])(0,0,width,height)
        function(GL,'glEnable',None,[UInt])(0x0B71);function(GL,'glDepthFunc',None,[UInt])(0x0203)
        self.enable=function(GL,'glEnable',None,[UInt]);self.disable=function(GL,'glDisable',None,[UInt])
        self.cull=function(GL,'glCullFace',None,[UInt]);self.mask=function(GL,'glDepthMask',None,[UInt])
        self.enable(0x0BE2);self.blend=function(GL,'glBlendFunc',None,[UInt,UInt])
        function(GL,'glClearColor',None,[Float,Float,Float,Float])(242/255,238/255,229/255,1)
        self.clear=function(GL,'glClear',None,[UInt]);self.draw=function(GL,'glDrawElements',None,[UInt,Int,UInt,Void])
        self.read=function(GL,'glReadPixels',None,[Int,Int,Int,Int,UInt,UInt,Void])
        self.error=function(GL,'glGetError',UInt,[])
        function(GL,'glGetString',C.c_char_p,[UInt])
        self.backend=GL.glGetString(0x1F01).decode()
    def frame(self,seconds):
        phase=(seconds%self.data['config']['period'])/self.data['config']['period']*math.tau
        self.uniform(self.phase,phase);self.clear(0x4000|0x0100)
        self.mask(0);self.enable(0x0B44)
        for reflect in [0,1]:
            self.uniform(self.reflection,reflect);self.blend(1 if reflect else 0x0306,1 if reflect else 0)
            self.cull(0x0404);self.draw(0x0004,self.data['count'],0x1403,None)
            self.cull(0x0405);self.draw(0x0004,self.data['count'],0x1403,None)
        self.mask(1);self.disable(0x0B44)
        raw=C.create_string_buffer(self.width*self.height*4)
        self.read(0,0,self.width,self.height,0x1908,0x1401,C.cast(raw,Void))
        assert self.error()==0,'OpenGL render error'
        return Image.frombytes('RGBA',(self.width,self.height),raw.raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--poster',type=Path);parser.add_argument('--frames',type=Path)
    parser.add_argument('--width',type=int,default=960);parser.add_argument('--height',type=int,default=720);parser.add_argument('--fps',type=int,default=12)
    args=parser.parse_args();root=Path(__file__).resolve().parent.parent
    data=json.loads(subprocess.check_output(['node',str(root/'scripts/export-glass.mjs')],text=True))
    renderer=RibbonRenderer(args.width,args.height,data);started=time.monotonic()
    if args.poster:
        args.poster.parent.mkdir(parents=True,exist_ok=True)
        image=renderer.frame(data['config']['stillTime']).convert('RGB');image.save(args.poster,quality=90,method=6)
        assert image.getbbox(),'Nonempty glass poster'
        print(json.dumps({'poster':str(args.poster),'size':image.size,'renderer':renderer.backend,'seconds':round(time.monotonic()-started,3)}),flush=True)
    if args.frames:
        args.frames.mkdir(parents=True,exist_ok=True)
        count=int(data['config']['period']*args.fps)
        for index in range(count):
            image=renderer.frame(index/args.fps)
            background=Image.new('RGBA',image.size,'#f2eee5');background.alpha_composite(image)
            background.convert('RGB').save(args.frames/f'{index:04d}.png')
            if index%120==0:print(json.dumps({'frame':index,'of':count}),flush=True)
        print(json.dumps({'frames':count,'renderer':renderer.backend,'seconds':round(time.monotonic()-started,3)}),flush=True)
if __name__=='__main__':main()
