// Original procedural geometry and animation. Runtime albedo provenance: assets/cat/.
import * as T from 'three';
import { makeKittenGeometry } from './cat-geometry.mjs';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import validator from 'gltf-validator';
import sharp from 'sharp';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(v => { this.result = v; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(v => { this.result = `data:${blob.type};base64,${Buffer.from(v).toString('base64')}`; this.onloadend?.(); }); }
};
const scene = new T.Scene();
scene.name = 'GreyWhiteKitten';
const bones = [], lookup = {};
function bone(name, position, parent) {
  const b = new T.Bone(); b.name = name; b.position.fromArray(position);
  (parent ? lookup[parent] : scene).add(b); lookup[name] = b; bones.push(b); return b;
}
bone('Root', [0,0,0]);
bone('Body', [0,.44,0], 'Root');
bone('Head', [0,.560,.035], 'Body');
bone('EarL', [-.254,.163,-.060], 'Head'); bone('EarR', [.254,.163,-.060], 'Head');
bone('TailBase', [-.28,-.16,-.08], 'Body'); bone('TailTip', [-.31,.28,.04], 'TailBase');
bone('PawL', [-.145,-.15,.16], 'Body'); bone('PawR', [.145,-.15,.16], 'Body');
bone('HindL', [-.26,-.22,-.03], 'Body'); bone('HindR', [.26,-.22,-.03], 'Body');
bone('EyeL', [-.180,.020,.232], 'Head'); bone('EyeR', [.180,.020,.232], 'Head');
bone('Mouth', [0,-.093,.345], 'Head');
scene.updateMatrixWorld(true);
const {merged,hairs}=makeKittenGeometry(scene,bones,lookup);
const tracks = (entries) => entries.map(([name,path,times,values]) => path==='quaternion' ? new T.QuaternionKeyframeTrack(`${name}.${path}`,times,values) : new T.VectorKeyframeTrack(`${name}.${path}`,times,values));
const q=(axis,angle)=>new T.Quaternion().setFromAxisAngle(new T.Vector3(...axis),angle).toArray();
const rotate=(name,axis,times,angles)=>[name,'quaternion',times,angles.flatMap(a=>q(axis,a))];
const blink=(times,ys)=>['EyeL','EyeR'].map(name=>[name,'scale',times,ys.flatMap(y=>[1,y,1])]);
const animations=[
  new T.AnimationClip('idle',4,tracks([
    rotate('Head',[0,0,1],[0,2,4],[.12,.145,.12]),rotate('TailTip',[0,0,1],[0,2,4],[-.07,.08,-.07]),
    rotate('EarL',[0,0,1],[0,2,4],[0,.045,0]),
    ...blink([0,2.8,2.92,3.06,4],[1,1,.06,1,1]),
  ])),
  new T.AnimationClip('happy',2,tracks([
    rotate('Head',[0,0,1],[0,.5,1,1.5,2],[0,-.1,0,.1,0]),
    rotate('TailBase',[0,1,0],[0,.5,1,1.5,2],[0,.28,0,-.28,0]),
    rotate('PawR',[0,0,1],[0,.4,1.5,2],[0,.55,.4,0]),...blink([0,1,1.2,2],[1,.4,.4,1]),
    ['Mouth','scale',[0,1,2],[1,1,1,1.1,1,1,1,1,1]],
  ])),
  new T.AnimationClip('stretch',3,tracks([
    ['Body','scale',[0,1,2,3],[1,1,1,.94,1.1,.98,.94,1.1,.98,1,1,1]],
    rotate('Head',[1,0,0],[0,1.5,3],[0,-.17,0]),
    rotate('PawL',[1,0,0],[0,1.5,3],[0,-.3,0]),rotate('PawR',[1,0,0],[0,1.5,3],[0,-.3,0]),
  ])),
  new T.AnimationClip('play',2.4,tracks([
    rotate('Head',[0,1,0],[0,.6,1.2,1.8,2.4],[0,-.14,0,.14,0]),
    rotate('PawL',[1,0,0],[0,.6,1.2,1.8,2.4],[0,-.7,0,-.5,0]),
    rotate('TailTip',[0,0,1],[0,1.2,2.4],[0,-.3,0]),
    rotate('EarR',[0,0,1],[0,1.2,2.4],[0,-.1,0]),
  ])),
  new T.AnimationClip('sleep',6,tracks([
    rotate('Head',[1,0,0],[0,3,6],[.14,.16,.14]),
    ['Body','scale',[0,3,6],[1,1,1,1,1.018,1,1,1,1]],...blink([0,6],[.055,.055]),
  ])),
  new T.AnimationClip('care',4,tracks([
    rotate('Head',[0,0,1],[0,2,4],[.06,-.03,.06]),
    rotate('TailTip',[0,0,1],[0,2,4],[0,.045,0]),...blink([0,2.5,2.65,2.8,4],[1,1,.07,1,1]),
  ])),
];
const glb=await new GLTFExporter().parseAsync(scene,{binary:true,animations,onlyVisible:true});
const bytes=new Uint8Array(glb);
const validation=await validator.validateBytes(bytes,{uri:'grey-white-kitten.glb'});
if(validation.issues.numErrors || validation.issues.numWarnings) throw new Error(JSON.stringify(validation.issues.messages.slice(0,5)));
const fur=await readFile('public/models/white-fur-v1.jpg');
const poster=await readFile('public/models/cat-poster.webp'),posterMetadata=await sharp(poster).metadata();
const report={
  asset:'grey-white-kitten.glb',version:4,author:'Kalori-Takip project contributors (procedural generation)',
  license:'MIT',source:'scripts/build-cat.mjs',date:'2026-10-06',
  sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,
  triangles:(merged.index.count+hairs.index.count)/3,baseTriangles:merged.index.count/3,furTriangles:hairs.index.count/3,furStrands:22500,textures:0,bones:bones.map(b=>b.name),
  clips:animations.map(a=>({name:a.name,duration:a.duration,loop:['idle','sleep','care'].includes(a.name)})),
  coordinates:{unit:'metre',up:'Y',front:'+Z',pivot:[0,0,0]},
  runtimeTextures:[{asset:'white-fur-v1.jpg',source:'assets/cat/white-fur-source.png',provenance:'assets/cat/white-fur-source.json',bytes:fur.length,sha256:createHash('sha256').update(fur).digest('hex'),width:1024,height:1024,colorSpace:'sRGB',role:'albedo'}],
  poster:{asset:'cat-poster.webp',bytes:poster.length,sha256:createHash('sha256').update(poster).digest('hex'),width:posterMetadata.width,height:posterMetadata.height,source:'same live GLB, scene and shaders; refresh after geometry or rendering changes'},
  initialBytes:bytes.length+fur.length+poster.length,
  rendering:JSON.parse(await readFile('assets/cat/render-settings.json','utf8')),
  validation:validation.issues,
};
await mkdir('public/models',{recursive:true});
await writeFile('public/models/grey-white-kitten.glb',bytes);
await writeFile('public/models/asset-manifest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({bytes:report.bytes,triangles:report.triangles,bones:bones.length,validation:validation.issues},null,2));
