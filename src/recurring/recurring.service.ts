import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RecurringRepository } from './recurring.repository';
import { Category } from '@categories/models/category.model';
import { Transaction } from '@transactions/models/transaction.model';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { QueryRecurringDto } from './dto/query-recurring.dto';
import { Recurring, Frequency } from './models/recurring.model';

@Injectable()
export class RecurringService {
    constructor(
        private readonly recurringRepository: RecurringRepository,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
    ) {}

    async create(dto: CreateRecurringDto): Promise<Recurring> {
        const category = await this.categoryModel.findByPk(dto.categoryId);
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        return this.recurringRepository.create({
            ...dto,
            nextRunAt: new Date(dto.nextRunAt),
        });
    }

    async findAll(query: QueryRecurringDto) {
        return this.recurringRepository.findAll(query);
    }

    async findOne(id: number): Promise<Recurring> {
        const recurring = await this.recurringRepository.findById(id);
        if (!recurring) throw new NotFoundException(`Recurring #${id} not found`);
        return recurring;
    }

    async update(id: number, dto: UpdateRecurringDto): Promise<Recurring> {
    const recurring = await this.findOne(id);
    if (dto.categoryId) {
        const category = await this.categoryModel.findByPk(dto.categoryId);
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
    }

    const data: Partial<Recurring> = {
        ...dto,
        ...(dto.nextRunAt && { nextRunAt: new Date(dto.nextRunAt) }),
    } as Partial<Recurring>;

    return this.recurringRepository.update(recurring, data);
    }

    async remove(id: number): Promise<void> {
        const recurring = await this.findOne(id);
        await this.recurringRepository.delete(recurring);
    }

    async generate(): Promise<{ count: number; transactions: Transaction[] }> {
        const now = new Date();
        const templates = await this.recurringRepository.findActiveDue(now);
        const created: Transaction[] = [];

        for (const template of templates) {
        const transaction = await this.transactionModel.create({
            categoryId: template.categoryId,
            amount: template.amount,
            type: template.type,
            description: template.description,
            date: template.nextRunAt,
            recurringId: template.id,
        });

        created.push(transaction);
        await this.recurringRepository.update(template, {
            nextRunAt: this.calcNextRunAt(template.nextRunAt, template.frequency),
        });
        }

        return { count: created.length, transactions: created };
    }

    private calcNextRunAt(current: Date, frequency: Frequency): Date {
        const next = new Date(current);
        if (frequency === Frequency.day) next.setDate(next.getDate() + 1);
        if (frequency === Frequency.week) next.setDate(next.getDate() + 7);
        if (frequency === Frequency.month) next.setMonth(next.getMonth() + 1);
        return next;
    }
}