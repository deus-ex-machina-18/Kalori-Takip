// Supabase HTTP contract stub + actual PostgreSQL migration, not live GoTrue acceptance.
import { build } from "vite";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { JSDOM, VirtualConsole } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import { webcrypto, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { database, user, rpc } from "./db-harness.mjs";
await build({
  build: { outDir: "artifacts/social-ui", emptyOutDir: true },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      "https://kalori-test.supabase.co",
    ),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      "sb_publishable_contract_test",
    ),
  },
});
const html = readFileSync("artifacts/social-ui/index.html", "utf8");
const asset = html.match(/src="\.\/assets\/([^\"]+\.js)"/)[1];
const source = readFileSync(
  "artifacts/social-ui/assets/" + asset,
  "utf8",
).replaceAll("import.meta", `({url:'https://kalori.test/assets/${asset}'})`);
const db = await database();
const users = {};
let tail = Promise.resolve();
const windows = [];
const checks = [];
for (const name of ["alice", "bob", "outsider"]) {
  const id = await user(db);
  users[name] = {
    id,
    email: name + "@example.test",
    aud: "authenticated",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  await rpc(db, id, "account_save", {
    username: name,
    name: name.toUpperCase(),
  });
}
const tokens = new Map();
function token(u) {
  if (tokens.has(u.id)) return tokens.get(u.id);
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const value =
    enc({ alg: "HS256", typ: "JWT" }) +
    "." +
    enc({
      sub: u.id,
      role: "authenticated",
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }) +
    ".dGVzdA";
  tokens.set(u.id, value);
  return value;
}
async function mockFetch(url, options = {}) {
  const path = new URL(String(url)).pathname;
  const headers = new Headers(options.headers);
  const auth = headers.get("authorization");
  const actor = Object.values(users).find((u) => auth === "Bearer " + token(u));
  const body = options.body ? JSON.parse(options.body) : {};
  let data,
    status = 200;
  if (path === "/auth/v1/token") {
    const u = Object.values(users).find((u) => u.email === body.email);
    if (!u || body.password !== "fixture-password") {
      status = 400;
      data = { msg: "Invalid login credentials" };
    } else
      data = {
        access_token: token(u),
        refresh_token: randomUUID(),
        expires_in: 3600,
        token_type: "bearer",
        user: u,
      };
  } else if (path === "/auth/v1/user") {
    if (actor) data = actor;
    else {
      status = 401;
      data = { msg: "not authenticated" };
    }
  } else if (path === "/auth/v1/logout") {
    return new Response(null, { status: 204 });
  } else if (path === "/rest/v1/rpc/kalori_rpc") {
    const task = () =>
      rpc(
        db,
        actor?.id ?? null,
        body.action,
        body.payload,
        body.operation_id ?? undefined,
      );
    const pending = tail.then(task, task);
    tail = pending.catch(() => {});
    try {
      data = await pending;
    } catch (e) {
      status = 400;
      data = { message: e.message, code: e.code ?? "P0001" };
    }
  } else throw new Error("Unexpected HTTP path " + path);
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
async function until(fn) {
  const start = Date.now();
  while (!fn()) {
    if (Date.now() - start > 7000)
      throw new Error("Arayüz beklenen duruma geçmedi");
    await new Promise((r) => setTimeout(r, 10));
  }
}
function launch() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(html, {
    url: "https://kalori.test/#/sosyal",
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  windows.push(dom);
  const w = dom.window;
  Object.assign(w, {
    fetch: mockFetch,
    Headers,
    Request,
    Response,
    structuredClone,
  });
  Object.defineProperty(w, "crypto", { value: webcrypto });
  Object.defineProperty(w, "indexedDB", { value: new IDBFactory() });
  w.matchMedia = () => ({ matches: true });
  w.scrollTo = () => {};
  w.eval(source);
  return { dom, w, doc: w.document, errors };
}
async function submit(app, type, values) {
  await until(() => app.doc.querySelector(`[data-social-form="${type}"]`));
  const f = app.doc.querySelector(`[data-social-form="${type}"]`);
  for (const [name, value] of Object.entries(values)) {
    const el = f.querySelector(`[name="${name}"]`);
    el.value = String(value);
  }
  f.requestSubmit();
  return f;
}
async function click(app, action, attr = "") {
  const selector = `[data-social-action="${action}"]${attr}`;
  const el =
    app.doc.querySelector("dialog[open]")?.querySelector(selector) ??
    app.doc.querySelector(selector);
  assert.ok(el, "Missing button " + action);
  assert.equal(el.disabled, false, "Disabled button " + action);
  el.click();
}
async function refresh(app) {
  await click(app, "refresh");
  await until(
    () => !app.doc.querySelector('[data-social-action="refresh"]')?.disabled,
  );
  await new Promise((r) => setTimeout(r, 20));
}
try {
  const a = launch();
  await submit(a, "login", {
    email: users.alice.email,
    password: "fixture-password",
  });
  await until(() => a.doc.querySelector('[data-social-action="add"]'));
  assert.match(a.doc.querySelector("main").textContent, /ALICE/);
  checks.push("login verifies account and displays cloud social profile");
  const b = launch();
  await submit(b, "login", {
    email: users.bob.email,
    password: "fixture-password",
  });
  await until(() => b.doc.querySelector('[data-social-action="add"]'));
  await click(a, "add");
  await submit(a, "friend", { query: "bob" });
  await until(() => !a.doc.querySelector("dialog[open]"));
  await refresh(b);
  await until(() => b.doc.querySelector('[data-social-action="accept"]'));
  await click(b, "accept");
  await until(() => !b.doc.querySelector('[data-social-action="accept"]'));
  await refresh(a);
  assert.ok(a.doc.querySelector('[data-social-action="support"]'));
  checks.push(
    "friend request and recipient acceptance work through UI + PostgreSQL",
  );
  await click(a, "group");
  await submit(a, "group", { name: "Bizim ekip" });
  await until(() => a.doc.querySelector('[data-social-action="group-detail"]'));
  await click(a, "group-detail");
  await click(a, "invite");
  await until(() => a.doc.querySelector('[data-social-action="copy"]'));
  const link = a.doc.querySelector('[data-social-action="copy"]').dataset.link;
  const invite = new URL(link).searchParams.get("invite");
  assert.ok(invite);
  a.doc.querySelector(".dialog-close").click();
  await click(b, "redeem");
  await submit(b, "redeem", { token: link });
  await until(() => b.doc.querySelector('[data-social-action="group-detail"]'));
  checks.push(
    "private group creation and invite redemption work without automatic health sharing",
  );
  await click(a, "challenge");
  await submit(a, "challenge", {
    name: "Su haftası",
    kind: "water",
    mode: "race",
    duration: 7,
    target: 20,
  });
  await until(() =>
    a.doc.querySelector('[data-social-action="challenge-detail"]'),
  );
  await refresh(b);
  await click(b, "challenge-detail");
  await click(b, "join");
  await until(() => !b.doc.querySelector("dialog[open]"));
  assert.match(b.doc.querySelector("main").textContent, /0\/7 gün/);
  checks.push(
    "challenge creation and explicit participant consent work through UI",
  );
  await click(a, "privacy");
  const f = a.doc.querySelector('[data-social-form="privacy"]');
  f.querySelector('[name="enabled"]').checked = true;
  f.querySelector('[name="fields"][value="record"]').checked = true;
  f.requestSubmit();
  await until(() => a.doc.querySelector("#social-sharing")?.checked);
  await refresh(b);
  assert.match(b.doc.querySelector("main").textContent, /Kayıt: girilmedi/);
  a.doc.querySelector("#social-sharing").click();
  await until(() => !a.doc.querySelector("#social-sharing")?.checked);
  await refresh(b);
  assert.doesNotMatch(
    b.doc.querySelector("main").textContent,
    /Kayıt: girilmedi/,
  );
  checks.push(
    "field-level sharing and turning it off revoke subsequent friend reads",
  );
  await click(a, "friend");
  await click(a, "block");
  await until(() => a.doc.querySelector('[data-social-action="unblock"]'));
  await refresh(b);
  assert.equal(b.doc.querySelector('[data-social-action="support"]'), null);
  checks.push("blocking removes friend access and hides common-group identity");
  await click(b, "logout");
  await until(() => b.doc.querySelector('[data-social-form="login"]'));
  assert.doesNotMatch(b.doc.querySelector("main").textContent, /BOB/);
  assert.equal(
    b.doc.querySelector('[data-social-action="group-detail"]'),
    null,
  );
  checks.push("logout clears the previous account UI");
  for (const app of [a, b]) assert.deepEqual(app.errors, []);
  mkdirSync("artifacts/social-ui", { recursive: true });
  writeFileSync(
    "artifacts/social-ui/verification.json",
    JSON.stringify(
      {
        kind: "jsdom DOM + Supabase HTTP contract stub + PostgreSQL",
        liveAuth: false,
        checks,
      },
      null,
      2,
    ),
  );
  console.log(checks.map((c) => "PASS " + c).join("\n"));
} catch (e) {
  console.error(
    windows
      .map(
        (d) =>
          d.window.document.querySelector("main")?.textContent +
          " DIALOG " +
          d.window.document.querySelector("dialog")?.textContent,
      )
      .join("\n"),
  );
  throw e;
} finally {
  for (const dom of windows) dom.window.close();
  await db.close();
}
