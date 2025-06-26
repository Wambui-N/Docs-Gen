'use client';

import { useSupabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const supabase = useSupabaseBrowser();
  const { user } = useUser();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    website_url: '',
    tone_guidelines: ''
  });

  useEffect(() => {
    if (supabase && user) {
      fetchCompanyData();
    }
  }, [supabase, user]);

  const fetchCompanyData = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data: companyData, error } = await supabase
        .from('Company')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company:', error);
      } else if (companyData) {
        setCompany(companyData);
        setFormData({
          name: companyData.name || '',
          about: companyData.about || '',
          website_url: companyData.website_url || '',
          tone_guidelines: companyData.tone_guidelines || ''
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!supabase || !company) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('Company')
        .update({
          name: formData.name,
          about: formData.about,
          website_url: formData.website_url,
          tone_guidelines: formData.tone_guidelines,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);

      if (error) throw error;

      setCompany({ ...company, ...formData });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
              <p className="text-gray-600">Manage your company profile and AI tone preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Company Profile</h2>
            <p className="text-gray-600">This information helps AI generate more relevant content</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Your Company
              </label>
              <textarea
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                placeholder="Describe what your company does, your mission, key services, etc."
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                This helps AI understand your business context for better document generation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <Input
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourcompany.com"
                type="url"
              />
              <p className="text-sm text-gray-500 mt-1">
                AI will analyze your website content to match your company's tone and style
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone & Style Guidelines
              </label>
              <textarea
                value={formData.tone_guidelines}
                onChange={(e) => setFormData({ ...formData, tone_guidelines: e.target.value })}
                placeholder="Describe your preferred writing style, tone, and any specific guidelines. E.g., 'Professional but friendly, avoid jargon, use active voice, focus on benefits over features'"
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                These guidelines will be applied to all AI-generated content
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}