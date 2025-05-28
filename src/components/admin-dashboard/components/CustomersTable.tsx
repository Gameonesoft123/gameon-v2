
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Flag, Ban } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  storeVisits: {
    store: string;
    date: string;
    duration: string;
    spent: string;
  }[];
}

interface CustomersTableProps {
  customers: Customer[];
  onViewDetails: (customer: Customer) => void;
  onFlagCustomer: (customer: Customer) => void;
  getSpendingBadge: (level: string) => React.ReactNode;
}

const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  onViewDetails,
  onFlagCustomer,
  getSpendingBadge
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Store Visits</TableHead>
            <TableHead>Total Visits</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead>Spending Level</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                {customer.firstName} {customer.lastName}
              </TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>
                {customer.stores.length > 1 
                  ? `${customer.stores[0]} +${customer.stores.length - 1} more`
                  : customer.stores[0]}
              </TableCell>
              <TableCell>{customer.visitCount}</TableCell>
              <TableCell>{customer.lastVisit}</TableCell>
              <TableCell>{getSpendingBadge(customer.spendingLevel)}</TableCell>
              <TableCell>{customer.totalSpent}</TableCell>
              <TableCell>
                {customer.flagged && (
                  <Badge variant="destructive">Flagged</Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(customer)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    {!customer.flagged ? (
                      <DropdownMenuItem onClick={() => onFlagCustomer(customer)}>
                        <Flag className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-amber-500">Flag Customer</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onFlagCustomer(customer)}>
                        <Flag className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-green-500">Remove Flag</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Ban className="h-4 w-4 mr-2 text-red-500" />
                      <span className="text-red-500">Block Customer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomersTable;
