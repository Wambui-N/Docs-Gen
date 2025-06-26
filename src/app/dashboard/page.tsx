'use client';

import { useSupabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import TemplateManager from './TemplateManager';

interface Company {
  id: string;
  name: string;
  about: string;
  website_url: string;
}

export default function DashboardPage() {
  const supabase = useSupabaseBrowser();
  const { user } = useUser();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabase && user) {
      const fetchCompany = async () => {
        setLoading(true);
        // The RLS policy ensures this query only returns the company
        // associated with the currently logged-in user.
        const { data, error } = await supabase
          .from('Company')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching company:', error);
        } else {
          setCompany(data);
        }
        setLoading(false);
      };

      fetchCompany();
    }
  }, [supabase, user]);
  
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        {loading ? (
          <p>Loading company data...</p>
        ) : company ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Welcome, {company.name || 'Your Company'}!</h2>
            <p><strong>About:</strong> {company.about || 'Not set'}</p>
            <p><strong>Website:</strong> {company.website_url || 'Not set'}</p>

            <hr className="my-6" />

            <TemplateManager companyId={company.id} />
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
            <p>Your company profile is being set up. This can take a moment after signing up. Please refresh soon.</p>
          </div>
        )}
      </div>
    </main>
  );
} 