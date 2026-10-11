import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Rpc } from "./types.ts";
export function socialClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL,
    key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) ||
    !key.startsWith("sb_publishable_")
  )
    throw new Error(
      "Geçersiz sunucu ayarı. Yalnız yayınlanabilir anahtar kullanılır.",
    );
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "kalori-auth-v1",
    },
  });
}
export class SupabaseRpc implements Rpc {
  constructor(readonly client: SupabaseClient) {}
  async call<T>(
    action: string,
    payload: unknown = {},
    operationId?: string,
  ): Promise<T> {
    const { data, error } = await this.client.rpc("kalori_rpc", {
      action,
      payload,
      operation_id: operationId ?? null,
    });
    if (error) {
      const e = new Error(error.message);
      Object.assign(e, { code: error.code });
      throw e;
    }
    return data as T;
  }
}
