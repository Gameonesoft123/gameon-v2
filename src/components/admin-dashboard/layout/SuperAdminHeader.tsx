
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, Globe, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const SuperAdminHeader: React.FC<{ title: string }> = ({ title }) => {
  const { userRole } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Badge className="ml-3 bg-gradient-to-r from-violet-600 to-violet-400 text-white border-none">
          Super Admin
        </Badge>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-700 hover:text-white">
          <HelpCircle size={20} />
        </Button>
        
        <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-700 hover:text-white">
          <Bell size={20} />
        </Button>
        
        <div className="flex items-center space-x-2 bg-slate-800 rounded-full px-3 py-1.5">
          <Globe size={18} className="text-violet-400" />
          <span className="text-sm font-medium">System: Operational</span>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;
