import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database, user, rpc } from "../../scripts/social/db-harness.mjs";
import { CloudRepository } from "../../src/data/cloud.ts";
import { remapSnapshot } from "../../src/social/snapshot.ts";
import { emptySnapshot } from "../../src/social/types.ts";
import { newDay, changeDay } from "../../src/domain/tracking.ts";
import { localDateAt } from "../../src/domain/dates.ts";
let db;
before(async () => {
  db = await database();
});
after(async () => db.close());
async function setup() {
  const id = await user(db);
  await rpc(db, id, "account_save", {
    username: "u_" + id.slice(0, 8),
    name: "Kullanıcı",
  });
  const adapter = {
    call: (action, payload, op) => rpc(db, id, action, payload, op),
  };
  const cloud = new CloudRepository(adapter, id);
  assert.equal((await cloud.getLocalProfile()).ok, true);
  const profile = {
    userId: id,
    birthDate: "2000-08-21",
    heightCm: 180,
    weightKg: 91,
    timeZone: "Europe/Istanbul",
    formulaSex: "male",
    baseline: {
      method: "inclusive-pal-v1",
      pal: 1.4,
      includesLoggedExercise: true,
    },
    automaticPlanEligibility: "out-of-scope",
    updatedAt: new Date().toISOString(),
  };
  const result = await cloud.saveSetup(
    { profile, plan: null, weight: null, expectedProfileUpdatedAt: null },
    { operationId: randomUUID() },
  );
  assert.equal(result.ok, true, result.message);
  return { id, cloud, adapter, profile };
}
test("another cloud adapter reloads persisted days and water; concurrent local writes serialize", async () => {
  const { id, cloud, adapter, profile } = await setup();
  const date = localDateAt(new Date(), profile.timeZone);
  let day = newDay(profile, date, []);
  day = changeDay(day, { type: "total", kcal: 2200 }, false);
  const [saved, water] = await Promise.all([
    cloud.saveDay(day, { operationId: randomUUID(), expectedRevision: 0 }),
    cloud.saveWater(date, 1000, 2500),
  ]);
  assert.equal(saved.ok, true, saved.message);
  assert.equal(water, true);
  const other = new CloudRepository(adapter, id);
  assert.equal((await other.getLocalProfile()).value.userId, id);
  assert.equal(other.data.days[0].calories.totalKcal, 2200);
  assert.equal(other.getWater().days[date], 1000);
});
test("stale second device gets conflict without overwriting recent writes", async () => {
  const { id, cloud, adapter, profile } = await setup();
  const other = new CloudRepository(adapter, id);
  await other.getLocalProfile();
  const date = localDateAt(new Date(), profile.timeZone);
  await cloud.saveWater(date, 750, 2500);
  await assert.rejects(other.saveWater(date, 500, 2500), /başka cihazda/);
  await other.getLocalProfile();
  assert.equal(other.getWater().days[date], 750);
});
test("lost successful response retries exact request and operation without duplicate mutation", async () => {
  const { id, cloud, adapter, profile } = await setup();
  let lost = true;
  const unreliable = {
    call: async (action, payload, op) => {
      const result = await adapter.call(action, payload, op);
      if (action === "snapshot_save" && lost) {
        lost = false;
        throw new Error("Bağlantı koptu");
      }
      return result;
    },
  };
  const c = new CloudRepository(unreliable, id);
  await c.getLocalProfile();
  const date = localDateAt(new Date(), profile.timeZone);
  let day = changeDay(
    newDay(profile, date, []),
    { type: "total", kcal: 2000 },
    false,
  );
  const ctx = { operationId: randomUUID(), expectedRevision: 0 };
  assert.equal((await c.saveDay(day, ctx)).ok, false);
  const altered=changeDay(day,{type:"total",kcal:2500},false);
  assert.equal((await c.saveDay(altered,ctx)).code,"conflict");
  const result = await c.saveDay(day, ctx);
  assert.equal(result.ok, true, result.message);
  assert.equal(c.data.days.length, 1);
  assert.equal(c.revision, cloud.revision + 1);
});
test("explicit import remaps owners and preserves plan references; nonempty accounts cannot overwrite", async () => {
  const { cloud, profile } = await setup();
  const source = emptySnapshot();
  source.profile = { ...profile, userId: randomUUID() };
  source.catPreferences = {
    userId: source.profile.userId,
    name: "Zilli",
    reducedMotion: true,
    sceneMode: "static",
    soundEnabled: false,
  };
  const date = localDateAt(new Date(), profile.timeZone);
  source.days = [newDay(source.profile, date, [])];
  const remapped = remapSnapshot(source, profile.userId);
  assert.equal(remapped.days[0].userId, profile.userId);
  assert.equal(remapped.catPreferences.userId, profile.userId);
  assert.equal(source.days[0].userId, source.profile.userId);
  await assert.rejects(cloud.importData(remapped), /zaten kayıt/);
  const id = await user(db);
  await rpc(db, id, "account_save", {
    username: "u_" + id.slice(0, 8),
    name: "Yeni",
  });
  const fresh = new CloudRepository(
    { call: (a, p, o) => rpc(db, id, a, p, o) },
    id,
  );
  await fresh.getLocalProfile();
  await fresh.importData(remapSnapshot(source, id));
  const loaded = await fresh.getLocalProfile();
  assert.equal(loaded.value.userId, id);
  assert.equal(fresh.data.days[0].id, source.days[0].id);
});
