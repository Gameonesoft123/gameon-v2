
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { AppSettings } from "@/hooks/useAppSettings";
import { ToggleSetting } from "./SettingItem";

interface SecuritySettingsProps {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onSave: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  updateSetting,
  onSave
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold mb-2">Security Settings</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="font-medium">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password" className="font-medium">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="font-medium">Confirm Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          
          <div className="pt-4">
            <Button>Change Password</Button>
          </div>
          
          <div className="border-t my-4"></div>
          
          <h4 className="font-medium">Two-Factor Authentication</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor" className="font-medium">Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">Secure your account with two-factor authentication</p>
            </div>
            <Switch id="two-factor" />
          </div>
          
          <div className="border-t my-4"></div>
          
          <h4 className="font-medium">Face ID Authentication</h4>
          
          <ToggleSetting
            id="face-id"
            title="Enable Face ID Login"
            description="Use facial recognition to log in securely"
            checked={settings.faceIdLogin}
            onCheckedChange={(checked) => updateSetting('faceIdLogin', checked)}
          />
          
          <div className="mt-2">
            <Button variant="outline" asChild>
              <Link to="/profile?tab=face-id">
                <Users className="mr-2 h-4 w-4" />
                Manage Face ID
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default SecuritySettings;
