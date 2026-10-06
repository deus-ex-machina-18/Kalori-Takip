// Original procedural asset source. No downloaded mesh, image or texture.
import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import validator from 'gltf-validator';

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
bone('Head', [0,.57,.035], 'Body');
bone('EarL', [-.245,.24,0], 'Head'); bone('EarR', [.245,.24,0], 'Head');
bone('TailBase', [-.28,-.16,-.08], 'Body'); bone('TailTip', [-.25,.23,0], 'TailBase');
bone('PawL', [-.145,-.15,.16], 'Body'); bone('PawR', [.145,-.15,.16], 'Body');
bone('HindL', [-.26,-.22,-.03], 'Body'); bone('HindR', [.26,-.22,-.03], 'Body');
bone('EyeL', [-.133,.025,.297], 'Head'); bone('EyeR', [.133,.025,.297], 'Head');
bone('Mouth', [0,-.145,.322], 'Head');
scene.updateMatrixWorld(true);
const materials = [
  ['FurGrey','#92979d',.86], ['FurWhite','#f8f7f3',.91],
  ['InnerEar','#d9b0b2',.94], ['Nose','#bd8c90',.8],
  ['Eye','#30383b',.22], ['EyeGlint','#ffffff',.2],
  ['Whisker','#697078',.9], ['Iris','#827266',.42],
].map(([name,color,roughness]) => new T.MeshStandardMaterial({ name, color, roughness, metalness:0, vertexColors:name==='FurWhite' }));
const pieces = [], pieceMaterials = [];
function add(geometry, joint, material, position=[0,0,0], scale=[1,1,1], rotation=[0,0,0]) {
  geometry.deleteAttribute('uv');
  if (!geometry.index) geometry = mergeVertices(geometry);
  if(!geometry.attributes.color)geometry.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:geometry.attributes.position.count*3},()=>1),3));
  const matrix = new T.Matrix4().compose(new T.Vector3(...position), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(...scale));
  geometry.applyMatrix4(matrix);
  const n = geometry.attributes.position.count;
  const indices = new Uint16Array(n*4), weights = new Float32Array(n*4);
  for (let i=0;i<n;i++) { indices[i*4] = bones.indexOf(lookup[joint]); weights[i*4]=1; }
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  pieces.push(geometry); pieceMaterials.push(material);
}
const sphere = (joint,mat,pos,scale,segments=24) => add(new T.SphereGeometry(1,segments,16),joint,mat,pos,scale);
function paintedSphere(joint,pos,scale,patch) {
  const geometry=new T.SphereGeometry(1,32,20),colors=[];
  const grey=new T.Color('#92979d'),white=new T.Color('#f8f7f3');
  // FurWhite has a white base, so vertex colors encode the grey/white coat.
  materials[1].color.set('#ffffff');
  for(let i=0;i<geometry.attributes.position.count;i++){
    const x=geometry.attributes.position.getX(i),y=geometry.attributes.position.getY(i),z=geometry.attributes.position.getZ(i);
    const color=patch(x,y,z)?grey:white;colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));add(geometry,joint,1,pos,scale);
}
// Soft continuous silhouette, white chest and mittens; healthy body shape is fixed.
paintedSphere('Body',[0,.43,-.025],[.285,.36,.245],(x,y,z)=>!(z>.48 && Math.abs(x)<.67 && y>-.7));
for (const [side,joint,hind] of [[-1,'PawL','HindL'],[1,'PawR','HindR']]) {
  sphere(hind,0,[side*.235,.225,-.008],[.166,.205,.182]);
  sphere(hind,1,[side*.245,.088,.105],[.134,.084,.157]);
  sphere(joint,1,[side*.143,.256,.18],[.087,.226,.103]);
  sphere(joint,1,[side*.146,.072,.242],[.106,.072,.126]);
}
// Grey crown/cheeks are color regions on one smooth face, not protruding patches.
paintedSphere('Head',[0,1.015,.035],[.374,.327,.301],(x,y,z)=>z<.05 || Math.abs(x)>.75 || (y>.45 && (Math.abs(x)>.2 || y>.85)));
sphere('Head',1,[-.071,.888,.279],[.108,.075,.063]);
sphere('Head',1,[.071,.888,.279],[.108,.075,.063]);

function ear(joint,side) {
  const shape=new T.Shape();
  shape.moveTo(-.12,0); shape.bezierCurveTo(-.12,.12,-.09,.265,-.043,.285);
  shape.bezierCurveTo(.003,.298,.128,.102,.12,0); shape.quadraticCurveTo(0,-.045,-.12,0);
  const geometry=new T.ExtrudeGeometry(shape,{depth:.066,bevelEnabled:true,bevelThickness:.028,bevelSize:.026,bevelSegments:3,steps:1,curveSegments:10});
  add(geometry,joint,0,[side*.239,1.221,-.032],[1,1,1],[0,0,-side*.24]);
  add(geometry.clone(),joint,2,[side*.243,1.243,.063],[.62,.67,.2],[0,0,-side*.24]);
}
ear('EarL',-1);ear('EarR',1);
for (const [side,joint] of [[-1,'EyeL'],[1,'EyeR']]) {
  sphere(joint,0,[side*.133,1.042,.305],[.078,.094,.02]);
  sphere(joint,7,[side*.133,1.039,.319],[.061,.075,.023]);
  sphere(joint,4,[side*.133,1.041,.335],[.046,.065,.013]);
  sphere(joint,5,[side*.133-.018,1.068,.348],[.017,.02,.007],12);
  sphere(joint,5,[side*.133+.018,1.015,.348],[.006,.007,.004],12);
}
sphere('Head',3,[0,.927,.344],[.035,.025,.022],16);
function tube(joint,mat,points,radius) {
  add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,radius,6,false),joint,mat);
}
tube('Mouth',6,[[0,.916,.346],[0,.884,.35],[-.026,.873,.344],[-.05,.884,.338]],.004);
tube('Mouth',6,[[0,.884,.35],[.026,.873,.344],[.05,.884,.338]],.004);
for (const side of [-1,1]) for (const dy of [-.026,.022]) {
  tube('Head',6,[[side*.112,.893+dy,.319],[side*.236,.904+dy,.317],[side*.365,.91+dy*2,.27]],.0025);
}
tube('TailBase',0,[[-.25,.26,-.12],[-.4,.19,-.1],[-.54,.28,-.07],[-.57,.49,-.04],[-.58,.61,-.04],[-.56,.71,-.015]],.069);
const tail=pieces.at(-1);
for(let i=0;i<tail.attributes.position.count;i++){
  const blend=T.MathUtils.smoothstep(tail.attributes.position.getY(i),.42,.62);
  tail.attributes.skinIndex.setXY(i,blend<1?bones.indexOf(lookup.TailBase):0,blend>0?bones.indexOf(lookup.TailTip):0);
  tail.attributes.skinWeight.setXY(i,1-blend,blend);
}
sphere('TailTip',1,[-.56,.716,-.015],[.072,.095,.074],16);
const ordered=pieces.map((geometry,i)=>({geometry,material:pieceMaterials[i]})).sort((a,b)=>a.material-b.material);
const merged = mergeGeometries(ordered.map(p=>p.geometry),true);
const groups=[];
merged.groups.forEach((group,i)=>{
  const material=ordered[i].material,previous=groups.at(-1);
  if(previous?.materialIndex===material)previous.count+=group.count;
  else groups.push({...group,materialIndex:material});
});
merged.clearGroups();groups.forEach(g=>merged.addGroup(g.start,g.count,g.materialIndex));
const cat=new T.SkinnedMesh(merged,materials);cat.name='KittenMesh';
scene.add(cat);cat.add(lookup.Root);scene.updateMatrixWorld(true);
cat.bind(new T.Skeleton(bones));
cat.frustumCulled=false;
const tracks = (entries) => entries.map(([name,path,times,values]) => path==='quaternion' ? new T.QuaternionKeyframeTrack(`${name}.${path}`,times,values) : new T.VectorKeyframeTrack(`${name}.${path}`,times,values));
const q=(axis,angle)=>new T.Quaternion().setFromAxisAngle(new T.Vector3(...axis),angle).toArray();
const rotate=(name,axis,times,angles)=>[name,'quaternion',times,angles.flatMap(a=>q(axis,a))];
const blink=(times,ys)=>['EyeL','EyeR'].map(name=>[name,'scale',times,ys.flatMap(y=>[1,y,1])]);
const animations=[
  new T.AnimationClip('idle',4,tracks([
    rotate('Head',[0,0,1],[0,2,4],[0,.025,0]),rotate('TailTip',[0,0,1],[0,2,4],[-.07,.08,-.07]),
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
const report={
  asset:'grey-white-kitten.glb',version:1,author:'Kalori-Takip project contributors (procedural generation)',
  license:'MIT',source:'scripts/build-cat.mjs',date:'2026-10-06',
  sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,
  triangles:merged.index.count/3,textures:0,bones:bones.map(b=>b.name),
  clips:animations.map(a=>({name:a.name,duration:a.duration,loop:['idle','sleep','care'].includes(a.name)})),
  coordinates:{unit:'metre',up:'Y',front:'+Z',pivot:[0,0,0]},
  validation:validation.issues,
};
await mkdir('public/models',{recursive:true});
await writeFile('public/models/grey-white-kitten.glb',bytes);
await writeFile('public/models/asset-manifest.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({bytes:report.bytes,triangles:report.triangles,bones:bones.length,validation:validation.issues},null,2));
