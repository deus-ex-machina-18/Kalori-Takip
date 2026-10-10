import { escape } from "./tracker.ts";
/** Water has its own versioned device-local data, without changing calorie records. */
type WaterData = { target: number; days: Record<string, number> };
export class WaterTracker {
  error = "";
  private key(userId: string) {
    return `kalori-water-v1:${userId}`;
  }
  read(userId: string | undefined): WaterData {
    if (!userId) return { target: 2500, days: {} };
    try {
      const data = JSON.parse(localStorage.getItem(this.key(userId)) ?? "null");
      if (!data) return { target: 2500, days: {} };
      if (
        !Number.isFinite(data.target) ||
        data.target < 250 ||
        data.target > 10000 ||
        !data.days ||
        typeof data.days !== "object"
      )
        throw new Error();
      const days = Object.fromEntries(
        Object.entries(data.days).filter(
          ([date, value]) =>
            /^\d{4}-\d{2}-\d{2}$/.test(date) &&
            typeof value === "number" &&
            Number.isFinite(value) &&
            value >= 0 &&
            value <= 20000,
        ),
      );
      return { target: data.target, days: days as Record<string, number> };
    } catch {
      this.error = "Su kayıtları okunamadı. Tarayıcı depolamasını kontrol et.";
      return { target: 2500, days: {} };
    }
  }
  save(userId: string, date: string, amount: number, target: number): boolean {
    if (
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 20000 ||
      !Number.isFinite(target) ||
      target < 250 ||
      target > 10000
    ) {
      this.error = "Geçerli su miktarı ve hedef gir.";
      return false;
    }
    this.error = "";
    const data = this.read(userId);
    if (this.error) return false;
    data.target = target;
    data.days[date] = amount;
    try {
      localStorage.setItem(this.key(userId), JSON.stringify(data));
      return true;
    } catch {
      this.error =
        "Su kaydı saklanamadı. Girdiğin miktar korunuyor; tekrar deneyebilirsin.";
      return false;
    }
  }
  form(userId: string, date: string): string {
    const data = this.read(userId);
    return `<form id="water-form" class="tracking-form"><h2>Su takibim</h2><p class="muted">${escape(date)} · bu cihazdaki kaydın</p><label class="field"><span>Bugünkü toplam (ml)</span><input name="water-amount" type="number" min="0" max="20000" step="50" value="${data.days[date] ?? 0}" required inputmode="numeric"></label><div class="actions">${[250, 500].map((amount) => `<button type="button" class="button secondary" data-water-add="${amount}">+${amount} ml</button>`).join("")}</div><label class="field"><span>Günlük hedef (ml)</span><input name="water-target" type="number" min="250" max="10000" step="50" value="${data.target}" required inputmode="numeric"></label><p id="water-error" role="alert">${escape(this.error)}</p><button class="button primary" type="submit">Suyu kaydet</button></form>`;
  }
}
