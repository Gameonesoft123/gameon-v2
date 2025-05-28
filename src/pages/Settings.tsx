
import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, CreditCard } from 'lucide-react';
import { toast } from "sonner";
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSettings } from '@/hooks/useAppSettings';

// Tab Content Components
import GeneralSettings from '@/components/settings/GeneralSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import BillingSettings from '@/components/settings/BillingSettings';

const Settings: React.FC = () => {
  const { settings, updateSetting, saveAllSettings } = useAppSettings();

  const handleSaveSettings = () => {
    saveAllSettings();
    toast.success('Settings saved successfully');
  };

  return (
    <PageLayout title="Settings">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Configure your application settings and preferences
        </p>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">
              <SettingsIcon className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <GeneralSettings 
              settings={settings}
              updateSetting={updateSetting}
              onSave={handleSaveSettings}
            />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationSettings 
              settings={settings}
              updateSetting={updateSetting}
              onSave={handleSaveSettings}
            />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings 
              settings={settings}
              updateSetting={updateSetting}
              onSave={handleSaveSettings}
            />
          </TabsContent>
          
          <TabsContent value="billing">
            <BillingSettings onSave={handleSaveSettings} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Settings;
