export const CACHE_MANAGER = 'CACHE_MANAGER';
export const CACHE_TTL_MS = 15_000;

export function budgetSummaryCacheKey(userId: number, monthStart: string): string {
    return `budgets:summary:${userId}:${monthStart}`;
}
