'use client';

import { useSupabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { Document, DocumentSection, Subscription } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Download, Wand2, RefreshCw, Save, Plus } from 'lucide-react';
import { exportToPDF, exportToDocx } from '@/lib/documentExport';
import Link from 'next/link';

export default function DocumentPage() {
  const supabase = useSupabaseBrowser();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    if (supabase && user && documentId) {
      fetchDocumentData();
    }
  }, [supabase, user, documentId]);

  const fetchDocumentData = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Fetch document with template info
      const { data: documentData, error: documentError } = await supabase
        .from('Document')
        .select('*, Template(*)')
        .eq('id', documentId)
        .single();

      if (documentError) {
        console.error('Error fetching document:', documentError);
        router.push('/dashboard');
        return;
      }

      setDocument(documentData);

      // Fetch sections
      const { data: sectionsData } = await supabase
        .from('DocumentSection')
        .select('*')
        .eq('document_id', documentId)
        .order('order_index');

      setSections(sectionsData || []);

      // Fetch subscription info
      const { data: company } = await supabase
        .from('Company')
        .select('id')
        .single();

      if (company) {
        const { data: subData } = await supabase
          .from('Subscription')
          .select('*')
          .eq('company_id', company.id)
          .single();
        
        setSubscription(subData);
      }
    } catch (error) {
      console.error('Error fetching document data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSection = async (sectionId: string, sectionName: string) => {
    if (!subscription || subscription.tokens_used >= subscription.tokens_allocated) {
      alert('You have reached your token limit. Please upgrade your plan or wait for renewal.');
      return;
    }

    setGeneratingSection(sectionId);
    try {
      const response = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          sectionId,
          sectionName,
          customPrompt: customPrompt.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      // Update the section in state
      setSections(sections.map(section => 
        section.id === sectionId 
          ? { ...section, content: data.content, generated_by_ai: true }
          : section
      ));

      // Update subscription tokens
      if (subscription) {
        setSubscription({
          ...subscription,
          tokens_used: subscription.tokens_used + 1
        });
      }

      setCustomPrompt('');
    } catch (error) {
      console.error('Error generating section:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setGeneratingSection(null);
    }
  };

  const saveSection = async (sectionId: string, content: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('DocumentSection')
        .update({ content })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.map(section => 
        section.id === sectionId 
          ? { ...section, content }
          : section
      ));

      setEditingSection(null);
      setEditContent('');
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section');
    }
  };

  const addSection = async () => {
    if (!supabase || !document || !newSectionName.trim()) return;

    try {
      const maxOrder = Math.max(...sections.map(s => s.order_index), -1);
      
      const { data, error } = await supabase
        .from('DocumentSection')
        .insert({
          document_id: documentId,
          section_name: newSectionName.trim(),
          content: '',
          order_index: maxOrder + 1,
          generated_by_ai: false
        })
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, data]);
      setNewSectionName('');
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to add section');
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!document || sections.length === 0) return;

    try {
      if (format === 'pdf') {
        await exportToPDF(document, sections);
      } else {
        await exportToDocx(document, sections);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Document not found</h2>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tokensRemaining = subscription ? subscription.tokens_allocated - subscription.tokens_used : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link href={`/dashboard/templates/${document.template_id}`}>
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
                <p className="text-sm text-gray-600">
                  {document.Template?.name} • {tokensRemaining} tokens remaining
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('docx')}>
                <Download className="h-4 w-4 mr-2" />
                DOCX
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Sections</h3>
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                  >
                    <span className="text-sm">{section.section_name}</span>
                    {section.generated_by_ai && (
                      <Wand2 className="h-3 w-3 text-primary" />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Section name"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={addSection}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">{section.section_name}</h2>
                      <div className="flex items-center space-x-2">
                        {section.generated_by_ai && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            AI Generated
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSection(section.id);
                            setEditContent(section.content);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {editingSection === section.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-64 p-4 border rounded-lg resize-none"
                          placeholder="Enter section content..."
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingSection(null);
                              setEditContent('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => saveSection(section.id, editContent)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {section.content ? (
                          <div className="prose max-w-none">
                            {section.content.split('\n').map((paragraph, index) => (
                              <p key={index} className="mb-4">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <p className="mb-4">This section is empty</p>
                            <div className="space-y-4">
                              <Input
                                placeholder="Add specific instructions for AI generation (optional)"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="max-w-md mx-auto"
                              />
                              <Button
                                onClick={() => generateSection(section.id, section.section_name)}
                                disabled={generatingSection === section.id || tokensRemaining <= 0}
                              >
                                {generatingSection === section.id ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Generate with AI
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {section.content && (
                          <div className="mt-6 pt-4 border-t">
                            <div className="flex items-center space-x-4">
                              <Input
                                placeholder="Add specific instructions for regeneration (optional)"
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                onClick={() => generateSection(section.id, section.section_name)}
                                disabled={generatingSection === section.id || tokensRemaining <= 0}
                              >
                                {generatingSection === section.id ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Regenerating...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Regenerate
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}