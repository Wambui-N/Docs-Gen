import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateDocumentSection, scrapeWebsiteContent } from '@/lib/openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      documentId, 
      sectionId, 
      sectionName, 
      customPrompt 
    } = await req.json();

    // Get company and subscription info
    const { data: company } = await supabase
      .from('Company')
      .select('*, Subscription(*)')
      .eq('clerk_user_id', userId)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const subscription = company.Subscription[0];
    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Check token availability
    if (subscription.tokens_used >= subscription.tokens_allocated) {
      return NextResponse.json({ 
        error: 'Token limit reached. Please upgrade your plan or wait for renewal.' 
      }, { status: 429 });
    }

    // Get document and template info
    const { data: document } = await supabase
      .from('Document')
      .select('*, Template(*)')
      .eq('id', documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get previous sections for context
    const { data: previousSections } = await supabase
      .from('DocumentSection')
      .select('section_name, content')
      .eq('document_id', documentId)
      .lt('order_index', await getCurrentSectionIndex(sectionId))
      .order('order_index');

    // Scrape website content if available
    let websiteContent = '';
    if (company.website_url) {
      try {
        websiteContent = await scrapeWebsiteContent(company.website_url);
      } catch (error) {
        console.log('Website scraping failed, continuing without it');
      }
    }

    // Generate content
    const generatedContent = await generateDocumentSection({
      companyName: company.name,
      companyAbout: company.about,
      websiteContent,
      toneGuidelines: company.tone_guidelines,
      templateName: document.Template.name,
      templateToneReference: document.Template.tone_reference,
      sectionName,
      previousSections: previousSections?.map(s => ({
        name: s.section_name,
        content: s.content
      })) || [],
      customPrompt
    });

    // Update section content
    const { error: updateError } = await supabase
      .from('DocumentSection')
      .update({ 
        content: generatedContent,
        generated_by_ai: true
      })
      .eq('id', sectionId);

    if (updateError) {
      throw updateError;
    }

    // Update token usage
    const { error: tokenError } = await supabase
      .from('Subscription')
      .update({ tokens_used: subscription.tokens_used + 1 })
      .eq('id', subscription.id);

    if (tokenError) {
      throw tokenError;
    }

    // Log generation history
    await supabase
      .from('GenerationHistory')
      .insert({
        company_id: company.id,
        document_id: documentId,
        section_id: sectionId,
        tokens_consumed: 1,
        generation_type: 'section',
        prompt_used: `Section: ${sectionName}${customPrompt ? ` | Custom: ${customPrompt}` : ''}`
      });

    return NextResponse.json({ 
      content: generatedContent,
      tokensRemaining: subscription.tokens_allocated - subscription.tokens_used - 1
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate content' 
    }, { status: 500 });
  }
}

async function getCurrentSectionIndex(sectionId: string): Promise<number> {
  const { data } = await supabase
    .from('DocumentSection')
    .select('order_index')
    .eq('id', sectionId)
    .single();
  
  return data?.order_index || 0;
}