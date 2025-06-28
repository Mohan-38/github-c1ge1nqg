import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, Inquiry, Order, ProjectDocument, ProjectRequest, ProjectRequestStatusHistory } from '../types';
import { sendDocumentDelivery, sendSecureDocumentDelivery, generateDownloadInstructions, sendNoDocumentsNotification } from '../utils/email';
import { generateSecureDownloadTokens } from '../utils/secureDownloads';

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  inquiries: Inquiry[];
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  projectDocuments: ProjectDocument[];
  addProjectDocument: (document: Omit<ProjectDocument, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProjectDocument: (id: string, document: Partial<ProjectDocument>) => Promise<void>;
  deleteProjectDocument: (id: string) => Promise<void>;
  getProjectDocuments: (projectId: string) => ProjectDocument[];
  getDocumentsByReviewStage: (projectId: string, reviewStage: string) => ProjectDocument[];
  sendProjectDocuments: (orderId: string, customerEmail: string, customerName: string) => Promise<void>;
  sendSecureProjectDocuments: (orderId: string, customerEmail: string, customerName: string, useSecure?: boolean) => Promise<void>;
  // New Project Requests functionality
  projectRequests: ProjectRequest[];
  addProjectRequest: (request: Omit<ProjectRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'source'>) => Promise<void>;
  updateProjectRequestStatus: (id: string, status: string, adminEmail?: string, notes?: string) => Promise<void>;
  convertRequestToProject: (requestId: string, adminEmail?: string) => Promise<string>;
  getRequestStatusHistory: (requestId: string) => Promise<ProjectRequestStatusHistory[]>;
  deleteProjectRequest: (id: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

// Utility function to convert camelCase to snake_case
const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Utility function to convert object keys from camelCase to snake_case
const convertKeysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = toSnakeCase(key);
      acc[snakeKey] = convertKeysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

// Utility function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Utility function to convert object keys from snake_case to camelCase
const convertKeysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = convertKeysToCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);

  // Load projects from Supabase on mount
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects(data || []);
    };

    fetchProjects();

    // Subscribe to changes
    const projectsSubscription = supabase
      .channel('projects_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      projectsSubscription.unsubscribe();
    };
  }, []);

  // Load inquiries from Supabase
  useEffect(() => {
    const fetchInquiries = async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inquiries:', error);
        return;
      }

      setInquiries(data || []);
    };

    fetchInquiries();

    // Subscribe to changes
    const inquiriesSubscription = supabase
      .channel('inquiries_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, (payload) => {
        fetchInquiries();
      })
      .subscribe();

    return () => {
      inquiriesSubscription.unsubscribe();
    };
  }, []);

  // Load orders from Supabase
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // Convert snake_case to camelCase for frontend compatibility
      const convertedOrders = (data || []).map(order => ({
        ...order,
        projectId: order.project_id, // Add camelCase version
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        projectTitle: order.project_title,
        createdAt: order.created_at,
        updatedAt: order.updated_at
      }));

      setOrders(convertedOrders);
    };

    fetchOrders();

    // Subscribe to changes
    const ordersSubscription = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  // Load project documents from Supabase
  useEffect(() => {
    const fetchProjectDocuments = async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project documents:', error);
        return;
      }

      console.log('Fetched project documents:', data); // Debug log
      setProjectDocuments(data || []);
    };

    fetchProjectDocuments();

    // Subscribe to changes
    const documentsSubscription = supabase
      .channel('project_documents_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_documents' }, (payload) => {
        fetchProjectDocuments();
      })
      .subscribe();

    return () => {
      documentsSubscription.unsubscribe();
    };
  }, []);

  // Load project requests from Supabase
  useEffect(() => {
    const fetchProjectRequests = async () => {
      const { data, error } = await supabase
        .from('project_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project requests:', error);
        return;
      }

      setProjectRequests(data || []);
    };

    fetchProjectRequests();

    // Subscribe to changes
    const requestsSubscription = supabase
      .channel('project_requests_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_requests' }, (payload) => {
        fetchProjectRequests();
      })
      .subscribe();

    return () => {
      requestsSubscription.unsubscribe();
    };
  }, []);

  const addProject = async (project: Omit<Project, 'id'>) => {
    // Remove imageUpload from the project data before sending to Supabase
    const { imageUpload, ...projectData } = project as any;
    
    // Convert keys to snake_case
    const snakeCaseData = convertKeysToSnakeCase(projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert([snakeCaseData])
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      return;
    }

    setProjects(prevProjects => [...prevProjects, data]);
  };

  const updateProject = async (id: string, updatedData: Partial<Project>) => {
    // Remove imageUpload from the update data before sending to Supabase
    const { imageUpload, ...dataToUpdate } = updatedData as any;
    
    // Convert keys to snake_case
    const snakeCaseData = convertKeysToSnakeCase(dataToUpdate);

    const { error } = await supabase
      .from('projects')
      .update(snakeCaseData)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      return;
    }

    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === id
          ? { ...project, ...updatedData }
          : project
      )
    );
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return;
    }

    setProjects(prevProjects => prevProjects.filter(project => project.id !== id));
  };

  const addInquiry = async (inquiry: Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>) => {
    // Convert keys to snake_case
    const snakeCaseData = convertKeysToSnakeCase({
      clientName: inquiry.name,
      email: inquiry.email,
      projectType: inquiry.projectType,
      budget: inquiry.budget,
      message: inquiry.message
    });

    const { data, error } = await supabase
      .from('inquiries')
      .insert([snakeCaseData])
      .select()
      .single();

    if (error) {
      console.error('Error adding inquiry:', error);
      return;
    }

    setInquiries(prevInquiries => [...prevInquiries, data]);
  };

  const deleteInquiry = async (id: string) => {
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inquiry:', error);
      return;
    }

    setInquiries(prevInquiries => prevInquiries.filter(inquiry => inquiry.id !== id));
  };

  const addOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) => {
    // Convert keys to snake_case for database
    const snakeCaseData = {
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      project_id: order.projectId,
      project_title: order.projectTitle,
      price: order.price,
      status: order.status
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([snakeCaseData])
      .select()
      .single();

    if (error) {
      console.error('Error adding order:', error);
      throw error;
    }

    // Convert back to camelCase for frontend
    const convertedOrder = {
      ...data,
      projectId: data.project_id,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      projectTitle: data.project_title,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    setOrders(prevOrders => [...prevOrders, convertedOrder]);

    // Check if documents are available for this project
    const documents = getProjectDocuments(convertedOrder.projectId);
    
    if (documents.length === 0) {
      // No documents available - send "Documents Coming Soon" email
      console.log('📭 No documents available for project, sending "Documents Coming Soon" email...');
      try {
        await sendNoDocumentsNotification({
          project_title: convertedOrder.projectTitle,
          customer_name: convertedOrder.customerName,
          customer_email: convertedOrder.customerEmail,
          order_id: convertedOrder.id,
          documents: [], // Empty array since no documents
          access_expires: 'Documents will be delivered within 3 business days'
        });
        console.log('✅ "Documents Coming Soon" email sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending "Documents Coming Soon" email:', emailError);
        // Don't throw here as the order was successful, just log the email error
      }
    } else {
      // Documents are available - send secure document delivery email
      console.log('📄 Documents available for project, sending secure document delivery email...');
      try {
        await sendSecureProjectDocumentsForOrder(convertedOrder, order.customerEmail, order.customerName, true);
        console.log('✅ Secure document delivery email sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending secure document delivery email:', emailError);
        // Don't throw here as the order was successful, just log the email error
      }
    }

    return convertedOrder;
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating order status:', error);
      return;
    }

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === id
          ? { ...order, status }
          : order
      )
    );
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      return;
    }

    setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
  };

  // Project Documents functions
  const addProjectDocument = async (document: Omit<ProjectDocument, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('project_documents')
      .insert([document])
      .select()
      .single();

    if (error) {
      console.error('Error adding project document:', error);
      throw error;
    }

    setProjectDocuments(prevDocs => [...prevDocs, data]);
  };

  const updateProjectDocument = async (id: string, document: Partial<ProjectDocument>) => {
    const { error } = await supabase
      .from('project_documents')
      .update({ ...document, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating project document:', error);
      return;
    }

    setProjectDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.id === id
          ? { ...doc, ...document }
          : doc
      )
    );
  };

  const deleteProjectDocument = async (id: string) => {
    const { error } = await supabase
      .from('project_documents')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting project document:', error);
      return;
    }

    setProjectDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
  };

  const getProjectDocuments = (projectId: string): ProjectDocument[] => {
    console.log('Getting documents for project ID:', projectId); // Debug log
    console.log('Available documents:', projectDocuments); // Debug log
    
    const documents = projectDocuments.filter(doc => doc.project_id === projectId && doc.is_active);
    console.log('Filtered documents:', documents); // Debug log
    
    return documents;
  };

  const getDocumentsByReviewStage = (projectId: string, reviewStage: string): ProjectDocument[] => {
    return projectDocuments.filter(
      doc => doc.project_id === projectId && 
             doc.review_stage === reviewStage && 
             doc.is_active
    );
  };

  // Helper function to send secure documents for a specific order object
  const sendSecureProjectDocumentsForOrder = async (
    order: Order, 
    customerEmail: string, 
    customerName: string, 
    useSecure: boolean = true
  ) => {
    try {
      // Get all documents for the project
      const documents = getProjectDocuments(order.projectId);
      
      if (documents.length === 0) {
        console.log('No documents found for project, skipping email');
        return;
      }

      if (useSecure) {
        console.log('🔒 Using SECURE document delivery with time-limited links');
        
        // Generate secure download tokens
        const secureUrls = await generateSecureDownloadTokens(
          documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            url: doc.url
          })),
          customerEmail,
          order.id,
          {
            expirationHours: 72, // 3 days
            maxDownloads: 5,
            requireEmailVerification: true
          }
        );

        // Format secure documents for email
        const secureDocuments = secureUrls.map(secureUrl => {
          const originalDoc = documents.find(doc => doc.id === secureUrl.documentId);
          return {
            documentName: secureUrl.documentName,
            secureUrl: secureUrl.secureUrl,
            category: originalDoc?.document_category || 'document',
            review_stage: originalDoc?.review_stage || 'review_1',
            size: originalDoc?.size || 0
          };
        });

        // Send secure document delivery email
        await sendSecureDocumentDelivery({
          project_title: order.projectTitle,
          customer_name: customerName,
          customer_email: customerEmail,
          order_id: order.id,
          secureDocuments,
          expiresAt: secureUrls[0]?.expiresAt || new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          maxDownloads: 5
        });

        console.log('✅ Secure document delivery email sent successfully');
      } else {
        console.log('📧 Using LEGACY document delivery with direct links');
        
        // Format documents for legacy email
        const formattedDocuments = documents.map(doc => ({
          name: doc.name,
          url: doc.url,
          category: doc.document_category,
          review_stage: doc.review_stage
        }));

        // Send legacy document delivery email
        await sendDocumentDelivery({
          project_title: order.projectTitle,
          customer_name: customerName,
          customer_email: customerEmail,
          order_id: order.id,
          documents: formattedDocuments,
          access_expires: 'Never (lifetime access)'
        });

        console.log('✅ Legacy document delivery email sent successfully');
      }
    } catch (error) {
      console.error('Error sending project documents:', error);
      throw error;
    }
  };

  // Legacy function for backward compatibility
  const sendProjectDocuments = async (orderId: string, customerEmail: string, customerName: string) => {
    try {
      // Find the order to get project details
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await sendSecureProjectDocumentsForOrder(order, customerEmail, customerName, false);
    } catch (error) {
      console.error('Error sending project documents:', error);
      throw error;
    }
  };

  // New secure function
  const sendSecureProjectDocuments = async (
    orderId: string, 
    customerEmail: string, 
    customerName: string, 
    useSecure: boolean = true
  ) => {
    try {
      // Find the order to get project details
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await sendSecureProjectDocumentsForOrder(order, customerEmail, customerName, useSecure);
    } catch (error) {
      console.error('Error sending secure project documents:', error);
      throw error;
    }
  };

  // Project Requests functions
  const addProjectRequest = async (request: Omit<ProjectRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'source'>) => {
    const { data, error } = await supabase
      .from('project_requests')
      .insert([{
        ...request,
        status: 'pending',
        source: 'contact_form'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding project request:', error);
      throw error;
    }

    setProjectRequests(prevRequests => [...prevRequests, data]);
  };

  const updateProjectRequestStatus = async (id: string, status: string, adminEmail?: string, notes?: string) => {
    const { error } = await supabase.rpc('update_request_status', {
      request_id_param: id,
      new_status_param: status,
      changed_by_param: adminEmail,
      notes_param: notes
    });

    if (error) {
      console.error('Error updating project request status:', error);
      throw error;
    }

    // Refresh the requests list
    const { data } = await supabase
      .from('project_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProjectRequests(data);
    }
  };

  const convertRequestToProject = async (requestId: string, adminEmail?: string): Promise<string> => {
    const { data, error } = await supabase.rpc('convert_request_to_project', {
      request_id_param: requestId,
      admin_email: adminEmail
    });

    if (error) {
      console.error('Error converting request to project:', error);
      throw error;
    }

    // Refresh both requests and projects
    const [requestsResult, projectsResult] = await Promise.all([
      supabase.from('project_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('created_at', { ascending: false })
    ]);

    if (requestsResult.data) {
      setProjectRequests(requestsResult.data);
    }

    if (projectsResult.data) {
      setProjects(projectsResult.data);
    }

    return data; // Returns the new project ID
  };

  const getRequestStatusHistory = async (requestId: string): Promise<ProjectRequestStatusHistory[]> => {
    const { data, error } = await supabase
      .from('project_request_status_history')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching request status history:', error);
      return [];
    }

    return data || [];
  };

  const deleteProjectRequest = async (id: string) => {
    const { error } = await supabase
      .from('project_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project request:', error);
      return;
    }

    setProjectRequests(prevRequests => prevRequests.filter(request => request.id !== id));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        addProject,
        updateProject,
        deleteProject,
        inquiries,
        addInquiry,
        deleteInquiry,
        orders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        projectDocuments,
        addProjectDocument,
        updateProjectDocument,
        deleteProjectDocument,
        getProjectDocuments,
        getDocumentsByReviewStage,
        sendProjectDocuments,
        sendSecureProjectDocuments,
        // New Project Requests functionality
        projectRequests,
        addProjectRequest,
        updateProjectRequestStatus,
        convertRequestToProject,
        getRequestStatusHistory,
        deleteProjectRequest,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};