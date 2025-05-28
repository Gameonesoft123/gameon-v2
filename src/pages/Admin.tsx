
import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminCompanies from '@/components/admin/AdminCompanies';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminSubscriptions from '@/components/admin/AdminSubscriptions';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from "sonner";

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'companies');

  useEffect(() => {
    if (tabFromUrl && ['companies', 'users', 'subscriptions', 'analytics'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // In a real implementation, this would come from an auth context or user state
  // For demonstration purposes, we'll use localStorage
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  // Set admin role for demo purposes - in a real app this would be set during authentication
  const setAdminRole = () => {
    localStorage.setItem('userRole', 'admin');
    toast.success("Admin role activated for demonstration");
    window.location.reload(); // Force reload to update UI
  };

  // Clear admin role for demo
  const clearAdminRole = () => {
    localStorage.removeItem('userRole');
    toast.success("Admin role deactivated");
    navigate('/'); // Redirect to home since user shouldn't be on admin page
  };

  if (!isAdmin) {
    return (
      <PageLayout title="Access Denied">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="bg-game-primary text-white py-2 px-4 rounded-md"
          >
            Return to Dashboard
          </button>
          
          {/* For demonstration purposes only - would be removed in production */}
          <div className="mt-8 p-4 border border-dashed border-amber-300 bg-amber-50 rounded-md">
            <h3 className="font-medium mb-2">Demo Controls</h3>
            <button 
              onClick={setAdminRole}
              className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md"
            >
              Simulate Admin Access (Demo)
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Admin Dashboard">
      <div className="space-y-4">
        <Tabs 
          defaultValue="companies" 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="companies">
            <AdminCompanies />
          </TabsContent>
          
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          
          <TabsContent value="subscriptions">
            <AdminSubscriptions />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>

        {/* For demonstration purposes only - would be removed in production */}
        <div className="mt-8 p-4 border border-dashed border-amber-300 bg-amber-50 rounded-md">
          <h3 className="font-medium mb-2">Demo Controls</h3>
          <button 
            onClick={clearAdminRole}
            className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md"
          >
            Exit Admin Mode (Demo)
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Admin;
