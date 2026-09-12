import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { transactionSchema } from '../schemas';
import type { TransactionFormValues } from '../schemas';
import type { Category, Transaction } from '../types';
import { Card } from '../components/Card';

const PAGE_SIZE = 10;

export function TransactionsPage() {
    const [filters, setFilters] = useState({ page: 1, type: '', categoryId: '' });
    const [warning, setWarning] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await apiClient.get('/categories')).data,
    });

    const { data } = useQuery({
        queryKey: ['transactions', filters],
        queryFn: async () => (await apiClient.get('/transactions', { params: { ...filters, limit: PAGE_SIZE } })).data,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: { type: 'expense' },
    });

    const createMutation = useMutation({
        mutationFn: (values: TransactionFormValues) => apiClient.post('/transactions', values),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            setWarning(response.data.budgetWarning?.message ?? null);
            reset({ type: 'expense' } as TransactionFormValues);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.delete(`/transactions/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-800">Transactions</h1>

            {warning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
                    {warning}
                </div>
            )}

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
                            step="0.01"
                            placeholder="Amount"
                            {...register('amount', { valueAsNumber: true })}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <select {...register('type')} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        <input
                            type="date"
                            {...register('date')}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex gap-3">
                        <input
                            placeholder="Description"
                            {...register('description')}
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            disabled={isSubmitting}
                            className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                    {(errors.categoryId || errors.amount || errors.date) && (
                        <p className="text-red-500 text-xs">
                            {errors.categoryId?.message ?? errors.amount?.message ?? errors.date?.message}
                        </p>
                    )}
                </form>
            </Card>

            <div className="flex gap-3">
                <select
                    onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value, page: 1 }))}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                >
                    <option value="">All types</option>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
                <select
                    onChange={(event) => setFilters((prev) => ({ ...prev, categoryId: event.target.value, page: 1 }))}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                >
                    <option value="">All categories</option>
                    {categories?.data.map((category: Category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
            </div>

            <Card className="p-0 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-500">
                        <tr>
                            <th className="px-5 py-3 font-medium">Date</th>
                            <th className="px-5 py-3 font-medium">Category</th>
                            <th className="px-5 py-3 font-medium">Description</th>
                            <th className="px-5 py-3 font-medium">Amount</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data?.data.map((transaction: Transaction) => (
                            <tr key={transaction.id}>
                                <td className="px-5 py-3 text-slate-600">{transaction.date.slice(0, 10)}</td>
                                <td className="px-5 py-3 text-slate-600">{transaction.category?.name}</td>
                                <td className="px-5 py-3 text-slate-600">{transaction.description}</td>
                                <td className={`px-5 py-3 font-medium ${transaction.type === 'expense' ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {transaction.type === 'expense' ? '-' : '+'}{transaction.amount}
                                </td>
                                <td className="px-5 py-3">
                                    <button
                                        onClick={() => deleteMutation.mutate(transaction.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <div className="flex gap-3 items-center text-sm">
                <button
                    disabled={filters.page === 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40"
                >
                    Previous
                </button>
                <span className="text-slate-500">Page {filters.page}</span>
                <button
                    disabled={!data || filters.page * PAGE_SIZE >= data.total}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}