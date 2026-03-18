import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging for environment variables
console.log("Supabase URL is being loaded from VITE_SUPABASE_URL:", supabaseUrl ? "Present" : "Missing");
console.log("Supabase Key is being loaded from VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Present" : "Missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials! Please check your Vercel Environment Variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
