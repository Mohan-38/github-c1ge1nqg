import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MarketplaceSettings {
  automaticDeliveryEnabled: boolean;
  paymentProcessingEnabled: boolean;
  emailNotificationsEnabled: boolean;
  orderAutoConfirmation: boolean;
  documentAutoGeneration: boolean;
  showPricesOnProjects: boolean;
  enableCheckoutProcess: boolean;
  marketplaceMode: boolean; // Master toggle for marketplace vs portfolio
  lastUpdated: string;
}

interface SettingsContextType {
  settings: MarketplaceSettings;
  updateSettings: (newSettings: Partial<MarketplaceSettings>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const defaultSettings: MarketplaceSettings = {
  automaticDeliveryEnabled: true,
  paymentProcessingEnabled: true,
  emailNotificationsEnabled: true,
  orderAutoConfirmation: true,
  documentAutoGeneration: true,
  showPricesOnProjects: true,
  enableCheckoutProcess: true,
  marketplaceMode: true, // Default to marketplace mode
  lastUpdated: new Date().toISOString()
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<MarketplaceSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage and Supabase
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to load from localStorage for immediate UI update
      const localSettings = localStorage.getItem('marketplace_settings');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }

      // Then try to load from Supabase (if user is authenticated)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase.auth.getUser();
          if (data.user?.user_metadata?.marketplace_settings) {
            const cloudSettings = data.user.user_metadata.marketplace_settings;
            setSettings({ ...defaultSettings, ...cloudSettings });
            // Update localStorage with cloud settings
            localStorage.setItem('marketplace_settings', JSON.stringify(cloudSettings));
          }
        }
      } catch (cloudError) {
        console.log('Could not load cloud settings, using local settings');
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<MarketplaceSettings>) => {
    try {
      setError(null);
      const updatedSettings = {
        ...settings,
        ...newSettings,
        lastUpdated: new Date().toISOString()
      };

      // Update local state immediately
      setSettings(updatedSettings);

      // Save to localStorage
      localStorage.setItem('marketplace_settings', JSON.stringify(updatedSettings));

      // Try to save to Supabase (if authenticated)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.updateUser({
            data: {
              marketplace_settings: updatedSettings
            }
          });
        }
      } catch (cloudError) {
        console.log('Could not save to cloud, settings saved locally');
      }

    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
      throw error;
    }
  };

  const value = {
    settings,
    updateSettings,
    loading,
    error
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};