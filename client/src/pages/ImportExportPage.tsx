import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Card } from '../components/Card';

export function ImportExportPage() {
    const [format, setFormat] = useState<'json' | 'csv'>('csv');
    const [report, setReport] = useState<{ imported: number; skipped: number; errors: { row: number; reason: string }[] } | null>(null);

    const importMutation = useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return apiClient.post('/transactions/import', formData);
        },
        onSuccess: (response) => setReport(response.data),
    });

    const handleExport = async () => {
        const response = await apiClient.get(`/transactions/export?format=${format}`, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions.${format}`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-800">Import / Export</h1>

            <Card>
                <h3 className="font-medium text-slate-700 mb-3">Export</h3>
                <div className="flex gap-3 items-center">
                    <select
                        value={format}
                        onChange={(event) => setFormat(event.target.value as 'json' | 'csv')}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Download
                    </button>
                </div>
            </Card>

            <Card>
                <h3 className="font-medium text-slate-700 mb-3">Import</h3>
                <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(event) => event.target.files?.[0] && importMutation.mutate(event.target.files[0])}
                    className="text-sm"
                />
                {report && (
                    <div className="text-sm bg-slate-50 rounded-lg p-3 mt-3">
                        <p className="text-slate-700">
                            Imported: {report.imported}, skipped: {report.skipped}
                        </p>
                        {report.errors.map((error, index) => (
                            <p key={index} className="text-red-500 mt-1">
                                Row {error.row}: {error.reason}
                            </p>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}