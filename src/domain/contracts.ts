import type {
  Activity,
  CatPreferences,
  DayLog,
  DaySummary,
  LocalDate,
  NotificationPreferences,
  PlanVersion,
  Profile,
  RecordId,
  RewardLedger,
  UserId,
  WeightMeasurement,
} from "./models.ts";
export type Result<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code:
        | "validation"
        | "conflict"
        | "not-found"
        | "storage"
        | "unauthorized"
        | "out-of-scope";
      message: string;
    };
/** UUID operationId is reused on retries. Expected revision prevents lost updates. */
export interface WriteContext {
  operationId: RecordId;
  expectedRevision?: number;
}
export interface DataRepository {
  readonly scope: "device-local" | "authenticated-cloud";
  getProfile(userId: UserId): Promise<Result<Profile | null>>;
  saveProfile(
    profile: Profile,
    context: WriteContext,
  ): Promise<Result<Profile>>;
  listPlans(userId: UserId): Promise<Result<PlanVersion[]>>;
  appendPlan(
    plan: PlanVersion,
    context: WriteContext,
  ): Promise<Result<PlanVersion>>;
  getDay(userId: UserId, date: LocalDate): Promise<Result<DayLog | null>>;
  listDays(
    userId: UserId,
    from: LocalDate,
    to: LocalDate,
  ): Promise<Result<DayLog[]>>;
  saveDay(day: DayLog, context: WriteContext): Promise<Result<DayLog>>;
  listActivities(userId: UserId, date: LocalDate): Promise<Result<Activity[]>>;
  saveActivity(
    activity: Activity,
    context: WriteContext,
  ): Promise<Result<Activity>>;
  deleteActivity(
    userId: UserId,
    id: RecordId,
    context: WriteContext,
  ): Promise<Result<void>>;
  listWeights(userId: UserId): Promise<Result<WeightMeasurement[]>>;
  saveWeight(
    measurement: WeightMeasurement,
    context: WriteContext,
  ): Promise<Result<WeightMeasurement>>;
  getCatPreferences(userId: UserId): Promise<Result<CatPreferences | null>>;
  saveCatPreferences(
    preferences: CatPreferences,
    context: WriteContext,
  ): Promise<Result<CatPreferences>>;
  listRewards(userId: UserId): Promise<Result<RewardLedger[]>>;
  awardOnce(reward: RewardLedger): Promise<Result<RewardLedger>>;
  getNotificationPreferences(
    userId: UserId,
  ): Promise<Result<NotificationPreferences | null>>;
  saveNotificationPreferences(
    preferences: NotificationPreferences,
    context: WriteContext,
  ): Promise<Result<NotificationPreferences>>;
  exportUserData(userId: UserId): Promise<Result<UserExport>>;
  deleteUserData(userId: UserId, context: WriteContext): Promise<Result<void>>;
}
export interface UserExport {
  schemaVersion: 1;
  profile: Profile | null;
  plans: PlanVersion[];
  days: DayLog[];
  activities: Activity[];
  weights: WeightMeasurement[];
  catPreferences: CatPreferences | null;
  rewards: RewardLedger[];
  notifications: NotificationPreferences | null;
}
/** Round 2 implements this, round 3 adds activities. No AI-generated arithmetic. */
export interface PlanEngine {
  createInitialPlan(
    profile: Profile,
    effectiveFrom: LocalDate,
    options?: PlanOptions,
  ): Result<PlanVersion>;
  summarizeDay(day: DayLog, plan: PlanVersion | null): Result<DaySummary>;
}
export interface PlanOptions {
  goal: "lose" | "maintain";
  targetWeightKg: number | null;
  calorieRangeKcal?: { min: number; max: number };
}
export interface CatScene {
  setState(state: DaySummary): void;
  setReducedMotion(value: boolean): void;
  resetView(): void;
  dispose(): void;
}
