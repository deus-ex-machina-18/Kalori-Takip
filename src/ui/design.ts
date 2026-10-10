/** Shared, approved reference assets. All paths respect Vite's relative deployment base. */
export const designUrl = (file: string) =>
  `${import.meta.env.BASE_URL}design/${file}`;
export const art = (name: string, cls = "") =>
  `<img class="art ${cls}" src="${designUrl(name + ".webp")}" alt="" aria-hidden="true" width="80" height="80">`;
export const progressBar = (percent: number, label: string) =>
  `<div class="progress-track" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}"><span style="width:${Math.max(0, Math.min(100, percent))}%">%${Math.round(percent)}</span></div>`;
