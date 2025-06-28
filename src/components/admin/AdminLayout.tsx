import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  MessageSquare, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Code,
  Send,
  FileCheck,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigation = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Project Requests', path: '/admin/project-requests', icon: ClipboardList },
    { name: 'Projects', path: '/admin/projects', icon: Briefcase },
    { name: 'Inquiries', path: '/admin/inquiries', icon: MessageSquare },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Document Delivery', path: '/admin/document-delivery', icon: Send },
    { name: 'Document Status', path: '/admin/document-status', icon: FileCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 bg-white shadow-sm z-30">
        <div className="flex h-16 items-center px-4">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <Link 
            to="/" 
            className="ml-3 lg:ml-0 flex items-center space-x-2 text-xl font-bold text-slate-900"
          >
            <Code className="h-6 w-6 text-blue-600" />
            <span>TechCreator</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900 bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <aside 
          className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-800 shadow-md z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 lg:hidden">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-xl font-bold text-slate-900"
              >
                <Code className="h-6 w-6 text-blue-600" />
                <span>TechCreator</span>
              </Link>
              
              <button 
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Admin Panel
                </h2>
                
                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive(item.path)
                          ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 mr-3 ${
                        isActive(item.path) ? 'text-blue-600 dark:text-white' : 'text-slate-400 dark:text-slate-400'
                      }`} />
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                <hr className="my-6 border-slate-200" />
                
                <Link
                  to="/admin/settings"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Settings className="h-5 w-5 mr-3 text-slate-400" />
                  Settings
                </Link>
                
                <button
                  onClick={logout}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 w-full text-left mt-2"
                >
                  <LogOut className="h-5 w-5 mr-3 text-slate-400" />
                  Log Out
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 mt-auto">
              <Link
                to="/"
                className="text-sm text-slate-600 hover:text-blue-600"
                onClick={() => setSidebarOpen(false)}
              >
                ← Back to Website
              </Link>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative bg-white dark:bg-slate-900">
          <div className="absolute inset-0 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;