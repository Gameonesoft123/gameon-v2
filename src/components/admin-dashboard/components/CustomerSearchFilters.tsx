
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, DownloadIcon, FilterIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface CustomerSearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  storeFilter: string;
  setStoreFilter: (filter: string) => void;
  spendingFilter: string;
  setSpendingFilter: (filter: string) => void;
  stores: { id: string; name: string }[];
  onExportData: () => void;
  totalResults?: number;
  isLoading?: boolean;
}

const CustomerSearchFilters: React.FC<CustomerSearchFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  storeFilter,
  setStoreFilter,
  spendingFilter,
  setSpendingFilter,
  stores,
  onExportData,
  totalResults = 0,
  isLoading = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                <span>Store Location</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={spendingFilter} onValueChange={setSpendingFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                <span>Spending Level</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="high">High Spenders</SelectItem>
              <SelectItem value="medium">Medium Spenders</SelectItem>
              <SelectItem value="low">Low Spenders</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={onExportData} disabled={isLoading || totalResults === 0}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DownloadIcon className="h-4 w-4 mr-2" />}
            Export Data
          </Button>
        </div>
      </div>
      
      {!isLoading && totalResults > 0 && (
        <div className="text-sm text-muted-foreground">
          <Badge variant="secondary" className="mr-2">{totalResults}</Badge> 
          customers found {storeFilter !== 'all' && stores.find(s => s.id === storeFilter) ? 
            `at ${stores.find(s => s.id === storeFilter)?.name}` : ''}
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading customer data...</span>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchFilters;
