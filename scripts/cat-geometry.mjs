// Original geometry; generated white-fur albedo is loaded separately by the scene.
import * as T from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const clamp=T.MathUtils.clamp, smooth=T.MathUtils.smoothstep;
const grey=new T.Color('#818996'), white=new T.Color('#f2eee5');
const ellipsoid=(p,c,s)=>{const q=p.map((v,i)=>(v-c[i])/s[i]), k0=Math.hypot(...q),k1=Math.hypot(...q.map((v,i)=>v/s[i]));return k1?k0*(k0-1)/k1:-Math.min(...s);};
const union=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return T.MathUtils.lerp(b,a,h)-k*h*(1-h);};
function coat(p,head=false){
  const [x,y,z]=p;
  let patch;
  if(head){const blaze=.07+.16*smooth(1.08-y,-.04,.32);const crown=smooth(y,.985,1.12)*(1-smooth(blaze-Math.abs(x),-.035,.025));patch=Math.max(crown,1-smooth(z,-.04,.19),smooth(Math.abs(x),.285,.385)*smooth(y,.91,1.07));}
  else {const bib=smooth(z,.07,.22)*(1-smooth(Math.abs(x),.17,.25));patch=(1-bib)*smooth(y,.15,.31);}
  return white.clone().lerp(grey,clamp(patch,0,1)).multiplyScalar(1+.015*Math.sin(x*85+y*62+z*29));
}

export function makeKittenGeometry(scene,bones,lookup){
  const standard=(name,color,roughness=.9,extra={})=>new T.MeshStandardMaterial({name,color,roughness,...extra});
  const physical=(name,color,roughness,clearcoat=1)=>new T.MeshPhysicalMaterial({name,color,roughness,clearcoat,clearcoatRoughness:.08});
  const materials=[standard('FurGrey','#818996',.93),standard('FurWhite','#ffffff',.95,{vertexColors:true}),standard('InnerEar','#deb8b4',.86),physical('Nose','#c99596',.34,.35),physical('Eye','#1a1614',.09),new T.MeshBasicMaterial({name:'EyeGlint',color:'#fffdf7'}),standard('Whisker','#eee9dd',.72),physical('Iris','#ffffff',.19),standard('Sclera','#ece6db',.26),standard('FaceCrease','#9b7e72',.8),standard('FurFibres','#ffffff',1,{vertexColors:true,side:T.DoubleSide}),standard('PawCrease','#cac6bd',1)];
  materials[7].vertexColors=true;
  const pieces=[],pieceMaterials=[];
  const jointIndex=name=>bones.indexOf(lookup[name]);
  function add(geometry,joint,material,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],skin){
    if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
    if(!geometry.index)geometry=mergeVertices(geometry,1e-6);
    const clean=[];for(let i=0;i<geometry.index.count;i+=3){const a=geometry.index.getX(i),b=geometry.index.getX(i+1),c=geometry.index.getX(i+2);if(a!==b&&b!==c&&a!==c)clean.push(a,b,c);}geometry.setIndex(clean);
    if(!geometry.attributes.color)geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*3).fill(1),3));
    geometry.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale)));
    const n=geometry.attributes.position.count,indices=new Uint8Array(n*4),weights=new Uint8Array(n*4);
    for(let i=0;i<n;i++){
      const p=[geometry.attributes.position.getX(i),geometry.attributes.position.getY(i),geometry.attributes.position.getZ(i)];
      const bindings=skin?skin(p):[[joint,1]];let remaining=255;
      bindings.forEach(([name,weight],j)=>{const w=j===bindings.length-1?remaining:Math.min(remaining,Math.round(weight*255));indices[i*4+j]=w?jointIndex(name):0;weights[i*4+j]=w;remaining-=w;});
    }
    geometry.setAttribute('skinIndex',new T.Uint8BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Uint8BufferAttribute(weights,4,true));
    pieces.push(geometry);pieceMaterials.push(material);
  }
  const sphere=(joint,mat,pos,scale,segments=24)=>add(new T.SphereGeometry(1,segments,Math.max(6,Math.floor(segments/2))),joint,mat,pos,scale);
  const tube=(joint,mat,points,radius,segments=18,skin)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,4,false),joint,mat,[0,0,0],[1,1,1],[0,0,0],skin);
  function sculpt(sdf,min,max,res,joint,head,skin){
    const mc=new MarchingCubes(res,materials[1],false,false,30000);mc.isolation=0;
    for(let z=0;z<res;z++)for(let y=0;y<res;y++)for(let x=0;x<res;x++){const p=[x,y,z].map((v,i)=>min[i]+v/res*(max[i]-min[i]));mc.field[x+y*res+z*res*res]=-sdf(p);}
    mc.update();const n=mc.count,positions=[],normals=[],colors=[],uv=[];
    for(let i=0;i<n;i++){
      const p=[mc.geometry.attributes.position.getX(i),mc.geometry.attributes.position.getY(i),mc.geometry.attributes.position.getZ(i)].map((v,j)=>min[j]+(v+1)/2*(max[j]-min[j]));
      const epsilon=.0008,d=p.map((_,j)=>{const a=[...p],b=[...p];a[j]+=epsilon;b[j]-=epsilon;return sdf(a)-sdf(b);}),normal=new T.Vector3(...d).normalize(),c=coat(p,head);
      positions.push(...p);normals.push(...normal.toArray());colors.push(c.r,c.g,c.b);uv.push(.5+Math.atan2(p[0],p[2])/(2*Math.PI),p[1]*.65);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    add(g,joint,1,[0,0,0],[1,1,1],[0,0,0],skin);mc.geometry.dispose();
  }
  const body=p=>{
    let d=ellipsoid(p,[0,.425,-.055],[.285,.35,.258]);d=union(d,ellipsoid(p,[0,.69,.035],[.175,.18,.17]),.13);
    for(const s of [-1,1]){d=union(d,ellipsoid(p,[s*.225,.24,-.04],[.17,.212,.183]),.09);d=union(d,ellipsoid(p,[s*.246,.094,.091],[.141,.074,.18]),.065);d=union(d,ellipsoid(p,[s*.139,.287,.179],[.084,.237,.092]),.035);d=union(d,ellipsoid(p,[s*.145,.086,.24],[.101,.068,.133]),.031);}return d;
  };
  const bodySkin=([x,y,z])=>{const front=smooth(z,.075,.16)*(1-smooth(Math.abs(x),.19,.24)),paw=front*(1-smooth(y,.3,.57)),hind=(1-front)*(1-smooth(y,.21,.43))*smooth(Math.abs(x),.1,.22),w=clamp(paw+hind,0,1);return [[(paw>hind?'Paw':'Hind')+(x<0?'L':'R'),w],['Body',1-w]];};
  sculpt(body,[-.45,-.02,-.36],[.45,.92,.44],32,'Body',false,bodySkin);
  const head=p=>{let d=ellipsoid(p,[0,1.04,.034],[.375,.325,.292]);for(const s of [-1,1]){d=union(d,ellipsoid(p,[s*.205,.96,.14],[.194,.194,.212]),.12);d=union(d,ellipsoid(p,[s*.061,.915,.31],[.098,.068,.063]),.022);}return union(d,ellipsoid(p,[0,.865,.292],[.118,.065,.08]),.035);};
  sculpt(head,[-.46,.73,-.29],[.46,1.41,.426],34,'Head',true);
  for(const side of [-1,1]){
    const joint=side<0?'EarL':'EarR',shape=new T.Shape();shape.moveTo(-.12,0);shape.bezierCurveTo(-.12,.12,-.09,.265,-.043,.285);shape.bezierCurveTo(.003,.298,.128,.102,.12,0);shape.quadraticCurveTo(0,-.045,-.12,0);
    const g=new T.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelThickness:.038,bevelSize:.023,bevelSegments:4,curveSegments:12,steps:1});
    add(g.clone(),joint,0,[side*.24,1.20,-.047],[1,1,1],[0,0,-side*.27]);
    add(g,joint,2,[side*.241,1.225,.054],[.68,.73,.27],[0,0,-side*.27]);
  }
  for(const side of [-1,1]){
    const joint=side<0?'EyeL':'EyeR';sphere(joint,9,[side*.151,1.028,.286],[.111,.123,.069]);sphere(joint,8,[side*.151,1.031,.3],[.105,.114,.064]);
    const g=new T.SphereGeometry(1,32,16),colors=[];
    for(let i=0;i<g.attributes.position.count;i++){const x=g.attributes.position.getX(i),y=g.attributes.position.getY(i),z=g.attributes.position.getZ(i),angle=Math.atan2(y,x),r=Math.hypot(x,y),f=(Math.sin(angle*63+r*24)+Math.sin(angle*117-r*20))*.07,c=new T.Color('#63472e').lerp(new T.Color('#9b7651'),clamp(.52*smooth(r,.2,.92)+f,0,1)).multiplyScalar(.9+.1*z);colors.push(c.r,c.g,c.b);}
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));add(g,joint,7,[side*.149,1.032,.335],[.078,.092,.042]);
    sphere(joint,4,[side*.143,1.037,.363],[.054,.069,.02]);sphere(joint,5,[side*.143-.022,1.074,.382],[.012,.016,.004],8);sphere(joint,5,[side*.143+.027,1.005,.382],[.0045,.006,.002],8);
  }
  const nose=new T.Shape();nose.moveTo(-.021,.005);nose.quadraticCurveTo(0,.016,.021,.005);nose.quadraticCurveTo(.022,-.005,.003,-.022);nose.quadraticCurveTo(0,-.026,-.003,-.022);nose.quadraticCurveTo(-.022,-.005,-.021,.005);
  add(new T.ExtrudeGeometry(nose,{depth:.008,bevelEnabled:true,bevelThickness:.008,bevelSize:.004,bevelSegments:3,curveSegments:8,steps:1}),'Mouth',3,[0,.943,.37]);
  tube('Mouth',9,[[0,.922,.385],[0,.9,.383],[-.026,.889,.379],[-.051,.901,.367]],.0019);tube('Mouth',9,[[0,.9,.383],[.026,.889,.379],[.051,.901,.367]],.0019);
  for(const s of [-1,1]){
    for(const dy of [-.026,0,.026])tube('Head',6,[[s*.112,.916+dy,.346],[s*.25,.926+dy,.344],[s*.43,.93+dy*2,.29]],.0009);
    tube('Head',0,[[s*.103,1.187,.266],[s*.142,1.204,.259],[s*.183,1.197,.239]],.006);
    for(const offset of [-.025,.025])tube(s<0?'PawL':'PawR',11,[[s*.145+offset,.113,.358],[s*.145+offset,.132,.345],[s*.145+offset,.135,.325]],.0008,10);
  }
  tube('TailBase',0,[[-.25,.26,-.12],[-.4,.19,-.1],[-.54,.28,-.07],[-.57,.49,-.04],[-.58,.65,-.04],[-.56,.76,-.055]],.074,32,([,y])=>{const b=smooth(y,.42,.68);return [['TailBase',1-b],['TailTip',b]];});
  sphere('TailTip',1,[-.56,.76,-.055],[.073,.092,.076],24);

  // Deterministic area-weighted wedges follow the same skin as the underlying coat.
  let seed=219718;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const surfaces=[];let area=0;
  pieces.forEach((g,i)=>{if(![0,1].includes(pieceMaterials[i]))return;for(let j=0;j<g.index.count;j+=3){const ids=[g.index.getX(j),g.index.getX(j+1),g.index.getX(j+2)],p=ids.map(k=>new T.Vector3().fromBufferAttribute(g.attributes.position,k)),a=new T.Vector3().subVectors(p[1],p[0]).cross(new T.Vector3().subVectors(p[2],p[0])).length()*.5;if(a<1e-10)continue;area+=a;surfaces.push({g,ids,limit:area,grey:pieceMaterials[i]===0});}});
  const hp=[],hn=[],hc=[],hu=[],hi=[],hw=[],hairIndices=[];
  for(let strand=0;strand<22500;strand++){
    const target=random()*area;let lo=0,high=surfaces.length-1;while(lo<high){const mid=(lo+high)>>1;if(surfaces[mid].limit<target)lo=mid+1;else high=mid;}const {g,ids,grey:isGrey}=surfaces[lo];
    const root=Math.sqrt(random()),v=random(),bary=[1-root,root*(1-v),root*v],p=new T.Vector3(),n=new T.Vector3(),color=new T.Color(0,0,0),bindings=new Map();
    ids.forEach((id,j)=>{const w=bary[j];p.addScaledVector(new T.Vector3().fromBufferAttribute(g.attributes.position,id),w);n.addScaledVector(new T.Vector3().fromBufferAttribute(g.attributes.normal,id),w);const c=isGrey?grey:new T.Color(g.attributes.color.getX(id),g.attributes.color.getY(id),g.attributes.color.getZ(id));color.r+=c.r*w;color.g+=c.g*w;color.b+=c.b*w;for(let k=0;k<4;k++){const wi=g.attributes.skinWeight.array[id*4+k]/255,bi=g.attributes.skinIndex.array[id*4+k];if(wi)bindings.set(bi,(bindings.get(bi)??0)+wi*w);}});n.normalize();
    const face=p.y>.84&&p.y<1.16&&p.z>.23,length=(.006+random()*.008)*(face?.4:1),tangent=new T.Vector3(random()-.5,random()-.5,random()-.5).cross(n).normalize(),width=(.00026+random()*.0003)*(face?.65:1),base=p.clone().addScaledVector(n,-.0007),tip=p.clone().addScaledVector(n,length).add(new T.Vector3(0,-length*.32,0));
    const pairs=[...bindings].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=pairs.reduce((s,[,w])=>s+w,0),indices=[],weights=[];let remaining=255;
    pairs.forEach(([bi,w],j)=>{const wi=j===pairs.length-1?remaining:Math.min(remaining,Math.round(w/sum*255));indices.push(wi?bi:0);weights.push(wi);remaining-=wi;});while(indices.length<4){indices.push(0);weights.push(0);}
    [base.clone().addScaledVector(tangent,-width),base.clone().addScaledVector(tangent,width),tip].forEach((point,j)=>{hp.push(...point.toArray());hn.push(...n.toArray());const c=color.clone().multiplyScalar(j===2?1.01+random()*.025:.965+random()*.025);hc.push(c.r,c.g,c.b);hu.push(.5+j*.25,j===2?1:0);hi.push(...indices);hw.push(...weights);hairIndices.push(hairIndices.length);});
  }
  const hairs=new T.BufferGeometry();hairs.setAttribute('position',new T.Float32BufferAttribute(hp,3));hairs.setAttribute('normal',new T.Float32BufferAttribute(hn,3));hairs.setAttribute('color',new T.Float32BufferAttribute(hc,3));hairs.setAttribute('uv',new T.Float32BufferAttribute(hu,2));hairs.setAttribute('skinIndex',new T.Uint8BufferAttribute(hi,4));hairs.setAttribute('skinWeight',new T.Uint8BufferAttribute(hw,4,true));hairs.setIndex(hairIndices);
  const ordered=pieces.map((g,i)=>({g,material:pieceMaterials[i]})).sort((a,b)=>a.material-b.material),merged=mergeGeometries(ordered.map(p=>p.g),true),groups=[];
  merged.groups.forEach((g,i)=>{const materialIndex=ordered[i].material,last=groups.at(-1);if(last?.materialIndex===materialIndex)last.count+=g.count;else groups.push({...g,materialIndex});});merged.clearGroups();groups.forEach(g=>merged.addGroup(g.start,g.count,g.materialIndex));
  for(const geometry of [merged,hairs]){const c=geometry.attributes.color;geometry.setAttribute('color',new T.Uint8BufferAttribute(Array.from(c.array,v=>Math.round(clamp(v,0,1)*255)),3,true));}
  const cat=new T.SkinnedMesh(merged,materials);cat.name='KittenMesh';scene.add(cat);cat.add(lookup.Root);scene.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);cat.bind(skeleton);cat.frustumCulled=false;
  const fur=new T.SkinnedMesh(hairs,materials[10]);fur.name='KittenFur';scene.add(fur);fur.bind(skeleton);fur.frustumCulled=false;
  return {merged,hairs};
}
