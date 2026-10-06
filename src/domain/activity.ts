import type { Activity, ActivityKind, LocalDate, PlanVersion, Profile } from './models.ts';
import { ageOn, parseLocalDate } from './dates.ts';
import { nowUTC, uuid, validId, validInstant, validWeight } from './tracking.ts';

export const ACTIVITY_KINDS: Record<ActivityKind, string> = { walk:'Yürüyüş', run:'Koşu', cycle:'Bisiklet', strength:'Salon / kuvvet' };
// Verified 2024 Adult Compendium codes. Labels describe the actual category,
// rather than treating a subjective intensity as an absolute physiological level.
export const ACTIVITY_MET = {
  walk: { light:{code:'17152',met:2.8,label:'Yavaş · düz zeminde 3,2–3,9 km/sa'}, moderate:{code:'17190',met:3.8,label:'Orta · düz zeminde 4,5–5,5 km/sa'}, vigorous:{code:'17200',met:4.8,label:'Tempolu · düz zeminde 5,6–6,3 km/sa'} },
  run: { light:{code:'12028',met:6.5,label:'Yavaş koşu · 6,4–6,8 km/sa'}, moderate:{code:'12030',met:8.5,label:'Orta koşu · 8,0–8,4 km/sa'}, vigorous:{code:'12050',met:9.3,label:'Hızlı koşu · 9,7–10,1 km/sa'} },
  cycle: { light:{code:'01015',met:4.3,label:'Açık hava · kolay tempo'}, moderate:{code:'01016',met:7,label:'Açık hava · orta tempo'}, vigorous:{code:'01017',met:9,label:'Açık hava · yoğun tempo'} },
  strength: { light:{code:'02056',met:3,label:'Vücut ağırlığı · genel'}, moderate:{code:'02054',met:3.5,label:'Ağırlık · çeşitli hareketler, 8–15 tekrar'}, vigorous:{code:'02050',met:6,label:'Ağırlık · yoğun efor'} },
} as const;
export const ACTIVITY_POLICY = Object.freeze({ maxMinutes:360, aerobicUncertainty:.2, strengthUncertainty:.4 });
function ensure(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
export function estimateActivity(kind: ActivityKind, intensity: Activity['intensity'], minutes: number, weightKg: number) {
  ensure(Object.hasOwn(ACTIVITY_MET,kind) && Object.hasOwn(ACTIVITY_MET[kind],intensity),'Hareket ve tempo seçimini kontrol et.');
  ensure(Number.isFinite(minutes) && minutes > 0 && minutes <= ACTIVITY_POLICY.maxMinutes,'Süre 0’dan büyük, en fazla 360 dakika olmalı.');
  validWeight(weightKg);
  const category=ACTIVITY_MET[kind][intensity], gross=category.met*3.5*weightKg/200*minutes;
  const uncertainty=kind==='strength' ? ACTIVITY_POLICY.strengthUncertainty : ACTIVITY_POLICY.aerobicUncertainty;
  return { metCode:category.code, estimatedGrossKcal:{min:gross*(1-uncertainty),max:gross*(1+uncertainty)} };
}
export function createActivity(profile: Profile, date: LocalDate, kind: ActivityKind, intensity: Activity['intensity'], durationMinutes: number, weightKg: number, previous?: Activity): Activity {
  parseLocalDate(date);
  const age=ageOn(profile.birthDate,date);
  ensure(age>=19 && age<=59,'Bu hareket tahmini 19–59 yaş kaynağına dayanır; seçilen gün bu kapsamın dışında.');
  const value:Activity={id:previous?.id ?? uuid(),userId:profile.userId,date,kind,intensity,durationMinutes,weightKgAtCalculation:weightKg,...estimateActivity(kind,intensity,durationMinutes,weightKg),methodVersion:'compendium-2024-v1',contributionToBalance:'already-in-baseline',createdAt:previous?.createdAt ?? nowUTC()};
  validateActivity(value); return value;
}
export function validateActivity(value: Activity): void {
  validId(value.id); validId(value.userId); parseLocalDate(value.date); validInstant(value.createdAt);
  ensure(value.methodVersion==='compendium-2024-v1' && value.contributionToBalance==='already-in-baseline','Hareket hesap yöntemi geçersiz.');
  const expected=estimateActivity(value.kind,value.intensity,value.durationMinutes,value.weightKgAtCalculation);
  ensure(value.metCode===expected.metCode && value.estimatedGrossKcal && Math.abs(value.estimatedGrossKcal.min-expected.estimatedGrossKcal.min)<.000001 && Math.abs(value.estimatedGrossKcal.max-expected.estimatedGrossKcal.max)<.000001,'Hareket tahmini girdilerle uyuşmuyor.');
}
export const WEEKDAYS = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'] as const;
export function validateMovementDays(days: PlanVersion['movementDays']): void {
  ensure(Array.isArray(days) && days.length<=7,'Haftada en fazla yedi hareket günü seç.');
  const used=new Set<number>();
  for (const day of days) {
    ensure(Number.isInteger(day.weekday) && day.weekday>=1 && day.weekday<=7 && !used.has(day.weekday),'Hareket günleri geçersiz veya tekrarlı.');
    ensure(Object.hasOwn(ACTIVITY_KINDS,day.kind) && Number.isFinite(day.minutes) && day.minutes>0 && day.minutes<=ACTIVITY_POLICY.maxMinutes,'Hareket planının türünü veya süresini kontrol et.');
    used.add(day.weekday);
  }
}
export function suggestMovement(profile: Profile, weekdays: number[], kinds: ActivityKind[]): PlanVersion['movementDays'] {
  ensure(kinds.length>0,'En az bir sevdiğin hareketi seç.');
  const minutes=profile.baseline.pal<=1.4 ? 15 : profile.baseline.pal<=1.6 ? 20 : 30;
  const days=[...weekdays].sort((a,b)=>a-b).map((weekday,i)=>({weekday:weekday as 1|2|3|4|5|6|7,kind:kinds[i%kinds.length]!,minutes}));
  validateMovementDays(days); return days;
}
