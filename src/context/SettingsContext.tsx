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
  isPortfolioMode: boolean; // Computed property for easy access
  isMarketplaceMode: boolean; // Computed property for easy access
  refreshSettings: () => Promise<void>; // Add manual refresh function
}

const defaultSettings: MarketplaceSettings = {
  automaticDeliveryEnabled: true,
  paymentProcessingEnabled: true,
  emailNotificationsEnabled: true,
  orderAutoConfirmation: true,
  documentAutoGeneration: true,
  showPricesOnProjects: true,
  enableCheckoutProcess: true,
  marketplaceMode: true, // Default to marketplace mode to match your current setup
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
        const mergedSettings = { ...defaultSettings, ...parsed };
        setSettings(mergedSettings);
        console.log('🔄 Loaded settings from localStorage:', mergedSettings);
      }

      // Then try to load from Supabase (if user is authenticated)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.auth.getUser();
          if (data.user?.user_metadata?.marketplace_settings) {
            const cloudSettings = data.user.user_metadata.marketplace_settings;
            const finalSettings = { ...defaultSettings, ...cloudSettings };
            setSettings(finalSettings);
            // Update localStorage with cloud settings
            localStorage.setItem('marketplace_settings', JSON.stringify(finalSettings));
            console.log('☁️ Loaded settings from Supabase:', finalSettings);
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

  const refreshSettings = async () => {
    console.log('🔄 Manually refreshing settings...');
    await loadSettings();
  };

  const updateSettings = async (newSettings: Partial<MarketplaceSettings>) => {
    try {
      setError(null);
      const updatedSettings = {
        ...settings,
        ...newSettings,
        lastUpdated: new Date().toISOString()
      };

      console.log('💾 Updating settings:', updatedSettings);

      // Update local state immediately for real-time effect
      setSettings(updatedSettings);

      // Save to localStorage immediately
      localStorage.setItem('marketplace_settings', JSON.stringify(updatedSettings));
      console.log('✅ Settings saved to localStorage');

      // Try to save to Supabase (if authenticated)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.updateUser({
            data: {
              marketplace_settings: updatedSettings
            }
          });
          console.log('☁️ Settings saved to Supabase');
        }
      } catch (cloudError) {
        console.log('Could not save to cloud, settings saved locally');
      }

      // Force a small delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
      throw error;
    }
  };

  // Computed properties for easy access
  const isPortfolioMode = !settings.marketplaceMode;
  const isMarketplaceMode = settings.marketplaceMode;

  // Debug logging
  useEffect(() => {
    console.log('🎯 Settings Context State:', {
      marketplaceMode: settings.marketplaceMode,
      isPortfolioMode,
      isMarketplaceMode,
      enableCheckoutProcess: settings.enableCheckoutProcess,
      showPricesOnProjects: settings.showPricesOnProjects
    });
  }, [settings, isPortfolioMode, isMarketplaceMode]);

  const value = {
    settings,
    updateSettings,
    loading,
    error,
    isPortfolioMode,
    isMarketplaceMode,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};