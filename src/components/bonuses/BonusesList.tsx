
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, addDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type Bonus = {
  id: string;
  customer_id: string;
  customer_name: string;
  bonus_name: string;
  bonus_type: string;
  bonus_amount: string;
  expiration_days: number;
  description: string;
  created_at: string;
  status: 'active' | 'expired' | 'redeemed';
};

const BonusesList = () => {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Format bonus type for display
  const formatBonusType = (type: string) => {
    const types: Record<string, string> = {
      'cash': 'Cash Credit',
      'free_play': 'Free Play',
      'points': 'Loyalty Points',
      'discount': 'Discount',
      'gift': 'Gift Item'
    };
    return types[type] || type;
  };

  // Return appropriate badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-500";
      case 'expired': return "bg-gray-500";
      case 'redeemed': return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };
  
  useEffect(() => {
    const fetchBonuses = async () => {
      setLoading(true);
      try {
        // For demo purposes, we're simulating the data
        // In a real app, this would be a query to the Supabase database
        
        // Mock data for demo
        const mockData = [
          {
            id: "1",
            customer_id: "5f06a527-1b29-4c55-abb8-88c38519835a",
            customer_name: "doe 1, john",
            bonus_name: "Welcome Bonus",
            bonus_type: "cash",
            bonus_amount: "50",
            expiration_days: 30,
            description: "New customer welcome bonus",
            created_at: "2025-03-15T14:30:00Z",
            status: "active" as const,
          },
          {
            id: "2",
            customer_id: "e67d10b2-62e1-41e3-bde7-44355937e582",
            customer_name: "sfd, das",
            bonus_name: "Birthday Special",
            bonus_type: "free_play",
            bonus_amount: "25",
            expiration_days: 7,
            description: "Birthday month special bonus",
            created_at: "2025-03-10T10:15:00Z",
            status: "expired" as const,
          },
          {
            id: "3",
            customer_id: "5f06a527-1b29-4c55-abb8-88c38519835a",
            customer_name: "doe 1, john",
            bonus_name: "Loyalty Reward",
            bonus_type: "points",
            bonus_amount: "100",
            expiration_days: 60,
            description: "Quarterly loyalty program reward",
            created_at: "2025-03-20T09:45:00Z",
            status: "active" as const,
          },
          {
            id: "4",
            customer_id: "e67d10b2-62e1-41e3-bde7-44355937e582",
            customer_name: "sfd, das",
            bonus_name: "Special Promo",
            bonus_type: "discount",
            bonus_amount: "15",
            expiration_days: 14,
            description: "Weekend promotional discount",
            created_at: "2025-03-18T16:20:00Z",
            status: "redeemed" as const,
          }
        ];
        
        // Add the log from the console to the mock data if it exists
        const consoleLogData = sessionStorage.getItem('lastCreatedBonus');
        if (consoleLogData) {
          try {
            const parsedData = JSON.parse(consoleLogData);
            const customer = parsedData.customerId === "5f06a527-1b29-4c55-abb8-88c38519835a" ? 
              "doe 1, john" : "sfd, das";
              
            mockData.unshift({
              id: `demo-${Date.now()}`,
              customer_id: parsedData.customerId,
              customer_name: customer,
              bonus_name: parsedData.bonusName,
              bonus_type: parsedData.bonusType,
              bonus_amount: parsedData.bonusAmount,
              expiration_days: parseInt(parsedData.expirationDays),
              description: parsedData.description,
              created_at: new Date().toISOString(),
              status: "active" as const,
            });
          } catch (e) {
            console.error("Failed to parse last created bonus:", e);
          }
        }
        
        setBonuses(mockData);
      } catch (error) {
        console.error('Error fetching bonuses:', error);
        toast({
          variant: "destructive",
          title: "Error fetching bonuses",
          description: "Please try again later or contact support."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBonuses();
  }, [toast]);
  
  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Loading bonuses...</div>;
  }
  
  if (bonuses.length === 0) {
    return <div className="py-4 text-center text-muted-foreground">No bonuses found. Create your first bonus to get started.</div>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableCaption>List of customer bonuses</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Bonus Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bonuses.map((bonus) => {
            // Calculate expiration date
            const createdDate = new Date(bonus.created_at);
            const expiresDate = addDays(createdDate, bonus.expiration_days);
            
            return (
              <TableRow key={bonus.id}>
                <TableCell>{bonus.customer_name}</TableCell>
                <TableCell className="font-medium">{bonus.bonus_name}</TableCell>
                <TableCell>{formatBonusType(bonus.bonus_type)}</TableCell>
                <TableCell className="text-right">
                  {bonus.bonus_type === "discount" ? `${bonus.bonus_amount}%` : `$${bonus.bonus_amount}`}
                </TableCell>
                <TableCell>{format(expiresDate, "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(bonus.status)}>
                    {bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default BonusesList;
