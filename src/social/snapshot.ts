import type { Snapshot } from "./types.ts";
import {
  validateProfile,
  validateDay,
  validatePlan,
  validateMeasurement,
} from "../domain/tracking.ts";
import { validateActivity } from "../domain/activity.ts";
import { validateCatPreferences } from "../domain/cat.ts";
export function validateSnapshot(d: Snapshot, userId: string): void {
  if (d.profile) {
    validateProfile(d.profile);
    if (d.profile.userId !== userId)
      throw new Error("Profil başka hesaba ait.");
  }
  for (const [records, validate] of [
    [d.plans, validatePlan],
    [d.days, validateDay],
    [d.activities, validateActivity],
    [d.weights, validateMeasurement],
  ] as const) {
    const ids = new Set<string>();
    for (const record of records) {
      (validate as (v: unknown) => void)(record);
      if (record.userId !== userId || ids.has(record.id))
        throw new Error("Kayıt sahipliği veya kimliği geçersiz.");
      ids.add(record.id);
    }
  }
  if (d.catPreferences) {
    validateCatPreferences(d.catPreferences);
    if (d.catPreferences.userId !== userId)
      throw new Error("Kedi ayarı başka hesaba ait.");
  }
  if (
    !Number.isFinite(d.water.target) ||
    d.water.target < 250 ||
    d.water.target > 10000
  )
    throw new Error("Su hedefi geçersiz.");
  for (const [day, amount] of Object.entries(d.water.days))
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 20000
    )
      throw new Error("Su kaydı geçersiz.");
}
/** Import is explicit, into an empty cloud account only; record/plan IDs remain linked. */
export function remapSnapshot(source: Snapshot, userId: string): Snapshot {
  const d = structuredClone(source);
  if (d.profile) d.profile.userId = userId;
  for (const records of [d.plans, d.days, d.activities, d.weights])
    for (const record of records) record.userId = userId;
  if (d.catPreferences) d.catPreferences.userId = userId;
  validateSnapshot(d, userId);
  return d;
}
