import type { DayLog, LocalDate, PlanVersion, Profile, UTCInstant, WeightMeasurement } from './models.ts';
import type { PlanEngine, PlanOptions, Result } from './contracts.ts';
import { validateMovementDays } from './activity.ts';
import { ageOn, parseLocalDate } from './dates.ts';

export const PAL_OPTIONS = Object.freeze([{pal:1.4,label:'Çoğunlukla oturarak'},{pal:1.6,label:'Hafif hareketli'},{pal:1.8,label:'Hareketli'},{pal:2,label:'Çok hareketli'}]);
export const POLICY = Object.freeze({ pals: PAL_OPTIONS.map(option=>option.pal), minAge: 19, maxAge: 59, minBmi: 18.5, floorKcal: 1300, minDeficit: .1, maxDeficit: .2, maxDeficitKcal: 500 });
export const nowUTC = (): UTCInstant => new Date().toISOString() as UTCInstant;
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // LAN HTTP previews may lack randomUUID; getRandomValues still gives v4 entropy.
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]! & 15) | 64; bytes[8]=(bytes[8]! & 63) | 128;
  const hex=[...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = <T = never>(code: Extract<Result<T>, { ok: false }>['code'], message: string): Result<T> => ({ ok: false, code, message });
export function requireValue<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.message);
  return result.value;
}
function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function validId(value: string): void {
  ensure(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value), 'Geçersiz kayıt kimliği.');
}
export function validInstant(value: string): void {
  ensure(typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, 'Geçersiz UTC zamanı.');
}
export function validZone(value: string): void { new Intl.DateTimeFormat('tr-TR', { timeZone: value }).format(); }
export function validKcal(value: number): void {
  ensure(Number.isSafeInteger(value) && value >= 0, 'Kalori sıfır veya pozitif tam sayı olmalı.');
}
export function validWeight(value: number): void {
  ensure(Number.isFinite(value) && value >= 20 && value <= 400, 'Kilo 20–400 kg arasında olmalı.');
}
export function validateProfile(p: Profile): void {
  validId(p.userId); parseLocalDate(p.birthDate); validInstant(p.updatedAt); validZone(p.timeZone);
  ensure(p.birthDate >= '1900-01-01', 'Doğum tarihini kontrol et.');
  ensure(Number.isFinite(p.heightCm) && p.heightCm >= 100 && p.heightCm <= 250, 'Boy 100–250 cm arasında olmalı.');
  validWeight(p.weightKg);
  ensure(['male','female','not-provided'].includes(p.formulaSex), 'Formül bilgisi geçersiz.');
  ensure(['eligible','out-of-scope','not-assessed'].includes(p.automaticPlanEligibility), 'Uygunluk yanıtı gerekli.');
  ensure(p.baseline?.method === 'inclusive-pal-v1' && p.baseline.includesLoggedExercise === true && POLICY.pals.includes(p.baseline.pal), 'Günlük hareket seçimini kontrol et.');
}
export function validateDay(day: DayLog): void {
  validId(day.id); validId(day.userId); parseLocalDate(day.date); validZone(day.timeZone); validInstant(day.updatedAt);
  if (day.planVersionId !== null) validId(day.planVersionId);
  ensure(Number.isSafeInteger(day.revision) && day.revision >= 1, 'Geçersiz kayıt sürümü.');
  if (day.status === 'missing') {
    ensure(day.calories === null && day.completedAt === null, 'Boş gün kalori içeremez.'); return;
  }
  ensure(day.status === 'partial' || day.status === 'completed', 'Geçersiz gün durumu.');
  const c = day.calories;
  ensure(c && (c.mode === 'total' || c.mode === 'entries'), 'Kalori modu geçersiz.');
  if (c.mode === 'total') {
    ensure(!('entries' in c), 'İki kalori kaynağı birlikte saklanamaz.'); validKcal(c.totalKcal);
  } else {
    ensure(!('totalKcal' in c) && Array.isArray(c.entries), 'Parça kalori kaynağı geçersiz.');
    const ids = new Set<string>();
    for (const entry of c.entries) { validId(entry.id); validKcal(entry.kcal); validInstant(entry.createdAt); ensure(!ids.has(entry.id), 'Tekrarlı kalori parçası.'); ids.add(entry.id); }
    ensure(Number.isSafeInteger(c.entries.reduce((s, e) => s + e.kcal, 0)), 'Kalori toplamı çok büyük.');
    if (day.status === 'completed') ensure(c.entries.length > 0, 'Boş parça listesi tamamlanamaz.');
  }
  if (day.status === 'completed') validInstant(day.completedAt);
  else ensure(day.completedAt === null, 'Düzenlenen günü tekrar tamamla.');
}
export function validatePlan(plan: PlanVersion): void {
  validId(plan.id); validId(plan.userId); parseLocalDate(plan.effectiveFrom); validInstant(plan.createdAt);
  if (plan.previousVersionId !== null) validId(plan.previousVersionId);
  ensure(plan.goal === 'lose' || plan.goal === 'maintain', 'Geçersiz hedef.');
  if (plan.targetWeightKg !== null) validWeight(plan.targetWeightKg);
  const { min, max } = plan.calorieRangeKcal;
  ensure(Number.isFinite(min) && Number.isFinite(max) && min >= POLICY.floorKcal && max >= min, 'Hedef aralığı uygun değil.');
  ensure(Number.isFinite(plan.estimatedMaintenanceKcal) && plan.estimatedMaintenanceKcal > 0, 'Koruma tahmini geçersiz.');
  ensure(plan.formulaVersion === 'mifflin-inclusive-pal-v1' && plan.safetyPolicyVersion === 'guardrails-v1', 'Plan yöntemi geçersiz.');
  ensure(plan.baseline.method === 'inclusive-pal-v1' && plan.baseline.includesLoggedExercise && POLICY.pals.includes(plan.baseline.pal), 'Plan hareket yöntemi geçersiz.');
  validateMovementDays(plan.movementDays);
  ensure(['initial','user-edit','weekly-review','maintenance-transition'].includes(plan.reason), 'Plan değişim nedeni geçersiz.');
  validateRange(plan.estimatedMaintenanceKcal, plan.goal, min, max);
}
function validateRange(maintenance: number, goal: PlanOptions['goal'], min: number, max: number): void {
  if (goal === 'maintain') ensure(Math.abs(min - maintenance) < .001 && Math.abs(max - maintenance) < .001, 'Koruma hedefi koruma tahminine eşit olmalı.');
  else {
    const largeDeficit = maintenance - min, smallDeficit = maintenance - max;
    ensure(largeDeficit <= POLICY.maxDeficitKcal + .001 && largeDeficit <= maintenance * POLICY.maxDeficit + .001 && smallDeficit >= maintenance * POLICY.minDeficit - .001, 'Kilo verme aralığı %10–20 ve en fazla 500 kcal açık sınırlarında olmalı.');
  }
}
export function validateMeasurement(weight: WeightMeasurement): void {
  validId(weight.id); validId(weight.userId); parseLocalDate(weight.date); validInstant(weight.measuredAt); validInstant(weight.updatedAt); validWeight(weight.weightKg);
}
export const intake = (day: DayLog | null): number | null => {
  if (!day?.calories) return null;
  return day.calories.mode === 'total' ? day.calories.totalKcal : day.calories.entries.length ? day.calories.entries.reduce((s,e) => s + e.kcal, 0) : null;
};
export function planFor(plans: PlanVersion[], date: LocalDate): PlanVersion | null {
  return plans.filter(p => p.effectiveFrom <= date).sort((a,b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
}
export const engine: PlanEngine = {
  createInitialPlan(profile, effectiveFrom, options = { goal: 'maintain', targetWeightKg: null }) {
    try {
      validateProfile(profile); parseLocalDate(effectiveFrom);
      const age = ageOn(profile.birthDate, effectiveFrom);
      if (profile.automaticPlanEligibility !== 'eligible' || age < POLICY.minAge || age > POLICY.maxAge || profile.formulaSex === 'not-provided' || profile.weightKg / (profile.heightCm / 100) ** 2 < POLICY.minBmi)
        return failure('out-of-scope', 'Bu bilgilerle otomatik plan oluşturulamıyor. Kalori ve kilo kaydını plansız sürdürebilirsin; kişisel hedef için bir beslenme uzmanına danış.');
      if (options.goal === 'lose') {
        ensure(options.targetWeightKg !== null && options.targetWeightKg < profile.weightKg, 'Hedef kilo mevcut kilodan düşük olmalı.');
        validWeight(options.targetWeightKg);
        if (options.targetWeightKg / (profile.heightCm / 100) ** 2 < POLICY.minBmi) return failure('out-of-scope', 'Hedef kilo otomatik plan kapsamının dışında. Daha düşük hedef önerilmiyor; plansız kayıt yapabilirsin.');
      }
      const ree = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + (profile.formulaSex === 'male' ? 5 : -161);
      const maintenance = ree * profile.baseline.pal;
      ensure(Number.isFinite(maintenance) && maintenance > 0, 'Girdilerle hesap yapılamıyor.');
      if (options.calorieRangeKcal) {
        const {min,max}=options.calorieRangeKcal;
        ensure(Number.isFinite(min) && Number.isFinite(max) && min>=POLICY.floorKcal && max>=min,'Manuel kalori aralığı uygun değil. Plan kaydedilmedi.');
        validateRange(maintenance,options.goal,min,max);
      }
      const range = options.calorieRangeKcal ?? (options.goal === 'maintain' ? { min: maintenance, max: maintenance } : { min: maintenance - Math.min(POLICY.maxDeficitKcal, maintenance * POLICY.maxDeficit), max: maintenance * (1 - POLICY.minDeficit) });
      if (range.min < POLICY.floorKcal || range.min > range.max) return failure('out-of-scope', 'Bu girdiler ürünün başlangıç aralığı sınırlarını karşılamıyor. Otomatik hedef yerine plansız kayıt yapabilirsin.');
      const plan: PlanVersion = { id: uuid(), userId: profile.userId, previousVersionId: null, goal: options.goal, targetWeightKg: options.goal === 'lose' ? options.targetWeightKg : null, calorieRangeKcal: range, estimatedMaintenanceKcal: maintenance, baseline: { ...profile.baseline }, movementDays: options.movementDays ?? [], reason: 'initial', effectiveFrom, createdAt: nowUTC(), formulaVersion: 'mifflin-inclusive-pal-v1', safetyPolicyVersion: 'guardrails-v1' };
      validatePlan(plan); return success(plan);
    } catch (e) { return failure('validation', (e as Error).message); }
  },
  summarizeDay(day, plan) {
    try {
      validateDay(day);
      const kcal = intake(day);
      if (day.status !== 'completed') return success({ kind: 'incomplete', status: day.status, provisionalIntakeKcal: kcal, catState: 'neutral' });
      if (!plan) return success({ kind: 'unplanned', intakeKcal: kcal!, catState: 'neutral' });
      validatePlan(plan);
      ensure(plan.id === day.planVersionId && plan.userId === day.userId && plan.effectiveFrom <= day.date, 'Günün plan bağlantısı geçersiz.');
      const { min, max } = plan.calorieRangeKcal;
      const difference = kcal! < min ? kcal! - min : kcal! > max ? kcal! - max : 0;
      const deficit = plan.estimatedMaintenanceKcal - kcal!;
      const care = kcal! < POLICY.floorKcal || kcal! < min || deficit > POLICY.maxDeficitKcal || deficit > plan.estimatedMaintenanceKcal * POLICY.maxDeficit;
      return success({ kind: 'complete', intakeKcal: kcal!, targetDifferenceKcal: difference, estimatedDeficitKcal: deficit, catState: care ? 'care' : difference > 0 ? 'encouraging' : 'celebrate-range', formulaVersion: plan.formulaVersion });
    } catch (e) { return failure('validation', (e as Error).message); }
  },
};

export function newDay(profile: Profile, date: LocalDate, plans: PlanVersion[]): DayLog {
  return { id: uuid(), userId: profile.userId, date, timeZone: profile.timeZone, planVersionId: profile.automaticPlanEligibility === 'eligible' ? planFor(plans, date)?.id ?? null : null, revision: 1, updatedAt: nowUTC(), status: 'missing', calories: null, completedAt: null };
}
export type DayChange =
  | { type: 'total'; kcal: number }
  | { type: 'add'; kcal: number }
  | { type: 'edit'; id: string; kcal: number }
  | { type: 'remove'; id: string }
  | { type: 'switch'; mode: 'total' | 'entries'; preserve: boolean }
  | { type: 'complete' };
/** Pure mutation: plan/timeZone stay bound, each edit reopens a completed day. */
export function changeDay(day: DayLog, change: DayChange, existing = true): DayLog {
  const time = nowUTC();
  if (change.type === 'complete' && day.status === 'completed') return day;
  let calories = day.calories;
  if (change.type === 'total') { validKcal(change.kcal); ensure(!calories || calories.mode === 'total', 'Önce kalori modunu değiştir.'); calories = { mode: 'total', totalKcal: change.kcal }; }
  else if (change.type === 'add') { validKcal(change.kcal); ensure(!calories || calories.mode === 'entries', 'Önce kalori modunu değiştir.'); calories = { mode: 'entries', entries: [...(calories?.mode === 'entries' ? calories.entries : []), { id: uuid(), kcal: change.kcal, createdAt: time }] }; }
  else if (change.type === 'edit' || change.type === 'remove') {
    ensure(calories?.mode === 'entries' && calories.entries.some(e => e.id === change.id), 'Kalori parçası bulunamadı.');
    if (change.type === 'edit') validKcal(change.kcal);
    calories = { mode: 'entries', entries: change.type === 'remove' ? calories.entries.filter(e => e.id !== change.id) : calories.entries.map(e => e.id === change.id ? { ...e, kcal: change.kcal } : e) };
  } else if (change.type === 'switch') {
    const total = intake(day);
    calories = change.preserve && total !== null ? (change.mode === 'total' ? { mode: 'total', totalKcal: total } : { mode: 'entries', entries: [{ id: uuid(), kcal: total, createdAt: time }] }) : change.mode === 'entries' ? { mode: 'entries', entries: [] } : null;
  }
  ensure(change.type !== 'complete' || (calories && (calories.mode === 'total' || calories.entries.length > 0)), 'Önce kalori kaydı gir.');
  const base = { ...day, revision: existing ? day.revision + 1 : day.revision, updatedAt: time };
  const updated: DayLog = !calories ? { ...base, status: 'missing', calories: null, completedAt: null } : change.type === 'complete' ? { ...base, status: 'completed', calories, completedAt: time } : { ...base, status: 'partial', calories, completedAt: null };
  validateDay(updated); return updated;
}

export function representativeWeights(weights: WeightMeasurement[]): WeightMeasurement[] {
  const days = new Map<string, WeightMeasurement>();
  for (const weight of [...weights].sort((a,b) => a.measuredAt.localeCompare(b.measuredAt) || a.id.localeCompare(b.id))) days.set(weight.date, weight);
  return [...days.values()].sort((a,b) => b.date.localeCompare(a.date));
}
