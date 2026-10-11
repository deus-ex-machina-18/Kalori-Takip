/** One registry for the available user-triggered clips and their controls. */
export const CAT_ACTIONS = [
  { clip: 'touch', label: 'Sev' },
  { clip: 'play', label: 'Oyun' },
  { clip: 'stretch', label: 'Esneme' },
  { clip: 'sleep', label: 'Uyuklama' },
] as const;

export type CatActionClip = typeof CAT_ACTIONS[number]['clip'];
