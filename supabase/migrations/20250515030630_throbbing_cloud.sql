/*
  # Update projects table schema
  
  1. Changes
    - Add image_upload column to projects table
    - Create table if not exists
    - Add policies if they don't exist
  
  2. Security
    - Enable RLS
    - Add policies for public viewing and authenticated CRUD operations
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price integer NOT NULL,
  image text NOT NULL,
  image_upload text,
  features text[] NOT NULL DEFAULT '{}',
  technical_details text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'Anyone can view projects'
  ) THEN
    CREATE POLICY "Anyone can view projects"
      ON projects
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'Authenticated users can create projects'
  ) THEN
    CREATE POLICY "Authenticated users can create projects"
      ON projects
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'Authenticated users can update their projects'
  ) THEN
    CREATE POLICY "Authenticated users can update their projects"
      ON projects
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'Authenticated users can delete their projects'
  ) THEN
    CREATE POLICY "Authenticated users can delete their projects"
      ON projects
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Insert sample projects if they don't exist
INSERT INTO projects (title, description, category, price, image, features, technical_details, featured)
SELECT
  'NextGen Diary - Smart Journal System',
  'An IoT-based smart diary system that combines traditional journaling with modern technology. Features voice commands, mood tracking, and automated environmental context recording.',
  'IoT',
  49999,
  'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  ARRAY[
    'Voice command journaling',
    'Mood tracking with environmental sensors',
    'Automated time and location tagging',
    'Mobile app integration',
    'Cloud backup and sync',
    'Privacy-focused encryption'
  ],
  'Built with Arduino Nano 33 IoT, custom PCB design, React Native mobile app, and Node.js backend. Includes complete documentation and setup guide.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE title = 'NextGen Diary - Smart Journal System'
);

INSERT INTO projects (title, description, category, price, image, features, technical_details, featured)
SELECT
  'EvalUT - Blockchain Evaluation System',
  'A blockchain-based academic evaluation system that ensures transparency and immutability of student records, grades, and certifications.',
  'Blockchain',
  149999,
  'https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  ARRAY[
    'Immutable academic records',
    'Smart contract-based grade submission',
    'Automated certificate generation',
    'Multi-stakeholder verification',
    'Integration with existing systems',
    'Detailed audit trails'
  ],
  'Developed using Ethereum blockchain, Solidity smart contracts, React.js frontend, and Node.js backend. Includes API documentation and deployment guides.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE title = 'EvalUT - Blockchain Evaluation System'
);

INSERT INTO projects (title, description, category, price, image, features, technical_details, featured)
SELECT
  'Modern College Website',
  'A comprehensive college website with modern design, advanced features, and seamless integration capabilities for academic management.',
  'Web',
  99999,
  'https://images.pexels.com/photos/1036841/pexels-photo-1036841.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  ARRAY[
    'Responsive design',
    'Student portal integration',
    'Course management system',
    'Events calendar',
    'Faculty profiles',
    'Online admission system'
  ],
  'Built with React.js, Node.js, Express, MongoDB, and AWS services. Includes CMS integration and admin dashboard.',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE title = 'Modern College Website'
);