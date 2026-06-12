import { createClient } from '@supabase/supabase-js';
import { isSupabaseBrowserConfigured } from './env';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseBrowserConfigured = isSupabaseBrowserConfigured();

export const supabaseBrowser = createClient(
  url || 'https://example.supabase.co',
  anonKey || 'missing-anon-key',
);
