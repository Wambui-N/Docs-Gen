'use client';

import { useSupabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Company, Subscription, Template } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Settings, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const supabase = useSupabaseBrowser();
  const { user } = useUser();
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  useEffect(() => {
    if (supabase && user) {
      fetchDashboardData();
    }
  }, [supabase, user]);

  const fetchDashboardData = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from('Company')
        .select('*')
        .single();

      if (companyError && companyError.code !== 'PGRST116') {
        console.error('Error fetching company:', companyError);
      } else {
        setCompany(companyData);
        
        if (companyData) {
          // Fetch subscription
          const { data: subData } = await supabase
            .from('Subscription')
            .select('*')
            .eq('company_id', companyData.id)
            .single();
          
          setSubscription(subData);

          // Fetch templates
          const { data: templatesData } = await supabase
            .from('Template')
            .select('*')
            .eq('company_id', companyData.id)
            .order('created_at', { ascending: false });
          
          setTemplates(templatesData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!supabase || !company || !newTemplateName.trim()) return;

    setIsCreatingTemplate(true);
    try {
      const { data, error } = await supabase
        .from('Template')
        .insert({
          name: newTemplateName.trim(),
          company_id: company.id,
          description: `${newTemplateName} documents for ${company.name}`
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates([data, ...templates]);
      setNewTemplateName('');
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const tokenUsagePercentage = subscription 
    ? (subscription.tokens_used / subscription.tokens_allocated) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Setting up your account...</h2>
          <p className="text-muted-foreground mb-4">
            Your company profile is being created. This usually takes just a moment after signing up.
          </p>
          <Button onClick={fetchDashboardData}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {company.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Usage Card */}
        {subscription && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Token Usage</h3>
                <p className="text-sm text-gray-600">
                  {subscription.tokens_used} of {subscription.tokens_allocated} tokens used this month
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {subscription.tokens_allocated - subscription.tokens_used}
                </div>
                <div className="text-sm text-gray-600">tokens remaining</div>
              </div>
            </div>
            <Progress value={tokenUsagePercentage} className="mb-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Resets on {new Date(subscription.billing_period_end).toLocaleDateString()}</span>
              {tokenUsagePercentage > 80 && (
                <span className="text-orange-600 font-medium">Running low on tokens</span>
              )}
            </div>
          </div>
        )}

        {/* Templates Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Document Templates</h2>
                <p className="text-gray-600">Create and manage your document templates</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Template Name</label>
                      <Input
                        placeholder="e.g., Proposals, Contracts, Reports"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={createTemplate} 
                      disabled={isCreatingTemplate || !newTemplateName.trim()}
                      className="w-full"
                    >
                      {isCreatingTemplate ? 'Creating...' : 'Create Template'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="p-6">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first document template to get started with AI-powered document generation.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Template Name</label>
                        <Input
                          placeholder="e.g., Proposals, Contracts, Reports"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={createTemplate} 
                        disabled={isCreatingTemplate || !newTemplateName.trim()}
                        className="w-full"
                      >
                        {isCreatingTemplate ? 'Creating...' : 'Create Template'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <Link key={template.id} href={`/dashboard/templates/${template.id}`}>
                    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center mb-3">
                        <FileText className="h-8 w-8 text-primary mr-3" />
                        <div>
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <p className="text-sm text-gray-600">
                            Created {new Date(template.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {template.description || `Generate ${template.name.toLowerCase()} documents with AI assistance`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}