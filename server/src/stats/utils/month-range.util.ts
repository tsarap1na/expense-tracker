import { toMonthStart } from '@budgets/utils/month.util';

export function getLastNMonths(count: number, from: Date = new Date()): string[] {
    const months: string[] = [];
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);

    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(cursor);
        d.setMonth(d.getMonth() - i);
        months.push(toMonthStart(d).slice(0, 7));
    }

    return months;
}