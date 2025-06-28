import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  X, 
  File,
  Presentation,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader,
  FolderPlus,
  Files,
  UploadCloud
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { ProjectDocument, Project } from '../../types';
import { uploadFile, deleteFile, validateFile, formatFileSize } from '../../utils/storage';

interface ProjectDocumentsManagerProps {
  project: Project;
}

interface FileUploadItem {
  file: File;
  name: string;
  reviewStage: 'review_1' | 'review_2' | 'review_3';
  category: 'presentation' | 'document' | 'report' | 'other';
  description: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

const ProjectDocumentsManager: React.FC<ProjectDocumentsManagerProps> = ({ project }) => {
  const { 
    getProjectDocuments, 
    getDocumentsByReviewStage, 
    addProjectDocument, 
    updateProjectDocument, 
    deleteProjectDocument 
  } = useProjects();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedReviewStage, setSelectedReviewStage] = useState<'review_1' | 'review_2' | 'review_3'>('review_1');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Multi-file upload state
  const [fileUploadQueue, setFileUploadQueue] = useState<FileUploadItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  // Form state for single document upload
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: '',
    size: 0,
    review_stage: 'review_1' as 'review_1' | 'review_2' | 'review_3',
    document_category: 'presentation' as 'presentation' | 'document' | 'report' | 'other',
    description: '',
    storage_path: ''
  });

  const reviewStages = [
    { 
      value: 'review_1', 
      label: 'Review 1', 
      description: 'Initial project review and requirements' 
    },
    { 
      value: 'review_2', 
      label: 'Review 2', 
      description: 'Mid-project review and progress assessment' 
    },
    { 
      value: 'review_3', 
      label: 'Review 3', 
      description: 'Final review and project completion' 
    }
  ];

  const documentCategories = [
    { value: 'presentation', label: 'Presentation (PPT)', icon: Presentation },
    { value: 'document', label: 'Document (Word/PDF)', icon: FileText },
    { value: 'report', label: 'Report', icon: FileSpreadsheet },
    { value: 'other', label: 'Other', icon: File }
  ];

  const getDocumentIcon = (category: string) => {
    const categoryData = documentCategories.find(cat => cat.value === category);
    return categoryData ? categoryData.icon : File;
  };

  // Handle multiple file selection
  const handleMultipleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newUploadItems: FileUploadItem[] = files.map(file => {
      const validation = validateFile(file);
      return {
        file,
        name: file.name,
        reviewStage: selectedReviewStage,
        category: 'document',
        description: '',
        status: validation.valid ? 'pending' : 'error',
        progress: 0,
        error: validation.error
      };
    });

    setFileUploadQueue(prev => [...prev, ...newUploadItems]);
    
    // Clear the input
    event.target.value = '';
  };

  // Handle bulk upload for all review stages
  const handleBulkUploadAllStages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newUploadItems: FileUploadItem[] = [];
    
    // Distribute files across review stages
    files.forEach((file, index) => {
      const stageIndex = index % 3;
      const reviewStage = ['review_1', 'review_2', 'review_3'][stageIndex] as 'review_1' | 'review_2' | 'review_3';
      
      const validation = validateFile(file);
      newUploadItems.push({
        file,
        name: file.name,
        reviewStage,
        category: 'document',
        description: `Auto-assigned to ${reviewStage.replace('_', ' ')}`,
        status: validation.valid ? 'pending' : 'error',
        progress: 0,
        error: validation.error
      });
    });

    setFileUploadQueue(prev => [...prev, ...newUploadItems]);
    
    // Clear the input
    event.target.value = '';
  };

  // Update upload item
  const updateUploadItem = (index: number, updates: Partial<FileUploadItem>) => {
    setFileUploadQueue(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // Remove upload item
  const removeUploadItem = (index: number) => {
    setFileUploadQueue(prev => prev.filter((_, i) => i !== index));
  };

  // Process upload queue
  const processUploadQueue = async () => {
    if (fileUploadQueue.length === 0) return;
    
    setIsProcessingQueue(true);
    setUploadError(null);
    setUploadSuccess(null);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < fileUploadQueue.length; i++) {
      const item = fileUploadQueue[i];
      
      if (item.status === 'error') {
        errorCount++;
        continue;
      }

      try {
        // Update status to uploading
        updateUploadItem(i, { status: 'uploading', progress: 0 });

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          updateUploadItem(i, { 
            progress: prev => Math.min(prev + Math.random() * 20, 90) 
          });
        }, 200);

        // Upload file to Supabase Storage
        const uploadResult = await uploadFile(item.file, `${project.id}/${item.reviewStage}`);
        
        clearInterval(progressInterval);
        updateUploadItem(i, { progress: 100 });

        // Add document to database
        await addProjectDocument({
          project_id: project.id,
          name: item.name,
          url: uploadResult.url,
          type: item.file.type,
          size: uploadResult.size,
          review_stage: item.reviewStage,
          document_category: item.category,
          description: item.description,
          is_active: true
        });

        updateUploadItem(i, { 
          status: 'success', 
          url: uploadResult.url 
        });
        successCount++;

      } catch (error) {
        updateUploadItem(i, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
        errorCount++;
      }
    }

    setIsProcessingQueue(false);
    
    if (successCount > 0) {
      setUploadSuccess(`Successfully uploaded ${successCount} document(s)`);
    }
    
    if (errorCount > 0) {
      setUploadError(`Failed to upload ${errorCount} document(s)`);
    }

    // Clear successful uploads after a delay
    setTimeout(() => {
      setFileUploadQueue(prev => prev.filter(item => item.status !== 'success'));
      setUploadSuccess(null);
    }, 3000);
  };

  // Clear all uploads
  const clearUploadQueue = () => {
    setFileUploadQueue([]);
    setUploadError(null);
    setUploadSuccess(null);
  };

  // Single file upload (existing functionality)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);

    try {
      const uploadResult = await uploadFile(file, `${project.id}/${formData.review_stage}`);
      
      setFormData(prev => ({
        ...prev,
        name: file.name,
        url: uploadResult.url,
        type: file.type,
        size: uploadResult.size,
        storage_path: uploadResult.path
      }));

      setUploadSuccess('File uploaded successfully!');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      setUploadError('Please provide a file name and URL');
      return;
    }

    try {
      await addProjectDocument({
        project_id: project.id,
        name: formData.name,
        url: formData.url,
        type: formData.type,
        size: formData.size,
        review_stage: formData.review_stage,
        document_category: formData.document_category,
        description: formData.description,
        is_active: true
      });

      setFormData({
        name: '',
        url: '',
        type: '',
        size: 0,
        review_stage: 'review_1',
        document_category: 'presentation',
        description: '',
        storage_path: ''
      });
      
      setIsAddModalOpen(false);
      setUploadError(null);
      setUploadSuccess(null);
    } catch (error) {
      setUploadError('Failed to add document');
    }
  };

  const handleDelete = async (document: ProjectDocument) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        if (document.url.includes('supabase')) {
          const pathMatch = document.url.match(/\/storage\/v1\/object\/public\/project-documents\/(.+)$/);
          if (pathMatch) {
            await deleteFile(pathMatch[1]);
          }
        }
        
        await deleteProjectDocument(document.id);
      } catch (error) {
        console.error('Error deleting document:', error);
        setUploadError('Failed to delete document');
      }
    }
  };

  const renderDocumentsByStage = (stage: 'review_1' | 'review_2' | 'review_3') => {
    const documents = getDocumentsByReviewStage(project.id, stage);
    const stageInfo = reviewStages.find(s => s.value === stage);

    return (
      <div key={stage} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">
              {stageInfo?.label}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {stageInfo?.description}
            </p>
          </div>
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
            {documents.length} documents
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents uploaded for this review stage</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const IconComponent = getDocumentIcon(doc.document_category);
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-200">
                        {doc.name}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span className="capitalize">{doc.document_category}</span>
                        {doc.url.includes('supabase') && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 dark:text-green-400">Stored in Supabase</span>
                          </>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
            Project Documents
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Upload and manage documents for different review stages. Files are securely stored in Supabase.
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Files className="h-4 w-4 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Document
          </button>
        </div>
      </div>

      {/* Review Stages */}
      <div className="space-y-6">
        {reviewStages.map(stage => renderDocumentsByStage(stage.value as any))}
      </div>

      {/* Single Document Upload Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  Add Project Document
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                      />
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      PDF, DOC, PPT, XLS files up to 10MB
                    </p>
                  </div>
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
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.review_stage}
                    onChange={(e) => setFormData({ ...formData, review_stage: e.target.value as any })}
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
                    value={formData.document_category}
                    onChange={(e) => setFormData({ ...formData, document_category: e.target.value as any })}
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                  placeholder="Brief description of the document"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formData.name || !formData.url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                  <Files className="h-5 w-5 inline mr-2" />
                  Bulk Document Upload
                </h3>
                <button
                  onClick={() => setIsBulkUploadModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
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

              {/* Upload Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Multiple Files for Single Review Stage */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    <FolderPlus className="h-5 w-5 inline mr-2" />
                    Upload to Specific Review Stage
                  </h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Select Review Stage
                    </label>
                    <select
                      value={selectedReviewStage}
                      onChange={(e) => setSelectedReviewStage(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {reviewStages.map(stage => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                        Choose multiple files
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleMultipleFileUpload}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        multiple
                      />
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Select multiple files for {reviewStages.find(s => s.value === selectedReviewStage)?.label}
                    </p>
                  </div>
                </div>

                {/* Auto-distribute across all stages */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    <UploadCloud className="h-5 w-5 inline mr-2" />
                    Auto-Distribute Across All Stages
                  </h4>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Files will be automatically distributed across Review 1, 2, and 3 in sequence.
                  </p>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
                    <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <label className="cursor-pointer">
                      <span className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium">
                        Choose files for all stages
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleBulkUploadAllStages}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        multiple
                      />
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Files will be distributed automatically
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Queue */}
              {fileUploadQueue.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200">
                      Upload Queue ({fileUploadQueue.length} files)
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={processUploadQueue}
                        disabled={isProcessingQueue || fileUploadQueue.every(item => item.status === 'error')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isProcessingQueue ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload All
                          </>
                        )}
                      </button>
                      <button
                        onClick={clearUploadQueue}
                        disabled={isProcessingQueue}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {fileUploadQueue.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3 flex-1">
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-slate-900 dark:text-slate-200 truncate">
                                {item.name}
                              </p>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {item.reviewStage.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                              <span>{formatFileSize(item.file.size)}</span>
                              <span>•</span>
                              <span className="capitalize">{item.category}</span>
                            </div>
                            
                            {/* Progress bar */}
                            {item.status === 'uploading' && (
                              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                              </div>
                            )}
                            
                            {/* Error message */}
                            {item.status === 'error' && item.error && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                                {item.error}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Status indicator */}
                          {item.status === 'pending' && (
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          )}
                          {item.status === 'uploading' && (
                            <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                          )}
                          {item.status === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {item.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          
                          {/* Remove button */}
                          <button
                            onClick={() => removeUploadItem(index)}
                            disabled={isProcessingQueue}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setIsBulkUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDocumentsManager;