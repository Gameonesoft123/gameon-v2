
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CashRecordFormValues } from "./cashRecordSchema";

interface CashInputFieldsProps {
  form: UseFormReturn<CashRecordFormValues>;
}

const CashInputFields: React.FC<CashInputFieldsProps> = ({ form }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="cashIn"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cash In ($)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
            </FormControl>
            <FormDescription>
              Cash inserted at start of shift (leave empty if not applicable)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cashOut"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cash Out ($)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
            </FormControl>
            <FormDescription>
              Cash removed at end of shift (leave empty if not applicable)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default CashInputFields;
