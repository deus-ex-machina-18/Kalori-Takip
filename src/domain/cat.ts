import type { CatPreferences, CatState } from './models.ts';
import { validId } from './tracking.ts';

export const DEFAULT_CAT_NAME = 'Zilli';
export function defaultCatPreferences(userId: string, reducedMotion: boolean): CatPreferences {
  return { userId, name: DEFAULT_CAT_NAME, reducedMotion, sceneMode: 'auto', soundEnabled: false };
}
export function validateCatPreferences(value: CatPreferences): void {
  validId(value.userId);
  if (typeof value.name !== 'string' || value.name !== value.name.trim() || [...value.name].length < 1 || [...value.name].length > 30 || /[\u0000-\u001f\u007f]/u.test(value.name)) throw new Error('Kedi adı 1–30 karakter olmalı.');
  if (typeof value.reducedMotion !== 'boolean' || typeof value.soundEnabled !== 'boolean' || !['auto','static'].includes(value.sceneMode)) throw new Error('Kedi ayarları geçersiz.');
}
// The energy engine remains the single source for care and celebration thresholds.
export const CAT_PRESENTATION: Record<CatState, { clip: 'idle' | 'happy' | 'care'; message: string }> = {
  neutral: { clip: 'idle', message: 'Buradayım. Gününü kendi hızında kaydedebilirsin.' },
  care: { clip: 'care', message: 'Kendine iyi bak. Çok az yemek daha iyi sonuç demek değil.' },
  encouraging: { clip: 'idle', message: 'Bir gün bütün yolculuğu belirlemez. Birlikte devam edelim.' },
  'celebrate-record': { clip: 'happy', message: 'Gününü kaydettin. Takibin için güzel bir adım.' },
  'celebrate-range': { clip: 'happy', message: 'Gününü tamamladın ve plan aralığındasın.' },
};
