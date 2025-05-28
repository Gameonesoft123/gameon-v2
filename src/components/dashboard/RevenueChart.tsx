
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, addDays, format } from 'date-fns';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface DailyFinanceData {
  name: string;
  formattedDate: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const RevenueChart: React.FC = () => {
  const [chartData, setChartData] = useState<DailyFinanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        setLoading(true);
        
        // Get the start of the current week
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
        
        // Generate an array of the last 7 days
        const weekDays = Array.from({ length: 7 }).map((_, index) => {
          const day = addDays(weekStart, index);
          return {
            date: format(day, 'yyyy-MM-dd'),
            dayName: format(day, 'EEE'), // Short day name
            formattedDate: format(day, 'yyyy-MM-dd')
          };
        });

        // Fetch machine history data for revenue
        const { data: revenueData, error: revenueError } = await supabase
          .from('machine_history')
          .select('recorded_at, revenue, cash_in, cash_out');
        
        if (revenueError) throw revenueError;
        
        // Fetch expense data
        const { data: expenseData, error: expenseError } = await supabase
          .from('finances')
          .select('date, amount');
        
        if (expenseError) throw expenseError;
        
        // Map the data to daily totals
        const dailyData = weekDays.map(day => {
          // Filter records for this day
          const dayRecords = revenueData?.filter(item => 
            item.recorded_at.startsWith(day.date)
          ) || [];
          
          // Calculate revenue directly from the database
          const dayRevenue = dayRecords.reduce((sum, item) => sum + Number(item.revenue), 0);
          
          // Sum expenses for this day
          const dayExpenses = expenseData
            ?.filter(item => item.date === day.date)
            .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0) || 0;
          
          // Calculate profit
          const dayProfit = dayRevenue - dayExpenses;
          
          return {
            name: day.dayName,
            formattedDate: day.formattedDate,
            revenue: dayRevenue,
            expenses: dayExpenses,
            profit: dayProfit
          };
        });
        
        setChartData(dailyData);
      } catch (error) {
        console.error('Error fetching weekly financial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklyData();
  }, []);

  return (
    <AnimatedCard className="col-span-3" delay={400}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Weekly Financial Performance</CardTitle>
        <div className="highlight-bar"></div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-game-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No financial data available for this week</p>
          </div>
        ) : (
          <div className="h-80 animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A4FCF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#5A4FCF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F56565" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F56565" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#48BB78" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#48BB78" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2D3748', 
                    borderColor: '#4A5568',
                    color: '#E2E8F0'
                  }} 
                  formatter={(value, name) => {
                    // Convert value to number before comparison to fix the type error
                    const numValue = Number(value);
                    const formattedValue = `${numValue >= 0 ? '+' : ''}$${Math.abs(numValue).toFixed(2)}`;
                    return [formattedValue, name];
                  }}
                  labelFormatter={(label) => {
                    const day = chartData.find(item => item.name === label);
                    return day ? `${label} (${day.formattedDate})` : label;
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#5A4FCF" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#F56565" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                  name="Expenses"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#48BB78" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

export default RevenueChart;
