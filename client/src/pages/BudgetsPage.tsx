import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { budgetSchema } from '../schemas';
import type { BudgetFormValues } from '../schemas';
import type { Category } from '../types';
import { Card } from '../components/Card';

export function BudgetsPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const queryClient = useQueryClient();

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await apiClient.get('/categories')).data,
    });

    const { data: summary } = useQuery({
        queryKey: ['budgets-summary', month],
        queryFn: async () => (await apiClient.get('/budgets/summary', { params: { month } })).data,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<BudgetFormValues>({ resolver: zodResolver(budgetSchema) });

    const createMutation = useMutation({
        mutationFn: (values: BudgetFormValues) => apiClient.post('/budgets', values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets-summary'] });
            reset();
        },
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-800">Budgets</h1>

            <Card>
                <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="flex gap-3 items-start">
                    <select
                        {...register('categoryId', { valueAsNumber: true })}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">Category</option>
                        {categories?.data.map((category: Category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>
                    <input
                        placeholder="YYYY-MM"
                        {...register('month')}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-28"
                    />
                    <input
                        type="number"
                        placeholder="Limit"
                        {...register('limitAmount', { valueAsNumber: true })}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                        disabled={isSubmitting}
                        className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        Add
                    </button>
                </form>
                {(errors.categoryId || errors.month || errors.limitAmount) && (
                    <p className="text-red-500 text-xs mt-2">
                        {errors.categoryId?.message ?? errors.month?.message ?? errors.limitAmount?.message}
                    </p>
                )}
            </Card>

            <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />

            <div className="grid gap-4">
                {summary?.map((budget: any) => (
                    <Card key={budget.categoryId}>
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="font-medium text-slate-700">{budget.categoryName}</span>
                            <span className="text-sm text-slate-500">
                                {budget.spent} / {budget.limitAmount}
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${budget.usedPercentage > 100 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min(budget.usedPercentage, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{budget.usedPercentage}% used</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}