import type {
  Activity,
  CatPreferences,
  DayLog,
  PlanVersion,
  Profile,
  WeightMeasurement,
} from "../domain/models.ts";
export type SharedField =
  "record" | "calories" | "movement" | "water" | "weight";
export interface Sharing {
  enabled: boolean;
  audience: "friends" | "selected" | "groups";
  ids: string[];
  fields: SharedField[];
}
export interface Person {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
  summary?: Partial<Record<SharedField, string | number | boolean | null>>;
  role?: "owner" | "admin" | "member";
}
export interface Account extends Person {
  code: string;
  prefs: Sharing;
}
export interface SocialGroup {
  id: string;
  name: string;
  owner: string;
  zone: string;
  role: "owner" | "admin" | "member";
  members: Person[];
}
export interface Challenge {
  id: string;
  groupId: string;
  name: string;
  kind: "record" | "movement" | "water";
  mode: "together" | "race";
  starts: string;
  ends: string;
  zone: string;
  target: number;
  joined: boolean;
  joinOpen: boolean;
  final: boolean;
  scores: (Person & { target: number; days: number; total: number })[];
}
export interface SocialState {
  account: Account | null;
  friends: Person[];
  requests: (Person & { incoming: boolean })[];
  blocks: Person[];
  groups: SocialGroup[];
  challenges: Challenge[];
  invites: {
    id: string;
    groupId: string | null;
    expiresAt: string;
    uses: number;
    maxUses: number;
  }[];
  notifications: {
    id: string;
    kind: string;
    label: string;
    read: boolean;
    created_at: string;
  }[];
}
export interface WaterData {
  target: number;
  days: Record<string, number>;
}
export interface Snapshot {
  profile: Profile | null;
  plans: PlanVersion[];
  days: DayLog[];
  activities: Activity[];
  weights: WeightMeasurement[];
  catPreferences: CatPreferences | null;
  water: WaterData;
}
export const emptySnapshot = (): Snapshot => ({
  profile: null,
  plans: [],
  days: [],
  activities: [],
  weights: [],
  catPreferences: null,
  water: { target: 2500, days: {} },
});
export const emptySocial = (): SocialState => ({
  account: null,
  friends: [],
  requests: [],
  blocks: [],
  groups: [],
  challenges: [],
  invites: [],
  notifications: [],
});
export interface Rpc {
  call<T>(action: string, payload?: unknown, operationId?: string): Promise<T>;
}
