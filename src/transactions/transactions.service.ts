import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Transaction } from './models/transaction.model';
import { Category } from '../categories/models/category.model';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
    ) {}

    async create(dto: CreateTransactionDto): Promise<Transaction> {
        const category = await this.categoryModel.findByPk(dto.categoryId);
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        return this.transactionModel.create({ ...dto });
    }

    async findAll(query: QueryTransactionDto) {
        const { page = 1, limit = 20, dateFrom, dateTo, type, categoryId, search, sortBy = 'date', sortOrder = 'desc' } = query;
        const offset = (page - 1) * limit;

        const where: any = {};
        if (type) where.type = type;
        if (categoryId) where.categoryId = categoryId;
        if (search) where.description = { [Op.iLike]: `%${search}%` };
        if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date[Op.gte] = new Date(dateFrom);
        if (dateTo) where.date[Op.lte] = new Date(dateTo);
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

    async findOne(id: number): Promise<Transaction> {
        const transaction = await this.transactionModel.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name', 'color'] }],
        });
        if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
        return transaction;
    }

    async update(id: number, dto: UpdateTransactionDto): Promise<Transaction> {
        const transaction = await this.findOne(id);
        if (dto.categoryId) {
        const category = await this.categoryModel.findByPk(dto.categoryId);
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        }
        return transaction.update(dto);
    }

    async remove(id: number): Promise<void> {
        const transaction = await this.transactionModel.findByPk(id);
        if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
        await transaction.destroy();
    }
}