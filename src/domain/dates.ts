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

export function addLocalDays(date: LocalDate, days: number): LocalDate {
  const value = new Date(`${parseLocalDate(date)}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return parseLocalDate(value.toISOString().slice(0, 10));
}

export function ageOn(birthDate: LocalDate, date: LocalDate): number {
  parseLocalDate(birthDate);
  parseLocalDate(date);
  return Number(date.slice(0, 4)) - Number(birthDate.slice(0, 4)) -
    (date.slice(5) < birthDate.slice(5) ? 1 : 0);
}
