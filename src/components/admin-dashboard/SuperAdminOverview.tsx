
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, DollarSign, Gamepad2, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const SuperAdminOverview = () => {
  const { toast } = useToast();
  
  // Fetch all stores data
  const { data: storesCount = 0, isLoading: loadingStores } = useQuery({
    queryKey: ['stores-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        toast({
          title: "Error fetching stores",
          description: error.message,
          variant: "destructive"
        });
        return 0;
      }
      
      return count || 0;
    }
  });
  
  // Fetch all customers count
  const { data: customersCount = 0, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        toast({
          title: "Error fetching customers",
          description: error.message,
          variant: "destructive"
        });
        return 0;
      }
      
      return count || 0;
    }
  });
  
  // Fetch all machines count and status
  const { data: machinesCount = 0, isLoading: loadingMachines } = useQuery({
    queryKey: ['machines-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('machines')
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        toast({
          title: "Error fetching machines",
          description: error.message,
          variant: "destructive"
        });
        return 0;
      }
      
      return count || 0;
    }
  });
  
  // Fetch global revenue data
  const { data: revenue = 0, isLoading: loadingRevenue } = useQuery({
    queryKey: ['total-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('machine_history')
        .select('cash_in');
        
      if (error) {
        toast({
          title: "Error fetching revenue data",
          description: error.message,
          variant: "destructive"
        });
        return 0;
      }
      
      // Calculate total revenue
      return data?.reduce((total, record) => {
        return total + (record.cash_in || 0);
      }, 0) || 0;
    }
  });

  // Fetch recent platform activity data
  const { data: recentActivity = [], isLoading: loadingActivity } = useQuery({
    queryKey: ['recent-platform-activity'],
    queryFn: async () => {
      // Fetch most recent activity from multiple tables
      const { data: machineData, error: machineError } = await supabase
        .from('machine_history')
        .select('recorded_at, machine_id, cash_in')
        .order('recorded_at', { ascending: false })
        .limit(2);
        
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('created_at, first_name, last_name')
        .order('created_at', { ascending: false })
        .limit(2);
      
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('created_at, name')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (machineError || customerError || storeError) {
        console.error("Error fetching activity data:", machineError || customerError || storeError);
        return [];
      }
      
      // Combine and format activity data
      const combinedActivity = [
        ...(machineData?.map(record => ({
          type: 'machine',
          message: `New machine transaction recorded: $${record.cash_in}`,
          timestamp: record.recorded_at
        })) || []),
        ...(customerData?.map(record => ({
          type: 'customer',
          message: `New customer registered: ${record.first_name} ${record.last_name}`,
          timestamp: record.created_at
        })) || []),
        ...(storeData?.map(record => ({
          type: 'store',
          message: `New store registered: ${record.name}`,
          timestamp: record.created_at
        })) || [])
      ];
      
      // Sort by timestamp, most recent first
      return combinedActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5); // Limit to 5 most recent activities
    }
  });

  // Format time ago for activity feed
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} ${interval === 1 ? 'year' : 'years'} ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} ${interval === 1 ? 'month' : 'months'} ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} ${interval === 1 ? 'day' : 'days'} ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;
    
    return 'just now';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Platform Overview</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-sm bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>All Systems Operational</span>
          </div>
          <div className="flex items-center space-x-1 text-sm bg-amber-900/30 text-amber-400 px-3 py-1.5 rounded-full">
            <AlertTriangle size={14} />
            <span>3 Issues Requiring Attention</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stores Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">Total Stores</CardTitle>
            <Building className="h-5 w-5 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loadingStores ? '...' : storesCount}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Active arcade locations
            </p>
          </CardContent>
        </Card>
        
        {/* Customers Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">Global Customers</CardTitle>
            <Users className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loadingCustomers ? '...' : customersCount}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Across all locations
            </p>
          </CardContent>
        </Card>
        
        {/* Machines Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">Active Machines</CardTitle>
            <Gamepad2 className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loadingMachines ? '...' : machinesCount}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Arcade machines deployed
            </p>
          </CardContent>
        </Card>
        
        {/* Revenue Card */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-slate-200 font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ${loadingRevenue ? '...' : revenue.toLocaleString()}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Platform-wide earnings
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Panel */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-200">Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {loadingActivity ? (
                <div className="text-center py-4 text-slate-400">Loading activity data...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-4 text-slate-400">No recent activity found</div>
              ) : (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start space-x-4 border-b border-slate-700/50 pb-4">
                    <div className="rounded-full bg-slate-700 p-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">{activity.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* System Status Panel */}
        <Card className="bg-slate-800 border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-200">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-slate-300">Database</span>
                </div>
                <span className="text-xs text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-slate-300">Authentication</span>
                </div>
                <span className="text-xs text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-slate-300">Storage</span>
                </div>
                <span className="text-xs text-green-400">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-sm text-slate-300">Edge Functions</span>
                </div>
                <span className="text-xs text-amber-400">Degraded</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-slate-300">Realtime</span>
                </div>
                <span className="text-xs text-green-400">Operational</span>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Last Checked</span>
                  <span className="text-xs text-slate-400">3 minutes ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
