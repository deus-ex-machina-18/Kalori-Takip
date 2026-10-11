import type { PlanVersion } from './models.ts';

export const TIMELINE_POLICY = Object.freeze({ kcalPerKg: 7700, minWeeks: 1, maxWeeks: 156, halfRangeKcal: 50 });

export function validateDuration(weeks: number): void {
  if (!Number.isInteger(weeks) || weeks < TIMELINE_POLICY.minWeeks || weeks > TIMELINE_POLICY.maxWeeks)
    throw new Error('Hedef süresi 1–156 hafta arasında tam sayı olmalı.');
}

/** Planning estimate, not a physiological forecast. Approximate the falling
 * maintenance requirement at the midpoint weight using the existing Mifflin/PAL.
 * This does not model metabolic adaptation, composition, or water weight. */
export function durationCalorieRange(maintenance: number, startKg: number, targetKg: number, pal: number, weeks: number, lowerKcal: number) {
  validateDuration(weeks);
  const lossKg = startKg - targetKg;
  const midpointMaintenance = maintenance - 10 * pal * lossKg / 2;
  const desiredIntake = midpointMaintenance - lossKg * TIMELINE_POLICY.kcalPerKg / (weeks * 7);
  const center = Math.max(lowerKcal, Math.min(maintenance - 1, desiredIntake));
  return {
    min: Math.max(lowerKcal, center - TIMELINE_POLICY.halfRangeKcal),
    max: Math.min(maintenance - 1, center + TIMELINE_POLICY.halfRangeKcal),
  };
}

export function planTimeline(plan: PlanVersion) {
  if (!plan.timeline || plan.goal !== 'lose' || plan.targetWeightKg === null) return null;
  const lossKg = plan.timeline.startingWeightKg - plan.targetWeightKg;
  const midpointMaintenance = plan.estimatedMaintenanceKcal - 10 * plan.baseline.pal * lossKg / 2;
  const averageDeficit = midpointMaintenance - (plan.calorieRangeKcal.min + plan.calorieRangeKcal.max) / 2;
  const estimatedWeeks = averageDeficit > 0 ? lossKg * TIMELINE_POLICY.kcalPerKg / averageDeficit / 7 : null;
  return { requestedWeeks: plan.timeline.requestedWeeks, estimatedWeeks,
    limited: estimatedWeeks === null || estimatedWeeks > plan.timeline.requestedWeeks + 1 };
}
