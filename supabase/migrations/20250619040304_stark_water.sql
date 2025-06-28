/*
  Secure Document Delivery System
  - Creates tables, functions, and policies
  - Handles function replacement properly
  - Includes all necessary security measures
*/

BEGIN;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_secure_token();
DROP FUNCTION IF EXISTS cleanup_expired_tokens();

-- Create secure_download_tokens table
CREATE TABLE IF NOT EXISTS secure_download_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  document_path text NOT NULL,  -- Changed from document_id to path for direct storage reference
  recipient_email text NOT NULL,
  order_id text NOT NULL,       -- Changed to text to avoid FK constraints
  expires_at timestamptz NOT NULL,
  max_downloads integer DEFAULT 5,
  download_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create download_attempts table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_secure_tokens_token ON secure_download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_email ON secure_download_tokens(recipient_email);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_expires ON secure_download_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_active ON secure_download_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_download_attempts_token ON download_attempts(token_id);
CREATE INDEX IF NOT EXISTS idx_download_attempts_email ON download_attempts(attempted_email);

-- Enable RLS
ALTER TABLE secure_download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Secure tokens policies
  EXECUTE 'DROP POLICY IF EXISTS "Public can create secure tokens" ON secure_download_tokens';
  EXECUTE 'DROP POLICY IF EXISTS "Public can view active tokens for verification" ON secure_download_tokens';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update tokens" ON secure_download_tokens';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete tokens" ON secure_download_tokens';
  
  -- Download attempts policies
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert download attempts" ON download_attempts';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can view download attempts" ON download_attempts';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage download attempts" ON download_attempts';
END $$;

-- Policies for secure_download_tokens
CREATE POLICY "Public can create secure tokens"
  ON secure_download_tokens
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view active tokens for verification"
  ON secure_download_tokens
  FOR SELECT
  TO public
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Authenticated users can update tokens"
  ON secure_download_tokens
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tokens"
  ON secure_download_tokens
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for download_attempts
CREATE POLICY "Anyone can insert download attempts"
  ON download_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view download attempts"
  ON download_attempts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage download attempts"
  ON download_attempts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_length integer := 32;
  characters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..token_length LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM secure_download_tokens WHERE token = result) LOOP
    result := '';
    FOR i IN 1..token_length LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Function to cleanup expired tokens (returns void now)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate expired tokens
  UPDATE secure_download_tokens 
  SET is_active = false, updated_at = now()
  WHERE expires_at < now() AND is_active = true;
  
  -- Log the cleanup
  INSERT INTO download_attempts (token_id, attempted_email, success, failure_reason)
  SELECT id, 'system', true, 'Token expired and deactivated'
  FROM secure_download_tokens
  WHERE expires_at < now() AND is_active = false AND updated_at = now();
END;
$$;

-- Create trigger for token cleanup (optional)
CREATE OR REPLACE FUNCTION trigger_token_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM cleanup_expired_tokens();
  RETURN NULL;
END;
$$;

-- Create event trigger (if you want automatic cleanup)
DROP TRIGGER IF EXISTS token_cleanup_trigger ON secure_download_tokens;
CREATE TRIGGER token_cleanup_trigger
AFTER INSERT ON secure_download_tokens
EXECUTE FUNCTION trigger_token_cleanup();

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_secure_token() TO public;
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens() TO authenticated;

COMMIT;