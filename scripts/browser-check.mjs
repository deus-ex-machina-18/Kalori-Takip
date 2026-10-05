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
  browser = await chromium.launch();
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
    checks.push('R2 native IndexedDB: profile approval, 650+800+500, complete, reload, mode conversion/cancel, storage failure retry, weight persistence: pass');
    for (const width of [320,360,390,768,1280]) {
      await page.setViewportSize({width,height:850});
      for (const screen of ['bugun','kayitlar','planim','ilerlemem','ayarlar']) {
        await page.goto(`http://127.0.0.1:4173/#/${screen}`);
        await page.locator(`nav a[aria-current="page"][href="#/${screen}"]`).waitFor();
        await page.locator('main[data-ready="true"]').waitFor();
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
  await writeFile('browser-results/report.json', JSON.stringify({ checks, errors }, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
