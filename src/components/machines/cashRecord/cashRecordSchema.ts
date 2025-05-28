
import * as z from "zod";

export const cashRecordSchema = z.object({
  machineId: z.string({
    required_error: "Please select a machine",
  }),
  cashIn: z.string().refine(
    (val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: "Cash in must be a positive number or empty" }
  ).optional().or(z.literal("")),
  cashOut: z.string().refine(
    (val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0),
    { message: "Cash out must be a positive number or empty" }
  ).optional().or(z.literal("")),
  recordDate: z.date({
    required_error: "Please select a date",
  }),
  notes: z.string().optional(),
}).refine((data) => {
  // Ensure at least one of Cash In or Cash Out is provided
  return data.cashIn !== "" || data.cashOut !== "";
}, {
  message: "At least one of Cash In or Cash Out must be provided",
  path: ["cashIn"],
});

export type CashRecordFormValues = z.infer<typeof cashRecordSchema>;
