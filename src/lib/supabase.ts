import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Using mock data mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database table names
export const TABLES = {
  ARTICLES: 'newsroom_articles',
  VOTES: 'newsroom_votes',
  WRITERS: 'newsroom_writers',
  NEWSLETTER: 'newsletter_subscriptions',
  ANALYTICS: 'newsroom_analytics',
} as const;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
