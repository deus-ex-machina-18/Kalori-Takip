import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CatScene } from '../domain/contracts.ts';
import type { CatPreferences, DaySummary } from '../domain/models.ts';
import type { CAT_PRESENTATION } from '../domain/cat.ts';

type ClipName = 'idle' | 'happy' | 'stretch' | 'play' | 'sleep' | 'care';
const BASE_ANGLE = -.22;
const modelUrl = `${import.meta.env.BASE_URL}models/grey-white-kitten.glb`;
const furUrl = `${import.meta.env.BASE_URL}models/white-fur-v1.jpg`;

/** Owned by one mounted card. Every request, listener and GPU resource is disposed. */
export class ThreeCatScene implements CatScene {
  private renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.PerspectiveCamera(34,1,.1,20);
  private cat: T.Object3D | null = null;
  private mixer: T.AnimationMixer | null = null;
  private clips = new Map<ClipName,T.AnimationAction>();
  private action: T.AnimationAction | null = null;
  private summary: DaySummary;
  private reduced: boolean;
  private sleeping = false;
  private disposed = false;
  private visible = true;
  private loaded = false;
  private pointer: { id:number; x:number; y:number; angle:number; dragged:boolean } | null = null;
  private abort = new AbortController();
  private listeners = new AbortController();
  private resize: ResizeObserver;
  private observer: IntersectionObserver;
  private lastTime = 0;
  private sampleStart = 0;
  private sampleFrames = 0;
  private startTime = performance.now();
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private host: HTMLElement;
  private fallback: (reason:string)=>void;
  private presentation: typeof CAT_PRESENTATION;
  private textures = new Set<T.Texture>();
  private environment: T.WebGLRenderTarget;
  private furBitmap: ImageBitmap | null = null;
  private balanced = false;
  constructor(host: HTMLElement, summary: DaySummary, preferences: CatPreferences, presentation: typeof CAT_PRESENTATION, fallback: (reason:string)=>void) {
    this.host=host;this.summary=summary;this.reduced=preferences.reducedMotion;this.fallback=fallback;
    this.presentation=presentation;
    this.renderer = new T.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.setClearColor('#e9dfd2');
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=.94;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);
    this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.17;
    room.dispose();pmrem.dispose();
    const canvas=this.renderer.domElement;
    canvas.className='cat-canvas';canvas.setAttribute('aria-hidden','true');
    host.querySelector('.cat-viewport')!.append(canvas);
    this.camera.position.set(.08,1.22,3.15);this.camera.lookAt(0,.71,0);
    this.scene.add(new T.HemisphereLight('#fff4e3','#b7ae9e',1.2));
    const light=new T.DirectionalLight('#ffe9cc',2);light.position.set(-2.5,3.8,3.5);light.target.position.set(0,.6,0);
    light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-1.2;light.shadow.camera.right=1.2;light.shadow.camera.top=1.65;light.shadow.camera.bottom=-.6;light.shadow.camera.near=.5;light.shadow.camera.far=10;light.shadow.normalBias=.006;light.shadow.bias=-.0001;light.shadow.radius=4;
    this.scene.add(light,light.target);
    const fill=new T.DirectionalLight('#eef1fa',.7);fill.position.set(2,1.5,3);this.scene.add(fill);
    const rim=new T.DirectionalLight('#fff1dd',1.1);rim.position.set(1,2,-2);this.scene.add(rim);
    this.room();
    const signal=this.listeners.signal;
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.fail('3D görünüm durdu. Statik kedinle kayıtlarına devam edebilirsin.');},{signal});
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0 || !event.isPrimary)return;
      this.pointer={id:event.pointerId,x:event.clientX,y:event.clientY,angle:this.cat?.rotation.y ?? BASE_ANGLE,dragged:false};
    },{signal});
    canvas.addEventListener('pointermove',event=>{
      const p=this.pointer;if(!p || p.id!==event.pointerId || !this.cat)return;
      const dx=event.clientX-p.x,dy=event.clientY-p.y;
      if(!p.dragged && Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>10){this.pointer=null;return;}
      if(!p.dragged && Math.abs(dx)>10 && Math.abs(dx)>Math.abs(dy)) {p.dragged=true;canvas.setPointerCapture(p.id);}
      if(p.dragged){this.cat.rotation.y=p.angle+dx*.009;this.host.dataset.angle=this.cat.rotation.y.toFixed(3);this.draw();}
    },{signal});
    canvas.addEventListener('pointerup',event=>{
      const p=this.pointer;if(!p || p.id!==event.pointerId)return;
      if(!p.dragged && Math.hypot(event.clientX-p.x,event.clientY-p.y)<10)this.play('play');
      if(canvas.hasPointerCapture(p.id))canvas.releasePointerCapture(p.id);this.pointer=null;
    },{signal});
    canvas.addEventListener('pointercancel',()=>{this.pointer=null;},{signal});
    document.addEventListener('visibilitychange',()=>this.syncLoop(),{signal});
    this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(host.querySelector('.cat-viewport')!);
    this.observer=new IntersectionObserver(entries=>{this.visible=entries[0]?.isIntersecting ?? false;this.syncLoop();});this.observer.observe(host);
    host.querySelectorAll<HTMLButtonElement>('[data-cat-action]').forEach(button=>button.addEventListener('click',()=>{
      switch(button.dataset.catAction){
        case 'reset':this.resetView();break;
        case 'left':this.turn(-.35);break;
        case 'right':this.turn(.35);break;
        case 'play':this.play('play');break;
        case 'stretch':this.play('stretch');break;
        case 'sleep':this.sleeping=!this.sleeping;this.selectBase();button.textContent=this.sleeping?'Uyandır':'Uyusun';button.setAttribute('aria-pressed',String(this.sleeping));break;
      }
    },{signal}));
    this.fit();
  }
  private room(): void {
    const material=(color:string,extra:Partial<T.MeshStandardMaterialParameters>={})=>new T.MeshStandardMaterial({color,roughness:1,...extra});
    const grain=this.surfaceTexture('grain'),wood=this.surfaceTexture('wood');
    const floor=new T.Mesh(new T.BoxGeometry(5,.04,5),material('#d8c3a9',{bumpMap:wood,bumpScale:.002,roughness:.92}));floor.position.set(0,-.03,0);floor.receiveShadow=true;this.scene.add(floor);
    const wall=new T.Mesh(new T.BoxGeometry(5,3,.04),material('#ffffff',{map:this.surfaceTexture('wall')}));wall.position.set(0,1.45,-.8);this.scene.add(wall);
    const side=new T.Mesh(new T.BoxGeometry(.04,3,4),material('#ede2d4'));side.position.set(-1.35,1.45,1.35);this.scene.add(side);
    const trim=new T.Mesh(new T.BoxGeometry(5,.075,.055),material('#eee4d7'));trim.position.set(0,.018,-.755);this.scene.add(trim);
    const mat=new T.Mesh(new T.CylinderGeometry(.76,.76,.032,64),material('#9fab91',{bumpMap:grain,bumpScale:.006}));mat.position.set(0,-.002,.08);mat.scale.z=.81;mat.receiveShadow=true;this.scene.add(mat);
    const shadow=new T.Mesh(new T.PlaneGeometry(1.16,.79),new T.MeshBasicMaterial({map:this.surfaceTexture('shadow'),transparent:true,opacity:.33,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.016,.01);this.scene.add(shadow);
    const cushion=new T.Mesh(new T.SphereGeometry(1,32,18),material('#d49d86',{bumpMap:grain,bumpScale:.004}));cushion.position.set(.93,.125,-.42);cushion.scale.set(.37,.135,.285);cushion.castShadow=true;cushion.receiveShadow=true;this.scene.add(cushion);
    const seam=new T.Mesh(new T.TorusGeometry(1,.008,5,64),material('#bb8975'));seam.rotation.x=Math.PI/2;seam.position.copy(cushion.position);seam.scale.set(.371,.286,1);this.scene.add(seam);
  }
  private surfaceTexture(kind:'grain'|'wood'|'wall'|'shadow'):T.Texture {
    const size=kind==='wall'||kind==='shadow'?128:256,data=new Uint8Array(size*size*4);let seed=319;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const warm=new T.Color('#f7e8cc'),shade=new T.Color('#ded0be');
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=(y*size+x)*4;data[i+3]=255;
      if(kind==='shadow'){const r=Math.hypot((x/size-.5)*2,(y/size-.5)*2);data.set([40,38,28,Math.round(255*Math.max(0,1-r)**2)],i);}
      else if(kind==='wall'){const c=warm.clone().lerp(shade,T.MathUtils.clamp(x/size*.8+(1-y/size)*.32,0,1));const srgb=c.convertLinearToSRGB();data.set([Math.round(srgb.r*255),Math.round(srgb.g*255),Math.round(srgb.b*255),255],i);}
      else {const v=kind==='wood'?127+24*Math.sin(x*.85+Math.sin(y*.035)*2)+12*Math.sin(x*2.4+y*.01):85+random()*100;data.set([v,v,v,255],i);}
    }
    const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.needsUpdate=true;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;
    if(kind==='grain'||kind==='wood'){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(kind==='wood'?4:10,kind==='wood'?4:10);}
    if(kind==='wall')texture.colorSpace=T.SRGBColorSpace;this.textures.add(texture);return texture;
  }
  private fibreHeight():T.Texture {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const c=canvas.getContext('2d')!;c.fillStyle='#888';c.fillRect(0,0,1024,1024);let seed=7161;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let i=0;i<10000;i++){const x=random()*1024,y=random()*1024,length=6+random()*15,g=Math.floor(110+random()*75);c.strokeStyle=`rgb(${g},${g},${g})`;c.lineWidth=.55+random()*.65;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+random()*3-1.5,y+length*.5,x+random()*3-1.5,y+length);c.stroke();}
    const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(4,4);texture.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());this.textures.add(texture);return texture;
  }
  private fibreMaterial():T.ShaderMaterial {
    // Short opaque strands use a single diffuse pass; no per-strand shadow passes.
    return new T.ShaderMaterial({vertexColors:true,side:T.DoubleSide,vertexShader:`
      #include <skinning_pars_vertex>
      varying vec3 fibreColour;
      varying vec3 fibreNormal;
      void main(){
        mat4 skin=skinWeight.x*getBoneMatrix(skinIndex.x);
        if(skinWeight.y>0.0)skin+=skinWeight.y*getBoneMatrix(skinIndex.y);
        if(skinWeight.z>0.0)skin+=skinWeight.z*getBoneMatrix(skinIndex.z);
        if(skinWeight.w>0.0)skin+=skinWeight.w*getBoneMatrix(skinIndex.w);
        mat4 deform=bindMatrixInverse*skin*bindMatrix;
        fibreNormal=normalize(normalMatrix*vec3(deform*vec4(normal,0.0)));
        fibreColour=color;
        gl_Position=projectionMatrix*modelViewMatrix*deform*vec4(position,1.0);
      }`,fragmentShader:`
      varying vec3 fibreColour;
      varying vec3 fibreNormal;
      void main(){
        float key=max(0.0,dot(normalize(fibreNormal),normalize(vec3(-0.6,0.8,1.0))));
        gl_FragColor=vec4(fibreColour*(0.86+0.3*key),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  }
  async load(): Promise<void> {
    try {
      this.timeout=setTimeout(()=>this.abort.abort(),12000);
      const [bytes,furBlob]=await Promise.all([
        fetch(modelUrl,{signal:this.abort.signal}).then(r=>{if(!r.ok)throw new Error('model');return r.arrayBuffer();}),
        fetch(furUrl,{signal:this.abort.signal}).then(r=>{if(!r.ok)throw new Error('fur');return r.blob();}),
      ]);
      if(this.disposed)return;
      const gltf=await new GLTFLoader().parseAsync(bytes,'');
      if(this.disposed){this.release(gltf.scene);return;}
      this.cat=gltf.scene;this.cat.rotation.y=BASE_ANGLE;this.scene.add(this.cat);
      const bitmap=await createImageBitmap(furBlob,{colorSpaceConversion:'none'});
      if(this.disposed){bitmap.close();return;}this.furBitmap=bitmap;
      const albedo=new T.Texture(bitmap);albedo.flipY=false;albedo.colorSpace=T.SRGBColorSpace;albedo.wrapS=albedo.wrapT=T.RepeatWrapping;albedo.repeat.set(4,4);albedo.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());albedo.needsUpdate=true;this.textures.add(albedo);
      const height=this.fibreHeight();
      this.cat.traverse(object=>{
        if(!(object instanceof T.Mesh))return;
        if(object.name==='KittenFur'){for(const m of Array.isArray(object.material)?object.material:[object.material])m.dispose();object.material=this.fibreMaterial();object.castShadow=false;object.receiveShadow=false;}
        else {object.castShadow=true;object.receiveShadow=true;for(const m of Array.isArray(object.material)?object.material:[object.material])if(m instanceof T.MeshStandardMaterial&&['FurGrey','FurWhite'].includes(m.name)){m.map=albedo;m.bumpMap=height;m.bumpScale=.006;m.needsUpdate=true;}}
      });
      this.mixer=new T.AnimationMixer(this.cat);
      for(const clip of gltf.animations)this.clips.set(clip.name as ClipName,this.mixer.clipAction(clip));
      for(const name of ['idle','happy','stretch','play','sleep','care'] as ClipName[])if(!this.clips.has(name))throw new Error('clips');
      this.mixer.addEventListener('finished',()=>this.selectBase(false));
      this.loaded=true;this.host.dataset.sceneStatus='ready';this.host.dataset.quality='full';this.host.dataset.angle=String(BASE_ANGLE);
      this.selectBase();this.draw();
      this.host.dataset.loadMs=(performance.now()-this.startTime).toFixed(0);
      this.status(this.reduced?'Hareket azaltıldı. Düğmelerle kedini döndürebilirsin.':'Kedine dokun veya yatay sürükleyerek döndür.');
      this.host.querySelectorAll<HTMLButtonElement>('[data-cat-action]').forEach(b=>b.disabled=false);
      this.syncLoop();
    } catch { if(!this.disposed)this.fail('3D görünüm açılamadı. Statik kedinle kayıtlarına devam edebilirsin.'); }
    finally{if(this.timeout)clearTimeout(this.timeout);this.timeout=null;}
  }
  private status(message:string):void { const el=this.host.querySelector('.cat-scene-status');if(el)el.textContent=message; }
  private fit():void {
    const viewport=this.host.querySelector('.cat-viewport');if(!viewport || this.disposed)return;
    const {width,height}=viewport.getBoundingClientRect();if(width<=0 || height<=0)return;
    this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.draw();
  }
  private turn(value:number):void {if(this.cat){this.cat.rotation.y+=value;this.host.dataset.angle=String(this.cat.rotation.y);this.draw();}}
  resetView():void {if(this.cat){this.cat.rotation.y=BASE_ANGLE;this.host.dataset.angle=String(BASE_ANGLE);this.draw();}}
  setState(summary:DaySummary):void {this.summary=summary;this.sleeping=false;this.selectBase();}
  setReducedMotion(value:boolean):void {this.reduced=value;this.selectBase();this.syncLoop();}
  private selectBase(celebrate=true):void {
    const requested=this.presentation[this.summary.catState].clip;
    const clip=this.reduced && requested==='happy'?'idle':requested;
    this.play(this.summary.catState==='care'?'care':this.sleeping?'sleep':clip==='happy' && !celebrate?'idle':clip);
  }
  private play(name:ClipName):void {
    if(!this.loaded)return;
    if(this.summary.catState==='care' && name!=='care')name='care';
    if(this.reduced && !['idle','care','sleep'].includes(name)) {this.status('Hareket azaltma açık; animasyon oynatılmıyor.');return;}
    const next=this.clips.get(name)!;
    if(next!==this.action){
      const previous=this.action;next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
      next.setLoop(['idle','sleep','care'].includes(name)?T.LoopRepeat:T.LoopOnce,Infinity);next.clampWhenFinished=true;next.play();
      if(previous){if(this.reduced)previous.stop();else previous.crossFadeTo(next,.25,false);}this.action=next;
    } else if(!['idle','sleep','care'].includes(name))next.reset().play();
    this.host.dataset.clip=name;
    if(this.reduced){this.mixer!.update(0);this.draw();}
    this.syncLoop();
  }
  private syncLoop():void {
    const running=this.loaded && !this.disposed && this.visible && !document.hidden && !this.reduced;
    this.host.dataset.animating=String(running);this.lastTime=0;this.sampleStart=0;this.sampleFrames=0;
    this.renderer.setAnimationLoop(running?(time:number)=>this.frame(time):null);
    if(!running)this.draw();
  }
  private frame(time:number):void {
    if(this.disposed)return;
    if(this.lastTime && time-this.lastTime<1000/32)return;
    const delta=this.lastTime?Math.min((time-this.lastTime)/1000,.1):0;
    this.lastTime=time;this.mixer?.update(delta);this.draw();
    if(!this.sampleStart)this.sampleStart=time;this.sampleFrames++;
    if(time-this.sampleStart>=4000){
      const fps=this.sampleFrames*1000/(time-this.sampleStart);this.host.dataset.fps=fps.toFixed(1);
      if(fps<26&&!this.balanced){this.balanceQuality();this.sampleStart=time;this.sampleFrames=0;return;}
      if(fps<20){this.fail('Bu cihaz için statik görünüm açıldı. Kayıtlarına devam edebilirsin.');return;}
      this.sampleStart=time;this.sampleFrames=0;
    }
  }
  private balanceQuality():void {
    this.balanced=true;this.host.dataset.quality='balanced';this.renderer.setPixelRatio(Math.min(devicePixelRatio,1));this.renderer.shadowMap.enabled=false;
    this.cat?.traverse(object=>{if(object instanceof T.Mesh&&object.name==='KittenFur'){const count=object.geometry.index?.count??0;object.geometry.setDrawRange(0,Math.floor(count/6)*3);}});
    this.scene.traverse(object=>{if(object instanceof T.DirectionalLight){object.shadow.map?.dispose();object.shadow.map=null;object.shadow.mapSize.set(512,512);}});this.fit();
  }
  private draw():void {
    if(this.disposed)return;
    this.renderer.render(this.scene,this.camera);
    if(this.loaded){this.host.dataset.triangles=String(this.renderer.info.render.triangles);this.host.dataset.drawCalls=String(this.renderer.info.render.calls);}
  }
  private fail(reason:string):void {this.dispose();this.fallback(reason);}
  private release(root:T.Object3D):void {
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),skeletons=new Set<T.Skeleton>();
    root.traverse(object=>{if(object instanceof T.Mesh){geometries.add(object.geometry);for(const m of Array.isArray(object.material)?object.material:[object.material])materials.add(m);if(object instanceof T.SkinnedMesh)skeletons.add(object.skeleton);}if(object instanceof T.DirectionalLight)object.shadow.dispose();});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());skeletons.forEach(s=>s.dispose());
  }
  dispose():void {
    if(this.disposed)return;this.disposed=true;this.abort.abort();this.listeners.abort();if(this.timeout)clearTimeout(this.timeout);
    this.resize.disconnect();this.observer.disconnect();this.renderer.setAnimationLoop(null);
    this.mixer?.stopAllAction();if(this.cat)this.mixer?.uncacheRoot(this.cat);
    this.release(this.scene);this.textures.forEach(t=>t.dispose());this.textures.clear();this.environment.dispose();this.furBitmap?.close();this.furBitmap=null;this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();
  }
}
