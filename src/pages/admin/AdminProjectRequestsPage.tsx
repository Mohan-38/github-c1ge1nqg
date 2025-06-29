import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ArrowRight, 
  Search, 
  Filter,
  Calendar,
  User,
  Mail,
  Phone,
  DollarSign,
  AlertCircle,
  MessageSquare,
  FileText,
  Trash2,
  Plus,
  RefreshCw,
  Star,
  TrendingUp,
  Edit,
  Save,
  X,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectRequest, ProjectRequestStatusHistory, Project } from '../../types';

const AdminProjectRequestsPage = () => {
  const { 
    projectRequests, 
    updateProjectRequestStatus, 
    convertRequestToProject, 
    getRequestStatusHistory,
    deleteProjectRequest,
    addProject
  } = useProjects();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [statusHistory, setStatusHistory] = useState<ProjectRequestStatusHistory[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

  // Project conversion form state
  const [projectFormData, setProjectFormData] = useState<Omit<Project, 'id'>>({
    title: '',
    description: '',
    category: 'IoT',
    price: 0,
    image: 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    imageUpload: null,
    features: [''],
    technical_details: '',
    featured: false,
    updated_at: new Date().toISOString()
  });

  // Filter requests
  const filteredRequests = projectRequests.filter(request => {
    const matchesSearch = 
      request.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.project_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? request.status === statusFilter : true;
    const matchesPriority = priorityFilter ? request.priority === priorityFilter : true;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sorting functionality
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedRequests = () => {
    if (!sortConfig) return filteredRequests;

    return [...filteredRequests].sort((a, b) => {
      // Handle different data types appropriately
      let aValue: any, bValue: any;
      
      // Special handling for dates
      if (sortConfig.key === 'date') {
        aValue = new Date(a.created_at || 0).getTime();
        bValue = new Date(b.created_at || 0).getTime();
      } 
      // Special handling for customer name
      else if (sortConfig.key === 'customer') {
        aValue = a.customer_name?.toLowerCase() || '';
        bValue = b.customer_name?.toLowerCase() || '';
      } 
      // Special handling for project title
      else if (sortConfig.key === 'project') {
        aValue = a.project_title?.toLowerCase() || '';
        bValue = b.project_title?.toLowerCase() || '';
      }
      // Special handling for priority
      else if (sortConfig.key === 'priority') {
        const priorityOrder = ['low', 'medium', 'high', 'urgent'];
        aValue = priorityOrder.indexOf(a.priority || '');
        bValue = priorityOrder.indexOf(b.priority || '');
      }
      // Special handling for status
      else if (sortConfig.key === 'status') {
        const statusOrder = ['pending', 'reviewing', 'approved', 'rejected', 'converted'];
        aValue = statusOrder.indexOf(a.status || '');
        bValue = statusOrder.indexOf(b.status || '');
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

  const sortedRequests = getSortedRequests();

  // Calculate statistics
  const stats = {
    total: projectRequests.length,
    pending: projectRequests.filter(r => r.status === 'pending').length,
    reviewing: projectRequests.filter(r => r.status === 'reviewing').length,
    approved: projectRequests.filter(r => r.status === 'approved').length,
    rejected: projectRequests.filter(r => r.status === 'rejected').length,
    converted: projectRequests.filter(r => r.status === 'converted').length,
    thisMonth: projectRequests.filter(r => {
      const created = new Date(r.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'reviewing', label: 'Reviewing', color: 'blue' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
    { value: 'converted', label: 'Converted', color: 'purple' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (!statusConfig) return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };

    const colorMap = {
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-300', icon: Clock },
      blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-300', icon: Eye },
      green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300', icon: CheckCircle },
      red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-300', icon: XCircle },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-300', icon: ArrowRight }
    };

    return colorMap[statusConfig.color as keyof typeof colorMap] || colorMap.blue;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = priorityOptions.find(p => p.value === priority);
    if (!priorityConfig) return { bg: 'bg-gray-100', text: 'text-gray-800' };

    const colorMap = {
      gray: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300' },
      blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-300' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-300' },
      red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-300' }
    };

    return colorMap[priorityConfig.color as keyof typeof colorMap] || colorMap.blue;
  };

  // Get project type color
  const getProjectTypeColor = (projectType: string) => {
    switch (projectType.toLowerCase()) {
      case 'iot':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'blockchain':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'web':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'mobile':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Handle checkbox selection
  const handleSelect = (id: string) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(selectedId => selectedId !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  // Handle select/deselect all
  const handleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(request => request.id));
    }
  };

  // Export selected requests as CSV
  const exportAsCSV = () => {
    if (selectedRequests.length === 0) return;
    
    const selectedData = projectRequests.filter(request => selectedRequests.includes(request.id));
    
    // Create CSV header
    let csv = 'Customer Name,Email,Phone,Project Title,Project Type,Budget Range,Priority,Status,Description,Requirements,Timeline,Created Date,Updated Date\n';
    
    // Add rows
    selectedData.forEach(request => {
      const createdDate = formatDate(request.created_at);
      const updatedDate = formatDate(request.updated_at);
      const escapedDescription = `"${request.description?.replace(/"/g, '""') || ''}"`;
      const escapedRequirements = `"${request.requirements?.replace(/"/g, '""') || ''}"`;
      const escapedName = `"${request.customer_name?.replace(/"/g, '""') || ''}"`;
      const escapedTitle = `"${request.project_title?.replace(/"/g, '""') || ''}"`;
      
      csv += `${escapedName},${request.customer_email || ''},${request.customer_phone || ''},${escapedTitle},${request.project_type || ''},${request.budget_range || ''},${request.priority || ''},${request.status || ''},${escapedDescription},${escapedRequirements},${request.timeline || ''},${createdDate},${updatedDate}\n`;
    });
    
    // Create download link with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-requests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send email to selected requests
  const sendEmail = () => {
    if (selectedRequests.length === 0) return;
    
    const selectedData = projectRequests.filter(request => selectedRequests.includes(request.id));
    const emailAddresses = selectedData.map(request => request.customer_email).join(',');
    
    window.open(`mailto:${emailAddresses}`);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateProjectRequestStatus(requestId, newStatus, user?.email, adminNotes);
      setAdminNotes('');
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConvertToProject = (request: ProjectRequest) => {
    // Pre-fill the form with request data
    setProjectFormData({
      title: request.project_title,
      description: request.description,
      category: request.project_type,
      price: request.estimated_price || 0,
      image: 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      imageUpload: null,
      features: request.requirements ? [request.requirements] : ['Custom development based on requirements'],
      technical_details: request.requirements || 'Custom project based on client requirements',
      featured: false,
      updated_at: new Date().toISOString()
    });
    
    setSelectedRequest(request);
    setShowConversionModal(true);
  };

  const handleConfirmConversion = async () => {
    if (!selectedRequest) return;

    setIsConverting(true);
    try {
      // Create the project with the edited details
      await addProject(projectFormData);
      
      // Update the request status to converted
      await updateProjectRequestStatus(
        selectedRequest.id, 
        'converted', 
        user?.email, 
        `Converted to project: ${projectFormData.title}`
      );
      
      setShowConversionModal(false);
      setSelectedRequest(null);
      alert('Successfully converted to project!');
    } catch (error) {
      console.error('Error converting to project:', error);
      alert('Failed to convert to project. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleViewDetails = async (request: ProjectRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setShowDetailsModal(true);
  };

  const handleViewHistory = async (request: ProjectRequest) => {
    try {
      const history = await getRequestStatusHistory(request.id);
      setStatusHistory(history);
      setShowStatusHistory(true);
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProjectRequest(requestId);
      if (selectedRequest?.id === requestId) {
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  // Handle feature list changes
  const handleFeatureChange = (index: number, value: string) => {
    const updatedFeatures = [...projectFormData.features];
    updatedFeatures[index] = value;
    setProjectFormData({
      ...projectFormData,
      features: updatedFeatures
    });
  };

  // Add new feature input
  const addFeature = () => {
    setProjectFormData({
      ...projectFormData,
      features: [...projectFormData.features, '']
    });
  };

  // Remove feature input
  const removeFeature = (index: number) => {
    const updatedFeatures = [...projectFormData.features];
    updatedFeatures.splice(index, 1);
    setProjectFormData({
      ...projectFormData,
      features: updatedFeatures
    });
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Project Requests</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage customer project requests and convert them to projects.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.total}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.pending}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Reviewing</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.reviewing}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.approved}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ArrowRight className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Converted</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.converted}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">This Month</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{stats.thisMonth}</h3>
              </div>
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
                placeholder="Search by customer name, email, or project title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={exportAsCSV}
                disabled={selectedRequests.length === 0}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  selectedRequests.length > 0
                    ? 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700'
                    : 'border-slate-300 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:text-slate-500'
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedRequests.length})
              </button>
              
              <button
                onClick={sendEmail}
                disabled={selectedRequests.length === 0}
                className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
                  selectedRequests.length > 0
                    ? 'border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-slate-700'
                    : 'border-slate-300 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:text-slate-500'
                }`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email ({selectedRequests.length})
              </button>

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
                  {statusOptions.map(status => (
                    <button 
                      key={status.value}
                      onClick={() => setStatusFilter(status.value)}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Star className="h-4 w-4 mr-2" />
                  Priority: {priorityFilter ? priorityOptions.find(p => p.value === priorityFilter)?.label : 'All'}
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <button 
                    onClick={() => setPriorityFilter(null)}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    All
                  </button>
                  {priorityOptions.map(priority => (
                    <button 
                      key={priority.value}
                      onClick={() => setPriorityFilter(priority.value)}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden mb-8">
          {sortedRequests.length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-1">No project requests found</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {projectRequests.length === 0 
                  ? "No project requests have been submitted yet." 
                  : "No requests match your search criteria."}
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
                          checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
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
                      onClick={() => requestSort('priority')}
                    >
                      <div className="flex items-center">
                        Priority
                        {sortConfig?.key === 'priority' && (
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
                  {sortedRequests.map((request) => {
                    const statusBadge = getStatusBadge(request.status);
                    const priorityBadge = getPriorityBadge(request.priority);
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRequests.includes(request.id)}
                            onChange={() => handleSelect(request.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-8 w-8 text-slate-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{request.customer_name}</div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                <a href={`mailto:${request.customer_email}`} className="hover:underline">
                                  {request.customer_email}
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-200">{request.project_title}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectTypeColor(request.project_type)}`}>
                                {request.project_type}
                              </span>
                              <span className="text-sm text-slate-500 dark:text-slate-400">•</span>
                              <span className="text-sm text-slate-500 dark:text-slate-400">{request.budget_range}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                            {request.priority}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                            <StatusIcon className="h-4 w-4 mr-1" />
                            {request.status}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(request.created_at)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleViewHistory(request)}
                              className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg transition-colors"
                              title="View history"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            
                            {request.status === 'approved' && (
                              <button
                                onClick={() => handleConvertToProject(request)}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                                title="Convert to project"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDelete(request.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                              title="Delete request"
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

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Project Request Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200">Customer Information</h4>
                  
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-3">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-slate-400 mr-2" />
                      <span className="font-medium">{selectedRequest.customer_name}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-slate-400 mr-2" />
                      <a href={`mailto:${selectedRequest.customer_email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {selectedRequest.customer_email}
                      </a>
                    </div>
                    
                    {selectedRequest.customer_phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-slate-400 mr-2" />
                        <span>{selectedRequest.customer_phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-slate-400 mr-2" />
                      <span>{selectedRequest.budget_range}</span>
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200">Project Information</h4>
                  
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Title</label>
                      <p className="text-slate-900 dark:text-slate-200">{selectedRequest.project_title}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Type</label>
                      <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ml-2 ${getProjectTypeColor(selectedRequest.project_type)}`}>
                        {selectedRequest.project_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Priority</label>
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ml-2 ${getPriorityBadge(selectedRequest.priority).bg} ${getPriorityBadge(selectedRequest.priority).text}`}>
                          {selectedRequest.priority}
                        </span>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ml-2 ${getStatusBadge(selectedRequest.status).bg} ${getStatusBadge(selectedRequest.status).text}`}>
                          {selectedRequest.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Project Description</h4>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Requirements */}
              {selectedRequest.requirements && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Requirements</h4>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedRequest.requirements}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="mt-6">
                <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-3">Admin Notes</h4>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Add notes about this request..."
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'reviewing')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Review
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedRequest.status === 'reviewing' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedRequest.status === 'approved' && (
                  <button
                    onClick={() => handleConvertToProject(selectedRequest)}
                    disabled={isConverting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isConverting ? 'Converting...' : 'Convert to Project'}
                  </button>
                )}

                <button
                  onClick={() => handleViewHistory(selectedRequest)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Conversion Modal */}
      {showConversionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  <Edit className="h-5 w-5 inline mr-2" />
                  Convert to Project - Review & Edit Details
                </h3>
                <button
                  onClick={() => setShowConversionModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  📋 Converting Request: {selectedRequest.project_title}
                </h4>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  Review and modify the project details below before creating the project. All fields are pre-filled from the customer request.
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={projectFormData.title}
                      onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={projectFormData.category}
                      onChange={(e) => setProjectFormData({ ...projectFormData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      required
                    >
                      <option value="IoT">IoT</option>
                      <option value="Blockchain">Blockchain</option>
                      <option value="Web">Web Development</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={projectFormData.price}
                      onChange={(e) => setProjectFormData({ ...projectFormData, price: parseInt(e.target.value) || 0 })}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      required
                    />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Customer Budget: {selectedRequest.budget_range}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Project Image URL
                    </label>
                    <input
                      type="url"
                      value={projectFormData.image}
                      onChange={(e) => setProjectFormData({ ...projectFormData, image: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project Features
                  </label>
                  
                  {projectFormData.features.map((feature, index) => (
                    <div key={index} className="flex mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                        placeholder={`Feature ${index + 1}`}
                      />
                      
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="ml-2 flex items-center justify-center h-10 w-10 rounded-md bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addFeature}
                    className="inline-flex items-center px-3 py-1 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Technical Details
                  </label>
                  <textarea
                    value={projectFormData.technical_details}
                    onChange={(e) => setProjectFormData({ ...projectFormData, technical_details: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                    placeholder="Technologies used, implementation details, etc."
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={projectFormData.featured}
                    onChange={(e) => setProjectFormData({ ...projectFormData, featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600"
                  />
                  <label className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                    Mark as featured project
                  </label>
                </div>
              </form>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowConversionModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                  disabled={isConverting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmConversion}
                  disabled={isConverting || !projectFormData.title || !projectFormData.description}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status History Modal */}
      {showStatusHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Status History
                </h3>
                <button
                  onClick={() => setShowStatusHistory(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {statusHistory.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No status changes recorded.</p>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((entry) => (
                    <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                            {entry.old_status && `${entry.old_status} → `}{entry.new_status}
                          </p>
                          {entry.changed_by && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Changed by: {entry.changed_by}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProjectRequestsPage;