import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database, user, rpc } from "../../scripts/social/db-harness.mjs";
let db;
before(async () => {
  db = await database();
});
after(async () => {
  await db.close();
});
async function account() {
  const id = await user(db);
  await rpc(db, id, "account_save", {
    username: "u_" + id.slice(0, 8),
    name: "Kullanıcı",
  });
  return id;
}
function snapshot(id) {
  return {
    profile: {
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
    },
    plans: [],
    days: [],
    activities: [],
    weights: [],
    catPreferences: null,
    water: { target: 2500, days: {} },
  };
}
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(
    new Date(),
  );
async function group(owner, member) {
  const { groupId } = await rpc(db, owner, "group_create", {
    name: "Özel grup",
  });
  const { token } = await rpc(db, owner, "invite_create", { groupId });
  if (member) await rpc(db, member, "invite_redeem", { token });
  return groupId;
}
async function friends(a, b) {
  await rpc(db, a, "friend_request", { target: b });
  await rpc(db, b, "friend_accept", { target: a });
}
async function save(id, data, revision = 0, operationId) {
  return rpc(db, id, "snapshot_save", { data, revision }, operationId);
}

test("anonymous RPC, absent identity and direct table reads are rejected", async () => {
  await assert.rejects(rpc(db, null, "state"), /Oturum/);
  await db.exec("set role anon");
  try {
    await assert.rejects(
      db.query("select public.kalori_rpc('state')"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
  await db.exec("set role authenticated");
  try {
    await assert.rejects(
      db.query("select * from kalori_private.snapshots"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select kalori_private.card(gen_random_uuid())"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
test("only requested recipient can accept; duplicate request does not create friendship twice", async () => {
  const a = await account(),
    b = await account(),
    c = await account();
  await rpc(db, a, "friend_request", { target: b });
  await assert.rejects(rpc(db, c, "friend_accept", { target: a }), /geçerli/);
  await rpc(db, a, "friend_request", { target: b });
  await rpc(db, b, "friend_accept", { target: a });
  assert.equal((await rpc(db, a, "state")).friends.length, 1);
  assert.equal((await rpc(db, c, "state")).friends.length, 0);
});
test("snapshot ownership, CAS and operation replay protect cross-account writes and lost updates", async () => {
  const a = await account(),
    b = await account(),
    d = snapshot(a),
    op = randomUUID();
  const r = await save(a, d, 0, op);
  assert.equal(r.revision, 1);
  assert.equal((await save(a, d, 0, op)).revision, 1);
  await assert.rejects(
    save(a, { ...d, water: { target: 3000, days: {} } }, 0, op),
    /başka veri/,
  );
  await assert.rejects(save(a, d, 0), /başka cihazda/);
  await assert.rejects(save(b, d), /başka hesaba/);
  assert.deepEqual((await rpc(db, b, "snapshot_get")).data, {});
});
test("friend privacy only returns selected fields, and turning off revokes API access", async () => {
  const a = await account(),
    b = await account(),
    c = await account();
  await friends(a, b);
  await friends(a, c);
  const d = snapshot(a);
  d.weights = [{ id: randomUUID(), userId: a, date: today(), weightKg: 90 }];
  await save(a, d);
  await rpc(db, a, "prefs_save", {
    enabled: true,
    audience: "selected",
    ids: [b],
    fields: ["weight"],
  });
  assert.deepEqual((await rpc(db, b, "state")).friends[0].summary, {
    weight: 90,
  });
  assert.deepEqual((await rpc(db, c, "state")).friends[0].summary, {});
  await rpc(db, a, "prefs_save", {
    enabled: false,
    audience: "friends",
    ids: [],
    fields: ["weight"],
  });
  assert.deepEqual((await rpc(db, b, "state")).friends[0].summary, {});
});
test("group privacy requires current membership and does not grant access to private snapshots", async () => {
  const a = await account(),
    b = await account(),
    c = await account();
  const gid = await group(a, b);
  const d = snapshot(a);
  d.water.days[today()] = 3000;
  await save(a, d);
  await rpc(db, a, "prefs_save", {
    enabled: true,
    audience: "groups",
    ids: [gid],
    fields: ["water"],
  });
  assert.deepEqual(
    (await rpc(db, b, "state")).groups[0].members.find((x) => x.id === a)
      .summary,
    { water: true },
  );
  assert.equal((await rpc(db, c, "state")).groups.length, 0);
  await rpc(db, a, "member_remove", { groupId: gid, target: b });
  assert.equal((await rpc(db, b, "state")).groups.length, 0);
});
test("blocked users cannot request friendship or see each other in common groups; unblocking preserves other blocks", async () => {
  const a = await account(),
    b = await account(),
    c = await account(),
    gid = await group(a, b);
  const inv = await rpc(db, a, "invite_create", { groupId: gid });
  await rpc(db, c, "invite_redeem", { token: inv.token });
  await friends(a, b);
  await rpc(db, a, "block", { target: b });
  await rpc(db, a, "block", { target: c });
  await assert.rejects(
    rpc(db, b, "friend_request", { target: a }),
    /gönderilemiyor/,
  );
  assert.equal(
    (await rpc(db, b, "state")).groups[0].members.some((x) => x.id === a),
    false,
  );
  assert.equal((await rpc(db, a, "state")).friends.length, 0);
  await rpc(db, a, "unblock", { target: b });
  assert.deepEqual(
    (await rpc(db, a, "state")).blocks.map((p) => p.id),
    [c],
  );
});
test("invites expire, revoke, retain inviter authority and cannot create administrative membership", async () => {
  const a = await account(),
    b = await account(),
    c = await account(),
    gid = await group(a, b);
  await assert.rejects(
    rpc(db, b, "invite_create", { groupId: gid }),
    /oluşturamaz/,
  );
  await assert.rejects(
    rpc(db, c, "member_role", { groupId: gid, target: b, role: "admin" }),
    /erişimin/,
  );
  let inv = await rpc(db, a, "invite_create", { groupId: gid });
  await rpc(db, a, "invite_revoke", { id: inv.id });
  await assert.rejects(
    rpc(db, c, "invite_redeem", { token: inv.token }),
    /geçersiz/,
  );
  inv = await rpc(db, a, "invite_create", { groupId: gid });
  await db.query(
    "update kalori_private.invites set expires_at=now()-interval '1 second' where id=$1",
    [inv.id],
  );
  await assert.rejects(
    rpc(db, c, "invite_redeem", { token: inv.token }),
    /geçersiz/,
  );
  await rpc(db, a, "member_role", { groupId: gid, target: b, role: "admin" });
  inv = await rpc(db, b, "invite_create", { groupId: gid });
  await rpc(db, a, "member_role", { groupId: gid, target: b, role: "member" });
  await assert.rejects(
    rpc(db, c, "invite_redeem", { token: inv.token }),
    /yetkisi/,
  );
});
test("friend link creates a pending request; repeated redemption cannot spend uses twice", async () => {
  const a = await account(),
    b = await account(),
    inv = await rpc(db, a, "invite_create", {});
  await rpc(db, b, "invite_redeem", { token: inv.token });
  await rpc(db, b, "invite_redeem", { token: inv.token });
  assert.equal((await rpc(db, a, "state")).friends.length, 0);
  assert.equal((await rpc(db, a, "state")).requests[0].incoming, true);
  assert.equal((await rpc(db, a, "state")).invites[0].uses, 1);
});
test("challenge scores derive from records, freeze targets, correct a day instead of incrementing, reject outsiders", async () => {
  const a = await account(),
    b = await account(),
    c = await account(),
    gid = await group(a, b);
  let d = snapshot(b);
  await save(b, d);
  const ch = await rpc(db, a, "challenge_create", {
    groupId: gid,
    name: "Su haftası",
    kind: "water",
    mode: "race",
    starts: today(),
    duration: 7,
    target: 1,
  });
  await assert.rejects(
    rpc(db, c, "challenge_join", { challengeId: ch.challengeId }),
    /erişimi/,
  );
  await rpc(db, b, "challenge_join", { challengeId: ch.challengeId });
  d.water.target = 500;
  d.water.days[today()] = 500;
  await save(b, d, 1);
  let score = (await rpc(db, a, "state")).challenges[0].scores[0];
  assert.equal(score.target, 2500);
  assert.equal(score.days, 0);
  d.water.days[today()] = 2600;
  await save(b, d, 2);
  await save(b, d, 3);
  score = (await rpc(db, a, "state")).challenges[0].scores[0];
  assert.equal(score.days, 1);
  d.water.days[today()] = 1000;
  await save(b, d, 4);
  assert.equal((await rpc(db, a, "state")).challenges[0].scores[0].days, 0);
  await rpc(db, a, "member_remove", { groupId: gid, target: b });
  assert.equal((await rpc(db, b, "state")).challenges.length, 0);
});
test("past challenge scoring freezes after correction period and closed challenges reject new joins", async () => {
  const a = await account(),
    b = await account(),
    gid = await group(a, b);
  const d = snapshot(b);
  d.water.days[today()] = 2600;
  await save(b, d);
  const { challengeId } = await rpc(db, a, "challenge_create", {
    groupId: gid,
    name: "Gün",
    kind: "water",
    mode: "together",
    starts: today(),
    duration: 1,
    target: 1,
  });
  await rpc(db, b, "challenge_join", { challengeId });
  await db.query(
    "update kalori_private.challenges set starts=current_date-4,ends=current_date-3 where id=$1",
    [challengeId],
  );
  await assert.rejects(
    rpc(db, a, "challenge_join", { challengeId }),
    /Katılım süresi/,
  );
  d.water.days = {};
  await save(b, d, 1);
  assert.equal((await rpc(db, a, "state")).challenges[0].scores[0].days, 1);
});
test("notifications belong to recipient; support is limited to once per day", async () => {
  const a = await account(),
    b = await account(),
    c = await account();
  await friends(a, b);
  await rpc(db, a, "support", { target: b });
  await rpc(db, a, "support", { target: b });
  assert.equal(
    (await rpc(db, b, "state")).notifications.filter(
      (x) => x.kind === "support",
    ).length,
    1,
  );
  assert.equal((await rpc(db, c, "state")).notifications.length, 0);
  await rpc(db, b, "notifications_read");
  assert.equal(
    (await rpc(db, b, "state")).notifications.every((x) => x.read),
    true,
  );
});
test("ownership transfer demotes previous owner and protects current owner", async () => {
  const a = await account(),
    b = await account(),
    gid = await group(a, b);
  await rpc(db, a, "member_role", { groupId: gid, target: b, role: "owner" });
  assert.equal((await rpc(db, b, "state")).groups[0].role, "owner");
  assert.equal((await rpc(db, a, "state")).groups[0].role, "admin");
  await assert.rejects(
    rpc(db, a, "member_remove", { groupId: gid, target: b }),
    /çıkaramaz/,
  );
  await rpc(db, a, "group_leave", { groupId: gid });
  assert.equal((await rpc(db, a, "state")).groups.length, 0);
});
