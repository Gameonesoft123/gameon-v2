
import React from 'react';
import { Button } from "@/components/ui/button";
import { ToggleSetting } from "./SettingItem";
import { AppSettings } from "@/hooks/useAppSettings";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettingsProps {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onSave: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  updateSetting,
  onSave
}) => {
  const handleTestNotification = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{ 
          type: 'customer', 
          title: 'Test Notification', 
          message: 'This is a test notification from your notification settings.', 
          read: false 
        }]);
        
      if (error) throw error;
      
      toast.success('Test notification sent successfully!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold mb-2">Notification Preferences</h3>
        
        <div className="space-y-4">
          <h4 className="font-medium">Email Notifications</h4>
          
          <ToggleSetting
            id="email-daily"
            title="Daily Summary"
            description="Receive daily summary of machine activity"
            checked={settings.emailDaily}
            onCheckedChange={(checked) => updateSetting('emailDaily', checked)}
          />
          
          <ToggleSetting
            id="email-alerts"
            title="Security Alerts"
            description="Receive notifications about security events"
            checked={settings.emailAlerts}
            onCheckedChange={(checked) => updateSetting('emailAlerts', checked)}
          />
          
          <ToggleSetting
            id="email-marketing"
            title="Marketing Updates"
            description="Receive promotional emails and updates"
            checked={settings.emailMarketing}
            onCheckedChange={(checked) => updateSetting('emailMarketing', checked)}
          />
          
          <div className="border-t my-4"></div>
          
          <h4 className="font-medium">In-App Notifications</h4>
          
          <ToggleSetting
            id="app-revenue"
            title="Revenue Alerts"
            description="Show notifications for revenue milestones"
            checked={settings.appRevenue}
            onCheckedChange={(checked) => updateSetting('appRevenue', checked)}
          />
          
          <ToggleSetting
            id="app-maintenance"
            title="Maintenance Reminders"
            description="Show notifications for scheduled maintenance"
            checked={settings.appMaintenance}
            onCheckedChange={(checked) => updateSetting('appMaintenance', checked)}
          />
          
          <ToggleSetting
            id="app-customers"
            title="New Customers"
            description="Show notifications when new customers register"
            checked={settings.appCustomers}
            onCheckedChange={(checked) => updateSetting('appCustomers', checked)}
          />
          
          <div className="border-t my-4"></div>
          
          <h4 className="font-medium">Notification Display</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Notification Display Time</p>
              <Select
                value={settings.notificationDuration?.toString() || "5000"}
                onValueChange={(val) => updateSetting('notificationDuration', parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3000">3 seconds</SelectItem>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="8000">8 seconds</SelectItem>
                  <SelectItem value="10000">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Notification Position</p>
              <Select
                value={settings.notificationPosition || "bottom-right"}
                onValueChange={(val: any) => updateSetting('notificationPosition', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card className="mt-6 p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Test Notifications</h4>
              <p className="text-sm text-muted-foreground">Send a test notification to ensure your settings are working correctly.</p>
            </div>
            <Button variant="outline" onClick={handleTestNotification}>
              Send Test
            </Button>
          </div>
        </Card>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
