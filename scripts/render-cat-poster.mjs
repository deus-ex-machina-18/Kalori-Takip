import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const server=spawn('npm',['run','preview','--','--port','4175'],{stdio:'ignore'});let browser;
try {
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4175')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1400,height:1100},deviceScaleFactor:2,reducedMotion:'reduce'});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|shader error/i.test(m.text()))errors.push(m.text());});
  await page.goto('http://127.0.0.1:4175/#/bugun');await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
  // The same live scene at a larger viewport gives the static fallback enough detail
  // for dense phone displays; interactive rendering retains its normal DPR limit.
  await page.addStyleTag({content:'.cat-card{width:640px;max-width:none}.cat-viewport{width:600px;max-width:none}'});
  await page.waitForFunction(()=>document.querySelector('.cat-canvas')?.width===900);
  if(errors.length)throw Error(errors.join('\n'));
  await mkdir('artifacts',{recursive:true});await page.locator('.cat-viewport').screenshot({path:'artifacts/r4-render.png'});
  await sharp('artifacts/r4-render.png').webp({quality:92,effort:5}).toFile('public/models/cat-poster.webp');
  await mkdir('docs/verification',{recursive:true});
  await copyFile('artifacts/r4-render.png','docs/verification/r4-live-render.png');
  const poster=await readFile('public/models/cat-poster.webp'),metadata=await sharp(poster).metadata();
  const manifest=JSON.parse(await readFile('public/models/asset-manifest.json','utf8'));
  manifest.poster={asset:'cat-poster.webp',bytes:poster.length,sha256:createHash('sha256').update(poster).digest('hex'),width:metadata.width,height:metadata.height,source:'same live GLB, scene and shaders; 600 CSS px, DPR cap 1.5; WebP encoding only'};
  manifest.initialBytes=manifest.bytes+manifest.runtimeTextures.reduce((sum,texture)=>sum+texture.bytes,0)+poster.length;
  await writeFile('public/models/asset-manifest.json',JSON.stringify(manifest,null,2)+'\n');
  const metrics=await page.locator('.cat-card').evaluate(el=>({...el.dataset}));await writeFile('artifacts/r4-render-metrics.json',JSON.stringify({metrics,errors},null,2));console.log(metrics);
}finally{await browser?.close();server.kill('SIGTERM');}
