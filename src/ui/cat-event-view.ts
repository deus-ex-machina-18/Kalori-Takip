import type { CatPreferences } from '../domain/models.ts';
import { CAT_EVENTS, type CatEvent } from './cat-events.ts';
import { catMediaUrl } from './cat-video.ts';

/** One short, lazy, nonblocking confirmation; never alters tracking data. */
export function showCatEvent(event: CatEvent, preferences: CatPreferences): () => void {
  const item = CAT_EVENTS[event];
  const dialog = document.createElement('aside');
  dialog.className = 'card cat-event cat-event-toast';
  dialog.dataset.catEvent = event;
  dialog.innerHTML = `<button type="button" class="cat-event-close" aria-label="Kutlamayı kapat">×</button><div class="cat-event-media"><img src="${catMediaUrl('poster.webp')}" alt="Zilli seni destekliyor" width="640" height="640"></div><p class="cat-event-status" role="status">${item.label}</p>`;
  document.body.append(dialog);
  const abort = new AbortController();
  const signal = abort.signal;
  let video: HTMLVideoElement | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const stop = () => {
    abort.abort();
    if (timer) clearTimeout(timer);
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); video.remove(); video = null; }
    dialog.remove();
  };
  dialog.querySelector('.cat-event-close')?.addEventListener('click', stop, { signal });
  if (preferences.reducedMotion || preferences.sceneMode === 'static' || typeof IntersectionObserver === 'undefined') {
    timer = setTimeout(stop, 3500);
    return stop;
  }
  video = document.createElement('video');
  video.muted = true; video.defaultMuted = true; video.playsInline = true;
  video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
  video.preload = 'auto'; video.disablePictureInPicture = true;
  const resume = () => { if (video && !document.hidden && dialog.isConnected && !video.ended) void video.play().catch(stop); };
  video.addEventListener('loadeddata', resume, { signal });
  video.addEventListener('playing', () => { if (video) video.dataset.visible = 'true'; if (timer) clearTimeout(timer); }, { signal });
  video.addEventListener('ended', stop, { signal });
  video.addEventListener('error', stop, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video?.pause(); else resume(); }, { signal });
  dialog.querySelector('.cat-event-media')!.append(video);
  timer = setTimeout(stop, 12000);
  video.src = catMediaUrl(item.file);
  return stop;
}
