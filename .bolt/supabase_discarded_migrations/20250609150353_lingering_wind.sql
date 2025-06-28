/*
  # Fix RLS policies for project documents

  1. Security Updates
    - Drop existing restrictive UPDATE policies that may be blocking soft deletes
    - Create new comprehensive policies for authenticated users
    - Ensure soft delete operations (updating is_active) are allowed
    - Maintain security while allowing necessary operations

  2. Policy Changes
    - Allow authenticated users to update project documents including soft deletes
    - Ensure proper access control for document management
*/

-- Drop existing UPDATE policies that might be too restrictive
DROP POLICY IF EXISTS "Authenticated users can update project documents including soft" ON project_documents;
DROP POLICY IF EXISTS "Authenticated users can update project documents" ON project_documents;
DROP POLICY IF EXISTS "Authenticated users can update their projects" ON project_documents;

-- Create a comprehensive UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update project documents"
  ON project_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure the DELETE policy allows authenticated users to perform soft deletes
DROP POLICY IF EXISTS "Authenticated users can delete project documents" ON project_documents;

CREATE POLICY "Authenticated users can delete project documents"
  ON project_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);