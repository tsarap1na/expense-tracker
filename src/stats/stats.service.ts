import { Injectable } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { StatsRepository } from './stats.repository';
import { CategoryReportQueryDto } from './dto/category-report-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';
import { getLastNMonths } from './utils/month-range.util';
import { getMonthRange } from '@budgets/utils/month.util';
import { validateDateRange } from '@common/validate-date-range.util';
import { TransactionType } from '@common/enums';
import { Transaction } from '@transactions/models/transaction.model';

@Injectable()
export class StatsService {
    constructor(private readonly statsRepository: StatsRepository) {}

    async getCategoryReport(query: CategoryReportQueryDto) {
        validateDateRange(query.dateFrom, query.dateTo);

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

        const rows = await this.statsRepository.getCategoryTotals(where);

        return rows.map((r: any) => ({
            categoryId: r.categoryId,
            categoryName: r.category.name,
            type: r.type,
            total: Number(r.total),
        }));
    }

    async getMonthlyDynamics(monthsCount = 6) {
        const months = getLastNMonths(monthsCount);

        const rangeStart = getMonthRange(`${months[0]}-01`).start;
        const rangeEnd = getMonthRange(`${months[months.length - 1]}-01`).end;

        const rows = await this.statsRepository.getMonthlyTotals(rangeStart, rangeEnd);

        const dataByMonth = new Map<string, { income: number; expense: number }>();
        for (const row of rows as any[]) {
            const entry = dataByMonth.get(row.month) ?? { income: 0, expense: 0 };
            entry[row.type as TransactionType] = Number(row.total);
            dataByMonth.set(row.month, entry);
        }

        return months.map((month) => {
            const entry = dataByMonth.get(month) ?? { income: 0, expense: 0 };
            return { month, income: entry.income, expense: entry.expense };
        });
    }

    async getTopCategories(query: PeriodQueryDto, limit = 5) {
        validateDateRange(query.dateFrom, query.dateTo);

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

        const rows = await this.statsRepository.getTopCategories(where, limit);

        return rows.map((r: any) => ({
            categoryId: r.categoryId,
            categoryName: r.category.name,
            total: Number(r.total),
        }));
    }
}