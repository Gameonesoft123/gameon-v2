import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getStoreContext } from "@/utils/storeContext";

const formSchema = z.object({
  machineName: z.string().min(2, {
    message: "Machine name must be at least 2 characters.",
  }),
  machineType: z.string().min(2, {
    message: "Machine type is required.",
  }),
  location: z.string().min(2, {
    message: "Location is required.",
  }),
  status: z.string(),
});

type MachineFormProps = {
  machineData?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function MachineForm({ machineData, isEdit = false, onSuccess, onCancel }: MachineFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineName: "",
      machineType: "",
      location: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (isEdit && machineData) {
      form.reset({
        machineName: machineData.name || "",
        machineType: machineData.description || "",
        location: machineData.location || "",
        status: machineData.status || "active",
      });
    }
  }, [machineData, isEdit, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const storeId = await getStoreContext();
      
      if (!storeId) {
        return; // Error already handled in getStoreContext
      }

      if (isEdit && machineData) {
        const { error } = await supabase
          .from('machines')
          .update({
            name: values.machineName,
            description: values.machineType,
            location: values.location,
            status: values.status,
            updated_at: new Date().toISOString(),
            store_id: storeId
          })
          .eq('id', machineData.id);
          
        if (error) throw error;
        
        toast.success("Machine updated successfully");
      } else {
        const { error } = await supabase
          .from('machines')
          .insert({
            name: values.machineName,
            description: values.machineType,
            location: values.location,
            status: values.status,
            store_id: storeId
          });
          
        if (error) throw error;
        
        toast.success("Machine added successfully");
        form.reset();
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error processing machine:', error);
      toast.error(isEdit ? "Failed to update machine" : "Failed to add machine");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="machineName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Machine Name</FormLabel>
              <FormControl>
                <Input placeholder="Arcade Classic #1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="machineType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Machine Type</FormLabel>
              <FormControl>
                <Input placeholder="Arcade, Slot, Poker, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="North Wall, Section B, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Current operational status of the machine.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">{isEdit ? "Update Machine" : "Save Machine"}</Button>
        </div>
      </form>
    </Form>
  );
}

export default MachineForm;
