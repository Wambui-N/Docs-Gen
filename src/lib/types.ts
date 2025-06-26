export interface Company {
  id: string;
  clerk_user_id: string;
  name: string;
  about: string;
  website_url: string;
  tone_guidelines: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_name: string;
  tokens_allocated: number;
  tokens_used: number;
  billing_period_start: string;
  billing_period_end: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  company_id: string;
  name: string;
  description: string;
  tone_reference: string;
  structure_reference: any[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  template_id: string;
  company_id: string;
  title: string;
  status: 'draft' | 'completed' | 'archived';
  metadata: any;
  created_at: string;
  updated_at: string;
  template?: Template;
  sections?: DocumentSection[];
}

export interface DocumentSection {
  id: string;
  document_id: string;
  section_name: string;
  content: string;
  order_index: number;
  generated_by_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerationHistory {
  id: string;
  company_id: string;
  document_id: string;
  section_id: string;
  tokens_consumed: number;
  generation_type: string;
  prompt_used: string;
  created_at: string;
}