
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogIn, LogOut } from 'lucide-react';

const RecentGlobalActivity = () => {
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['recent-global-checkins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_check_ins')
        .select(`
          *,
          customers (first_name, last_name),
          stores (name)
        `)
        .order('check_in_time', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    
    return 'just now';
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-200">Recent Check-ins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4 text-slate-400">Loading recent activity...</div>
          ) : checkIns.length === 0 ? (
            <div className="text-center py-4 text-slate-400">No recent check-ins found</div>
          ) : (
            checkIns.map((record: any) => (
              <div key={record.id} className="flex items-center space-x-4 border-b border-slate-700/50 pb-4">
                <div className="rounded-full bg-slate-700 p-2">
                  {record.check_out_time ? (
                    <LogOut className="h-4 w-4 text-amber-400" />
                  ) : (
                    <LogIn className="h-4 w-4 text-green-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">
                    {record.customers?.first_name} {record.customers?.last_name} 
                    {record.check_out_time ? ' checked out from ' : ' checked in at '}
                    <span className="font-medium">{record.stores?.name}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTimeAgo(record.check_out_time || record.check_in_time)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentGlobalActivity;
