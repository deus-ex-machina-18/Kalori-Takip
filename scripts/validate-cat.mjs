import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import validator from 'gltf-validator';
const data=new Uint8Array(await readFile('public/models/grey-white-kitten.glb'));
const manifest=JSON.parse(await readFile('public/models/asset-manifest.json','utf8'));
const result=await validator.validateBytes(data,{uri:manifest.asset});
assert.equal(result.issues.numErrors,0);assert.equal(result.issues.numWarnings,0);
assert.equal(createHash('sha256').update(data).digest('hex'),manifest.sha256);
const fur=new Uint8Array(await readFile('public/models/white-fur-v1.jpg'));
assert.equal(createHash('sha256').update(fur).digest('hex'),manifest.runtimeTextures[0].sha256);
assert.equal(data.byteLength+fur.byteLength,manifest.initialBytes);
assert.ok(data.byteLength+fur.byteLength<=5*1024*1024);assert.ok(manifest.triangles<=50000);
assert.ok(manifest.baseTriangles<=28000);assert.equal(manifest.furTriangles,22500);
const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
assert.equal(view.getUint32(0,true),0x46546c67);
const gltf=JSON.parse(new TextDecoder().decode(data.subarray(20,20+view.getUint32(12,true))));
// A valid GLB can still contain clipped, open paws or muzzle surfaces. Check the
// exported coat topology as well as format validity; strand cards stay open by design.
const binaryStart=20+view.getUint32(12,true)+8;
const accessor=index=>{
  const a=gltf.accessors[index],bufferView=gltf.bufferViews[a.bufferView];
  const TypedArray={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];
  const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
  return new TypedArray(data.buffer,data.byteOffset+binaryStart+(bufferView.byteOffset??0)+(a.byteOffset??0),a.count*components);
};
for(const primitive of gltf.meshes.flatMap(mesh=>mesh.primitives)){
  if(gltf.materials[primitive.material].name!=='FurWhite')continue;
  const positions=accessor(primitive.attributes.POSITION),indices=accessor(primitive.indices),edges=new Map();
  const vertex=index=>Array.from(positions.subarray(index*3,index*3+3),value=>value.toFixed(5)).join(',');
  for(let i=0;i<indices.length;i+=3)for(let edge=0;edge<3;edge++){
    const key=[vertex(indices[i+edge]),vertex(indices[i+(edge+1)%3])].sort().join('|');
    edges.set(key,(edges.get(key)??0)+1);
  }
  assert.equal([...edges.values()].filter(count=>count===1).length,0,'Coat surfaces must be closed: pad the sampling volume around paws and muzzle');
}
assert.ok(gltf.skins?.[0]?.joints.length>=10);
assert.deepEqual(gltf.animations.map(a=>a.name).sort(),['care','happy','idle','play','sleep','stretch']);
const animatedNodes=new Set(gltf.animations.flatMap(a=>a.channels.map(c=>gltf.nodes[c.target.node].name)));
for(const joint of ['Head','EarL','EarR','TailBase','TailTip','PawL','PawR','EyeL','EyeR','Mouth'])assert.ok(animatedNodes.has(joint),`${joint} requires an animation track`);
assert.ok(gltf.meshes.every(m=>m.primitives.every(p=>p.attributes.JOINTS_0!==undefined && p.attributes.WEIGHTS_0!==undefined)));
assert.ok(gltf.nodes.find(n=>n.name==='KittenFur'&&n.skin!==undefined));
assert.equal(gltf.meshes.flatMap(m=>m.primitives).reduce((s,p)=>s+gltf.accessors[p.indices].count/3,0),manifest.triangles);
assert.equal(gltf.textures?.length ?? 0,0);
console.log(`GLB passed: ${data.byteLength} bytes, ${manifest.triangles} triangles, ${gltf.skins[0].joints.length} joints, six clips, zero validator errors/warnings.`);
