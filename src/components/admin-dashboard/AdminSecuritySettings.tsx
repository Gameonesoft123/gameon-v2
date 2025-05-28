
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Shield, User, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminSecuritySettings = () => {
  const [settings, setSettings] = useState({
    requireTwoFactor: true,
    passwordMinLength: 12,
    passwordExpiry: 60,
    sessionTimeout: 30,
    mfaEnforced: false,
    adminIpRestriction: true,
    failedLoginLimit: 5,
    lockoutDuration: 15
  });

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // In a real application, you would save these settings to your database
    toast.success("Security settings updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Security Settings</h2>
        <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-violet-500/10">
                <Lock className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-slate-200">Authentication Security</CardTitle>
                <CardDescription className="text-slate-400">Configure authentication requirements</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">Minimum Password Length</Label>
                  <p className="text-xs text-slate-500">Minimum characters required for passwords</p>
                </div>
                <Input 
                  type="number" 
                  value={settings.passwordMinLength}
                  onChange={(e) => handleChange('passwordMinLength', Number(e.target.value))}
                  className="w-20 bg-slate-900 border-slate-700 text-slate-300"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">Password Expiry (days)</Label>
                  <p className="text-xs text-slate-500">Days before password change is required</p>
                </div>
                <Input 
                  type="number" 
                  value={settings.passwordExpiry}
                  onChange={(e) => handleChange('passwordExpiry', Number(e.target.value))}
                  className="w-20 bg-slate-900 border-slate-700 text-slate-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">Enforce Multi-Factor Authentication</Label>
                  <p className="text-xs text-slate-500">Require MFA for all admin users</p>
                </div>
                <Switch 
                  checked={settings.mfaEnforced}
                  onCheckedChange={(checked) => handleChange('mfaEnforced', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">Failed Login Limit</Label>
                  <p className="text-xs text-slate-500">Max failed attempts before account lockout</p>
                </div>
                <Input 
                  type="number" 
                  value={settings.failedLoginLimit}
                  onChange={(e) => handleChange('failedLoginLimit', Number(e.target.value))}
                  className="w-20 bg-slate-900 border-slate-700 text-slate-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">Lockout Duration (minutes)</Label>
                  <p className="text-xs text-slate-500">Time before locked accounts can retry</p>
                </div>
                <Input 
                  type="number" 
                  value={settings.lockoutDuration}
                  onChange={(e) => handleChange('lockoutDuration', Number(e.target.value))}
                  className="w-20 bg-slate-900 border-slate-700 text-slate-300"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-slate-200">Access Control</CardTitle>
                <CardDescription className="text-slate-400">Manage platform access settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">Two-Factor Authentication</Label>
                  <p className="text-xs text-slate-500">Require 2FA for super admin access</p>
                </div>
                <Switch 
                  checked={settings.requireTwoFactor}
                  onCheckedChange={(checked) => handleChange('requireTwoFactor', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">Session Timeout (minutes)</Label>
                  <p className="text-xs text-slate-500">Minutes of inactivity before auto-logout</p>
                </div>
                <Input 
                  type="number" 
                  value={settings.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', Number(e.target.value))}
                  className="w-20 bg-slate-900 border-slate-700 text-slate-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm text-slate-300">IP Restriction for Admins</Label>
                  <p className="text-xs text-slate-500">Restrict admin access to allowlisted IPs</p>
                </div>
                <Switch 
                  checked={settings.adminIpRestriction}
                  onCheckedChange={(checked) => handleChange('adminIpRestriction', checked)}
                />
              </div>
            </div>

            <div className="bg-amber-900/20 border border-amber-700/30 rounded-md p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium">Security Audit Pending</p>
                <p className="text-xs text-amber-500/80 mt-1">
                  Your last security audit was 74 days ago. Industry best practice recommends audits every 60 days.
                </p>
                <Button size="sm" variant="outline" className="mt-3 bg-transparent border-amber-600/50 text-amber-400 hover:bg-amber-950 hover:text-amber-300">
                  <RefreshCw className="h-3 w-3 mr-1" /> Schedule Audit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 shadow-lg lg:col-span-2">
          <CardHeader className="border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <User className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-slate-200">Role Permissions</CardTitle>
                <CardDescription className="text-slate-400">Configure access levels for platform roles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Super Admin', 'Store Owner', 'Store Manager'].map((role) => (
                <Card key={role} className="bg-slate-900 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-300">{role} Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['View Customers', 'Edit Customers', 'View Revenue', 'Edit Store Settings'].map((permission) => (
                      <div key={permission} className="flex items-center justify-between">
                        <Label className="text-xs text-slate-400">{permission}</Label>
                        <Switch 
                          checked={true} 
                          onCheckedChange={() => {}}
                          disabled={role === 'Super Admin'}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Note: Super Admin permissions cannot be modified. Super Admins have full access to all platform features.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSecuritySettings;
