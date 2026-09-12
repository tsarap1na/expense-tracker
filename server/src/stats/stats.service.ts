import { Injectable, Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Op, WhereOptions } from 'sequelize';
import { StatsRepository } from './stats.repository';
import { CategoryReportQueryDto } from './dto/category-report-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';
import { getLastNMonths } from './utils/month-range.util';
import { getMonthRange } from '@budgets/utils/month.util';
import { validateDateRange } from '@common/validate-date-range.util';
import { TransactionType } from '@common/enums';
import { Transaction } from '@transactions/models/transaction.model';
import { CACHE_TTL_MS, CACHE_MANAGER } from '@common/cache.constants';

@Injectable()
export class StatsService {
    constructor(
        private readonly statsRepository: StatsRepository,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {}

    async getCategoryReport(userId: number, query: CategoryReportQueryDto) {
        validateDateRange(query.dateFrom, query.dateTo);

        const cacheKey = `stats:by-category:${userId}:${JSON.stringify(query)}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const where: WhereOptions<Transaction> = {};
        if (query.dateFrom || query.dateTo) {
            const dateFilter: any = {};
            if (query.dateFrom) dateFilter[Op.gte] = new Date(query.dateFrom);
            if (query.dateTo) {
                const end = new Date(query.dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter[Op.lte] = end;
            }
            where.date = dateFilter;
        }
        if (query.type && query.type !== 'all') {
            where.type = query.type as TransactionType;
        }

        const rows = await this.statsRepository.getCategoryTotals(userId, where);
        const result = rows.map((r: any) => ({
            categoryId: r.categoryId,
            categoryName: r.category.name,
            type: r.type,
            total: Number(r.total),
        }));

        await this.cache.set(cacheKey, result, CACHE_TTL_MS);
        return result;
    }

    async getMonthlyDynamics(userId: number, monthsCount = 6) {
        const cacheKey = `stats:monthly:${userId}:${monthsCount}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const months = getLastNMonths(monthsCount);
        const rangeStart = getMonthRange(`${months[0]}-01`).start;
        const rangeEnd = getMonthRange(`${months[months.length - 1]}-01`).end;

        const rows = await this.statsRepository.getMonthlyTotals(userId, rangeStart, rangeEnd);

        const dataByMonth = new Map<string, { income: number; expense: number }>();
        for (const row of rows as any[]) {
            const entry = dataByMonth.get(row.month) ?? { income: 0, expense: 0 };
            entry[row.type as TransactionType] = Number(row.total);
            dataByMonth.set(row.month, entry);
        }

        const result = months.map((month) => {
            const entry = dataByMonth.get(month) ?? { income: 0, expense: 0 };
            return { month, income: entry.income, expense: entry.expense };
        });

        await this.cache.set(cacheKey, result, CACHE_TTL_MS);
        return result;
    }

    async getTopCategories(userId: number, query: PeriodQueryDto, limit = 5) {
        validateDateRange(query.dateFrom, query.dateTo);

        const cacheKey = `stats:top-categories:${userId}:${JSON.stringify(query)}:${limit}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const where: WhereOptions<Transaction> = { type: TransactionType.expense };
        if (query.dateFrom || query.dateTo) {
            const dateFilter: any = {};
            if (query.dateFrom) dateFilter[Op.gte] = new Date(query.dateFrom);
            if (query.dateTo) {
                const end = new Date(query.dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter[Op.lte] = end;
            }
            where.date = dateFilter;
        }

        const rows = await this.statsRepository.getTopCategories(userId, where, limit);
        const result = rows.map((r: any) => ({
            categoryId: r.categoryId,
            categoryName: r.category.name,
            total: Number(r.total),
        }));

        await this.cache.set(cacheKey, result, CACHE_TTL_MS);
        return result;
    }
}