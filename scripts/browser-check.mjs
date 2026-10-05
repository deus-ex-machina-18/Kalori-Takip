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
      await page.locator('h1').waitFor();
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
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter');
  await page.locator('nav a[href="#/kayitlar"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForURL('**/#/kayitlar');
  assert.equal(await page.locator('h1').evaluate(el => el === document.activeElement), true);
  await page.goBack();
  await page.waitForURL('**/#/bugun');
  await page.goForward();
  await page.waitForURL('**/#/kayitlar');
  // Half-size viewport checks reflow equivalent to 200% browser zoom.
  await page.setViewportSize({ width: 640, height: 425 });
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await page.locator('html').getAttribute('data-reduced-motion'), 'true');
  assert.deepEqual(errors, []);
  checks.push('keyboard, heading focus, back/forward, reduced motion, 200% equivalent reflow: pass');
  await writeFile('browser-results/report.json', JSON.stringify({ checks, errors }, null, 2));
  console.log(checks.join('\n'));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
