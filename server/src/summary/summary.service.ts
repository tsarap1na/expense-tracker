import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Cache } from 'cache-manager';
import { Op, fn, col } from 'sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { TransactionType } from '@common/enums';
import { QuerySummaryDto } from './query-summary.dto';
import { validateDateRange } from '@common/validate-date-range.util';
import { CACHE_MANAGER, CACHE_TTL_MS } from '@common/cache.constants';

type SummaryRow = {
    type: TransactionType;
    total: string;
}

@Injectable()
export class SummaryService {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {}

    async getSummary(userId: number, dto: QuerySummaryDto) {
        validateDateRange(dto.dateFrom, dto.dateTo);

        const now = new Date();
        const dateFrom = dto.dateFrom
            ? new Date(dto.dateFrom)
            : new Date(now.getFullYear(), now.getMonth(), 1);

        const dateTo = dto.dateTo
            ? new Date(dto.dateTo)
            : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const cacheKey = `summary:${userId}:${dateFrom.toISOString()}:${dateTo.toISOString()}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const rows = await this.transactionModel.findAll({
            attributes: ['type', [fn('SUM', col('amount')), 'total']],
            where: { userId, date: { [Op.between]: [dateFrom, dateTo] } },
            group: ['type'],
            raw: true,
        }) as unknown as SummaryRow[];

        const income = rows.find((r) => r.type === TransactionType.income)?.total ?? 0;
        const expense = rows.find((r) => r.type === TransactionType.expense)?.total ?? 0;

        const result = {
            dateFrom,
            dateTo,
            income: Number(income),
            expense: Number(expense),
            balance: Number(income) - Number(expense),
        };

        await this.cache.set(cacheKey, result, CACHE_TTL_MS);
        return result;
    }
}