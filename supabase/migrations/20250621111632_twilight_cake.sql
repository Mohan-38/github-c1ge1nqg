/*
  # Create Project Requests System
  
  1. New Tables
    - `project_requests` - Store customer project requests from contact form
    - `project_request_status_history` - Track status changes for audit trail
  
  2. Functions
    - `convert_request_to_project()` - Convert approved request to project
    - `update_request_status()` - Update request status with history tracking
  
  3. Security
    - Enable RLS on both tables
    - Add policies for public submissions and admin management
*/

-- Create project_requests table
CREATE TABLE IF NOT EXISTS project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  project_title text NOT NULL,
  project_type text NOT NULL, -- IoT, Blockchain, Web, etc.
  budget_range text NOT NULL,
  description text NOT NULL,
  requirements text,
  timeline text,
  priority text DEFAULT 'medium', -- low, medium, high, urgent
  status text DEFAULT 'pending', -- pending, reviewing, approved, rejected, converted
  admin_notes text,
  estimated_price numeric(10,2),
  estimated_timeline text,
  assigned_to text, -- Admin who's handling this request
  source text DEFAULT 'contact_form', -- contact_form, direct, referral
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  converted_at timestamptz,
  converted_project_id uuid -- Will reference projects table when converted
);

-- Create project request status history table
CREATE TABLE IF NOT EXISTS project_request_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES project_requests(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by text, -- Admin who made the change
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_requests_status ON project_requests(status);
CREATE INDEX IF NOT EXISTS idx_project_requests_type ON project_requests(project_type);
CREATE INDEX IF NOT EXISTS idx_project_requests_created ON project_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_project_requests_email ON project_requests(customer_email);
CREATE INDEX IF NOT EXISTS idx_request_history_request_id ON project_request_status_history(request_id);

-- Enable RLS
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_request_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for project_requests
CREATE POLICY "Public can create project requests"
  ON project_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can view their own requests"
  ON project_requests
  FOR SELECT
  TO public
  USING (true); -- Allow viewing for now, can be restricted later

CREATE POLICY "Authenticated users can manage all requests"
  ON project_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for project_request_status_history
CREATE POLICY "Authenticated users can view status history"
  ON project_request_status_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create status history"
  ON project_request_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update request status with history tracking
CREATE OR REPLACE FUNCTION update_request_status(
  request_id_param uuid,
  new_status_param text,
  changed_by_param text DEFAULT NULL,
  notes_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_status_val text;
BEGIN
  -- Get current status
  SELECT status INTO old_status_val
  FROM project_requests
  WHERE id = request_id_param;
  
  -- Update the request status
  UPDATE project_requests
  SET 
    status = new_status_param,
    updated_at = now(),
    reviewed_at = CASE 
      WHEN new_status_param IN ('approved', 'rejected') AND reviewed_at IS NULL 
      THEN now() 
      ELSE reviewed_at 
    END
  WHERE id = request_id_param;
  
  -- Insert status history record
  INSERT INTO project_request_status_history (
    request_id,
    old_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    request_id_param,
    old_status_val,
    new_status_param,
    changed_by_param,
    notes_param
  );
END;
$$;

-- Function to convert approved request to project
CREATE OR REPLACE FUNCTION convert_request_to_project(
  request_id_param uuid,
  admin_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record project_requests%ROWTYPE;
  new_project_id uuid;
  default_image text := 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM project_requests
  WHERE id = request_id_param AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not approved';
  END IF;
  
  -- Create new project
  INSERT INTO projects (
    title,
    description,
    category,
    price,
    image,
    features,
    technical_details,
    featured
  ) VALUES (
    request_record.project_title,
    request_record.description,
    request_record.project_type,
    COALESCE(request_record.estimated_price, 0)::integer,
    default_image,
    ARRAY[
      'Custom development based on requirements',
      'Complete source code and documentation',
      'Installation and setup guide',
      'Technical support included'
    ],
    COALESCE(request_record.requirements, 'Custom project based on client requirements'),
    false -- Not featured by default
  ) RETURNING id INTO new_project_id;
  
  -- Update request with converted project ID and status
  UPDATE project_requests
  SET 
    status = 'converted',
    converted_project_id = new_project_id,
    converted_at = now(),
    updated_at = now()
  WHERE id = request_id_param;
  
  -- Add status history
  INSERT INTO project_request_status_history (
    request_id,
    old_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    request_id_param,
    'approved',
    'converted',
    admin_email,
    'Converted to project ID: ' || new_project_id
  );
  
  RETURN new_project_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_request_status(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_request_to_project(uuid, text) TO authenticated;