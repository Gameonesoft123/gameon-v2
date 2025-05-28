
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { CashRecordFormValues } from "./cashRecordSchema";

type MachineOption = {
  id: string;
  name: string;
};

interface MachineSelectFieldProps {
  form: UseFormReturn<CashRecordFormValues>;
  machines: MachineOption[];
}

const MachineSelectField: React.FC<MachineSelectFieldProps> = ({ form, machines }) => {
  return (
    <FormField
      control={form.control}
      name="machineId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Machine</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {machines.length === 0 ? (
                <SelectItem value="no-machines" disabled>
                  No active machines found
                </SelectItem>
              ) : (
                machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default MachineSelectField;
