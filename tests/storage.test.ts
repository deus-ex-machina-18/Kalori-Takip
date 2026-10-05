import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbRepository } from '../src/data/indexeddb.ts';
import type { Profile } from '../src/domain/models.ts';
import { addLocalDays, localDateAt, parseLocalDate } from '../src/domain/dates.ts';
import { changeDay, engine, newDay, nowUTC, requireValue, uuid } from '../src/domain/tracking.ts';

function profile():Profile{return {userId:uuid(),birthDate:parseLocalDate('2000-08-21'),heightCm:180,weightKg:91,formulaSex:'male',timeZone:'Europe/Istanbul',baseline:{method:'inclusive-pal-v1',pal:1.4,includesLoggedExercise:true},automaticPlanEligibility:'eligible',updatedAt:nowUTC()};}
async function fixture(){const factory=new IDBFactory(),name=uuid(),repository=new IndexedDbRepository(factory,name),p=profile(),date=localDateAt(new Date(),p.timeZone),plan=requireValue(engine.createInitialPlan(p,date));const setup={profile:p,plan,weight:null,expectedProfileUpdatedAt:null};requireValue(await repository.saveSetup(setup,{operationId:uuid()}));return {factory,name,repository,p,date,plan};}
test('IndexedDB yeniden açılışta profil, plan, kalori ve kilo kalır',async()=>{
  const {factory,name,repository,p,date,plan}=await fixture();
  const day=changeDay(newDay(p,date,[plan]),{type:'add',kcal:650},false);
  requireValue(await repository.saveDay(day,{operationId:uuid(),expectedRevision:0}));
  const time=nowUTC();const weight={id:uuid(),userId:p.userId,date,weightKg:90.75,measuredAt:time,updatedAt:time};
  requireValue(await repository.saveWeight(weight,{operationId:uuid()}));await repository.close();
  const reopened=new IndexedDbRepository(factory,name);
  assert.deepEqual(requireValue(await reopened.getLocalProfile()),p);assert.deepEqual(requireValue(await reopened.getDay(p.userId,date)),day);
  assert.deepEqual(requireValue(await reopened.listPlans(p.userId)),[plan]);assert.deepEqual(requireValue(await reopened.listWeights(p.userId)),[weight]);await reopened.close();
});
test('aynı operationId tekrar denemede bir kez yazar; farklı payload conflict',async()=>{
  const {repository,p,date,plan}=await fixture(),day=changeDay(newDay(p,date,[plan]),{type:'add',kcal:650},false),context={operationId:uuid(),expectedRevision:0};
  const first=requireValue(await repository.saveDay(day,context)),retry=requireValue(await repository.saveDay(structuredClone(day),context));assert.deepEqual(retry,first);
  assert.equal(requireValue(await repository.listDays(p.userId,date,date)).length,1);
  const changed={...day,status:'partial' as const,completedAt:null,calories:{mode:'total' as const,totalKcal:800}};
  const result=await repository.saveDay(changed,context);assert.equal(result.ok,false);if(!result.ok)assert.equal(result.code,'conflict');await repository.close();
});
test('iki sekme expectedRevision ile kayıp güncelleme yapamaz',async()=>{
  const {factory,name,repository,p,date,plan}=await fixture(),other=new IndexedDbRepository(factory,name);
  const original=changeDay(newDay(p,date,[plan]),{type:'total',kcal:1950},false);requireValue(await repository.saveDay(original,{operationId:uuid(),expectedRevision:0}));
  const responses=await Promise.all([repository.saveDay(changeDay(original,{type:'total',kcal:2000}),{operationId:uuid(),expectedRevision:1}),other.saveDay(changeDay(original,{type:'total',kcal:2200}),{operationId:uuid(),expectedRevision:1})]);
  assert.equal(responses.filter(r=>r.ok).length,1);assert.equal(responses.filter(r=>!r.ok&&r.code==='conflict').length,1);await repository.close();await other.close();
});
test('ileri plan eklemek geçmiş günü yeniden bağlamaz; aynı plan tarihi reddedilir',async()=>{
  const {repository,p,date,plan}=await fixture();const day=changeDay(newDay(p,date,[plan]),{type:'total',kcal:2000},false);requireValue(await repository.saveDay(day,{operationId:uuid(),expectedRevision:0}));
  const updated={...p,weightKg:90,updatedAt:new Date(Date.parse(p.updatedAt)+1000).toISOString() as Profile['updatedAt']},next=requireValue(engine.createInitialPlan(updated,addLocalDays(date,1)));next.previousVersionId=plan.id;next.reason='user-edit';
  requireValue(await repository.saveSetup({profile:updated,plan:next,weight:null,expectedProfileUpdatedAt:p.updatedAt},{operationId:uuid()}));
  const edited=changeDay(day,{type:'total',kcal:2100});requireValue(await repository.saveDay(edited,{operationId:uuid(),expectedRevision:1}));assert.equal(requireValue(await repository.getDay(p.userId,date))?.planVersionId,plan.id);
  const nextProfile={...updated,updatedAt:new Date(Date.parse(updated.updatedAt)+1000).toISOString() as Profile['updatedAt']};
  const bad=await repository.saveSetup({profile:nextProfile,plan:{...next,id:uuid(),previousVersionId:next.id},weight:null,expectedProfileUpdatedAt:updated.updatedAt},{operationId:uuid()});assert.equal(bad.ok,false);await repository.close();
});
test('profil/plan/ölçüm tek transaction: başarısız ölçüm hepsini geri alır',async()=>{
  const {repository,p,date,plan}=await fixture();const time=nowUTC(),weight={id:uuid(),userId:p.userId,date,weightKg:90,measuredAt:time,updatedAt:time};requireValue(await repository.saveWeight(weight,{operationId:uuid()}));
  const updated={...p,weightKg:90,updatedAt:new Date(Date.parse(p.updatedAt)+1000).toISOString() as Profile['updatedAt']},next=requireValue(engine.createInitialPlan(updated,addLocalDays(date,1)));next.previousVersionId=plan.id;
  const result=await repository.saveSetup({profile:updated,plan:next,weight,expectedProfileUpdatedAt:p.updatedAt},{operationId:uuid()});assert.equal(result.ok,false);
  assert.deepEqual(requireValue(await repository.getProfile(p.userId)),p);assert.equal(requireValue(await repository.listPlans(p.userId)).length,1);await repository.close();
});
test('depo erişim hatası storage olur; belleğe sessiz geri dönüş yok',async()=>{
  const unavailable=new IndexedDbRepository({open(){throw new DOMException('denied','SecurityError');}} as unknown as IDBFactory,uuid());
  const result=await unavailable.getLocalProfile();assert.equal(result.ok,false);if(!result.ok)assert.equal(result.code,'storage');
});
test('gelecek gün, geçersiz kalori ve iki kalori kaynağı reddedilir',async()=>{
  const {repository,p,date,plan}=await fixture();let day=changeDay(newDay(p,addLocalDays(date,1),[plan]),{type:'total',kcal:2000},false);
  assert.equal((await repository.saveDay(day,{operationId:uuid(),expectedRevision:0})).ok,false);
  day=changeDay(newDay(p,date,[plan]),{type:'total',kcal:2000},false);
  for(const calories of [{mode:'total',totalKcal:-1},{mode:'total',totalKcal:2000,entries:[]}])assert.equal((await repository.saveDay({...day,calories} as typeof day,{operationId:uuid(),expectedRevision:0})).ok,false);
  assert.equal(requireValue(await repository.listDays(p.userId,date,date)).length,0);await repository.close();
});
test('plansız eski gün sonradan oluşturulan planla doldurulmaz',async()=>{
  const {repository,p,date,plan}=await fixture();const oldDate=addLocalDays(date,-1),day=changeDay(newDay(p,oldDate,[plan]),{type:'total',kcal:1900},false);
  requireValue(await repository.saveDay(day,{operationId:uuid(),expectedRevision:0}));const complete=changeDay(day,{type:'complete'});requireValue(await repository.saveDay(complete,{operationId:uuid(),expectedRevision:1}));
  assert.equal(requireValue(await repository.getDay(p.userId,oldDate))?.planVersionId,null);await repository.close();
});
