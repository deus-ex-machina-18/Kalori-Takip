import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const server=spawn('npm',['run','preview','--','--port','4175'],{stdio:'ignore'});let browser;
try {
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:4175')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:900,height:900},deviceScaleFactor:2,reducedMotion:'reduce'});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE.WebGLProgram|shader error/i.test(m.text()))errors.push(m.text());});
  await page.goto('http://127.0.0.1:4175/#/bugun');await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
  if(errors.length)throw Error(errors.join('\n'));
  await mkdir('artifacts',{recursive:true});await page.locator('.cat-viewport').screenshot({path:'artifacts/r4-render.png'});
  await copyFile('artifacts/r4-render.png','public/models/cat-poster.png');
  const metrics=await page.locator('.cat-card').evaluate(el=>({...el.dataset}));await writeFile('artifacts/r4-render-metrics.json',JSON.stringify({metrics,errors},null,2));console.log(metrics);
}finally{await browser?.close();server.kill('SIGTERM');}
