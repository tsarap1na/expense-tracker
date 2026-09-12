import { z } from 'zod';

export const authSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'At least 6 characters'),
});
export type AuthFormValues = z.infer<typeof authSchema>;

export const categorySchema = z.object({
    name: z.string().min(2, 'At least 2 characters'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format #RRGGBB'),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const transactionSchema = z.object({
    categoryId: z.number({ error: 'Select a category' }).min(1, 'Select a category'),
    amount: z.number({ error: 'Enter an amount' }).positive('Amount must be greater than zero'),
    type: z.enum(['expense', 'income']),
    description: z.string().optional(),
    date: z.string().min(1, 'Select a date'),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
    categoryId: z.number({ error: 'Select a category' }).min(1, 'Select a category'),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Format YYYY-MM'),
    limitAmount: z.number({ error: 'Enter a limit' }).positive('Limit must be greater than zero'),
});
export type BudgetFormValues = z.infer<typeof budgetSchema>;

export const recurringSchema = z.object({
    categoryId: z.number({ error: 'Select a category' }).min(1, 'Select a category'),
    amount: z.number({ error: 'Enter an amount' }).positive('Amount must be greater than zero'),
    type: z.enum(['expense', 'income']),
    description: z.string().optional(),
    frequency: z.enum(['day', 'week', 'month']),
    nextRunAt: z.string().min(1, 'Select a start date'),
});
export type RecurringFormValues = z.infer<typeof recurringSchema>;