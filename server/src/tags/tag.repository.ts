import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Tag } from './models/tag.model';
import { Transaction } from '@transactions/models/transaction.model';

@Injectable()
export class TagRepository {
    constructor(
        @InjectModel(Tag) private readonly tagModel: typeof Tag,
    ) {}

    async create(userId: number, data: Partial<Tag>): Promise<Tag> {
        return this.tagModel.create({ ...data, userId });
    }

    async findAll(userId: number): Promise<Tag[]> {
        return this.tagModel.findAll({ where: { userId }, order: [['name', 'ASC']] });
    }

    async findById(userId: number, id: number): Promise<Tag | null> {
        return this.tagModel.findOne({ where: { id, userId } });
    }

    async findByName(userId: number, name: string): Promise<Tag | null> {
        return this.tagModel.findOne({ where: { name, userId } });
    }

    async findByIds(userId: number, ids: number[]): Promise<Tag[]> {
        return this.tagModel.findAll({
            where: { id: { [Op.in]: ids }, userId },
            attributes: ['id'],
        });
    }

    async update(tag: Tag, data: Partial<Tag>): Promise<Tag> {
        return tag.update(data);
    }

    async delete(tag: Tag): Promise<void> {
        await tag.destroy();
    }

    async findAllWithCount(userId: number): Promise<Array<{ id: number; name: string; transactionsCount: string }>> {
        return this.tagModel.findAll({
            where: { userId },
            attributes: [
                'id',
                'name',
                [fn('COUNT', col('transactions.id')), 'transactionsCount'],
            ],
            include: [{ model: Transaction, attributes: [], through: { attributes: [] } }],
            group: ['Tag.id'],
            order: [[literal('"transactionsCount"'), 'DESC']],
            subQuery: false,
            raw: true,
        }) as any;
    }
}