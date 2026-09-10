import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col, Op } from 'sequelize';
import { Budget } from './models/budget.model';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';
import { TransactionType } from '@common/enums';

@Injectable()
export class BudgetRepository {
    constructor(
        @InjectModel(Budget) private readonly budgetModel: typeof Budget,
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
    ) {}

    async create(data: Partial<Budget>): Promise<Budget> {
        return this.budgetModel.create(data);
    }

    async findAll(month?: string): Promise<Budget[]> {
        const where = month ? { month } : {};
        return this.budgetModel.findAll({
            where,
            include: [{ model: Category, attributes: ['id', 'name'] }],
        });
    }

    async findById(id: number): Promise<Budget | null> {
        return this.budgetModel.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name'] }],
        });
    }

    async findByCategoryAndMonth(categoryId: number, month: string): Promise<Budget | null> {
        return this.budgetModel.findOne({ where: { categoryId, month } });
    }

    async update(budget: Budget, data: Partial<Budget>): Promise<Budget> {
        return budget.update(data);
    }

    async delete(budget: Budget): Promise<void> {
        await budget.destroy();
    }

    async getSpentAmount(categoryId: number, start: Date, end: Date): Promise<number> {
        const result = await this.transactionModel.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
            where: {
                categoryId,
                type: TransactionType.expense,
                date: { [Op.between]: [start, end] },
            },
            raw: true,
        });
        return Number((result as any).total);
    }

    async getSpentAmountsByCategories(categoryIds: number[], start: Date, end: Date): Promise<Map<number, number>> {
        const rows = await this.transactionModel.findAll({
            attributes: ['categoryId', [fn('SUM', col('amount')), 'total']],
            where: {
                categoryId: { [Op.in]: categoryIds },
                type: TransactionType.expense,
                date: { [Op.between]: [start, end] },
            },
            group: ['categoryId'],
            raw: true,
        });

        const map = new Map<number, number>();
        for (const row of rows as any[]) {
            map.set(row.categoryId, Number(row.total));
        }
        return map;
    }
}