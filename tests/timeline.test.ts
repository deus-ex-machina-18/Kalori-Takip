import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import type { Profile } from '../src/domain/models.ts';
import { IndexedDbRepository } from '../src/data/indexeddb.ts';
import { activityMinutesForKcal } from '../src/domain/activity.ts';
import { localDateAt, parseLocalDate } from '../src/domain/dates.ts';
import { engine, nowUTC, requireValue, uuid } from '../src/domain/tracking.ts';
import { durationCalorieRange, planTimeline } from '../src/domain/timeline.ts';

const profile = (): Profile => ({ userId: uuid(), birthDate: parseLocalDate('2000-08-21'), heightCm: 180, weightKg: 91, formulaSex: 'male', timeZone: 'Europe/Istanbul', baseline: { method: 'inclusive-pal-v1', pal: 1.4, includesLoggedExercise: true }, automaticPlanEligibility: 'eligible', updatedAt: nowUTC() });
const date = localDateAt(new Date(), 'Europe/Istanbul');

test('sınıra yakın 22 hafta, tek taraflı aralık kesilmesiyle 23 haftaya uzamaz', () => {
  const p = profile();
  p.baseline.pal = 1.6;
  p.weightKg = 92;
  const plan = requireValue(engine.createInitialPlan(p, parseLocalDate('2026-10-12'), { goal: 'lose', targetWeightKg: 84, targetDurationWeeks: 22 }));
  assert.equal(plan.estimatedMaintenanceKcal, 3072);
  assert.ok(Math.abs(planTimeline(plan)!.estimatedWeeks! - 22) < 1e-9);
  assert.equal(planTimeline(plan)!.limited, false);
  const capped = requireValue(engine.createInitialPlan(p, parseLocalDate('2026-10-12'), { goal: 'lose', targetWeightKg: 84, targetDurationWeeks: 16 }));
  assert.deepEqual(capped.calorieRangeKcal, { min: 2572, max: 2572 });
  assert.equal(planTimeline(capped)!.limited, true);
  assert.ok(planTimeline(capped)!.estimatedWeeks! < 21);
});

test('süre aralığı iki sınırda da merkezi korur', () => {
  const low = durationCalorieRange(2000, 80, 75, 1.2, 12, 1500);
  assert.equal((low.min + low.max) / 2, 2000 - 30 - 38500 / 84);
  const high = durationCalorieRange(2000, 80, 79.9, 1.2, 156, 1500);
  assert.equal(high.max, 1999);
  assert.ok(Math.abs((high.min + high.max) / 2 - (2000 - 0.6 - 770 / 1092)) < 1e-8);
});

test('hedef süresi plan kalorilerini değiştirir; makul süre enerji hesabında karşılanır', () => {
  const p = profile();
  const plan = (weeks: number) => requireValue(engine.createInitialPlan(p, date, { goal: 'lose', targetWeightKg: 80, targetDurationWeeks: weeks }));
  const a = plan(40), b = plan(80);
  assert.ok(b.calorieRangeKcal.min > a.calorieRangeKcal.min);
  assert.ok(Math.abs(planTimeline(a)!.estimatedWeeks! - 40) < 0.001);
  assert.equal(planTimeline(a)!.limited, false);
  assert.equal(a.safetyPolicyVersion, 'guardrails-v2');
  const capped = plan(8);
  assert.equal(planTimeline(capped)!.requestedWeeks, 8);
  assert.equal(planTimeline(capped)!.limited, true);
  assert.ok(planTimeline(capped)!.estimatedWeeks! > 8);
  assert.ok(capped.estimatedMaintenanceKcal - capped.calorieRangeKcal.min <= 500.001);
  assert.ok(capped.calorieRangeKcal.min >= 1300);
});

test('geçersiz süre reddedilir; koruma ve eski plansız-süre akışı değişmez', () => {
  const p = profile();
  for (const weeks of [0, -1, 1.5, 157, NaN, Infinity]) {
    const result = engine.createInitialPlan(p, date, { goal: 'lose', targetWeightKg: 80, targetDurationWeeks: weeks });
    assert.equal(result.ok, false);
  }
  const legacy = requireValue(engine.createInitialPlan(p, date, { goal: 'lose', targetWeightKg: 80 }));
  assert.equal(legacy.timeline, undefined);
  assert.equal(legacy.safetyPolicyVersion, 'guardrails-v1');
  const maintain = requireValue(engine.createInitialPlan(p, date, { goal: 'maintain', targetWeightKg: null, targetDurationWeeks: 12 }));
  assert.equal(maintain.timeline, undefined);
  assert.equal(maintain.calorieRangeKcal.min, maintain.estimatedMaintenanceKcal);
});

test('uzun süreli düşük açık planı onaydan sonra kalır; depo yeniden açılışta süreyi doğrular', async () => {
  const factory = new IDBFactory(), name = uuid(), p = profile();
  const repo = new IndexedDbRepository(factory, name);
  const plan = requireValue(engine.createInitialPlan(p, date, { goal: 'lose', targetWeightKg: 80, targetDurationWeeks: 156 }));
  assert.ok(plan.estimatedMaintenanceKcal - plan.calorieRangeKcal.min < plan.estimatedMaintenanceKcal * 0.1);
  requireValue(await repo.saveSetup({ profile: p, plan, weight: null, expectedProfileUpdatedAt: null }, { operationId: uuid() }));
  await repo.close();
  const reopened = new IndexedDbRepository(factory, name);
  assert.deepEqual(requireValue(await reopened.listPlans(p.userId))[0]?.timeline, plan.timeline);
  await reopened.close();
  const badRepo = new IndexedDbRepository(new IDBFactory(), uuid());
  assert.equal((await badRepo.saveSetup({ profile: p, plan: { ...plan, timeline: { ...plan.timeline!, startingWeightKg: 95 } }, weight: null, expectedProfileUpdatedAt: null }, { operationId: uuid() })).ok, false);
  await badRepo.close();
});

test('net aktivite karşılığı dinlenmeyi çıkarır; süre kilo ile ters orantılıdır', () => {
  // 91 kg, 4.8 MET walking, net 6.0515 kcal/min; +/-20% product range.
  assert.deepEqual(activityMinutesForKcal(200, 'walk', 'vigorous', 91), { min: 27, max: 42 });
  assert.deepEqual(activityMinutesForKcal(0, 'cycle', 'moderate', 91), { min: 0, max: 0 });
  assert.ok(activityMinutesForKcal(200, 'cycle', 'moderate', 91).max < 42);
  assert.ok(activityMinutesForKcal(200, 'walk', 'vigorous', 120).max < 42);
  for (const kcal of [-1, NaN, Infinity]) assert.throws(() => activityMinutesForKcal(kcal, 'run', 'moderate', 91));
  assert.throws(() => activityMinutesForKcal(200, 'run', 'moderate', 10));
});
