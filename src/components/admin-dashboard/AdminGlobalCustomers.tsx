import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import CustomerSearchFilters from './components/CustomerSearchFilters';
import CustomersTable from './components/CustomersTable';
import CustomerDetailsDialog from './components/CustomerDetailsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminDataFix from './AdminDataFix';

// Define customer types
interface StoreVisit {
  store: string;
  date: string;
  duration: string;
  spent: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  stores: string[];
  visitCount: number;
  lastVisit: string;
  spendingLevel: string;
  totalSpent: string;
  flagged: boolean;
  flagReason?: string;
  storeVisits: StoreVisit[];
}

// Store type definition
interface Store {
  id: string;
  name: string;
}

const AdminGlobalCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [spendingFilter, setSpendingFilter] = useState('all');
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [processedCustomers, setProcessedCustomers] = useState<Customer[]>([]);
  const { toast } = useToast();
  
  // Fetch stores data
  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name');
        
      if (error) {
        toast({
          title: "Error loading stores",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Fetch customers data
  const { data: rawCustomers = [], isLoading: isLoadingCustomers, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast({
          title: "Error loading customers",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data || [];
    }
  });
  
  // Process raw customer data into the format we need
  useEffect(() => {
    if (!rawCustomers.length) return;
    
    // Transform raw customer data to match our Customer interface
    const transformedCustomers: Customer[] = rawCustomers.map(customer => {
      // Determine spending level based on some logic (perhaps based on a "spending" field if available)
      // For now, we'll assign random spending levels
      const spendingLevels = ['high', 'medium', 'low'];
      const randomSpendingLevel = spendingLevels[Math.floor(Math.random() * spendingLevels.length)];
      
      // Determine which stores the customer has visited (this would come from a join query in a real app)
      // For now, assign random stores
      const randomStores: string[] = [];
      const storeCount = Math.floor(Math.random() * 3) + 1; // 1-3 stores
      for (let i = 0; i < storeCount; i++) {
        const randomStore = stores[Math.floor(Math.random() * stores.length)];
        if (randomStore && !randomStores.includes(randomStore.name)) {
          randomStores.push(randomStore.name);
        }
      }
      
      // Generate mock visit data (in a real app, this would come from a visits table)
      const visitCount = Math.floor(Math.random() * 50) + 1;
      
      // Create mock store visits
      const storeVisits: StoreVisit[] = [];
      for (let i = 0; i < Math.min(3, visitCount); i++) {
        const visitStore = randomStores[Math.floor(Math.random() * randomStores.length)];
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
        
        storeVisits.push({
          store: visitStore,
          date: visitDate.toISOString().split('T')[0],
          duration: `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m`,
          spent: `$${Math.floor(Math.random() * 200) + 20}`
        });
      }
      
      // Sort visits by date, most recent first
      storeVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Calculate total spent
      const totalSpent = storeVisits.reduce((sum, visit) => {
        return sum + parseInt(visit.spent.replace('$', ''));
      }, 0);
      
      return {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        stores: randomStores,
        visitCount,
        lastVisit: storeVisits[0]?.date || customer.created_at.split('T')[0],
        spendingLevel: randomSpendingLevel,
        totalSpent: `$${totalSpent}`,
        flagged: Math.random() > 0.9, // 10% chance of being flagged
        flagReason: Math.random() > 0.9 ? 'Disruptive behavior at multiple locations' : undefined,
        storeVisits
      };
    });
    
    setProcessedCustomers(transformedCustomers);
  }, [rawCustomers, stores]);
  
  // Filter customers based on search term and filters
  const filterCustomers = () => {
    return processedCustomers.filter(customer => {
      // Search filter
      const searchMatch = 
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm);
      
      // Store filter
      const storeMatch = storeFilter === 'all' || 
        (storeFilter && customer.stores.includes(stores.find(s => s.id === storeFilter)?.name || ''));
      
      // Spending filter
      const spendingMatch = spendingFilter === 'all' || 
        customer.spendingLevel === spendingFilter;
      
      return searchMatch && storeMatch && spendingMatch;
    });
  };
  
  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailsOpen(true);
  };
  
  const handleFlagCustomer = async (customer: Customer) => {
    try {
      // In a real implementation, you would update the customer's status in the database
      // For now, we'll just show a toast notification
      toast({
        title: customer.flagged ? "Flag removed" : "Customer flagged",
        description: customer.flagged 
          ? `${customer.firstName} ${customer.lastName} has been removed from the flagged list.`
          : `${customer.firstName} ${customer.lastName} has been added to the flagged list.`,
        variant: customer.flagged ? "default" : "destructive"
      });
      
      // Refetch customers to update the UI
      refetch();
    } catch (error) {
      toast({
        title: "Error updating customer flag",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleExportData = () => {
    const filteredData = filterCustomers();
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Stores', 'Visit Count', 'Total Spent', 'Last Visit', 'Status'],
      ...filteredData.map(customer => [
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.stores.join(';'),
        customer.visitCount.toString(),
        customer.totalSpent,
        customer.lastVisit,
        customer.flagged ? 'Flagged' : 'Active'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'global-customers-export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export complete",
      description: `${filteredData.length} customer records exported to CSV file.`
    });
  };
  
  const getSpendingBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-slate-500 text-slate-700">Low</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };
  
  return (
    <>
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="data-tools">Data Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers" className="space-y-4">
          <CustomerSearchFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            storeFilter={storeFilter}
            setStoreFilter={setStoreFilter}
            spendingFilter={spendingFilter}
            setSpendingFilter={setSpendingFilter}
            stores={stores}
            onExportData={handleExportData}
            totalResults={filterCustomers().length}
            isLoading={isLoadingCustomers || isLoadingStores}
          />

          <CustomersTable 
            customers={filterCustomers()}
            onViewDetails={handleViewCustomerDetails}
            onFlagCustomer={handleFlagCustomer}
            getSpendingBadge={getSpendingBadge}
          />
        </TabsContent>
        
        <TabsContent value="data-tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminDataFix />
          </div>
        </TabsContent>
      </Tabs>
      
      <CustomerDetailsDialog 
        open={customerDetailsOpen}
        onOpenChange={setCustomerDetailsOpen}
        customer={selectedCustomer}
        onFlagCustomer={handleFlagCustomer}
      />
    </>
  );
};

export default AdminGlobalCustomers;
