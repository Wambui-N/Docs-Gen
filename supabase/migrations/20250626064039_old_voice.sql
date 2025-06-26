/*
  # MVP Schema for Document Generation SaaS

  1. New Tables
    - `Company` - Company profiles with tone settings
    - `Subscription` - Stripe billing and token tracking
    - `Template` - Document templates (Proposals, NDAs, etc.)
    - `Document` - Generated documents with sections
    - `DocumentSection` - Individual sections within documents
    - `GenerationHistory` - Track token usage and AI generations

  2. Security
    - Enable RLS on all tables
    - Add policies for company-based access control
    - Ensure users can only access their company's data

  3. Features
    - Token-based billing system
    - Company tone/style storage
    - Template-based document generation
    - Section-by-section AI generation tracking
*/

-- Company table (enhanced)
CREATE TABLE IF NOT EXISTS Company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT 'My Company',
  about text DEFAULT '',
  website_url text DEFAULT '',
  tone_guidelines text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription and billing
CREATE TABLE IF NOT EXISTS Subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES Company(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_name text DEFAULT 'pro',
  tokens_allocated integer DEFAULT 100,
  tokens_used integer DEFAULT 0,
  billing_period_start timestamptz DEFAULT now(),
  billing_period_end timestamptz DEFAULT (now() + interval '1 month'),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Templates (enhanced)
CREATE TABLE IF NOT EXISTS Template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES Company(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  tone_reference text DEFAULT '',
  structure_reference jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS Document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES Template(id) ON DELETE CASCADE,
  company_id uuid REFERENCES Company(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text DEFAULT 'draft',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document sections
CREATE TABLE IF NOT EXISTS DocumentSection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES Document(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  content text DEFAULT '',
  order_index integer DEFAULT 0,
  generated_by_ai boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Generation history for token tracking
CREATE TABLE IF NOT EXISTS GenerationHistory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES Company(id) ON DELETE CASCADE,
  document_id uuid REFERENCES Document(id) ON DELETE CASCADE,
  section_id uuid REFERENCES DocumentSection(id) ON DELETE CASCADE,
  tokens_consumed integer DEFAULT 1,
  generation_type text DEFAULT 'section',
  prompt_used text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE Company ENABLE ROW LEVEL SECURITY;
ALTER TABLE Subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE Template ENABLE ROW LEVEL SECURITY;
ALTER TABLE Document ENABLE ROW LEVEL SECURITY;
ALTER TABLE DocumentSection ENABLE ROW LEVEL SECURITY;
ALTER TABLE GenerationHistory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Company
CREATE POLICY "Users can read own company data"
  ON Company
  FOR SELECT
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own company data"
  ON Company
  FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- RLS Policies for Subscription
CREATE POLICY "Users can read own subscription"
  ON Subscription
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM Company WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update own subscription"
  ON Subscription
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM Company WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policies for Template
CREATE POLICY "Users can manage own templates"
  ON Template
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM Company WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policies for Document
CREATE POLICY "Users can manage own documents"
  ON Document
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM Company WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- RLS Policies for DocumentSection
CREATE POLICY "Users can manage own document sections"
  ON DocumentSection
  FOR ALL
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM Document WHERE company_id IN (
        SELECT id FROM Company WHERE clerk_user_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- RLS Policies for GenerationHistory
CREATE POLICY "Users can read own generation history"
  ON GenerationHistory
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM Company WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "System can insert generation history"
  ON GenerationHistory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM Company WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Create default subscription for existing companies
DO $$
BEGIN
  INSERT INTO Subscription (company_id, tokens_allocated, tokens_used)
  SELECT id, 100, 0
  FROM Company
  WHERE id NOT IN (SELECT company_id FROM Subscription WHERE company_id IS NOT NULL);
END $$;