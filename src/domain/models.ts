/** V1 contract. Numbers are kg, cm, minutes and kcal. Device-local persistence; R2 core and R3 activity/plan flows. */
export type LocalDate = string & { readonly __localDate: unique symbol };
export type UTCInstant = string & { readonly __utcInstant: unique symbol };
export type UserId = string;
export type RecordId = string;
export type FormulaSex = "male" | "female" | "not-provided";
export type ActivityBaseline = {
  method: "inclusive-pal-v1";
  pal: number;
  includesLoggedExercise: true;
};
export interface Profile {
  userId: UserId;
  birthDate: LocalDate;
  heightCm: number;
  weightKg: number;
  formulaSex: FormulaSex;
  timeZone: string;
  baseline: ActivityBaseline;
  automaticPlanEligibility: "eligible" | "out-of-scope" | "not-assessed";
  updatedAt: UTCInstant;
}
export interface PlanVersion {
  id: RecordId;
  userId: UserId;
  previousVersionId: RecordId | null;
  goal: "lose" | "maintain";
  targetWeightKg: number | null;
  calorieRangeKcal: { min: number; max: number };
  estimatedMaintenanceKcal: number;
  baseline: ActivityBaseline;
  movementDays: Array<{
    weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    kind: ActivityKind;
    minutes: number;
  }>;
  reason: "initial" | "user-edit" | "weekly-review" | "maintenance-transition";
  effectiveFrom: LocalDate;
  createdAt: UTCInstant;
  formulaVersion: "mifflin-inclusive-pal-v1";
  safetyPolicyVersion: "guardrails-v1";
}
export interface CalorieEntry {
  id: RecordId;
  kcal: number;
  createdAt: UTCInstant;
}
type RecordedCalories =
  | { mode: "total"; totalKcal: number }
  | { mode: "entries"; entries: CalorieEntry[] };
interface DayBase {
  id: RecordId;
  userId: UserId;
  date: LocalDate;
  timeZone: string;
  planVersionId: RecordId | null;
  revision: number;
  updatedAt: UTCInstant;
}
export type DayLog = DayBase &
  (
    | { status: "missing"; calories: null; completedAt: null }
    | { status: "partial"; calories: RecordedCalories; completedAt: null }
    | {
        status: "completed";
        calories: RecordedCalories;
        completedAt: UTCInstant;
      }
  );
export type ActivityKind = "walk" | "run" | "cycle" | "strength";
export interface Activity {
  id: RecordId;
  userId: UserId;
  date: LocalDate;
  kind: ActivityKind;
  durationMinutes: number;
  intensity: "light" | "moderate" | "vigorous";
  estimatedGrossKcal: { min: number; max: number };
  methodVersion: "compendium-2024-v1";
  metCode: string;
  weightKgAtCalculation: number;
  contributionToBalance: "already-in-baseline";
  createdAt: UTCInstant;
}
export interface WeightMeasurement {
  id: RecordId;
  userId: UserId;
  date: LocalDate;
  measuredAt: UTCInstant;
  weightKg: number;
  updatedAt: UTCInstant;
}
export interface CatPreferences {
  userId: UserId;
  name: string;
  reducedMotion: boolean;
  sceneMode: "auto" | "static";
  soundEnabled: boolean;
}
export interface RewardLedger {
  id: RecordId;
  userId: UserId;
  eventKey: string;
  rewardId: string;
  earnedAt: UTCInstant;
}
export interface NotificationPreferences {
  userId: UserId;
  enabled: boolean;
  permission: "unknown" | "granted" | "denied";
  timeZone: string;
  localTime: string;
  quietHours: { start: string; end: string };
  channel: "in-app" | "push";
}
export type CatState =
  "neutral" | "care" | "encouraging" | "celebrate-record" | "celebrate-range";
export type DaySummary =
  | {
      kind: "incomplete";
      status: "missing" | "partial";
      provisionalIntakeKcal: number | null;
      catState: "neutral";
    }
  | { kind: "unplanned"; intakeKcal: number; catState: "neutral" }
  | {
      kind: "complete";
      intakeKcal: number;
      targetDifferenceKcal: number;
      estimatedDeficitKcal: number;
      catState: CatState;
      formulaVersion: PlanVersion["formulaVersion"];
    };
