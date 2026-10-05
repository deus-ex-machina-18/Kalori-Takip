import type { DataRepository, Result, WriteContext } from '../domain/contracts.ts';
import type { DayLog, LocalDate, PlanVersion, Profile, WeightMeasurement } from '../domain/models.ts';
import { localDateAt } from '../domain/dates.ts';
import { engine, failure, planFor, success, validId, validateDay, validateMeasurement, validatePlan, validateProfile } from '../domain/tracking.ts';

type CoreRepository = Pick<DataRepository, 'scope' | 'getProfile' | 'listPlans' | 'getDay' | 'listDays' | 'saveDay' | 'listWeights' | 'saveWeight'>;
export interface SetupWrite { profile: Profile; plan: PlanVersion | null; weight: WeightMeasurement | null; expectedProfileUpdatedAt: string | null; }
class RepositoryError extends Error {
  code: 'validation' | 'conflict' | 'not-found';
  constructor(code: RepositoryError['code'], message: string) { super(message); this.code = code; }
}
const conflict = (message: string): never => { throw new RepositoryError('conflict', message); };
const request = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve,reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
const done = (tx: IDBTransaction): Promise<void> => new Promise((resolve,reject) => { tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error ?? new Error('Kayıt işlemi iptal edildi.')); tx.onerror = () => {}; });
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a],[b]) => a.localeCompare(b))) : item);
}

/** Single-device v1 adapter. No in-memory fallback and no claim of authentication. */
export class IndexedDbRepository implements CoreRepository {
  readonly scope = 'device-local' as const;
  private database: Promise<IDBDatabase> | null = null;
  private factory: IDBFactory | undefined;
  private databaseName: string;
  constructor(factory?: IDBFactory, databaseName = 'kedi-kalori-v1') { this.factory = factory; this.databaseName = databaseName; }
  private open(): Promise<IDBDatabase> {
    if (!this.database) this.database = new Promise<IDBDatabase>((resolve,reject) => {
      const factory = this.factory ?? globalThis.indexedDB;
      if (!factory) { reject(new Error('Bu tarayıcıda IndexedDB kullanılamıyor.')); return; }
      const req = factory.open(this.databaseName, 1);
      let expired = false;
      const timer = setTimeout(() => { expired = true; reject(new Error('Veri deposu açılamadı. Diğer sekmeleri kapatıp tekrar dene.')); }, 5000);
      req.onupgradeneeded = () => {
        const db = req.result;
        db.createObjectStore('profiles', { keyPath: 'userId' });
        const plans = db.createObjectStore('plans', { keyPath: 'id' });
        plans.createIndex('userDate', ['userId','effectiveFrom'], { unique: true }); plans.createIndex('userId', 'userId');
        for (const store of ['days','activities','weights']) {
          const records = db.createObjectStore(store, { keyPath: 'id' });
          records.createIndex('userDate', ['userId','date'], { unique: store === 'days' }); records.createIndex('userId', 'userId');
        }
        db.createObjectStore('catPreferences', { keyPath: 'userId' });
        const rewards = db.createObjectStore('rewards', { keyPath: 'id' });
        rewards.createIndex('userEvent', ['userId','eventKey'], { unique: true }); rewards.createIndex('userId', 'userId');
        db.createObjectStore('notifications', { keyPath: 'userId' });
        const operations = db.createObjectStore('operations', { keyPath: 'operationId' }); operations.createIndex('userId', 'userId');
      };
      req.onsuccess = () => { clearTimeout(timer); if (expired) { req.result.close(); return; } req.result.onversionchange = () => { req.result.close(); this.database = null; }; resolve(req.result); };
      req.onerror = () => { clearTimeout(timer); reject(req.error); };
      req.onblocked = () => { clearTimeout(timer); expired = true; reject(new Error('Veri deposu başka bir sekme tarafından engelleniyor. Diğer sekmeleri kapat.')); };
    }).catch(error => { this.database = null; throw error; });
    return this.database;
  }
  async close(): Promise<void> { const db = await this.open(); db.close(); this.database = null; }
  private async transaction<T>(stores: string[], mode: IDBTransactionMode, action: (tx: IDBTransaction) => Promise<T>): Promise<Result<T>> {
    try {
      const db = await this.open();
      const tx = db.transaction(stores, mode);
      const completion = done(tx);
      try { const result = await action(tx); await completion; return success(result); }
      catch (error) { try { tx.abort(); } catch {} await completion.catch(() => {}); throw error; }
    } catch (error) {
      if (error instanceof RepositoryError) return failure(error.code, error.message);
      return failure('storage', 'Kayıt saklanamadı veya okunamadı. Tarayıcı depolama iznini ve boş alanı kontrol edip tekrar dene.');
    }
  }
  private async read<T>(store: string, key: IDBValidKey, validate?: (value: T) => void): Promise<Result<T | null>> {
    return this.transaction([store], 'readonly', async tx => { const value = await request<T | undefined>(tx.objectStore(store).get(key)); if (value && validate) validate(value); return value ?? null; });
  }
  private async list<T>(store: string, userId: string, validate: (value: T) => void): Promise<Result<T[]>> {
    return this.transaction([store], 'readonly', async tx => { const values = await request<T[]>(tx.objectStore(store).index('userId').getAll(userId)); values.forEach(validate); return values; });
  }
  async getLocalProfile(): Promise<Result<Profile | null>> {
    return this.transaction(['profiles'], 'readonly', async tx => {
      const values = await request<Profile[]>(tx.objectStore('profiles').getAll());
      if (values.length > 1) throw new Error('Yerel pilot tek profil destekler.');
      values.forEach(validateProfile); return values[0] ?? null;
    });
  }
  getProfile(userId: string): Promise<Result<Profile | null>> { return this.read('profiles', userId, validateProfile); }
  listPlans(userId: string): Promise<Result<PlanVersion[]>> { return this.list('plans', userId, validatePlan); }
  getDay(userId: string, date: LocalDate): Promise<Result<DayLog | null>> {
    return this.transaction(['days'], 'readonly', async tx => { const value = await request<DayLog | undefined>(tx.objectStore('days').index('userDate').get([userId,date])); if (value) validateDay(value); return value ?? null; });
  }
  async listDays(userId: string, from: LocalDate, to: LocalDate): Promise<Result<DayLog[]>> {
    const result = await this.list('days', userId, validateDay);
    return result.ok ? success(result.value.filter(day => day.date >= from && day.date <= to).sort((a,b) => b.date.localeCompare(a.date))) : result;
  }
  listWeights(userId: string): Promise<Result<WeightMeasurement[]>> { return this.list('weights', userId, validateMeasurement); }
  private async write<T>(stores: string[], userId: string, payload: unknown, context: WriteContext, action: (tx: IDBTransaction) => Promise<T>): Promise<Result<T>> {
    try { validId(userId); validId(context.operationId); } catch (error) { return failure('validation', (error as Error).message); }
    const signature = canonical({ stores, userId, payload, expectedRevision: context.expectedRevision ?? null });
    return this.transaction([...stores, 'operations'], 'readwrite', async tx => {
      const operations = tx.objectStore('operations');
      const receipt = await request<{ userId: string; signature: string; result: T } | undefined>(operations.get(context.operationId));
      if (receipt) { if (receipt.userId !== userId || receipt.signature !== signature) conflict('Aynı işlem kimliği farklı veriyle kullanılamaz.'); return receipt.result; }
      const result = await action(tx);
      await request(operations.add({ operationId: context.operationId, userId, signature, result })); return result;
    });
  }
  async saveSetup(input: SetupWrite, context: WriteContext): Promise<Result<SetupWrite>> {
    try { validateProfile(input.profile); if (input.plan) validatePlan(input.plan); if (input.weight) validateMeasurement(input.weight); }
    catch (e) { return failure('validation', (e as Error).message); }
    return this.write(['profiles','plans','weights'], input.profile.userId, input, context, async tx => {
      const p = input.profile;
      const profileStore = tx.objectStore('profiles');
      const profiles = await request<Profile[]>(profileStore.getAll());
      const old = profiles.find(v => v.userId === p.userId);
      if (profiles.some(v => v.userId !== p.userId)) conflict('Bu cihazda zaten başka bir profil var.');
      if ((old?.updatedAt ?? null) !== input.expectedProfileUpdatedAt) conflict('Profil başka bir sekmede değişti. Güncel bilgileri yükle.');
      if (old && p.updatedAt <= old.updatedAt) conflict('Profil sürümü güncel değil.');
      const today = localDateAt(new Date(), p.timeZone);
      if (p.birthDate > today) throw new RepositoryError('validation','Doğum tarihi gelecekte olamaz.');
      if (input.plan) {
        const plan = input.plan;
        const plans = await request<PlanVersion[]>(tx.objectStore('plans').index('userId').getAll(p.userId));
        const latest = [...plans].sort((a,b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
        if (plan.userId !== p.userId || plan.previousVersionId !== (latest?.id ?? null)) conflict('Plan geçmişi değişti. Güncel planı yükle.');
        if ((!old && plan.effectiveFrom !== today) || (old && plan.effectiveFrom <= today)) conflict('Yeni plan ilk kayıtta bugün, düzenlemede ileri tarihli başlamalı.');
        if (latest && plan.effectiveFrom <= latest.effectiveFrom) conflict('Bu başlangıç tarihi için zaten bir plan var.');
        const calculated = engine.createInitialPlan(p, plan.effectiveFrom, { goal: plan.goal, targetWeightKg: plan.targetWeightKg, calorieRangeKcal: plan.calorieRangeKcal });
        if (!calculated.ok) throw new RepositoryError('validation',calculated.message);
        if (Math.abs(calculated.value.estimatedMaintenanceKcal - plan.estimatedMaintenanceKcal) > .001 || canonical(plan.baseline) !== canonical(p.baseline)) throw new RepositoryError('validation','Plan profil hesabıyla uyuşmuyor.');
        await request(tx.objectStore('plans').add(plan));
      }
      if (input.weight) {
        if (input.weight.userId !== p.userId || input.weight.date > today) throw new RepositoryError('validation','Kilo kaydının tarihi veya profili geçersiz.');
        await request(tx.objectStore('weights').add(input.weight));
      }
      await request(profileStore.put(p)); return input;
    });
  }
  async saveDay(day: DayLog, context: WriteContext): Promise<Result<DayLog>> {
    try { validateDay(day); } catch (e) { return failure('validation', (e as Error).message); }
    return this.write(['days','profiles','plans'], day.userId, day, context, async tx => {
      const store = tx.objectStore('days');
      const previous = await request<DayLog | undefined>(store.index('userDate').get([day.userId,day.date]));
      if (context.expectedRevision !== (previous?.revision ?? 0)) conflict('Bu gün başka bir sekmede değişti. Güncel kaydı yükle; değişikliğin saklanmadı.');
      if (day.revision !== (previous?.revision ?? 0) + 1) conflict('Günün sürümü geçersiz.');
      const profile = await request<Profile | undefined>(tx.objectStore('profiles').get(day.userId));
      if (!profile) throw new RepositoryError('not-found','Önce profilini oluştur.');
      if (day.date > localDateAt(new Date(), day.timeZone)) throw new RepositoryError('validation','Gelecek gün için kalori kaydı yapılamaz.');
      if (previous) {
        if (day.id !== previous.id || day.planVersionId !== previous.planVersionId || day.timeZone !== previous.timeZone) conflict('Geçmiş günün kimliği, planı ve saat dilimi değiştirilemez.');
        if (previous.status === 'completed' && canonical(day.calories) !== canonical(previous.calories) && day.status === 'completed') throw new RepositoryError('validation','Düzenlenen gün önce kısmi olmalı ve yeniden onaylanmalı.');
      } else {
        if (await request(store.get(day.id))) conflict('Kayıt kimliği başka güne ait.');
        const plans = await request<PlanVersion[]>(tx.objectStore('plans').index('userId').getAll(day.userId));
        const expectedPlan = profile.automaticPlanEligibility === 'eligible' ? planFor(plans,day.date)?.id ?? null : null;
        if (day.planVersionId !== expectedPlan || day.timeZone !== profile.timeZone) conflict('Profil veya plan değişti. Kaydı yeniden yükle.');
      }
      await request(store.put(day)); return day;
    });
  }
  async saveWeight(weight: WeightMeasurement, context: WriteContext): Promise<Result<WeightMeasurement>> {
    try { validateMeasurement(weight); } catch (e) { return failure('validation', (e as Error).message); }
    return this.write(['weights','profiles'], weight.userId, weight, context, async tx => {
      const profile = await request<Profile | undefined>(tx.objectStore('profiles').get(weight.userId));
      if (!profile) throw new RepositoryError('not-found','Önce profilini oluştur.');
      if (weight.date > localDateAt(new Date(),profile.timeZone)) throw new RepositoryError('validation','Kilo tarihi gelecekte olamaz.');
      const store = tx.objectStore('weights');
      // Measurements are append-only in R2: corrections add a new representative.
      if (await request(store.get(weight.id))) conflict('Ölçüm kimliği zaten kullanılıyor.');
      await request(store.add(weight)); return weight;
    });
  }
}
