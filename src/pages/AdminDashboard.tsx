import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SuperAdminTheme from '@/components/admin-dashboard/theme/SuperAdminTheme';
import SuperAdminSidebar from '@/components/admin-dashboard/layout/SuperAdminSidebar';
import SuperAdminHeader from '@/components/admin-dashboard/layout/SuperAdminHeader';
import SuperAdminOverview from '@/components/admin-dashboard/SuperAdminOverview';
import AdminStores from '@/components/admin-dashboard/AdminStores';
import AdminGlobalCustomers from '@/components/admin-dashboard/AdminGlobalCustomers';
import AdminSubscriptions from '@/components/admin/AdminSubscriptions';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminFinancials from '@/components/admin-dashboard/AdminFinancials';
import AdminSystemSettings from '@/components/admin-dashboard/AdminSystemSettings';
import AdminSecuritySettings from '@/components/admin-dashboard/AdminSecuritySettings';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminSupportCenter from '@/components/admin-dashboard/AdminSupportCenter';
import AdminActivityLogs from '@/components/admin-dashboard/AdminActivityLogs';
import RecentGlobalActivity from '@/components/admin-dashboard/RecentGlobalActivity';

const AdminDashboard = () => {
  const { userRole } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Only allow super_admin role to access this page
  if (userRole !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  
  // Render the appropriate component based on the active section
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <SuperAdminOverview />
            <RecentGlobalActivity />
          </div>
        );
      case 'stores':
        return <AdminStores />;
      case 'users':
        return <AdminUsers />;
      case 'customers':
        return <AdminGlobalCustomers />;
      case 'subscriptions':
        return <AdminSubscriptions />;
      case 'financials':
        return <AdminFinancials />;
      case 'settings':
        return <AdminSystemSettings />;
      case 'security':
        return <AdminSecuritySettings />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'support':
        return <AdminSupportCenter />;
      case 'activity':
        return <AdminActivityLogs />;
      default:
        return <SuperAdminOverview />;
    }
  };
  
  return (
    <SuperAdminTheme>
      <div className="flex h-screen overflow-hidden">
        <SuperAdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <SuperAdminHeader title={activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} />
          <main className="flex-1 overflow-y-auto px-6 py-6 bg-[#222]">
            {renderSection()}
          </main>
        </div>
      </div>
    </SuperAdminTheme>
  );
};

export default AdminDashboard;
