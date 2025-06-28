/*
  # Enhance project documents table for review stages
  
  1. Changes
    - Add review_stage column to project_documents table
    - Add document_category column for better organization
    - Update RLS policies for document management
    - Add indexes for better performance
  
  2. Security
    - Enable RLS on project_documents table
    - Add policies for public viewing and authenticated CRUD operations
*/

-- Add new columns to project_documents table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_documents' AND column_name = 'review_stage'
  ) THEN
    ALTER TABLE project_documents ADD COLUMN review_stage text NOT NULL DEFAULT 'review_1';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_documents' AND column_name = 'document_category'
  ) THEN
    ALTER TABLE project_documents ADD COLUMN document_category text NOT NULL DEFAULT 'presentation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_documents' AND column_name = 'description'
  ) THEN
    ALTER TABLE project_documents ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_documents' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE project_documents ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_review_stage ON project_documents(review_stage);
CREATE INDEX IF NOT EXISTS idx_project_documents_category ON project_documents(document_category);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'project_documents' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view project documents" ON project_documents;
  DROP POLICY IF EXISTS "Authenticated users can create project documents" ON project_documents;
  DROP POLICY IF EXISTS "Authenticated users can update project documents" ON project_documents;
  DROP POLICY IF EXISTS "Authenticated users can delete project documents" ON project_documents;
END $$;

-- Create policies for project_documents
CREATE POLICY "Anyone can view project documents"
  ON project_documents
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can create project documents"
  ON project_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project documents"
  ON project_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project documents"
  ON project_documents
  FOR DELETE
  TO authenticated
  USING (true);