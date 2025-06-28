/*
  # Fix Project Documents RLS Policy for Soft Deletion

  1. Policy Updates
    - Drop existing restrictive UPDATE policy for project_documents
    - Create new UPDATE policy that allows soft deletion (setting is_active to false)
    - Ensure authenticated users can properly update project documents including soft deletion

  2. Security
    - Maintain security by requiring authentication
    - Allow updates to all fields including is_active for soft deletion
    - Keep existing SELECT, INSERT, and DELETE policies intact
*/

-- Drop the existing UPDATE policy that's causing issues
DROP POLICY IF EXISTS "Authenticated users can update project documents" ON project_documents;

-- Create a new UPDATE policy that allows soft deletion
CREATE POLICY "Authenticated users can update project documents including soft delete"
  ON project_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure the policy allows updates to is_active field for soft deletion
-- This policy is more permissive but still requires authentication