import "./styles.css";
import { icon } from "./icons.ts";
import { Tracker, escape } from "./ui/tracker.ts";
import { catCard, mountCat } from "./ui/cat-card.ts";
import { defaultCatPreferences } from "./domain/cat.ts";
import { art, designUrl } from "./ui/design.ts";
import { WaterTracker } from "./ui/water.ts";
import { addLocalDays } from "./domain/dates.ts";

type Screen =
  "bugun" | "kayitlar" | "planim" | "ilerlemem" | "sosyal" | "ayarlar";
const navigation: { id: Screen; label: string; icon: string }[] = [
  { id: "bugun", label: "Bugün", icon: "cat" },
  { id: "kayitlar", label: "Kayıtlar", icon: "journal" },
  { id: "planim", label: "Planım", icon: "calendar" },
  { id: "ilerlemem", label: "İlerlemem", icon: "chart" },
  { id: "sosyal", label: "Sosyal", icon: "users" },
  { id: "ayarlar", label: "Ayarlar", icon: "settings" },
];
const app = document.querySelector<HTMLDivElement>("#app")!;
const tracker = new Tracker(() => render());
const water = new WaterTracker();
let reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
let period: "7" | "30" | "all" = "7";
let previousScreen = "";
let mountedCat: { dispose(): void } | null = null;
const preferences = () =>
  tracker.catPreferences ??
  defaultCatPreferences(tracker.profile?.userId ?? "", reducedMotion);
const heading = (title: string, subtitle: string) =>
  `<header class="page-heading"><h1 id="page-title" tabindex="-1">${title}</h1><p>${subtitle}</p></header>`;
const displayDate = () =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone: tracker.profile?.timeZone,
  }).format(new Date());
const dateChip = () =>
  `<a class="date-chip" href="#/kayitlar">${icon("calendar")}<time datetime="${tracker.today()}">${displayDate()}</time>${icon("arrow")}</a>`;
function today() {
  return `${heading(`Bugün, ${escape(preferences().name)} ile.`, "Küçük adımlar, büyük değişimler.")}${catCard(preferences(), tracker.catSummary())}${tracker.todayContent()}`;
}
function settings() {
  const p = preferences(),
    disabled = !tracker.profile ? "disabled" : "";
  return `${heading("Ayarlar", "Uygulamayı kendine göre düzenle.")}
  <section class="card settings-cat"><h2>Kedin</h2><div class="cat-settings-grid"><img class="settings-poster" src="${designUrl("zilli.webp")}" alt="Yeşil halıda gri-beyaz Zilli" width="256" height="256"><div><p class="muted">Gri-beyaz dostun.</p><form id="cat-settings-form"><label class="field" for="cat-name"><span>Kedinin adı</span><input id="cat-name" name="cat-name" value="${escape(p.name)}" maxlength="30" required ${disabled}></label><p class="hint">Varsayılan ad Zilli. İstediğin adı kullanabilirsin.</p><button type="submit" class="button primary" ${disabled}>Adı kaydet</button></form></div></div>${!tracker.profile ? '<p class="hint">Kalıcı ayarlar için Planım’dan profil oluştur.</p>' : ""}</section>
  <section class="card settings-card"><h2>Görünüm ve hareket</h2><label class="setting-row" for="motion">${icon("cat")}<span><strong>Hareketi azalt</strong><span class="muted">Animasyonları azaltır.</span></span><input id="motion" name="motion" form="cat-settings-form" type="checkbox" role="switch" ${p.reducedMotion ? "checked" : ""}></label><div class="ornate-divider"></div><label class="setting-row" for="static-mode">${icon("image")}<span><strong>Statik kedi görünümü</strong><span class="muted">Video yerine sabit görsel kullanır.</span></span><input id="static-mode" type="checkbox" role="switch" ${p.sceneMode === "static" ? "checked" : ""} ${disabled}></label><select id="scene-mode" name="scene-mode" form="cat-settings-form" class="sr-only" aria-label="Kedi görünümü" ${disabled}><option value="auto" ${p.sceneMode === "auto" ? "selected" : ""}>Animasyonlu</option><option value="static" ${p.sceneMode === "static" ? "selected" : ""}>Statik</option></select><p class="hint">Tercihlerini Adı kaydet düğmesiyle birlikte kaydedebilirsin.</p></section>
  <section class="card"><h2>Profil ve hedefler</h2><a class="link-row" href="#/planim">${icon("user")}<span><strong>Profil bilgilerim</strong><small>Boy, kilo ve diğer kişisel bilgiler.</small></span>${icon("arrow")}</a><div class="ornate-divider"></div><a class="link-row" href="#/planim">${art("target")}<span><strong>Kalori ve su planım</strong><small>Planım ekranından düzenleyebilirsin.</small></span>${icon("arrow")}</a></section>
  <section class="card"><h2>Kayıtların</h2><div class="link-row">${icon("journal")}<span><strong>Kayıtların bu cihazda saklanır.</strong><small>Tarayıcı verilerini silmek kayıtlarını da silebilir.</small></span></div></section>`;
}
function social() {
  return `${heading("Sosyal", "Birlikte ilerlemek daha güzel.")}
  <section class="card"><h2>Sürecimi paylaş</h2><div class="sharing-row">${art("lock")}<p class="muted">Kapalıyken kayıtlarını yalnız sen görürsün.</p><span class="sharing-switch"><input type="checkbox" role="switch" aria-label="Sürecimi paylaş" disabled><small>Kapalı</small></span></div><div class="ornate-divider"></div><button class="link-row" data-social="Paylaşımı düzenle">${icon("settings")}<span><strong>Paylaşımı düzenle</strong><small>Kimler görebilir, neleri görebilir?</small></span>${icon("arrow")}</button></section>
  <section class="card"><div class="card-top"><h2>Arkadaşlarım</h2><button class="text-button" data-social="Arkadaşlarım">Tümünü gör ${icon("arrow")}</button></div><div class="social-empty">${icon("users")}<span>Henüz arkadaş eklenmedi.<small>Birlikte takip edeceğin kişileri burada göreceksin.</small></span></div><button class="button primary" data-social="Arkadaş ekle">${icon("user")}<span>Arkadaş ekle</span></button></section>
  <section class="card"><div class="card-top"><h2>Gruplarım</h2><button class="text-button" data-social="Grup kur">${icon("plus")} Grup kur</button></div><div class="social-empty">${art("group")}<span>Birlikte küçük adımlar.<small>Yürüyüş ve hareket grupların burada yer alacak.</small></span></div></section>
  <section class="card"><h2>Challenge’lar</h2><div class="link-row">${art("shoe")}<span><strong>7 gün hareket</strong><small>Günde 20 dk · başlangıç fikri</small></span></div><div class="ornate-divider"></div><div class="link-row">${art("water")}<span><strong>Su alışkanlığı</strong><small>7 gün · başlangıç fikri</small></span></div><button class="button primary" data-social="Challenge başlat">${icon("flag")}<span>Challenge başlat</span></button></section><p class="hint center">Sosyal ekran önizlemesi. Hesap bağlantısı henüz kurulmadı; kayıtların paylaşılmıyor.</p>`;
}
const screens: Record<Screen, () => string> = {
  bugun: today,
  kayitlar: () =>
    `${heading("Kayıtlar", "Günlerini ve hareketini bir arada gör.")}${tracker.records()}`,
  planim: () =>
    `${heading("Planım", "Hedefin ve hareket düzenin.")}${tracker.planContent()}`,
  ilerlemem: () =>
    `${heading("İlerlemem", "Kayıtlarınla ilerleyişini gör.")}<div class="progress-date">${dateChip()}</div><div class="period-tabs" role="group" aria-label="Özet dönemi">${[
      ["7", "7 gün"],
      ["30", "30 gün"],
      ["all", "Tümü"],
    ]
      .map(
        ([value, label]) =>
          `<button type="button" data-period="${value}" aria-pressed="${period === value}">${label}</button>`,
      )
      .join("")}</div>${tracker.progress(period)}`,
  sosyal: social,
  ayarlar: settings,
};
function modal(content: string) {
  const dialog = document.querySelector<HTMLDialogElement>("#app-dialog")!;
  dialog.innerHTML = `<button type="button" class="dialog-close" aria-label="Kapat">×</button>${content}`;
  if (dialog.showModal) dialog.showModal();
  else dialog.setAttribute("open", "");
  dialog.querySelector(".dialog-close")?.addEventListener("click", () => {
    dialog.close?.();
    dialog.removeAttribute("open");
  });
  dialog.addEventListener(
    "click",
    (event) => {
      if (event.target === dialog) dialog.close?.();
    },
    { once: true },
  );
  return dialog;
}
function render(moveFocus = false) {
  const requested = window.location.hash.replace("#/", "");
  const current: Screen = navigation.some((n) => n.id === requested)
    ? (requested as Screen)
    : "bugun";
  const editorOpen =
    current === previousScreen &&
    document.querySelector<HTMLDetailsElement>(".calorie-details")?.open;
  mountedCat?.dispose();
  mountedCat = null;
  if (tracker.catPreferences)
    reducedMotion = tracker.catPreferences.reducedMotion;
  if (requested !== current) history.replaceState(null, "", `#/${current}`);
  tracker.enter(current);
  document.title = `Kalori Takip · ${navigation.find((n) => n.id === current)!.label}`;
  document.documentElement.dataset.reducedMotion = String(reducedMotion);
  app.innerHTML = `<div class="app-shell" data-screen="${current}"><header class="topbar"><a class="brand" href="#/bugun" aria-label="Kalori Takip, Bugün">${art("cat")}<span>Kalori Takip</span></a>${["bugun", "ilerlemem", "sosyal"].includes(current) ? `<a class="settings-link small-frame" href="#/ayarlar" aria-label="Ayarlar">${icon("settings")}</a>` : dateChip()}</header>${current === "bugun" ? `<div class="today-date">${dateChip()}</div>` : ""}<main id="main" data-ready="${tracker.ready}"><div id="tracker-feedback">${tracker.messages()}</div>${screens[current]()}</main><nav class="navigation" aria-label="Ana navigasyon">${navigation.map((n) => `<a href="#/${n.id}" ${n.id === current ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`).join("")}</nav><dialog id="app-dialog" class="card"></dialog></div>`;
  if (editorOpen)
    document
      .querySelector<HTMLDetailsElement>(".calorie-details")
      ?.setAttribute("open", "");
  tracker.bind(current);
  const reaction = tracker.takeCatReaction(current);
  if (current === "bugun" && tracker.ready) {
    const host = document.querySelector<HTMLElement>(".cat-card")!;
    mountedCat = mountCat(host, tracker.catSummary(), preferences(), reaction);
    if (reaction)
      host.scrollIntoView?.({ block: "start", behavior: "instant" });
  }
  const data = water.read(tracker.profile?.userId);
  const waterSummary = document.querySelector("#water-summary");
  if (waterSummary)
    waterSummary.textContent = `${((data.days[tracker.today()] ?? 0) / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} L`;
  const waterTarget = document.querySelector("#water-target-summary");
  if (waterTarget)
    waterTarget.textContent = `${data.target.toLocaleString("tr-TR")} ml`;
  const waterDays = document.querySelector("#water-days-summary");
  if (waterDays) {
    const from =
      period === "all"
        ? "1900-01-01"
        : addLocalDays(tracker.today(), period === "7" ? -6 : -29);
    waterDays.textContent = `${Object.entries(data.days).filter(([day, amount]) => day >= from && day <= tracker.today() && amount >= data.target).length} gün`;
  }
  document.querySelectorAll("[data-water]").forEach((el) =>
    el.addEventListener("click", () => {
      if (!tracker.profile) {
        modal(
          '<h2>Su takibine başla</h2><p>Önce profilini oluştur; su kayıtların da bu cihazda saklansın.</p><a href="#/planim" class="button primary">Profilini oluştur</a>',
        );
        return;
      }
      const userId = tracker.profile.userId,
        date = tracker.today();
      const dialog = modal(water.form(userId, date));
      dialog.querySelectorAll<HTMLElement>("[data-water-add]").forEach((b) =>
        b.addEventListener("click", () => {
          const input = dialog.querySelector<HTMLInputElement>(
            '[name="water-amount"]',
          )!;
          input.value = String(
            Math.min(20000, Number(input.value) + Number(b.dataset.waterAdd)),
          );
        }),
      );
      dialog
        .querySelector("#water-form")
        ?.addEventListener("submit", (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget as HTMLFormElement);
          if (
            water.save(
              userId,
              date,
              Number(form.get("water-amount")),
              Number(form.get("water-target")),
            )
          ) {
            dialog.close?.();
            render();
          } else
            dialog.querySelector("#water-error")!.textContent = water.error;
        });
    }),
  );
  document
    .querySelectorAll<HTMLElement>("[data-social]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        modal(
          `<h2>${escape(el.dataset.social)}</h2><p>Gerçek arkadaş, grup ve challenge işlemleri için hesap ve sunucu bağlantısı gerekiyor. Bu bağlantı henüz kurulmadı.</p><p class="muted">Kayıtların yalnızca bu cihazda; paylaşım kapalı.</p>`,
        ),
      ),
    );
  document.querySelectorAll<HTMLElement>("[data-period]").forEach((el) =>
    el.addEventListener("click", () => {
      period = el.dataset.period as typeof period;
      render();
    }),
  );
  document
    .querySelector("[data-open-review]")
    ?.addEventListener("click", () => {
      const details =
        document.querySelector<HTMLDetailsElement>(".review-details")!;
      details.open = true;
      details.scrollIntoView?.({ block: "start" });
    });
  document
    .querySelector("#cat-settings-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      tracker.saveCatSettings({
        name: document.querySelector<HTMLInputElement>("#cat-name")!.value,
        reducedMotion:
          document.querySelector<HTMLInputElement>("#motion")!.checked,
        sceneMode: document.querySelector<HTMLSelectElement>("#scene-mode")!
          .value as "auto" | "static",
      });
    });
  document
    .querySelector("#static-mode")
    ?.addEventListener("change", (event) => {
      document.querySelector<HTMLSelectElement>("#scene-mode")!.value = (
        event.target as HTMLInputElement
      ).checked
        ? "static"
        : "auto";
    });
  document.querySelector("#motion")?.addEventListener("change", (event) => {
    reducedMotion = (event.target as HTMLInputElement).checked;
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  });
  previousScreen = current;
  if (moveFocus) {
    document
      .querySelector<HTMLElement>("#page-title")
      ?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
window.addEventListener("hashchange", () => render(true));
document.querySelector(".skip-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  const main = document.querySelector<HTMLElement>("#main");
  if (main) {
    main.tabIndex = -1;
    main.focus();
  }
});
render();
void tracker.load();
setInterval(() => tracker.checkMidnight(), 30000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tracker.checkMidnight();
});
