
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminStores = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          machines:machines(count),
          customers:customers(count),
          revenue:machine_history(sum(cash_in))
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });

  // Check if a value is a number (not an error object)
  const isNumber = (value: any): value is number => {
    return typeof value === 'number' || (typeof value === 'object' && value !== null && !('code' in value));
  };

  // Safe method to format revenue with toFixed
  const formatRevenue = (value: any): string => {
    if (value === null || value === undefined) return '0.00';
    
    // For revenue from the sum aggregate, check if it's the first item in the array
    if (Array.isArray(value) && value.length > 0) {
      const sumValue = value[0]?.sum;
      return isNumber(sumValue) ? Number(sumValue).toFixed(2) : '0.00';
    }
    
    return isNumber(value) ? Number(value).toFixed(2) : '0.00';
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load stores data</AlertDescription>
        </Alert>
      )}
      
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button>Add Store</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Machines</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading stores data...</TableCell>
              </TableRow>
            ) : filteredStores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">No stores found</TableCell>
              </TableRow>
            ) : (
              filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell>{store.machines?.[0]?.count || 0}</TableCell>
                  <TableCell>{store.customers?.[0]?.count || 0}</TableCell>
                  <TableCell>${formatRevenue(store.revenue)}</TableCell>
                  <TableCell>{new Date(store.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminStores;
