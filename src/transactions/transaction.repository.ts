import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Transaction } from '../transactions/models/transaction.model';
import { Category } from '../categories/models/category.model';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionRepository {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
    ) {}

    async create(data: Partial<Transaction>): Promise<Transaction> {
        return this.transactionModel.create(data);
    }

    async findAll(query: QueryTransactionDto) {
        const { page = 1, limit = 20, dateFrom, dateTo, type, categoryId, search, sortBy = 'date', sortOrder = 'desc' } = query;
        const offset = (page - 1) * limit;

        const where: WhereOptions<Transaction> = {};
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

        const { rows: data, count: total } = await this.transactionModel.findAndCountAll({
            where,
            include: [{ model: Category, attributes: ['id', 'name', 'color'] }],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit,
            offset,
        });

        return { data, total, page, limit };
    }

    async findById(id: number): Promise<Transaction | null> {
        return this.transactionModel.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name', 'color'] }],
        });
    }

    async update(transaction: Transaction, data: Partial<Transaction>): Promise<Transaction> {
        return transaction.update(data);
    }

    async delete(transaction: Transaction): Promise<void> {
        await transaction.destroy();
    }
}