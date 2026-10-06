import * as T from 'three';
import settings from '../../assets/cat/render-settings.json';

// Shells reuse the rigged coat vertices: no second model or downloaded hair atlas.
// Twelve slices describe dense underfur; GLB strands supply fine silhouette tips.
export const FUR_LAYERS = settings.furLayers;
export const BALANCED_FUR_LAYERS = settings.balancedFurLayers;

function shellMaterial(layer:number):T.MeshStandardMaterial {
  const material=new T.MeshStandardMaterial({
    name:`Underfur${layer}`,vertexColors:true,roughness:1,envMapIntensity:.3,
    transparent:true,depthWrite:false,alphaTest:.015,
  });
  material.onBeforeCompile=shader=>{
    shader.uniforms.furLayer={value:layer/FUR_LAYERS};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      attribute float furLength;
      uniform float furLayer;
      varying vec3 vFurRoot;
      varying vec3 vFurNormal;
    `).replace('#include <begin_vertex>',`
      vFurRoot=position;
      vFurNormal=normal;
      vec3 furNormal=normalize(normal);
      vec3 groom=vec3(position.x*.18,-.55,.10);
      groom-=furNormal*dot(groom,furNormal);
      groom=normalize(groom+vec3(.0001));
      vec3 transformed=position+furLength*(furNormal*furLayer*.78+groom*furLayer*furLayer*.48);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform float furLayer;
      varying vec3 vFurRoot;
      varying vec3 vFurNormal;
      vec2 furHash(vec2 p) {
        vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
        q+=dot(q,q.yzx+33.33);
        return fract((q.xx+q.yz)*q.zy);
      }
      float furMask(vec2 p) {
        p*=460.0;
        vec2 base=floor(p-.5);
        float distanceToHair=10.0;
        // Neighbouring jittered roots avoid the visible diagonal grid of a
        // repeated dot mask. Each follicle keeps its bend through all slices.
        for(int i=0;i<4;i++){
          vec2 cell=base+vec2(float(i-i/2*2),float(i/2));
          vec2 random=furHash(cell);
          vec2 bend=(vec2(.12,-.20)+(furHash(cell+127.0)-.5)*.23)*furLayer*furLayer;
          vec2 delta=(p-cell-random-bend)*vec2(1.0,.72);
          distanceToHair=min(distanceToHair,length(delta));
        }
        float radius=mix(.27,.045,pow(furLayer,.65));
        float antialias=max(.028,fwidth(distanceToHair)*.55);
        return 1.0-smoothstep(radius-antialias,radius+antialias,distanceToHair);
      }
    `).replace('#include <alphatest_fragment>',`
      vec3 n=abs(vFurNormal);
      // Dominant projection avoids doing three follicle searches per fragment.
      vec2 furPlane=n.z>=n.x&&n.z>=n.y?vFurRoot.xy:n.x>=n.y?vFurRoot.yz:vFurRoot.xz;
      float coverage=furMask(furPlane);
      diffuseColor.a*=coverage*.88;
      diffuseColor.rgb*=mix(.72,1.03,sqrt(furLayer));
      #include <alphatest_fragment>
    `);
  };
  material.customProgramCacheKey=()=> 'kitten-underfur-v4';
  return material;
}

export function addUnderfur(coats:T.SkinnedMesh[]):void {
  const coat=coats[0];if(!coat)return;
  const source=coat.geometry;
  const indices:number[]=[],colours=new Uint8Array(source.attributes.position!.count*3);
  const sourceColours=source.attributes.color;
  if(!source.index||!sourceColours)return;
  for(let i=0;i<sourceColours.count;i++)for(let c=0;c<3;c++)colours[i*3+c]=Math.round(sourceColours.getComponent(i,c)*255);
  for(const piece of coats){
    const material=piece.material;
    if(!(material instanceof T.MeshStandardMaterial)||!piece.geometry.index)continue;
    const tint=[material.color.r,material.color.g,material.color.b];
    for(let i=0;i<piece.geometry.index.count;i++){
      const index=piece.geometry.index.getX(i);indices.push(index);
      for(let c=0;c<3;c++)colours[index*3+c]=Math.round(sourceColours.getComponent(index,c)*tint[c]!*255);
    }
  }
  const geometry=new T.BufferGeometry();
  for(const [name,attribute] of Object.entries(source.attributes))geometry.setAttribute(name,attribute);
  geometry.setIndex(indices);
  geometry.setAttribute('color',new T.Uint8BufferAttribute(colours,3,true));
  const lengths=new Float32Array(source.attributes.position!.count);
  for(let i=0;i<lengths.length;i++){
    const x=source.attributes.position!.getX(i),y=source.attributes.position!.getY(i),z=source.attributes.position!.getZ(i);
    const face=y>.73&&y<1.16&&z>.16;
    lengths[i]=y<.035?0:y>1.25?.009:face?.011:Math.abs(x)>.47?.026:.021;
  }
  geometry.setAttribute('furLength',new T.Float32BufferAttribute(lengths,1));
  geometry.computeBoundingSphere();
  for(let layer=1;layer<=FUR_LAYERS;layer++){
    const shell=new T.SkinnedMesh(geometry,shellMaterial(layer));
    shell.name=`Underfur${layer}`;shell.bindMode=coat.bindMode;
    shell.bind(coat.skeleton,coat.bindMatrix);shell.frustumCulled=false;
    shell.receiveShadow=true;
    shell.renderOrder=layer;coat.parent!.add(shell);
  }
}

export function reduceUnderfur(root:T.Object3D):void {
  root.traverse(object=>{if(object.name.startsWith('Underfur')){
    const layer=Number(object.name.slice('Underfur'.length));
    object.visible=layer%(FUR_LAYERS/BALANCED_FUR_LAYERS)===0;
  }});
}
