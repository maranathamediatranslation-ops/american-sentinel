import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Only the public anon key belongs here. Never put the service-role key in this app.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient<Database> | undefined;

function create() {
  if (!url || !anonKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.",
    );
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
    },
  });
}

// On the server, each call gets a fresh client so no state is shared between
// requests. In the browser, one client is reused.
export function getSupabase(): SupabaseClient<Database> {
  if (typeof window === "undefined") return create();
  browserClient ??= create();
  return browserClient;
}
