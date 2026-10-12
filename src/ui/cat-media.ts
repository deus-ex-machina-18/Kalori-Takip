import type { CatClip } from './cat-result.ts';
import type { CatActionClip } from './cat-actions.ts';

/** Alternate media changes the animation only, never the calorie outcome. */
export const CAT_REACTION_VARIANTS = {
  'above-maintenance': ['above-maintenance', 'above-maintenance-alt'],
  'below-target': ['below-target', 'below-target-alt'],
} as const satisfies Partial<Record<CatClip, readonly string[]>>;

/** Rotation survives card remounts in this session; it writes no user data. */
export function createCatMediaSelector() {
  const positions = new Map<string, number>();
  return (clip: CatClip | CatActionClip): string => {
    const variants = (CAT_REACTION_VARIANTS as Partial<Record<CatClip | CatActionClip, readonly string[]>>)[clip] ?? [clip];
    const position = positions.get(clip) ?? 0;
    positions.set(clip, position + 1);
    return `${variants[position % variants.length]!}.mp4`;
  };
}
