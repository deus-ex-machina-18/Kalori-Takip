import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

export async function checkCatMedia(page, checks) {
  const requests = [];
  page.on('request', request => { if (/\/cat-media\//.test(request.url())) requests.push(request.url()); });
  await page.setViewportSize({width:390,height:850});
  await page.goto('http://127.0.0.1:4173/#/ayarlar'); await page.locator('main[data-ready="true"]').waitFor();
  await page.locator('#cat-name').fill('Duman'); await page.locator('#motion').check();
  await page.evaluate(()=>{const original=IDBDatabase.prototype.transaction;let fail=true;IDBDatabase.prototype.transaction=function(stores,mode,...args){if(fail&&mode==='readwrite'&&[...stores].includes('catPreferences')){fail=false;throw new DOMException('quota','QuotaExceededError');}return original.call(this,stores,mode,...args);};});
  await page.locator('#cat-settings-form button[type="submit"]').click(); await page.locator('[data-action="retry"]').waitFor();
  assert.equal(await page.locator('#cat-name').inputValue(),'Duman');
  await page.locator('[data-action="retry"]').click(); await page.locator('main[aria-busy="false"]').waitFor();
  await page.reload(); await page.locator('main[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#cat-name').inputValue(),'Duman'); assert.equal(await page.locator('#motion').isChecked(),true);
  requests.length=0;
  await page.locator('nav a[href="#/bugun"]').click(); await page.locator('.cat-card[data-scene-status="static"]').waitFor();
  assert.equal(await page.locator('#cat-heading').textContent(),'Duman');
  assert.equal(await page.locator('.cat-card video').count(),0); assert.equal(requests.some(url=>url.endsWith('.mp4')),false);
  assert.equal(await page.locator('[data-cat-action]:enabled').count(),0);
  await page.screenshot({path:'browser-results/r4-video-mobile-390.png',fullPage:true});

  // Isolated browser fixture, not a production threshold: same example as the acceptance table.
  await page.evaluate(()=>new Promise((resolve,reject)=>{
    const open=indexedDB.open('kedi-kalori-v1',1); open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const db=open.result,tx=db.transaction('plans','readwrite'),store=tx.objectStore('plans');
      const read=store.getAll(); read.onsuccess=()=>{for(const plan of read.result)store.put({...plan,goal:'lose',targetWeightKg:80,estimatedMaintenanceKcal:2700,calorieRangeKcal:{min:2200,max:2400}});};
      tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);
    };
  }));
  await page.locator('nav a[href="#/ayarlar"]').click(); await page.locator('#motion').uncheck();
  await page.locator('#cat-settings-form button[type="submit"]').click(); await page.locator('main[aria-busy="false"]').waitFor();
  await page.reload(); await page.locator('main[data-ready="true"]').waitFor();
  requests.length=0;
  await page.locator('nav a[href="#/bugun"]').click(); await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.cat-video')?.currentTime>0);
  assert.equal(requests.filter(url=>/\/(target-met|above-target|above-maintenance|below-target|touch|play|stretch|sleep)\.mp4/.test(url)).length,0);
  assert.equal(await page.locator('.cat-card canvas').count(),0);
  assert.equal(await page.locator('[data-cat-action]').count(),4);
  await page.locator('.cat-card[data-action-state="ready"]').waitFor();
  const dataSnapshot = () => page.evaluate(()=>new Promise((resolve,reject)=>{
    const open=indexedDB.open('kedi-kalori-v1',1);open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const db=open.result,names=[...db.objectStoreNames],tx=db.transaction(names,'readonly'),data={};
      for(const name of names){const request=tx.objectStore(name).getAll();request.onsuccess=()=>{data[name]=request.result;};}
      tx.oncomplete=()=>{db.close();resolve(JSON.stringify(data));};tx.onabort=()=>reject(tx.error);
    };
  }));
  const beforeActions=await dataSnapshot();
  const initialMessage=await page.locator('.cat-message').textContent();
  const actionMetrics=[];
  for(const action of ['touch','play','stretch','sleep']) {
    requests.length=0;
    await page.locator(`[data-cat-action="${action}"]`).click();
    await page.waitForFunction(clip=>document.querySelector('.cat-card')?.dataset.clip===clip,action);
    assert.equal(await page.locator('[data-cat-action]:enabled').count(),0,'no interruption or queued taps');
    await page.locator('[data-cat-action="touch"]').evaluate(button=>button.click());
    await page.waitForFunction(()=>{const v=document.querySelectorAll('.cat-video')[1];return v?.currentTime>.5&&!v.paused;});
    const metric=await page.locator('.cat-video').nth(1).evaluate(v=>({currentTime:v.currentTime,videoWidth:v.videoWidth,videoHeight:v.videoHeight}));
    assert.equal(metric.videoWidth,640);assert.equal(metric.videoHeight,640);
    await page.screenshot({path:`browser-results/zilli-action-${action}-390.png`,fullPage:true});
    await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.actionState==='ready');
    assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'idle');
    await page.waitForFunction(()=>{const v=document.querySelector('.cat-video');return v?.currentTime>.2&&!v.paused;});
    assert.equal(await page.locator('.cat-message').textContent(),initialMessage);
    assert.equal(await page.locator('.cat-video').nth(1).getAttribute('src'),null);
    const loadedActions=[...new Set(requests.filter(url=>/\/(touch|play|stretch|sleep)\.mp4/.test(url)))];
    assert.equal(loadedActions.length,1,'one selected action only, allowing media range requests');
    assert.ok(loadedActions[0].endsWith(`/${action}.mp4`));
    actionMetrics.push({action,...metric});
  }
  assert.equal(await dataSnapshot(),beforeActions,'cat interactions do not write calorie/profile/plan data');
  // Keyboard activation, navigation during a clip, and reload never replay an action.
  await page.locator('[data-cat-action="touch"]').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.clip==='touch');
  await page.locator('nav a[href="#/kayitlar"]').click();requests.length=0;
  await page.locator('nav a[href="#/bugun"]').click();await page.locator('.cat-card[data-action-state="ready"]').waitFor();
  assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'idle');
  assert.equal(requests.some(url=>/\/(touch|play|stretch|sleep)\.mp4/.test(url)),false);
  await page.locator('[data-cat-action="play"]').click();
  await page.reload();requests.length=0;await page.locator('.cat-card[data-action-state="ready"]').waitFor();
  assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'idle');
  assert.equal(requests.some(url=>/\/(touch|play|stretch|sleep)\.mp4/.test(url)),false);
  // An interaction also pauses in a hidden document and resumes the same clip.
  await page.locator('[data-cat-action="sleep"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.cat-video')[1]?.currentTime>.3);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenActionTime=await page.locator('.cat-video').nth(1).evaluate(v=>v.currentTime);
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.cat-video').nth(1).evaluate(v=>v.currentTime),hiddenActionTime);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.locator('.cat-card[data-action-state="ready"]').waitFor();
  // A missing new clip falls back safely; a page reload can recover.
  await page.route('**/cat-media/stretch.mp4',route=>route.fulfill({status:404,body:'missing'}));
  await page.locator('[data-cat-action="stretch"]').click();await page.locator('.cat-card[data-scene-status="static"]').waitFor();
  assert.equal(await page.locator('[data-cat-action]:enabled').count(),0);
  assert.equal(await page.locator('#calorie-form button').isEnabled(),true);
  await page.unroute('**/cat-media/stretch.mp4');
  await page.reload();await page.locator('.cat-card[data-action-state="ready"]').waitFor();
  checks.push('Zilli interactions: four decoded clips, end returns to playing idle, lazy one-clip loads, no interrupt/queue, keyboard, no data writes, hidden pause/resume, no navigation/reload replay, missing clip fallback: pass');
  const ready = async()=>{await page.locator('main[aria-busy="false"]').waitFor();};
  const record = async kcal=>{await page.locator('.calorie-details').evaluate(el=>el.open=true);await page.locator('#kcal').fill(String(kcal));await page.locator('#calorie-form button').click();await ready();};
  const finish = async()=>{await page.locator('.complete-day').click();await ready();};
  await record(800); assert.equal(await page.locator('.cat-card').getAttribute('data-result'),'idle');
  const outcomes = [];
  for(const [kcal,clip] of [[1900,'below-target'],[2200,'target-met'],[2300,'target-met'],[2400,'target-met'],[2401,'above-target'],[2550,'above-target'],[2700,'above-maintenance'],[3000,'above-maintenance']]) {
    await record(kcal); await finish();
    assert.equal(await page.locator('.cat-card').getAttribute('data-result'),clip);
    assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),clip);
    assert.equal(await page.locator('[data-cat-action]:enabled').count(),0,'calorie result has priority');
    await page.waitForFunction(()=>{const v=document.querySelectorAll('.cat-video')[1];return v?.currentTime>.5&&!v.paused;});
    const message=await page.locator('.cat-message').textContent();
    await page.screenshot({path:`browser-results/r4-reaction-${kcal}.png`,fullPage:true});
    await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.clip==='idle');
    assert.equal(await page.locator('.cat-message').textContent(),message);
    await page.waitForFunction(()=>{const v=document.querySelector('.cat-video');return v?.currentTime>.2&&!v.paused;});
    await page.reload(); await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
    assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'idle');
    assert.equal(await page.locator('.cat-message').textContent(),message);
    await page.locator('nav a[href="#/kayitlar"]').click(); await page.locator('nav a[href="#/bugun"]').click();
    await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
    assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'idle');
    outcomes.push({kcal,clip,message});
  }
  // Failed completion cannot celebrate; retry of the saved operation triggers once.
  await record(2300);
  await page.evaluate(()=>{const original=IDBDatabase.prototype.transaction;let fail=true;IDBDatabase.prototype.transaction=function(stores,mode,...args){if(fail&&mode==='readwrite'&&[...stores].includes('days')){fail=false;throw new DOMException('quota','QuotaExceededError');}return original.call(this,stores,mode,...args);};});
  await page.locator('.complete-day').click(); await page.locator('[data-action="retry"]').waitFor();
  assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'idle');
  await page.locator('[data-action="retry"]').click();await ready();
  assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'target-met');
  await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.clip==='idle');
  // Actual IntersectionObserver pause/resume; visibilitychange uses the same lifecycle.
  await page.setViewportSize({width:390,height:350}); await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
  await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.animating==='false');
  const pausedTime=await page.locator('.cat-video').first().evaluate(v=>v.currentTime);
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.cat-video').first().evaluate(v=>v.currentTime),pausedTime);
  await page.locator('.cat-viewport').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.animating==='true');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.locator('.cat-video').first().evaluate(v=>v.paused),true);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.animating==='true');
  // Full-size square with object-fit contain, and actual decoded 640px videos.
  const metrics=[];
  for(const width of [320,360,390,768,1280]) {
    await page.setViewportSize({width,height:850});await page.reload();await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const metric=await page.locator('.cat-viewport').evaluate(el=>{const box=el.getBoundingClientRect(),v=el.querySelector('video');return {width:box.width,height:box.height,fit:getComputedStyle(v).objectFit,videoWidth:v.videoWidth,videoHeight:v.videoHeight};});
    assert.equal(metric.width,metric.height);assert.equal(metric.fit,'contain');assert.equal(metric.videoWidth,640);assert.equal(metric.videoHeight,640);metrics.push({viewport:width,...metric});
    await page.screenshot({path:`browser-results/r4-video-ready-${width}.png`,fullPage:true});
  }
  // Asset failure and autoplay rejection retain the poster and independent form.
  await page.route('**/cat-media/idle.mp4',route=>route.fulfill({status:404,body:'missing'}));
  await page.reload();await page.locator('.cat-card[data-scene-status="static"]').waitFor();
  assert.equal(await page.locator('#calorie-form button').isEnabled(),true);
  await page.screenshot({path:'browser-results/r4-video-error.png',fullPage:true});
  await page.unroute('**/cat-media/idle.mp4');
  await page.route('**/cat-media/above-maintenance.mp4',route=>route.fulfill({status:404,body:'missing'}));
  await page.reload();await record(3000);await finish();await page.locator('.cat-card[data-scene-status="static"]').waitFor();
  assert.equal(await page.locator('#calorie-form button').isEnabled(),true);assert.match(await page.locator('.cat-message').textContent(),/\+300/);
  await page.unroute('**/cat-media/above-maintenance.mp4');
  await page.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('blocked','NotAllowedError'));});
  await page.reload();await page.locator('.cat-card[data-scene-status="static"]').waitFor();assert.equal(await page.locator('#calorie-form button').isEnabled(),true);
  // Persisted static mode and reduced motion must request no MP4 even on completion.
  await page.locator('nav a[href="#/ayarlar"]').click();await page.locator('#static-mode').check();await page.locator('#motion').check();
  await page.locator('#cat-settings-form button[type="submit"]').click();await ready();await page.reload();await page.locator('main[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#scene-mode').inputValue(),'static');assert.equal(await page.locator('#motion').isChecked(),true);
  requests.length=0;await page.locator('nav a[href="#/bugun"]').click();await record(1900);await finish();
  assert.equal(await page.locator('.cat-card').getAttribute('data-scene-status'),'static');assert.equal(requests.some(url=>url.endsWith('.mp4')),false);
  assert.equal(await page.locator('[data-cat-action]:enabled').count(),0);
  await writeFile('browser-results/r4-video-metrics.json',JSON.stringify({actionMetrics,outcomes,metrics,environment:'Chromium, desktop runner with mobile viewport; not physical Android',decodedFrameRgbaBytes:640*640*4,maximumMountedVideos:2},null,2));
  checks.push('R4 video: eight calorie/boundary cases, partial idle, successful completion/retry only, actual MP4 decode/end/idle, persistent label, no replay on reload/navigation, visibility pause, five widths contain, static/reduced no MP4, idle/reaction 404 and autoplay fallback preserve form: pass');
}
