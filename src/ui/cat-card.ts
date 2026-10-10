import type { CatPreferences, DaySummary } from "../domain/models.ts";
import { catResult } from "./cat-result.ts";
import { catMediaUrl, VideoCatScene } from "./cat-video.ts";
import { escape } from "./tracker.ts";

export function catCard(
  preferences: CatPreferences,
  summary: DaySummary,
): string {
  const result = catResult(summary);
  return `<section class="cat-card" aria-labelledby="cat-heading" data-cat-state="${summary.catState}" data-result="${result.clip}"><div class="cat-viewport"><img class="cat-poster" src="${catMediaUrl("poster.webp")}" alt="Yeşil halıda oturan gri-beyaz yavru kedi" width="640" height="640"></div><h2 id="cat-heading">${escape(preferences.name)}</h2><p class="cat-intro">Ben buradayım. Bugünü birlikte takip edelim.</p><p class="cat-message sr-only" role="status">${escape(result.message)}</p><p class="cat-scene-status hint" role="status">Kedin hazırlanıyor…</p></section>`;
}
export function mountCat(
  host: HTMLElement,
  summary: DaySummary,
  preferences: CatPreferences,
  playReaction = false,
): { dispose(): void } {
  host.dataset.clip = "idle";
  host.dataset.animating = "false";
  if (
    preferences.sceneMode === "static" ||
    preferences.reducedMotion ||
    typeof IntersectionObserver === "undefined"
  ) {
    host.dataset.sceneStatus = "static";
    host.querySelector(".cat-scene-status")!.textContent =
      preferences.reducedMotion
        ? "Hareket azaltma açık."
        : preferences.sceneMode === "static"
          ? "Statik görünüm açık."
          : "";
    return { dispose() {} };
  }
  const scene = new VideoCatScene(host, catResult(summary).clip, playReaction);
  return { dispose: () => scene.dispose() };
}
