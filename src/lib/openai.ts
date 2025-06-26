import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerationContext {
  companyName: string;
  companyAbout: string;
  websiteContent?: string;
  toneGuidelines?: string;
  templateName: string;
  templateToneReference?: string;
  sectionName: string;
  previousSections?: Array<{
    name: string;
    content: string;
  }>;
  customPrompt?: string;
}

export async function generateDocumentSection(context: GenerationContext): Promise<string> {
  const {
    companyName,
    companyAbout,
    websiteContent,
    toneGuidelines,
    templateName,
    templateToneReference,
    sectionName,
    previousSections = [],
    customPrompt
  } = context;

  // Build dynamic prompt based on available context
  let systemPrompt = `You are an expert business document writer. Generate professional, well-structured content for the "${sectionName}" section of a ${templateName} document.

Company Context:
- Company: ${companyName}
- About: ${companyAbout}`;

  if (websiteContent) {
    systemPrompt += `\n- Website Summary: ${websiteContent.substring(0, 500)}...`;
  }

  if (toneGuidelines) {
    systemPrompt += `\n- Tone Guidelines: ${toneGuidelines}`;
  }

  if (templateToneReference) {
    systemPrompt += `\n- Template Style Reference: ${templateToneReference}`;
  }

  systemPrompt += `\n\nInstructions:
1. Write content specifically for the "${sectionName}" section
2. Maintain consistency with the company's tone and style
3. Keep content professional and relevant to ${templateName}
4. Make it actionable and specific to ${companyName}
5. Length should be appropriate for the section (typically 2-4 paragraphs)`;

  if (previousSections.length > 0) {
    systemPrompt += `\n6. Ensure flow and consistency with previous sections`;
  }

  let userPrompt = `Generate the "${sectionName}" section for this ${templateName}.`;

  if (previousSections.length > 0) {
    userPrompt += `\n\nPrevious sections for context:\n`;
    previousSections.forEach(section => {
      userPrompt += `\n**${section.name}:**\n${section.content.substring(0, 200)}...\n`;
    });
  }

  if (customPrompt) {
    userPrompt += `\n\nAdditional requirements: ${customPrompt}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'Failed to generate content.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate content. Please try again.');
  }
}

export async function scrapeWebsiteContent(url: string): Promise<string> {
  try {
    // In a real implementation, you'd use a web scraping service
    // For MVP, we'll return a placeholder
    return `Website content from ${url} - This would contain scraped text content for tone analysis.`;
  } catch (error) {
    console.error('Website scraping error:', error);
    return '';
  }
}