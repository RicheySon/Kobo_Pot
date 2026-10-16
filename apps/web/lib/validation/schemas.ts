import { z } from "zod";

export const categories = ["Airtime", "Food", "Transport", "Data", "Shopping", "Other"] as const;

export const potFormSchema = z
  .object({
    goalName: z.string().trim().min(2, "Give the goal a short name.").max(60),
    category: z.enum(categories),
    goalAmount: z.string().trim().min(1, "Enter a goal amount in cedis."),
    rule: z.enum(["fixed", "round_up"]),
    fixedAmount: z.string().trim(),
    interval: z.string().trim(),
    unlockDate: z.string().trim(),
    note: z.string().trim().max(140, "Keep the note under 140 characters."),
  })
  .superRefine((value, context) => {
    if (value.rule === "fixed" && value.fixedAmount.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["fixedAmount"],
        message: "Enter the fixed amount to save after each purchase.",
      });
    }
    if (value.rule === "round_up" && value.interval.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["interval"],
        message: "Enter the round-up interval.",
      });
    }
  });

export type PotFormValues = z.infer<typeof potFormSchema>;

export const purchaseFormSchema = z.object({
  potId: z.string().trim().min(1, "Choose a savings pot."),
  category: z.enum(categories),
  description: z.string().trim().min(2, "Describe the simulated purchase.").max(80),
  amount: z.string().trim().min(1, "Enter the purchase amount in cedis."),
  reference: z
    .string()
    .trim()
    .regex(/^KBP-\d{8}-[0-9a-f-]{36}$/i, "Use a KoboPot sandbox reference."),
  purchasedOn: z.string().trim().min(1, "Choose the purchase date."),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const withdrawFormSchema = z.object({
  potId: z.string().trim().min(1, "Choose a savings pot."),
  amount: z.string().trim().min(1, "Enter the DUSD amount to withdraw."),
});

export type WithdrawFormValues = z.infer<typeof withdrawFormSchema>;
