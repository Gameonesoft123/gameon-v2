
import React from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  UserCircle, 
  CreditCard, 
  PieChart,
  Settings, 
  Shield, 
  LifeBuoy, 
  BarChart4,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface SuperAdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ 
  activeSection,
  setActiveSection
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { signOut } = useAuth();

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'System overview and key metrics' },
    { id: 'stores', label: 'Stores', icon: Store, description: 'Manage arcade locations' },
    { id: 'users', label: 'Users', icon: UserCircle, description: 'Platform user management' },
    { id: 'customers', label: 'Customers', icon: Users, description: 'Global customer database' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, description: 'Manage store subscriptions' },
    { id: 'financials', label: 'Financials', icon: BarChart4, description: 'Platform-wide financial data' }
  ];
  
  const systemNavItems: NavItem[] = [
    { id: 'analytics', label: 'Analytics', icon: PieChart, description: 'Advanced reporting & insights' },
    { id: 'activity', label: 'Activity Logs', icon: Activity, description: 'Monitor system actions' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'System configuration' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Access control & security' },
    { id: 'support', label: 'Support', icon: LifeBuoy, description: 'Customer support tools' }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("You've been signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const renderNavItem = (item: NavItem) => (
    <Button
      key={item.id}
      variant="ghost"
      className={cn(
        "w-full justify-start mb-1 text-slate-300 hover:text-white hover:bg-slate-700",
        activeSection === item.id ? "bg-slate-700/70 text-white" : "",
        collapsed ? "px-3" : "px-4"
      )}
      onClick={() => setActiveSection(item.id)}
    >
      <item.icon size={20} className={cn(collapsed ? "mr-0" : "mr-3")} />
      {!collapsed && <span>{item.label}</span>}
    </Button>
  );

  return (
    <div 
      className={cn(
        "bg-[#1A1F2C] border-r border-slate-700/50 flex flex-col",
        collapsed ? "w-16" : "w-64",
        "transition-all duration-300"
      )}
    >
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        {!collapsed && (
          <div className="text-xl font-bold text-transparent bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text">
            SuperAdmin
          </div>
        )}
        {collapsed && <div className="mx-auto text-xl font-bold text-violet-400">SA</div>}
        <Button 
          variant="ghost" 
          size="icon"
          className="text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-6">
          {!collapsed && (
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2 px-2">
              Platform
            </h3>
          )}
          <div className="space-y-1">
            {mainNavItems.map(renderNavItem)}
          </div>
        </div>
        
        <div>
          {!collapsed && (
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2 px-2">
              System
            </h3>
          )}
          <div className="space-y-1">
            {systemNavItems.map(renderNavItem)}
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-700/50">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-slate-400 hover:text-white hover:bg-red-900/30",
            collapsed ? "px-3" : "px-4"
          )}
          onClick={handleSignOut}
        >
          <LogOut size={20} className={cn(collapsed ? "mr-0" : "mr-3")} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;
