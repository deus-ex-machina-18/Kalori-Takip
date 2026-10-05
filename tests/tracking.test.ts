import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Profile, PlanVersion } from '../src/domain/models.ts';
import { addLocalDays, ageOn, localDateAt, parseLocalDate } from '../src/domain/dates.ts';
import { changeDay, engine, intake, newDay, nowUTC, planFor, representativeWeights, requireValue, uuid } from '../src/domain/tracking.ts';

export function profile(): Profile {
  return {userId:uuid(),birthDate:parseLocalDate('2000-08-21'),heightCm:180,weightKg:91,formulaSex:'male',timeZone:'Europe/Istanbul',baseline:{method:'inclusive-pal-v1',pal:1.4,includesLoggedExercise:true},automaticPlanEligibility:'eligible',updatedAt:nowUTC()};
}
const date=localDateAt(new Date(),'Europe/Istanbul');
test('650 + 800 + 500 = 1950; boş gün sıfır değildir ve kısmi gün sonuç üretmez',()=>{
  const p=profile(); let d=newDay(p,date,[]);
  assert.equal(intake(d),null);
  for(const kcal of [650,800,500]) d=changeDay(d,{type:'add',kcal});
  assert.equal(intake(d),1950); assert.equal(d.status,'partial');
  assert.equal(requireValue(engine.summarizeDay(d,null)).kind,'incomplete');
});
test('2700 koruma / 2200 hedef / 2400 tüketim: hedef +200, açık +300',()=>{
  const p=profile(); const plan:PlanVersion={...requireValue(engine.createInitialPlan(p,date)),goal:'lose',targetWeightKg:80,estimatedMaintenanceKcal:2700,calorieRangeKcal:{min:2200,max:2200}};
  const day=changeDay(changeDay(newDay(p,date,[plan]),{type:'total',kcal:2400}),{type:'complete'});
  const result=requireValue(engine.summarizeDay(day,plan));
  assert.equal(result.kind,'complete'); if(result.kind==='complete'){assert.equal(result.targetDifferenceKcal,200);assert.equal(result.estimatedDeficitKcal,300);assert.equal(result.catState,'encouraging');}
});
test('mod dönüşümü toplamı iki kez saymaz, iptal saf fonksiyonda değişiklik yapmaz',()=>{
  const p=profile(); let day=newDay(p,date,[]);
  for(const kcal of [650,800,500])day=changeDay(day,{type:'add',kcal});
  const old=structuredClone(day);
  day=changeDay(day,{type:'switch',mode:'total',preserve:true});
  assert.equal(intake(day),1950); assert.equal('entries' in day.calories!,false);
  day=changeDay(day,{type:'switch',mode:'entries',preserve:true});
  assert.equal(intake(day),1950); assert.equal(day.calories?.mode==='entries'&&day.calories.entries.length,1);
  assert.equal(intake(old),1950);
  day=changeDay(day,{type:'switch',mode:'total',preserve:false});
  assert.equal(intake(day),null);assert.equal(day.status,'missing');
});
test('tamamlanmış güne ekleme, düzeltme, silme ve dönüşüm yeniden onay gerektirir',()=>{
  const p=profile(); const partial=changeDay(newDay(p,date,[]),{type:'add',kcal:1500});
  const day=changeDay(partial,{type:'complete'}); assert.equal(changeDay(day,{type:'complete'}),day);
  const id=day.calories?.mode==='entries'?day.calories.entries[0]!.id:'';
  for(const action of [{type:'add',kcal:100},{type:'edit',id,kcal:1600},{type:'remove',id},{type:'switch',mode:'total',preserve:true}] as const){
    const updated=changeDay(day,action);assert.equal(updated.status,'partial');assert.equal(updated.completedAt,null);assert.equal(updated.revision,day.revision+1);
  }
  assert.throws(()=>changeDay(newDay(p,date,[]),{type:'complete'}));
});
test('sıfır açık kullanıcı kaydı olabilir; kutlama değildir; düşük tüketim care',()=>{
  const p=profile(),plan=requireValue(engine.createInitialPlan(p,date));
  const day=changeDay(changeDay(newDay(p,date,[plan]),{type:'total',kcal:0}),{type:'complete'});
  assert.equal(intake(day),0); const result=requireValue(engine.summarizeDay(day,plan));
  assert.equal(result.kind==='complete'&&result.catState,'care');
  for(const kcal of [-1,NaN,Infinity,1.5])assert.throws(()=>changeDay(day,{type:'total',kcal}));
});
test('yaş, BMI, formül ve sağlık kapsamı dışında hedef üretilmez',()=>{
  const p=profile();
  for(const override of [{birthDate:parseLocalDate('2010-01-01')},{birthDate:parseLocalDate('1950-01-01')},{formulaSex:'not-provided' as const},{weightKg:50},{automaticPlanEligibility:'out-of-scope' as const},{automaticPlanEligibility:'not-assessed' as const}]){
    const result=engine.createInitialPlan({...p,...override},date);assert.equal(result.ok,false);if(!result.ok)assert.equal(result.code,'out-of-scope');
  }
  assert.equal(engine.createInitialPlan(p,date,{goal:'lose',targetWeightKg:50}).ok,false);
  assert.equal(engine.createInitialPlan(p,date,{goal:'lose',targetWeightKg:100}).ok,false);
  assert.equal(engine.createInitialPlan(p,date,{goal:'lose',targetWeightKg:80,calorieRangeKcal:{min:1000,max:1200}}).ok,false);
});
test('plan hesabı deterministik, inclusive PAL egzersizi tekrar eklemez',()=>{
  const p=profile(); const a=requireValue(engine.createInitialPlan(p,date,{goal:'lose',targetWeightKg:80})),b=requireValue(engine.createInitialPlan(p,date,{goal:'lose',targetWeightKg:80}));
  assert.deepEqual(a.calorieRangeKcal,b.calorieRangeKcal);
  assert.equal(a.estimatedMaintenanceKcal,(10*91+6.25*180-5*ageOn(p.birthDate,date)+5)*1.4);
  assert.equal(a.baseline.includesLoggedExercise,true);assert.deepEqual(a.movementDays,[]);
});
test('geçmiş gün düzenlemesi önceki planı ve saat dilimini korur',()=>{
  const p=profile(),old=requireValue(engine.createInitialPlan(p,date));
  const next={...old,id:uuid(),previousVersionId:old.id,effectiveFrom:addLocalDays(date,1)};
  const original=changeDay(newDay(p,date,[old,next]),{type:'total',kcal:2000});
  const edited=changeDay(original,{type:'total',kcal:2400});assert.equal(edited.planVersionId,old.id);assert.equal(edited.timeZone,p.timeZone);
  assert.equal(planFor([old,next],next.effectiveFrom)?.id,next.id);
});
test('yerel gece yarısı ve yıl/artık gün; yaş doğum gününde değişir',()=>{
  const before=localDateAt(new Date('2026-10-05T20:59:59Z'),'Europe/Istanbul'),after=localDateAt(new Date('2026-10-05T21:00:00Z'),'Europe/Istanbul');
  assert.equal(before,'2026-10-05');assert.equal(after,'2026-10-06');
  assert.equal(addLocalDays(parseLocalDate('2024-02-28'),1),'2024-02-29');assert.equal(addLocalDays(parseLocalDate('2026-12-31'),1),'2027-01-01');
  assert.equal(ageOn(parseLocalDate('2000-08-21'),parseLocalDate('2026-08-20')),25);assert.equal(ageOn(parseLocalDate('2000-08-21'),parseLocalDate('2026-08-21')),26);
});
test('kilo günlük temsilcisi son measuredAt ve eşitlikte id; tüm ölçümler korunur',()=>{
  const base={userId:uuid(),date,measuredAt:nowUTC(),updatedAt:nowUTC()};
  const values=[{...base,id:'00000000-0000-0000-0000-000000000001',weightKg:90},{...base,id:'00000000-0000-0000-0000-000000000002',weightKg:91}];
  assert.equal(representativeWeights(values)[0]!.weightKg,91);assert.equal(values.length,2);
});
