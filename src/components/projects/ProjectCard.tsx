import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Eye } from 'lucide-react';
import { Project } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { isPortfolioMode, settings } = useSettings();
  
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

  // Determine which page to link to based on mode
  const projectLink = isPortfolioMode ? `/projects/${project.id}` : `/marketplace/${project.id}`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {project.imageUpload ? (
        <img 
          src={URL.createObjectURL(project.imageUpload)} 
          alt={project.title} 
          className="w-full h-48 object-cover"
        />
      ) : (
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex mb-3">
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(project.category)}`}
          >
            <Tag className="mr-1 h-3 w-3" />
            {project.category}
          </span>
          
          {project.featured && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-700 text-amber-800 dark:text-amber-200">
              Featured
            </span>
          )}

          {/* Mode Indicator */}
          {isPortfolioMode ? (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200">
              Portfolio
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200">
              Marketplace
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">{project.title}</h3>
        
        <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
          {project.description}
        </p>
        
        <div className="flex justify-between items-center">
          {/* Conditional Price Display */}
          {!isPortfolioMode && settings.showPricesOnProjects && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {formattedPrice}
            </span>
          )}
          
          {isPortfolioMode && (
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              View Project Details
            </span>
          )}
          
          <Link 
            to={projectLink}
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
          >
            {isPortfolioMode ? (
              <>
                <Eye className="mr-1 h-4 w-4" />
                View details
              </>
            ) : (
              <>
                View details
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;