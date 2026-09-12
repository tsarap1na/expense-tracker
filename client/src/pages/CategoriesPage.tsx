import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { categorySchema } from '../schemas';
import type { CategoryFormValues } from '../schemas';
import type { Category } from '../types';
import { Card } from '../components/Card';

export function CategoriesPage() {
    const queryClient = useQueryClient();

    const { data } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await apiClient.get('/categories')).data,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: { color: '#6366f1' },
    });

    const createMutation = useMutation({
        mutationFn: (values: CategoryFormValues) => apiClient.post('/categories', values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            reset({ name: '', color: '#6366f1' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.delete(`/categories/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-800">Categories</h1>

            <Card>
                <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="flex gap-3 items-start">
                    <div className="flex-1">
                        <input
                            placeholder="Category name"
                            {...register('name')}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <input type="color" {...register('color')} className="w-11 h-10 rounded-lg border border-slate-300 cursor-pointer" />
                    <button
                        disabled={isSubmitting}
                        className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        Add
                    </button>
                </form>
            </Card>

            <Card className="p-0 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                    {data?.data.map((category: Category) => (
                        <li key={category.id} className="flex items-center justify-between px-5 py-3">
                            <span className="flex items-center gap-3 text-sm text-slate-700">
                                <span
                                    className="w-3 h-3 rounded-full inline-block"
                                    style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                            </span>
                            <button
                                onClick={() => deleteMutation.mutate(category.id)}
                                className="text-slate-400 hover:text-red-500 text-sm transition-colors"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}