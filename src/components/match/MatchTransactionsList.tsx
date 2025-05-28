
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Calendar, Search } from 'lucide-react';
import { toast } from 'sonner';
import { MatchTransaction } from '@/types/match';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

interface MatchTransactionsListProps {
  status?: string;
  statusList?: string[];
  onStatusChange?: () => void;
}

const MatchTransactionsList: React.FC<MatchTransactionsListProps> = ({
  status,
  statusList,
  onStatusChange,
}) => {
  const [transactions, setTransactions] = useState<MatchTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<MatchTransaction | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'redeem' | 'void'>('redeem');
  const [customerSearch, setCustomerSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<MatchTransaction[]>([]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('match_transactions')
        .select(`
          *,
          customer:customers(first_name, last_name),
          machine:machines(name),
          employee:staff(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      // Filter by status or status list
      if (status) {
        query = query.eq('status', status);
      } else if (statusList && statusList.length > 0) {
        query = query.in('status', statusList);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Cast the data to the correct type
      setTransactions((data || []) as unknown as MatchTransaction[]);
      applyFilters((data || []) as unknown as MatchTransaction[]);
    } catch (error) {
      console.error('Error fetching match transactions:', error);
      toast.error("Failed to load match transactions");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: MatchTransaction[] = transactions) => {
    let filtered = [...data];
    
    // Apply customer name filter
    if (customerSearch.trim() !== '') {
      const searchLower = customerSearch.toLowerCase();
      filtered = filtered.filter(transaction => {
        const firstName = transaction.customer?.first_name?.toLowerCase() || '';
        const lastName = transaction.customer?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`;
        return firstName.includes(searchLower) || 
               lastName.includes(searchLower) || 
               fullName.includes(searchLower);
      });
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        default:
          startDate = now;
          endDate = now;
      }
      
      filtered = filtered.filter(transaction => {
        const createdAt = new Date(transaction.created_at);
        return createdAt >= startDate && createdAt <= endDate;
      });
    }
    
    setFilteredTransactions(filtered);
  };

  useEffect(() => {
    fetchTransactions();
  }, [status, statusList]);

  useEffect(() => {
    applyFilters();
  }, [customerSearch, dateFilter]);

  const handleAction = async (action: 'redeem' | 'void') => {
    if (!selectedTransaction) return;
    
    try {
      const updates = {
        status: action === 'redeem' ? 'redeemed' : 'voided',
        redeemed_at: action === 'redeem' ? new Date().toISOString() : null,
      };
      
      const { error } = await supabase
        .from('match_transactions')
        .update(updates)
        .eq('id', selectedTransaction.id);
        
      if (error) throw error;
      
      toast.success(`Match credit ${action === 'redeem' ? 'redeemed' : 'voided'} successfully`);
      fetchTransactions();
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error(`Error ${action}ing match credit:`, error);
      toast.error(`Failed to ${action} match credit`);
    } finally {
      setIsAlertDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const openConfirmDialog = (transaction: MatchTransaction, action: 'redeem' | 'void') => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setIsAlertDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <div>
      <div className="flex flex-col space-y-4 mb-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by customer name..." 
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={dateFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month') => setDateFilter(value)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {transactions.length === 0 ? 
            "No match credit transactions found." : 
            "No transactions match your filter criteria."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Initial</TableHead>
              <TableHead className="text-right">Matched</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {transaction.customer ? 
                    `${transaction.customer.first_name} ${transaction.customer.last_name}` : 
                    'Unknown Customer'}
                </TableCell>
                <TableCell>
                  {transaction.machine ? transaction.machine.name : 'Unknown Machine'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">{formatDate(transaction.created_at)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">${parseFloat(transaction.initial_amount.toString()).toFixed(2)}</TableCell>
                <TableCell className="text-right">${parseFloat(transaction.matched_amount.toString()).toFixed(2)}</TableCell>
                <TableCell className="text-right">${parseFloat(transaction.total_credits.toString()).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {transaction.status === 'active' && (
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => openConfirmDialog(transaction, 'redeem')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Redeem
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openConfirmDialog(transaction, 'void')}
                        className="text-red-600 border-red-600"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Void
                      </Button>
                    </div>
                  )}
                  {transaction.status !== 'active' && (
                    <span className="capitalize text-sm font-medium">
                      {transaction.status}
                      {transaction.redeemed_at && ` (${formatDate(transaction.redeemed_at)})`}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'redeem' ? 'Redeem Match Credit' : 'Void Match Credit'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'redeem' 
                ? 'Are you sure you want to redeem this match credit? This action cannot be undone.'
                : 'Are you sure you want to void this match credit? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleAction(actionType)}
              className={actionType === 'redeem' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionType === 'redeem' ? 'Redeem' : 'Void'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MatchTransactionsList;
