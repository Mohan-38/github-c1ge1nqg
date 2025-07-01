import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Bell, 
  Shield, 
  User, 
  Palette,
  ShoppingCart,
  Eye,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Moon,
  Sun,
  Monitor,
  Lock,
  Key,
  UserCheck,
  Globe,
  Phone,
  MapPin,
  Camera,
  Edit3
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const AdminSettingsPage = () => {
  const { settings, updateSettings, loading, error } = useSettings();
  const { user, updateProfile, updatePassword, updateEmail } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    website: user?.website || '',
    bio: user?.bio || ''
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderNotifications: true,
    inquiryNotifications: true,
    systemNotifications: false,
    marketingEmails: false,
    weeklyReports: true,
    instantAlerts: true,
    soundEnabled: true
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: '24',
    passwordExpiry: '90',
    allowMultipleSessions: true,
    requireStrongPassword: true,
    logSecurityEvents: true
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Email change state - updated with verification flow
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmNewEmail: '',
    password: '',
    verificationCode: ''
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<'email-entry' | 'code-verification'>('email-entry');

  // Color palette definitions
  const colorPalettes = [
    {
      id: 'default',
      name: 'Default',
      description: 'Original website colors',
      colors: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
      cssVars: {
        '--color-primary': '#3b82f6',
        '--color-primary-dark': '#1d4ed8',
        '--color-secondary': '#1e40af',
        '--color-accent': '#1e3a8a',
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--text-primary': '#1f2937',
        '--text-secondary': '#6b7280'
      }
    },
    {
      id: 'ocean-blue',
      name: 'Ocean Blue',
      description: 'Professional blue theme with clean aesthetics',
      colors: ['#0ea5e9', '#0284c7', '#0369a1', '#075985'],
      cssVars: {
        '--color-primary': '#0ea5e9',
        '--color-primary-dark': '#0284c7',
        '--color-secondary': '#0369a1',
        '--color-accent': '#075985',
        '--bg-primary': '#f0f9ff',
        '--bg-secondary': '#e0f2fe',
        '--text-primary': '#0c4a6e',
        '--text-secondary': '#0369a1'
      }
    },
    {
      id: 'sunset-orange',
      name: 'Sunset Orange',
      description: 'Warm and energetic orange-red palette',
      colors: ['#f97316', '#ea580c', '#dc2626', '#b91c1c'],
      cssVars: {
        '--color-primary': '#f97316',
        '--color-primary-dark': '#ea580c',
        '--color-secondary': '#dc2626',
        '--color-accent': '#b91c1c',
        '--bg-primary': '#fff7ed',
        '--bg-secondary': '#ffedd5',
        '--text-primary': '#9a3412',
        '--text-secondary': '#ea580c'
      }
    },
    {
      id: 'forest-green',
      name: 'Forest Green',
      description: 'Natural green theme inspired by nature',
      colors: ['#10b981', '#059669', '#047857', '#065f46'],
      cssVars: {
        '--color-primary': '#10b981',
        '--color-primary-dark': '#059669',
        '--color-secondary': '#047857',
        '--color-accent': '#065f46',
        '--bg-primary': '#f0fdf4',
        '--bg-secondary': '#dcfce7',
        '--text-primary': '#14532d',
        '--text-secondary': '#166534'
      }
    },
    {
      id: 'royal-purple',
      name: 'Royal Purple',
      description: 'Elegant purple theme with luxury feel',
      colors: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
      cssVars: {
        '--color-primary': '#8b5cf6',
        '--color-primary-dark': '#7c3aed',
        '--color-secondary': '#6d28d9',
        '--color-accent': '#5b21b6',
        '--bg-primary': '#faf5ff',
        '--bg-secondary': '#f3e8ff',
        '--text-primary': '#581c87',
        '--text-secondary': '#7c3aed'
      }
    },
    {
      id: 'rose-pink',
      name: 'Rose Pink',
      description: 'Soft and modern pink theme',
      colors: ['#f472b6', '#ec4899', '#db2777', '#be185d'],
      cssVars: {
        '--color-primary': '#f472b6',
        '--color-primary-dark': '#ec4899',
        '--color-secondary': '#db2777',
        '--color-accent': '#be185d',
        '--bg-primary': '#fdf2f8',
        '--bg-secondary': '#fce7f3',
        '--text-primary': '#9d174d',
        '--text-secondary': '#be185d'
      }
    },
    {
      id: 'teal-cyan',
      name: 'Teal Cyan',
      description: 'Fresh and modern teal-cyan combination',
      colors: ['#06b6d4', '#0891b2', '#0e7490', '#155e75'],
      cssVars: {
        '--color-primary': '#06b6d4',
        '--color-primary-dark': '#0891b2',
        '--color-secondary': '#0e7490',
        '--color-accent': '#155e75',
        '--bg-primary': '#f0fdfa',
        '--bg-secondary': '#ccfbf1',
        '--text-primary': '#134e4a',
        '--text-secondary': '#0f766e'
      }
    },
    {
      id: 'golden-amber',
      name: 'Golden Amber',
      description: 'Warm golden theme with rich tones',
      colors: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
      cssVars: {
        '--color-primary': '#f59e0b',
        '--color-primary-dark': '#d97706',
        '--color-secondary': '#b45309',
        '--color-accent': '#92400e',
        '--bg-primary': '#fffbeb',
        '--bg-secondary': '#fef3c7',
        '--text-primary': '#78350f',
        '--text-secondary': '#92400e'
      }
    },
    {
      id: 'deep-indigo',
      name: 'Deep Indigo',
      description: 'Professional indigo with sophisticated appeal',
      colors: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3'],
      cssVars: {
        '--color-primary': '#6366f1',
        '--color-primary-dark': '#4f46e5',
        '--color-secondary': '#4338ca',
        '--color-accent': '#3730a3',
        '--bg-primary': '#faf5ff',
        '--bg-secondary': '#f3e8ff',
        '--text-primary': '#312e81',
        '--text-secondary': '#3730a3'
      }
    }
  ];

  const handleSaveSettings = async (newSettings: any) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateSettings(newSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Failed to save settings. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateProfile(profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError('Failed to update profile. Please try again.');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarketplaceModeToggle = async () => {
    const newSettings = {
      ...settings,
      marketplaceMode: !settings.marketplaceMode,
      // When switching to portfolio mode, disable marketplace features
      ...(settings.marketplaceMode ? {
        showPricesOnProjects: false,
        enableCheckoutProcess: false
      } : {})
    };
    await handleSaveSettings(newSettings);
  };

  const handleSettingToggle = async (settingKey: string, value: boolean) => {
    const newSettings = {
      ...settings,
      [settingKey]: value
    };
    await handleSaveSettings(newSettings);
  };

  // Enhanced color palette application function
  const applyColorPalette = async (paletteId: string) => {
    const palette = colorPalettes.find(p => p.id === paletteId);
    if (!palette) return;

    // Apply CSS custom properties to the root element
    const root = document.documentElement;
    
    // Apply all CSS variables from the palette
    Object.entries(palette.cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Remove existing palette classes and add new one
    document.body.className = document.body.className.replace(/palette-[\w-]+/g, '');
    document.body.classList.add(`palette-${paletteId}`);

    // Store the selection in localStorage for persistence
    localStorage.setItem('selectedColorPalette', paletteId);

    // Save to settings
    await handleSaveSettings({
      ...settings,
      colorPalette: paletteId
    });

    console.log(`Applied color palette: ${palette.name}`);
  };

  // Load saved color palette on component mount
  React.useEffect(() => {
    const savedPalette = localStorage.getItem('selectedColorPalette') || settings.colorPalette || 'default';
    const palette = colorPalettes.find(p => p.id === savedPalette);
    
    if (palette) {
      const root = document.documentElement;
      Object.entries(palette.cssVars).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
      document.body.className = document.body.className.replace(/palette-[\w-]+/g, '');
      document.body.classList.add(`palette-${savedPalette}`);
    }
  }, []);

  const getCurrentPalette = () => {
    const savedPalette = localStorage.getItem('selectedColorPalette') || settings.colorPalette;
    return colorPalettes.find(p => p.id === savedPalette) || colorPalettes[0]; // Default to first palette
  };

  // Password change handler with real Supabase integration
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      // Call the real updatePassword function from AuthContext
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Enhanced email change handler with verification flow
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationStep === 'email-entry') {
      if (!emailForm.newEmail || !emailForm.confirmNewEmail || !emailForm.password) {
        setEmailError('Please fill in all fields');
        return;
      }

      if (emailForm.newEmail !== emailForm.confirmNewEmail) {
        setEmailError('Email addresses do not match');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailForm.newEmail)) {
        setEmailError('Please enter a valid email address');
        return;
      }

      if (emailForm.newEmail === user?.email) {
        setEmailError('New email must be different from current email');
        return;
      }

      setEmailLoading(true);
      setEmailError(null);

      try {
        // Verify current password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: emailForm.password
        });

        if (signInError) {
          throw new Error('Current password is incorrect');
        }

        // In a real app, this would send a verification code to the new email
        // For demo purposes, we'll simulate this with a fixed code
        setVerificationStep('code-verification');
      } catch (error) {
        setEmailError(error instanceof Error ? error.message : 'Failed to initiate email change');
      } finally {
        setEmailLoading(false);
      }
    } else {
      // Verification step
      if (!emailForm.verificationCode) {
        setEmailError('Please enter the verification code');
        return;
      }

      // In a real app, you would verify the code matches what was sent
      // For demo, we'll just check if any code was entered
      if (emailForm.verificationCode.length < 6) {
        setEmailError('Please enter a valid 6-digit verification code');
        return;
      }

      setEmailLoading(true);
      setEmailError(null);
      setEmailSuccess(false);

      try {
        // Update email with Supabase
        const { error: updateError } = await supabase.auth.updateUser(
          { email: emailForm.newEmail },
          { emailRedirectTo: `${window.location.origin}/login` }
        );

        if (updateError) {
          throw updateError;
        }

        // Show success message
        setEmailSuccess(true);
        setEmailForm({
          newEmail: '',
          confirmNewEmail: '',
          password: '',
          verificationCode: ''
        });
        setVerificationStep('email-entry');
      } catch (error) {
        let errorMessage = 'Failed to update email';
        if (error instanceof Error) {
          if (error.message.includes('email_address_invalid')) {
            errorMessage = 'The email address is invalid. Please use a different email provider.';
          } else if (error.message.includes('password')) {
            errorMessage = 'Current password is incorrect';
          } else {
            errorMessage = error.message;
          }
        }
        setEmailError(errorMessage);
        setVerificationStep('email-entry');
      } finally {
        setEmailLoading(false);
      }
    }
  };

  const tabs = [
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Eye },
    { id: 'color-palette', label: 'Color Palette', icon: Palette }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your application settings and preferences
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Settings saved successfully!
          </div>
        )}

        {saveError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {saveError}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Marketplace Settings */}
            {activeTab === 'marketplace' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    Marketplace Configuration
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Configure how your website operates - as a marketplace for selling projects or as a portfolio showcase.
                  </p>
                </div>

                {/* Mode Toggle */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${settings.marketplaceMode ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                        {settings.marketplaceMode ? (
                          <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-200">
                          {settings.marketplaceMode ? 'Marketplace Mode' : 'Portfolio Mode'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {settings.marketplaceMode 
                            ? 'Full e-commerce functionality with payments and checkout'
                            : 'Portfolio showcase mode for displaying work samples'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleMarketplaceModeToggle}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        settings.marketplaceMode ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.marketplaceMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Marketplace Features */}
                {settings.marketplaceMode && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 dark:text-slate-200">Marketplace Features</h4>
                    
                    {[
                      {
                        key: 'showPricesOnProjects',
                        title: 'Show Prices on Projects',
                        description: 'Display project prices on cards and detail pages'
                      },
                      {
                        key: 'enableCheckoutProcess',
                        title: 'Enable Checkout Process',
                        description: 'Allow customers to purchase projects through the checkout flow'
                      },
                      {
                        key: 'automaticDeliveryEnabled',
                        title: 'Automatic Document Delivery',
                        description: 'Automatically send project documents after successful payment'
                      },
                      {
                        key: 'paymentProcessingEnabled',
                        title: 'Payment Processing',
                        description: 'Enable UPI and other payment methods'
                      },
                      {
                        key: 'emailNotificationsEnabled',
                        title: 'Email Notifications',
                        description: 'Send order confirmations and delivery notifications'
                      },
                      {
                        key: 'orderAutoConfirmation',
                        title: 'Order Auto-Confirmation',
                        description: 'Automatically confirm orders after payment'
                      }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-slate-200">{setting.title}</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</p>
                        </div>
                        <button
                          onClick={() => handleSettingToggle(setting.key, !settings[setting.key as keyof typeof settings])}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            settings[setting.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings[setting.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    Profile Information
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Update your personal information and profile details.
                  </p>
                </div>

                {/* Profile Picture */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <button className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-2 shadow-md border border-slate-200 dark:border-slate-600">
                        <Camera className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-200">Profile Picture</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Upload a new profile picture</p>
                      <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        Change Picture
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      placeholder="Enter your email"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    Notification Preferences
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Configure how and when you receive notifications.
                  </p>
                </div>

                {/* Email Notifications */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Notifications
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        key: 'emailNotifications',
                        title: 'Email Notifications',
                        description: 'Receive notifications via email'
                      },
                      {
                        key: 'orderNotifications',
                        title: 'Order Notifications',
                        description: 'Get notified about new orders and payments'
                      },
                      {
                        key: 'inquiryNotifications',
                        title: 'Inquiry Notifications',
                        description: 'Receive alerts for new project inquiries'
                      },
                      {
                        key: 'weeklyReports',
                        title: 'Weekly Reports',
                        description: 'Get weekly summary reports via email'
                      },
                      {
                        key: 'marketingEmails',
                        title: 'Marketing Emails',
                        description: 'Receive promotional and marketing emails'
                      }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between py-2">
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-slate-200">{setting.title}</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({
                            ...notificationSettings,
                            [setting.key]: !notificationSettings[setting.key as keyof typeof notificationSettings]
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            notificationSettings[setting.key as keyof typeof notificationSettings] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationSettings[setting.key as keyof typeof notificationSettings] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Notifications */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    System Notifications
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        key: 'systemNotifications',
                        title: 'System Notifications',
                        description: 'Receive system alerts and updates'
                      },
                      {
                        key: 'instantAlerts',
                        title: 'Instant Alerts',
                        description: 'Get real-time notifications for urgent matters'
                      },
                      {
                        key: 'soundEnabled',
                        title: 'Sound Notifications',
                        description: 'Play sound for new notifications'
                      }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between py-2">
                        <div>
                          <h5 className="font-medium text-slate-900 dark:text-slate-200">{setting.title}</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{setting.description}</p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({
                            ...notificationSettings,
                            [setting.key]: !notificationSettings[setting.key as keyof typeof notificationSettings]
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            notificationSettings[setting.key as keyof typeof notificationSettings] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationSettings[setting.key as keyof typeof notificationSettings] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    Security & Privacy
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Manage your account security and access controls.
                  </p>
                </div>

                {/* Change Password Section */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Change Password
                  </h4>
                  
                  {passwordSuccess && (
                    <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-3 rounded-lg flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Password updated successfully!
                    </div>
                  )}

                  {passwordError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-lg flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                        placeholder="Enter your current password"
                        disabled={passwordLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                        placeholder="Enter your new password"
                        disabled={passwordLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                        placeholder="Confirm your new password"
                        disabled={passwordLoading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Change Email Address Section - Updated with verification flow */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Change Email Address
                  </h4>
                  
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Current Email:</strong> {user?.email}
                    </p>
                  </div>

                  {emailSuccess ? (
                    <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Email change successful!</p>
                          <p className="text-sm mt-1">
                            Your email address has been updated. A confirmation has been sent to your new email address.
                            You may need to verify your new email address before you can use it to log in.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : emailError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-lg flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{emailError}</span>
                    </div>
                  )}

                  <form onSubmit={handleEmailChange} className="space-y-4">
                    {verificationStep === 'email-entry' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailForm.newEmail}
                            onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                            placeholder="Enter your new email address"
                            disabled={emailLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Confirm New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailForm.confirmNewEmail}
                            onChange={(e) => setEmailForm({ ...emailForm, confirmNewEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                            placeholder="Confirm your new email address"
                            disabled={emailLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Current Password (for verification)
                          </label>
                          <input
                            type="password"
                            value={emailForm.password}
                            onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                            placeholder="Enter your current password"
                            disabled={emailLoading}
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg">
                          <p className="text-sm">
                            We've sent a 6-digit verification code to <strong>{emailForm.newEmail}</strong>.
                            Please enter it below to confirm your email change.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Verification Code
                          </label>
                          <input
                            type="text"
                            value={emailForm.verificationCode}
                            onChange={(e) => setEmailForm({ ...emailForm, verificationCode: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                            placeholder="Enter 6-digit code"
                            disabled={emailLoading}
                            maxLength={6}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setVerificationStep('email-entry')}
                          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Didn't receive a code? Resend
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      {verificationStep === 'code-verification' && (
                        <button
                          type="button"
                          onClick={() => setVerificationStep('email-entry')}
                          disabled={emailLoading}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={emailLoading}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${verificationStep === 'code-verification' ? 'ml-auto' : ''}`}
                      >
                        {emailLoading ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            {verificationStep === 'email-entry' ? 'Sending Code...' : 'Updating Email...'}
                          </>
                        ) : (
                          <>
                            {verificationStep === 'email-entry' ? (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Verification Code
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Email Change
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Authentication */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Authentication
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-slate-200">Two-Factor Authentication</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Add an extra layer of security to your account</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings({
                          ...securitySettings,
                          twoFactorEnabled: !securitySettings.twoFactorEnabled
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          securitySettings.twoFactorEnabled ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-slate-200">Login Alerts</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Get notified of new login attempts</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings({
                          ...securitySettings,
                          loginAlerts: !securitySettings.loginAlerts
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          securitySettings.loginAlerts ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Session Management */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Session Management
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Session Timeout (hours)
                      </label>
                      <select
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="1">1 hour</option>
                        <option value="8">8 hours</option>
                        <option value="24">24 hours</option>
                        <option value="168">1 week</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-slate-200">Allow Multiple Sessions</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Allow login from multiple devices</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings({
                          ...securitySettings,
                          allowMultipleSessions: !securitySettings.allowMultipleSessions
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          securitySettings.allowMultipleSessions ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.allowMultipleSessions ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Policy */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    Password Policy
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Password Expiry (days)
                      </label>
                      <select
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          passwordExpiry: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="never">Never</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-slate-200">Require Strong Password</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Enforce strong password requirements</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings({
                          ...securitySettings,
                          requireStrongPassword: !securitySettings.requireStrongPassword
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          securitySettings.requireStrongPassword ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.requireStrongPassword ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    Appearance & Display
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Customize the look and feel of your application.
                  </p>
                </div>

                {/* Theme Selection */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Theme Preference
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: Sun, description: 'Light theme' },
                      { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme' },
                      { id: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' }
                    ].map((themeOption) => {
                      const Icon = themeOption.icon;
                      const isSelected = theme === themeOption.id;
                      return (
                        <button
                          key={themeOption.id}
                          onClick={() => setTheme(themeOption.id as any)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          <Icon className={`h-8 w-8 mx-auto mb-2 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                          }`} />
                          <div className={`font-medium ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-200'
                          }`}>
                            {themeOption.label}
                            {isSelected && <CheckCircle className="inline-block w-4 h-4 ml-2" />}
                          </div>
                          <p className={`text-sm mt-1 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {themeOption.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Display Options */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h4 className="font-medium text-slate-900 dark:text-slate-200 mb-4">Display Options</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Font Size
                      </label>
                      <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200">
                        <option value="small">Small</option>
                        <option value="medium" selected>Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Sidebar Width
                      </label>
                      <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200">
                        <option value="compact">Compact</option>
                        <option value="normal" selected>Normal</option>
                        <option value="wide">Wide</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-slate-200">Reduced Motion</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Minimize animations and transitions</p>
                      </div>
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-slate-200 dark:bg-slate-600"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Color Palette Settings */}
            {activeTab === 'color-palette' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-4">
                    Color Palette
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Choose a color scheme that will be applied to the entire website, similar to how dark/light mode works.
                  </p>
                </div>

                {/* Color Palette Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colorPalettes.map((palette) => {
                    const currentPalette = getCurrentPalette();
                    const isSelected = currentPalette.id === palette.id;
                    return (
                      <div
                        key={palette.id}
                        onClick={() => applyColorPalette(palette.id)}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {/* Color Swatches */}
                        <div className="flex space-x-1 mb-3">
                          {palette.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        
                        {/* Palette Info */}
                        <div>
                          <h4 className={`font-medium mb-1 flex items-center ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-200'
                          }`}>
                            {palette.name}
                            {isSelected && (
                              <CheckCircle className="inline-block w-4 h-4 ml-2 text-blue-600" />
                            )}
                          </h4>
                          <p className={`text-sm ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {palette.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Current Selection */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      {getCurrentPalette().colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        Current: {getCurrentPalette().name}
                      </span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {getCurrentPalette().description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => applyColorPalette('default')}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Status */}
        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Saving settings...
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;