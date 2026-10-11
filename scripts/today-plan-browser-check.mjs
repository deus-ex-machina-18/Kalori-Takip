import assert from 'node:assert/strict';

export async function checkTodayPlanFixes(browser, checks) {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 850 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const ready = () => page.locator('main[data-ready="true"]').waitFor();
  try {
    await page.goto('http://127.0.0.1:4173/#/planim'); await ready();
    await page.locator('#birth-date').fill('2000-08-21'); await page.locator('#height-cm').fill('180');
    await page.locator('#profile-weight').fill('91'); await page.locator('#formula-sex').selectOption('male');
    await page.locator('#pal').selectOption('1.4'); await page.locator('#time-zone').fill('Europe/Istanbul');
    assert.equal(await page.locator('#target-weeks').isVisible(), false);
    await page.locator('#goal').selectOption('lose'); await page.locator('#target-weight').fill('80');
    await page.locator('#target-weeks').fill('8'); await page.locator('[name="eligibility"][value="eligible"]').check();
    await page.locator('#profile-form button[type="submit"]').click();
    await page.locator('.preview-card').waitFor();
    assert.match(await page.locator('.plan-timeline').textContent(), /8 hafta/);
    assert.match(await page.locator('.plan-timeline').textContent(), /daha uzun süre/i);
    await page.locator('[data-action="cancel-profile"]').click();
    assert.equal(await page.locator('#target-weeks').inputValue(), '8');
    await page.locator('#target-weeks').fill('40');
    await page.locator('#profile-form button[type="submit"]').click();
    assert.match(await page.locator('.plan-timeline').textContent(), /40 hafta/);
    await page.locator('[data-action="save-profile"]').click();
    await page.locator('.plan-summary').waitFor(); await page.locator('main[aria-busy="false"]').waitFor();
    await page.reload(); await ready(); assert.match(await page.locator('.plan-timeline').textContent(), /40 hafta/);
    await page.screenshot({ path: 'browser-results/duration-plan-390.png', fullPage: true });

    await page.locator('nav a[href="#/bugun"]').click(); await ready();
    await page.locator('.calorie-details summary').click(); await page.locator('#kcal').fill('2600');
    await page.locator('#calorie-form button[type="submit"]').click();
    await page.locator('.activity-equivalent').waitFor();
    assert.match(await page.locator('.activity-equivalent').textContent(), /Geçici toplam/);
    assert.match(await page.locator('.activity-equivalent').textContent(), /Koruma ihtiyacının üzerinde değilsin/);
    assert.equal(await page.locator('.activity-equivalent > .link-row').count(), 3);
    await page.locator('.complete-day').click(); await page.locator('main[aria-busy="false"]').waitFor();
    assert.doesNotMatch(await page.locator('.activity-equivalent').textContent(), /Geçici toplam/);
    for (const width of [320, 360, 390, 460, 768]) {
      await page.setViewportSize({ width, height: 850 });
      await page.evaluate(() => scrollTo(0, 0));
      const metrics = await page.evaluate(() => {
        const scene = document.querySelector('.cat-viewport').getBoundingClientRect();
        const main = document.querySelector('main').getBoundingClientRect();
        const setting = document.querySelector('.settings-link').getBoundingClientRect();
        const icon = document.querySelector('.settings-link .icon').getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > innerWidth,
          sceneRatio: scene.width / main.width,
          heading: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
          catHeading: parseFloat(getComputedStyle(document.querySelector('#cat-heading')).fontSize),
          opacity: getComputedStyle(document.querySelector('.cat-viewport')).opacity,
          centered: Math.abs((setting.left + setting.right) / 2 - (icon.left + icon.right) / 2) < 1 && Math.abs((setting.top + setting.bottom) / 2 - (icon.top + icon.bottom) / 2) < 1,
          iconInside: icon.left >= setting.left + 8 && icon.right <= setting.right - 8,
          background: getComputedStyle(document.querySelector('.app-shell')).backgroundRepeat,
        };
      });
      assert.equal(metrics.overflow, false); assert.ok(metrics.sceneRatio >= 0.95);
      assert.ok(metrics.heading <= 28); assert.ok(metrics.catHeading <= 18);
      assert.equal(metrics.opacity, '1'); assert.equal(metrics.centered, true); assert.equal(metrics.iconInside, true);
      assert.equal(metrics.background.split(',').at(-1).trim(), 'no-repeat');
      await page.screenshot({ path: `browser-results/today-fixed-${width}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 850 });
    if (!await page.locator('.calorie-details').evaluate(el => el.open)) await page.locator('.calorie-details summary').click();
    await page.locator('#kcal').fill('2900');
    await page.locator('#calorie-form button[type="submit"]').click();
    await page.locator('.maintenance-equivalent').waitFor();
    await page.locator('.maintenance-equivalent summary').click();
    assert.equal(await page.locator('.maintenance-equivalent .link-row').count(), 3);
    await page.screenshot({ path: 'browser-results/activity-equivalents-390.png', fullPage: true });
    assert.deepEqual(errors, []);
    checks.push('Today fixes: opaque video, enlarged scene, compact headings, centered settings and seamless background at five widths; duration cap/preview/back/save/reload; provisional and completed activity equivalents and separate maintenance basis: pass');
  } finally { await context.close(); }
}
