
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export type MachineOption = {
  id: string;
  name: string;
};

export const useMachines = () => {
  const [machines, setMachines] = useState<MachineOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const { data, error } = await supabase
          .from('machines')
          .select('id, name')
          .eq('status', 'active');
          
        if (error) throw error;
        
        if (data) {
          setMachines(data as MachineOption[]);
        }
      } catch (error) {
        console.error('Error fetching machines:', error);
        toast.error('Failed to load machines');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMachines();
  }, []);

  return { machines, loading };
};
