import type { Activity, DayLog, LocalDate, PlanVersion, WeightMeasurement } from './models.ts';
import { addLocalDays, parseLocalDate } from './dates.ts';
import { engine, intake, representativeWeights, requireValue } from './tracking.ts';

/** Last seven closed local days; missing days never enter an intake average. */
export function reviewWeek(today: LocalDate, days: DayLog[], plans: PlanVersion[], activities: Activity[], weights: WeightMeasurement[], userId: string) {
  parseLocalDate(today);
  const from=addLocalDays(today,-7),to=addLocalDays(today,-1);
  const inWindow=(date: LocalDate)=>date>=from && date<=to;
  const week=days.filter(d=>d.userId===userId && inWindow(d.date));
  const completed=week.filter(d=>d.status==='completed');
  const summaries=completed.map(d=>requireValue(engine.summarizeDay(d,plans.find(p=>p.id===d.planVersionId) ?? null)));
  const samePlan=completed.length===7 && new Set(completed.map(d=>d.date)).size===7 && new Set(completed.map(d=>d.planVersionId)).size===1 && summaries.every(s=>s.kind==='complete');
  const care=summaries.some(s=>s.kind==='complete' && s.catState==='care');
  const movements=activities.filter(a=>a.userId===userId && inWindow(a.date));
  const dailyWeights=representativeWeights(weights.filter(w=>w.userId===userId && inWindow(w.date))).sort((a,b)=>a.date.localeCompare(b.date));
  const first=dailyWeights[0],last=dailyWeights.at(-1);
  const observedWeightChange=first && last && last.date>=addLocalDays(first.date,3) && dailyWeights.length>=3 ? last.weightKg-first.weightKg : null;
  const eligible=samePlan && !care;
  return {from,to,completed:completed.length,partial:week.filter(d=>d.status==='partial').length,missing:7-week.filter(d=>d.status!=='missing').length,
    averageIntakeKcal:completed.length ? completed.reduce((sum,d)=>sum+intake(d)!,0)/completed.length : null,
    activityCount:movements.length,activityMinutes:movements.reduce((sum,a)=>sum+a.durationMinutes,0),weightDays:dailyWeights.length,observedWeightChange,eligible,
    message:care ? 'Düşük tüketim veya yüksek açık kaydı var. Daha düşük kalori önerilmiyor; beslenme ihtiyacını gözden geçir.' : !samePlan ? 'Plan değerlendirmesi için aynı planla yedi tamamlanmış gün gerekiyor. Eksik veya plansız günlerden hedef değişikliği çıkarılmaz.' : 'Yedi günün kaydı hazır. Planın uygulanabilirliğini gözden geçirebilirsin; bu özet kalori hedefini kendiliğinden değiştirmez.'};
}
