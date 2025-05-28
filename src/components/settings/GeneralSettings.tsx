
import React from 'react';
import { Button } from "@/components/ui/button";
import { ToggleSetting, SelectSetting } from "./SettingItem";
import { AppSettings } from "@/hooks/useAppSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GeneralSettingsProps {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onSave: () => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  updateSetting,
  onSave
}) => {
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];

  const timezoneOptions = [
    { value: 'UTC-8', label: 'Pacific Time (UTC-8)' },
    { value: 'UTC-5', label: 'Eastern Time (UTC-5)' },
    { value: 'UTC+0', label: 'UTC' },
    { value: 'UTC+1', label: 'Central European Time (UTC+1)' }
  ];

  const handleMatchThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      updateSetting('matchThreshold', value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold mb-2">General Settings</h3>
        
        <div className="space-y-4">
          <ToggleSetting
            id="dark-mode"
            title="Dark Mode"
            description="Use dark theme throughout the application"
            checked={settings.darkMode}
            onCheckedChange={(checked) => updateSetting('darkMode', checked)}
          />
          
          <ToggleSetting
            id="auto-save"
            title="Auto-save Data"
            description="Automatically save form data as you type"
            checked={settings.autoSave}
            onCheckedChange={(checked) => updateSetting('autoSave', checked)}
          />
          
          <SelectSetting
            id="language"
            title="Language"
            description="Select your preferred language"
            value={settings.language}
            onChange={(value) => updateSetting('language', value)}
            options={languageOptions}
          />
          
          <SelectSetting
            id="timezone"
            title="Time Zone"
            description="Set your local time zone"
            value={settings.timezone}
            onChange={(value) => updateSetting('timezone', value)}
            options={timezoneOptions}
          />
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="match-threshold" className="font-medium">
                Match Threshold
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="match-threshold"
                type="number"
                min="0"
                value={settings.matchThreshold || 50}
                onChange={handleMatchThresholdChange}
                className="max-w-[180px]"
              />
              <span className="text-sm text-muted-foreground">dollars</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Default threshold amount for qualifying for match credits
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default GeneralSettings;
