import { useState, useEffect } from 'react';

export interface AppSettings {
  darkMode: boolean;
  autoSave: boolean;
  language: string;
  timezone: string;
  emailDaily: boolean;
  emailAlerts: boolean;
  emailMarketing: boolean;
  appRevenue: boolean;
  appMaintenance: boolean;
  appCustomers: boolean;
  faceIdLogin: boolean;
  matchThreshold: number;
  notificationDuration: number;
  notificationPosition: string;
}

export const defaultSettings: AppSettings = {
  darkMode: false,
  autoSave: true,
  language: 'en',
  timezone: 'UTC-8',
  emailDaily: true,
  emailAlerts: true,
  emailMarketing: false,
  appRevenue: true,
  appMaintenance: true,
  appCustomers: true,
  faceIdLogin: true,
  matchThreshold: 50,
  notificationDuration: 5000,
  notificationPosition: 'bottom-right'
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          ...parsedSettings,
          darkMode: isDarkMode
        });
      } catch (error) {
        console.error('Error parsing settings from localStorage:', error);
        setSettings({
          ...defaultSettings,
          darkMode: isDarkMode
        });
      }
    } else {
      setSettings({
        ...defaultSettings,
        darkMode: isDarkMode
      });
    }
    
    applyDarkMode(isDarkMode);
    
    const currentLang = localStorage.getItem('appLanguage') || 'en';
    applyLanguage(currentLang);
  }, []);

  const applyDarkMode = (isDark: boolean): void => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
  };

  const applyLanguage = (lang: string): void => {
    document.documentElement.lang = lang;
    localStorage.setItem('appLanguage', lang);
    console.log(`Language changed to: ${lang}`);
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): void => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (key === 'darkMode') {
      applyDarkMode(value as boolean);
    } else if (key === 'language') {
      applyLanguage(value as string);
    }
    
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const saveAllSettings = (): void => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    applyDarkMode(settings.darkMode);
    applyLanguage(settings.language);
  };

  return {
    settings,
    updateSetting,
    saveAllSettings
  };
}
