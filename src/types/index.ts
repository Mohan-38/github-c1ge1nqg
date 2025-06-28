export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  image: string;
  imageUpload: File | null;
  features: string[];
  technical_details?: string;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  projectId: string; // camelCase for frontend
  project_id?: string; // snake_case from database
  projectTitle: string;
  project_title?: string; // snake_case from database
  customerName: string;
  customer_name?: string; // snake_case from database
  customerEmail: string;
  customer_email?: string; // snake_case from database
  price: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string; // camelCase version
  updatedAt?: string; // camelCase version
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  review_stage: 'review_1' | 'review_2' | 'review_3';
  document_category: 'presentation' | 'document' | 'report' | 'other';
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewStage {
  stage: 'review_1' | 'review_2' | 'review_3';
  name: string;
  description: string;
  documents: ProjectDocument[];
}

// New types for Project Requests System
export interface ProjectRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  project_title: string;
  project_type: string;
  budget_range: string;
  description: string;
  requirements?: string;
  timeline?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'converted';
  admin_notes?: string;
  estimated_price?: number;
  estimated_timeline?: string;
  assigned_to?: string;
  source: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  converted_at?: string;
  converted_project_id?: string;
}

export interface ProjectRequestStatusHistory {
  id: string;
  request_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface ProjectRequestStats {
  total: number;
  pending: number;
  reviewing: number;
  approved: number;
  rejected: number;
  converted: number;
  thisMonth: number;
  avgResponseTime: number; // in hours
}