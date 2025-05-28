
import React, { useState, useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';
import { Users, Gamepad2, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AnimatedCard from '@/components/ui/AnimatedCard';

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    customersToday: 0,
    activeMachines: { active: 0, total: 0 },
    netProfit: 0,
    revenueTrend: 0,
    customersTrend: 0,
    machinesTrend: 0,
    profitTrend: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Get today's date and yesterday's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Fetch machine history for today
        const { data: todayHistory, error: todayHistoryError } = await supabase
          .from('machine_history')
          .select('revenue, cash_in, cash_out')
          .gte('recorded_at', today.toISOString());
        
        if (todayHistoryError) throw todayHistoryError;
        
        // Fetch machine history for yesterday
        const { data: yesterdayHistory, error: yesterdayHistoryError } = await supabase
          .from('machine_history')
          .select('revenue, cash_in, cash_out')
          .gte('recorded_at', yesterday.toISOString())
          .lt('recorded_at', today.toISOString());
        
        if (yesterdayHistoryError) throw yesterdayHistoryError;
        
        // Fetch expenses for today
        const { data: todayExpenses, error: todayExpensesError } = await supabase
          .from('finances')
          .select('amount')
          .eq('date', today.toISOString().split('T')[0]);
        
        if (todayExpensesError) throw todayExpensesError;
        
        // Fetch expenses for yesterday
        const { data: yesterdayExpenses, error: yesterdayExpensesError } = await supabase
          .from('finances')
          .select('amount')
          .eq('date', yesterday.toISOString().split('T')[0]);
        
        if (yesterdayExpensesError) throw yesterdayExpensesError;
        
        // Fetch machines count
        const { data: machines, error: machinesError } = await supabase
          .from('machines')
          .select('status');
        
        if (machinesError) throw machinesError;
        
        // Fetch customers created today
        const { data: todayCustomers, error: todayCustomersError } = await supabase
          .from('customers')
          .select('id')
          .gte('created_at', today.toISOString());
        
        if (todayCustomersError) throw todayCustomersError;
        
        // Fetch customers created yesterday
        const { data: yesterdayCustomers, error: yesterdayCustomersError } = await supabase
          .from('customers')
          .select('id')
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString());
        
        if (yesterdayCustomersError) throw yesterdayCustomersError;
        
        // Calculate revenue (cash_in)
        const todayCashIn = todayHistory?.reduce((sum, record) => sum + Number(record.cash_in || 0), 0) || 0;
        const yesterdayCashIn = yesterdayHistory?.reduce((sum, record) => sum + Number(record.cash_in || 0), 0) || 0;
        
        // Calculate cash out
        const todayCashOut = todayHistory?.reduce((sum, record) => sum + Number(record.cash_out || 0), 0) || 0;
        const yesterdayCashOut = yesterdayHistory?.reduce((sum, record) => sum + Number(record.cash_out || 0), 0) || 0;
        
        // Calculate expenses
        const todayExpensesTotal = todayExpenses?.reduce((sum, record) => sum + Number(record.amount || 0), 0) || 0;
        const yesterdayExpensesTotal = yesterdayExpenses?.reduce((sum, record) => sum + Number(record.amount || 0), 0) || 0;
        
        const todayCustomersCount = todayCustomers?.length || 0;
        const yesterdayCustomersCount = yesterdayCustomers?.length || 0;
        
        const activeMachines = machines?.filter(m => m.status === 'active').length || 0;
        const totalMachines = machines?.length || 0;
        
        // Calculate net profit (revenue - expenses)
        const todayRevenue = todayCashIn - todayCashOut;
        const yesterdayRevenue = yesterdayCashIn - yesterdayCashOut;
        
        const netProfit = todayRevenue - todayExpensesTotal;
        const yesterdayNetProfit = yesterdayRevenue - yesterdayExpensesTotal;
        
        // Calculate trends (percentage change from yesterday)
        const revenueTrend = calculateTrend(todayRevenue, yesterdayRevenue);
        const customersTrend = calculateTrend(todayCustomersCount, yesterdayCustomersCount);
        
        // For machine trend, we don't have yesterday's active machines, so using a mock value for now
        // In a real scenario, we would fetch this from the database as well
        const machinesTrend = 0;
        const profitTrend = calculateTrend(netProfit, yesterdayNetProfit);
        
        setStats({
          totalRevenue: todayRevenue,
          customersToday: todayCustomersCount,
          activeMachines: { active: activeMachines, total: totalMachines },
          netProfit,
          revenueTrend,
          customersTrend,
          machinesTrend,
          profitTrend
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, []);
  
  // Calculate percentage change with proper handling of edge cases
  const calculateTrend = (today: number, yesterday: number): number => {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    
    // Cap extreme percentage changes for better UI display
    const percentage = Math.round(((today - yesterday) / Math.abs(yesterday)) * 100);
    
    // Cap at +/-500% to avoid extreme numbers
    return Math.max(-500, Math.min(500, percentage));
  };

  // Format number as currency
  const formatCurrency = (value: number): string => {
    return `$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <AnimatedCard delay={0}>
        <StatCard 
          title="Total Revenue Today"
          value={loading ? "Loading..." : formatCurrency(stats.totalRevenue)}
          icon={<DollarSign size={20} />}
          description={stats.totalRevenue < 0 ? "Net cash outflow today" : "Total revenue generated today"}
          trend={stats.revenueTrend}
          trendLabel="vs. yesterday"
          className="transform transition-transform hover:scale-[1.02]"
        />
      </AnimatedCard>
      
      <AnimatedCard delay={100}>
        <StatCard 
          title="Customers Today"
          value={loading ? "Loading..." : stats.customersToday.toString()}
          icon={<Users size={20} />}
          description="New customers registered today"
          trend={stats.customersTrend}
          trendLabel="vs. yesterday"
          colorScheme="success"
          className="transform transition-transform hover:scale-[1.02]"
        />
      </AnimatedCard>
      
      <AnimatedCard delay={200}>
        <StatCard 
          title="Active Machines"
          value={loading ? "Loading..." : `${stats.activeMachines.active}/${stats.activeMachines.total}`}
          icon={<Gamepad2 size={20} />}
          description="Currently active gaming machines"
          trend={stats.machinesTrend}
          trendLabel="vs. yesterday"
          colorScheme="warning"
          className="transform transition-transform hover:scale-[1.02]"
        />
      </AnimatedCard>
      
      <AnimatedCard delay={300}>
        <StatCard 
          title="Net Profit Today"
          value={loading ? "Loading..." : formatCurrency(stats.netProfit)}
          icon={<TrendingUp size={20} />}
          description={stats.netProfit < 0 ? "Net loss after expenses" : "Net profit after expenses"}
          trend={stats.profitTrend}
          trendLabel="vs. yesterday"
          className="transform transition-transform hover:scale-[1.02]"
        />
      </AnimatedCard>
    </div>
  );
};

export default DashboardStats;
