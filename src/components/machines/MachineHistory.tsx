
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MachineHistoryEntry = {
  id: string;
  machine_id: string;
  machine_name?: string;
  cash_in: number;
  cash_out: number;
  revenue: number;
  recorded_at: string;
  notes: string | null;
};

type MachineOption = {
  id: string;
  name: string;
};

const MachineHistory: React.FC = () => {
  const [historyEntries, setHistoryEntries] = useState<MachineHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('week');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [summary, setSummary] = useState<{
    totalCashIn: number;
    totalCashOut: number;
    totalRevenue: number;
  }>({
    totalCashIn: 0,
    totalCashOut: 0,
    totalRevenue: 0
  });

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
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('machine_history')
          .select(`
            id,
            machine_id,
            machines(name),
            cash_in,
            cash_out,
            revenue,
            recorded_at,
            notes
          `);
        
        // Apply machine filter if selected
        if (selectedMachine !== 'all') {
          query = query.eq('machine_id', selectedMachine);
        }
        
        // Apply date filter based on selection
        if (dateRange === 'custom' && startDate && endDate) {
          const startDateString = startDate.toISOString();
          const endDateString = new Date(endDate.setHours(23, 59, 59, 999)).toISOString();
          query = query
            .gte('recorded_at', startDateString)
            .lte('recorded_at', endDateString);
        } else {
          const now = new Date();
          let fromDate = new Date();
          
          switch (dateRange) {
            case 'today':
              fromDate.setHours(0, 0, 0, 0);
              break;
            case 'yesterday':
              fromDate.setDate(fromDate.getDate() - 1);
              fromDate.setHours(0, 0, 0, 0);
              now.setDate(now.getDate() - 1);
              now.setHours(23, 59, 59, 999);
              break;
            case 'week':
              fromDate.setDate(fromDate.getDate() - 7);
              break;
            case 'month':
              fromDate.setMonth(fromDate.getMonth() - 1);
              break;
            case 'year':
              fromDate.setFullYear(fromDate.getFullYear() - 1);
              break;
            default:
              fromDate.setDate(fromDate.getDate() - 7); // Default to week
              break;
          }
          
          query = query
            .gte('recorded_at', fromDate.toISOString())
            .lte('recorded_at', now.toISOString());
        }
        
        // Order by date, most recent first
        query = query.order('recorded_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          // Transform data to include machine name
          const formattedData = data.map(entry => ({
            id: entry.id,
            machine_id: entry.machine_id,
            machine_name: entry.machines?.name,
            cash_in: entry.cash_in,
            cash_out: entry.cash_out,
            revenue: entry.revenue,
            recorded_at: entry.recorded_at,
            notes: entry.notes
          }));
          
          setHistoryEntries(formattedData);
          
          // Calculate summary
          const totalCashIn = formattedData.reduce((sum, entry) => sum + Number(entry.cash_in), 0);
          const totalCashOut = formattedData.reduce((sum, entry) => sum + Number(entry.cash_out), 0);
          const totalRevenue = formattedData.reduce((sum, entry) => sum + Number(entry.revenue), 0);
          
          setSummary({
            totalCashIn,
            totalCashOut,
            totalRevenue
          });
        }
      } catch (error) {
        console.error('Error fetching machine history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [selectedMachine, dateRange, startDate, endDate]);

  const handleMachineChange = (value: string) => {
    setSelectedMachine(value);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (value !== 'custom') {
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  // Helper function to determine revenue color class
  const getRevenueColorClass = (value: number) => {
    if (value > 0) return 'text-green-600 font-medium';
    if (value < 0) return 'text-red-600 font-medium';
    return 'text-gray-600 font-medium';
  };

  // Helper function to format revenue with a sign
  const formatRevenue = (value: number) => {
    return `${value >= 0 ? '+' : ''}$${Number(value).toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Machine History</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium block mb-2">Select Machine</label>
            <Select 
              value={selectedMachine} 
              onValueChange={handleMachineChange}
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
          
          <div>
            <label className="text-sm font-medium block mb-2">Date Range</label>
            <Select 
              value={dateRange} 
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last 365 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex space-x-2">
              <div className="flex-1">
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
              
              <div className="flex-1">
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
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-50 border-green-100">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-green-700 mb-1">Total Cash In</p>
              <p className="text-2xl font-bold text-green-800">
                ${summary.totalCashIn.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-blue-700 mb-1">Total Cash Out</p>
              <p className="text-2xl font-bold text-blue-800">
                ${summary.totalCashOut.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card className={`${summary.totalRevenue >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <CardContent className="p-4 text-center">
              <p className={`text-sm font-medium ${summary.totalRevenue >= 0 ? 'text-green-700' : 'text-red-700'} mb-1`}>Net Revenue</p>
              <p className={`text-2xl font-bold ${summary.totalRevenue >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {formatRevenue(summary.totalRevenue)}
              </p>
            </CardContent>
          </Card>
        </div>
      
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading history...</div>
        ) : historyEntries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No cash records found for the selected period. Try a different date range or machine.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead className="text-right">Cash In</TableHead>
                  <TableHead className="text-right">Cash Out</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.recorded_at), 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell>{entry.machine_name || 'Unknown Machine'}</TableCell>
                    <TableCell className="text-right">
                      {entry.cash_in > 0 ? `$${Number(entry.cash_in).toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.cash_out > 0 ? `$${Number(entry.cash_out).toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell className={`text-right ${getRevenueColorClass(entry.revenue)}`}>
                      {formatRevenue(entry.revenue)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MachineHistory;
