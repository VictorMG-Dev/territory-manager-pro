import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase Config] URL:', supabaseUrl ? 'Defined' : 'Missing', 'Key:', supabaseAnonKey ? 'Defined' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key missing in environment variables');
}

// Provide placeholder values to prevent crash on load if env vars are missing
// The app will load but auth operations will fail gracefully
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
