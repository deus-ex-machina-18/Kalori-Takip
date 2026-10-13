import type { Activity, LocalDate, PlanVersion } from '../domain/models.ts';
import { addLocalDays } from '../domain/dates.ts';

/** User-confirmed uploads are 12–18. Missing 11 reuses the existing celebration. */
export const CAT_EVENTS = {
  'water-goal': { file: 'target-met.mp4', label: 'Su hedefin tamamlandı!' },
  'sport-recorded': { file: 'sport-recorded.mp4', label: 'Hareketin kaydedildi!' },
  'sport-goal': { file: 'sport-goal.mp4', label: 'Haftalık spor hedefin tamamlandı!' },
  'friend-added': { file: 'friend-added.mp4', label: 'Yeni arkadaşın eklendi!' },
  'friend-request': { file: 'friend-request.mp4', label: 'Yeni arkadaşlık isteğin var!' },
  'group-created': { file: 'group-created.mp4', label: 'Grubun kuruldu!' },
  'group-joined': { file: 'group-joined.mp4', label: 'Gruba katıldın!' },
  'challenge-started': { file: 'challenge-started.mp4', label: 'Meydan okumaya hazırsın!' },
} as const;
export type CatEvent = keyof typeof CAT_EVENTS;

export function waterGoalReached(before: number, after: number, target: number, previousTarget = target): boolean {
  return target === previousTarget && before < target && after >= target;
}

/** Weekly target matches the plan's total; a no-sport plan has no goal reward. */
export function sportRecordEvent(activities: Activity[], activity: Activity, plan: PlanVersion | null, today: LocalDate, editing: boolean): CatEvent | null {
  if (editing || activity.date !== today) return null;
  const from = addLocalDays(today, -6);
  const before = activities.filter(a => a.date >= from && a.date <= today).reduce((sum, a) => sum + a.durationMinutes, 0);
  const target = plan?.movementDays.reduce((sum, d) => sum + d.minutes, 0) ?? 0;
  return target > 0 && before < target && before + activity.durationMinutes >= target ? 'sport-goal' : 'sport-recorded';
}

type SocialSnapshot = {
  friends: { id: string }[];
  requests: { id: string; incoming?: boolean }[];
  groups: { id: string }[];
  challenges: { id: string; joined?: boolean }[];
};
/** Compare confirmed server state. Initial load passes no baseline and never replays. */
export function socialCatEvent(before: SocialSnapshot | null, after: SocialSnapshot, action: string | null = null): CatEvent | null {
  if (!before) return null;
  if (after.groups.some(g => !before.groups.some(old => old.id === g.id)))
    return action === 'group_create' ? 'group-created' : 'group-joined';
  if (after.friends.some(p => !before.friends.some(old => old.id === p.id))) return 'friend-added';
  if (action === 'challenge_create' && after.challenges.some(c => !before.challenges.some(old => old.id === c.id))) return 'challenge-started';
  if (after.challenges.some(c => c.joined && !before.challenges.some(old => old.id === c.id && old.joined))) return 'challenge-started';
  if (after.requests.some(p => p.incoming && !before.requests.some(old => old.id === p.id && old.incoming))) return 'friend-request';
  return null;
}
