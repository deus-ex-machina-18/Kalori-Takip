import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbRepository } from '../src/data/indexeddb.ts';
import { defaultCatPreferences, validateCatPreferences, CAT_PRESENTATION } from '../src/domain/cat.ts';
import { parseLocalDate } from '../src/domain/dates.ts';
import { changeDay, engine, newDay, nowUTC, requireValue, uuid } from '../src/domain/tracking.ts';
import type { Profile } from '../src/domain/models.ts';

async function fixture() {
  const factory=new IDBFactory(),name=uuid(),repository=new IndexedDbRepository(factory,name);
  const p:Profile={userId:uuid(),birthDate:parseLocalDate('2000-08-21'),heightCm:180,weightKg:91,formulaSex:'male',timeZone:'Europe/Istanbul',baseline:{method:'inclusive-pal-v1',pal:1.4,includesLoggedExercise:true},automaticPlanEligibility:'eligible',updatedAt:nowUTC()};
  requireValue(await repository.saveSetup({profile:p,plan:null,weight:null,expectedProfileUpdatedAt:null},{operationId:uuid()}));
  return {factory,name,repository,p};
}
test('kedi ayarları yeniden açılınca kalır; aynı retry yalnız bir makbuz kullanır',async()=>{
  const {factory,name,repository,p}=await fixture();
  const preferences={...defaultCatPreferences(p.userId,true),name:'Duman',sceneMode:'static' as const};
  const context={operationId:uuid(),expectedCatPreferences:null};
  const first=requireValue(await repository.saveCatPreferences(preferences,context));
  assert.deepEqual(requireValue(await repository.saveCatPreferences(structuredClone(preferences),context)),first);
  const bad=await repository.saveCatPreferences({...preferences,name:'Pamuk'},context);
  assert.ok(!bad.ok && bad.code==='conflict');
  await repository.close();const reopened=new IndexedDbRepository(factory,name);
  assert.deepEqual(requireValue(await reopened.getCatPreferences(p.userId)),preferences);await reopened.close();
});
test('iki sekmedeki kedi tercihi sessizce ezilmez',async()=>{
  const {factory,name,repository,p}=await fixture(),other=new IndexedDbRepository(factory,name);
  const previous=defaultCatPreferences(p.userId,false);
  requireValue(await repository.saveCatPreferences(previous,{operationId:uuid(),expectedCatPreferences:null}));
  const results=await Promise.all([
    repository.saveCatPreferences({...previous,name:'Duman'},{operationId:uuid(),expectedCatPreferences:previous}),
    other.saveCatPreferences({...previous,name:'Pamuk'},{operationId:uuid(),expectedCatPreferences:previous}),
  ]);
  assert.equal(results.filter(r=>r.ok).length,1);assert.equal(results.filter(r=>!r.ok && r.code==='conflict').length,1);
  await repository.close();await other.close();
});
test('geçersiz veya profilsiz kedi tercihi kaydedilmez',async()=>{
  const {repository,p}=await fixture(),value=defaultCatPreferences(p.userId,false);
  for(const name of ['', ' '.repeat(3), 'a'.repeat(31), 'a\u0001'])assert.throws(()=>validateCatPreferences({...value,name}));
  assert.equal((await repository.saveCatPreferences({...value,sceneMode:'bad'} as unknown as typeof value,{operationId:uuid(),expectedCatPreferences:null})).ok,false);
  const missing=await repository.saveCatPreferences({...value,userId:uuid()},{operationId:uuid(),expectedCatPreferences:null});
  assert.ok(!missing.ok && missing.code==='not-found');
  await repository.close();
});
test('care tüm kutlamaları bastırır; eksik ve plansız gün nötr kalır',()=>{
  const p:Profile={userId:uuid(),birthDate:parseLocalDate('2000-08-21'),heightCm:180,weightKg:91,formulaSex:'male',timeZone:'Europe/Istanbul',baseline:{method:'inclusive-pal-v1',pal:1.4,includesLoggedExercise:true},automaticPlanEligibility:'eligible',updatedAt:nowUTC()};
  const date=parseLocalDate('2026-10-06'),plan=requireValue(engine.createInitialPlan(p,date));
  const low=changeDay(changeDay(newDay(p,date,[plan]),{type:'total',kcal:0},false),{type:'complete'});
  const care=requireValue(engine.summarizeDay(low,plan));assert.equal(care.catState,'care');assert.equal(CAT_PRESENTATION[care.catState].clip,'care');
  assert.equal(requireValue(engine.summarizeDay(low,null)).catState,'neutral');
  assert.equal(requireValue(engine.summarizeDay(newDay(p,date,[plan]),plan)).catState,'neutral');
});
