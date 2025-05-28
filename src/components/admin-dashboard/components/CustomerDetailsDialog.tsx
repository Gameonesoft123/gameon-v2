
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomerVisit {
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
  storeVisits: CustomerVisit[];
}

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onFlagCustomer: (customer: Customer) => void;
}

const CustomerDetailsDialog: React.FC<CustomerDetailsDialogProps> = ({
  open,
  onOpenChange,
  customer,
  onFlagCustomer
}) => {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Global Customer Profile</DialogTitle>
          <DialogDescription>
            Cross-store activity and spending patterns
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {customer.flagged ? (
                      <Badge variant="destructive">Flagged</Badge>
                    ) : (
                      <Badge className="bg-green-500">Good Standing</Badge>
                    )}
                  </p>
                </div>
                {customer.flagged && (
                  <div>
                    <p className="text-sm text-muted-foreground">Flag Reason</p>
                    <p className="font-medium text-red-500">{customer.flagReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Cross-Store Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Stores Visited</p>
                    <p className="text-xl font-bold">{customer.stores.length}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Visits</p>
                    <p className="text-xl font-bold">{customer.visitCount}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-xl font-bold">{customer.totalSpent}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Last Visit</p>
                    <p className="text-xl font-bold">{customer.lastVisit}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Store Visit History</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Amount Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.storeVisits.map((visit, index) => (
                        <TableRow key={index}>
                          <TableCell>{visit.store}</TableCell>
                          <TableCell>{visit.date}</TableCell>
                          <TableCell>{visit.duration}</TableCell>
                          <TableCell>{visit.spent}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!customer.flagged ? (
              <Button variant="destructive" onClick={() => onFlagCustomer(customer)}>
                <Flag className="h-4 w-4 mr-2" />
                Flag Customer
              </Button>
            ) : (
              <Button variant="outline" className="text-green-600" onClick={() => onFlagCustomer(customer)}>
                <Flag className="h-4 w-4 mr-2" />
                Remove Flag
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsDialog;
