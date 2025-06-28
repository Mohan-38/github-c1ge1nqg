import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  MessageSquare, 
  ShoppingBag,
  ArrowUpRight,
  IndianRupee 
} from 'lucide-react'; // Changed DollarSign to IndianRupee
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/admin/AdminLayout';

const AdminDashboardPage = () => {
  const { projects, inquiries, orders } = useProjects();
  const { user } = useAuth();
  
  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const newInquiries = inquiries.length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  
  // Format currency in Indian Rupees
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Generate chart data with realistic monthly progression
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => 
    Math.floor(Math.random() * 50000 * (i + 1) / 4)
  );
  const maxRevenue = Math.max(...monthlyRevenue);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">
            Welcome back, {user?.name || user?.email.split('@')[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Here's your business overview for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Projects Card */}
          <StatsCard 
            title="Total Projects"
            value={projects.length}
            icon={<Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            trend="positive"
            description="Active listings"
            bgColor="blue"
          />
          
          {/* New Inquiries Card */}
          <StatsCard 
            title="New Inquiries"
            value={newInquiries}
            icon={<MessageSquare className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            description="Requires response"
            bgColor="amber"
          />
          
          {/* Pending Orders Card */}
          <StatsCard 
            title="Pending Orders"
            value={pendingOrders}
            icon={<ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            description="Waiting fulfillment"
            bgColor="purple"
          />
          
          {/* Total Revenue Card - Now with IndianRupee icon */}
          <StatsCard 
            title="Total Revenue"
            value={formatINR(totalRevenue)}
            icon={<IndianRupee className="h-6 w-6 text-green-600 dark:text-green-400" />} // Changed to IndianRupee
            trend="positive"
            description={`From ${orders.length} orders`}
            bgColor="green"
          />
        </div>
        
        {/* Charts and Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Revenue Overview (₹)</h3> {/* Added ₹ symbol */}
              <select className="text-sm border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                <option>This Year</option>
                <option>Last Year</option>
                <option>Last 6 Months</option>
              </select>
            </div>
            
            <div className="h-64 flex items-end space-x-1">
              {monthlyRevenue.map((value, index) => {
                const percentage = (value / maxRevenue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-all duration-200" 
                      style={{ height: `${percentage}%` }}
                      title={`${months[index]}: ${formatINR(value)}`}
                    ></div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{months[index]}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Recent Inquiries */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Recent Inquiries</h3>
              <Link 
                to="/admin/inquiries"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                View all
              </Link>
            </div>
            
            <div className="space-y-4">
              {inquiries.slice(0, 3).map((inquiry) => (
                <InquiryItem key={inquiry.id} inquiry={inquiry} />
              ))}
              
              {inquiries.length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                  No inquiries yet
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <QuickLink 
            to="/admin/projects"
            title="Manage Projects"
            description="Add, edit, or remove projects"
            icon={<Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            bgColor="blue"
          />
          
          <QuickLink 
            to="/admin/inquiries"
            title="View Inquiries"
            description="Review and respond to messages"
            icon={<MessageSquare className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            bgColor="amber"
          />
          
          <QuickLink 
            to="/admin/orders"
            title="Manage Orders"
            description="Track and fulfill project orders"
            icon={<ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            bgColor="purple"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

// Reusable Stats Card Component
const StatsCard = ({ title, value, icon, trend, description, bgColor }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{value}</h3>
      </div>
      <div className={`p-2 bg-${bgColor}-50 dark:bg-${bgColor}-900 rounded-lg`}>
        {icon}
      </div>
    </div>
    <div className={`mt-2 text-xs text-${trend === 'positive' ? 'green' : bgColor}-600 dark:text-${trend === 'positive' ? 'green' : bgColor}-400 flex items-center`}>
      {trend === 'positive' && <ArrowUpRight className="h-3 w-3 mr-1" />}
      <span>{description}</span>
    </div>
  </div>
);

// Reusable Inquiry Item Component
const InquiryItem = ({ inquiry }) => (
  <div className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
    <div className="flex justify-between">
      <p className="font-medium text-slate-900 dark:text-slate-200">{inquiry.name}</p>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {new Date(inquiry.date).toLocaleDateString('en-IN')}
      </span>
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{inquiry.projectType} Project</p>
    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{inquiry.message}</p>
  </div>
);

// Reusable Quick Link Component
const QuickLink = ({ to, title, description, icon, bgColor }) => (
  <Link 
    to={to}
    className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 flex items-center hover:shadow-md transition-shadow duration-200"
  >
    <div className={`p-3 bg-${bgColor}-50 dark:bg-${bgColor}-900 rounded-lg mr-4`}>
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  </Link>
);

export default AdminDashboardPage;