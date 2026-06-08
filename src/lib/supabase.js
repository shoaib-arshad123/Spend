import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl?.startsWith('http')) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. On Vercel: Settings → Environment Variables → add it for Production & Preview, then Redeploy.'
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. On Vercel: Settings → Environment Variables → add it for Production & Preview, then Redeploy.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sset_supabase_auth',
  },
});
