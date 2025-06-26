'use client';

import { useSupabaseBrowser } from '@/lib/supabaseBrowserClient';
import { useEffect, useState } from 'react';

interface Template {
  id: string;
  name: string;
}

interface TemplateManagerProps {
  companyId: string;
}

export default function TemplateManager({ companyId }: TemplateManagerProps) {
  const supabase = useSupabaseBrowser();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!supabase) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('Template')
        .select('id, name')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching templates:', error);
        setError('Could not fetch templates.');
      } else {
        setTemplates(data || []);
      }
      setLoading(false);
    };

    fetchTemplates();
  }, [supabase, companyId]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newTemplateName.trim()) return;

    const { data, error } = await supabase
      .from('Template')
      .insert({
        name: newTemplateName.trim(),
        company_id: companyId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      setError('Could not create template.');
    } else if (data) {
      setTemplates([...templates, data]);
      setNewTemplateName(''); // Clear input field
      setError('');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Document Templates</h3>
      {loading ? (
        <p>Loading templates...</p>
      ) : (
        <div>
          <ul className="space-y-2">
            {templates.map((template) => (
              <li key={template.id} className="p-4 bg-gray-100 rounded-md">
                {template.name}
              </li>
            ))}
             {templates.length === 0 && <p className="text-gray-500">No templates created yet.</p>}
          </ul>
        </div>
      )}

      <form onSubmit={handleCreateTemplate} className="mt-6 flex gap-2">
        <input
          type="text"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          placeholder="New template name (e.g., 'Proposals')"
          className="flex-grow p-2 border rounded-md"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Template
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
} 