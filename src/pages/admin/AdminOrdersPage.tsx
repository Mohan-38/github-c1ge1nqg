import React, { useState } from 'react';
import { 
  Mail, 
  Download, 
  Search, 
  Calendar, 
  ChevronDown, 
  Filter, 
  Trash2, 
  AlertCircle, 
  Eye, 
  Upload, 
  Send,
  X,
  FileText,
  User,
  Package,
  CheckCircle,
  Loader,
  Plus,
  ChevronUp
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useProjects } from '../../context/ProjectContext';
import { Order } from '../../types';
import { uploadFile, deleteFile, validateFile, formatFileSize } from '../../utils/storage';
import { sendDocumentDelivery } from '../../utils/email';

const AdminOrdersPage = () => {
  const { 
    orders, 
    updateOrderStatus, 
    deleteOrder, 
    getProjectDocuments, 
    addProjectDocument, 
    sendSecureProjectDocuments,
    getDocumentsByReviewStage 
  } = useProjects();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [expandedReviewStage, setExpandedReviewStage] = useState<string | null>(null);
  
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

  // Format date helper function
  const formatDate = (dateString: string | undefined) => {
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

  // Format price in Indian Rupees with color coding
  const formatPrice = (price: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);

    // Color coding based on price ranges
    let colorClass = '';
    if (price >= 100000) {
      colorClass = 'text-green-600 dark:text-green-400 font-bold'; // High value
    } else if (price >= 50000) {
      colorClass = 'text-blue-600 dark:text-blue-400 font-semibold'; // Medium value
    } else {
      colorClass = 'text-orange-600 dark:text-orange-400'; // Lower value
    }

    return { formatted, colorClass };
  };

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.project_title?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  // Sorting functionality
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedOrders = () => {
    if (!sortConfig) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      // Handle different data types appropriately
      let aValue: any, bValue: any;
      
      // Special handling for dates
      if (sortConfig.key === 'date') {
        aValue = new Date(a.created_at || 0).getTime();
        bValue = new Date(b.created_at || 0).getTime();
      } 
      // Special handling for prices
      else if (sortConfig.key === 'price') {
        aValue = parseFloat(a.price.toString());
        bValue = parseFloat(b.price.toString());
      }
      // Default handling for other fields
      else if (sortConfig.key === 'customer') {
        aValue = a.customer_name?.toLowerCase() || '';
        bValue = b.customer_name?.toLowerCase() || '';
      } 
      else if (sortConfig.key === 'project') {
        aValue = a.project_title?.toLowerCase() || '';
        bValue = b.project_title?.toLowerCase() || '';
      }
      else if (sortConfig.key === 'status') {
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedOrders = getSortedOrders();

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await updateOrderStatus(orderId, newStatus);
      setShowStatusDropdown(null);
    } catch (error) {
      setUpdateError('Failed to update order status');
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle checkbox selection
  const handleSelect = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(selectedId => selectedId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  // Handle select/deselect all
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (order: Order) => {
    setCurrentOrder(order);
    setIsDeleteModalOpen(true);
  };

  // Handle order deletion
  const handleDeleteConfirm = async () => {
    if (!currentOrder) return;
    
    setIsDeleting(true);
    try {
      await deleteOrder(currentOrder.id);
      
      // Remove from selected if it was selected
      if (selectedOrders.includes(currentOrder.id)) {
        setSelectedOrders(selectedOrders.filter(id => id !== currentOrder.id));
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Open details modal
  const openDetailsModal = (order: Order) => {
    setCurrentOrder(order);
    setExpandedReviewStage(null);
    setShowDetailsModal(true);
  };

  // Open upload modal
  const openUploadModal = (order: Order) => {
    setCurrentOrder(order);
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
    setUploadProgress(0);
    setShowUploadModal(true);
  };

  // Open send modal
  const openSendModal = (order: Order) => {
    setCurrentOrder(order);
    setSelectedReviewStages([]);
    setSendError(null);
    setSendSuccess(null);
    setShowSendModal(true);
  };

  // Toggle review stage expansion in details modal
  const toggleReviewStage = (stage: string) => {
    setExpandedReviewStage(expandedReviewStage === stage ? null : stage);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentOrder) return;

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
      const uploadResult = await uploadFile(file, `${currentOrder.projectId}/${uploadFormData.review_stage}`);
      
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
    
    if (!uploadFormData.name || !uploadFormData.url || !currentOrder) {
      setUploadError('Please provide a file name and URL');
      return;
    }

    try {
      await addProjectDocument({
        project_id: currentOrder.projectId,
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
    if (!currentOrder || selectedReviewStages.length === 0) {
      setSendError('Please select at least one review stage');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      // Get project documents for selected review stages
      const allDocuments = getProjectDocuments(currentOrder.projectId);
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
        project_title: currentOrder.project_title || currentOrder.projectTitle,
        customer_name: currentOrder.customer_name || currentOrder.customerName,
        customer_email: currentOrder.customer_email || currentOrder.customerEmail,
        order_id: currentOrder.id,
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

  // Export selected orders as CSV
  const exportAsCSV = () => {
    if (selectedOrders.length === 0) return;

    const selectedData = orders.filter(order => selectedOrders.includes(order.id));

    let csv = 'Customer Name,Email,Project,Price,Status,Date\n';
    selectedData.forEach(order => {
      const formattedDate = formatDate(order.created_at);
      const escapedName = `"${order.customer_name?.replace(/"/g, '""') || ''}"`;
      const escapedTitle = `"${order.project_title?.replace(/"/g, '""') || ''}"`;
      const { formatted: priceFormatted } = formatPrice(order.price);
      
      csv += `${escapedName},${order.customer_email || ''},${escapedTitle},${priceFormatted},${order.status || ''},${formattedDate}\n`;
    });

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orders.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get status badge styling with color indicators
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300';
    }
  };

  // Calculate total revenue with color coding
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.price.toString()), 0);
  const { formatted: totalRevenueFormatted, colorClass: totalRevenueColor } = formatPrice(totalRevenue);

  // Status options
  const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

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

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Orders</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage and track customer orders for your projects.</p>
          </div>
        </div>

        {/* Error Message */}
        {updateError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {updateError}
          </div>
        )}

        {/* Stats Cards with Color Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orders.length}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Revenue</p>
              <h3 className={`text-2xl font-bold ${totalRevenueColor}`}>{totalRevenueFormatted}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending Orders</p>
              <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {orders.filter(order => order.status === 'pending').length}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Completed Orders</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {orders.filter(order => order.status === 'completed').length}
              </h3>
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
                placeholder="Search orders by customer name or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>

            <div className="flex space-x-2">
              <div className="relative group">
                <button
                  className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter || 'All'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <button 
                    onClick={() => setStatusFilter(null)}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    All
                  </button>

                  {statusOptions.map(status => (
                    <button 
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={exportAsCSV}
                disabled={selectedOrders.length === 0}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  selectedOrders.length > 0
                    ? 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700'
                    : 'border-slate-300 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:text-slate-500'
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mb-8">
          {sortedOrders.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">No orders found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {orders.length === 0 
                  ? "You haven't received any orders yet." 
                  : "No orders match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 rounded"
                        />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => requestSort('customer')}
                    >
                      <div className="flex items-center">
                        Customer
                        {sortConfig?.key === 'customer' && (
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => requestSort('project')}
                    >
                      <div className="flex items-center">
                        Project
                        {sortConfig?.key === 'project' && (
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => requestSort('price')}
                    >
                      <div className="flex items-center">
                        Price
                        {sortConfig?.key === 'price' && (
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => requestSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortConfig?.key === 'status' && (
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => requestSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortConfig?.key === 'date' && (
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {sortedOrders.map((order) => {
                    const { formatted: priceFormatted, colorClass: priceColor } = formatPrice(order.price);
                    const documentsCount = getProjectDocuments(order.projectId).length;
                    
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelect(order.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-8 w-8 text-slate-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{order.customer_name}</div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                <a href={`mailto:${order.customer_email}`} className="hover:underline">
                                  {order.customer_email}
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Package className="h-6 w-6 text-slate-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{order.project_title}</div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {documentsCount} documents available
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${priceColor}`}>{priceFormatted}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <button
                              onClick={() => setShowStatusDropdown(showStatusDropdown === order.id ? null : order.id)}
                              className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}
                              disabled={isUpdating}
                            >
                              {order.status}
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </button>

                            {showStatusDropdown === order.id && (
                              <div className="absolute z-10 mt-1 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg">
                                {statusOptions.map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(order.id, status)}
                                    disabled={isUpdating}
                                    className={`block w-full text-left px-4 py-2 text-sm ${
                                      order.status === status
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openDetailsModal(order)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => openUploadModal(order)}
                              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900 rounded-lg transition-colors"
                              title="Upload documents"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                            
                            {documentsCount > 0 && (
                              <button
                                onClick={() => openSendModal(order)}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                                title="Send documents"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => openDeleteModal(order)}
                              className="p-2 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                              title="Delete order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-1">Delete Order</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Are you sure you want to delete the order from {currentOrder.customer_name}? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal with Document Status */}
      {showDetailsModal && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              {/* Order Information */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Order Information</h4>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-2">
                  <p><strong>Order ID:</strong> {currentOrder.id}</p>
                  <p><strong>Project:</strong> {currentOrder.project_title}</p>
                  <p><strong>Customer:</strong> {currentOrder.customer_name}</p>
                  <p><strong>Email:</strong> {currentOrder.customer_email}</p>
                  <p><strong>Status:</strong> {currentOrder.status}</p>
                  <p><strong>Order Date:</strong> {formatDate(currentOrder.created_at)}</p>
                </div>
              </div>

              {/* Document Status */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">Document Status</h4>
                <div className="space-y-4">
                  {reviewStages.map((stage) => {
                    const documents = getDocumentsByReviewStage(currentOrder.projectId, stage.value);
                    const isExpanded = expandedReviewStage === stage.value;
                    
                    return (
                      <div key={stage.value} className="border border-slate-200 dark:border-slate-700 rounded-lg">
                        <button
                          onClick={() => toggleReviewStage(stage.value)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-slate-200 uppercase text-sm">
                              {stage.label.replace(' ', ' ')}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {documents.length} docs
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                            {documents.length === 0 ? (
                              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No documents uploaded</p>
                              </div>
                            ) : (
                              <div className="space-y-2 mt-3">
                                {documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                      <div>
                                        <h4 className="font-medium text-slate-900 dark:text-slate-200">
                                          {doc.name}
                                        </h4>
                                        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                                          <span>{formatFileSize(doc.size)}</span>
                                          <span>•</span>
                                          <span className="capitalize">{doc.document_category}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
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

      {/* Upload Document Modal */}
      {showUploadModal && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Upload Document - {currentOrder.project_title}
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
                  {uploadError}
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
                      <div className="flex items-center justify-center mb-2">
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Uploading...</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
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
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFormData.name || !uploadFormData.url || isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Documents Modal */}
      {showSendModal && currentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Send Documents - {currentOrder.project_title}
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
                  <p><strong>Name:</strong> {currentOrder.customer_name}</p>
                  <p><strong>Email:</strong> {currentOrder.customer_email}</p>
                  <p><strong>Order ID:</strong> {currentOrder.id}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">Select Review Stages to Send</h4>
                <div className="space-y-3">
                  {reviewStages.map((stage) => {
                    const documents = getDocumentsByReviewStage(currentOrder.projectId, stage.value);
                    
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
                    'Send Documents'
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

export default AdminOrdersPage;