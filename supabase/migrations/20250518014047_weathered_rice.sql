-- Create Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  project_type text NOT NULL,
  budget text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on inquiries if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'inquiries' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view inquiries" ON inquiries;
  DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON inquiries;
  DROP POLICY IF EXISTS "Authenticated users can update inquiries" ON inquiries;
  DROP POLICY IF EXISTS "Authenticated users can delete inquiries" ON inquiries;
END $$;

-- Create policies for inquiries
CREATE POLICY "Anyone can view inquiries"
  ON inquiries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create inquiries"
  ON inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inquiries"
  ON inquiries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inquiries"
  ON inquiries
  FOR DELETE
  TO authenticated
  USING (true);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  project_id uuid REFERENCES projects(id),
  project_title text NOT NULL,
  price numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on orders if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
  DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
  DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
  DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;
END $$;

-- Create policies for orders
CREATE POLICY "Anyone can view orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);