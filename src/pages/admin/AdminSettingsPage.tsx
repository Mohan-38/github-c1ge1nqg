import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Lock, 
  Palette, 
  Mail, 
  Phone, 
  Globe, 
  Moon, 
  Sun,
  CheckCircle,
  Save,
  AlertCircle,
  ShoppingCart,
  Send,
  CreditCard,
  FileText,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';

const AdminSettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings: marketplaceSettings, updateSettings: updateMarketplaceSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    website: user?.website || '',
    bio: user?.bio || ''
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    projectUpdates: true,
    newInquiries: true,
    orderAlerts: true,
    marketingEmails: false
  });
  
  // Security Settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    newEmail: '',
    confirmEmail: ''
  });
  
  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: theme,
    fontSize: 'medium',
    compactMode: false,
    animationsEnabled: true
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        website: user.website || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Update theme when appearance changes
  useEffect(() => {
    setTheme(appearance.theme as 'light' | 'dark');
  }, [appearance.theme, setTheme]);

  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleMarketplaceSettingsUpdate = async (newSettings: Partial<typeof marketplaceSettings>) => {
    setIsLoading(true);
    setShowError(null);
    
    try {
      await updateMarketplaceSettings(newSettings);
      showSuccessMessage();
    } catch (error) {
      setShowError(error instanceof Error ? error.message : 'Failed to update marketplace settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(null);
    
    try {
      // Update user profile in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: profileData.phone,
          website: profileData.website,
          bio: profileData.bio
        }
      });

      if (error) throw error;

      // Update local context
      await updateProfile(profileData);
      
      showSuccessMessage();
    } catch (error) {
      setShowError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(null);
    
    try {
      // Update notification preferences in Supabase
      const { error } = await supabase.auth.updateUser({
        data: { notification_preferences: notifications }
      });

      if (error) throw error;
      
      showSuccessMessage();
    } catch (error) {
      setShowError(error instanceof Error ? error.message : 'Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(null);
    
    try {
      if (securityData.newPassword !== securityData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: securityData.newPassword
      });

      if (error) throw error;
      
      showSuccessMessage();
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setShowError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(null);
    
    try {
      if (emailSettings.newEmail !== emailSettings.confirmEmail) {
        throw new Error('Email addresses do not match');
      }

      // Update email in Supabase
      const { error } = await supabase.auth.updateUser({
        email: emailSettings.newEmail
      });

      if (error) throw error;

      // Update local context
      await updateProfile({ ...profileData, email: emailSettings.newEmail });
      
      showSuccessMessage();
      setEmailSettings({ newEmail: '', confirmEmail: '' });
    } catch (error) {
      setShowError(error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAppearanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowError(null);
    
    try {
      // Update appearance settings in Supabase
      const { error } = await supabase.auth.updateUser({
        data: { appearance_settings: appearance }
      });

      if (error) throw error;
      
      showSuccessMessage();
    } catch (error) {
      setShowError(error instanceof Error ? error.message : 'Failed to update appearance settings');
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    disabled = false 
  }: { 
    enabled: boolean; 
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {enabled ? (
        <ToggleRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      ) : (
        <ToggleLeft className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      )}
    </button>
  );

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your account settings and marketplace configuration.</p>
          </div>
          
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Settings updated successfully!
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {showError}
            </div>
          )}
          
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'marketplace'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShoppingCart className="h-4 w-4 inline-block mr-2" />
                Marketplace
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="h-4 w-4 inline-block mr-2" />
                Profile
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bell className="h-4 w-4 inline-block mr-2" />
                Notifications
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lock className="h-4 w-4 inline-block mr-2" />
                Security
              </button>
              
              <button
                onClick={() => setActiveTab('appearance')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'appearance'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Palette className="h-4 w-4 inline-block mr-2" />
                Appearance
              </button>
            </div>
            
            <div className="p-6">
              {/* Marketplace Settings */}
              {activeTab === 'marketplace' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      Marketplace Configuration
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Control how your website operates - as a marketplace with payments and automatic delivery, or as a traditional portfolio site.
                    </p>
                  </div>

                  {/* Master Toggle */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200">
                          Marketplace Mode
                        </h3>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                          Enable full marketplace functionality with payments, orders, and automatic delivery
                        </p>
                      </div>
                      <ToggleSwitch
                        enabled={marketplaceSettings.marketplaceMode}
                        onChange={(enabled) => handleMarketplaceSettingsUpdate({ 
                          marketplaceMode: enabled,
                          paymentProcessingEnabled: enabled,
                          automaticDeliveryEnabled: enabled,
                          enableCheckoutProcess: enabled,
                          showPricesOnProjects: enabled
                        })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Individual Settings */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-slate-900 dark:text-white">
                      Individual Controls
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                              Payment Processing
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Enable checkout and payment functionality
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={marketplaceSettings.paymentProcessingEnabled}
                          onChange={(enabled) => handleMarketplaceSettingsUpdate({ 
                            paymentProcessingEnabled: enabled,
                            enableCheckoutProcess: enabled
                          })}
                          disabled={isLoading || !marketplaceSettings.marketplaceMode}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center">
                          <Send className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                              Automatic Document Delivery
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Automatically send documents after successful payment
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={marketplaceSettings.automaticDeliveryEnabled}
                          onChange={(enabled) => handleMarketplaceSettingsUpdate({ automaticDeliveryEnabled: enabled })}
                          disabled={isLoading || !marketplaceSettings.marketplaceMode}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center">
                          <ShoppingCart className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                              Show Prices on Projects
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Display pricing information on project cards
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={marketplaceSettings.showPricesOnProjects}
                          onChange={(enabled) => handleMarketplaceSettingsUpdate({ showPricesOnProjects: enabled })}
                          disabled={isLoading || !marketplaceSettings.marketplaceMode}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                              Email Notifications
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Send order confirmations and delivery emails
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={marketplaceSettings.emailNotificationsEnabled}
                          onChange={(enabled) => handleMarketplaceSettingsUpdate({ emailNotificationsEnabled: enabled })}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-slate-500 dark:text-slate-400 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                              Order Auto-Confirmation
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Automatically confirm orders after payment
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={marketplaceSettings.orderAutoConfirmation}
                          onChange={(enabled) => handleMarketplaceSettingsUpdate({ orderAutoConfirmation: enabled })}
                          disabled={isLoading || !marketplaceSettings.marketplaceMode}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Mode Notice */}
                  {!marketplaceSettings.marketplaceMode && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800 dark:text-amber-300">Portfolio Mode Active</h4>
                          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                            Your website is currently operating as a portfolio. Projects will be displayed without pricing or purchase options. 
                            Visitors can view your work and contact you for custom projects.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Status Summary */}
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 dark:text-white mb-3">Current Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Mode:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">
                          {marketplaceSettings.marketplaceMode ? 'Marketplace' : 'Portfolio'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Payments:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">
                          {marketplaceSettings.paymentProcessingEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Auto Delivery:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">
                          {marketplaceSettings.automaticDeliveryEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Show Prices:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">
                          {marketplaceSettings.showPricesOnProjects ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="flex-1 ml-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="flex-1 ml-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Website
                    </label>
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-slate-400" />
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        className="flex-1 ml-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <form onSubmit={handleNotificationSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Email Notifications</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Project Updates</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Get notified about project changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.projectUpdates}
                          onChange={(e) => setNotifications({ ...notifications, projectUpdates: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">New Inquiries</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Get notified about new client inquiries</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.newInquiries}
                          onChange={(e) => setNotifications({ ...notifications, newInquiries: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Order Alerts</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Get notified about new orders</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.orderAlerts}
                          onChange={(e) => setNotifications({ ...notifications, orderAlerts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Marketing Emails</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive promotional emails</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.marketingEmails}
                          onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  {/* Password Change */}
                  <form onSubmit={handleSecuritySubmit} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Change Password</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={securityData.currentPassword}
                            onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={securityData.newPassword}
                            onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={securityData.confirmPassword}
                            onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Update Password
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Email Change */}
                  <form onSubmit={handleEmailChange} className="space-y-6 border-t border-slate-200 dark:border-slate-700 pt-8">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Change Email Address</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailSettings.newEmail}
                            onChange={(e) => setEmailSettings({ ...emailSettings, newEmail: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                            Confirm New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailSettings.confirmEmail}
                            onChange={(e) => setEmailSettings({ ...emailSettings, confirmEmail: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Update Email
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <form onSubmit={handleAppearanceSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                      Theme
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                        className={`flex items-center px-4 py-2 rounded-lg border ${
                          appearance.theme === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                        className={`flex items-center px-4 py-2 rounded-lg border ${
                          appearance.theme === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                      Font Size
                    </label>
                    <select
                      value={appearance.fontSize}
                      onChange={(e) => setAppearance({ ...appearance, fontSize: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Compact Mode</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Reduce spacing and padding</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appearance.compactMode}
                          onChange={(e) => setAppearance({ ...appearance, compactMode: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Animations</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Enable smooth transitions and animations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appearance.animationsEnabled}
                          onChange={(e) => setAppearance({ ...appearance, animationsEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Palette className="h-4 w-4 mr-2" />
                          Save Appearance
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;