import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { CatScene } from '../domain/contracts.ts';
import type { CatPreferences, DaySummary } from '../domain/models.ts';
import type { CAT_PRESENTATION } from '../domain/cat.ts';

type ClipName = 'idle' | 'happy' | 'stretch' | 'play' | 'sleep' | 'care';
const BASE_ANGLE = -.22;
const modelUrl = `${import.meta.env.BASE_URL}models/grey-white-kitten.glb`;

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
  constructor(host: HTMLElement, summary: DaySummary, preferences: CatPreferences, presentation: typeof CAT_PRESENTATION, fallback: (reason:string)=>void) {
    this.host=host;this.summary=summary;this.reduced=preferences.reducedMotion;this.fallback=fallback;
    this.presentation=presentation;
    this.renderer = new T.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.setClearColor('#f3ece2');
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.25;
    const canvas=this.renderer.domElement;
    canvas.className='cat-canvas';canvas.setAttribute('aria-hidden','true');
    host.querySelector('.cat-viewport')!.append(canvas);
    this.camera.position.set(.08,1.01,2.95);this.camera.lookAt(0,.76,0);
    this.scene.add(new T.HemisphereLight('#fff7e8','#b1b8ac',2.5));
    const light=new T.DirectionalLight('#fff4e5',3);light.position.set(-2,3,4);this.scene.add(light);
    const fill=new T.DirectionalLight('#e5eaf1',1);fill.position.set(2,1,-1);this.scene.add(fill);
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
    const material=(color:string)=>new T.MeshStandardMaterial({color,roughness:1});
    const floor=new T.Mesh(new T.BoxGeometry(5,.04,5),material('#e3d4c1'));floor.position.set(0,-.03,0);this.scene.add(floor);
    const wall=new T.Mesh(new T.BoxGeometry(5,3,.04),material('#f4eadc'));wall.position.set(0,1.45,-.62);this.scene.add(wall);
    const side=new T.Mesh(new T.BoxGeometry(.04,3,4),material('#ede2d4'));side.position.set(-1.35,1.45,1.35);this.scene.add(side);
    const mat=new T.Mesh(new T.CylinderGeometry(.72,.72,.025,48),material('#a4b29b'));mat.position.set(0,-.003,.08);mat.scale.z=.8;this.scene.add(mat);
    const shadow=new T.Mesh(new T.CircleGeometry(.37,40),new T.MeshBasicMaterial({color:'#667263',transparent:true,opacity:.16,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.012,.06);shadow.scale.y=.7;this.scene.add(shadow);
    const cushion=new T.Mesh(new T.SphereGeometry(1,20,12),material('#d8b0a1'));cushion.position.set(.91,.13,-.3);cushion.scale.set(.31,.13,.25);this.scene.add(cushion);
  }
  async load(): Promise<void> {
    try {
      this.timeout=setTimeout(()=>this.abort.abort(),12000);
      const response=await fetch(modelUrl,{signal:this.abort.signal});
      if(!response.ok)throw new Error('model');
      const bytes=await response.arrayBuffer();
      if(this.disposed)return;
      const gltf=await new GLTFLoader().parseAsync(bytes,'');
      if(this.disposed){this.release(gltf.scene);return;}
      this.cat=gltf.scene;this.cat.rotation.y=BASE_ANGLE;this.scene.add(this.cat);
      this.mixer=new T.AnimationMixer(this.cat);
      for(const clip of gltf.animations)this.clips.set(clip.name as ClipName,this.mixer.clipAction(clip));
      for(const name of ['idle','happy','stretch','play','sleep','care'] as ClipName[])if(!this.clips.has(name))throw new Error('clips');
      this.mixer.addEventListener('finished',()=>this.selectBase(false));
      this.loaded=true;this.host.dataset.sceneStatus='ready';this.host.dataset.angle=String(BASE_ANGLE);
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
      if(fps<20){this.fail('Bu cihaz için statik görünüm açıldı. Kayıtlarına devam edebilirsin.');return;}
      this.sampleStart=time;this.sampleFrames=0;
    }
  }
  private draw():void {if(!this.disposed)this.renderer.render(this.scene,this.camera);}
  private fail(reason:string):void {this.dispose();this.fallback(reason);}
  private release(root:T.Object3D):void {
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
    root.traverse(object=>{if(object instanceof T.Mesh){geometries.add(object.geometry);for(const m of Array.isArray(object.material)?object.material:[object.material])materials.add(m);if(object instanceof T.SkinnedMesh)object.skeleton.dispose();}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }
  dispose():void {
    if(this.disposed)return;this.disposed=true;this.abort.abort();this.listeners.abort();if(this.timeout)clearTimeout(this.timeout);
    this.resize.disconnect();this.observer.disconnect();this.renderer.setAnimationLoop(null);
    this.mixer?.stopAllAction();if(this.cat)this.mixer?.uncacheRoot(this.cat);
    this.release(this.scene);this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();
  }
}
