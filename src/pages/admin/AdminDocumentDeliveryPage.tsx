import React, { useState } from 'react';
import { 
  Mail, 
  Download, 
  Search, 
  Calendar, 
  Filter, 
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Package,
  Settings
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useProjects } from '../../context/ProjectContext';
import { Order } from '../../types';
import { checkBrevoConfiguration, getBrevoSetupInstructions } from '../../utils/email';

const AdminDocumentDeliveryPage = () => {
  const { orders, getProjectDocuments, projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<{ [key: string]: 'sending' | 'success' | 'error' }>({});
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReviewStages, setSelectedReviewStages] = useState<string[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Check Brevo configuration
  const brevoConfig = checkBrevoConfiguration();

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

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Filter orders to only show those with project documents
  const ordersWithDocuments = orders.filter(order => {
    const documents = getProjectDocuments(order.projectId);
    return documents.length > 0;
  });

  // Filter orders based on search term and status
  const filteredOrders = ordersWithDocuments.filter(order => {
    const matchesSearch = 
      (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.project_title?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

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

  // Open delivery modal for specific order
  const openDeliveryModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedReviewStages([]);
    setShowDeliveryModal(true);
  };

  // Handle review stage selection
  const handleReviewStageToggle = (stage: string) => {
    if (selectedReviewStages.includes(stage)) {
      setSelectedReviewStages(selectedReviewStages.filter(s => s !== stage));
    } else {
      setSelectedReviewStages([...selectedReviewStages, stage]);
    }
  };

  // Send documents for selected review stages - REAL EMAIL SENDING
  const sendDocumentsForOrder = async (order: Order, reviewStages: string[]) => {
    if (reviewStages.length === 0) {
      alert('Please select at least one review stage');
      return;
    }

    // Check Brevo configuration before sending
    if (!brevoConfig.configured) {
      alert(`Email service not configured properly:\n${brevoConfig.issues.join('\n')}\n\nPlease check the configuration settings.`);
      setShowConfigModal(true);
      return;
    }

    setSendingStatus(prev => ({ ...prev, [order.id]: 'sending' }));

    try {
      console.log('🚀 Starting REAL email delivery for order:', order.id);
      
      // Get project documents for selected review stages
      const allDocuments = getProjectDocuments(order.projectId);
      const selectedDocuments = allDocuments.filter(doc => 
        reviewStages.includes(doc.review_stage) && doc.is_active
      );

      if (selectedDocuments.length === 0) {
        throw new Error('No documents found for selected review stages');
      }

      console.log('📄 Found documents:', selectedDocuments.length);

      // Format documents for email
      const formattedDocuments = selectedDocuments.map(doc => ({
        name: doc.name,
        url: doc.url,
        category: doc.document_category,
        review_stage: doc.review_stage,
        size: doc.size,
        description: doc.description || ''
      }));

      // Import and use the REAL email service
      const { sendDocumentDelivery } = await import('../../utils/email');

      // Send REAL email with document links
      await sendDocumentDelivery({
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        project_title: order.project_title,
        order_id: order.id,
        documents: formattedDocuments,
        access_expires: 'Never (lifetime access)'
      });

      console.log('✅ REAL document delivery email sent successfully!');

      setSendingStatus(prev => ({ ...prev, [order.id]: 'success' }));
      
      // Clear success status after 3 seconds
      setTimeout(() => {
        setSendingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[order.id];
          return newStatus;
        });
      }, 3000);

    } catch (error) {
      console.error('❌ Error sending REAL documents:', error);
      setSendingStatus(prev => ({ ...prev, [order.id]: 'error' }));
      
      // Show detailed error message
      alert(`Failed to send documents: ${error.message}\n\nPlease check:\n1. Brevo API key is valid\n2. Sender email is verified in Brevo\n3. Internet connection is stable`);
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setSendingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[order.id];
          return newStatus;
        });
      }, 5000);
    }
  };

  // Handle delivery modal submit
  const handleDeliverySubmit = async () => {
    if (!selectedOrder) return;
    
    await sendDocumentsForOrder(selectedOrder, selectedReviewStages);
    setShowDeliveryModal(false);
    setSelectedOrder(null);
    setSelectedReviewStages([]);
  };

  // Bulk send documents
  const handleBulkSend = async () => {
    if (selectedOrders.length === 0) return;
    
    // Check configuration before bulk sending
    if (!brevoConfig.configured) {
      alert(`Email service not configured properly:\n${brevoConfig.issues.join('\n')}\n\nPlease check the configuration settings.`);
      setShowConfigModal(true);
      return;
    }
    
    setIsSending(true);
    
    for (const orderId of selectedOrders) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Send all review stages for bulk operation
        await sendDocumentsForOrder(order, ['review_1', 'review_2', 'review_3']);
      }
    }
    
    setIsSending(false);
    setSelectedOrders([]);
  };

  // Get status badge styling
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

  const reviewStages = [
    { value: 'review_1', label: 'Review 1', description: 'Initial project review and requirements' },
    { value: 'review_2', label: 'Review 2', description: 'Mid-project review and progress assessment' },
    { value: 'review_3', label: 'Review 3', description: 'Final review and project completion' }
  ];

  const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Document Delivery</h1>
            <p className="text-slate-500 dark:text-slate-400">Send project documents to customers via email.</p>
          </div>
          
          <button
            onClick={() => setShowConfigModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Email Config
          </button>
        </div>

        {/* Configuration Warning */}
        {!brevoConfig.configured && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Email Service Not Configured</h3>
                <p className="text-sm mb-2">Document delivery emails cannot be sent:</p>
                <ul className="text-sm list-disc list-inside">
                  {brevoConfig.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  View setup instructions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{orders.length}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Orders with Documents</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{ordersWithDocuments.length}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pending Delivery</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">
                {ordersWithDocuments.filter(order => order.status === 'pending').length}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email Status</p>
              <h3 className={`text-2xl font-bold ${brevoConfig.configured ? 'text-green-600' : 'text-red-600'}`}>
                {brevoConfig.configured ? 'Ready' : 'Not Ready'}
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
                placeholder="Search orders by customer name, email, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>

            <div className="flex space-x-2">
              <div className="relative group">
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter || 'All'}
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
                onClick={handleBulkSend}
                disabled={selectedOrders.length === 0 || isSending || !brevoConfig.configured}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  selectedOrders.length > 0 && !isSending && brevoConfig.configured
                    ? 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'border-slate-300 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:text-slate-500'
                }`}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Selected'}
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mb-8">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">
                {ordersWithDocuments.length === 0 ? 'No orders with documents found' : 'No orders found'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {ordersWithDocuments.length === 0 
                  ? "No orders have project documents available for delivery." 
                  : "No orders match your search criteria."}
              </p>
              {ordersWithDocuments.length === 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Tip:</strong> Orders will appear here once you add project documents to the associated projects in the Projects management section.
                  </p>
                </div>
              )}
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredOrders.map((order) => {
                    const currentStatus = sendingStatus[order.id];
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
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{formatPrice(order.price)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {currentStatus === 'sending' && (
                              <div className="flex items-center text-blue-600 dark:text-blue-400">
                                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm">Sending...</span>
                              </div>
                            )}
                            
                            {currentStatus === 'success' && (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Sent!</span>
                              </div>
                            )}
                            
                            {currentStatus === 'error' && (
                              <div className="flex items-center text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Failed</span>
                              </div>
                            )}
                            
                            {!currentStatus && (
                              <button
                                onClick={() => openDeliveryModal(order)}
                                disabled={!brevoConfig.configured}
                                className={`inline-flex items-center px-3 py-1 rounded-md transition-colors text-sm ${
                                  brevoConfig.configured
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                                title={!brevoConfig.configured ? 'Email service not configured' : 'Send documents'}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send Documents
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

      {/* Document Delivery Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Send Documents - {selectedOrder.project_title}
                </h3>
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">Customer Information</h4>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
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
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeliverySubmit}
                  disabled={selectedReviewStages.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Real Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Email Service Configuration
                </h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">Current Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-sm font-medium">API Key</span>
                    <span className={`text-sm ${brevoConfig.apiKey ? 'text-green-600' : 'text-red-600'}`}>
                      {brevoConfig.apiKey ? '✓ Configured' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-sm font-medium">Sender Email</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{brevoConfig.senderEmail}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-sm font-medium">Overall Status</span>
                    <span className={`text-sm font-medium ${brevoConfig.configured ? 'text-green-600' : 'text-red-600'}`}>
                      {brevoConfig.configured ? '✓ Ready to Send' : '✗ Not Ready'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Setup Instructions</h4>
                <pre className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-x-auto">
                  {getBrevoSetupInstructions()}
                </pre>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDocumentDeliveryPage;