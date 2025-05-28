
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ToggleSettingProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const ToggleSetting: React.FC<ToggleSettingProps> = ({
  id,
  title,
  description,
  checked,
  onCheckedChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={id} className="font-medium">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch 
        id={id} 
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};

interface SelectSettingProps {
  id: string;
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export const SelectSetting: React.FC<SelectSettingProps> = ({
  id,
  title,
  description,
  value,
  onChange,
  options
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={id} className="font-medium">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <select 
        id={id} 
        className="p-2 rounded-md border border-input bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};
