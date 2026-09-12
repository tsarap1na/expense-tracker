import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal, WhereOptions } from 'sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';

@Injectable()
export class StatsRepository {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
    ) {}

    async getCategoryTotals(userId: number, where: WhereOptions<Transaction>): Promise<any[]> {
        return this.transactionModel.findAll({
            attributes: ['categoryId', 'type', [fn('SUM', col('Transaction.amount')), 'total']],
            where: { ...where, userId },
            include: [{ model: Category, attributes: ['name'] }],
            group: ['categoryId', 'type', 'category.id'],
            raw: true,
            nest: true,
        });
    }

    async getMonthlyTotals(userId: number, start: Date, end: Date): Promise<any[]> {
        return this.transactionModel.findAll({
            attributes: [
                [fn('to_char', col('date'), 'YYYY-MM'), 'month'],
                'type',
                [fn('SUM', col('amount')), 'total'],
            ],
            where: { userId, date: { [Op.between]: [start, end] } },
            group: [fn('to_char', col('date'), 'YYYY-MM'), 'type'],
            raw: true,
        });
    }

    async getTopCategories(userId: number, where: WhereOptions<Transaction>, limit: number): Promise<any[]> {
        return this.transactionModel.findAll({
            attributes: ['categoryId', [fn('SUM', col('amount')), 'total']],
            where: { ...where, userId },
            include: [{ model: Category, attributes: ['name'] }],
            group: ['categoryId', 'category.id'],
            order: [[literal('total'), 'DESC']],
            limit,
            raw: true,
            nest: true,
            subQuery: false,
        });
    }
}