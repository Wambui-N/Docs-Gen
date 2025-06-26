'use client';

import { useSupabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { Template, Document } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, ArrowLeft, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';

export default function TemplatePage() {
  const supabase = useSupabaseBrowser();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  useEffect(() => {
    if (supabase && user && templateId) {
      fetchTemplateData();
    }
  }, [supabase, user, templateId]);

  const fetchTemplateData = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Fetch template
      const { data: templateData, error: templateError } = await supabase
        .from('Template')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        console.error('Error fetching template:', templateError);
        router.push('/dashboard');
        return;
      }

      setTemplate(templateData);

      // Fetch documents for this template
      const { data: documentsData } = await supabase
        .from('Document')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      setDocuments(documentsData || []);
    } catch (error) {
      console.error('Error fetching template data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!supabase || !template || !newDocumentTitle.trim()) return;

    setIsCreatingDocument(true);
    try {
      // Get company ID
      const { data: company } = await supabase
        .from('Company')
        .select('id')
        .single();

      if (!company) throw new Error('Company not found');

      const { data, error } = await supabase
        .from('Document')
        .insert({
          template_id: templateId,
          company_id: company.id,
          title: newDocumentTitle.trim(),
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Create default sections for the document
      const defaultSections = [
        { name: 'Executive Summary', order: 0 },
        { name: 'Introduction', order: 1 },
        { name: 'Main Content', order: 2 },
        { name: 'Conclusion', order: 3 }
      ];

      const sectionsToInsert = defaultSections.map(section => ({
        document_id: data.id,
        section_name: section.name,
        content: '',
        order_index: section.order,
        generated_by_ai: false
      }));

      await supabase
        .from('DocumentSection')
        .insert(sectionsToInsert);

      setDocuments([data, ...documents]);
      setNewDocumentTitle('');
      
      // Navigate to the new document
      router.push(`/dashboard/documents/${data.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setIsCreatingDocument(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Template not found</h2>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
                <p className="text-gray-600">{template.description}</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New {template.name} Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Document Title</label>
                    <Input
                      placeholder={`e.g., ${template.name} for Client Name`}
                      value={newDocumentTitle}
                      onChange={(e) => setNewDocumentTitle(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={createDocument} 
                    disabled={isCreatingDocument || !newDocumentTitle.trim()}
                    className="w-full"
                  >
                    {isCreatingDocument ? 'Creating...' : 'Create Document'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Documents</h2>
            <p className="text-gray-600">All {template.name.toLowerCase()} documents</p>
          </div>

          <div className="p-6">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first {template.name.toLowerCase()} document to get started.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New {template.name} Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Document Title</label>
                        <Input
                          placeholder={`e.g., ${template.name} for Client Name`}
                          value={newDocumentTitle}
                          onChange={(e) => setNewDocumentTitle(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={createDocument} 
                        disabled={isCreatingDocument || !newDocumentTitle.trim()}
                        className="w-full"
                      >
                        {isCreatingDocument ? 'Creating...' : 'Create Document'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <Link key={document.id} href={`/dashboard/documents/${document.id}`}>
                    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 text-primary mr-4" />
                          <div>
                            <h3 className="font-semibold text-lg">{document.title}</h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              Created {new Date(document.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            document.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : document.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {document.status}
                          </span>
                          <Edit className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
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