import type { CatClip } from './cat-result.ts';
import { CAT_ACTIONS, type CatActionClip } from './cat-actions.ts';

export const catMediaUrl = (file: string): string => `${import.meta.env.BASE_URL}cat-media/${file}`;

/** Two decoders at most; clips load only on completion or explicit interaction. */
export class VideoCatScene {
  private idle = document.createElement('video');
  private reaction = document.createElement('video');
  private active: HTMLVideoElement;
  private listeners = new AbortController();
  private observer: IntersectionObserver;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private visible = false;
  private transitioning = false;
  private playAttempt = 0;

  constructor(private host: HTMLElement, result: CatClip, playReaction: boolean) {
    this.active = this.idle;
    const signal = this.listeners.signal;
    for (const video of [this.idle, this.reaction]) {
      video.className = 'cat-video';
      video.muted = true; video.defaultMuted = true; video.playsInline = true;
      video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
      video.disablePictureInPicture = true; video.preload = 'auto';
      video.addEventListener('error', () => this.fail(), { signal });
      video.addEventListener('playing', () => { if (video === this.active && !this.disposed) this.host.dataset.animating = 'true'; }, { signal });
      video.addEventListener('pause', () => { if (video === this.active) this.host.dataset.animating = 'false'; }, { signal });
      host.querySelector('.cat-viewport')!.append(video);
    }
    for (const button of host.querySelectorAll<HTMLButtonElement>('[data-cat-action]')) {
      button.addEventListener('click', () => {
        const action = CAT_ACTIONS.find(item => item.clip === button.dataset.catAction);
        if (action) this.playAction(action.clip);
      }, { signal });
    }
    this.idle.loop = true;
    this.idle.src = catMediaUrl('idle.mp4');
    this.host.dataset.clip = 'idle'; this.host.dataset.animating = 'false'; this.host.dataset.sceneStatus = 'loading';
    this.timer = setTimeout(() => this.fail(), 12000);
    this.idle.addEventListener('loadeddata', () => {
      if (this.disposed || this.active !== this.idle) return;
      this.clearTimer(); this.ready(this.idle); this.updateControls(); this.syncPlayback();
    }, { signal });
    this.reaction.addEventListener('loadeddata', () => {
      if (this.disposed) return;
      this.clearTimer(); this.ready(this.reaction); this.syncPlayback();
    }, { signal });
    this.reaction.addEventListener('ended', () => this.returnToIdle(), { signal });
    if (playReaction && result !== 'idle') {
      this.startClip(result);
    }
    this.updateControls();
    document.addEventListener('visibilitychange', () => this.syncPlayback(), { signal });
    this.observer = new IntersectionObserver(entries => {
      this.visible = entries[0]?.isIntersecting ?? false;
      this.syncPlayback();
    }, { threshold: 0.01 });
    this.observer.observe(host.querySelector('.cat-viewport')!);
  }
  private playAction(action: CatActionClip): void {
    if (this.disposed || this.active !== this.idle || this.transitioning || this.idle.readyState < 2) return;
    this.startClip(action);
  }
  private startClip(clip: Exclude<CatClip, 'idle'> | CatActionClip): void {
    ++this.playAttempt; this.clearTimer(); this.idle.pause();
    this.active = this.reaction;
    this.reaction.dataset.visible = 'false';
    this.host.dataset.clip = clip; this.host.dataset.animating = 'false';
    this.host.dataset.sceneStatus = 'loading';
    this.updateControls();
    this.timer = setTimeout(() => this.fail(), 12000);
    this.reaction.src = catMediaUrl(`${clip}.mp4`);
  }
  private updateControls(): void {
    const enabled = !this.disposed && this.active === this.idle && !this.transitioning && this.idle.readyState >= 2;
    this.host.dataset.actionState = this.disposed ? 'disabled' : enabled ? 'ready' : 'busy';
    for (const button of this.host.querySelectorAll<HTMLButtonElement>('[data-cat-action]')) button.disabled = !enabled;
  }
  private ready(video: HTMLVideoElement): void {
    this.host.dataset.sceneStatus = 'ready'; video.dataset.visible = 'true'; this.status('');
  }
  private syncPlayback(): void {
    if (this.disposed) return;
    const attempt = ++this.playAttempt;
    if (document.hidden || !this.visible || this.transitioning) {
      this.idle.pause(); this.reaction.pause(); this.host.dataset.animating = 'false'; return;
    }
    if (this.active.readyState < 2 || this.active.ended) return;
    const video = this.active;
    void video.play().catch(() => { if (!this.disposed && attempt === this.playAttempt) this.fail(); });
  }
  private returnToIdle(): void {
    if (this.disposed) return;
    this.transitioning = true; ++this.playAttempt;
    this.reaction.pause(); this.idle.pause(); this.idle.currentTime = 0;
    this.idle.dataset.visible = 'true'; this.reaction.dataset.visible = 'false';
    this.host.dataset.animating = 'false';
    this.timer = setTimeout(() => {
      if (this.disposed) return;
      this.timer = null; this.active = this.idle; this.transitioning = false; this.host.dataset.clip = 'idle';
      this.reaction.removeAttribute('src'); this.reaction.load();
      if (this.idle.readyState >= 2) this.ready(this.idle);
      else this.timer = setTimeout(() => this.fail(), 12000);
      this.updateControls(); this.syncPlayback();
    }, 220);
  }
  private clearTimer(): void { if (this.timer) clearTimeout(this.timer); this.timer = null; }
  private status(message: string): void { this.host.querySelector('.cat-scene-status')!.textContent = message; }
  private fail(): void {
    if (this.disposed) return;
    this.dispose(); this.host.dataset.sceneStatus = 'static'; this.host.dataset.animating = 'false';
    this.status('Video açılamadı. Kayıtlarına devam edebilirsin.');
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; ++this.playAttempt; this.listeners.abort(); this.observer.disconnect(); this.clearTimer();
    this.updateControls();
    for (const video of [this.idle, this.reaction]) { video.pause(); video.removeAttribute('src'); video.load(); video.remove(); }
  }
}
