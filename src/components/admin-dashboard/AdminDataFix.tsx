
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, customTable } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { fixExistingCustomers } from '@/integrations/supabase/fixExistingCustomers';

// Define a generic type for data with an id
interface DataWithId {
  id: string;
  [key: string]: any;
}

// Type guard function to check if an item is a valid data object with an ID
function isValidDataWithId(item: any): item is DataWithId {
  return item !== null && 
    typeof item === 'object' && 
    item !== undefined &&
    'id' in item && 
    typeof item.id === 'string';
}

const AdminDataFix = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const fixCustomersData = async () => {
    setLoading(true);
    setResults([]);
    try {
      // Get all stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id');
      
      if (storesError) throw storesError;
      if (!stores || stores.length === 0) {
        toast.error("No stores found to assign data to");
        return;
      }
      
      // Get the first store as a default (for orphaned data)
      const defaultStoreId = stores[0].id;
      
      // Array of tables to fix
      const tablesToFix = [
        'customers',
        'match_transactions',
        'machines',
        'finances',
        'staff',
        'backup_ids',
        'customer_check_ins',
        'notifications'
      ];
      
      // Fix each table
      for (const tableName of tablesToFix) {
        // Use the customTable helper function for dynamic table names
        const { data: orphanedData, error: fetchError } = await customTable(tableName)
          .select('id')
          .is('store_id', null);
        
        if (fetchError) {
          setResults(prev => [...prev, `Error fetching orphaned data from ${tableName}: ${fetchError.message}`]);
          continue;
        }
        
        if (!orphanedData || orphanedData.length === 0) {
          setResults(prev => [...prev, `No orphaned data found in ${tableName}`]);
          continue;
        }
        
        try {
          // Cast the data as unknown first to handle potential type mismatches
          const dataArray = orphanedData as unknown[];
          
          // Filter to ensure we only have valid objects with id property
          const validItems = dataArray.filter(isValidDataWithId);
          
          if (validItems.length === 0) {
            setResults(prev => [...prev, `No valid items found with IDs in ${tableName}`]);
            continue;
          }
          
          // Now, validItems is an array of DataWithId objects, and we can safely map over it
          const orphanedIds = validItems.map(item => item.id);
          
          // Use the customTable helper function for dynamic table names
          const { error: updateError } = await customTable(tableName)
            .update({ store_id: defaultStoreId })
            .in('id', orphanedIds);
            
          if (updateError) {
            setResults(prev => [...prev, `Error fixing ${tableName}: ${updateError.message}`]);
          } else {
            setResults(prev => [...prev, `✅ Fixed ${orphanedIds.length} items in ${tableName}`]);
          }
        } catch (processError: any) {
          console.error(`Error processing ${tableName} data:`, processError);
          setResults(prev => [...prev, `Error processing ${tableName}: ${processError.message || 'Unknown error'}`]);
        }
      }
      
      // Also run the fix for existing customers function
      const customerFixResult = await fixExistingCustomers();
      setResults(prev => [...prev, customerFixResult.message]);
      
      toast.success("Data fix operation completed");
      
    } catch (error: any) {
      console.error('Error fixing data:', error);
      toast.error("Failed to fix data");
      setResults(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Store Assignment Fix</CardTitle>
        <CardDescription>
          Assign orphaned data (records with no store_id) to the first available store
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results.length > 0 && (
          <div className="bg-muted p-4 rounded-md mb-4 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium mb-2">Results:</h4>
            <ul className="space-y-1 text-sm">
              {results.map((result, index) => (
                <li key={index} className="flex items-start gap-2">
                  {result.startsWith('✅') ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  )}
                  <span>{result}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          This utility will find any data records that don't have a store_id assigned and 
          fix them by assigning them to a default store. This ensures proper data isolation.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={fixCustomersData} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Fixing Data...
            </>
          ) : (
            'Fix Data Store Assignment'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminDataFix;
