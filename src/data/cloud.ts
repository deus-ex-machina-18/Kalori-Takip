import type { IndexedDbRepository, SetupWrite } from "./indexeddb.ts";
import type { Result, WriteContext } from "../domain/contracts.ts";
import type {
  Activity,
  CatPreferences,
  DayLog,
  LocalDate,
  Profile,
  WeightMeasurement,
} from "../domain/models.ts";
import {
  engine,
  failure,
  planFor,
  success,
  validateDay,
  validateMeasurement,
  validateProfile,
  validatePlan,
  uuid,
} from "../domain/tracking.ts";
import { createActivity, validateActivity } from "../domain/activity.ts";
import { validateCatPreferences } from "../domain/cat.ts";
import { localDateAt } from "../domain/dates.ts";
import type { Rpc, Snapshot, WaterData } from "../social/types.ts";
import { emptySnapshot } from "../social/types.ts";
import { validateSnapshot } from "../social/snapshot.ts";
export type TrackingRepository = Pick<
  IndexedDbRepository,
  | "getLocalProfile"
  | "listPlans"
  | "listDays"
  | "listWeights"
  | "listAllActivities"
  | "getCatPreferences"
  | "saveSetup"
  | "saveDay"
  | "saveActivity"
  | "deleteActivity"
  | "saveWeight"
  | "saveCatPreferences"
> & { readonly scope: "device-local" | "authenticated-cloud" };
const equal = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);
const ensure = (ok: unknown, message: string): void => {
  if (!ok) throw new Error(message);
};
export class CloudRepository implements TrackingRepository {
  readonly scope = "authenticated-cloud" as const;
  data: Snapshot = emptySnapshot();
  revision = 0;
  private tail: Promise<unknown> = Promise.resolve();
  private operations = new Map<
    string,
    {
      signature: string;
      request: { revision: number; data: Snapshot };
      result: unknown;
    }
  >();
  readonly rpc: Rpc;
  readonly userId: string;
  constructor(rpc: Rpc, userId: string) {
    this.rpc = rpc;
    this.userId = userId;
  }
  private async refresh() {
    const r = await this.rpc.call<{
      revision: number;
      data: Partial<Snapshot>;
    }>("snapshot_get");
    const data = { ...emptySnapshot(), ...r.data };
    validateSnapshot(data, this.userId);
    this.data = data;
    this.revision = r.revision;
  }
  async getLocalProfile(): Promise<Result<Profile | null>> {
    try {
      await this.refresh();
      return success(this.data.profile);
    } catch (e) {
      return failure("storage", (e as Error).message);
    }
  }
  async listPlans(id: string) {
    return this.read(id, this.data.plans);
  }
  async listDays(id: string, from: LocalDate, to: LocalDate) {
    return this.read(
      id,
      this.data.days
        .filter((d) => d.date >= from && d.date <= to)
        .sort((a, b) => b.date.localeCompare(a.date)),
    );
  }
  async listWeights(id: string) {
    return this.read(id, this.data.weights);
  }
  async listAllActivities(id: string) {
    return this.read(id, this.data.activities);
  }
  async getCatPreferences(id: string) {
    return this.read(id, this.data.catPreferences);
  }
  private read<T>(id: string, data: T): Result<T> {
    return id === this.userId
      ? success(structuredClone(data))
      : failure("unauthorized", "Bu hesaba erişimin yok.");
  }
  private write<T>(
    id: string,
    ctx: WriteContext,
    payload: unknown,
    mutate: (d: Snapshot) => T,
  ): Promise<Result<T>> {
    const task = async (): Promise<Result<T>> => {
      try {
        ensure(id === this.userId, "Bu hesaba yazamazsın.");
        const signature = JSON.stringify({ id, ctx, payload });
        let operation = this.operations.get(ctx.operationId);
        if (operation && operation.signature !== signature)
          return failure(
            "conflict",
            "Aynı işlem kimliği farklı veri için kullanılamaz.",
          );
        if (!operation) {
          const d = structuredClone(this.data);
          const result = mutate(d);
          validateSnapshot(d, id);
          operation = {
            signature,
            request: { revision: this.revision, data: d },
            result,
          };
          this.operations.set(ctx.operationId, operation);
        }
        const r = await this.rpc.call<{ revision: number; data: Snapshot }>(
          "snapshot_save",
          operation.request,
          ctx.operationId,
        );
        validateSnapshot(r.data, id);
        if (r.revision >= this.revision) {
          this.data = r.data;
          this.revision = r.revision;
        }
        if (this.operations.size > 20)
          this.operations.delete(this.operations.keys().next().value!);
        return success(operation.result as T);
      } catch (e) {
        return failure(
          (e as { code?: string }).code === "40001" ? "conflict" : "storage",
          (e as Error).message,
        );
      }
    };
    const result = this.tail.then(task, task);
    this.tail = result;
    return result;
  }
  async importData(data: Snapshot) {
    ensure(
      !this.data.profile &&
        !this.data.days.length &&
        !this.data.activities.length &&
        !this.data.plans.length,
      "Bulut hesabında zaten kayıt var. Otomatik birleştirme yapılmaz.",
    );
    const r = await this.write(
      this.userId,
      { operationId: uuid() },
      data,
      (d) => {
        Object.assign(d, structuredClone(data));
        return true;
      },
    );
    if (!r.ok) throw new Error(r.message);
  }
  saveSetup(input: SetupWrite, ctx: WriteContext): Promise<Result<SetupWrite>> {
    return this.write(input.profile.userId, ctx, input, (d) => {
      const p = input.profile;
      validateProfile(p);
      const old = d.profile;
      ensure(
        (old?.updatedAt ?? null) === input.expectedProfileUpdatedAt,
        "Profil başka cihazda değişti.",
      );
      ensure(
        !old || p.updatedAt > old.updatedAt,
        "Profil sürümü güncel değil.",
      );
      const today = localDateAt(new Date(), p.timeZone);
      if (input.plan) {
        const plan = input.plan;
        validatePlan(plan);
        const latest = [...d.plans].sort((a, b) =>
          b.effectiveFrom.localeCompare(a.effectiveFrom),
        )[0];
        ensure(
          plan.userId === p.userId &&
            plan.previousVersionId === (latest?.id ?? null),
          "Plan geçmişi değişti.",
        );
        ensure(
          !old ? plan.effectiveFrom === today : plan.effectiveFrom > today,
          "Plan başlangıcı geçersiz.",
        );
        ensure(
          !latest || plan.effectiveFrom > latest.effectiveFrom,
          "Plan tarihi zaten kullanılıyor.",
        );
        const calculated = engine.createInitialPlan(p, plan.effectiveFrom, {
          goal: plan.goal,
          targetWeightKg: plan.targetWeightKg,
          calorieRangeKcal: plan.calorieRangeKcal,
        });
        ensure(calculated.ok, "Plan hesabı geçersiz.");
        if (calculated.ok)
          ensure(
            Math.abs(
              calculated.value.estimatedMaintenanceKcal -
                plan.estimatedMaintenanceKcal,
            ) < 0.001 && equal(plan.baseline, p.baseline),
            "Plan profil hesabıyla uyuşmuyor.",
          );
        d.plans.push(plan);
      }
      if (input.weight) {
        validateMeasurement(input.weight);
        ensure(
          input.weight.userId === p.userId && input.weight.date <= today,
          "Kilo kaydı geçersiz.",
        );
        d.weights.push(input.weight);
      }
      d.profile = p;
      return input;
    });
  }
  saveDay(day: DayLog, ctx: WriteContext): Promise<Result<DayLog>> {
    return this.write(day.userId, ctx, day, (d) => {
      validateDay(day);
      const old = d.days.find((x) => x.date === day.date),
        p = d.profile;
      ensure(p, "Önce profilini oluştur.");
      ensure(
        ctx.expectedRevision === (old?.revision ?? 0) &&
          day.revision === (old?.revision ?? 0) + 1,
        "Günün sürümü değişti.",
      );
      ensure(
        day.date <= localDateAt(new Date(), day.timeZone),
        "Gelecek gün kaydedilemez.",
      );
      if (old) {
        ensure(
          day.id === old.id &&
            day.planVersionId === old.planVersionId &&
            day.timeZone === old.timeZone,
          "Günün kimliği, planı ve saat dilimi değiştirilemez.",
        );
        ensure(
          !(
            old.status === "completed" &&
            !equal(day.calories, old.calories) &&
            day.status === "completed"
          ),
          "Düzenlenen gün yeniden onaylanmalı.",
        );
      } else {
        ensure(
          !d.days.some((x) => x.id === day.id),
          "Kayıt kimliği kullanılıyor.",
        );
        ensure(
          day.planVersionId ===
            (p!.automaticPlanEligibility === "eligible"
              ? (planFor(d.plans, day.date)?.id ?? null)
              : null) && day.timeZone === p!.timeZone,
          "Plan veya profil değişti.",
        );
      }
      d.days = d.days.filter((x) => x.id !== day.id);
      d.days.push(day);
      return day;
    });
  }
  saveActivity(a: Activity, ctx: WriteContext): Promise<Result<Activity>> {
    return this.write(a.userId, ctx, a, (d) => {
      validateActivity(a);
      const old = d.activities.find((x) => x.id === a.id);
      ensure(
        ctx.expectedActivity !== undefined &&
          equal(old ?? null, ctx.expectedActivity),
        "Hareketin sürümü değişti.",
      );
      ensure(d.profile, "Önce profilini oluştur.");
      ensure(
        a.date <= localDateAt(new Date(), d.profile!.timeZone),
        "Hareket gelecekte olamaz.",
      );
      ensure(
        !old || (a.date === old.date && a.createdAt === old.createdAt),
        "Hareket kimliği değiştirilemez.",
      );
      createActivity(
        d.profile!,
        a.date,
        a.kind,
        a.intensity,
        a.durationMinutes,
        a.weightKgAtCalculation,
        old,
      );
      d.activities = d.activities.filter((x) => x.id !== a.id);
      d.activities.push(a);
      return a;
    });
  }
  deleteActivity(
    id: string,
    key: string,
    ctx: WriteContext,
  ): Promise<Result<void>> {
    return this.write(id, ctx, { key }, (d) => {
      const old = d.activities.find((x) => x.id === key);
      ensure(
        old && equal(old, ctx.expectedActivity),
        "Hareket değişti veya silindi.",
      );
      d.activities = d.activities.filter((x) => x.id !== key);
    });
  }
  saveWeight(
    w: WeightMeasurement,
    ctx: WriteContext,
  ): Promise<Result<WeightMeasurement>> {
    return this.write(w.userId, ctx, w, (d) => {
      validateMeasurement(w);
      ensure(
        d.profile && !d.weights.some((x) => x.id === w.id),
        "Profil yok veya ölçüm kimliği kullanılıyor.",
      );
      ensure(
        w.date <= localDateAt(new Date(), d.profile!.timeZone),
        "Gelecek kilo kaydı olamaz.",
      );
      d.weights.push(w);
      return w;
    });
  }
  saveCatPreferences(
    p: CatPreferences,
    ctx: WriteContext,
  ): Promise<Result<CatPreferences>> {
    return this.write(p.userId, ctx, p, (d) => {
      validateCatPreferences(p);
      ensure(
        d.profile &&
          ctx.expectedCatPreferences !== undefined &&
          equal(d.catPreferences, ctx.expectedCatPreferences),
        "Kedi ayarlarının sürümü değişti.",
      );
      d.catPreferences = p;
      return p;
    });
  }
  async saveWater(
    date: string,
    amount: number,
    target: number,
  ): Promise<boolean> {
    const r = await this.write(
      this.userId,
      { operationId: uuid() },
      { date, amount, target },
      (d) => {
        ensure(d.profile, "Önce profilini oluştur.");
        ensure(
          date <= localDateAt(new Date(), d.profile!.timeZone),
          "Gelecek su kaydı olamaz.",
        );
        d.water.target = target;
        d.water.days[date] = amount;
        return true;
      },
    );
    if (!r.ok) throw new Error(r.message);
    return true;
  }
  getWater(): WaterData {
    return structuredClone(this.data.water);
  }
}
