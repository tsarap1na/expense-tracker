export function toMonthStart(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}

export function getMonthRange(monthStart: string): { start: Date; end: Date } {
    const start = new Date(monthStart);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
}

export function parseMonthParam(month: string): string {
    if (!/^\d{4}-\d{2}$/.test(month)) {
        throw new Error('Month must be in format YYYY-MM');
    }
    return `${month}-01`;
}