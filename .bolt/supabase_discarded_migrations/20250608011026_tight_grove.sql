-- Create the storage bucket for project documents
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
) VALUES (
  'project-documents',
  'project-documents',
  true, -- Public downloads
  10485760, -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create helper function for admin access during migration
CREATE OR REPLACE FUNCTION create_storage_policies()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Temporarily disable RLS for policy creation
  ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
  
  -- Admin upload policy
  CREATE POLICY "Admin upload access" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-documents'
    AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  );
  
  -- Admin management policy
  CREATE POLICY "Admin management access" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  );
  
  -- Public read access
  CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'project-documents');
  
  -- Re-enable RLS
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
END;
$$;

-- Execute the function
SELECT create_storage_policies();

-- Clean up the temporary function
DROP FUNCTION IF EXISTS create_storage_policies;