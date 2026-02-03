import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Cookie 设置可能在某些情况下失败（如 RSC）
          }
        },
        remove(name: string, _options: CookieOptions) {
          try {
            cookieStore.delete(name);
          } catch (error) {
            // Cookie 删除可能在某些情况下失败（如 RSC）
          }
        },
      },
    }
  );
}
