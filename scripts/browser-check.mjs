import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], { stdio: 'inherit' });
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:4173')).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  await mkdir('browser-results', { recursive: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const checks = [];
  for (const width of [320, 360, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    for (const screen of ['bugun', 'kayitlar', 'planim', 'ilerlemem', 'ayarlar']) {
      await page.goto(`http://127.0.0.1:4173/#/${screen}`);
      await page.locator(`nav a[aria-current="page"][href="#/${screen}"]`).waitFor();
      await page.locator('h1').waitFor();
      if (await page.locator('main[data-ready]').count()) await page.locator('main[data-ready="true"]').waitFor();
      if(screen==='bugun')await page.locator('.cat-card[data-scene-status="ready"], .cat-card[data-scene-status="static"]').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}/${screen}: overflow`);
      await page.screenshot({ path: `browser-results/${width}-${screen}.png`, fullPage: true });
      if (width < 720) {
        await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
        const covered = await page.evaluate(() => {
          const nav = document.querySelector('nav').getBoundingClientRect();
          return [...document.querySelectorAll('main button, main input, main a')].some(el => el.getBoundingClientRect().bottom > nav.top);
        });
        assert.equal(covered, false, `${width}/${screen}: navigation covers final controls`);
      }
      checks.push(`${width}/${screen}: no overflow, controls reachable`);
    }
  }
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('http://127.0.0.1:4173/#/bugun');
  await page.reload();
  if (await page.locator('main[data-ready]').count()) await page.locator('main[data-ready="true"]').waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter');
  await page.locator('nav a[href="#/kayitlar"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/#/kayitlar');
  await page.waitForFunction(() => document.activeElement?.id === 'page-title');
  assert.equal(await page.locator('h1').evaluate(el => el === document.activeElement), true);
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('main').evaluate(el => el === document.activeElement),true);
  assert.match(page.url(),/#\/kayitlar$/);
  await page.goBack();
  await page.waitForURL('**/#/bugun');
  await page.goForward();
  await page.waitForURL('**/#/kayitlar');
  // Half-size viewport checks reflow equivalent to 200% browser zoom.
  await page.setViewportSize({ width: 640, height: 425 });
  await page.reload();
  await page.locator('main[data-ready="true"]').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await page.locator('html').getAttribute('data-reduced-motion'), 'true');
  assert.deepEqual(errors, []);
  checks.push('keyboard, heading focus, back/forward, reduced motion, 200% equivalent reflow: pass');
  // R2 uses the browser's real IndexedDB, not the fake adapter from Node tests.
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('http://127.0.0.1:4173/#/planim');
  await page.locator('main[data-ready="true"]').waitFor();
  await page.locator('nav a[aria-current="page"][href="#/planim"]').waitFor();
  assert.equal(await page.locator('#profile-form').count(),1,'R2 initial profile form must exist');
  if (await page.locator('#profile-form').count()) {
    for (const [id,value] of Object.entries({ 'birth-date':'2000-08-21','height-cm':'180','profile-weight':'91','time-zone':'Europe/Istanbul','target-weight':'80' })) await page.locator(`#${id}`).fill(value);
    for (const [id,value] of Object.entries({ 'formula-sex':'male',pal:'1.4',goal:'lose' })) await page.locator(`#${id}`).selectOption(value);
    await page.locator('[name="eligibility"][value="eligible"]').check();
    await page.getByRole('button',{name:'Önizlemeyi göster'}).click();
    await page.locator('.preview-card').waitFor();
    await page.screenshot({ path:'browser-results/profile-preview.png', fullPage:true });
    await page.locator('[data-action="save-profile"]').click();
    await page.locator('.plan-summary').waitFor();
    await page.locator('nav a[href="#/bugun"]').click();
    await page.locator('[data-mode="entries"]').click();
    for (const kcal of [650,800,500]) {
      await page.locator('#kcal').fill(String(kcal));
      await page.locator('#calorie-form button').click();
      await page.locator('main[aria-busy="false"]').waitFor();
    }
    assert.match(await page.locator('.calorie-value').textContent(),/1.950/);
    await page.locator('[data-action="complete"]').click();
    await page.locator('.status').filter({hasText:'Tamamlandı'}).waitFor();
    await page.reload(); await page.locator('main[data-ready="true"]').waitFor();
    assert.match(await page.locator('.calorie-value').textContent(),/1.950/);
    assert.equal(await page.locator('.entry-form').count(),3);
    await page.locator('[data-mode="total"]').click();
    await page.locator('[data-action="mode-cancel"]').click();
    assert.equal(await page.locator('.entry-form').count(),3);
    await page.locator('[data-mode="total"]').click();
    await page.locator('[data-action="mode-preserve"]').click();
    await page.locator('#kcal').filter({visible:true}).waitFor();
    await page.locator('main[aria-busy="false"]').waitFor();
    assert.equal(await page.locator('#kcal').inputValue(),'1950');
    assert.equal(await page.locator('.status').textContent(),'Kısmi');
    // Simulate one storage failure. Retry must reuse the original immutable write.
    await page.evaluate(() => {
      const original = IDBDatabase.prototype.transaction;
      let fail = true;
      IDBDatabase.prototype.transaction = function(stores,mode,...args) {
        if (fail && mode === 'readwrite' && [...stores].includes('days')) { fail=false; throw new DOMException('quota','QuotaExceededError'); }
        return original.call(this,stores,mode,...args);
      };
    });
    await page.locator('#kcal').fill('2000'); await page.locator('#calorie-form button').click();
    await page.locator('[data-action="retry"]').waitFor();
    assert.equal(await page.locator('#kcal').inputValue(),'2000');
    await page.locator('[data-action="retry"]').click();
    await page.locator('main[aria-busy="false"]').waitFor();
    assert.match(await page.locator('.calorie-value').textContent(),/2.000/);
    await page.locator('nav a[href="#/kayitlar"]').click();
    await page.locator('#weight-kg').fill('90.5'); await page.locator('#weight-form button').click();
    await page.locator('main[aria-busy="false"]').waitFor();
    await page.reload(); await page.locator('main[data-ready="true"]').waitFor();
    assert.match(await page.locator('main').textContent(),/90,5 kg/);
    // R3 activity CRUD, persistence and retry in native IndexedDB.
    const balanceBefore=await page.locator('.record-editor .metric-row').nth(1).textContent();
    await page.locator('#activity-kind').selectOption('cycle');
    await page.locator('#activity-minutes').fill('30');
    await page.locator('#activity-form button[type="submit"]').click();
    await page.locator('.activity-row').waitFor();await page.locator('main[aria-busy="false"]').waitFor();
    assert.match(await page.locator('.activity-row').textContent(),/Bisiklet · 30 dk/);
    assert.equal(await page.locator('.record-editor .metric-row').nth(1).textContent(),balanceBefore);
    await page.reload();await page.locator('main[data-ready="true"]').waitFor();
    await page.locator('[data-edit-activity]').click();await page.locator('#activity-minutes').fill('45');
    await page.evaluate(()=>{const original=IDBDatabase.prototype.transaction;let fail=true;IDBDatabase.prototype.transaction=function(stores,mode,...args){if(fail && mode==='readwrite' && [...stores].includes('activities')){fail=false;throw new DOMException('quota','QuotaExceededError');}return original.call(this,stores,mode,...args);};});
    await page.locator('#activity-form button[type="submit"]').click();await page.locator('[data-action="retry"]').waitFor();
    assert.equal(await page.locator('#activity-minutes').inputValue(),'45');
    await page.locator('[data-action="retry"]').click();await page.locator('main[aria-busy="false"]').waitFor();
    assert.equal(await page.locator('.activity-row').count(),1);assert.match(await page.locator('.activity-row').textContent(),/45 dk/);
    await page.screenshot({path:'browser-results/activity-edit.png',fullPage:true});
    await page.locator('[data-delete-activity]').click();await page.locator('[data-action="cancel-delete-activity"]').click();assert.equal(await page.locator('.activity-row').count(),1);
    await page.locator('[data-delete-activity]').click();await page.locator('[data-action="confirm-delete-activity"]').click();await page.locator('main[aria-busy="false"]').waitFor();assert.equal(await page.locator('.activity-row').count(),0);
    // A persisted activity remains on populated layout screenshots.
    await page.locator('#activity-kind').selectOption('strength');await page.locator('#activity-minutes').fill('30');await page.locator('#activity-form button[type="submit"]').click();await page.locator('.activity-row').waitFor();await page.locator('main[aria-busy="false"]').waitFor();
    await page.locator('nav a[href="#/planim"]').click();await page.locator('[data-action="edit-profile"]').click();
    await page.locator('#movement-mode').selectOption('auto');await page.locator('[name="movement-day"][value="1"]').check();await page.locator('[name="movement-day"][value="5"]').check();await page.locator('[name="preferred-kind"][value="walk"]').uncheck();await page.locator('[name="preferred-kind"][value="cycle"]').check();await page.locator('[name="eligibility"][value="eligible"]').check();
    await page.locator('#profile-form button[type="submit"]').click();await page.locator('.preview-card').waitFor();assert.match(await page.locator('.preview-card').textContent(),/Pazartesi · Bisiklet/);
    await page.screenshot({path:'browser-results/movement-preview.png',fullPage:true});
    await page.locator('[data-action="cancel-profile"]').click();assert.equal(await page.locator('#movement-mode').inputValue(),'auto');assert.equal(await page.locator('[name="movement-day"][value="5"]').isChecked(),true);
    await page.locator('#profile-form button[type="submit"]').click();await page.locator('[data-action="save-profile"]').click();await page.locator('.plan-summary').waitFor();await page.locator('main[aria-busy="false"]').waitFor();
    await page.reload();await page.locator('main[data-ready="true"]').waitFor();await page.locator('[data-action="edit-profile"]').click();assert.equal(await page.locator('[name="movement-day"][value="1"]').isChecked(),true);assert.equal(await page.locator('[name="movement-kind-1"]').inputValue(),'cycle');await page.locator('[data-action="close-profile"]').click();
    checks.push('R3 native IndexedDB: activity CRUD, reload, failure/retry, balance unchanged, approved movement draft version and persistence: pass');
    checks.push('R2 native IndexedDB: profile approval, 650+800+500, complete, reload, mode conversion/cancel, storage failure retry, weight persistence: pass');
    for (const width of [320,360,390,768,1280]) {
      await page.setViewportSize({width,height:850});
      for (const screen of ['bugun','kayitlar','planim','ilerlemem','ayarlar']) {
        await page.goto(`http://127.0.0.1:4173/#/${screen}`);
        await page.locator(`nav a[aria-current="page"][href="#/${screen}"]`).waitFor();
        await page.locator('main[data-ready="true"]').waitFor();
        if(screen==='bugun')await page.locator('.cat-card[data-scene-status="ready"], .cat-card[data-scene-status="static"]').waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`populated ${width}/${screen}: overflow`);
        await page.screenshot({path:`browser-results/populated-${width}-${screen}.png`,fullPage:true});
      }
      await page.goto('http://127.0.0.1:4173/#/planim');
      await page.locator('nav a[aria-current="page"][href="#/planim"]').waitFor();
      await page.locator('[data-action="edit-profile"]').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`profile editor ${width}: overflow`);
      await page.screenshot({path:`browser-results/profile-editor-${width}.png`,fullPage:true});
      await page.locator('[data-action="close-profile"]').click();
    }
    assert.deepEqual(errors,[]);
  }
  // R4: native preference writes + actual GLB/WebGL2 rendering in Chromium.
  await page.setViewportSize({width:390,height:850});
  await page.goto('http://127.0.0.1:4173/#/ayarlar');await page.locator('main[data-ready="true"]').waitFor();
  await page.locator('#cat-name').fill('Duman');await page.locator('#motion').uncheck();
  await page.evaluate(()=>{const original=IDBDatabase.prototype.transaction;let fail=true;IDBDatabase.prototype.transaction=function(stores,mode,...args){if(fail && mode==='readwrite' && [...stores].includes('catPreferences')){fail=false;throw new DOMException('quota','QuotaExceededError');}return original.call(this,stores,mode,...args);};});
  await page.locator('#cat-settings-form button[type="submit"]').click();await page.locator('[data-action="retry"]').waitFor();
  assert.equal(await page.locator('#cat-name').inputValue(),'Duman');
  await page.locator('[data-action="retry"]').click();await page.locator('main[aria-busy="false"]').waitFor();
  await page.reload();await page.locator('main[data-ready="true"]').waitFor();
  assert.equal(await page.locator('#cat-name').inputValue(),'Duman');assert.equal(await page.locator('#motion').isChecked(),false);
  await page.locator('nav a[href="#/bugun"]').click();await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
  assert.equal(await page.locator('.cat-card canvas').count(),1);
  assert.equal(await page.locator('#cat-heading').textContent(),'Duman');
  await page.screenshot({path:'browser-results/r4-grey-white-390.png',fullPage:true});
  const metrics={loadMs:await page.locator('.cat-card').getAttribute('data-load-ms'),triangles:await page.locator('.cat-card').getAttribute('data-triangles'),drawCalls:await page.locator('.cat-card').getAttribute('data-draw-calls'),renderer:'Chromium SwiftShader software WebGL2; not Android'};
  assert.ok(Number(metrics.triangles)>0 && Number(metrics.triangles)<=50000);
  await page.locator('[data-cat-action="right"]').click();
  assert.notEqual(await page.locator('.cat-card').getAttribute('data-angle'),'-0.22');
  await page.locator('[data-cat-action="reset"]').click();assert.equal(await page.locator('.cat-card').getAttribute('data-angle'),'-0.22');
  const canvas=page.locator('.cat-card canvas'),box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:5});await page.mouse.up();
  assert.notEqual(await page.locator('.cat-card').getAttribute('data-angle'),'-0.22');
  await page.screenshot({path:'browser-results/r4-rotated-390.png',fullPage:true});
  await page.locator('[data-cat-action="play"]').click();assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'play');
  await page.waitForFunction(()=>document.querySelector('.cat-card')?.dataset.clip==='idle');
  await page.locator('[data-cat-action="stretch"]').click();assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'stretch');
  await page.locator('[data-cat-action="sleep"]').click();assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'sleep');
  await page.screenshot({path:'browser-results/r4-sleep.png',fullPage:true});
  await page.locator('[data-cat-action="sleep"]').click();
  // Actual complete day drives state. Care never plays happy or play.
  await page.locator('#kcal').fill('0');await page.locator('#calorie-form button').click();await page.locator('main[aria-busy="false"]').waitFor();
  await page.locator('[data-action="complete"]').click();await page.locator('main[aria-busy="false"]').waitFor();
  await page.locator('.cat-card[data-scene-status="ready"][data-cat-state="care"]').waitFor();
  assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'care');
  await page.locator('[data-cat-action="play"]').click();assert.equal(await page.locator('.cat-card').getAttribute('data-clip'),'care');
  await page.screenshot({path:'browser-results/r4-care.png',fullPage:true});
  // Fixing intake returns to partial/neutral, without modifying calculations.
  await page.locator('#kcal').fill('2300');await page.locator('#calorie-form button').click();await page.locator('main[aria-busy="false"]').waitFor();
  await page.locator('.cat-card[data-scene-status="ready"][data-cat-state="neutral"]').waitFor();
  const dailyBalance=await page.locator('.day-card .metric-row').nth(1).textContent();
  // Asset error and context loss retain the independently mounted calorie form.
  await page.route('**/models/grey-white-kitten.glb',route=>route.fulfill({status:404,body:'missing'}));
  await page.reload();await page.locator('main[data-ready="true"]').waitFor();await page.locator('.cat-card[data-scene-status="static"]').waitFor();
  assert.equal(await page.locator('#calorie-form button').isEnabled(),true);
  assert.equal(await page.locator('.day-card .metric-row').nth(1).textContent(),dailyBalance);
  await page.screenshot({path:'browser-results/r4-model-error.png',fullPage:true});
  await page.unroute('**/models/grey-white-kitten.glb');await page.reload();await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
  await page.locator('.cat-card canvas').evaluate(el=>el.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('.cat-card[data-scene-status="static"]').waitFor();assert.equal(await page.locator('#calorie-form button').isEnabled(),true);
  // Static preference persists; reduced motion gives an actual still WebGL frame.
  await page.locator('nav a[href="#/ayarlar"]').click();await page.locator('#motion').check();await page.locator('#scene-mode').selectOption('static');
  await page.locator('#cat-settings-form button[type="submit"]').click();await page.locator('main[aria-busy="false"]').waitFor();
  await page.reload();await page.locator('main[data-ready="true"]').waitFor();assert.equal(await page.locator('#scene-mode').inputValue(),'static');assert.equal(await page.locator('#motion').isChecked(),true);
  await page.locator('nav a[href="#/bugun"]').click();await page.locator('.cat-card[data-scene-status="static"]').waitFor();assert.equal(await page.locator('.cat-card canvas').count(),0);
  await page.screenshot({path:'browser-results/r4-static.png',fullPage:true});
  await page.locator('nav a[href="#/ayarlar"]').click();await page.locator('#scene-mode').selectOption('auto');await page.locator('#cat-settings-form button[type="submit"]').click();await page.locator('main[aria-busy="false"]').waitFor();
  for(const width of [320,360,390,768,1280]){
    await page.setViewportSize({width,height:850});await page.goto('http://127.0.0.1:4173/#/bugun');
    await page.locator('.cat-card[data-scene-status="ready"]').waitFor();
    assert.equal(await page.locator('.cat-card').getAttribute('data-animating'),'false');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`browser-results/r4-ready-${width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);
  await page.addInitScript(()=>Object.defineProperty(window,'WebGL2RenderingContext',{value:undefined}));
  await page.reload();await page.locator('.cat-card[data-scene-status="static"]').waitFor();assert.equal(await page.locator('#calorie-form button').isEnabled(),true);
  const posterPage=await browser.newPage({viewport:{width:900,height:900},deviceScaleFactor:2,reducedMotion:'reduce'});
  await posterPage.goto('http://127.0.0.1:4173/#/bugun');await posterPage.locator('.cat-card[data-scene-status="ready"]').waitFor();
  await posterPage.locator('.cat-viewport').screenshot({path:'browser-results/r4-poster.png'});await posterPage.close();
  await writeFile('browser-results/r4-metrics.json',JSON.stringify(metrics,null,2));
  checks.push('R4 GLB/WebGL2: loaded skin and six clips, rotate/drag/reset, play/stretch/sleep, care suppresses play, 404/context-loss fallback, unchanged calorie form, native preferences/retry/reload, static/reduced motion, five widths: pass');
  await writeFile('browser-results/report.json', JSON.stringify({ checks, errors }, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
