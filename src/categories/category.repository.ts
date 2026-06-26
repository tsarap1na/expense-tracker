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

    async create(data: Partial<Category>): Promise<Category> {
        return this.categoryModel.create(data);
    }

    async findAll(query: QueryCategoryDto) {
        const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = query;
        const offset = (page - 1) * limit;

        const where: WhereOptions<Category> = search
        ? { name: { [Op.iLike]: `%${search}%` } }
        : {};

        const { rows: data, count: total } = await this.categoryModel.findAndCountAll({
            where,
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit,
            offset,
        });
        return { data, total, page, limit };
    }

    async findById(id: number): Promise<Category | null> {
        return this.categoryModel.findByPk(id);
    }

    async findByName(name: string): Promise<Category | null> {
        return this.categoryModel.findOne({ where: { name } });
    }

    async countTransactions(id: number): Promise<number> {
        return this.categoryModel.count({
            where: { id },
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