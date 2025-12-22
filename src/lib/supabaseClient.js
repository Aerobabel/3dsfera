
import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';

// Trim whitespace to avoid copy-paste errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Simple check to ensure valid URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

let client = null;

if (supabaseUrl && supabaseKey && isValidUrl(supabaseUrl)) {
  console.log('✅ Supabase Client Initialized with:', supabaseUrl);
  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  console.warn('⚠️ Falling back to MOCK Supabase.');
  console.table({
    UrlProvided: !!supabaseUrl,
    KeyProvided: !!supabaseKey,
    UrlValid: isValidUrl(supabaseUrl),
    UrlValue: supabaseUrl
  });

  client = mockSupabase;
}

export const supabase = client;
