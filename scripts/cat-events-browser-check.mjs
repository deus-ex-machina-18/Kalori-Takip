import assert from 'node:assert/strict';
import { CAT_EVENTS } from '../src/ui/cat-events.ts';

export async function checkCatEvents(browser, checks) {
  const context = await browser.newContext({ reducedMotion: 'no-preference', viewport: {width:390,height:850} });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4173/#/planim');
    await page.locator('#profile-form').waitFor();
    for (const [id,value] of [['birth-date','2000-08-21'],['height-cm','180'],['profile-weight','91'],['time-zone','Europe/Istanbul']]) await page.locator(`#${id}`).fill(value);
    await page.locator('#formula-sex').selectOption('male');
    await page.locator('#pal').selectOption('1.4');
    await page.locator('[name="eligibility"][value="eligible"]').check();
    await page.locator('#movement-mode').selectOption('manual');
    await page.locator('[name="movement-day"][value="1"]').check();
    await page.locator('[name="movement-minutes-1"]').fill('20');
    await page.locator('#profile-form button[type="submit"]').click();
    await page.locator('[data-action="save-profile"]').click();
    await page.locator('.plan-summary').waitFor();
    await page.locator('main[aria-busy="false"]').waitFor();
    await page.locator('nav a[href="#/bugun"]').click();
    await page.locator('[data-water]').first().click();
    await page.locator('[name="water-amount"]').fill('2500');
    await page.locator('#water-form button[type="submit"]').click();
    await page.locator('[data-cat-event="water-goal"] video[data-visible="true"]').waitFor();
    await page.locator('[data-cat-event]').waitFor({state:'detached'});
    await page.locator('[data-water]').first().click();
    await page.locator('#water-form button[type="submit"]').click();
    assert.equal(await page.locator('[data-cat-event]').count(),0);
    await page.locator('nav a[href="#/kayitlar"]').click();
    for (const event of ['sport-recorded','sport-goal']) {
      await page.locator('#activity-minutes').fill('10');
      await page.locator('#activity-form button[type="submit"]').click();
      await page.locator(`[data-cat-event="${event}"] video[data-visible="true"]`).waitFor();
      if(event==='sport-goal') await page.screenshot({path:'browser-results/zilli-sport-goal-390.png',fullPage:true});
      await page.locator('[data-cat-event]').waitFor({state:'detached'});
    }
    await page.reload();
    await page.locator('main[data-ready="true"]').waitFor();
    assert.equal(await page.locator('[data-cat-event]').count(),0);
    // All uploaded files are decoded to the actual end, including social clips.
    for (const {file} of Object.values(CAT_EVENTS)) {
      await page.evaluate(file => new Promise((resolve,reject) => {
        const video=document.createElement('video');
        video.muted=true; video.playsInline=true;
        video.addEventListener('error',()=>{video.remove();reject(new Error(`decode: ${file}`));},{once:true});
        video.addEventListener('ended',()=>{video.remove();resolve();},{once:true});
        document.body.append(video); video.src=`/cat-media/${file}`;
        video.play().catch(reject);
      }),file);
    }
    assert.deepEqual(errors,[]);
    checks.push('Zilli events: real water/save and sport record/goal clips, end cleanup, no water/reload replay, all seven uploads decoded to end: pass');
  } finally { await context.close(); }
}
