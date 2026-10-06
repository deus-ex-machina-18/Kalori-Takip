import "./styles.css";
import { icon } from "./icons.ts";
import { localDateAt } from "./domain/dates.ts";
import { Tracker } from "./ui/tracker.ts";

type Screen = "bugun" | "kayitlar" | "planim" | "ilerlemem" | "ayarlar";
const navigation: { id: Screen; label: string; icon: string }[] = [
  { id: "bugun", label: "Bugün", icon: "paw" },
  { id: "kayitlar", label: "Kayıtlar", icon: "journal" },
  { id: "planim", label: "Planım", icon: "plan" },
  { id: "ilerlemem", label: "İlerlemem", icon: "chart" },
  { id: "ayarlar", label: "Ayarlar", icon: "settings" },
];
const app = document.querySelector<HTMLDivElement>("#app")!;
const tracker = new Tracker(() => render());
let reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const link = (screen: Screen, text: string, cls = "button primary") =>
  `<a class="${cls}" href="#/${screen}">${text}${icon("arrow")}</a>`;
const heading = (eyebrow: string, title: string, subtitle: string) =>
  `<header class="page-heading"><p class="eyebrow">${eyebrow}</p><h1 id="page-title" tabindex="-1">${title}</h1><p>${subtitle}</p></header>`;
const later = (label: string, round: number) =>
  `<button class="button disabled" disabled>${label}<span>Raund ${round}</span></button>`;
const empty = (symbol: string, title: string, text: string) =>
  `<div class="empty"><span class="empty-icon">${icon(symbol)}</span><h2>${title}</h2><p>${text}</p></div>`;
const flatCat = `<svg class="cat-illustration" viewBox="0 0 320 240" role="img" aria-label="Geçici iki boyutlu kedi çizimi"><ellipse cx="160" cy="217" rx="84" ry="12" fill="#b7b7a1" opacity=".25"/><path d="M219 200q75-50 24-68" fill="none" stroke="#c98f64" stroke-width="20" stroke-linecap="round"/><ellipse cx="162" cy="167" rx="60" ry="50" fill="#e8b78d"/><path d="m100 98-4-61 44 30h43l43-30-3 61c29 53-2 84-62 84s-90-31-61-84Z" fill="#f4caa5"/><path d="m105 51 4 38 25-17m81-21-4 38-25-17" fill="#d99787"/><ellipse cx="162" cy="134" rx="35" ry="26" fill="#fff1dd"/><path d="M127 110q9-10 18 0m34 0q9-10 18 0" stroke="#38463e" fill="none" stroke-width="5" stroke-linecap="round"/><path d="m155 126 7 6 7-6Z" fill="#a46862"/><path d="M162 132v7m0 0q-8 7-14 0m14 0q8 7 14 0" stroke="#a46862" fill="none" stroke-width="3" stroke-linecap="round"/><path d="m111 128-23-4m23 12-24 3m125-11 23-4m-23 12 24 3" stroke="#a78063" stroke-width="2" stroke-linecap="round"/><ellipse cx="140" cy="203" rx="23" ry="12" fill="#f4caa5"/><ellipse cx="185" cy="203" rx="23" ry="12" fill="#f4caa5"/></svg>`;
function today(): string {
  const timeZone = tracker.profile?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const date = localDateAt(now, timeZone);
  const display = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone,
  }).format(now);
  return `${heading(display, "Küçük adımlar, birlikte.", "Gününü takip et. Kendine alan aç.")}
  <div class="today-grid"><section class="cat-card" aria-labelledby="cat-heading"><div class="card-top"><span class="tag">${icon("paw")} Kedim</span><span class="subtle">2D taslak</span></div><div class="cat-stage">${flatCat}<span class="stage-spark spark-one">✦</span><span class="stage-spark spark-two">✧</span></div><h2 id="cat-heading">Yeni bir yol arkadaşı.</h2><p>Kedin için ayrılan yer burası.<br>Adını ve görünümünü birlikte seçeceğiz.</p><div class="scene-caption">Gerçek 3D sahne Raund 4’te eklenecek.</div></section>
  <section class="card day-card" aria-labelledby="day-heading"><div class="card-top"><h2 id="day-heading">Günün özeti</h2><span class="status">Girilmedi</span></div><time datetime="${date}" class="subtle">${display}</time><div class="calorie-value">— <span>kcal</span></div><p class="day-note">Henüz kalori kaydın yok.</p><div class="metric-row"><span>Plan hedefi</span><strong>Belirlenmedi</strong></div><div class="metric-row"><span>Tahmini enerji dengesi</span><strong>Hesaplanmadı</strong></div><p class="hint">Kayıt olmayan gün, sıfır kalori değildir.</p>${later("Kalori gir", 2)}</section></div>
  <section class="intro-strip"><span class="strip-icon">${icon("leaf")}</span><div><h2>Önce sana uygun bir başlangıç.</h2><p>Profilin ve planın hazır olduğunda günlük takibin burada başlayacak.</p></div>${link("planim", "Planıma bak", "button secondary")}</section>
  <section class="simple-note">${icon("check")}<p>Kalorini sen hesapla, toplamını buraya yaz.<br>Yemek arama veya fotoğraftan tahmin yok.</p></section>`;
}
function records(): string {
  return `${heading("GÜNLÜK TAKİP", "Kayıtların bir arada.", "Kalori, hareket ve kilo geçmişini gör; seçtiğin günü düzenle.")}${tracker.records()}`;
}
function plan(): string {
  return `${heading("SANA UYGUN BAŞLANGIÇ", "Planın sana ait.", "Bilgilerini gir, başlangıcını önizle ve onayla.")}${tracker.planContent()}`;
}
function progress(): string {
  return `${heading("UZUN VADEDE", "Kendi ilerlemeni izle.", "Ölçümler ve tamamlanan günler; eksik günler sıfır sayılmaz.")}${tracker.progress()}`;
}
function settings(): string {
  return `${heading("KENDİNE GÖRE", "Küçük ayarlar.", "Daha rahat bir takip deneyimi için.")}<section class="card settings-card"><h2>Görünüm ve erişilebilirlik</h2><label class="setting-row" for="motion"><span><strong>Hareketi azalt</strong><span class="muted">Bu oturumda dekoratif geçişleri kapat.</span></span><input id="motion" type="checkbox" role="switch" ${reducedMotion ? "checked" : ""} /></label><p class="hint">Başlangıçta cihazının hareket tercihi kullanılır.</p></section><section class="card settings-card"><h2>Profil ve kedin</h2><div class="setting-row"><span><strong>Profil bilgileri</strong><span class="muted">${tracker.profile ? "Profilin bu cihazda kayıtlı. Planım ekranından düzenleyebilirsin." : "Henüz profil oluşturulmadı."}</span></span>${link("planim", "Düzenle", "button secondary")}</div><div class="setting-row"><span><strong>Kedi adı ve görünümü</strong><span class="muted">Henüz seçilmedi.</span></span><span class="tag neutral">Raund 4</span></div></section><section class="card settings-card"><h2>Veri ve hatırlatmalar</h2><div class="setting-row"><span><strong>Hatırlatmalar</strong><span class="muted">Henüz kurulu değil; bildirim izni istenmez.</span></span><span class="tag neutral">Raund 5</span></div><div class="setting-row"><span><strong>Dışa aktarma ve silme</strong><span class="muted">Kayıtların yalnız bu tarayıcıda saklanır. Site verisini temizlemek kayıtları silebilir; cihazlar arasında senkronizasyon yok.</span></span><span class="tag neutral">Raund 6</span></div></section><p class="footer-note">Kedi Kalori · 0.3.0<br>Tek cihazda manuel takip.</p>`;
}
const screens: Record<Screen, () => string> = {
  bugun: today,
  kayitlar: records,
  planim: plan,
  ilerlemem: progress,
  ayarlar: settings,
};
function render(moveFocus = false): void {
  const requested = window.location.hash.replace("#/", "");
  const current: Screen = navigation.some((n) => n.id === requested)
    ? (requested as Screen)
    : "bugun";
  if (requested !== current) history.replaceState(null, "", `#/${current}`);
  const label = navigation.find((n) => n.id === current)!.label;
  tracker.enter(current);
  document.title = `Kedi Kalori · ${label}`;
  document.documentElement.dataset.reducedMotion = String(reducedMotion);
  app.innerHTML = `<div class="app-shell"><header class="topbar"><a class="brand" href="#/bugun" aria-label="Kedi Kalori, Bugün"><span class="brand-icon">${icon("paw")}</span><span>Kedi<span class="brand-light">Kalori</span></span></a><span class="build-tag">Yerel takip <span>· Raund 3</span></span></header><nav class="navigation" aria-label="Ana navigasyon">${navigation.map((n) => `<a href="#/${n.id}" ${n.id === current ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`).join("")}</nav><main id="main" data-ready="${tracker.ready}"><div id="tracker-feedback">${tracker.messages()}</div>${screens[current]()}</main><footer class="app-footer"><span>Her gün kusursuz olmak zorunda değil.</span>${icon("paw")}</footer></div>`;
  if (current === "bugun") {
    document.querySelector(".day-card")!.innerHTML = tracker.dayContent(tracker.today());
    if (tracker.profile) document.querySelector(".intro-strip")!.innerHTML = `<div><h2>Takibin kendi hızında.</h2><p>Planını ve başlangıç bilgilerini istediğinde gözden geçirebilirsin.</p></div>${link("planim", "Planıma bak", "button secondary")}`;
  }
  tracker.bind(current);
  document
    .querySelector<HTMLInputElement>("#motion")
    ?.addEventListener("change", (event) => {
      reducedMotion = (event.target as HTMLInputElement).checked;
      document.documentElement.dataset.reducedMotion = String(reducedMotion);
    });
  if (moveFocus) {
    document
      .querySelector<HTMLElement>("#page-title")
      ?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
window.addEventListener("hashchange", () => render(true));
document.querySelector('.skip-link')?.addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector<HTMLElement>('#main');
  if (main) { main.tabIndex = -1; main.focus(); }
});
render();
void tracker.load();
setInterval(() => tracker.checkMidnight(), 30_000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) tracker.checkMidnight(); });
