// Original geometry; generated white-fur albedo is loaded separately by the scene.
import * as T from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const clamp=T.MathUtils.clamp, smooth=T.MathUtils.smoothstep;
const grey=new T.Color('#8d929c'), white=new T.Color('#f9f4ec');
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
  const materials=[standard('FurGrey',grey,.95),standard('FurWhite','#ffffff',.95,{vertexColors:true}),standard('InnerEar','#d9a5a0',.95),physical('Nose','#dc9a90',.52,.15),physical('Eye','#211a16',.23,.9),new T.MeshBasicMaterial({name:'EyeGlint',color:'#fff8ed'}),standard('Whisker','#f8f2e6',.85),physical('Iris','#ffffff',.28,.9),standard('Sclera','#f1e7d8',.35),standard('FaceCrease','#685044',1),standard('FurFibres','#ffffff',1,{vertexColors:true,side:T.DoubleSide}),standard('PawCrease','#beb8ac',1)];
  materials[7].vertexColors=true;
  const pieces=[],pieceMaterials=[];
  const jointIndex=name=>bones.indexOf(lookup[name]);
  function add(geometry,joint,material,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],skin){
    if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
    if(!geometry.index)geometry=mergeVertices(geometry,1e-6);
    const clean=[];for(let i=0;i<geometry.index.count;i+=3){const a=geometry.index.getX(i),b=geometry.index.getX(i+1),c=geometry.index.getX(i+2);if(a!==b&&b!==c&&a!==c)clean.push(a,b,c);}geometry.setIndex(clean);
    if(!geometry.attributes.color)geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*3).fill(1),3));
    geometry.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale)));
    // Lower the entire face assembly with its rig; the cheeks meet the shoulders.
    if(['Head','EarL','EarR','EyeL','EyeR','Mouth'].includes(joint))geometry.translate(0,-.075,0);
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
    let d=ellipsoid(p,[0,.38,-.06],[.30,.32,.27]);d=union(d,ellipsoid(p,[0,.64,.045],[.208,.195,.20]),.12);
    for(const s of [-1,1]){
      d=union(d,ellipsoid(p,[s*.245,.24,-.035],[.187,.205,.22]),.07);
      d=union(d,ellipsoid(p,[s*.262,.075,.108],[.145,.064,.172]),.034);
      d=union(d,ellipsoid(p,[s*.14,.31,.205],[.101,.242,.115]),.034);
      d=union(d,ellipsoid(p,[s*.143,.080,.295],[.115,.066,.13]),.034);
      // Rounded toe volumes replace a sharp foot/ankle seam.
      for(const offset of [-.060,0,.060])d=union(d,ellipsoid(p,[s*.143+offset,.065,.363],[.048,.043,.071]),.013);
    }return d;
  };
  const bodySkin=([x,y,z])=>{const front=smooth(z,.075,.16)*(1-smooth(Math.abs(x),.19,.24)),paw=front*(1-smooth(y,.3,.57)),hind=(1-front)*(1-smooth(y,.21,.43))*smooth(Math.abs(x),.1,.22),w=clamp(paw+hind,0,1);return [[(paw>hind?'Paw':'Hind')+(x<0?'L':'R'),w],['Body',1-w]];};
  // MarchingCubes omits its two outer sample cells. Pad beyond the full SDF surface.
  sculpt(body,[-.55,-.08,-.42],[.55,.92,.52],30,'Body',false,bodySkin);
  const head=p=>{
    let d=ellipsoid(p,[0,1.075,.012],[.411,.320,.295]);
    for(const s of [-1,1]){
      d=union(d,ellipsoid(p,[s*.217,.988,.10],[.222,.191,.229]),.095);
      d=union(d,ellipsoid(p,[s*.064,.946,.320],[.082,.065,.075]),.020);
    }
    d=union(d,ellipsoid(p,[0,.878,.257],[.147,.071,.094]),.055);
    // The eyeball sits within a closed sculpted socket, rather than on the fur.
    for(const s of [-1,1])d=-union(-d,ellipsoid(p,[s*.180,1.095,.293],[.120,.131,.069]),.014);
    return d;
  };
  sculpt(head,[-.56,.67,-.35],[.56,1.49,.52],36,'Head',true);
  for(const side of [-1,1]){
    const joint=side<0?'EarL':'EarR',shape=new T.Shape();shape.moveTo(-.12,0);shape.bezierCurveTo(-.12,.12,-.09,.265,-.043,.285);shape.bezierCurveTo(.003,.298,.128,.102,.12,0);shape.quadraticCurveTo(0,-.045,-.12,0);
    const outline=shape.getSpacedPoints(40).slice(0,-1).reverse();
    function earSurface(pink=false){
      const positions=[],uv=[],indices=[],rings=8,count=outline.length,centre=new T.Vector2(0,.105);
      function surface(back){
        const start=positions.length/3;
        const point=(p,r)=>{const z=back?-.040+.025*r*r:.018+.027*r*r+(pink?.014:0);positions.push(p.x,p.y,z);uv.push(p.x*3+.5,p.y*3);};
        point(centre,0);
        for(let ring=1;ring<=rings;ring++)for(const edge of outline){const r=ring/rings*(pink?.72:1);point(centre.clone().lerp(edge,r),r);}
        const triangle=(a,b,c)=>indices.push(...(back?[a,c,b]:[a,b,c]));
        for(let j=0;j<count;j++)triangle(start,start+1+j,start+1+(j+1)%count);
        for(let ring=1;ring<rings;ring++)for(let j=0;j<count;j++){
          const a=start+1+(ring-1)*count+j,b=start+1+(ring-1)*count+(j+1)%count,c=a+count,d=b+count;
          triangle(a,c,b);triangle(b,c,d);
        }
        return start+1+(rings-1)*count;
      }
      const front=surface(false);
      if(!pink){const back=surface(true);for(let j=0;j<count;j++){const next=(j+1)%count;indices.push(front+j,back+j,front+next,front+next,back+j,back+next);}}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
    }
    add(earSurface(),joint,0,[side*.254,1.238,-.025],[1.17,1.05,1],[0,0,-side*.28]);
    add(earSurface(true),joint,2,[side*.254,1.238,-.025],[1.17,1.05,1],[0,0,-side*.28]);
  }
  for(const side of [-1,1]){
    const joint=side<0?'EyeL':'EyeR',cx=side*.180,cy=1.095;
    sphere(joint,8,[cx,cy,.267],[.117,.128,.075],32);
    // One convex corneal cap with a dark limbal rim, radial brown iris and pupil.
    // A cap avoids the metallic spherical bead produced by a whole iris sphere.
    const positions=[],normals=[],colors=[],uv=[],indices=[],rings=12,segments=56;
    for(let ring=0;ring<=rings;ring++)for(let j=0;j<=segments;j++){
      const r=ring/rings,a=j/segments*Math.PI*2,x=Math.cos(a)*r,y=Math.sin(a)*r;
      const z=.312+.036*Math.sqrt(Math.max(0,1-r*r));
      positions.push(cx-.004+x*.108,cy+.003+y*.121,z);
      // The iris lies behind the cornea; its shading stays nearly planar.
      normals.push(...new T.Vector3(x*.10,y*.10,1).normalize().toArray());
      const fibre=.065*Math.sin(a*73+r*18)+.038*Math.sin(a*137-r*31);
      const c=new T.Color('#4e3222').lerp(new T.Color('#865832'),clamp(.55+fibre,0,1));
      c.lerp(new T.Color('#382317'),smooth(r,.87,1));
      c.lerp(new T.Color('#11100e'),1-smooth(r,.65,.71));
      colors.push(c.r,c.g,c.b);uv.push(.5+x*.5,.5+y*.5);
      if(ring<rings&&j<segments){const k=ring*(segments+1)+j;indices.push(k,k+segments+2,k+1,k,k+segments+1,k+segments+2);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);add(g,joint,7);
    sphere(joint,5,[cx-.037,cy+.038,.346],[.009,.012,.002],12);
    sphere(joint,5,[cx+.033,cy-.035,.346],[.0026,.0035,.001],8);
    tube(joint,9,[[cx-.110,cy+.008,.299],[cx-.075,cy+.096,.301],[cx,cy+.128,.298],[cx+.077,cy+.096,.298],[cx+.110,cy+.008,.299]],.0022,28);
  }
  const nose=new T.Shape();nose.moveTo(-.021,.005);nose.quadraticCurveTo(0,.016,.021,.005);nose.quadraticCurveTo(.022,-.005,.003,-.022);nose.quadraticCurveTo(0,-.026,-.003,-.022);nose.quadraticCurveTo(-.022,-.005,-.021,.005);
  add(new T.ExtrudeGeometry(nose,{depth:.008,bevelEnabled:true,bevelThickness:.008,bevelSize:.004,bevelSegments:3,curveSegments:8,steps:1}),'Mouth',3,[0,.982,.404],[1.16,1.10,1]);
  tube('Mouth',9,[[0,.958,.409],[0,.929,.402],[-.026,.917,.399],[-.055,.929,.390]],.0012);tube('Mouth',9,[[0,.929,.402],[.026,.917,.399],[.055,.929,.390]],.0012);
  for(const s of [-1,1]){
    for(const dy of [-.026,0,.026])tube('Head',6,[[s*.114,.947+dy,.367],[s*.315,.976+dy,.374],[s*.53,.970+dy*2,.315]],.00048,24);
    tube('Head',0,[[s*.110,1.239,.267],[s*.148,1.252,.248],[s*.188,1.240,.235]],.009);
    for(const offset of [-.030,.030])tube(s<0?'PawL':'PawR',11,[[s*.143+offset,.072,.425],[s*.143+offset,.103,.401],[s*.143+offset,.116,.376]],.0005,10);
  }
  tube('TailBase',0,[[-.25,.26,-.12],[-.43,.20,-.09],[-.55,.30,-.07],[-.60,.48,-.05],[-.61,.63,-.04],[-.60,.77,-.055]],.087,40,([,y])=>{const b=smooth(y,.42,.68);return [['TailBase',1-b],['TailTip',b]];});
  sphere('TailTip',1,[-.60,.77,-.055],[.087,.105,.088],24);

  // Deterministic area-weighted wedges follow the same skin as the underlying coat.
  let seed=219718;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const surfaces=[];let area=0;
  pieces.forEach((g,i)=>{if(![0,1].includes(pieceMaterials[i]))return;for(let j=0;j<g.index.count;j+=3){const ids=[g.index.getX(j),g.index.getX(j+1),g.index.getX(j+2)],p=ids.map(k=>new T.Vector3().fromBufferAttribute(g.attributes.position,k)),a=new T.Vector3().subVectors(p[1],p[0]).cross(new T.Vector3().subVectors(p[2],p[0])).length()*.5;if(a<1e-10)continue;area+=a;surfaces.push({g,ids,limit:area,grey:pieceMaterials[i]===0});}});
  const hp=[],hn=[],hc=[],hu=[],hi=[],hw=[],hairIndices=[];
  for(let strand=0;strand<22500;strand++){
    const target=random()*area;let lo=0,high=surfaces.length-1;while(lo<high){const mid=(lo+high)>>1;if(surfaces[mid].limit<target)lo=mid+1;else high=mid;}const {g,ids,grey:isGrey}=surfaces[lo];
    const root=Math.sqrt(random()),v=random(),bary=[1-root,root*(1-v),root*v],p=new T.Vector3(),n=new T.Vector3(),color=new T.Color(0,0,0),bindings=new Map();
    ids.forEach((id,j)=>{const w=bary[j];p.addScaledVector(new T.Vector3().fromBufferAttribute(g.attributes.position,id),w);n.addScaledVector(new T.Vector3().fromBufferAttribute(g.attributes.normal,id),w);const c=isGrey?grey:new T.Color(g.attributes.color.getX(id),g.attributes.color.getY(id),g.attributes.color.getZ(id));color.r+=c.r*w;color.g+=c.g*w;color.b+=c.b*w;for(let k=0;k<4;k++){const wi=g.attributes.skinWeight.array[id*4+k]/255,bi=g.attributes.skinIndex.array[id*4+k];if(wi)bindings.set(bi,(bindings.get(bi)??0)+wi*w);}});n.normalize();
    const face=p.y>.76&&p.y<1.12&&p.z>.23,length=(.005+random()*.008)*(face?.50:1),tangent=new T.Vector3(random()-.5,random()-.5,random()-.5).cross(n).normalize(),width=(.00012+random()*.00015)*(face?.7:1),base=p.clone().addScaledVector(n,-.0007);
    const flow=new T.Vector3(p.x*.18,-.55,.10);flow.addScaledVector(n,-flow.dot(n)).normalize();
    const tip=p.clone().addScaledVector(n,length*.65).addScaledVector(flow,length*.65);
    const pairs=[...bindings].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=pairs.reduce((s,[,w])=>s+w,0),indices=[],weights=[];let remaining=255;
    pairs.forEach(([bi,w],j)=>{const wi=j===pairs.length-1?remaining:Math.min(remaining,Math.round(w/sum*255));indices.push(wi?bi:0);weights.push(wi);remaining-=wi;});while(indices.length<4){indices.push(0);weights.push(0);}
    [base.clone().addScaledVector(tangent,-width),base.clone().addScaledVector(tangent,width),tip].forEach((point,j)=>{hp.push(...point.toArray());hn.push(...n.toArray());const c=color.clone().multiplyScalar(.975+random()*.025);hc.push(c.r,c.g,c.b);hu.push(.5+j*.25,j===2?1:0);hi.push(...indices);hw.push(...weights);hairIndices.push(hairIndices.length);});
  }
  const hairs=new T.BufferGeometry();hairs.setAttribute('position',new T.Float32BufferAttribute(hp,3));hairs.setAttribute('normal',new T.Float32BufferAttribute(hn,3));hairs.setAttribute('color',new T.Float32BufferAttribute(hc,3));hairs.setAttribute('uv',new T.Float32BufferAttribute(hu,2));hairs.setAttribute('skinIndex',new T.Uint8BufferAttribute(hi,4));hairs.setAttribute('skinWeight',new T.Uint8BufferAttribute(hw,4,true));hairs.setIndex(hairIndices);
  const ordered=pieces.map((g,i)=>({g,material:pieceMaterials[i]})).sort((a,b)=>a.material-b.material),merged=mergeGeometries(ordered.map(p=>p.g),true),groups=[];
  merged.groups.forEach((g,i)=>{const materialIndex=ordered[i].material,last=groups.at(-1);if(last?.materialIndex===materialIndex)last.count+=g.count;else groups.push({...g,materialIndex});});merged.clearGroups();groups.forEach(g=>merged.addGroup(g.start,g.count,g.materialIndex));
  for(const geometry of [merged,hairs]){const c=geometry.attributes.color;geometry.setAttribute('color',new T.Uint8BufferAttribute(Array.from(c.array,v=>Math.round(clamp(v,0,1)*255)),3,true));}
  const cat=new T.SkinnedMesh(merged,materials);cat.name='KittenMesh';scene.add(cat);cat.add(lookup.Root);scene.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);cat.bind(skeleton);cat.frustumCulled=false;
  const fur=new T.SkinnedMesh(hairs,materials[10]);fur.name='KittenFur';scene.add(fur);fur.bind(skeleton);fur.frustumCulled=false;
  return {merged,hairs};
}
