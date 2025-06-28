/*
  # Create secure document downloads system
  
  1. New Tables
    - `secure_download_tokens`
      - `id` (uuid, primary key)
      - `token` (text, unique)
      - `document_id` (uuid, references project_documents)
      - `recipient_email` (text)
      - `order_id` (uuid, references orders)
      - `expires_at` (timestamptz)
      - `max_downloads` (integer)
      - `download_count` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `download_attempts`
      - `id` (uuid, primary key)
      - `token_id` (uuid, references secure_download_tokens)
      - `attempted_email` (text)
      - `ip_address` (text)
      - `user_agent` (text)
      - `success` (boolean)
      - `failure_reason` (text)
      - `attempted_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for secure access
    - Add indexes for performance
*/

-- Create secure download tokens table
CREATE TABLE IF NOT EXISTS secure_download_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  document_id uuid REFERENCES project_documents(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  max_downloads integer DEFAULT 5,
  download_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create download attempts table for audit trail
CREATE TABLE IF NOT EXISTS download_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES secure_download_tokens(id) ON DELETE CASCADE,
  attempted_email text,
  ip_address text,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  attempted_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_secure_tokens_token ON secure_download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_email ON secure_download_tokens(recipient_email);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_expires ON secure_download_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_active ON secure_download_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_download_attempts_token ON download_attempts(token_id);
CREATE INDEX IF NOT EXISTS idx_download_attempts_email ON download_attempts(attempted_email);

-- Enable RLS
ALTER TABLE secure_download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for secure_download_tokens
CREATE POLICY "Public can view active tokens for verification"
  ON secure_download_tokens
  FOR SELECT
  TO public
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Authenticated users can manage tokens"
  ON secure_download_tokens
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for download_attempts
CREATE POLICY "Public can insert download attempts"
  ON download_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view download attempts"
  ON download_attempts
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE secure_download_tokens 
  SET is_active = false, updated_at = now()
  WHERE expires_at < now() AND is_active = true;
END;
$$;

-- Function to generate secure token
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token_length integer := 64;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..token_length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;