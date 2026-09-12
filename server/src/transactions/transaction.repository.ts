import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, Transaction as SequelizeTransaction } from 'sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';
import { TransactionTag } from '@tags/models/transaction-tag.model';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionRepository {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
        @InjectModel(TransactionTag) private readonly transactionTagModel: typeof TransactionTag,
    ) {}

    async create(userId: number, data: Partial<Transaction>, transaction?: SequelizeTransaction): Promise<Transaction> {
        return this.transactionModel.create({ ...data, userId }, { transaction });
    }

    async findAll(userId: number, query: QueryTransactionDto) {
        const { page = 1, limit = 20, dateFrom, dateTo, type, categoryId, search, tagIds, sortBy = 'date', sortOrder = 'desc' } = query;
        const offset = (page - 1) * limit;

        const where: WhereOptions<Transaction> = { userId };
        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;
        if (search) where.description = { [Op.iLike]: `%${search}%` };
        if (dateFrom || dateTo) {
            const dateFilter: any = {};
            if (dateFrom) dateFilter[Op.gte] = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter[Op.lte] = end;
            }
            where.date = dateFilter;
        }

        if (tagIds && tagIds.length > 0) {
            const ids = await this.findTransactionIdsByTags(userId, tagIds);
            if (ids.length === 0) return { data: [], total: 0, page, limit };
            where.id = { [Op.in]: ids };
        }

        const { rows: data, count: total } = await this.transactionModel.findAndCountAll({
            where,
            include: [{ model: Category, attributes: ['id', 'name', 'color'] }, { association: 'tags' }],
            distinct: true,
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit,
            offset,
        });

        return { data, total, page, limit };
    }

    async findById(userId: number, id: number): Promise<Transaction | null> {
        return this.transactionModel.findOne({
            where: { id, userId },
            include: [{ model: Category, attributes: ['id', 'name', 'color'] }, { association: 'tags' }],
        });
    }

    async update(transaction: Transaction, data: Partial<Transaction>): Promise<Transaction> {
        return transaction.update(data);
    }

    async delete(transaction: Transaction): Promise<void> {
        await transaction.destroy();
    }

    async setTags(transaction: Transaction, tagIds: number[]): Promise<void> {
        await (transaction as any).$set('tags', tagIds);
    }

    private async findTransactionIdsByTags(userId: number, tagIds: number[]): Promise<number[]> {
        const rows = await this.transactionTagModel.findAll({
            where: { tagId: { [Op.in]: tagIds } },
            include: [{
                model: Transaction,
                where: { userId },
                attributes: [],
            }],
            attributes: ['transactionId'],
            group: ['transactionId'],
            raw: true,
        });
        return rows.map((r: any) => r.transactionId);
    }
}