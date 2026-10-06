import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbRepository } from '../src/data/indexeddb.ts';
import { createActivity, estimateActivity, suggestMovement, validateActivity } from '../src/domain/activity.ts';
import { reviewWeek } from '../src/domain/weekly.ts';
import { addLocalDays, localDateAt, parseLocalDate } from '../src/domain/dates.ts';
import { changeDay, engine, newDay, nowUTC, requireValue, uuid } from '../src/domain/tracking.ts';
import type { Profile, WeightMeasurement } from '../src/domain/models.ts';
const today=localDateAt(new Date(),'Europe/Istanbul');
function profile():Profile {return {userId:uuid(),birthDate:parseLocalDate('2000-08-21'),heightCm:180,weightKg:91,formulaSex:'male',timeZone:'Europe/Istanbul',baseline:{method:'inclusive-pal-v1',pal:1.4,includesLoggedExercise:true},automaticPlanEligibility:'eligible',updatedAt:nowUTC()};}
async function fixture(){const factory=new IDBFactory(),name=uuid(),repo=new IndexedDbRepository(factory,name),p=profile(),plan=requireValue(engine.createInitialPlan(p,addLocalDays(today,-7),{goal:'lose',targetWeightKg:80}));const initial={...plan,effectiveFrom:today};requireValue(await repo.saveSetup({profile:p,plan:initial,weight:null,expectedProfileUpdatedAt:null},{operationId:uuid()}));return {factory,name,repo,p,plan:initial};}
test('MET birimleri: 3.8 × 3.5 × 80 / 200 × 30; kilo ve süre doğrusal',()=>{
 const e=estimateActivity('walk','moderate',30,80);assert.equal(e.metCode,'17190');assert.ok(Math.abs(e.estimatedGrossKcal.min-159.6*.8)<1e-8);assert.ok(Math.abs(e.estimatedGrossKcal.max-159.6*1.2)<1e-8);
 assert.equal(estimateActivity('walk','moderate',60,80).estimatedGrossKcal.min,e.estimatedGrossKcal.min*2);assert.equal(estimateActivity('walk','moderate',30,160).estimatedGrossKcal.min,e.estimatedGrossKcal.min*2);
 assert.ok(estimateActivity('run','vigorous',30,80).estimatedGrossKcal.min>estimateActivity('run','light',30,80).estimatedGrossKcal.min);
});
test('kuvvet daha geniş ürün belirsizliği; geçersiz girişler reddedilir',()=>{
 const e=estimateActivity('strength','moderate',30,80);assert.ok(Math.abs(e.estimatedGrossKcal.max/e.estimatedGrossKcal.min-1.4/.6)<1e-8);
 for(const duration of [0,-1,361,NaN,Infinity])assert.throws(()=>estimateActivity('walk','moderate',duration,80));
 assert.throws(()=>estimateActivity('walk','moderate',30,19));assert.throws(()=>estimateActivity('unknown' as 'walk','moderate',30,80));
 const p=profile(),a=createActivity(p,today,'cycle','moderate',30,91);assert.throws(()=>validateActivity({...a,metCode:'fake'}));assert.throws(()=>validateActivity({...a,estimatedGrossKcal:{min:0,max:1}}));
 assert.throws(()=>createActivity({...p,birthDate:parseLocalDate('1950-01-01')},today,'walk','moderate',30,80));
});
test('aktivite değişikliği günlük 2700/2200/2400 sonucuna eklenmez',()=>{
 const p=profile(),plan=requireValue(engine.createInitialPlan(p,today));plan.estimatedMaintenanceKcal=2700;plan.goal='lose';plan.targetWeightKg=80;plan.calorieRangeKcal={min:2200,max:2200};
 const day=changeDay(changeDay(newDay(p,today,[plan]),{type:'total',kcal:2400},false),{type:'complete'}),before=requireValue(engine.summarizeDay(day,plan));
 createActivity(p,today,'cycle','vigorous',60,91);assert.deepEqual(requireValue(engine.summarizeDay(day,plan)),before);assert.equal(before.kind,'complete');if(before.kind==='complete'){assert.equal(before.targetDifferenceKcal,200);assert.equal(before.estimatedDeficitKcal,300);}
});
test('aktivite kalıcıdır, retry tek kayıt; edit ve delete CAS ile korunur',async()=>{
 const {factory,name,repo,p}=await fixture(),a=createActivity(p,today,'cycle','moderate',30,91),ctx={operationId:uuid(),expectedActivity:null};
 requireValue(await repo.saveActivity(a,ctx));requireValue(await repo.saveActivity(a,ctx));assert.equal(requireValue(await repo.listActivities(p.userId,today)).length,1);
 assert.equal((await repo.saveActivity({...a,durationMinutes:40,...estimateActivity(a.kind,a.intensity,40,91)},ctx)).ok,false);
 const other=new IndexedDbRepository(factory,name),b=createActivity(p,today,'cycle','moderate',40,91,a),c=createActivity(p,today,'cycle','moderate',50,91,a);
 const results=await Promise.all([repo.saveActivity(b,{operationId:uuid(),expectedActivity:a}),other.saveActivity(c,{operationId:uuid(),expectedActivity:a})]);assert.equal(results.filter(r=>r.ok).length,1);
 const stored=requireValue(await repo.listActivities(p.userId,today))[0]!;
 assert.equal((await repo.deleteActivity(p.userId,a.id,{operationId:uuid(),expectedActivity:a})).ok,false);
 await repo.close();const reopened=new IndexedDbRepository(factory,name);assert.deepEqual(requireValue(await reopened.listActivities(p.userId,today)),[stored]);
 const deletion={operationId:uuid(),expectedActivity:stored};requireValue(await reopened.deleteActivity(p.userId,a.id,deletion));requireValue(await reopened.deleteActivity(p.userId,a.id,deletion));assert.deepEqual(requireValue(await reopened.listActivities(p.userId,today)),[]);await reopened.close();await other.close();
});
test('gelecek tarih, farklı kullanıcı, değişmiş kimlik ve sahte tahmin saklanmaz',async()=>{
 const {repo,p}=await fixture(),a=createActivity(p,today,'walk','moderate',30,91);
 assert.equal((await repo.saveActivity({...a,date:addLocalDays(today,1)},{operationId:uuid(),expectedActivity:null})).ok,false);
 assert.equal((await repo.saveActivity({...a,userId:uuid()},{operationId:uuid(),expectedActivity:null})).ok,false);
 assert.equal((await repo.saveActivity({...a,estimatedGrossKcal:{min:1,max:2}},{operationId:uuid(),expectedActivity:null})).ok,false);
 requireValue(await repo.saveActivity(a,{operationId:uuid(),expectedActivity:null}));assert.equal((await repo.deleteActivity(uuid(),a.id,{operationId:uuid(),expectedActivity:a})).ok,false);
 assert.equal((await repo.saveActivity({...a,date:addLocalDays(today,-1)},{operationId:uuid(),expectedActivity:a})).ok,false);await repo.close();
});
test('hareket taslağı tercihler ve günleri kullanır; plan kcal değişmez',()=>{
 const p=profile(),movement=suggestMovement(p,[5,1,3],['cycle','strength']);assert.deepEqual(movement,[{weekday:1,kind:'cycle',minutes:15},{weekday:3,kind:'strength',minutes:15},{weekday:5,kind:'cycle',minutes:15}]);
 const base=requireValue(engine.createInitialPlan(p,today)),plan=requireValue(engine.createInitialPlan(p,today,{goal:'maintain',targetWeightKg:null,movementDays:movement}));assert.deepEqual(plan.calorieRangeKcal,base.calorieRangeKcal);
 assert.throws(()=>suggestMovement(p,[1,1],['walk']));assert.throws(()=>suggestMovement(p,[1],[]));
});
test('manuel kalori aralığı ürün sınırları dışında plansız başarıya dönmez',()=>{
 const p=profile(),base=requireValue(engine.createInitialPlan(p,today,{goal:'lose',targetWeightKg:80}));
 assert.equal(engine.createInitialPlan(p,today,{goal:'lose',targetWeightKg:80,calorieRangeKcal:{min:1000,max:1200}}).ok,false);
 const custom=engine.createInitialPlan(p,today,{goal:'lose',targetWeightKg:80,calorieRangeKcal:{min:base.calorieRangeKcal.max,max:base.calorieRangeKcal.max}});assert.equal(custom.ok,true);
 assert.equal(engine.createInitialPlan(p,today,{goal:'maintain',targetWeightKg:null,calorieRangeKcal:{min:2000,max:2000}}).ok,false);
});
test('hareketli yeni plan sürümü geçmiş güne dokunmaz ve onayla kalıcı olur',async()=>{
 const {repo,p,plan}=await fixture(),day=changeDay(newDay(p,today,[plan]),{type:'total',kcal:2400},false);requireValue(await repo.saveDay(day,{operationId:uuid(),expectedRevision:0}));
 const updated={...p,updatedAt:new Date(Date.parse(p.updatedAt)+1000).toISOString() as Profile['updatedAt']};const next=requireValue(engine.createInitialPlan(updated,addLocalDays(today,1),{goal:'lose',targetWeightKg:80,movementDays:suggestMovement(p,[1,3],['cycle'])}));next.previousVersionId=plan.id;next.reason='user-edit';
 requireValue(await repo.saveSetup({profile:updated,plan:next,weight:null,expectedProfileUpdatedAt:p.updatedAt},{operationId:uuid()}));assert.equal(requireValue(await repo.getDay(p.userId,today))?.planVersionId,plan.id);assert.deepEqual(requireValue(await repo.listPlans(p.userId)).find(p=>p.id===next.id)?.movementDays,next.movementDays);await repo.close();
});
function weekFixture(){const p=profile(),plan=requireValue(engine.createInitialPlan(p,addLocalDays(today,-10),{goal:'lose',targetWeightKg:80}));const days=Array.from({length:7},(_,i)=>changeDay(changeDay(newDay(p,addLocalDays(today,-7+i),[plan]),{type:'total',kcal:Math.ceil(plan.calorieRangeKcal.max)},false),{type:'complete'}));return {p,plan,days};}
test('eksik/kısmi/karışık plan haftası hedef önermez; boş gün sıfır değildir',()=>{
 const {p,plan,days}=weekFixture();const r=reviewWeek(today,days.slice(0,1),[plan],[],[],p.userId);assert.equal(r.missing,6);assert.equal(r.averageIntakeKcal,days[0]?.calories?.mode==='total'?days[0].calories.totalKcal:null);assert.equal(r.eligible,false);
 const partial=changeDay(days[0]!,{type:'total',kcal:2000});assert.equal(reviewWeek(today,[partial,...days.slice(1)],[plan],[],[],p.userId).eligible,false);
 assert.equal(reviewWeek(today,[{...days[0]!,planVersionId:null},...days.slice(1)],[plan],[],[],p.userId).eligible,false);
 assert.equal(reviewWeek(today,[],[],[],[],p.userId).averageIntakeKcal,null);
});
test('yedi uygun gün değerlendirme açar; care hedef azaltmayı bastırır',()=>{
 const {p,plan,days}=weekFixture();assert.equal(reviewWeek(today,days,[plan],[],[],p.userId).eligible,true);
 const care=changeDay(changeDay(days[0]!,{type:'total',kcal:500}),{type:'complete'});const r=reviewWeek(today,[care,...days.slice(1)],[plan],[],[],p.userId);assert.equal(r.eligible,false);assert.match(r.message,/Daha düşük kalori önerilmiyor/);
});
test('haftalık gözlenen kilo: günlük son ölçüm, en az üç gün ve üç günlük aralık',()=>{
 const {p,plan,days}=weekFixture(),time=nowUTC();const weights:WeightMeasurement[]=[-7,-5,-3].map((offset,i)=>({id:uuid(),userId:p.userId,date:addLocalDays(today,offset),weightKg:91-i,measuredAt:time,updatedAt:time}));
 assert.equal(reviewWeek(today,days,[plan],[],weights.slice(0,1),p.userId).observedWeightChange,null);assert.equal(reviewWeek(today,days,[plan],[],weights,p.userId).observedWeightChange,-2);
 assert.equal(reviewWeek(today,days,[plan],[],weights.map(w=>({...w,userId:uuid()})),p.userId).weightDays,0);
});
