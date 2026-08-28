import { LocalStore } from "./local";
import { SupabaseStore, supabaseConfigured } from "./supabase";
import type { Store } from "./store";

let instance: Store | null = null;

/**
 * Supabase when it is configured, a local JSON store otherwise. The local store
 * exists so the board runs, seeds and demos with no credentials at all; point
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY at a project and the
 * app switches over with no code change.
 */
export function store(): Store {
  if (instance) return instance;
  instance = supabaseConfigured() ? new SupabaseStore() : new LocalStore();
  return instance;
}

export function storeKind(): "supabase" | "local" {
  return supabaseConfigured() ? "supabase" : "local";
}

export type { Store } from "./store";
