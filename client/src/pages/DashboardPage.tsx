import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../api/client';
import { Card } from '../components/Card';

export function DashboardPage() {
    const { data: summary } = useQuery({
        queryKey: ['summary'],
        queryFn: async () => (await apiClient.get('/summary')).data,
    });

    const { data: monthly } = useQuery({
        queryKey: ['stats', 'monthly'],
        queryFn: async () => (await apiClient.get('/stats/monthly?months=6')).data,
    });

    const { data: topCategories } = useQuery({
        queryKey: ['stats', 'top-categories'],
        queryFn: async () => (await apiClient.get('/stats/top-categories')).data,
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>

            <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Income" value={summary?.income} accent="text-emerald-600" />
                <SummaryCard label="Expense" value={summary?.expense} accent="text-red-500" />
                <SummaryCard label="Balance" value={summary?.balance} accent="text-indigo-600" />
            </div>

            <Card>
                <h3 className="font-medium text-slate-700 mb-3">Last 6 months</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthly}>
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <h3 className="font-medium text-slate-700 mb-3">Top expense categories</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topCategories}>
                        <XAxis dataKey="categoryName" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}

function SummaryCard({ label, value, accent }: { label: string; value?: number; accent: string }) {
    return (
        <Card>
            <p className="text-slate-500 text-sm">{label}</p>
            <p className={`text-2xl font-semibold mt-1 ${accent}`}>{value ?? '—'}</p>
        </Card>
    );
}