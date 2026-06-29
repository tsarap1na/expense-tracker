import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, Transaction as SequelizeTransaction } from 'sequelize';
import { Recurring } from './models/recurring.model';
import { Category } from '@categories/models/category.model';
import { QueryRecurringDto } from './dto/query-recurring.dto';

@Injectable()
export class RecurringRepository {
    constructor(
        @InjectModel(Recurring) private readonly recurringModel: typeof Recurring,
    ) {}

    async create(data: Partial<Recurring>): Promise<Recurring> {
        return this.recurringModel.create(data);
    }

    async findAll(query: QueryRecurringDto) {
        const { page = 1, limit = 20, isActive } = query;
        const offset = (page - 1) * limit;

        const where: WhereOptions<Recurring> = {};
        if (isActive !== undefined) where.isActive = isActive;

        const { rows: data, count: total } = await this.recurringModel.findAndCountAll({
            where,
            include: [{ model: Category, attributes: ['id', 'name', 'color'] }],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        return { data, total, page, limit };
    }

    async findById(id: number): Promise<Recurring | null> {
        return this.recurringModel.findByPk(id, {
            include: [{ model: Category, attributes: ['id', 'name', 'color'] }],
        });
    }

    async findActiveDue(now: Date): Promise<Recurring[]> {
        return this.recurringModel.findAll({
            where: {
                isActive: true,
                nextRunAt: { [Op.lte]: now },
            },
        });
    }

    async update(recurring: Recurring, data: Partial<Recurring>, transaction?: SequelizeTransaction): Promise<Recurring> {
        return recurring.update(data, { transaction });
    }

    async delete(recurring: Recurring): Promise<void> {
        await recurring.destroy();
    }
}