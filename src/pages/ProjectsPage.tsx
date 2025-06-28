import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import ProjectCard from '../components/projects/ProjectCard';
import { Filter, Search, X } from 'lucide-react';
import { Project } from '../types';

const ProjectsPage = () => {
  const { projects } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 25000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) setSelectedCategory(category);

    const search = searchParams.get('search');
    if (search) setSearchTerm(search);

    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice && maxPrice) {
      setPriceRange([parseInt(minPrice), parseInt(maxPrice)]);
    }
  }, [searchParams]);

  useEffect(() => {
    let result = [...projects];

    if (searchTerm) {
      result = result.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter(project =>
        project.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    result = result.filter(project =>
      project.price >= priceRange[0] && project.price <= priceRange[1]
    );

    setFilteredProjects(result);
  }, [projects, searchTerm, selectedCategory, priceRange]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory) params.category = selectedCategory;
    params.minPrice = priceRange[0].toString();
    params.maxPrice = priceRange[1].toString();
    setSearchParams(params);
  }, [searchTerm, selectedCategory, priceRange, setSearchParams]);

  const handleCategoryChange = (category: string | null) => setSelectedCategory(category);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = parseInt(e.target.value);
    const newRange = [...priceRange] as [number, number];

    newRange[index] = newValue;
    if (index === 0 && newValue > newRange[1]) {
      newRange[1] = newValue;
    } else if (index === 1 && newValue < newRange[0]) {
      newRange[0] = newValue;
    }

    setPriceRange(newRange);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setPriceRange([0, 25000]);
  };

  const categories = ['IoT', 'Blockchain', 'Web'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16 text-slate-900 dark:text-slate-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">All Projects</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse through my collection of IoT, blockchain, and web development projects
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center w-full px-4 py-2 bg-white rounded-lg shadow text-slate-700 border border-slate-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-24 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </button>
              </div>

              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
                  Search
                </label>
                <div className="relative">
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search projects..."
                      className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Categories</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="category-all"
                      name="category"
                      type="radio"
                      checked={selectedCategory === null}
                      onChange={() => handleCategoryChange(null)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="category-all" className="ml-3 text-sm text-slate-600">
                      All Categories
                    </label>
                  </div>

                  {categories.map(category => (
                    <div key={category} className="flex items-center">
                    <input
                      id={`category-${category.toLowerCase()}`}
                      name="category"
                      type="radio"
                      checked={selectedCategory === category.toLowerCase()}
                      onChange={() => handleCategoryChange(category.toLowerCase())}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:ring-offset-slate-900"
                    />
                      <label htmlFor={`category-${category.toLowerCase()}`} className="ml-3 text-sm text-slate-600">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Price Range</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">₹{priceRange[0]}</span>
                  <span className="text-sm text-slate-600">₹{priceRange[1]}</span>
                </div>

                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max="25000"
                    step="1000"
                    value={priceRange[0]}
                    onChange={(e) => handlePriceChange(e, 0)}
                    className="w-full"
                  />
                  <input
                    type="range"
                    min="0"
                    max="25000"
                    step="1000"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceChange(e, 1)}
                    className="w-full"
                  />
                </div>

                <div className="flex space-x-4">
                  <div>
                    <label htmlFor="min-price" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Min Price
                    </label>
                    <input
                      type="number"
                      id="min-price"
                      min="0"
                      max="25000"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(e, 0)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="max-price" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Max Price
                    </label>
                    <input
                      type="number"
                      id="max-price"
                      min="0"
                      max="25000"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(e, 1)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-md dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-3/4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-10 text-center">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects found</h3>
                <p className="text-slate-600 mb-4">
                  Try adjusting your filters to find what you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;