import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, Transaction as SequelizeTransaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';

@Injectable()
export class ImportExportRepository {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        private readonly sequelize: Sequelize,
    ) {}

    async findForExport(where: WhereOptions<Transaction>): Promise<Transaction[]> {
        return this.transactionModel.findAll({
            where,
            include: [{ model: Category, attributes: ['name'] }],
            order: [['date', 'ASC']],
        });
    }

    async findCategoriesByNames(names: string[]): Promise<Category[]> {
        return this.categoryModel.findAll({ where: { name: { [Op.in]: names } } });
    }

    async findExistingByCandidates(
        candidates: { date: string; amount: number; description: string }[],
    ): Promise<any[]> {
        return this.transactionModel.findAll({
            where: { [Op.or]: candidates },
            raw: true,
        });
    }

    async startTransaction(): Promise<SequelizeTransaction> {
        return this.sequelize.transaction();
    }

    async bulkCreate(rows: Partial<Transaction>[], dbTransaction: SequelizeTransaction): Promise<Transaction[]> {
        return this.transactionModel.bulkCreate(rows, { transaction: dbTransaction });
    }
}