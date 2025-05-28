
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cashRecordSchema, CashRecordFormValues } from "./cashRecord/cashRecordSchema";
import MachineSelectField from "./cashRecord/MachineSelectField";
import CashInputFields from "./cashRecord/CashInputFields";
import DatePickerField from "./cashRecord/DatePickerField";
import NotesField from "./cashRecord/NotesField";
import { useMachines } from "./cashRecord/useMachines";
import { getStoreContext } from "@/utils/storeContext";
import { useAuth } from '@/contexts/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type CashRecordFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

const CashRecordForm = ({ onSuccess, onCancel }: CashRecordFormProps) => {
  const [loading, setLoading] = useState(false);
  const { machines, loading: loadingMachines } = useMachines(); // Fixed property name here
  const { currentUser } = useAuth();
  const [storeError, setStoreError] = useState(false);

  const form = useForm<CashRecordFormValues>({
    resolver: zodResolver(cashRecordSchema),
    defaultValues: {
      machineId: "",
      cashIn: "",
      cashOut: "",
      recordDate: new Date(),
      notes: "",
    },
  });

  async function onSubmit(values: CashRecordFormValues) {
    setLoading(true);
    setStoreError(false);
    try {
      // Get the store_id from the user's profile
      const storeId = await getStoreContext();
      
      if (!storeId) {
        setStoreError(true);
        setLoading(false);
        return; // Error already handled in getStoreContext
      }

      const cashIn = values.cashIn ? parseFloat(values.cashIn) : 0;
      const cashOut = values.cashOut ? parseFloat(values.cashOut) : 0;
      const revenue = cashIn - cashOut;
      
      const recordDate = new Date(values.recordDate);
      recordDate.setHours(new Date().getHours());
      recordDate.setMinutes(new Date().getMinutes());
      
      const { error } = await supabase
        .from('machine_history')
        .insert({
          machine_id: values.machineId,
          cash_in: cashIn,
          cash_out: cashOut,
          revenue: revenue,
          recorded_at: recordDate.toISOString(),
          notes: values.notes || null,
          store_id: storeId,
          created_by: currentUser?.id || null
        });
        
      if (error) throw error;
      
      toast.success("Cash record added successfully");
      form.reset({
        machineId: "",
        cashIn: "",
        cashOut: "",
        recordDate: new Date(),
        notes: "",
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error recording cash:', error);
      toast.error("Failed to add cash record");
    } finally {
      setLoading(false);
    }
  }

  if (storeError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Store setup required. Please update your profile with a store name before recording cash.
        </AlertDescription>
        <Button 
          className="mt-4" 
          onClick={() => window.location.href = '/profile'}
        >
          Go to Profile
        </Button>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <MachineSelectField form={form} machines={machines} />
        <CashInputFields form={form} />
        <DatePickerField form={form} />
        <NotesField form={form} />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading || loadingMachines || machines.length === 0}
          >
            {loading ? "Saving..." : "Record Cash"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CashRecordForm;
