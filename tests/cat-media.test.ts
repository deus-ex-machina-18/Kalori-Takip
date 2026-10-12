import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCatMediaSelector } from '../src/ui/cat-media.ts';

test('08 and 09 rotate within their own result, preserving 06 and the stop-paw clip', () => {
  const select = createCatMediaSelector();
  assert.equal(select('below-target'), 'below-target.mp4');
  assert.equal(select('above-maintenance'), 'above-maintenance.mp4');
  assert.equal(select('below-target'), 'below-target-alt.mp4');
  assert.equal(select('above-maintenance'), 'above-maintenance-alt.mp4');
  assert.equal(select('below-target'), 'below-target.mp4');
  assert.equal(select('above-maintenance'), 'above-maintenance.mp4');
});

test('other results and actions keep their media, and a new session starts fresh', () => {
  const select = createCatMediaSelector();
  for (const clip of ['idle','target-met','above-target','touch','play','stretch','sleep'] as const) {
    assert.equal(select(clip), `${clip}.mp4`);
    assert.equal(select(clip), `${clip}.mp4`);
  }
  select('below-target');
  assert.equal(select('below-target'), 'below-target-alt.mp4');
  assert.equal(createCatMediaSelector()('below-target'), 'below-target.mp4');
});
