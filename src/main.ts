import "./styles.css";
import { icon } from "./icons.ts";
import { localDateAt } from "./domain/dates.ts";
import { Tracker, escape } from "./ui/tracker.ts";
import { catCard, mountCat } from "./ui/cat-card.ts";
import { defaultCatPreferences } from "./domain/cat.ts";

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
let mountedCat: {dispose():void} | null = null;
const catPreferences = () => tracker.catPreferences ?? defaultCatPreferences(tracker.profile?.userId ?? '', reducedMotion);

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
  <div class="today-grid">${catCard(catPreferences(), tracker.catSummary())}
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
  const preferences = catPreferences();
  const motion = tracker.catPreferences?.reducedMotion ?? reducedMotion;
  return `${heading("KENDİNE GÖRE", "Küçük ayarlar.", "Daha rahat bir takip deneyimi için.")}
  <section class="card settings-card"><h2>Kedin ve görünüm</h2><form id="cat-settings-form">
  <label class="field" for="cat-name"><span>Kedinin adı</span><input id="cat-name" name="cat-name" value="${escape(preferences.name)}" maxlength="30" required ${!tracker.profile?'disabled':''}></label>
  <label class="setting-row" for="motion"><span><strong>Hareketi azalt</strong><span class="muted">Kedi animasyonlarını ve dekoratif geçişleri durdur.</span></span><input id="motion" name="motion" type="checkbox" role="switch" ${motion?'checked':''}></label>
  <label class="field" for="scene-mode"><span>Kedi görünümü</span><select id="scene-mode" name="scene-mode" ${!tracker.profile?'disabled':''}><option value="auto" ${preferences.sceneMode==='auto'?'selected':''}>Animasyonlu</option><option value="static" ${preferences.sceneMode==='static'?'selected':''}>Statik · düşük güç tüketimi</option></select></label>
  <p class="hint">${tracker.profile?'Kaydettiğinde ad, hareket ve görünüm tercihin bu cihazda korunur.':'Kalıcı kedi ayarları için önce Planım’dan profil oluştur. Başlangıçta cihazının hareket tercihi kullanılır.'} Kedin gri-beyaz. Ses kapalı.</p>
  <button type="submit" class="button primary" ${!tracker.profile || !tracker.ready?'disabled':''}>Kedi ayarlarını kaydet</button>
  </form></section>
  <section class="card settings-card"><h2>Profilin</h2><div class="setting-row"><span><strong>Profil bilgileri</strong><span class="muted">${tracker.profile?"Profilin bu cihazda kayıtlı. Planım ekranından düzenleyebilirsin.":"Henüz profil oluşturulmadı."}</span></span>${link("planim", "Düzenle", "button secondary")}</div></section>
  <section class="card settings-card"><h2>Veri ve hatırlatmalar</h2><div class="setting-row"><span><strong>Hatırlatmalar</strong><span class="muted">Henüz kurulu değil; bildirim izni istenmez.</span></span><span class="tag neutral">Raund 5</span></div><div class="setting-row"><span><strong>Dışa aktarma ve silme</strong><span class="muted">Kayıtların yalnız bu tarayıcıda saklanır. Site verisini temizlemek kayıtları silebilir; cihazlar arasında senkronizasyon yok.</span></span><span class="tag neutral">Raund 6</span></div></section><p class="footer-note">Kedi Kalori · 0.4.0<br>Tek cihazda manuel takip.</p>`;
}

const screens: Record<Screen, () => string> = {
  bugun: today,
  kayitlar: records,
  planim: plan,
  ilerlemem: progress,
  ayarlar: settings,
};
function render(moveFocus = false): void {
  mountedCat?.dispose(); mountedCat=null;
  if (tracker.catPreferences) reducedMotion=tracker.catPreferences.reducedMotion;
  const requested = window.location.hash.replace("#/", "");
  const current: Screen = navigation.some((n) => n.id === requested)
    ? (requested as Screen)
    : "bugun";
  if (requested !== current) history.replaceState(null, "", `#/${current}`);
  const label = navigation.find((n) => n.id === current)!.label;
  tracker.enter(current);
  document.title = `Kedi Kalori · ${label}`;
  document.documentElement.dataset.reducedMotion = String(reducedMotion);
  app.innerHTML = `<div class="app-shell"><header class="topbar"><a class="brand" href="#/bugun" aria-label="Kedi Kalori, Bugün"><span class="brand-icon">${icon("paw")}</span><span>Kedi<span class="brand-light">Kalori</span></span></a><span class="build-tag">Yerel takip <span>· Raund 4</span></span></header><nav class="navigation" aria-label="Ana navigasyon">${navigation.map((n) => `<a href="#/${n.id}" ${n.id === current ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.label}</span></a>`).join("")}</nav><main id="main" data-ready="${tracker.ready}"><div id="tracker-feedback">${tracker.messages()}</div>${screens[current]()}</main><footer class="app-footer"><span>Her gün kusursuz olmak zorunda değil.</span>${icon("paw")}</footer></div>`;
  if (current === "bugun") {
    document.querySelector(".day-card")!.innerHTML = tracker.dayContent(tracker.today());
    if (tracker.profile) document.querySelector(".intro-strip")!.innerHTML = `<div><h2>Takibin kendi hızında.</h2><p>Planını ve başlangıç bilgilerini istediğinde gözden geçirebilirsin.</p></div>${link("planim", "Planıma bak", "button secondary")}`;
  }
  tracker.bind(current);
  const playCatReaction = tracker.takeCatReaction(current);
  if (current === "bugun" && tracker.ready) {
    const host = document.querySelector<HTMLElement>('.cat-card')!;
    mountedCat = mountCat(host, tracker.catSummary(), catPreferences(), playCatReaction);
    if (playCatReaction) host.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }
  document.querySelector('#cat-settings-form')?.addEventListener('submit',event=>{
    event.preventDefault();
    tracker.saveCatSettings({name:document.querySelector<HTMLInputElement>('#cat-name')!.value,reducedMotion:document.querySelector<HTMLInputElement>('#motion')!.checked,sceneMode:document.querySelector<HTMLSelectElement>('#scene-mode')!.value as 'auto'|'static'});
  });
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
