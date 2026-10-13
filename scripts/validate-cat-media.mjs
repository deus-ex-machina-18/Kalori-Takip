import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = new URL('../public/cat-media/',import.meta.url);
const manifest = JSON.parse(await readFile(new URL('asset-manifest.json',base),'utf8'));
const actions = await import('../src/ui/cat-actions.ts');
const { CAT_REACTION_VARIANTS } = await import('../src/ui/cat-media.ts');
const { CAT_EVENTS } = await import('../src/ui/cat-events.ts');
const expected = new Set(['idle','target-met','above-target','above-maintenance','below-target',...actions.CAT_ACTIONS.map(action=>action.clip),...Object.values(CAT_REACTION_VARIANTS).flat(),...Object.values(CAT_EVENTS).map(event=>event.file.replace('.mp4',''))]);
assert.deepEqual(new Set(Object.keys(manifest.clips)), expected);
let total = 0;
for (const item of [...Object.values(manifest.clips),manifest.poster]) {
  const file = new URL(item.file,base), bytes = await readFile(file);
  assert.equal((await stat(file)).size,item.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
  assert.equal(item.width,640); assert.equal(item.height,640); total+=item.bytes;
  if(item.codec) {
    assert.equal(item.codec,'h264'); assert.equal(item.profile,'Constrained Baseline');
    assert.equal(item.pixelFormat,'yuv420p'); assert.equal(item.silent,true);
    assert.ok(item.durationSeconds>2 && item.durationSeconds<(item.file==='idle.mp4'?6:4));
    const atoms=[];
    for(let offset=0;offset<bytes.length;) {const size=bytes.readUInt32BE(offset);assert.ok(size>=8);atoms.push(bytes.toString('ascii',offset+4,offset+8));offset+=size;}
    assert.ok(atoms.indexOf('moov')>0 && atoms.indexOf('moov')<atoms.indexOf('mdat'),'MP4 fast start');
  }
}
assert.equal(total,manifest.totalBytes);assert.ok(manifest.initialBytes<5*1024*1024);
assert.equal(manifest.initialBytes,manifest.clips.idle.bytes+manifest.poster.bytes);
console.log(`${Object.keys(manifest.clips).length} verified MP4s + poster: ${total} bytes, initial ${manifest.initialBytes}, fast-start Baseline.`);
