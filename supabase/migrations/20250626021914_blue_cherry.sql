/*
  # Fix Project Documents RLS Policies

  1. Security Updates
    - Drop existing problematic UPDATE policies for project_documents
    - Create new comprehensive RLS policies that allow authenticated users to properly manage project documents
    - Ensure soft delete operations (setting is_active = false) work correctly

  2. Policy Changes
    - Allow authenticated users to update all fields including is_active
    - Maintain existing SELECT and INSERT policies
    - Fix the UPDATE policies that are causing the RLS violation
*/

-- Drop existing problematic UPDATE policies
DROP POLICY IF EXISTS "Authenticated users can delete project documents" ON project_documents;
DROP POLICY IF EXISTS "Authenticated users can update project documents" ON project_documents;

-- Create comprehensive UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can manage project documents"
  ON project_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure the INSERT policy exists and works correctly
DROP POLICY IF EXISTS "Authenticated users can create project documents" ON project_documents;
CREATE POLICY "Authenticated users can create project documents"
  ON project_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the SELECT policy allows viewing active documents
DROP POLICY IF EXISTS "Anyone can view project documents" ON project_documents;
CREATE POLICY "Anyone can view project documents"
  ON project_documents
  FOR SELECT
  TO public
  USING (is_active = true);

-- Add a policy for authenticated users to view all documents (including inactive ones)
CREATE POLICY "Authenticated users can view all project documents"
  ON project_documents
  FOR SELECT
  TO authenticated
  USING (true);