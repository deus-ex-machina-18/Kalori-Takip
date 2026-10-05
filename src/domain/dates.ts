import type { LocalDate } from "./models.ts";
export function parseLocalDate(value: string): LocalDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Tarih YYYY-MM-DD olmalı.");
  const instant = new Date(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(instant.getTime()) ||
    instant.toISOString().slice(0, 10) !== value
  )
    throw new Error("Geçersiz takvim tarihi.");
  return value as LocalDate;
}
export function localDateAt(instant: Date, timeZone: string): LocalDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return parseLocalDate(`${part("year")}-${part("month")}-${part("day")}`);
}
