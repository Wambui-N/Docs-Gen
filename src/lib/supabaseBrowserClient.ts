'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

// This is a hook that creates a Supabase client for the browser.
// It will be authenticated with the current user's Clerk JWT.
export function useSupabaseBrowser() {
  const { getToken } = useAuth();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const createClient = async () => {
      const supabaseToken = await getToken({ template: 'supabase' });

      if (supabaseToken) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const client = createBrowserClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            global: {
              headers: {
                Authorization: `Bearer ${supabaseToken}`,
              },
            },
          }
        );
        setSupabase(client);
      }
    };
    
    createClient();
  }, [getToken]);

  return supabase;
} 