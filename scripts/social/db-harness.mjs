import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
export async function database() {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
  );
  for (const file of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  return db;
}
export async function user(db) {
  const id = randomUUID();
  await db.query("insert into auth.users(id) values($1)", [id]);
  return id;
}
export async function rpc(
  db,
  id,
  action,
  payload = {},
  operationId = undefined,
) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  try {
    return (
      await db.query(
        "select public.kalori_rpc($1,$2::jsonb,$3::uuid) as result",
        [
          action,
          JSON.stringify(payload),
          operationId ??
            (action === "state" || action === "snapshot_get"
              ? null
              : randomUUID()),
        ],
      )
    ).rows[0].result;
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub','',false)");
  }
}
