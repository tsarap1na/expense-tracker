import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { authSchema } from '../schemas';
import type { AuthFormValues } from '../schemas';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<AuthFormValues>({ resolver: zodResolver(authSchema) });

    const onSubmit = async (values: AuthFormValues) => {
        setError(null);
        try {
            const { data } = await apiClient.post(`/auth/${mode}`, values);
            login(data.accessToken);
            navigate('/');
        } catch {
            setError(mode === 'login' ? 'Invalid email or password' : 'Registration failed (email may be taken)');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm space-y-4"
            >
                <div className="text-center mb-2">
                    <h1 className="text-xl font-semibold text-slate-800">Expense Tracker</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                </div>

                <div>
                    <input
                        placeholder="Email"
                        {...register('email')}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        {...register('password')}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {mode === 'login' ? 'Sign in' : 'Register'}
                </button>

                <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="w-full text-sm text-indigo-500 hover:underline"
                >
                    {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
                </button>
            </form>
        </div>
    );
}