
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign, Plus } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import ExpenseDialog from '@/components/finances/ExpenseDialog';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Expense = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  created_at: string;
}

const Finances: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setExpenses(data as Expense[]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <PageLayout title="Finances">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Track revenue, expenses, and profits</p>
          </div>
          <ExpenseDialog onSuccess={fetchExpenses} />
        </div>
        
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>Financial Management</AlertTitle>
          <AlertDescription>
            This page will help you track daily revenue, manage expenses, 
            generate financial reports, and monitor your game room's profitability.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-muted/10">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Expenses</h3>
              {/* Removed duplicate Add Expense button here */}
            </div>
            
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-6 text-center">
                <DollarSign size={64} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Financial Overview</h3>
                <p className="text-muted-foreground mb-4">
                  Your financial management system is ready to be used. Record your first transaction to get started.
                </p>
                <ExpenseDialog trigger={
                  <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                    <DollarSign size={16} className="mr-2" />
                    Add Sample Data
                  </button>
                } />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="text-right font-medium">${Number(expense.amount).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Finances;
