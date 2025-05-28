
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Lock, UserCheck, Settings, LockKeyhole } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const Security: React.FC = () => {
  const handleSecurityChange = () => {
    toast.success('Security settings updated');
  };

  return (
    <PageLayout title="Security">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Manage security settings and access controls</p>
          </div>
          <Button className="bg-game-primary hover:bg-game-primary/90">
            <LockKeyhole size={18} className="mr-2" />
            Generate Security Report
          </Button>
        </div>
        
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Security Center</AlertTitle>
          <AlertDescription>
            Configure security settings, access controls, and monitor system activity to 
            ensure your gaming operation remains secure and compliant.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="access" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="access">Access Controls</TabsTrigger>
            <TabsTrigger value="mfa">Two-Factor Authentication</TabsTrigger>
            <TabsTrigger value="logs">Security Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>Access Controls</CardTitle>
                <CardDescription>
                  Manage user roles and permissions across the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-game-primary" />
                      <span className="font-medium">Staff Role Management</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Control what staff members can see and do
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-game-primary" />
                      <span className="font-medium">Machine Access Controls</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set who can access machine settings and logs
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-game-primary" />
                      <span className="font-medium">System Settings Access</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Control access to critical system settings
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="mfa">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <span className="font-medium">Require for all staff members</span>
                    <p className="text-sm text-muted-foreground">
                      Force all staff to use 2FA when logging in
                    </p>
                  </div>
                  <Switch onCheckedChange={handleSecurityChange} />
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <span className="font-medium">SMS Authentication</span>
                    <p className="text-sm text-muted-foreground">
                      Receive verification codes via SMS
                    </p>
                  </div>
                  <Switch defaultChecked onCheckedChange={handleSecurityChange} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-medium">Authenticator Apps</span>
                    <p className="text-sm text-muted-foreground">
                      Use Google Authenticator or similar apps
                    </p>
                  </div>
                  <Switch onCheckedChange={handleSecurityChange} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Security Logs</CardTitle>
                <CardDescription>
                  Monitor login attempts and system changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="p-4 bg-muted text-sm font-mono">
                    <p>[2025-04-09 14:15:23] User john.doe logged in successfully</p>
                    <p>[2025-04-09 12:30:11] User admin@example.com updated system settings</p>
                    <p>[2025-04-09 10:05:42] Failed login attempt for user sarah.smith</p>
                    <p>[2025-04-09 09:23:15] User admin@example.com created new staff account</p>
                    <p>[2025-04-08 16:45:32] User john.doe updated machine settings</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <Button variant="outline">Export Logs</Button>
                  <Button variant="outline">Clear History</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Security;
