import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { recurringSchema } from '../schemas';
import type { RecurringFormValues } from '../schemas';
import type { Category, Recurring } from '../types';
import { Card } from '../components/Card';

export function RecurringPage() {
    const queryClient = useQueryClient();

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await apiClient.get('/categories')).data,
    });

    const { data } = useQuery({
        queryKey: ['recurring'],
        queryFn: async () => (await apiClient.get('/recurring')).data,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<RecurringFormValues>({
        resolver: zodResolver(recurringSchema),
        defaultValues: { type: 'expense', frequency: 'month' },
    });

    const createMutation = useMutation({
        mutationFn: (values: RecurringFormValues) => apiClient.post('/recurring', values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            reset({ type: 'expense', frequency: 'month' } as RecurringFormValues);
        },
    });

    const generateMutation = useMutation({
        mutationFn: () => apiClient.post('/recurring/generate'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['budgets-summary'] });
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-slate-800">Recurring payments</h1>
                <button
                    onClick={() => generateMutation.mutate()}
                    className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                    Generate now
                </button>
            </div>

            <Card>
                <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
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
                            type="number"
                            placeholder="Amount"
                            {...register('amount', { valueAsNumber: true })}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <select {...register('type')} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        <select {...register('frequency')} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                            <option value="day">Every day</option>
                            <option value="week">Every week</option>
                            <option value="month">Every month</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <input
                            type="date"
                            {...register('nextRunAt')}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            disabled={isSubmitting}
                            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            Add template
                        </button>
                    </div>
                    {(errors.categoryId || errors.amount || errors.nextRunAt) && (
                        <p className="text-red-500 text-xs">
                            {errors.categoryId?.message ?? errors.amount?.message ?? errors.nextRunAt?.message}
                        </p>
                    )}
                </form>
            </Card>

            <Card className="p-0 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                    {data?.data.map((recurring: Recurring) => (
                        <li key={recurring.id} className="flex justify-between items-center px-5 py-3 text-sm">
                            <span className="text-slate-700">
                                {recurring.category?.name} — {recurring.amount} ({recurring.frequency})
                            </span>
                            <span className="text-slate-400">Next run: {recurring.nextRunAt.slice(0, 10)}</span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}