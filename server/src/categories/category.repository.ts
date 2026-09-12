import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Category } from './models/category.model';
import { Transaction } from '@transactions/models/transaction.model';
import { QueryCategoryDto } from './dto/query-category.dto';

@Injectable()
export class CategoryRepository {
    constructor(
        @InjectModel(Category) private readonly categoryModel: typeof Category,
    ) {}

    async create(userId: number, data: Partial<Category>): Promise<Category> {
        return this.categoryModel.create({ ...data, userId });
    }

    async findAll(userId: number, query: QueryCategoryDto) {
        const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = query;
        const offset = (page - 1) * limit;

        const where: WhereOptions<Category> = { userId };
        if (search) where.name = { [Op.iLike]: `%${search}%` };

        const { rows: data, count: total } = await this.categoryModel.findAndCountAll({
            where,
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit,
            offset,
        });
        return { data, total, page, limit };
    }

    async findById(userId: number, id: number): Promise<Category | null> {
        return this.categoryModel.findOne({ where: { id, userId } });
    }

    async findByName(userId: number, name: string): Promise<Category | null> {
        return this.categoryModel.findOne({ where: { name, userId } });
    }

    async countTransactions(userId: number, id: number): Promise<number> {
        return this.categoryModel.count({
            where: { id, userId },
            include: [{ model: Transaction, required: true }],
        });
    }

    async update(category: Category, data: Partial<Category>): Promise<Category> {
        return category.update(data);
    }

    async delete(category: Category): Promise<void> {
        await category.destroy();
    }
}