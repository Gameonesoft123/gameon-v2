
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DollarSign } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import MatchDialog from '@/components/match/MatchDialog';
import MatchTransactionsList from '@/components/match/MatchTransactionsList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import MatchStatistics from '@/components/match/MatchStatistics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchTransaction } from '@/types/match';
import { toast } from "sonner";

const Match: React.FC = () => {
  const [stats, setStats] = useState({
    totalCash: 0,
    totalMatched: 0,
    totalCredits: 0,
    activeMatches: 0
  });

  const fetchStatistics = async () => {
    try {
      // Use type assertion to allow accessing match_transactions table
      const { data, error } = await (supabase as any)
        .from('match_transactions')
        .select('initial_amount, matched_amount, total_credits, status');
      
      if (error) throw error;

      if (data) {
        const processData = data as Array<{
          initial_amount: number | string;
          matched_amount: number | string;
          total_credits: number | string;
          status: string;
        }>;
        
        const totalCash = processData.reduce((sum, item) => {
          const amount = typeof item.initial_amount === 'number' ? item.initial_amount : 
            parseFloat(item.initial_amount as string) || 0;
          return sum + amount;
        }, 0);
        
        const totalMatched = processData.reduce((sum, item) => {
          const amount = typeof item.matched_amount === 'number' ? item.matched_amount : 
            parseFloat(item.matched_amount as string) || 0;
          return sum + amount;
        }, 0);
        
        const totalCredits = processData.reduce((sum, item) => {
          const amount = typeof item.total_credits === 'number' ? item.total_credits : 
            parseFloat(item.total_credits as string) || 0;
          return sum + amount;
        }, 0);
        
        const activeMatches = processData.filter(item => item.status === 'active').length;

        setStats({
          totalCash,
          totalMatched,
          totalCredits,
          activeMatches
        });
      }
    } catch (error) {
      console.error('Error fetching match statistics:', error);
      toast.error('Failed to load match statistics');
    }
  };

  useEffect(() => {
    fetchStatistics();
    
    // Set up real-time subscription to match_transactions table
    const channel = supabase
      .channel('match_transactions_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'match_transactions' 
        },
        () => {
          console.log('Match transactions updated, refreshing statistics');
          fetchStatistics();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <PageLayout title="Match Credits">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">Create and manage match credit transactions for customers</p>
          </div>
          <MatchDialog onMatchAdded={fetchStatistics} />
        </div>
        
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertTitle>Match Credit Management</AlertTitle>
          <AlertDescription>
            This page allows you to create and manage match credit transactions. Customers receive additional 
            playable credits equal to their cash deposit, encouraging higher initial deposits and extended play.
            Each customer can receive one match credit per day.
          </AlertDescription>
        </Alert>

        <MatchStatistics stats={stats} />

        <Tabs defaultValue="active" className="bg-card rounded-lg border border-border p-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
            <TabsTrigger value="voided">Voided/Expired</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <MatchTransactionsList status="active" onStatusChange={fetchStatistics} />
          </TabsContent>
          
          <TabsContent value="redeemed">
            <MatchTransactionsList status="redeemed" onStatusChange={fetchStatistics} />
          </TabsContent>
          
          <TabsContent value="voided">
            <MatchTransactionsList 
              statusList={['voided', 'expired']} 
              onStatusChange={fetchStatistics} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Match;
