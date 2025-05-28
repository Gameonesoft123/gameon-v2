
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart4, CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

type ReportData = {
  period: string;
  cashIn: number;
  cashOut: number;
  revenue: number;
  expenses: number;
  profit: number;
  customerCount: number;
};

type MachineOption = {
  id: string;
  name: string;
};

const AdvancedReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<string>("today");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('all');

  // Fetch available machines
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const { data, error } = await supabase
          .from('machines')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        
        if (data) {
          setMachines(data);
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };
    
    fetchMachines();
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      
      try {
        // Determine date range
        const now = new Date();
        let fromDate = new Date();
        let toDate = new Date(now);
        let periodLabel = '';
        
        switch (dateRange) {
          case 'today':
            fromDate.setHours(0, 0, 0, 0);
            periodLabel = 'Today';
            break;
          case 'yesterday':
            fromDate.setDate(fromDate.getDate() - 1);
            fromDate.setHours(0, 0, 0, 0);
            toDate = new Date(fromDate);
            toDate.setHours(23, 59, 59, 999);
            periodLabel = 'Yesterday';
            break;
          case 'week':
            fromDate.setDate(fromDate.getDate() - 7);
            periodLabel = 'Last 7 Days';
            break;
          case 'month':
            fromDate.setMonth(fromDate.getMonth() - 1);
            periodLabel = 'Last 30 Days';
            break;
          case 'custom':
            if (startDate && endDate) {
              fromDate = new Date(startDate);
              fromDate.setHours(0, 0, 0, 0);
              toDate = new Date(endDate);
              toDate.setHours(23, 59, 59, 999);
              periodLabel = `${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}`;
            }
            break;
          default:
            fromDate.setHours(0, 0, 0, 0);
            periodLabel = 'Today';
            break;
        }
        
        // Convert to ISO strings for database queries
        const fromDateStr = fromDate.toISOString();
        const toDateStr = toDate.toISOString();
        
        // Fetch machine history data (cash in, cash out)
        let machineQuery = supabase
          .from('machine_history')
          .select(`
            machine_id,
            cash_in,
            cash_out,
            revenue,
            recorded_at
          `)
          .gte('recorded_at', fromDateStr)
          .lte('recorded_at', toDateStr);
          
        if (selectedMachine !== 'all') {
          machineQuery = machineQuery.eq('machine_id', selectedMachine);
        }
        
        const machineResult = await machineQuery;
        
        if (machineResult.error) throw machineResult.error;
        
        // Fetch expense data
        const expenseResult = await supabase
          .from('finances')
          .select('amount, date')
          .gte('date', fromDate.toISOString().split('T')[0])
          .lte('date', toDate.toISOString().split('T')[0]);
          
        if (expenseResult.error) throw expenseResult.error;
        
        // Fetch customer data (new registrations)
        const customerResult = await supabase
          .from('customers')
          .select('id, created_at')
          .gte('created_at', fromDateStr)
          .lte('created_at', toDateStr);
          
        if (customerResult.error) throw customerResult.error;
        
        // Calculate totals
        const machineData = machineResult.data || [];
        const expenseData = expenseResult.data || [];
        const customerData = customerResult.data || [];
        
        const totalCashIn = machineData.reduce((sum, entry) => sum + Number(entry.cash_in), 0);
        const totalCashOut = machineData.reduce((sum, entry) => sum + Number(entry.cash_out), 0);
        const totalRevenue = machineData.reduce((sum, entry) => sum + Number(entry.revenue), 0);
        const totalExpenses = expenseData.reduce((sum, entry) => sum + Number(entry.amount), 0);
        const totalProfit = totalRevenue - totalExpenses;
        const customerCount = customerData.length;
        
        setReportData({
          period: periodLabel,
          cashIn: totalCashIn,
          cashOut: totalCashOut,
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: totalProfit,
          customerCount: customerCount
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [dateRange, startDate, endDate, selectedMachine]);

  const handleGenerateReport = () => {
    // Reports are already being generated via useEffect
    // This is just a trigger button for the user
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Advanced Business Analytics</CardTitle>
          <BarChart4 size={20} className="text-game-primary" />
        </div>
        <CardDescription>
          Comprehensive view of business performance across all areas
        </CardDescription>
        <div className="highlight-bar"></div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium block mb-2">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {dateRange === "custom" && (
            <>
              <div>
                <label className="text-sm font-medium block mb-2">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
          
          <div>
            <label className="text-sm font-medium block mb-2">Machine</label>
            <Select 
              value={selectedMachine} 
              onValueChange={setSelectedMachine}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-3">
            <Button className="gap-2" onClick={handleGenerateReport}>
              <Filter size={16} />
              Generate Report
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading report data...</div>
        ) : reportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-green-700 mb-1">Total Cash In</p>
                  <p className="text-2xl font-bold text-green-800">${reportData.cashIn.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Cash Out</p>
                  <p className="text-2xl font-bold text-blue-800">${reportData.cashOut.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-purple-700 mb-1">Net Revenue</p>
                  <p className="text-2xl font-bold text-purple-800">${reportData.revenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-red-700 mb-1">Expenses</p>
                  <p className="text-2xl font-bold text-red-800">${reportData.expenses.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Profit/Loss</h3>
                    <span className={`text-lg font-bold ${reportData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${reportData.profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    {reportData.profit >= 0 ? (
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${Math.min(100, (reportData.profit / reportData.cashIn) * 100)}%` }}
                      ></div>
                    ) : (
                      <div 
                        className="h-full bg-red-500" 
                        style={{ width: `${Math.min(100, (Math.abs(reportData.profit) / reportData.cashIn) * 100)}%` }}
                      ></div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {reportData.profit >= 0 
                      ? `Profit margin: ${((reportData.profit / reportData.cashIn) * 100).toFixed(1)}%`
                      : `Loss percentage: ${((Math.abs(reportData.profit) / reportData.cashIn) * 100).toFixed(1)}%`}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">New Customers</h3>
                    <span className="text-lg font-bold text-blue-600">
                      {reportData.customerCount}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reportData.customerCount} new customers registered during this period
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Report Summary: {reportData.period}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Cash In</TableCell>
                      <TableCell className="text-right font-medium">${reportData.cashIn.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cash Out</TableCell>
                      <TableCell className="text-right font-medium">${reportData.cashOut.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Revenue</TableCell>
                      <TableCell className="text-right font-medium text-green-600">${reportData.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Expenses</TableCell>
                      <TableCell className="text-right font-medium text-red-600">${reportData.expenses.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Net Profit</TableCell>
                      <TableCell className={`text-right font-bold ${reportData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${reportData.profit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Select report parameters to generate a report
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedReports;
