import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MoreHorizontal, Eye, UserCheck, Ban, AlertTriangle } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface Store {
  id: string;
  name: string;
  status?: string;
  plan?: string;
  owner?: string;
  email?: string;
  customerCount?: number;
  machineCount?: number;
  lastActive?: string;
  revenue?: string;
  subscriptionEnds?: string;
  created_at: string;
}

// Define a simple type for the data returned from Supabase
interface RawStoreData {
  id?: string | null;
  name?: string | null;
  created_at?: string | null;
  [key: string]: any; // Allow other properties
}

const PAGE_SIZE_OPTIONS = [10, 20, 50,100];

const AdminStores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [impersonateDialog, setImpersonateDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [planOptions, setPlanOptions] = useState<{ id: string; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Default page size

  // Fetch subscription plans for plan filter dropdown
  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name');
      if (!error && Array.isArray(data)) {
        setPlanOptions(data);
      }
    };
    fetchPlans();
  }, []);

  const { impersonateStore } = useAuth();
  
  const { data: stores = [], isLoading, refetch } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data: storesData, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');
      
      if (error) {
        toast.error('Failed to load stores');
        throw error;
      }
      
      if (!storesData || !Array.isArray(storesData)) {
        return [];
      }
      
      const enhancedStores: Store[] = [];
      
      for (const storeItem of storesData) {
        // Use a simple type for raw store data
        const store = storeItem as RawStoreData;
        
        // Skip if we don't have a valid store ID
        if (!store || !store.id) {
          continue;
        }
        
        const storeId = String(store.id);
        
        try {
          // Count customers for this store
          const { count: customerCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId);
          
          // Count machines for this store
          const { count: machineCount } = await supabase
            .from('machines')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId);
          
          // Get last active info
          const { data: lastActiveData } = await supabase
            .from('notifications')
            .select('created_at')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })
            .limit(1);
          
          // Calculate revenue
          const { data: revenueData } = await supabase
            .from('machine_history')
            .select('cash_in')
            .eq('store_id', storeId);
          
          const revenue = revenueData?.reduce((sum, record) => 
            sum + (typeof record.cash_in === 'number' ? record.cash_in : 0), 0) || 0;
          
          // Get owner info
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('store_id', storeId)
            .eq('role', 'owner')
            .limit(1);
          
          let ownerEmail = '';
          let ownerName = 'Unknown';
          
          if (ownerData && Array.isArray(ownerData) && ownerData.length > 0) {
            ownerEmail = 'owner@example.com';
            ownerName = 'Store Owner';
          }
          
          enhancedStores.push({
            id: storeId,
            name: store.name ? String(store.name) : 'Unknown Store',
            status: 'active',
            plan: 'premium',
            owner: ownerName,
            email: ownerEmail,
            customerCount: customerCount || 0,
            machineCount: machineCount || 0,
            lastActive: lastActiveData && Array.isArray(lastActiveData) && lastActiveData.length > 0 
              ? new Date(lastActiveData[0].created_at).toLocaleString() 
              : 'Never',
            revenue: `$${revenue.toFixed(2)}`,
            subscriptionEnds: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
            created_at: store.created_at ? String(store.created_at) : new Date().toISOString(),
          });
        } catch (error) {
          console.error("Error enhancing store data:", error);
          // Create a fallback store object with minimal info when there's an error
          enhancedStores.push({
            id: storeId,
            name: store.name ? String(store.name) : 'Unknown Store',
            status: 'unknown',
            plan: 'unknown',
            customerCount: 0,
            machineCount: 0,
            lastActive: 'Unknown',
            revenue: '$0.00',
            created_at: store.created_at ? String(store.created_at) : new Date().toISOString(),
          });
        }
      }
      
      return enhancedStores;
    },
    refetchInterval: 30000
  });
  
  const filteredStores = stores.filter(store => 
    (store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (store.owner && store.owner.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (statusFilter === 'all' || store.status === statusFilter) &&
    (planFilter === 'all' || store.plan === planFilter)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStores.length / pageSize);
  const paginatedStores = filteredStores.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    // Reset to first page if filters/search change and current page is out of range
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line
  }, [filteredStores.length]);
  
  const handleImpersonate = (store: Store) => {
    setSelectedStore(store);
    setImpersonateDialog(true);
  };
  
  const confirmImpersonation = async () => {
    if (!selectedStore) return;
    
    if (impersonateStore) {
      const result = await impersonateStore(selectedStore.id);
      
      if (result.success) {
        setImpersonateDialog(false);
      } else {
        toast.error(result.error || 'Failed to impersonate store');
      }
    } else {
      toast.error('Store impersonation not available');
    }
  };
  
  const handleStatusChange = async (store: Store, newStatus: string) => {
    try {
      toast.success(`Changed status of ${store.name} to ${newStatus}`);
      refetch();
    } catch (error: any) {
      toast.error(`Failed to update store status: ${error.message}`);
    }
  };
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'trial':
        return <Badge variant="outline" className="border-amber-500 text-amber-700">Trial</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };
  
  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'premium':
        return <Badge className="bg-violet-500">Premium</Badge>;
      case 'basic':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Basic</Badge>;
      default:
        return <Badge variant="secondary">{plan || 'Unknown'}</Badge>;
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center py-12">Loading stores...</div>;
  }
  
  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stores by name or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Status</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Plan</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {planOptions.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{getStatusBadge(store.status)}</TableCell>
                  <TableCell>{getPlanBadge(store.plan)}</TableCell>
                  <TableCell>{store.owner || 'Unknown'}</TableCell>
                  <TableCell>{store.customerCount}</TableCell>
                  <TableCell>{store.revenue}</TableCell>
                  <TableCell>{store.lastActive}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleImpersonate(store)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {store.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleStatusChange(store, 'suspended')}>
                            <Ban className="h-4 w-4 mr-2 text-red-500" />
                            <span className="text-red-500">Suspend</span>
                          </DropdownMenuItem>
                        ) : store.status === 'suspended' ? (
                          <DropdownMenuItem onClick={() => handleStatusChange(store, 'active')}>
                            <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-green-500">Activate</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleStatusChange(store, 'active')}>
                            <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-green-500">Convert to Active</span>
                          </DropdownMenuItem>
                        )}
                        
                        {store.status !== 'suspended' && (
                          <DropdownMenuItem>
                            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                            <span className="text-amber-500">Send Warning</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedStores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No stores found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Pagination controls */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when page size changes
                }}
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Dialog open={impersonateDialog} onOpenChange={setImpersonateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate Store</DialogTitle>
            <DialogDescription>
              You are about to log in as the owner of this store. This action will be logged.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStore && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Store:</span>
                  <span>{selectedStore.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Owner:</span>
                  <span>{selectedStore.owner || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Email:</span>
                  <span>{selectedStore.email || 'Unknown'}</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setImpersonateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmImpersonation}>
              <UserCheck className="mr-2 h-4 w-4" />
              Impersonate Store
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminStores;
