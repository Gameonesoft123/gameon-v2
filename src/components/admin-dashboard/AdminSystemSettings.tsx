
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Globe, Mail, BellRing, Database } from 'lucide-react';
import { toast } from 'sonner';

const AdminSystemSettings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'GameOn Enterprise',
    supportEmail: 'support@gameon.com',
    maintenanceMode: false,
    allowRegistration: true,
    storeTrialDays: 14
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    securityAlerts: true,
    financialReports: true,
    newRegistration: true,
    systemUpdates: true,
    maintenanceAlerts: true
  });

  const handleGeneralChange = (key: string, value: any) => {
    setGeneralSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNotificationChange = (key: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // In a real application, you would save these settings to your database
    toast.success("System settings updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">System Settings</h2>
        <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-700">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700">
            <BellRing className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-slate-700">
            <Globe className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-slate-700">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">General Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure basic platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300" htmlFor="platformName">Platform Name</Label>
                  <Input 
                    id="platformName" 
                    value={generalSettings.platformName}
                    onChange={(e) => handleGeneralChange('platformName', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Displayed throughout the platform
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300" htmlFor="supportEmail">Support Email</Label>
                  <Input 
                    id="supportEmail" 
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => handleGeneralChange('supportEmail', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    For system notifications and user support
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300" htmlFor="storeTrialDays">Store Trial Period (days)</Label>
                  <Input 
                    id="storeTrialDays" 
                    type="number"
                    value={generalSettings.storeTrialDays}
                    onChange={(e) => handleGeneralChange('storeTrialDays', Number(e.target.value))}
                    className="bg-slate-900 border-slate-700 text-slate-300"
                  />
                  <p className="text-xs text-slate-500">
                    Free trial period for new stores
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Maintenance Mode</Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Disable access to the platform for maintenance
                    </p>
                  </div>
                  <Switch 
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => handleGeneralChange('maintenanceMode', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-300">Allow New Registrations</Label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable or disable new store registrations
                    </p>
                  </div>
                  <Switch 
                    checked={generalSettings.allowRegistration}
                    onCheckedChange={(checked) => handleGeneralChange('allowRegistration', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">Notification Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-violet-400">Super Admin Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Email Alerts</Label>
                    <Switch 
                      checked={notificationSettings.emailAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Security Alerts</Label>
                    <Switch 
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Financial Reports</Label>
                    <Switch 
                      checked={notificationSettings.financialReports}
                      onCheckedChange={(checked) => handleNotificationChange('financialReports', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-violet-400">System Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">New Registrations</Label>
                    <Switch 
                      checked={notificationSettings.newRegistration}
                      onCheckedChange={(checked) => handleNotificationChange('newRegistration', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">System Updates</Label>
                    <Switch 
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Maintenance Alerts</Label>
                    <Switch 
                      checked={notificationSettings.maintenanceAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('maintenanceAlerts', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-violet-400 mr-2" />
                  <h3 className="text-sm font-medium text-slate-200">Email Template Settings</h3>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Configure system-wide email templates and branding options.
                </p>
                <Button variant="outline" size="sm" className="mt-3 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                  Manage Email Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">API & Integrations</CardTitle>
              <CardDescription className="text-slate-400">
                Manage external API connections and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Payment Processor</p>
                    <p className="text-xs text-slate-500">Stripe payment integration</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Email Service</p>
                    <p className="text-xs text-slate-500">SendGrid email integration</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-slate-300">SMS Notifications</p>
                    <p className="text-xs text-slate-500">Twilio SMS integration</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Analytics</p>
                    <p className="text-xs text-slate-500">Google Analytics integration</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-200">Database Management</CardTitle>
              <CardDescription className="text-slate-400">
                Manage database settings and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">Backup & Recovery</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-slate-400">Last backup: Today at 3:00 AM</p>
                    <p className="text-xs text-slate-400">Backup frequency: Daily</p>
                    <p className="text-xs text-slate-400">Retention period: 30 days</p>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                        Configure
                      </Button>
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                        Backup Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-slate-400">Current usage: 68%</p>
                    <p className="text-xs text-slate-400">Query performance: Good</p>
                    <p className="text-xs text-slate-400">Storage remaining: 32.7 GB</p>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700">
                        Optimize
                      </Button>
                      <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSystemSettings;
