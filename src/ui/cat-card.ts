import type { CatPreferences, DaySummary } from "../domain/models.ts";
import { catResult } from "./cat-result.ts";
import { catMediaUrl, VideoCatScene } from "./cat-video.ts";
import { escape } from "./tracker.ts";
import { CAT_ACTIONS } from "./cat-actions.ts";

export function catCard(
  preferences: CatPreferences,
  summary: DaySummary,
): string {
  const result = catResult(summary);
  const controls = CAT_ACTIONS.filter(action => action.clip !== 'touch').map(action =>
    `<button type="button" class="button cat-action-button" data-cat-action="${action.clip}" disabled>${action.label}</button>`).join('');
  return `<section class="cat-card" aria-labelledby="cat-heading" data-cat-state="${summary.catState}" data-result="${result.clip}"><button type="button" class="cat-viewport" data-cat-action="${CAT_ACTIONS[0].clip}" aria-label="${escape(preferences.name)}: ${CAT_ACTIONS[0].label}" disabled><img class="cat-poster" src="${catMediaUrl("poster.webp")}" alt="Yeşil halıda oturan gri-beyaz yavru kedi" width="640" height="640"></button><h2 id="cat-heading">${escape(preferences.name)}</h2><p class="cat-intro">Ben buradayım. Dokunarak sevebilirsin.</p><div class="cat-controls" role="group" aria-label="Kedi hareketleri">${controls}</div><p class="cat-message sr-only" role="status">${escape(result.message)}</p><p class="cat-scene-status hint" role="status">Kedin hazırlanıyor…</p></section>`;
}
export function mountCat(
  host: HTMLElement,
  summary: DaySummary,
  preferences: CatPreferences,
  playReaction = false,
): { dispose(): void } {
  host.dataset.clip = "idle";
  host.dataset.animating = "false";
  host.dataset.actionState = "disabled";
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
