import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Transaction, TransactionType } from '../transactions/models/transaction.model';
import { QuerySummaryDto } from './query-summary.dto';

@Injectable()
export class SummaryService {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
    ){}

    async getSummary(dto: QuerySummaryDto) {
        const now = new Date();
        const dateFrom = dto.dateFrom
        ? new Date(dto.dateFrom)
        : new Date(now.getFullYear(), now.getMonth(), 1);

        const dateTo = dto.dateTo
        ? new Date(dto.dateTo)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const rows = await this.transactionModel.findAll({
            attributes: ['type', [fn('SUM', col('amount')), 'total']],
            where: { date: { [Op.between]: [dateFrom, dateTo] } },
            group: ['type'],
            raw: true,
        }) as any[];

    const income = rows.find(r => r.type === TransactionType.income)?.total ?? 0;
    const expense = rows.find(r => r.type === TransactionType.expense)?.total ?? 0;

    return {
        dateFrom,
        dateTo,
        income: Number(income),
        expense: Number(expense),
        balance: Number(income) - Number(expense),
    };
} }