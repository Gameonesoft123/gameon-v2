
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type CustomerData = {
  id: string;
  first_name: string;
  last_name: string;
  rating: number;
  created_at: string;
  email: string;
  machine_name?: string;
  amount_spent?: number;
};

const RecentCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecentCustomers = async () => {
      try {
        setLoading(true);
        
        // Fetch the most recent customers
        const { data: recentCustomers, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);
        
        if (customersError) throw customersError;
        
        if (!recentCustomers || recentCustomers.length === 0) {
          setCustomers([]);
          return;
        }
        
        // Create a map of customer IDs for faster lookup
        const customerMap = new Map();
        recentCustomers.forEach(customer => {
          customerMap.set(customer.id, {
            ...customer,
            amount_spent: 0,
            machine_name: 'No activity yet'
          });
        });
        
        // For each customer, try to find their machine usage
        const customerIds = recentCustomers.map(c => c.id);
        
        // Find machine usage for these customers from match_transactions
        const { data: matchData, error: matchError } = await supabase
          .from('match_transactions')
          .select('customer_id, initial_amount, machine_id')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false });
        
        if (matchError) throw matchError;
        
        // Process match transactions if available
        if (matchData && matchData.length > 0) {
          // Get the machine IDs to fetch their names
          const machineIds = [...new Set(matchData.map(t => t.machine_id))];
          
          // Fetch machine names
          const { data: machineData, error: machineError } = await supabase
            .from('machines')
            .select('id, name')
            .in('id', machineIds);
          
          if (machineError) throw machineError;
          
          // Create a map of machine IDs to names
          const machineMap = new Map();
          if (machineData) {
            machineData.forEach(machine => {
              machineMap.set(machine.id, machine.name);
            });
          }
          
          // Update customer data with match transaction info
          matchData.forEach(transaction => {
            if (customerMap.has(transaction.customer_id)) {
              const customer = customerMap.get(transaction.customer_id);
              
              // Only update if this is more recent activity (we're getting most recent anyway)
              if (!customer.machine_name || customer.machine_name === 'No activity yet') {
                customer.amount_spent = Number(transaction.initial_amount);
                customer.machine_name = machineMap.get(transaction.machine_id) || 'Unknown Machine';
              }
            }
          });
        }
        
        // Try to get machine history data as well
        const { data: historyData, error: historyError } = await supabase
          .from('machine_history')
          .select('machine_id, cash_in, notes')
          .order('recorded_at', { ascending: false })
          .limit(20);  // Get more records to increase chance of finding customer-related entries
        
        if (!historyError && historyData) {
          // Extract machine IDs to fetch their names
          const machineIds = [...new Set(historyData.map(h => h.machine_id))];
          
          // Fetch machine names if we don't already have them
          const { data: machineData, error: machineError } = await supabase
            .from('machines')
            .select('id, name')
            .in('id', machineIds);
          
          if (!machineError && machineData) {
            // Create/update machine map
            const machineMap = new Map();
            machineData.forEach(machine => {
              machineMap.set(machine.id, machine.name);
            });
            
            // Look for customer mentions in the notes field
            historyData.forEach(history => {
              if (history.notes) {
                customerIds.forEach(customerId => {
                  // If the customer is mentioned in the notes, use this as their activity
                  if (history.notes.includes(customerId)) {
                    const customer = customerMap.get(customerId);
                    if (customer && (!customer.machine_name || customer.machine_name === 'No activity yet')) {
                      customer.amount_spent = Number(history.cash_in);
                      customer.machine_name = machineMap.get(history.machine_id) || 'Unknown Machine';
                    }
                  }
                });
              }
            });
          }
        }
        
        // Convert the map back to an array
        setCustomers(Array.from(customerMap.values()));
      } catch (error) {
        console.error('Error fetching recent customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentCustomers();
  }, []);

  // Calculate time elapsed since a given date
  const timeElapsed = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Customers</CardTitle>
          <Users size={20} className="text-game-primary" />
        </div>
        <div className="highlight-bar"></div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-game-primary" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-game-primary flex items-center justify-center text-white mr-3">
                    <span className="font-medium">
                      {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center mt-1">
                      <span className="text-xs text-muted-foreground mr-2">
                        {timeElapsed(customer.created_at)}
                      </span>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < customer.rating ? "text-game-warning fill-game-warning" : "text-muted"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {customer.amount_spent && customer.amount_spent > 0 
                      ? `$${customer.amount_spent.toFixed(2)}` 
                      : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">{customer.machine_name || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentCustomers;
