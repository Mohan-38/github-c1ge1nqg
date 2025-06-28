/*
  # Add RLS policies for projects table

  1. Security
    - Enable RLS on projects table if not already enabled
    - Add policies for CRUD operations with existence checks:
      - SELECT: Allow anyone to view projects
      - INSERT: Allow authenticated users to create projects
      - UPDATE: Allow authenticated users to update projects
      - DELETE: Allow authenticated users to delete projects
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'projects' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
  DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
  DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
  DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;
END $$;

-- Policy for reading projects (anyone can read)
CREATE POLICY "Anyone can view projects"
ON projects
FOR SELECT
USING (true);

-- Policy for creating projects (authenticated users only)
CREATE POLICY "Authenticated users can create projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for updating projects (authenticated users)
CREATE POLICY "Authenticated users can update projects"
ON projects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for deleting projects (authenticated users)
CREATE POLICY "Authenticated users can delete projects"
ON projects
FOR DELETE
TO authenticated
USING (true);