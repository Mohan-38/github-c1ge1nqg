import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Eye,
  ShoppingCart,
  CreditCard,
  Mail,
  FileText,
  DollarSign,
  Shield,
  Zap
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useSettings } from '../../context/SettingsContext';

const AdminSettingsPage = () => {
  const { settings, updateSettings, loading, error } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update local settings when context settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = (key: keyof typeof settings) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Failed to save settings. Please try again.');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-slate-600 dark:text-slate-400">Loading settings...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200 flex items-center">
                    <Settings className="h-6 w-6 mr-3" />
                    Marketplace Configuration
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Control how your website operates - as a marketplace with payments and automatic delivery, or as a traditional portfolio site.
                  </p>
                </div>

                {hasChanges && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
                )}
              </div>

              {/* Status Messages */}
              {saveSuccess && (
                <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center text-green-800 dark:text-green-300">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Settings saved successfully! Changes are now live.
                  </div>
                </div>
              )}

              {(saveError || error) && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center text-red-800 dark:text-red-300">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {saveError || error}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Master Mode Toggle */}
              <div className="mb-8">
                <div className={`border-2 rounded-lg p-6 transition-colors ${
                  localSettings.marketplaceMode 
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {localSettings.marketplaceMode ? (
                        <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                      ) : (
                        <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                      )}
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          localSettings.marketplaceMode 
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-blue-800 dark:text-blue-300'
                        }`}>
                          {localSettings.marketplaceMode ? 'Marketplace Mode' : 'Portfolio Mode'}
                        </h3>
                        <p className={`text-sm ${
                          localSettings.marketplaceMode 
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-blue-700 dark:text-blue-400'
                        }`}>
                          {localSettings.marketplaceMode 
                            ? 'Enable full marketplace functionality with payments, orders, and automatic delivery'
                            : 'Display projects as portfolio showcase only - no purchasing options, contact form available'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.marketplaceMode}
                        onChange={() => handleToggle('marketplaceMode')}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Individual Controls */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-4">Individual Controls</h3>
                
                {/* Payment Processing */}
                <SettingToggle
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Payment Processing"
                  description="Enable checkout and payment functionality"
                  checked={localSettings.paymentProcessingEnabled}
                  onChange={() => handleToggle('paymentProcessingEnabled')}
                  disabled={!localSettings.marketplaceMode}
                />

                {/* Automatic Document Delivery */}
                <SettingToggle
                  icon={<Zap className="h-5 w-5" />}
                  title="Automatic Document Delivery"
                  description="Automatically send documents after successful payment"
                  checked={localSettings.automaticDeliveryEnabled}
                  onChange={() => handleToggle('automaticDeliveryEnabled')}
                  disabled={!localSettings.marketplaceMode}
                />

                {/* Show Prices on Projects */}
                <SettingToggle
                  icon={<DollarSign className="h-5 w-5" />}
                  title="Show Prices on Projects"
                  description="Display pricing information on project cards"
                  checked={localSettings.showPricesOnProjects}
                  onChange={() => handleToggle('showPricesOnProjects')}
                  disabled={!localSettings.marketplaceMode}
                />

                {/* Email Notifications */}
                <SettingToggle
                  icon={<Mail className="h-5 w-5" />}
                  title="Email Notifications"
                  description="Send order confirmations and delivery emails"
                  checked={localSettings.emailNotificationsEnabled}
                  onChange={() => handleToggle('emailNotificationsEnabled')}
                />

                {/* Order Auto-Confirmation */}
                <SettingToggle
                  icon={<CheckCircle className="h-5 w-5" />}
                  title="Order Auto-Confirmation"
                  description="Automatically confirm orders after payment"
                  checked={localSettings.orderAutoConfirmation}
                  onChange={() => handleToggle('orderAutoConfirmation')}
                  disabled={!localSettings.marketplaceMode}
                />
              </div>

              {/* Current Status Display */}
              {!localSettings.marketplaceMode && (
                <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">Portfolio Mode Active</h4>
                      <p className="text-amber-700 dark:text-amber-400 text-sm">
                        Your website is currently operating as a portfolio. Projects will be displayed without pricing or purchase options. 
                        Visitors can view your work and contact you for custom projects.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Configuration Summary */}
              <div className="mt-8 bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">Current Configuration</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Mode:</span>
                    <span className={`ml-2 font-medium ${
                      localSettings.marketplaceMode 
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {localSettings.marketplaceMode ? 'Marketplace' : 'Portfolio'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Payments:</span>
                    <span className={`ml-2 font-medium ${
                      localSettings.paymentProcessingEnabled && localSettings.marketplaceMode
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {localSettings.paymentProcessingEnabled && localSettings.marketplaceMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Auto Delivery:</span>
                    <span className={`ml-2 font-medium ${
                      localSettings.automaticDeliveryEnabled && localSettings.marketplaceMode
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {localSettings.automaticDeliveryEnabled && localSettings.marketplaceMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Show Prices:</span>
                    <span className={`ml-2 font-medium ${
                      localSettings.showPricesOnProjects && localSettings.marketplaceMode
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {localSettings.showPricesOnProjects && localSettings.marketplaceMode ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Reusable Setting Toggle Component
const SettingToggle = ({ 
  icon, 
  title, 
  description, 
  checked, 
  onChange, 
  disabled = false 
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
    disabled 
      ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-50'
      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
  }`}>
    <div className="flex items-center">
      <div className={`p-2 rounded-lg mr-4 ${
        disabled 
          ? 'bg-slate-200 dark:bg-slate-600 text-slate-400'
          : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
      }`}>
        {icon}
      </div>
      <div>
        <h4 className={`font-medium ${
          disabled 
            ? 'text-slate-400 dark:text-slate-500'
            : 'text-slate-900 dark:text-slate-200'
        }`}>
          {title}
        </h4>
        <p className={`text-sm ${
          disabled 
            ? 'text-slate-400 dark:text-slate-500'
            : 'text-slate-600 dark:text-slate-400'
        }`}>
          {description}
        </p>
      </div>
    </div>
    
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 rounded-full peer transition-colors ${
        disabled 
          ? 'bg-slate-300 dark:bg-slate-600'
          : checked 
            ? 'bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800'
            : 'bg-slate-200 dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-600'
      } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600`}></div>
    </label>
  </div>
);

export default AdminSettingsPage;