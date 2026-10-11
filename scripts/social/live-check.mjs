// Opt-in acceptance against a dedicated live project. Credentials stay in an
// ignored local fixture file; the report contains no tokens, emails or records.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { CloudRepository } from "../../src/data/cloud.ts";
import { localDateAt } from "../../src/domain/dates.ts";
import { newDay, changeDay } from "../../src/domain/tracking.ts";
import { fixtureFetch } from "./fixture-fetch.mjs";

const path = process.env.KALORI_LIVE_FIXTURES_FILE;
if (!path) throw new Error("KALORI_LIVE_FIXTURES_FILE is required; live tests never run by default.");
const fixture = JSON.parse(readFileSync(path, "utf8"));
const config = readFileSync("netlify.toml", "utf8");
const url = config.match(/VITE_SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1];
const key = config.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*"([^"]+)"/)?.[1];
assert.match(url, /^https:\/\/[a-z0-9]+\.supabase\.co$/);
assert.match(key, /^sb_publishable_/);
assert.equal(fixture.users.length, 3);
for (const u of fixture.users) {
  assert.match(u.email, /@example\.invalid$/);
  assert.match(u.username, /^verify_/);
}
const client = () => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: fixtureFetch(new URL(url).origin) },
});
const clients = fixture.users.map(client);
const checks = [];
const record = (s) => { checks.push(s); console.log("PASS " + s); };
const adapter = (c) => ({
  async call(action, payload = {}, operationId) {
    const r = await c.rpc("kalori_rpc", { action, payload, operation_id: operationId ?? null });
    if (r.error) throw Object.assign(new Error(r.error.message), { code: r.error.code });
    return r.data;
  },
});
const apis = clients.map(adapter);
const [a, b, c] = apis;
const [ua, ub, uc] = fixture.users;
const write = (api, action, payload = {}, op = randomUUID()) => api.call(action, payload, op);
try {
  for (const [i, u] of fixture.users.entries()) {
    const login = await clients[i].auth.signInWithPassword({ email: u.email, password: u.password });
    assert.equal(login.error, null, login.error?.message);
    assert.equal(login.data.user.id, u.id);
    const verified = await clients[i].auth.getUser();
    assert.equal(verified.error, null);
    assert.equal(verified.data.user.id, u.id);
    await write(apis[i], "account_save", { username: u.username, name: u.name });
  }
  record("three isolated users receive real Supabase Auth sessions and verified JWT identities");
  const anon = client();
  const anonymous = await anon.rpc("kalori_rpc", { action: "state" });
  assert.ok(anonymous.error);
  const direct = await clients[0].schema("kalori_private").from("snapshots").select("*");
  assert.ok(direct.error);
  record("anonymous RPC and direct private-schema Data API reads are denied");

  await write(a, "unblock", { target: ub.id });
  await write(a, "friend_remove", { target: ub.id });
  await write(a, "friend_request", { query: ub.username });
  await assert.rejects(write(c, "friend_accept", { target: ua.id }));
  await write(b, "friend_accept", { target: ua.id });
  assert.ok((await a.call("state")).friends.some((f) => f.id === ub.id));
  record("friendship requires recipient acceptance; a third user cannot accept");

  const { groupId } = await write(a, "group_create", { name: "LIVE " + fixture.run, zone: "Europe/Istanbul" });
  const invite = await write(a, "invite_create", { groupId });
  await write(b, "invite_redeem", { token: invite.token });
  await write(b, "invite_redeem", { token: invite.token });
  let state = await a.call("state");
  assert.equal(state.groups.find((g) => g.id === groupId).members.length, 2);
  assert.equal(state.invites.find((i) => i.id === invite.id).uses, 1);
  await assert.rejects(write(c, "member_role", { groupId, target: uc.id, role: "owner" }));
  await write(a, "invite_revoke", { id: invite.id });
  await assert.rejects(write(c, "invite_redeem", { token: invite.token }));
  record("group invite replay is idempotent; revoked tokens and outsider role escalation are rejected");

  const profile = {
    userId: ua.id, birthDate: "2000-08-21", heightCm: 180, weightKg: 91,
    timeZone: "Europe/Istanbul", formulaSex: "male",
    baseline: { method: "inclusive-pal-v1", pal: 1.4, includesLoggedExercise: true },
    automaticPlanEligibility: "out-of-scope", updatedAt: new Date().toISOString(),
  };
  const cloud = new CloudRepository(a, ua.id);
  const loaded = await cloud.getLocalProfile();
  assert.equal(loaded.ok, true, loaded.message);
  // An interrupted acceptance run may already have a fixture profile/day.
  // Resume through the same production version checks, without database resets.
  const setup = await cloud.saveSetup({ profile, plan: null, weight: null, expectedProfileUpdatedAt: loaded.value?.updatedAt ?? null }, { operationId: randomUUID() });
  assert.equal(setup.ok, true, setup.message);
  const today = localDateAt(new Date(), profile.timeZone);
  const previousDay = cloud.data.days.find((d) => d.date === today);
  let day;
  if (previousDay) {
    assert.equal(previousDay.calories?.mode, "total");
    assert.equal(previousDay.calories.totalKcal, 2200);
    assert.equal(previousDay.status, "completed");
    day = { ...previousDay, revision: previousDay.revision + 1, updatedAt: new Date().toISOString() };
  } else {
    day = changeDay(newDay(profile, today, []), { type: "total", kcal: 2200 }, false);
    day = changeDay(day, { type: "complete" }, false);
  }
  const saved = await cloud.saveDay(day, { operationId: randomUUID(), expectedRevision: previousDay?.revision ?? 0 });
  assert.equal(saved.ok, true, saved.message);
  const second = new CloudRepository(a, ua.id);
  await second.getLocalProfile();
  assert.equal(second.data.days[0].calories.totalKcal, 2200);
  await cloud.saveWater(today, 1000, 2500);
  await assert.rejects(second.saveWater(today, 500, 2500), /başka cihazda/);
  await second.getLocalProfile();
  assert.equal(second.getWater().days[today], 1000);
  record("real cloud repository persists calorie/water records; stale device writes cannot overwrite");

  await write(a, "prefs_save", { enabled: true, audience: "selected", ids: [ub.id], fields: ["record", "water"] });
  let friend = (await b.call("state")).friends.find((f) => f.id === ua.id);
  assert.deepEqual(Object.keys(friend.summary).sort(), ["record", "water"]);
  assert.equal(friend.summary.record, "completed");
  await write(a, "prefs_save", { enabled: false, audience: "selected", ids: [ub.id], fields: ["record", "water"] });
  friend = (await b.call("state")).friends.find((f) => f.id === ua.id);
  assert.deepEqual(friend.summary, {});
  record("only selected summary fields are returned; turning sharing off revokes later reads");

  const { challengeId } = await write(a, "challenge_create", { groupId, name: "Su kabulü", kind: "water", mode: "race", starts: today, duration: 3, target: 1 });
  await write(a, "challenge_join", { challengeId });
  await write(b, "challenge_join", { challengeId });
  await assert.rejects(write(c, "challenge_join", { challengeId }));
  await cloud.saveWater(today, 2500, 2500);
  await cloud.saveWater(today, 2500, 2500);
  const challenge = (await b.call("state")).challenges.find((x) => x.id === challengeId);
  assert.equal(challenge.scores.find((x) => x.id === ua.id).days, 1);
  assert.equal(challenge.scores.find((x) => x.id === ua.id).target, 2500);
  record("challenge points come from saved water; repeats do not add points; outsiders cannot join");

  const replay = randomUUID();
  await write(a, "support", { target: ub.id }, replay);
  await write(a, "support", { target: ub.id }, replay);
  await assert.rejects(write(a, "support", { target: uc.id }, replay), /İşlem kimliği/);
  assert.equal((await b.call("state")).notifications.filter((n) => n.kind === "support").length, 1);
  await write(b, "notifications_read");
  assert.ok((await b.call("state")).notifications.every((n) => n.read));
  record("operation replay cannot change payload; support and recipient notification updates work");

  await write(a, "block", { target: ub.id });
  state = await b.call("state");
  assert.ok(!state.friends.some((f) => f.id === ua.id));
  assert.ok(!state.groups.find((g) => g.id === groupId).members.some((m) => m.id === ua.id));
  assert.ok(!state.challenges.find((x) => x.id === challengeId).scores.some((s) => s.id === ua.id));
  record("blocking removes friend, common-group and challenge identity access");
  mkdirSync("artifacts/social-live", { recursive: true });
  writeFileSync("artifacts/social-live/api-verification.json", JSON.stringify({
    checkedAt: new Date().toISOString(), project: new URL(url).hostname.split(".")[0],
    kind: "live Supabase Auth/JWT/Data API/PostgreSQL + production CloudRepository",
    emailDelivery: false, fixtures: "three disposable preconfirmed users", checks,
  }, null, 2));
} finally {
  for (const c of clients) await c.auth.signOut({ scope: "global" });
}
