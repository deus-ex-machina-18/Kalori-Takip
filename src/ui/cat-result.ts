import type { DaySummary } from '../domain/models.ts';

export type CatClip = 'idle' | 'target-met' | 'above-target' | 'above-maintenance' | 'below-target';
export type CatResult = { clip: CatClip; message: string };
const kcal = (value: number) => Math.abs(value).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

/** Presentation only: thresholds and differences come from the existing energy engine. */
export function catResult(summary: DaySummary): CatResult {
  if (summary.kind === 'incomplete') return { clip: 'idle', message: 'Gün devam ediyor.' };
  if (summary.kind === 'unplanned') return { clip: 'idle', message: 'Gün kaydedildi. Karşılaştırmak için bir plan gerekli.' };
  const difference = summary.targetDifferenceKcal, deficit = summary.estimatedDeficitKcal;
  if (difference < 0) return { clip: 'below-target', message: `Planın altında kaldın: −${kcal(difference)} kcal.` };
  // Retain the engine's care priority, including a high deficit at a range boundary.
  if (summary.catState === 'care') return { clip: 'below-target', message: 'Tahmini açık yüksek. Beslenme planını gözet.' };
  if (difference === 0) return { clip: 'target-met', message: 'Plan tuttu. Bugün tamam.' };
  if (deficit > 0) return { clip: 'above-target', message: `Hedef +${kcal(difference)}. Koruma tahmininin hâlâ ${kcal(deficit)} kcal altındasın.` };
  return { clip: 'above-maintenance', message: deficit < 0
    ? `Bugün fazla kaçtı. Koruma tahmininin +${kcal(deficit)} kcal üstündesin.`
    : `Hedef +${kcal(difference)}. Koruma tahminindesin.` };
}
