import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// ✅ OPTIMIZATION: Use singleton pattern to avoid multiple instances
// Each instance triggers /auth/v1/user request, causing unnecessary API calls
let client: SupabaseClient | null = null;

export function createClient() {
  // Return existing instance if already created
  if (client) {
    return client;
  }

  // Create new instance only if needed
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
