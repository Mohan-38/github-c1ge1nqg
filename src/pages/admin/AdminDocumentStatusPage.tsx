import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  Search, 
  Filter, 
  Calendar,
  User,
  Package,
  Send,
  Eye,
  Download,
  Plus,
  X,
  Loader,
  AlertCircle,
  Trash2
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useProjects } from '../../context/ProjectContext';
import { Order } from '../../types';
import { uploadFile, deleteFile, validateFile, formatFileSize } from '../../utils/storage';
import { sendDocumentDelivery } from '../../utils/email';

interface DocumentStatus {
  orderId: string;
  customerName: string;
  customerEmail: string;
  projectTitle: string;
  projectId: string;
  orderDate: string;
  status: 'delivered' | 'pending' | 'no-documents' | 'partial';
  documentsCount: number;
  reviewStages: {
    review_1: number;
    review_2: number;
    review_3: number;
  };
  lastDeliveryDate?: string;
}

const AdminDocumentStatusPage = () => {
  const { 
    orders, 
    getProjectDocuments, 
    projects, 
    addProjectDocument, 
    updateProjectDocument, 
    deleteProjectDocument,
    getDocumentsByReviewStage 
  } = useProjects();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // Upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    url: '',
    type: '',
    size: 0,
    review_stage: 'review_1' as 'review_1' | 'review_2' | 'review_3',
    document_category: 'presentation' as 'presentation' | 'document' | 'report' | 'other',
    description: '',
    storage_path: ''
  });

  // Send email modal state
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [selectedReviewStages, setSelectedReviewStages] = useState<string[]>([]);

  // Calculate document status for each order
  const documentStatuses = useMemo(() => {
    return orders.map((order): DocumentStatus => {
      const documents = getProjectDocuments(order.projectId);
      const totalDocuments = documents.length;
      
      // Count documents by review stage
      const reviewStages = {
        review_1: documents.filter(doc => doc.review_stage === 'review_1').length,
        review_2: documents.filter(doc => doc.review_stage === 'review_2').length,
        review_3: documents.filter(doc => doc.review_stage === 'review_3').length
      };

      // Determine status
      let status: DocumentStatus['status'];
      if (totalDocuments === 0) {
        status = 'no-documents';
      } else if (order.status === 'completed' && totalDocuments > 0) {
        status = 'delivered';
      } else if (totalDocuments > 0 && order.status === 'pending') {
        status = 'pending';
      } else {
        status = 'partial';
      }

      return {
        orderId: order.id,
        customerName: order.customer_name || order.customerName,
        customerEmail: order.customer_email || order.customerEmail,
        projectTitle: order.project_title || order.projectTitle,
        projectId: order.projectId,
        orderDate: order.created_at || order.createdAt || '',
        status,
        documentsCount: totalDocuments,
        reviewStages,
        lastDeliveryDate: status === 'delivered' ? order.updated_at || order.updatedAt : undefined
      };
    });
  }, [orders, getProjectDocuments]);

  // Filter document statuses
  const filteredStatuses = documentStatuses.filter(status => {
    const matchesSearch = 
      status.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? status.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'delivered':
        return {
          bg: 'bg-green-100 dark:bg-green-900',
          text: 'text-green-800 dark:text-green-300',
          icon: CheckCircle,
          label: 'Delivered'
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: Clock,
          label: 'Pending Delivery'
        };
      case 'no-documents':
        return {
          bg: 'bg-red-100 dark:bg-red-900',
          text: 'text-red-800 dark:text-red-300',
          icon: AlertTriangle,
          label: 'No Documents'
        };
      case 'partial':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900',
          text: 'text-blue-800 dark:text-blue-300',
          icon: Upload,
          label: 'Partial'
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-700',
          text: 'text-slate-800 dark:text-slate-300',
          icon: FileText,
          label: 'Unknown'
        };
    }
  };

  // Calculate statistics
  const stats = {
    total: documentStatuses.length,
    delivered: documentStatuses.filter(s => s.status === 'delivered').length,
    pending: documentStatuses.filter(s => s.status === 'pending').length,
    noDocuments: documentStatuses.filter(s => s.status === 'no-documents').length,
    partial: documentStatuses.filter(s => s.status === 'partial').length
  };

  const statusOptions = [
    { value: 'delivered', label: 'Delivered' },
    { value: 'pending', label: 'Pending Delivery' },
    { value: 'no-documents', label: 'No Documents' },
    { value: 'partial', label: 'Partial' }
  ];

  const reviewStages = [
    { value: 'review_1', label: 'Review 1', description: 'Initial project review and requirements' },
    { value: 'review_2', label: 'Review 2', description: 'Mid-project review and progress assessment' },
    { value: 'review_3', label: 'Review 3', description: 'Final review and project completion' }
  ];

  const documentCategories = [
    { value: 'presentation', label: 'Presentation (PPT)', icon: FileText },
    { value: 'document', label: 'Document (Word/PDF)', icon: FileText },
    { value: 'report', label: 'Report', icon: FileText },
    { value: 'other', label: 'Other', icon: FileText }
  ];

  const openDetailsModal = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowDetailsModal(true);
    }
  };

  const openUploadModal = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setUploadFormData({
        name: '',
        url: '',
        type: '',
        size: 0,
        review_stage: 'review_1',
        document_category: 'presentation',
        description: '',
        storage_path: ''
      });
      setUploadError(null);
      setUploadSuccess(null);
      setShowUploadModal(true);
    }
  };

  const openSendModal = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setSelectedReviewStages([]);
      setSendError(null);
      setSendSuccess(null);
      setShowSendModal(true);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedOrder) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to Supabase Storage
      const uploadResult = await uploadFile(file, `${selectedOrder.projectId}/${uploadFormData.review_stage}`);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadFormData(prev => ({
        ...prev,
        name: file.name,
        url: uploadResult.url,
        type: file.type,
        size: uploadResult.size,
        storage_path: uploadResult.path
      }));

      setUploadSuccess('File uploaded successfully!');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file. Please check your permissions and try again.');
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadSuccess(null);
      }, 3000);
    }
  };

  // Handle document submission
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFormData.name || !uploadFormData.url || !selectedOrder) {
      setUploadError('Please provide a file name and URL');
      return;
    }

    try {
      await addProjectDocument({
        project_id: selectedOrder.projectId,
        name: uploadFormData.name,
        url: uploadFormData.url,
        type: uploadFormData.type,
        size: uploadFormData.size,
        review_stage: uploadFormData.review_stage,
        document_category: uploadFormData.document_category,
        description: uploadFormData.description,
        is_active: true
      });

      // Reset form
      setUploadFormData({
        name: '',
        url: '',
        type: '',
        size: 0,
        review_stage: 'review_1',
        document_category: 'presentation',
        description: '',
        storage_path: ''
      });
      
      setShowUploadModal(false);
      setUploadError(null);
      setUploadSuccess(null);
    } catch (error) {
      setUploadError('Failed to add document. Please check your permissions and try again.');
      console.error('Error adding document:', error);
    }
  };

  // Handle review stage selection for sending
  const handleReviewStageToggle = (stage: string) => {
    if (selectedReviewStages.includes(stage)) {
      setSelectedReviewStages(selectedReviewStages.filter(s => s !== stage));
    } else {
      setSelectedReviewStages([...selectedReviewStages, stage]);
    }
  };

  // Handle sending documents
  const handleSendDocuments = async () => {
    if (!selectedOrder || selectedReviewStages.length === 0) {
      setSendError('Please select at least one review stage');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      // Get project documents for selected review stages
      const allDocuments = getProjectDocuments(selectedOrder.projectId);
      const selectedDocuments = allDocuments.filter(doc => 
        selectedReviewStages.includes(doc.review_stage) && doc.is_active
      );

      if (selectedDocuments.length === 0) {
        throw new Error('No documents found for selected review stages');
      }

      // Format documents for email
      const formattedDocuments = selectedDocuments.map(doc => ({
        name: doc.name,
        url: doc.url,
        category: doc.document_category,
        review_stage: doc.review_stage,
        size: doc.size
      }));

      // Send document delivery email
      await sendDocumentDelivery({
        project_title: selectedOrder.project_title || selectedOrder.projectTitle,
        customer_name: selectedOrder.customer_name || selectedOrder.customerName,
        customer_email: selectedOrder.customer_email || selectedOrder.customerEmail,
        order_id: selectedOrder.id,
        documents: formattedDocuments,
        access_expires: 'Never (lifetime access)'
      });

      setSendSuccess('Documents sent successfully!');
      
      // Close modal after success
      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(null);
        setSelectedReviewStages([]);
      }, 2000);

    } catch (error) {
      console.error('Error sending documents:', error);
      setSendError(error instanceof Error ? error.message : 'Failed to send documents. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Document Delivery Status</h1>
            <p className="text-slate-500 dark:text-slate-400">Track document delivery status for all orders.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Delivered</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.delivered}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">No Documents</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.noDocuments}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Partial</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.partial}</h3>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search by customer, email, project, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>

            <div className="flex space-x-2">
              <div className="relative group">
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter ? statusOptions.find(s => s.value === statusFilter)?.label : 'All'}
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <button 
                    onClick={() => setStatusFilter(null)}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    All
                  </button>

                  {statusOptions.map(option => (
                    <button 
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Status Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mb-8">
          {filteredStatuses.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">No orders found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {documentStatuses.length === 0 
                  ? "No orders have been placed yet." 
                  : "No orders match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Documents
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredStatuses.map((status) => {
                    const statusBadge = getStatusBadge(status.status);
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <tr key={status.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-8 w-8 text-slate-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                {status.projectTitle}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                ID: {status.orderId.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-6 w-6 text-slate-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                {status.customerName}
                              </div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                <a href={`mailto:${status.customerEmail}`} className="hover:underline">
                                  {status.customerEmail}
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-slate-900 dark:text-slate-200">
                                {status.documentsCount}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <div>R1: {status.reviewStages.review_1}</div>
                              <div>R2: {status.reviewStages.review_2}</div>
                              <div>R3: {status.reviewStages.review_3}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {statusBadge.label}
                          </span>
                          {status.lastDeliveryDate && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Delivered: {formatDate(status.lastDeliveryDate)}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(status.orderDate)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openDetailsModal(status.orderId)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => openUploadModal(status.orderId)}
                              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900 rounded-lg transition-colors"
                              title="Upload documents"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                            
                            {status.documentsCount > 0 && (
                              <button
                                onClick={() => openSendModal(status.orderId)}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                                title="Send documents"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Order Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Order Information */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Order Information</h4>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-2">
                    <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                    <p><strong>Project:</strong> {selectedOrder.project_title || selectedOrder.projectTitle}</p>
                    <p><strong>Customer:</strong> {selectedOrder.customer_name || selectedOrder.customerName}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer_email || selectedOrder.customerEmail}</p>
                    <p><strong>Status:</strong> {selectedOrder.status}</p>
                    <p><strong>Order Date:</strong> {formatDate(selectedOrder.created_at || selectedOrder.createdAt || '')}</p>
                  </div>
                </div>

                {/* Document Status */}
                <div>
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Document Status</h4>
                  <div className="space-y-3">
                    {['review_1', 'review_2', 'review_3'].map((stage) => {
                      const documents = getProjectDocuments(selectedOrder.projectId).filter(
                        doc => doc.review_stage === stage && doc.is_active
                      );
                      const stageLabel = stage.replace('_', ' ').toUpperCase();
                      
                      return (
                        <div key={stage} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-slate-900 dark:text-slate-200">
                              {stageLabel}
                            </h5>
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                              {documents.length} docs
                            </span>
                          </div>
                          
                          {documents.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded</p>
                          ) : (
                            <div className="space-y-1">
                              {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-700 dark:text-slate-300">{doc.name}</span>
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Documents Modal */}
      {showUploadModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Upload Document - {selectedOrder.project_title || selectedOrder.projectTitle}
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleDocumentSubmit} className="p-6 space-y-6">
              {uploadError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <div>
                    <p>{uploadError}</p>
                    {uploadError.includes('permission') && (
                      <p className="text-sm mt-1">
                        Note: If you're getting permission errors, please contact your administrator to configure Supabase Storage policies.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {uploadSuccess}
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Upload File to Supabase Storage
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <span className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        Choose a file
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        disabled={isUploading}
                      />
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      PDF, DOC, PPT, XLS files up to 10MB
                    </p>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Loader className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Uploading... {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual URL Input */}
              <div className="text-center text-slate-500 dark:text-slate-400">
                <span>OR</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document URL (External Link)
                </label>
                <input
                  type="url"
                  value={uploadFormData.url}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="https://example.com/document.pdf"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  value={uploadFormData.name}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Enter document name"
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Review Stage
                  </label>
                  <select
                    value={uploadFormData.review_stage}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, review_stage: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                    disabled={isUploading}
                  >
                    {reviewStages.map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document Category
                  </label>
                  <select
                    value={uploadFormData.document_category}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, document_category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                    disabled={isUploading}
                  >
                    {documentCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Brief description of the document"
                  disabled={isUploading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!uploadFormData.name || !uploadFormData.url)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Add Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Documents Modal */}
      {showSendModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Send Documents - {selectedOrder.project_title || selectedOrder.projectTitle}
                </h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {sendError && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {sendError}
                </div>
              )}

              {sendSuccess && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {sendSuccess}
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">Customer Information</h4>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <p><strong>Name:</strong> {selectedOrder.customer_name || selectedOrder.customerName}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer_email || selectedOrder.customerEmail}</p>
                  <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">Select Review Stages to Send</h4>
                <div className="space-y-3">
                  {reviewStages.map((stage) => {
                    const documents = getProjectDocuments(selectedOrder.projectId).filter(
                      doc => doc.review_stage === stage.value && doc.is_active
                    );
                    
                    return (
                      <div
                        key={stage.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedReviewStages.includes(stage.value)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
                        }`}
                        onClick={() => handleReviewStageToggle(stage.value)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedReviewStages.includes(stage.value)}
                              onChange={() => handleReviewStageToggle(stage.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mr-3"
                            />
                            <div>
                              <h5 className="font-medium text-slate-900 dark:text-slate-200">{stage.label}</h5>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{stage.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {documents.length} docs
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendDocuments}
                  disabled={selectedReviewStages.length === 0 || isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Documents
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDocumentStatusPage;