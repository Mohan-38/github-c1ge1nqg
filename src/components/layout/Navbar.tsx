import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Code, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const toggleAdminMenu = () => setIsAdminMenuOpen(!isAdminMenuOpen);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed w-full z-50 bg-slate-900 shadow-lg py-4">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-xl font-bold text-white" 
            onClick={closeMenu}
          >
            <Code className="h-8 w-8 text-blue-500" />
            <span>TechCreator</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/') 
                  ? 'text-blue-500' 
                  : 'text-white hover:text-blue-400'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/projects" 
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/projects') 
                  ? 'text-blue-500' 
                  : 'text-white hover:text-blue-400'
              }`}
            >
              Projects
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive('/contact') 
                  ? 'text-blue-500' 
                  : 'text-white hover:text-blue-400'
              }`}
            >
              Contact
            </Link>
            
            {isAuthenticated ? (
              <div className="relative inline-block text-left">
                <div>
                  <button 
                    type="button" 
                    className="inline-flex items-center gap-x-1 text-sm font-medium text-white hover:text-blue-400"
                    onClick={toggleAdminMenu}
                  >
                    Admin
                    <ChevronDown className={`h-4 w-4 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isAdminMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Link 
                        to="/admin" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          closeMenu();
                          setIsAdminMenuOpen(false);
                        }}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/admin/project-requests" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          closeMenu();
                          setIsAdminMenuOpen(false);
                        }}
                      >
                        Project Requests
                      </Link>
                      <Link 
                        to="/admin/projects" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          closeMenu();
                          setIsAdminMenuOpen(false);
                        }}
                      >
                        Manage Projects
                      </Link>
                      <Link 
                        to="/admin/orders" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          closeMenu();
                          setIsAdminMenuOpen(false);
                        }}
                      >
                        Orders
                      </Link>
                      <Link 
                        to="/admin/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => {
                          closeMenu();
                          setIsAdminMenuOpen(false);
                        }}
                      >
                        Settings
                      </Link>
                      <button 
                        onClick={() => {
                          logout();
                          closeMenu();
                          setIsAdminMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/admin/login" 
                className="text-sm font-medium text-white hover:text-blue-400"
              >
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden text-white focus:outline-none" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 bg-slate-800 rounded-lg shadow-xl p-4">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className={`text-base font-medium transition-colors duration-200 ${
                  isActive('/') 
                    ? 'text-blue-500' 
                    : 'text-white hover:text-blue-400'
                }`}
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link 
                to="/projects" 
                className={`text-base font-medium transition-colors duration-200 ${
                  isActive('/projects') 
                    ? 'text-blue-500' 
                    : 'text-white hover:text-blue-400'
                }`}
                onClick={closeMenu}
              >
                Projects
              </Link>
              <Link 
                to="/contact" 
                className={`text-base font-medium transition-colors duration-200 ${
                  isActive('/contact') 
                    ? 'text-blue-500' 
                    : 'text-white hover:text-blue-400'
                }`}
                onClick={closeMenu}
              >
                Contact
              </Link>
              
              {isAuthenticated ? (
                <>
                  <hr className="border-slate-700" />
                  <Link 
                    to="/admin" 
                    className="text-base font-medium text-white hover:text-blue-400"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/admin/project-requests" 
                    className="text-base font-medium text-white hover:text-blue-400"
                    onClick={closeMenu}
                  >
                    Project Requests
                  </Link>
                  <Link 
                    to="/admin/projects" 
                    className="text-base font-medium text-white hover:text-blue-400"
                    onClick={closeMenu}
                  >
                    Manage Projects
                  </Link>
                  <Link 
                    to="/admin/orders" 
                    className="text-base font-medium text-white hover:text-blue-400"
                    onClick={closeMenu}
                  >
                    Orders
                  </Link>
                  <Link 
                    to="/admin/settings" 
                    className="text-base font-medium text-white hover:text-blue-400"
                    onClick={closeMenu}
                  >
                    Settings
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="text-left text-base font-medium text-red-500 hover:text-red-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/admin/login" 
                  className="text-base font-medium text-white hover:text-blue-400"
                  onClick={closeMenu}
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;