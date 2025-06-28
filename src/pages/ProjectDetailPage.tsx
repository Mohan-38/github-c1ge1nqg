import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Tag, 
  Calendar, 
  Info, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Presentation,
  FileSpreadsheet,
  File,
  Package,
  Shield,
  Clock,
  Eye,
  Code,
  Star
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useSettings } from '../context/SettingsContext';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, getDocumentsByReviewStage } = useProjects();
  const { isPortfolioMode, settings } = useSettings();
  const project = projects.find(p => p.id === id);
  const [expandedReviewStage, setExpandedReviewStage] = useState<string | null>(null);
  
  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-28 pb-16 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-md mx-auto text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200 mb-4">Project Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The project you are looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/projects" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'iot':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'blockchain':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'web':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Format price in Indian Rupees
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(project.price);

  const handlePurchaseClick = () => {
    navigate(`/checkout/${project.id}`);
  };

  const reviewStages = [
    { 
      value: 'review_1', 
      label: 'Review 1', 
      description: 'Initial project review and requirements',
      icon: FileText,
      color: 'blue'
    },
    { 
      value: 'review_2', 
      label: 'Review 2', 
      description: 'Mid-project review and progress assessment',
      icon: Presentation,
      color: 'purple'
    },
    { 
      value: 'review_3', 
      label: 'Review 3', 
      description: 'Final review and project completion',
      icon: FileSpreadsheet,
      color: 'green'
    }
  ];

  const toggleReviewStage = (stage: string) => {
    setExpandedReviewStage(expandedReviewStage === stage ? null : stage);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (category: string) => {
    switch (category) {
      case 'presentation':
        return Presentation;
      case 'document':
        return FileText;
      case 'report':
        return FileSpreadsheet;
      default:
        return File;
    }
  };

  // Get all documents for this project
  const allDocuments = reviewStages.reduce((acc, stage) => {
    const docs = getDocumentsByReviewStage(project.id, stage.value);
    return acc + docs.length;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6">
        {/* Back button */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to projects
          </button>
        </div>

        {/* Portfolio Mode Banner */}
        {isPortfolioMode && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-300">Portfolio Mode</h3>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  This project is displayed for showcase purposes. Contact us for custom development.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          {/* Project Image */}
          <div className="relative h-64 md:h-80 bg-slate-200 dark:bg-slate-700">
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex space-x-2">
              <span 
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(project.category)}`}
              >
                <Tag className="mr-1.5 h-4 w-4" />
                {project.category}
              </span>
              
              {project.featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-700 text-amber-800 dark:text-amber-200">
                  <Star className="mr-1.5 h-4 w-4" />
                  Featured
                </span>
              )}

              {isPortfolioMode && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200">
                  <Eye className="mr-1.5 h-4 w-4" />
                  Portfolio
                </span>
              )}
            </div>
          </div>
          
          {/* Project Content */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="lg:w-2/3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-200 mb-4">{project.title}</h1>
                
                <div className="flex items-center text-slate-500 dark:text-slate-400 mb-6">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>Last updated: {new Date(project.updated_at || Date.now()).toLocaleDateString()}</span>
                </div>
                
                <div className="prose max-w-none text-slate-700 dark:text-slate-300 mb-8">
                  <p className="mb-4 text-lg">{project.description}</p>
                  
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-3">Features</h2>
                  <ul className="space-y-2 mb-6">
                    {project.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {project.technical_details && (
                    <>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-3">Technical Details</h2>
                      <p className="mb-6">{project.technical_details}</p>
                    </>
                  )}
                </div>

                {/* Project Documents Section - Modified for Portfolio Mode */}
                <div className="mb-8">
                  <div className="flex items-center mb-6">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200">
                        {isPortfolioMode ? 'Project Documentation' : 'Project Documents & Deliverables'}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        {isPortfolioMode 
                          ? 'Overview of project documentation and deliverables'
                          : 'Complete documentation package organized by review stages'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Documents Overview */}
                  <div className={`border rounded-lg p-4 mb-6 ${
                    isPortfolioMode 
                      ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className="flex items-start">
                      {isPortfolioMode ? (
                        <Code className="h-5 w-5 text-slate-600 dark:text-slate-400 mr-3 mt-0.5" />
                      ) : (
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-medium mb-2 ${
                          isPortfolioMode 
                            ? 'text-slate-800 dark:text-slate-300'
                            : 'text-blue-800 dark:text-blue-300'
                        }`}>
                          {isPortfolioMode ? '📋 Project Includes' : '📦 What You\'ll Receive'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className={`flex items-center ${
                            isPortfolioMode 
                              ? 'text-slate-700 dark:text-slate-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Complete source code
                          </div>
                          <div className={`flex items-center ${
                            isPortfolioMode 
                              ? 'text-slate-700 dark:text-slate-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            <Presentation className="h-4 w-4 mr-2" />
                            Project presentations
                          </div>
                          <div className={`flex items-center ${
                            isPortfolioMode 
                              ? 'text-slate-700 dark:text-slate-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Technical documentation
                          </div>
                          <div className={`flex items-center ${
                            isPortfolioMode 
                              ? 'text-slate-700 dark:text-slate-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}>
                            <File className="h-4 w-4 mr-2" />
                            Implementation guides
                          </div>
                        </div>
                        {allDocuments > 0 && (
                          <div className={`mt-3 p-2 rounded text-sm ${
                            isPortfolioMode 
                              ? 'bg-slate-100 dark:bg-slate-600'
                              : 'bg-blue-100 dark:bg-blue-800'
                          }`}>
                            <strong>{allDocuments} documents</strong> available across all review stages
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review Stages - Simplified for Portfolio Mode */}
                  <div className="space-y-4">
                    {reviewStages.map((stage) => {
                      const documents = getDocumentsByReviewStage(project.id, stage.value);
                      const isExpanded = expandedReviewStage === stage.value;
                      const StageIcon = stage.icon;
                      
                      const stageColors = {
                        blue: isPortfolioMode 
                          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700'
                          : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
                        purple: isPortfolioMode 
                          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700'
                          : 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
                        green: isPortfolioMode 
                          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700'
                          : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                      };
                      
                      return (
                        <div key={stage.value} className={`border rounded-lg ${stageColors[stage.color as keyof typeof stageColors]}`}>
                          <button
                            onClick={() => toggleReviewStage(stage.value)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors rounded-lg"
                          >
                            <div className="flex items-center">
                              <StageIcon className={`h-6 w-6 mr-4 ${
                                isPortfolioMode 
                                  ? 'text-slate-600 dark:text-slate-400'
                                  : stage.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                                    stage.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                    'text-green-600 dark:text-green-400'
                              }`} />
                              <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-200">
                                  {stage.label}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {stage.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                documents.length > 0 
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="px-6 pb-4 border-t border-slate-200 dark:border-slate-700">
                              {documents.length === 0 ? (
                                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">
                                    {isPortfolioMode 
                                      ? 'Documentation available for custom development'
                                      : 'Documents will be available after purchase'
                                    }
                                  </p>
                                  <p className="text-xs mt-1">
                                    This stage includes presentations, documentation, and reports
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3 mt-4">
                                  {documents.map((doc) => {
                                    const DocIcon = getDocumentIcon(doc.document_category);
                                    return (
                                      <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <DocIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                          <div>
                                            <h4 className="font-medium text-slate-900 dark:text-slate-200">
                                              {doc.name}
                                            </h4>
                                            <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                                              <span>{formatFileSize(doc.size)}</span>
                                              <span>•</span>
                                              <span className="capitalize">{doc.document_category}</span>
                                            </div>
                                            {doc.description && (
                                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {doc.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            isPortfolioMode 
                                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                          }`}>
                                            {isPortfolioMode ? 'Portfolio item' : 'Available after purchase'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Document Delivery Info - Modified for Portfolio Mode */}
                  {!isPortfolioMode && (
                    <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5" />
                        <div className="text-sm text-amber-800 dark:text-amber-300">
                          <h4 className="font-medium mb-1">📧 Document Delivery</h4>
                          <ul className="space-y-1">
                            <li>• Documents are delivered via secure email links after purchase</li>
                            <li>• All files are organized by review stages for easy navigation</li>
                            <li>• Download links are time-limited and email-specific for security</li>
                            <li>• If documents aren't ready, you'll receive them within 3 business days</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Project Action Card - Modified for Portfolio Mode */}
              <div className="lg:w-1/3">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 shadow-sm sticky top-24">
                  {/* Price Display - Conditional */}
                  {!isPortfolioMode && settings.showPricesOnProjects && (
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-200 mb-4">
                      {formattedPrice}
                    </div>
                  )}

                  {isPortfolioMode && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-2">
                        Portfolio Project
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        This project showcases our capabilities. Contact us for similar custom development.
                      </p>
                    </div>
                  )}
                  
                  {/* Action Buttons - Conditional */}
                  {!isPortfolioMode && settings.enableCheckoutProcess ? (
                    <>
                      <button 
                        onClick={handlePurchaseClick}
                        className="w-full mb-4 inline-flex items-center justify-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Purchase Project
                      </button>
                      
                      <Link 
                        to="/contact" 
                        className="w-full inline-flex items-center justify-center px-5 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors duration-200"
                      >
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Request Customization
                      </Link>
                    </>
                  ) : (
                    <Link 
                      to="/contact" 
                      className="w-full inline-flex items-center justify-center px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      {isPortfolioMode ? 'Request Similar Project' : 'Contact for Details'}
                    </Link>
                  )}
                  
                  <div className="mt-6">
                    <div className="flex items-start mb-4">
                      <Info className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        <p className="font-medium mb-1">
                          {isPortfolioMode ? 'Project includes:' : 'What you\'ll receive:'}
                        </p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                          <li>Complete source code</li>
                          <li>Documentation across 3 review stages</li>
                          <li>Installation guide</li>
                          <li>Technical specifications</li>
                          <li>Project presentations</li>
                          {!isPortfolioMode && <li>Email support</li>}
                          {isPortfolioMode && <li>Custom development consultation</li>}
                        </ul>
                      </div>
                    </div>

                    {/* Document Summary */}
                    {allDocuments > 0 && (
                      <div className={`border rounded-lg p-3 mt-4 ${
                        isPortfolioMode 
                          ? 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}>
                        <div className={`flex items-center ${
                          isPortfolioMode 
                            ? 'text-slate-800 dark:text-slate-300'
                            : 'text-green-800 dark:text-green-300'
                        }`}>
                          <Package className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            {allDocuments} documents {isPortfolioMode ? 'showcase available' : 'ready for delivery'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;