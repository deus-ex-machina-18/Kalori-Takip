import { test } from "node:test";
import assert from "node:assert/strict";
import { localDateAt, parseLocalDate } from "../src/domain/dates.ts";
test("UTC gece yarısından önce İstanbul yerel günü ilerler", () => {
  assert.equal(
    localDateAt(new Date("2026-10-05T21:05:00Z"), "Europe/Istanbul"),
    "2026-10-06",
  );
  assert.equal(
    localDateAt(new Date("2026-10-05T20:59:00Z"), "Europe/Istanbul"),
    "2026-10-05",
  );
});
test("artık gün ve geçersiz tarih doğrulaması", () => {
  assert.equal(parseLocalDate("2024-02-29"), "2024-02-29");
  for (const value of ["2026-02-29", "2026-04-31", "05-10-2026", "2026-13-01"])
    assert.throws(() => parseLocalDate(value));
});
test("yaz saati geçişinde yerel günü UTC gününe indirgemez", () => {
  assert.equal(
    localDateAt(new Date("2026-03-08T04:30:00Z"), "America/New_York"),
    "2026-03-07",
  );
  assert.equal(
    localDateAt(new Date("2026-03-08T07:30:00Z"), "America/New_York"),
    "2026-03-08",
  );
  assert.throws(() => localDateAt(new Date(), "Invalid/Zone"));
});
