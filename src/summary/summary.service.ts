import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col } from 'sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { TransactionType } from '@common/enums';
import { QuerySummaryDto } from './query-summary.dto';
import { validateDateRange } from '@common/validate-date-range.util';

type SummaryRow = {
    type: TransactionType;
    total: string;
}

@Injectable()
export class SummaryService {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
    ){}

    async getSummary(userId: number, dto: QuerySummaryDto) {
        validateDateRange(dto.dateFrom, dto.dateTo);

        const now = new Date();
        const dateFrom = dto.dateFrom
        ? new Date(dto.dateFrom)
        : new Date(now.getFullYear(), now.getMonth(), 1);

        const dateTo = dto.dateTo
        ? new Date(dto.dateTo)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const rows = await this.transactionModel.findAll({
            attributes: ['type', [fn('SUM', col('amount')), 'total']],
            where: { userId, date: { [Op.between]: [dateFrom, dateTo] } },
            group: ['type'],
            raw: true,
        }) as unknown as SummaryRow[];

        const income = rows.find(r => r.type === TransactionType.income)?.total ?? 0;
        const expense = rows.find(r => r.type === TransactionType.expense)?.total ?? 0;

        return {
            dateFrom,
            dateTo,
            income: Number(income),
            expense: Number(expense),
            balance: Number(income) - Number(expense),
        };
    }
}