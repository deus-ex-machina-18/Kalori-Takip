import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catResult } from '../src/ui/cat-result.ts';
import { changeDay, engine, newDay, requireValue, uuid } from '../src/domain/tracking.ts';
import { parseLocalDate } from '../src/domain/dates.ts';
import type { Profile } from '../src/domain/models.ts';

const date = parseLocalDate('2026-10-10');
const profile: Profile = { userId: uuid(), birthDate: parseLocalDate('2000-08-21'), heightCm: 180, weightKg: 91,
  formulaSex: 'male', timeZone: 'Europe/Istanbul', baseline: {method:'inclusive-pal-v1',pal:1.4,includesLoggedExercise:true},
  automaticPlanEligibility:'eligible', updatedAt:'2026-10-10T12:00:00.000Z' as Profile['updatedAt'] };
const plan = { ...requireValue(engine.createInitialPlan(profile, date, {goal:'lose',targetWeightKg:80})), estimatedMaintenanceKcal:2700, calorieRangeKcal:{min:2200,max:2400} };
const summary = (kcal: number, complete=true) => {
  const partial = changeDay(newDay(profile,date,[plan]), {type:'total',kcal}, false);
  return requireValue(engine.summarizeDay(complete ? changeDay(partial,{type:'complete'}) : partial, plan));
};
test('eksik ve plansız gün video sonucu üretmez; kısmi 800 kcal beklemedir',()=>{
  assert.equal(catResult(summary(800,false)).clip,'idle');
  assert.equal(catResult({kind:'unplanned',intakeKcal:800,catState:'neutral'}).clip,'idle');
});
test('aralığın alt ve üst sınırı dahil tek başarı; dört sonucu motorun farkları belirler',()=>{
  for(const value of [2200,2300,2400]) assert.equal(catResult(summary(value)).clip,'target-met');
  assert.equal(catResult(summary(2199)).clip,'below-target');
  assert.equal(catResult(summary(2401)).clip,'above-target');
  assert.equal(catResult(summary(2550)).message,'Hedef +150. Koruma tahmininin hâlâ 150 kcal altındasın.');
  assert.equal(catResult(summary(2700)).message,'Hedef +300. Koruma tahminindesin.');
  assert.equal(catResult(summary(3000)).clip,'above-maintenance');
  assert.equal(catResult(summary(3000)).message,'Bugün fazla kaçtı. Koruma tahmininin +300 kcal üstündesin.');
  assert.equal(catResult(summary(1900)).message,'Planın altında kaldın: −300 kcal.');
});
test('motor care önceliği sunumda korunur',()=>{
  assert.equal(catResult({kind:'complete',intakeKcal:2300,targetDifferenceKcal:0,estimatedDeficitKcal:900,catState:'care',formulaVersion:'mifflin-inclusive-pal-v1'}).clip,'below-target');
});
