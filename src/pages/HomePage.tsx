import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Server, Database, Globe, Eye, ShoppingCart } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useSettings } from '../context/SettingsContext';
import ProjectCard from '../components/projects/ProjectCard';

const HomePage = () => {
  const { projects } = useProjects();
  const { isPortfolioMode } = useSettings();
  const featuredProjects = projects.filter(project => project.featured).slice(0, 3);
  const particlesContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!particlesContainer.current) return;
    
    const container = particlesContainer.current;
    
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'absolute bg-blue-500 rounded-full opacity-0';
      
      // Random size between 2px and 6px
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;
      
      // Animation duration
      const duration = Math.random() * 20 + 10;
      particle.style.animation = `float ${duration}s linear infinite`;
      
      container.appendChild(particle);
      
      setTimeout(() => {
        particle.classList.replace('opacity-0', 'opacity-30');
      }, 10);
      
      return particle;
    };
    
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push(createParticle());
    }
    
    return () => {
      particles.forEach(particle => particle.remove());
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
        <style>
          {`
            @keyframes float {
              0% { transform: translate(0, 0) scale(1); }
              25% { transform: translate(10px, 10px) scale(1.1); }
              50% { transform: translate(0, 20px) scale(1); }
              75% { transform: translate(-10px, 10px) scale(0.9); }
              100% { transform: translate(0, 0) scale(1); }
            }
          `}
        </style>
        
        {/* Particle animation container */}
        <div 
          ref={particlesContainer}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        ></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Mode Indicator */}
            <div className="flex items-center justify-center mb-6">
              {isPortfolioMode ? (
                <div className="flex items-center bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full backdrop-blur-sm">
                  <Eye className="h-5 w-5 mr-2" />
                  <span className="font-medium">Portfolio Showcase</span>
                </div>
              ) : (
                <div className="flex items-center bg-green-500/20 text-green-300 px-4 py-2 rounded-full backdrop-blur-sm">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  <span className="font-medium">Marketplace</span>
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                Innovative Tech Solutions
              </span>{' '}
              {isPortfolioMode ? 'Showcase' : 'for Your Next Project'}
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              {isPortfolioMode 
                ? 'Explore our expertise in IoT, blockchain, and web development. See what we can build for you.'
                : 'Specializing in IoT, blockchain, and web development. Creating custom solutions and ready-to-use projects.'
              }
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/projects" 
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {isPortfolioMode ? (
                  <>
                    <Eye className="mr-2 h-5 w-5" />
                    View Portfolio
                  </>
                ) : (
                  <>
                    Browse Projects
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Link>
              
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-blue-600 bg-white rounded-lg shadow-lg hover:bg-slate-100 transition-colors duration-200"
              >
                {isPortfolioMode ? 'Request Custom Project' : 'Request Custom Project'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-200 mb-4">Expertise Areas</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {isPortfolioMode 
                ? 'Showcasing innovative solutions across multiple technology domains'
                : 'Creating innovative solutions across multiple technology domains'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-700 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Cpu className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-3">IoT Solutions</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Smart devices, sensors, automation systems, and connected hardware for various applications.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-700 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Database className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-3">Blockchain Development</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Decentralized applications, smart contracts, NFT platforms, and secure transaction systems.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-700 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Globe className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-3">Web Development</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Responsive websites, web applications, e-commerce platforms, and custom web solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-200 mb-4">
                {isPortfolioMode ? 'Featured Portfolio Projects' : 'Featured Projects'}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                {isPortfolioMode 
                  ? 'Explore some of our best work across different technology domains'
                  : 'Explore some of my recent work across different technology domains'
                }
              </p>
            </div>
            
            <Link 
              to="/projects" 
              className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium mt-4 md:mt-0 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
            >
              {isPortfolioMode ? (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  View full portfolio
                </>
              ) : (
                <>
                  View all projects
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            {isPortfolioMode 
              ? 'Ready to Build Something Amazing Together?'
              : 'Need a Custom Technology Solution?'
            }
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {isPortfolioMode 
              ? 'Let\'s collaborate to create innovative solutions tailored to your specific needs. From concept to deployment, we\'ve got you covered.'
              : 'Let\'s collaborate to build the perfect solution for your specific requirements. Custom development services available for IoT, blockchain, and web applications.'
            }
          </p>
          <Link 
            to="/contact" 
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-blue-700 bg-white rounded-lg shadow-lg hover:bg-blue-50 transition-colors duration-200"
          >
            {isPortfolioMode ? 'Start Your Project' : 'Get in Touch'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;